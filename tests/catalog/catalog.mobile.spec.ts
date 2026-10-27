import { test } from '../../fixtures';

test.describe('catalog (mobile)', () => {
  test('TC-CAT-005 the first page lists 9 products on a phone viewport @smoke', async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectProductCount(9);
  });

  test('TC-CAT-006 searching for a product name works on a phone viewport @regression', async ({ productsPage, customerApi }) => {
    const name = await customerApi.firstProductName();

    await productsPage.goto();
    await productsPage.search(name);
    await productsPage.expectSearchCaption(name);
    await productsPage.expectProductListed(name);
  });
});
