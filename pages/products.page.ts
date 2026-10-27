import { expect, type Locator, type Page } from '@playwright/test';

export class ProductsPage {
  readonly productCards: Locator;
  readonly searchInput: Locator;
  readonly searchSubmit: Locator;
  readonly searchReset: Locator;
  readonly sortSelect: Locator;
  readonly productNames: Locator;
  readonly signInLink: Locator;

  constructor(private readonly page: Page) {
    this.productCards = page.locator('a.card');
    this.searchInput = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.searchReset = page.getByTestId('search-reset');
    this.sortSelect = page.getByTestId('sort');
    this.productNames = page.getByTestId('product-name');
    this.signInLink = page.getByTestId('nav-sign-in');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchSubmit.click();
  }

  async expectProductCount(count: number): Promise<void> {
    await expect(this.productCards).toHaveCount(count);
  }

  async expectSignInLinkVisible(visible: boolean): Promise<void> {
    if (visible) {
      await expect(this.signInLink).toBeVisible();
    } else {
      await expect(this.signInLink).toHaveCount(0);
    }
  }
}
