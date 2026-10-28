import { test } from '../../fixtures';

test.describe('cart (desktop)', () => {
  test('TC-CART-005 BUG-003 a fractional quantity keeps the line price and cart total consistent @regression', async ({ checkoutPage, customerApi }) => {
    test.fail(true, 'BUG-003: quantity 2.5 is rejected with 422 but the line price is recalculated while the cart total is not.');
    await checkoutPage.addProductToCart(await customerApi.firstProductId());
    await checkoutPage.openCart();
    await checkoutPage.expectCartHasItems(1);
    await checkoutPage.setCartQuantity('2.5');
    await checkoutPage.expectLinePriceMatchesTotal();
  });
});
