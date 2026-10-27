import { expect, type Locator, type Page } from '@playwright/test';

export class ProductsPage {
  readonly productCards: Locator;
  readonly filtersToggle: Locator;
  readonly searchInput: Locator;
  readonly searchSubmit: Locator;
  readonly searchReset: Locator;
  readonly sortSelect: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly searchCaption: Locator;
  readonly signInLink: Locator;

  constructor(private readonly page: Page) {
    this.productCards = page.locator('a.card');
    this.filtersToggle = page.getByRole('button', { name: 'Filters' });
    this.searchInput = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.searchReset = page.getByTestId('search-reset');
    this.sortSelect = page.getByTestId('sort');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
    this.searchCaption = page.getByTestId('search-caption');
    this.signInLink = page.getByTestId('nav-sign-in');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  // On a phone the search and sort controls sit in a collapsed Filters panel (observed on the public demo).
  async openFiltersIfCollapsed(): Promise<void> {
    // isVisible() does not wait, so wait for either control first; it raced the page render (TC-CAT-004 flaked in CI).
    await expect(this.searchInput.or(this.filtersToggle).first()).toBeVisible();
    if (!(await this.searchInput.isVisible())) await this.filtersToggle.click();
  }

  async search(term: string): Promise<void> {
    await this.openFiltersIfCollapsed();
    await this.searchInput.fill(term);
    await this.searchSubmit.click();
  }

  async expectProductCount(count: number): Promise<void> {
    await expect(this.productCards).toHaveCount(count);
  }

  async sortBy(value: string): Promise<void> {
    await this.openFiltersIfCollapsed();
    await this.sortSelect.selectOption(value);
  }

  async expectPricesDescending(): Promise<void> {
    // The list reloads after the sort, so poll. The default order is not sorted, so this cannot pass before the reload.
    await expect
      .poll(async () => {
        const prices = (await this.productPrices.allTextContents()).map((t) => Number(t.replace(/[^0-9.]/g, '')));
        return prices.length > 1 && prices.every((p, i) => i === 0 || prices[i - 1] >= p);
      })
      .toBe(true);
  }

  async expectSearchCaption(term: string): Promise<void> {
    await expect(this.searchCaption).toContainText(term);
  }

  async expectProductListed(name: string): Promise<void> {
    await expect(this.productNames.filter({ hasText: name }).first()).toBeVisible();
  }

  async expectSignInLinkVisible(visible: boolean): Promise<void> {
    if (visible) {
      await expect(this.signInLink).toBeVisible();
    } else {
      await expect(this.signInLink).toHaveCount(0);
    }
  }
}
