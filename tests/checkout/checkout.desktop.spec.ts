import { test } from '../../fixtures';

const address = { country: 'NL', postalCode: '1122AB', houseNumber: '98', street: 'Test street' };

test.describe('checkout', () => {
  test('TC-CHK-005 customer pays cash on delivery and sees the order confirmation @smoke', async ({ customerCheckoutPage, customerApi }) => {
    const productId = await customerApi.firstProductId();
    const place = await (await customerApi.call('get', `/postcode-lookup?country=${address.country}&postcode=${address.postalCode}`)).json();

    await customerCheckoutPage.checkoutCashOnDelivery(productId, { ...address, city: place.city, state: place.state });
    await customerCheckoutPage.expectOrderConfirmed();
  });
});
