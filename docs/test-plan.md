# Test plan: Toolshop QA Suite

Facts about the application come from [app-recon.md](app-recon.md). Anything not confirmed there is UNKNOWN and must be investigated before a test depends on it.

## Scope

In scope, against the Practice Software Testing web app and its REST API:

- Authentication: login for customer and admin, token expiry (300 seconds).
- Product catalog: listing, pagination, sorting, search, category and brand filters, product detail.
- Cart: create, add, change quantity, validation errors.
- Checkout: billing address, payment step, invoice creation.
- Admin product management: create, update, delete, and role based access (customer gets 403 on delete).
- Responsive behavior on one phone viewport (Pixel 7 emulation, run in CI) and one desktop viewport. Real-device checks and visual validation have not been done; they are manual charters (docs/manual-charters.md).

## Out of scope

- Performance and load testing, and anything that could be read as stress on the public demo.
- Security testing beyond basic role and authorization checks.
- Cross browser coverage beyond Chromium.
- Third party services (geolocation, payment providers).
- Visual regression.
- Anything about the upstream codebase itself.

## Risk based priorities

Derived from recon. Higher means test first.

| Priority | Area | Why |
| --- | --- | --- |
| P1 | Checkout and invoice creation | Revenue path. Originally the least understood area (no valid invoice payload was known). Recon has since recorded valid and invalid payloads (docs/app-recon.md, UNKNOWN 2); the UI beyond cash on delivery is still open. |
| P1 | Authentication and role access | Every other flow depends on it. Tokens expire after 5 minutes, and the DELETE role check (403 vs 204) is a concrete authorization rule. |
| P2 | Cart | Validation rules are known (see docs/app-recon.md; a later re-observation of quantity 0 differs from the first probe). Cart calls without a token worked in one self-hosted run (UNKNOWN 5); browser behavior is still UNKNOWN. |
| P2 | Catalog search, sort, filter | High traffic, many parameter combinations, 50 products over 6 pages of 9. |
| P3 | Admin product CRUD | Narrow audience. API behavior is known, UI is UNKNOWN. |
| P3 | Mobile layout | Pixel 7 emulation runs in CI; layout judgment and real-device behavior have not been validated (see docs/manual-charters.md). |

## Environments

| Environment | Use | Notes |
| --- | --- | --- |
| Public demo (https://practicesoftwaretesting.com) | Stage 1 recon, exploratory probing and optional local runs | Shared; data may be reset or changed by others. Its Cloudflare challenge blocks CI runner IPs. Its version may differ from the pinned ref; observed differences are noted in docs/app-recon.md and the case files. Some test data cannot be cleaned up (docs/test-data-cleanup.md). |
| Self-hosted upstream app (the reference) | CI, implemented | `.github/workflows/ci.yml` runs upstream `docker-compose.prod.yml` at the pinned `TOOLSHOP_REF` (arm64 image, emulated by QEMU on the amd64 runner) with a freshly migrated and seeded database per run. Results here are the reference. |

## Entry criteria

- Target URL reachable and the seeded accounts can log in.
- `npm ci` and `npx playwright install chromium` succeed.
- The change or story under test has acceptance criteria.

## Exit criteria

- `npm run lint`, `npm run typecheck` and `npm test` pass.
- No open P1 defect without a decision recorded.
- Every automated test creates its own data. Data with a supported delete endpoint is removed; the rest is listed in docs/test-data-cleanup.md and is cleared by the disposable CI database.
- New findings are written up with the bug report template.

## Manual versus automated

Automate: stable, repeatable, high value checks such as login, catalog counts, cart validation, role access, and API contract checks. State is created through the API client, never through the UI.

Keep manual: exploratory sessions, usability, layout judgment on real devices, flows whose rules are UNKNOWN until the rule is understood, and anything that depends on shared demo data. Invoice creation was originally in this group; recon has since clarified it and it is automated (TC-CHK-001 to TC-CHK-012).

## Defect reporting process

1. Reproduce at least three times and record the reproduction rate. An automated defect test is marked as an expected failure only after it observes the documented symptom (for example the BUG-001 500); any other failure is a real failure.
2. Copy `docs/templates/bug-report.md` and fill every field, including severity and the evidence path (screenshot, trace or response body).
3. Record only observed behavior. If the expected result is not documented, say so.
4. Link the bug to the test case or exploratory session that found it.
