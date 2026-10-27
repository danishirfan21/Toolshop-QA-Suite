import { test, expect } from '../../fixtures';

test.describe('cart', () => {
  test('TC-CART-001 added item appears in the cart @smoke', async ({ customerApi }) => {
    const cartId = await customerApi.createCart();
    const productId = await customerApi.firstProductId();
    await customerApi.addToCart(cartId, productId, 2);

    const res = await customerApi.call('get', `/carts/${cartId}`);
    expect(res.status()).toBe(200);
    const items = (await res.json()).cart_items as Array<{ product_id: string; quantity: number }>;
    expect(items).toHaveLength(1);
    expect(items[0].product_id).toBe(productId);
    expect(items[0].quantity).toBe(2);
  });

  test('TC-CART-002 quantity 99 is accepted and 100 is not (JSON Accept header) @regression', async ({ request, customerApi }) => {
    const cartId = await customerApi.createCart();
    const productId = await customerApi.firstProductId();
    const headers = { Accept: 'application/json' };

    const ok = await request.post(`/carts/${cartId}`, { data: { product_id: productId, quantity: 99 }, headers });
    expect(ok.status()).toBe(200);

    // Without the Accept header the self-hosted API answered 302 for 100; with it, 422 (docs/app-recon.md Cart).
    const over = await request.post(`/carts/${cartId}`, { data: { product_id: productId, quantity: 100 }, headers, maxRedirects: 0 });
    expect(over.status()).toBe(422);
    expect(JSON.stringify(await over.json())).toContain('quantity');
  });

  test('TC-CART-003 quantity 0 and an unknown product are rejected @regression', async ({ customerApi }) => {
    const cartId = await customerApi.createCart();
    const productId = await customerApi.firstProductId();

    // Recon recorded 422 first and 404 {"message":"Resource not found"} later; the cause is UNKNOWN,
    // so assert only that both are rejected as client errors.
    const zero = await customerApi.call('post', `/carts/${cartId}`, { product_id: productId, quantity: 0 });
    expect([404, 422]).toContain(zero.status());

    const unknown = await customerApi.call('post', `/carts/${cartId}`, { product_id: 'does-not-exist', quantity: 1 });
    expect([404, 422]).toContain(unknown.status());
  });
});
