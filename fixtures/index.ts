import { test as base, type Page } from '@playwright/test';
import { ApiClient } from '../clients/api-client';
import { CheckoutPage } from '../pages/checkout.page';
import { LoginPage } from '../pages/login.page';
import { ProductsPage } from '../pages/products.page';
import { authFile } from '../utils/env';

interface Fixtures {
  loginPage: LoginPage;
  customerPage: Page;
  adminPage: Page;
  productsPage: ProductsPage;
  customerProductsPage: ProductsPage;
  checkoutPage: CheckoutPage;
  customerCheckoutPage: CheckoutPage;
  customerApi: ApiClient;
  adminApi: ApiClient;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),

  // browser.newContext() ignores the project's device settings, so pass them on or the mobile project would run at desktop size.
  customerPage: async ({ browser, viewport, isMobile, hasTouch, userAgent, deviceScaleFactor }, use) => {
    const context = await browser.newContext({ storageState: authFile('customer'), viewport, isMobile, hasTouch, userAgent, deviceScaleFactor });
    await use(await context.newPage());
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile('admin') });
    await use(await context.newPage());
    await context.close();
  },

  productsPage: async ({ page }, use) => use(new ProductsPage(page)),

  customerProductsPage: async ({ customerPage }, use) => use(new ProductsPage(customerPage)),

  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),

  customerCheckoutPage: async ({ customerPage }, use) => use(new CheckoutPage(customerPage)),

  customerApi: async ({}, use) => {
    const api = new ApiClient('customer');
    await use(api);
    await api.dispose();
  },

  adminApi: async ({}, use) => {
    const api = new ApiClient('admin');
    await use(api);
    await api.dispose();
  },
});

export { expect } from '@playwright/test';
