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
});
