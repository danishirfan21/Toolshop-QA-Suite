import { test, expect } from '../../fixtures';
import type { NewProduct } from '../../clients/api-client';

test.describe('cart', () => {
  test('add item succeeds, quantity 0 and unknown product are rejected', async ({ customerApi }) => {
    const cartId = await customerApi.createCart();
    const productId = await customerApi.firstProductId();

    const added = await customerApi.call('post', `/carts/${cartId}`, { product_id: productId, quantity: 1 });
    expect(added.status()).toBe(200);

    // Recon recorded 422 for both; on the live demo on 2026-10-27 both returned 404 {"message":"Resource not found"}.
    // Assert only that they are rejected as client errors so the test does not pin either behavior.
    const zero = await customerApi.call('post', `/carts/${cartId}`, { product_id: productId, quantity: 0 });
    expect([404, 422]).toContain(zero.status());

    const unknown = await customerApi.call('post', `/carts/${cartId}`, { product_id: 'does-not-exist', quantity: 1 });
    expect([404, 422]).toContain(unknown.status());
  });

  test('added item appears in the cart', async ({ customerApi }) => {
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
});

test.describe('cart without a token', () => {
  test('a cart can be created, filled, read and deleted with no token', async ({ request, customerApi }) => {
    const created = await request.post('/carts');
    expect(created.status()).toBe(201);
    const cartId = (await created.json()).id as string;

    const productId = await customerApi.firstProductId();
    expect((await request.post(`/carts/${cartId}`, { data: { product_id: productId, quantity: 1 } })).status()).toBe(200);
    expect((await request.get(`/carts/${cartId}`)).status()).toBe(200);
    expect((await request.delete(`/carts/${cartId}`)).status()).toBe(204);
  });

  test('quantity 99 is accepted and 100 is not (JSON Accept header)', async ({ request, customerApi }) => {
    const cartId = await customerApi.createCart();
    const productId = await customerApi.firstProductId();
    const headers = { Accept: 'application/json' };

    const ok = await request.post(`/carts/${cartId}`, { data: { product_id: productId, quantity: 99 }, headers });
    expect(ok.status()).toBe(200);

    // Without the Accept header the self-hosted API answered 302 for 100; with it, 422 (docs/app-recon.md item 7).
    const over = await request.post(`/carts/${cartId}`, { data: { product_id: productId, quantity: 100 }, headers, maxRedirects: 0 });
    expect(over.status()).toBe(422);
    expect(JSON.stringify(await over.json())).toContain('quantity');
  });
});

test.describe('admin product lifecycle', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ adminApi }) => {
    for (const id of createdIds.splice(0)) await adminApi.deleteProduct(id);
  });

  async function newProductBody(adminApi: import('../../clients/api-client').ApiClient): Promise<NewProduct> {
    const [categories, brands, list] = await Promise.all([
      adminApi.call('get', '/categories').then((r) => r.json()),
      adminApi.call('get', '/brands').then((r) => r.json()),
      adminApi.call('get', '/products').then((r) => r.json()),
    ]);
    return {
      name: `qa-suite-${Date.now()}`,
      description: 'Created by Toolshop QA Suite, removed after the test.',
      price: 12.5,
      category_id: categories[0].id,
      brand_id: brands[0].id,
      product_image_id: list.data[0].product_image.id,
      is_location_offer: false,
      is_rental: false,
    };
  }

  test('admin can create, update and delete a product', async ({ adminApi }) => {
    const body = await newProductBody(adminApi);
    const created = await adminApi.createProduct(body);
    createdIds.push(created.id);

    const updated = await adminApi.call('put', `/products/${created.id}`, { ...body, price: 20 });
    expect(updated.status()).toBe(200);
    const fetched = await (await adminApi.call('get', `/products/${created.id}`)).json();
    expect(Number(fetched.price)).toBe(20);

    expect((await adminApi.call('delete', `/products/${created.id}`)).status()).toBe(204);
    expect((await adminApi.call('get', `/products/${created.id}`)).status()).toBe(404);
    expect((await adminApi.call('delete', `/products/${created.id}`)).status()).toBe(404);
  });

  test('customer cannot delete a product (403) and the product survives', async ({ adminApi, customerApi }) => {
    const created = await adminApi.createProduct(await newProductBody(adminApi));
    createdIds.push(created.id);

    const res = await customerApi.call('delete', `/products/${created.id}`);
    expect(res.status()).toBe(403);
    expect((await adminApi.call('get', `/products/${created.id}`)).status()).toBe(200);
  });

  test('creating a product with an empty body is 422', async ({ adminApi }) => {
    const res = await adminApi.call('post', '/products', {});
    expect(res.status()).toBe(422);
  });
});
