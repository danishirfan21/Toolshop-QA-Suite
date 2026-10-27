import { test } from '../../fixtures';
import { env } from '../../utils/env';

test.describe('login', () => {
  // Valid credentials only: wrong passwords would count toward the lockout of the shared seeded customer.
  test('TC-AUTH-005 customer logs in through the form and leaves the login page @smoke', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.expectLoginFormVisible();
    await loginPage.login(env.customer.email, env.customer.password);
    await loginPage.expectLeftLoginPage();
  });
});
