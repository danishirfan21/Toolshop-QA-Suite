import { test as setup } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { authFile, env, type Role } from '../../utils/env';

const roles: Role[] = ['customer', 'admin'];

for (const role of roles) {
  // Tagged so that --grep @smoke / @regression still runs the setup project that the browser projects depend on.
  setup(`authenticate as ${role} @smoke @regression`, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(env[role].email, env[role].password);
    await login.expectAuthenticated();
    await page.context().storageState({ path: authFile(role) });
  });
}
