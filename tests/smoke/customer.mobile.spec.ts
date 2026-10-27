import { test } from '../../fixtures';

test.describe('customer smoke (mobile)', () => {
  test('catalog is visible to a signed in customer on a phone viewport', async ({ customerProductsPage }) => {
    await customerProductsPage.goto();
    await customerProductsPage.expectProductCount(9);
  });
});
