# Toolshop QA Suite

Playwright and TypeScript test suite for the open source [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing) app. By default it runs against the public demo at https://practicesoftwaretesting.com (API: https://api.practicesoftwaretesting.com).

Facts about the app are in [docs/app-recon.md](docs/app-recon.md); anything not verified there is marked UNKNOWN. The planned coverage is in [docs/test-plan.md](docs/test-plan.md).

## Structure

| Folder | Purpose |
| --- | --- |
| `tests/` | Specs. `tests/setup/` holds the login setup that caches storageState per role. |
| `pages/` | Page objects. All locators live here, never in specs (enforced by ESLint). |
| `fixtures/` | Playwright fixtures that inject page objects, role contexts and API clients. |
| `clients/` | Typed API client used to create and clean up test data. |
| `utils/` | Typed environment config. |
| `docs/` | Recon, test plan and blank templates. |
| `.claude/commands/` | `/test-plan` command that turns a user story into test cases. |

## Projects

| Project | Specs | Notes |
| --- | --- | --- |
| `setup` | `tests/setup/*.setup.ts` | Logs in as customer and admin and caches storageState. |
| `api` | `*.api.spec.ts` | Uses `API_URL` as baseURL, no browser. |
| `chromium-desktop` | `*.desktop.spec.ts` | Desktop Chrome. |
| `mobile-chrome` | `*.mobile.spec.ts` | Pixel 7. |

Fixtures (`fixtures/index.ts`): `loginPage`, `customerPage`, `adminPage`, `customerProductsPage`, `customerCheckoutPage`, `customerApi`, `adminApi`. The built-in `request` is unauthenticated.

## Run locally

```bash
npm ci
npx playwright install chromium
npm run lint
npm run typecheck
npm test
```

`npm run test:api`, `npm run test:desktop` and `npm run test:mobile` run one project each.

### Environment variables

Copy `.env.example` to `.env` to override. All are optional.

| Variable | Default |
| --- | --- |
| `BASE_URL` | `https://practicesoftwaretesting.com` |
| `API_URL` | `https://api.practicesoftwaretesting.com` |
| `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD` | seeded `customer@practicesoftwaretesting.com` / `welcome01` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seeded `admin@practicesoftwaretesting.com` / `welcome01` |

The public demo can lock the seeded customer account (423 was observed) and serves a Cloudflare challenge to CI runners, so prefer a self-hosted Toolshop: start the upstream `docker-compose.prod.yml`, run `php artisan migrate:fresh --seed` in `laravel-api`, and set `BASE_URL=http://localhost:4200` and `API_URL=http://localhost:8091`. Docker was not available on the author's machine, so this was verified only in CI.

## CI

`.github/workflows/ci.yml` runs on push to `main` and on pull requests. It checks out the upstream Toolshop at the pinned `TOOLSHOP_REF` into `toolshop/`, starts it with `docker-compose.prod.yml` (the web image is arm64-only and runs under QEMU), migrates and seeds the database, waits for the API and web, then runs lint, typecheck and `npm test`. The HTML report is uploaded as the `playwright-report` artifact (14 days).

## Conventions

- Dependencies are pinned to exact versions.
- Specs ending in `.desktop.spec.ts` run on desktop Chrome, `.mobile.spec.ts` on Pixel 7.
- Retries are 0 locally and 2 on CI.
- The test id attribute is `data-test`.
- Test data is created and removed through the API client.
