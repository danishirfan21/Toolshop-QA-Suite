import { test as base, type Page } from '@playwright/test';
import { ApiClient } from '../clients/api-client';
import { LoginPage } from '../pages/login.page';
import { ProductsPage } from '../pages/products.page';
import { authFile } from '../utils/env';

interface Fixtures {
  loginPage: LoginPage;
  customerPage: Page;
  adminPage: Page;
  customerProductsPage: ProductsPage;
  customerApi: ApiClient;
  adminApi: ApiClient;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),

  customerPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile('customer') });
    await use(await context.newPage());
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile('admin') });
    await use(await context.newPage());
    await context.close();
  },

  customerProductsPage: async ({ customerPage }, use) => use(new ProductsPage(customerPage)),

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
