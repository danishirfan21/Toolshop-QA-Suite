import { test, expect } from '../../fixtures';

const address = { country: 'NL', postalCode: '1122AB', houseNumber: '98', street: 'Test street' };

test.describe('checkout (mobile)', () => {
  test('TC-CHK-006 customer pays cash on delivery on a phone viewport @smoke', async ({ customerCheckoutPage, customerPage, customerApi }) => {
    expect(customerPage.viewportSize()?.width).toBeLessThan(768);

    const productId = await customerApi.firstProductId();
    const place = await (await customerApi.call('get', `/postcode-lookup?country=${address.country}&postcode=${address.postalCode}`)).json();

    await customerCheckoutPage.checkoutCashOnDelivery(productId, { ...address, city: place.city, state: place.state });
    await customerCheckoutPage.expectOrderConfirmed();
  });
});
