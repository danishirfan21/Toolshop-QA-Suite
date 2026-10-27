import { test, expect } from '../../fixtures';
import type { APIRequestContext } from '@playwright/test';

const address = { country: 'NL', postcode: '1122AB' };

async function lookup(request: APIRequestContext) {
  const res = await request.get(`/postcode-lookup?country=${address.country}&postcode=${address.postcode}`);
  expect(res.status()).toBe(200);
  return (await res.json()) as { city: string; state: string };
}

function invoiceBody(cartId: string, place: { city: string; state: string }) {
  return {
    billing_street: 'Test street 98',
    billing_city: place.city,
    billing_state: place.state,
    billing_country: address.country,
    billing_postal_code: address.postcode,
    payment_method: 'cash-on-delivery',
    payment_details: {},
    cart_id: cartId,
  };
}

test.describe('checkout', () => {
  test('postcode lookup returns the city the invoice validation expects', async ({ request }) => {
    const place = await lookup(request);
    expect(place.city).toBeTruthy();
    expect(place.state).toBeTruthy();
  });

  test('guest invoice with the looked-up city is created (201)', async ({ customerApi, request }) => {
    const place = await lookup(request);
    const cartId = await customerApi.createCart();
    await customerApi.addToCart(cartId, await customerApi.firstProductId(), 1);

    const res = await request.post('/invoices/guest', {
      data: {
        ...invoiceBody(cartId, place),
        guest_first_name: 'Jane',
        guest_last_name: 'Doe',
        guest_email: 'jane.doe@example.com',
      },
    });
    expect(res.status()).toBe(201);
    const invoice = await res.json();
    expect(invoice.invoice_number).toMatch(/^INV-\d+$/);
    expect(invoice.billing_city).toBe(place.city);
    expect(Number(invoice.total)).toBeGreaterThan(0);
  });

  test('customer invoice with the looked-up city is created (201)', async ({ customerApi, request }) => {
    const place = await lookup(request);
    const cartId = await customerApi.createCart();
    await customerApi.addToCart(cartId, await customerApi.firstProductId(), 1);

    const res = await customerApi.call('post', '/invoices', invoiceBody(cartId, place));
    expect(res.status()).toBe(201);
    expect((await res.json()).invoice_number).toMatch(/^INV-\d+$/);
  });

  test('a city that does not belong to the country is rejected with 422', async ({ customerApi, request }) => {
    const place = await lookup(request);
    const cartId = await customerApi.createCart();
    await customerApi.addToCart(cartId, await customerApi.firstProductId(), 1);

    const res = await customerApi.call('post', '/invoices', invoiceBody(cartId, { ...place, city: 'Nowhere' }));
    expect(res.status()).toBe(422);
    expect(Object.keys((await res.json()).errors)).toContain('billing_country');
  });

  test('creating an invoice without a token is 401', async ({ request }) => {
    const res = await request.post('/invoices', { data: {} });
    expect(res.status()).toBe(401);
  });
});
