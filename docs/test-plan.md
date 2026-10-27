# Test plan: Toolshop QA Suite

Facts about the application come from [app-recon.md](app-recon.md). Anything not confirmed there is UNKNOWN and must be investigated before a test depends on it.

## Scope

In scope, against the Practice Software Testing web app and its REST API:

- Authentication: login for customer and admin, token expiry (300 seconds).
- Product catalog: listing, pagination, sorting, search, category and brand filters, product detail.
- Cart: create, add, change quantity, validation errors.
- Checkout: billing address, payment step, invoice creation.
- Admin product management: create, update, delete, and role based access (customer gets 403 on delete).
- Responsive behavior on one phone viewport (Pixel 7) and one desktop viewport.

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
| P1 | Checkout and invoice creation | Revenue path. A valid invoice payload was never found (recon UNKNOWN 2 and 3), so this is the least understood area. |
| P1 | Authentication and role access | Every other flow depends on it. Tokens expire after 5 minutes, and the DELETE role check (403 vs 204) is a concrete authorization rule. |
| P2 | Cart | Validation rules are known (422 for quantity 0 and unknown product). Cart behavior without a token is UNKNOWN. |
| P2 | Catalog search, sort, filter | High traffic, many parameter combinations, 50 products over 6 pages of 9. |
| P3 | Admin product CRUD | Narrow audience. API behavior is known, UI is UNKNOWN. |
| P3 | Mobile layout | Layout behavior is UNKNOWN. |

## Environments

| Environment | Use | Notes |
| --- | --- | --- |
| Public demo (https://practicesoftwaretesting.com) | Stage 1 and local runs | Shared, data may be reset or changed by others. Tests create and delete their own data through the API client. |
| Self hosted upstream Docker setup | Planned for CI | Not done yet. Image tags are UNKNOWN. |

## Entry criteria

- Target URL reachable and the seeded accounts can log in.
- `npm ci` and `npx playwright install chromium` succeed.
- The change or story under test has acceptance criteria.

## Exit criteria

- `npm run lint`, `npm run typecheck` and `npm test` pass.
- No open P1 defect without a decision recorded.
- Every automated test creates its own data and removes it.
- New findings are written up with the bug report template.

## Manual versus automated

Automate: stable, repeatable, high value checks such as login, catalog counts, cart validation, role access, and API contract checks. State is created through the API client, never through the UI.

Keep manual: exploratory sessions, usability, layout judgment on real devices, flows whose rules are UNKNOWN (for example invoice creation) until the rule is understood, and anything that depends on shared demo data.

## Defect reporting process

1. Reproduce at least three times and record the reproduction rate.
2. Copy `docs/templates/bug-report.md` and fill every field, including severity and the evidence path (screenshot, trace or response body).
3. Record only observed behavior. If the expected result is not documented, say so.
4. Link the bug to the test case or exploratory session that found it.
