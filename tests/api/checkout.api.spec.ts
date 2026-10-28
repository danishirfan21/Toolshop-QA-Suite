import { test, expect } from '../../fixtures';
import type { APIRequestContext } from '@playwright/test';
import type { ApiClient } from '../../clients/api-client';

const address = { country: 'NL', postcode: '1122AB' };

async function lookup(request: APIRequestContext) {
  const res = await request.get(`/postcode-lookup?country=${address.country}&postcode=${address.postcode}`);
  expect(res.status()).toBe(200);
  return (await res.json()) as { city: string; state: string };
}

async function filledCart(api: ApiClient): Promise<string> {
  const cartId = await api.createCart();
  await api.addToCart(cartId, await api.firstProductId(), 1);
  return cartId;
}

function invoiceBody(cartId: string, place: { city: string; state: string }, payment: { method: string; details: object } = { method: 'cash-on-delivery', details: {} }) {
  return {
    billing_street: 'Test street 98',
    billing_city: place.city,
    billing_state: place.state,
    billing_country: address.country,
    billing_postal_code: address.postcode,
    payment_method: payment.method,
    payment_details: payment.details,
    cart_id: cartId,
  };
}

const guest = { guest_first_name: 'Jane', guest_last_name: 'Doe', guest_email: 'jane.doe@example.com' };

test.describe('checkout', () => {
  test('TC-CHK-001 guest invoice with the looked-up city is created (201) @smoke', async ({ customerApi, request }) => {
    const place = await lookup(request);
    const cartId = await filledCart(customerApi);

    const res = await request.post('/invoices/guest', { data: { ...invoiceBody(cartId, place), ...guest } });
    expect(res.status()).toBe(201);
    const invoice = await res.json();
    expect(invoice.invoice_number).toMatch(/^INV-\d+$/);
    expect(invoice.billing_city).toBe(place.city);
    expect(Number(invoice.total)).toBeGreaterThan(0);
  });

  test('TC-CHK-002 customer invoice with the looked-up city is created (201) @smoke', async ({ customerApi, request }) => {
    const place = await lookup(request);
    const cartId = await filledCart(customerApi);

    const res = await customerApi.call('post', '/invoices', invoiceBody(cartId, place));
    expect(res.status()).toBe(201);
    expect((await res.json()).invoice_number).toMatch(/^INV-\d+$/);
  });

  test('TC-CHK-003 a city that does not match the postcode lookup is rejected with 422 @regression', async ({ customerApi, request }) => {
    const place = await lookup(request);
    const cartId = await filledCart(customerApi);

    const res = await customerApi.call('post', '/invoices', invoiceBody(cartId, { ...place, city: 'Nowhere' }));
    expect(res.status()).toBe(422);
    // The self-hosted 422 body has no `errors` key, so compare the raw body; a failure prints it.
    expect(JSON.stringify(await res.json())).toContain('billing_country');
  });

  test('TC-CHK-004 an unknown method, a gift card without details and a missing token are rejected @regression', async ({ customerApi, request }) => {
    const place = await lookup(request);
    const cartId = await filledCart(customerApi);

    const bogus = await customerApi.call('post', '/invoices', invoiceBody(cartId, place, { method: 'bogus-method', details: {} }));
    expect(bogus.status()).toBe(422);
    expect(JSON.stringify(await bogus.json())).toContain('payment_method');

    const gift = await customerApi.call('post', '/invoices', invoiceBody(cartId, place, { method: 'gift-card', details: {} }));
    expect(gift.status()).toBe(422);
    const giftBody = JSON.stringify(await gift.json());
    expect(giftBody).toContain('payment_details.gift_card_number');
    expect(giftBody).toContain('payment_details.validation_code');

    const noToken = await request.post('/invoices', { data: {} });
    expect(noToken.status()).toBe(401);
  });

  test('TC-CHK-007 BUG-001 empty payment details are rejected with 422, not 500 @regression', async ({ customerApi, request }) => {
    test.fail(true, 'BUG-001: credit-card, bank-transfer and buy-now-pay-later answer 500 for empty payment details; 422 is the tester expectation.');
    const place = await lookup(request);
    for (const method of ['credit-card', 'bank-transfer', 'buy-now-pay-later']) {
      const cartId = await filledCart(customerApi);
      const res = await customerApi.call('post', '/invoices', invoiceBody(cartId, place, { method, details: {} }));
      expect(res.status(), method).toBe(422);
    }
  });

  test('TC-CHK-010 BUG-002 an ordered cart no longer holds its items @regression', async ({ customerApi, request }) => {
    test.fail(true, 'BUG-002: GET /carts/{id} still returns the items after POST /invoices (201). Upstream user story v5 documents that the cart is cleared after a successful order (written for the UI), and the API cart persists.');
    const place = await lookup(request);
    const cartId = await filledCart(customerApi);
    expect((await customerApi.call('post', '/invoices', invoiceBody(cartId, place))).status()).toBe(201);

    const after = await customerApi.call('get', `/carts/${cartId}`);
    // A removed cart answers 404 with no cart_items; either outcome means no items are left.
    const body = (await after.json().catch(() => ({}))) as { cart_items?: unknown[] };
    const items = (body.cart_items ?? []).length;
    expect(items).toBe(0);
  });

  test('TC-CHK-008 gift card needs a 16 character number and a 4 character code @regression', async ({ customerApi, request }) => {
    const place = await lookup(request);
    const pay = async (details: object) =>
      customerApi.call('post', '/invoices', invoiceBody(await filledCart(customerApi), place, { method: 'gift-card', details }));

    const valid = await pay({ gift_card_number: '1234567890123456', validation_code: '1A2B' });
    expect(valid.status()).toBe(201);

    const shortNumber = await pay({ gift_card_number: '123456789012345', validation_code: '1A2B' });
    expect(shortNumber.status()).toBe(422);
    expect(JSON.stringify(await shortNumber.json())).toContain('payment_details.gift_card_number');

    const shortCode = await pay({ gift_card_number: '1234567890123456', validation_code: '1A2' });
    expect(shortCode.status()).toBe(422);
    expect(JSON.stringify(await shortCode.json())).toContain('payment_details.validation_code');
  });
});
