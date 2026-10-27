import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId('login-form');
    this.emailInput = page.getByTestId('email');
    this.passwordInput = page.getByTestId('password');
    this.submitButton = page.getByTestId('login-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.form).toBeVisible();
  }

  async expectLeftLoginPage(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/auth\/login/);
  }
}
