import { test, expect } from '../../fixtures';

// Uses a freshly registered throwaway user so the shared seeded customer is never locked.
test.describe('login lockout', () => {
  test('4th wrong password locks the account (423) and an admin PATCH unlocks it', async ({ request, adminApi }) => {
    const email = `lockout-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
    const password = 'Qa-Suite#7731xZq!';
    const headers = { Accept: 'application/json' };

    const registered = await request.post('/users/register', {
      headers,
      data: {
        first_name: 'Lockout',
        last_name: 'Probe',
        address: { street: 'Test street', city: 'Amsterdam', state: 'NH', country: 'NL', postal_code: '1122AB' },
        phone: '0612345678',
        dob: '1990-01-01',
        email,
        password,
      },
    });
    expect(registered.status()).toBe(201);
    const userId = (await registered.json()).id as string;

    const login = async (pw: string) => (await request.post('/users/login', { headers, data: { email, password: pw } })).status();

    expect(await login(password)).toBe(200);
    expect([await login('wrong-1'), await login('wrong-2'), await login('wrong-3')]).toEqual([401, 401, 401]);
    expect(await login('wrong-4')).toBe(423);
    // Locked even with the right password (no expiry was observed within 240 s, docs/app-recon.md item 3a).
    expect(await login(password)).toBe(423);

    const unlock = await adminApi.call('patch', `/users/${userId}`, { failed_login_attempts: 0 });
    expect(unlock.status()).toBe(200);
    expect(await login(password)).toBe(200);
  });
});
