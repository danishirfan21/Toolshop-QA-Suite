import { test as setup } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { authFile, env, type Role } from '../../utils/env';

const roles: Role[] = ['customer', 'admin'];

for (const role of roles) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(env[role].email, env[role].password);
    await login.expectLeftLoginPage();
    await page.context().storageState({ path: authFile(role) });
  });
}
