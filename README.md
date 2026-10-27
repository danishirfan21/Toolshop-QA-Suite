# Toolshop QA Suite

Playwright and TypeScript test suite for the open source [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing) app. By default it runs against the public demo at https://practicesoftwaretesting.com (API: https://api.practicesoftwaretesting.com).

Status: Stage 1 (foundation). One smoke test per project proves the setup. Facts about the app are in [docs/app-recon.md](docs/app-recon.md); anything not verified there is marked UNKNOWN.

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

## Run

```bash
npm ci
npx playwright install chromium
npm run lint
npm run typecheck
npm test
```

`npm run test:desktop` and `npm run test:mobile` run one project each. Optional settings are listed in `.env.example`; defaults point at the public demo and its documented seeded accounts.

## Conventions

- Dependencies are pinned to exact versions.
- Specs ending in `.desktop.spec.ts` run on desktop Chrome, `.mobile.spec.ts` on Pixel 7.
- Retries are 0 locally and 2 on CI.
- The test id attribute is `data-test`.
- Test data is created and removed through the API client.
