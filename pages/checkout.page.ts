import { expect, type Locator, type Page } from '@playwright/test';

export interface CheckoutAddress {
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
}

export class CheckoutPage {
  readonly addToCart: Locator;
  readonly cartProductTitles: Locator;
  readonly cartTotal: Locator;
  readonly proceedFromCart: Locator;
  readonly proceedFromSignIn: Locator;
  readonly quantityInput: Locator;
  readonly linePrice: Locator;
  readonly guestTab: Locator;
  readonly guestEmail: Locator;
  readonly guestFirstName: Locator;
  readonly guestLastName: Locator;
  readonly guestSubmit: Locator;
  readonly proceedAsGuest: Locator;
  readonly country: Locator;
  readonly postalCode: Locator;
  readonly houseNumber: Locator;
  readonly street: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly lookupLoading: Locator;
  readonly proceedFromAddress: Locator;
  readonly paymentMethod: Locator;
  readonly finish: Locator;
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;

  constructor(private readonly page: Page) {
    this.addToCart = page.getByTestId('add-to-cart');
    this.cartProductTitles = page.getByTestId('product-title');
    this.cartTotal = page.getByTestId('cart-total');
    this.proceedFromCart = page.getByTestId('proceed-1');
    this.proceedFromSignIn = page.getByTestId('proceed-2');
    this.quantityInput = page.getByTestId('product-quantity');
    this.linePrice = page.getByTestId('line-price').first();
    this.guestTab = page.getByRole('tab', { name: 'Continue as Guest' });
    this.guestEmail = page.getByTestId('guest-email');
    this.guestFirstName = page.getByTestId('guest-first-name');
    this.guestLastName = page.getByTestId('guest-last-name');
    this.guestSubmit = page.getByTestId('guest-submit');
    this.proceedAsGuest = page.getByTestId('proceed-2-guest');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.lookupLoading = page.getByTestId('postcode-lookup-loading');
    this.proceedFromAddress = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.finish = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.locator('#order-confirmation');
  }

  async addProductToCart(productId: string): Promise<void> {
    await this.page.goto(`/product/${productId}`);
    // Navigating right after the click can cancel the cart requests, so wait for the add-item call to finish.
    const added = this.page.waitForResponse((res) => /\/carts\/[^/]+$/.test(new URL(res.url()).pathname) && res.request().method() === 'POST');
    await this.addToCart.click();
    expect((await added).ok()).toBe(true);
  }

  async openCart(): Promise<void> {
    await this.page.goto('/checkout');
  }

  async expectCartHasItems(count: number): Promise<void> {
    await expect(this.cartProductTitles).toHaveCount(count);
  }

  async fillAddress(address: CheckoutAddress): Promise<void> {
    await this.country.selectOption(address.country);
    await this.postalCode.fill(address.postalCode);
    await this.houseNumber.fill(address.houseNumber);
    await expect(this.lookupLoading).toHaveCount(0);
    await this.street.fill(address.street);
    await this.city.fill(address.city);
    await this.state.fill(address.state);
  }

  async setCartQuantity(value: string): Promise<void> {
    const updated = this.page.waitForResponse((res) => /\/carts\/[^/]+\/product\/quantity$/.test(new URL(res.url()).pathname) && res.request().method() === 'PUT');
    await this.quantityInput.fill(value);
    await this.quantityInput.blur();
    await updated;
  }

  // With one item in the cart the line price must equal the cart total.
  async expectLinePriceMatchesTotal(): Promise<void> {
    const total = (await this.cartTotal.textContent()) ?? '';
    await expect(this.linePrice).toHaveText(total.trim());
  }

  async continueFromCart(): Promise<void> {
    await this.proceedFromCart.click();
  }

  async continueFromSignIn(): Promise<void> {
    await this.proceedFromSignIn.click();
  }

  async continueAsGuest(guest: { email: string; firstName: string; lastName: string }): Promise<void> {
    await this.guestTab.click();
    await this.guestEmail.fill(guest.email);
    await this.guestFirstName.fill(guest.firstName);
    await this.guestLastName.fill(guest.lastName);
    await this.guestSubmit.click();
    await this.proceedAsGuest.click();
  }

  async continueFromAddress(): Promise<void> {
    await this.proceedFromAddress.click();
  }

  async payCashOnDelivery(): Promise<void> {
    await this.paymentMethod.selectOption('cash-on-delivery');
    await this.finish.click();
    await expect(this.paymentSuccess).toBeVisible();
    await this.finish.click();
  }

  async expectOrderConfirmed(): Promise<void> {
    await expect(this.orderConfirmation).toContainText('INV-');
  }

  // The logged-in cash on delivery journey, from a product page until the order is placed.
  async checkoutCashOnDelivery(productId: string, address: CheckoutAddress): Promise<void> {
    await this.addProductToCart(productId);
    await this.openCart();
    await this.expectCartHasItems(1);
    await this.continueFromCart();
    await this.continueFromSignIn();
    await this.fillAddress(address);
    await this.continueFromAddress();
    await this.payCashOnDelivery();
  }
}
