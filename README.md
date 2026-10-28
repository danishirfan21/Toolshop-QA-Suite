# Toolshop QA Suite

[![CI](https://github.com/danishirfan21/Toolshop-QA-Suite/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/danishirfan21/Toolshop-QA-Suite/actions/workflows/ci.yml?query=branch%3Amain+event%3Apush)

Related suites: [SauceDemo UI suite](https://github.com/danishirfan21/Playwright-Automation-Framework) and [Restful-Booker API suite](https://github.com/danishirfan21/Playwright-Api-Test-Suite).

A Playwright and TypeScript QA suite for the open source [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing) (Toolshop) app: test cases, automation, a traceability report and defect reports for checkout, authentication, cart and catalog, on desktop and a phone viewport.

By default the tests run against the public demo at https://practicesoftwaretesting.com (API: https://api.practicesoftwaretesting.com). CI runs them against a self-hosted copy of the app at a pinned upstream commit, which is the reference environment. The public demo can differ from it.

## What it covers

| Area | Cases | Source |
| --- | --- | --- |
| Checkout and invoices (CHK) | `docs/test-cases/checkout.md` | guest and customer, payment methods, desktop and phone |
| Authentication and roles (AUTH) | `docs/test-cases/auth.md` | login, lockout, customer versus admin |
| Cart (CART) | `docs/test-cases/cart.md` | add items, quantity limits |
| Catalog (CAT) | `docs/test-cases/catalog.md` | browse, sort, search on desktop and phone |

Facts about the app are in [docs/app-recon.md](docs/app-recon.md); anything not verified there is marked UNKNOWN. The planned coverage is in [docs/test-plan.md](docs/test-plan.md).

## Numbers (measured on 2026-10-28)

| Measure | Value | How measured |
| --- | --- | --- |
| Tests in `npx playwright test --list` | 27 | 16 `api`, 6 `chromium-desktop`, 3 `mobile-chrome`, 2 `setup` |
| Test cases written | 29 | `npm run traceability` |
| Cases automated / kept manual | 25 / 4 | `npm run traceability` |
| Defect reports | 3 | `docs/bug-reports/` |

## Traceability

`npm run traceability` reads the cases in `docs/test-cases/*.md` and the case IDs in spec titles, writes [docs/traceability.md](docs/traceability.md), and exits with an error if an Automate case has no spec, a spec cites an unknown case, a Keep manual case has a spec, an ID is duplicated, or a test title has no case ID. CI runs it on every push and pull request.

## Defects

Status values: CONFIRMED IN CI means reproduced against the CI-hosted app at the pinned ref. OBSERVED ON PUBLIC DEMO ONLY and NOT REPRODUCED are the other values; none of the current reports use them. The reports were found by scripted probing by Claude Code and have not been triaged by the repository owner. Each confirmed defect has a test marked `test.fail`, which passes while the defect exists and fails once it is fixed.

| Report | Status | Automated test |
| --- | --- | --- |
| [BUG-001 Invoice with empty payment details returns 500](docs/bug-reports/BUG-001-payment-details-500.md) | CONFIRMED IN CI | TC-CHK-007 |
| [BUG-002 The cart still holds its items after an order](docs/bug-reports/BUG-002-cart-not-cleared-after-order.md) | CONFIRMED IN CI (API level) | TC-CHK-010 |
| [BUG-003 Fractional quantity shows a line price the server rejected](docs/bug-reports/BUG-003-fractional-quantity-line-price.md) | CONFIRMED IN CI | TC-CART-005 |

Notes: each report has an "Expected behavior basis" line citing the upstream user story it rests on. Upstream says the cart is cleared after an order (BUG-002, UI wording) and lists the payment fields as required (BUG-001), but it does not state the HTTP status, so the 422 expectation for BUG-001 is tester judgment. A `test.fail` test also passes when it fails for an unrelated reason, so the BUG-003 assertion was checked against the public demo and failed there with the expected mismatch ($35.38 line price against a $14.15 total).

## Exploratory notes

[docs/exploratory-notes.md](docs/exploratory-notes.md) holds notes from scripted probing of the public demo by Claude Code. They are not notes from manual sessions by the repository owner, and no raw manual session logs are in this repository.

## Structure

| Folder | Purpose |
| --- | --- |
| `tests/` | Specs. `tests/setup/` holds the login setup that caches storageState per role. |
| `pages/` | Page objects. All locators live here, never in specs (enforced by ESLint). |
| `fixtures/` | Playwright fixtures that inject page objects, role contexts and API clients. |
| `clients/` | Typed API client used to create and clean up test data. |
| `utils/` | Typed environment config. |
| `scripts/` | The traceability script. |
| `docs/` | Recon, test plan, test cases, traceability, exploratory notes, bug reports and templates. |
| `.claude/commands/` | `/test-plan` command that turns a user story into test cases. |

## Projects

| Project | Specs | Notes |
| --- | --- | --- |
| `setup` | `tests/setup/*.setup.ts` | Logs in as customer and admin and caches storageState. |
| `api` | `*.api.spec.ts` | Uses `API_URL` as baseURL, no browser. |
| `chromium-desktop` | `*.desktop.spec.ts` | Desktop Chrome. |
| `mobile-chrome` | `*.mobile.spec.ts` | Pixel 7. |

Fixtures (`fixtures/index.ts`): `loginPage`, `customerPage`, `adminPage`, `productsPage`, `checkoutPage`, `customerProductsPage`, `customerCheckoutPage`, `customerApi`, `adminApi`. The built-in `request` is unauthenticated.

## Architecture decisions

| Decision | Alternative rejected | Reason |
| --- | --- | --- |
| CI self-hosts the upstream app at a pinned commit | Run CI against the public demo | The public demo serves a Cloudflare challenge to CI runner IPs (noted in `ci.yml`), and a pinned commit keeps results repeatable. |
| Locators only in page objects, enforced by ESLint | Locators written in specs | One place to fix a changed locator, and specs read as steps. |
| Login once per role and reuse storageState | Log in inside every test | Fewer login calls, and the public demo locks accounts after repeated failures. |
| Test data created and removed through the API client | Create data through the UI | Setup does not depend on UI steps. |
| `test.fail` for confirmed open defects | `test.skip`, or asserting the buggy behavior | The suite stays green while a defect is open and reports when it is fixed, without hiding the check or pinning wrong behavior. |
| Traceability generated from case files and spec titles | A hand-kept spreadsheet | The script fails CI when a case and a spec drift apart. |
| Dependencies pinned to exact versions | Version ranges | Repeatable installs. |

## Run locally

```bash
npm ci
npx playwright install chromium
npm run lint
npm run typecheck
npm run traceability
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

The public demo can lock the seeded customer account (423 was observed) and sometimes answers logins with errors, so prefer a self-hosted Toolshop: start the upstream `docker-compose.prod.yml`, run `php artisan migrate:fresh --seed` in `laravel-api`, and set `BASE_URL=http://localhost:4200` and `API_URL=http://localhost:8091`. Docker was not available on the author's machine, so the self-hosted setup was verified only in CI.

## CI

`.github/workflows/ci.yml` runs on push to `main` and on pull requests. It checks out the upstream Toolshop at the pinned `TOOLSHOP_REF` into `toolshop/`, runs lint, typecheck and the traceability check, starts the app with `docker-compose.prod.yml`, migrates and seeds the database, waits for the API and web, then runs `npm test` with 2 workers and 2 retries. The HTML report is uploaded as the `playwright-report` artifact (14 days).

The upstream web image is linux/arm64 only (an amd64 run failed with an exec format error), so the runner emulates arm64 with QEMU. Measured in main run 40597798870 (total 1m51s): QEMU setup 5 s, starting the stack 27 s, migrate and seed 8 s, `npm test` 16 s. The QEMU cost alone was not measured, because no run without emulation exists to compare against.

CI duration of the last four non-probe `main` runs (runs 40566996374, 40586474418, 40593926298, 40597798870) was 2m07s, 2m14s, 2m13s and 1m51s. The fifth most recent `main` run (40538611204) was a temporary probe and took 2h06m, so it is not a typical run.

## How this was built

- Probe first. Behavior was not assumed: where the app's behavior was not verified, the case says UNKNOWN and temporary CI probe runs against the self-hosted app recorded the facts in [docs/app-recon.md](docs/app-recon.md) before tests depended on them. Probes were removed after use.
- The `/test-plan` command in `.claude/commands/test-plan.md` turns a user story into test cases using the template in `docs/templates/test-case.md`.
- Claude Code (Claude Sonnet 5.5) co-authored the work: 37 of the 37 commits on `main` carried a `Co-Authored-By: Claude Sonnet 5.5` trailer when counted on 2026-10-28 (`git log origin/main`).
- Every change goes through a pull request and a green CI run before a squash merge.

## Conventions

- Specs ending in `.desktop.spec.ts` run on desktop Chrome, `.mobile.spec.ts` on Pixel 7.
- Retries are 0 locally and 2 on CI.
- The test id attribute is `data-test`.
- A test title carries its case ID (`TC-XXX-NNN`) and, for an open defect, the `BUG-NNN` ID.

License: MIT
