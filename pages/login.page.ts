import { expect, type Locator, type Page } from '@playwright/test';
import { env } from '../utils/env';

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

  /**
   * Evidence of an authenticated session, beyond leaving /auth/login (docs/app-recon.md, Front end storage and Authentication):
   * the front end stores the JWT in localStorage under `auth-token`, and GET /users/me answers 200 with a valid token (401 without).
   */
  async expectAuthenticated(): Promise<void> {
    await this.expectLeftLoginPage();
    await expect.poll(() => this.page.evaluate(() => window.localStorage.getItem('auth-token')), { message: 'auth-token in localStorage' }).toBeTruthy();
    const token = await this.page.evaluate(() => window.localStorage.getItem('auth-token'));
    const me = await this.page.request.get(`${env.apiUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    expect(me.status(), 'GET /users/me with the stored token').toBe(200);
  }
}
