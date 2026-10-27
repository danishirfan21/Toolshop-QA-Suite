import { test, expect } from '../../fixtures';

test.describe('auth', () => {
  test('login returns a bearer token that lives 300 seconds', async ({ request }) => {
    const res = await request.post('/users/login', {
      data: { email: 'customer@practicesoftwaretesting.com', password: 'welcome01' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token_type).toBe('bearer');
    expect(body.expires_in).toBe(300);
    expect(typeof body.access_token).toBe('string');
  });

  test('GET /users/me without a token is 401', async ({ request }) => {
    const res = await request.get('/users/me');
    expect(res.status()).toBe(401);
  });

  test('GET /users/me as customer is 200 and as admin is 200', async ({ customerApi, adminApi }) => {
    expect((await customerApi.call('get', '/users/me')).status()).toBe(200);
    expect((await adminApi.call('get', '/users/me')).status()).toBe(200);
  });
});

test.describe('catalog', () => {
  test('product list has the paginated envelope with 9 per page', async ({ request }) => {
    const res = await request.get('/products');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.per_page).toBe(9);
    expect(body.data.length).toBeLessThanOrEqual(9);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('last_page');
  });

  test('sort=price,desc returns prices in descending order', async ({ request }) => {
    const res = await request.get('/products?sort=price,desc');
    expect(res.status()).toBe(200);
    const prices = ((await res.json()).data as Array<{ price: number }>).map((p) => Number(p.price));
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('search with no match returns 200 and an empty list', async ({ request }) => {
    const res = await request.get('/products/search?q=zzzznomatch');
    expect(res.status()).toBe(200);
    expect((await res.json()).data).toEqual([]);
  });

  test('unknown category returns 200 and an empty list', async ({ request }) => {
    const res = await request.get('/products?by_category=x');
    expect(res.status()).toBe(200);
    expect((await res.json()).data).toEqual([]);
  });

  test('categories and brands are non-empty lists', async ({ request }) => {
    const categories = await (await request.get('/categories')).json();
    const brands = await (await request.get('/brands')).json();
    expect(categories.length).toBeGreaterThan(0);
    expect(brands.length).toBeGreaterThan(0);
  });
});
