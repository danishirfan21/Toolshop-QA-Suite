import { test, expect } from '../../fixtures';

test.describe('catalog', () => {
  test('TC-CAT-001 product list has the paginated envelope and sorts by price descending @smoke', async ({ request }) => {
    const list = await request.get('/products');
    expect(list.status()).toBe(200);
    const body = await list.json();
    expect(body.per_page).toBe(9);
    expect(body.data.length).toBeLessThanOrEqual(9);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('last_page');

    const sorted = await request.get('/products?sort=price,desc');
    expect(sorted.status()).toBe(200);
    const prices = ((await sorted.json()).data as Array<{ price: number }>).map((p) => Number(p.price));
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('TC-CAT-002 a search with no match and an unknown category return 200 and an empty list @regression', async ({ request }) => {
    const search = await request.get('/products/search?q=zzzznomatch');
    expect(search.status()).toBe(200);
    expect((await search.json()).data).toEqual([]);

    const category = await request.get('/products?by_category=x');
    expect(category.status()).toBe(200);
    expect((await category.json()).data).toEqual([]);
  });
});
