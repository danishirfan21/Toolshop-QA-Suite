import { test, expect } from '../../fixtures';

const address = { country: 'NL', postalCode: '1122AB', houseNumber: '98', street: 'Test street' };

test.describe('checkout', () => {
  test('customer pays cash on delivery and sees the order confirmation', async ({ customerCheckoutPage, customerApi }) => {
    const productId = await customerApi.firstProductId();
    const place = await (await customerApi.call('get', `/postcode-lookup?country=${address.country}&postcode=${address.postalCode}`)).json();

    await customerCheckoutPage.addProductToCart(productId);
    await customerCheckoutPage.openCart();
    await customerCheckoutPage.expectCartHasItems(1);
    await customerCheckoutPage.proceedFromCart.click();
    await customerCheckoutPage.proceedFromSignIn.click();
    await customerCheckoutPage.fillAddress({ ...address, city: place.city, state: place.state });
    await customerCheckoutPage.proceedFromAddress.click();
    await customerCheckoutPage.payCashOnDelivery();

    await expect(customerCheckoutPage.orderConfirmation).toContainText('INV-');
  });
});
