import { test } from '../../fixtures';

test.describe('catalog', () => {
  test('TC-CAT-003 sorting by price descending lists prices from high to low @regression', async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectProductCount(9);
    await productsPage.sortBy('price,desc');
    await productsPage.expectPricesDescending();
  });

  test('TC-CAT-004 searching for a product name lists that product @smoke', async ({ productsPage, customerApi }) => {
    const name = await customerApi.firstProductName();

    await productsPage.goto();
    await productsPage.search(name);
    await productsPage.expectSearchCaption(name);
    await productsPage.expectProductListed(name);
  });
});
