import { test, expect } from '../../fixtures';
import type { ApiClient, NewProduct } from '../../clients/api-client';
import { env } from '../../utils/env';

test.describe('auth', () => {
  test('TC-AUTH-001 valid login returns a bearer token that lives 300 seconds @smoke', async ({ request }) => {
    const res = await request.post('/users/login', { data: { email: env.customer.email, password: env.customer.password } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token_type).toBe('bearer');
    expect(body.expires_in).toBe(300);
    expect(typeof body.access_token).toBe('string');
  });

  test('TC-AUTH-002 unknown email and empty body are rejected with 401 @regression', async ({ request }) => {
    const unknownEmail = await request.post('/users/login', { data: { email: 'nobody@example.com', password: 'welcome01' } });
    expect(unknownEmail.status()).toBe(401);
    expect(await unknownEmail.json()).toEqual({ error: 'Unauthorized' });

    const empty = await request.post('/users/login', { data: {} });
    expect(empty.status()).toBe(401);
    expect(await empty.json()).toEqual({ error: 'Invalid login request' });
  });

  // Uses a freshly registered throwaway user so the shared seeded customer is never locked.
  test('TC-AUTH-003 4th wrong password locks the account (423) and an admin PATCH unlocks it @regression', async ({ request, adminApi }) => {
    const email = `lockout-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const password = 'Qa-Suite#7731xZq!';
    const headers = { Accept: 'application/json' };

    const registered = await request.post('/users/register', {
      headers,
      data: {
        first_name: 'Lockout',
        last_name: 'Probe',
        address: { street: 'Test street', city: 'Amsterdam', state: 'NH', country: 'NL', postal_code: '1122AB' },
        phone: '0612345678',
        dob: '1990-01-01',
        email,
        password,
      },
    });
    expect(registered.status()).toBe(201);
    const userId = (await registered.json()).id as string;

    const login = async (pw: string) => (await request.post('/users/login', { headers, data: { email, password: pw } })).status();

    expect(await login(password)).toBe(200);
    expect([await login('wrong-1'), await login('wrong-2'), await login('wrong-3')]).toEqual([401, 401, 401]);
    expect(await login('wrong-4')).toBe(423);
    // Locked even with the right password (no expiry was observed within 7200 s, docs/app-recon.md Authentication).
    expect(await login(password)).toBe(423);

    const unlock = await adminApi.call('patch', `/users/${userId}`, { failed_login_attempts: 0 });
    expect(unlock.status()).toBe(200);
    expect(await login(password)).toBe(200);
  });
});

test.describe('role access', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ adminApi }) => {
    for (const id of createdIds.splice(0)) await adminApi.deleteProduct(id);
  });

  async function newProductBody(adminApi: ApiClient): Promise<NewProduct> {
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

  test('TC-AUTH-004 customer cannot delete a product (403), admin can (204) @smoke', async ({ adminApi, customerApi }) => {
    const created = await adminApi.createProduct(await newProductBody(adminApi));
    createdIds.push(created.id);

    expect((await customerApi.call('delete', `/products/${created.id}`)).status()).toBe(403);
    expect((await adminApi.call('get', `/products/${created.id}`)).status()).toBe(200);

    expect((await adminApi.call('delete', `/products/${created.id}`)).status()).toBe(204);
    expect((await adminApi.call('get', `/products/${created.id}`)).status()).toBe(404);
  });
});
