import { test } from '../../fixtures';

const address = { country: 'NL', postalCode: '1122AB', houseNumber: '98', street: 'Test street' };

test.describe('checkout', () => {
  test('TC-CHK-005 customer pays cash on delivery and sees the order confirmation @smoke', async ({ customerCheckoutPage, customerApi }) => {
    const productId = await customerApi.firstProductId();
    const place = await (await customerApi.call('get', `/postcode-lookup?country=${address.country}&postcode=${address.postalCode}`)).json();

    await customerCheckoutPage.checkoutCashOnDelivery(productId, { ...address, city: place.city, state: place.state });
    await customerCheckoutPage.expectOrderConfirmed();
  });

  test('TC-CHK-009 a guest pays cash on delivery and sees the order confirmation @smoke', async ({ checkoutPage, customerApi }) => {
    const productId = await customerApi.firstProductId();
    const place = await (await customerApi.call('get', `/postcode-lookup?country=${address.country}&postcode=${address.postalCode}`)).json();

    await checkoutPage.addProductToCart(productId);
    await checkoutPage.openCart();
    await checkoutPage.expectCartHasItems(1);
    await checkoutPage.continueFromCart();
    await checkoutPage.continueAsGuest({ email: 'guest.qa@example.com', firstName: 'Guest', lastName: 'Shopper' });
    await checkoutPage.fillAddress({ ...address, city: place.city, state: place.state });
    await checkoutPage.continueFromAddress();
    await checkoutPage.payCashOnDelivery();
    await checkoutPage.expectOrderConfirmed();
  });
});
