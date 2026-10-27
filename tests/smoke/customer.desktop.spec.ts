import { test } from '../../fixtures';

test.describe('customer smoke', () => {
  test('catalog is visible to a signed in customer', async ({ customerProductsPage }) => {
    await customerProductsPage.goto();
    await customerProductsPage.expectProductCount(9);
    await customerProductsPage.expectSignInLinkVisible(false);
  });
});
