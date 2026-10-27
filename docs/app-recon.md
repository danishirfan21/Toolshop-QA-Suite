# App recon: Practice Software Testing (Toolshop)

Every statement below was observed by calling the live public demo with Node `fetch` scripts on 2026-10-27, or read from the demo's published swagger JSON. Anything not observed is listed under UNKNOWN.

## Target and environment

| Item | Value |
| --- | --- |
| Upstream repo | https://github.com/testsmith-io/practice-software-testing |
| Upstream commit read | `ae7caecb811dd8952c09d997e69be7cb946ecd44` |
| Web (Angular SPA) | https://practicesoftwaretesting.com |
| API base | https://api.practicesoftwaretesting.com |
| Swagger JSON | https://api.practicesoftwaretesting.com/docs?api-docs.json (the path `/docs/api-docs.json` returned 404) |
| How it is run now | Public demo. Docker is not installed on this machine (`docker` is not recognized), so nothing was self-hosted. |
| CI | Self-hosts the upstream `docker-compose.prod.yml` (laravel-api, angular-ui, web, mariadb) at the pinned commit. Observed 2026-10-27 in run 40491927719: 17 tests passed (setup, api, chromium-desktop, mobile-chrome). Web image is linux/arm64 only; run 40490758359 failed with `exec format error` on amd64, run 40491927719 passed after adding QEMU arm64 emulation. |

## Seeded accounts

Documented upstream and confirmed by a successful login on the demo.

| Role | Email | Password |
| --- | --- | --- |
| Customer | customer@practicesoftwaretesting.com | welcome01 |
| Admin | admin@practicesoftwaretesting.com | welcome01 |

Customer profile (`GET /users/me`): first name Jane, last name Doe, address street `Test street 98`, city `Vienna`, country `Austria`, state null, postal_code null, totp_enabled false.

## Authentication

- `POST /users/login` with `{email, password}` returns 200 `{access_token, token_type, expires_in}` for both roles.
- `token_type` is `bearer`, `expires_in` is `300` (seconds). Tokens expire after 5 minutes, so the API client must re-login when needed.
- JWT claims observed: `iss, iat, exp, nbf, jti, sub, prv, role`. `role` is `user` for the customer and `admin` for the admin.
- Requests send `Authorization: Bearer <token>` (seen in the front end HTTP interceptor).
- `GET /users/me` returns 200 with a token and 401 `{message}` without one. The admin response also includes `enabled`, `role`, `failed_login_attempts`.

## Products

- `GET /products` returns 200 `{current_page, data[], from, last_page, per_page, to, total}`. Observed: 9 items per page, `total` 50, `last_page` 6.
- Product item fields: `id, name, description, price, is_location_offer, is_rental, co2_rating, in_stock, is_eco_friendly, product_image{id, by_name, by_url, source_name, source_url, file_name, title}, category{...}, brand{...}`.
- IDs are 26 character ULID style strings. Seeded ids are uppercase (example: first product `01M5XHCRV15PHWGQNBZK2HM952`, "Combination Pliers", price 14.15). Ids of rows created through the API are lowercase.
- `GET /products?page=2`, `?sort=price,desc`, `?sort=name,asc`, `?between=price,1,20` all returned 200 with the same envelope.
- `GET /products?by_category=x` returned 200 with an empty `data` and `total` 0 (no error for an unknown category).
- `GET /products/{id}` returns 200 with a single product, 404 `{message:"Requested item not found"}` once deleted.
- `GET /products/search?q=hammer` returned 200 with 6 items. `q=zzzznomatch` returned 200 with `data: []`, `from: null`, `to: null`.
- `GET /categories` returned 200 with an array of 19 `{id, name, slug, parent_id}`. `GET /brands` returned 200 with an array of 2 `{id, name, slug}` (one is "ForgeFlex Tools").

## Cart

Cart endpoints worked without a login in the probes where a customer token was sent. Behavior with no token was not probed (see UNKNOWN).

| Call | Observed |
| --- | --- |
| `POST /carts` | 201 `{id}` |
| `POST /carts/{id}` `{product_id, quantity:1}` | 200 `{result:"item added or updated"}` |
| same, `quantity:0` | 422 `{message:"The quantity field must be at least 1.", errors:{quantity:[...]}}` (first recon). Re-observed 2026-10-27, with and without a token, on fresh carts: 404 `{message:"Resource not found"}`. Cause UNKNOWN. |
| same, unknown `product_id` | 422 `{message:"The selected product id is invalid.", errors:{product_id:[...]}}` (first recon). Re-observed 2026-10-27: 404 `{message:"Resource not found"}`. Cause UNKNOWN. |
| `GET /carts/{id}` | 200 `{id, additional_discount_percentage, lat, lng, cart_items[{id, quantity, discount_percentage, cart_id, product_id, product{...}}]}` |
| `PUT /carts/{id}/product/quantity` | 200 `{result:"item added or updated"}` |

The front end keeps the cart id in `sessionStorage` under the key `cart_id` (read from the bundle).

## Checkout

The UI flow named by the front end is cart, sign in, billing address, payment. Per step:

- Payment check: `POST /payment/check` returned 200 `{message:"Payment was successful"}` (two calls observed).
- Invoice create: `POST /invoices` without a token returns 401 `{message:"Unauthorized"}`. With a customer token and an empty or partial body it returns 422 with a field map (`billing_city`, `billing_country`).
- Required invoice fields (swagger): `billing_street, billing_city, billing_state, billing_country, billing_postal_code, payment_method, payment_details, cart_id`. `payment_method` enum: `bank-transfer, cash-on-delivery, credit-card, buy-now-pay-later, gift-card`.
- Earlier attempts with guessed cities (Utrecht, Vienna, Berlin and others) all failed with 422 `billing_country` "The city does not belong to the selected country". Cause found 2026-10-27: the city must be the one returned by `GET /postcode-lookup?country=<c>&postcode=<p>`. Observed: `country=NL&postcode=1122AB` returned `{city:"Scherpenzeel", state:"Groningen"}`. The result depends on the exact country string (`AT` and `Austria` returned different cities for 1010).
- Observed 201: `POST /invoices/guest` with the looked-up city and state, `billing_country:"NL"`, `billing_postal_code:"1122AB"`, `payment_method:"cash-on-delivery"`, `payment_details:{}`, a cart id with one item, and `guest_first_name`, `guest_last_name`, `guest_email`. Response fields: `billing_*`, `user_id:null`, `invoice_date`, `invoice_number` (example `INV-2026000020`), `id`, `subtotal`, `total`, discount fields. The same body with city `Nowhere` returned 422 on `billing_country`. The guest endpoint also requires the three `guest_*` fields (422 without them).
- Authenticated `POST /invoices` with the looked-up city was NOT observed on the public demo: the customer login returned 423 `{error:"Account locked, too many failed attempts. Please contact the administrator."}`. Cause of the lockout UNKNOWN. On the self-hosted app in CI run 40497, commit 02f0a8d (CI #9), tests/api/checkout.api.spec.ts passed: authenticated `POST /invoices` returned 201 with an `INV-<digits>` invoice_number.
- On the self-hosted app the 422 for a mismatched city has no `errors` key (run 40495705419 failed on that assertion); the raw JSON contains `billing_country`. The test now asserts on the raw JSON.
- UI flow (read from upstream source, then exercised by tests/checkout/checkout.desktop.spec.ts, which passed in CI #10, run 40500276180, commit c8b8985, 23 tests total): `/product/:id` `add-to-cart`, then `/checkout` (4-step wizard): cart `proceed-1`, sign in `proceed-2` (already logged in via storageState), address `proceed-3`, payment. Address ids: `country` (select, code e.g. NL), `postal_code`, `house_number`, `street`, `city`, `state`. Payment: select `payment-method` `cash-on-delivery`, click `finish` (runs `/payment/check`, shows `payment-success-message`), click `finish` again to buy. Confirmation is `#order-confirmation` and contained `INV-`. The test fills city and state explicitly with the values from `/postcode-lookup`.
- Invoice list: `GET /invoices` (customer) returned 200 with a paginated envelope of 15 items. Existing rows look like `{invoice_number:"INV-20260000035", status:"COMPLETED", billing_street:"Test street 36", billing_city:"Utrecht", billing_state:"Utrecht", billing_country:"The Netherlands", billing_postal_code:"1122AB", ...}`. These rows were not created by the probes.
- `GET /invoices/undefined` returned 404 `{message:"Requested item not found"}`.

## Admin product create, update, delete

Admin token required.

| Call | Observed |
| --- | --- |
| `POST /products` with `{}` | 422 field map: `price, category_id, brand_id, is_location_offer, is_rental, product_image_id` (and name/description per swagger) |
| `POST /products` with name, description, price, category_id, brand_id, product_image_id, is_location_offer, is_rental, co2_rating | 201 echo of the product plus `id`, `in_stock: null`, `is_eco_friendly`, `product_image{...}` |
| `PUT /products/{id}` | 200 `{success:true}`; a following GET showed the new name and price |
| `PATCH /products/{id}` | 200 `{success:true}`; a following GET showed the new price |
| `DELETE /products/{id}` with the customer token | 403 `{message:"Forbidden"}` |
| `DELETE /products/{id}` with the admin token | 204, empty body. A following GET returns 404, a second DELETE returns 404 `{message:"Requested item not found"}` |

All probe products were deleted afterwards.

## Front end storage (from the bundle)

- `sessionStorage.cart_id`
- `localStorage`: `language`, `PAYMENT_ENDPOINT`, `GEO_LOCATION`, `RETRIEVE_GEOLOCATION`, `testing-split-screen-active`, `bug-hunting-split-screen-active`
- The HTTP interceptor calls `token.getToken()`. After a UI login as customer, the saved Playwright storageState (observed 2026-10-27) held the JWT in `localStorage` under the key `auth-token` on https://practicesoftwaretesting.com, plus one cookie named `cf_clearance`.

## CI observation

Observed 2026-10-27 in GitHub Actions run 40439729196 (ubuntu-latest): the browser opened https://practicesoftwaretesting.com/auth/login and the failure screenshot and page snapshot show a Cloudflare "Performing security verification" page ("Verify you are human"), Ray ID a50e5780fd5caf8c. The login form never rendered, so both auth setup tests timed out. The API host was reachable from the same runner (13 API tests passed). Locally the same UI flow works.

## UNKNOWN

1. RESOLVED: the UI stores the JWT in localStorage key `auth-token` (see Front end storage). Whether it is also stored elsewhere is not checked.
2. MOSTLY RESOLVED: guest and authenticated invoice payloads observed (201, see Checkout). Observed on the self-hosted API (run 40505283403, `POST /invoices`, customer token): credit-card with `credit_card_number, expiration_date, cvv, card_holder_name`, bank-transfer with `bank_name, account_name, account_number`, and buy-now-pay-later with `monthly_installments` each returned 201; with `payment_details:{}` those three returned 500 `{"message":"Something went wrong"}`. gift-card with `{}` returned 422 naming `payment_details.gift_card_number` and `payment_details.validation_code`; `gift_card_number:"ABC12345"` returned 422 (format invalid). An unknown method returned 422 on `payment_method`. UNKNOWN: a gift-card number format that is accepted; what happens to the cart after an invoice.
2a. Whether the postcode lookup auto-fills city/state in the UI is not observed; the test fills them explicitly.
2b. The full text of `#order-confirmation` is not observed; the test only asserts it contains `INV-`.
2c. RESOLVED (one run): `tests/checkout/checkout.mobile.spec.ts` (Pixel 7 viewport, width asserted < 768) passed in run 40504965949 (24 tests). The `customerPage` fixture previously ignored the project's device settings, so the existing mobile smoke test ran at desktop size; it now passes the settings on and still passed.
2d. Checkout UI test flake: run 40502094783 (commit 2f9ce58, docs-only) failed on the first run and both retries with `expectCartHasItems(1)` receiving 0 `product-title` elements; the same test passed in run 40500276180. Artifact inspected: the failing assertion was `getByTestId('product-title')` `toHaveCount(1)` receiving 0; the page snapshot showed "The cart is empty. Nothing to display." with the user logged in as Jane Doe; the network log showed `GET /checkout` 200, two `GET /carts/{id}` 200, and a `POST /carts` with status -1 (failed or cancelled); the trace's copy of `addProductToCart` was the old version (goto, click, no response wait). Cause UNKNOWN (the link between the cancelled `POST /carts` and the empty cart is not proven). Suspected race: `addProductToCart` navigated to `/checkout` right after the click. Commit e61fc1c now waits for the add-item response first; run 40502595593 passed (23 tests, one run only), so the fix is not proven.
3. RESOLVED by observation: the city must match `GET /postcode-lookup` for the exact country string and postcode (see Checkout). Why the lookup returns a city unrelated to the real place is UNKNOWN.
3a. RESOLVED (one run, self-hosted, run 40513349221, commit f91c1de): 12 consecutive `POST /users/login` with a wrong password for customer@ returned 401 `{"error":"Unauthorized"}` on attempts 1-3 and 423 `{"error":"Account locked, too many failed attempts. Please contact the administrator."}` from attempt 4 on. A login with the right password after those failures also returned 423. Whether the lock expires is not observed. What locked the public demo's customer@ is UNKNOWN (consistent with, but not shown to be, repeated failures).
4. PARTLY RESOLVED: on the self-hosted API (run 40506401413, commit c8d65ca) `POST /users/login` with a wrong password and with an unknown email both returned 401 `{"error":"Unauthorized"}`; an empty body returned 401 `{"error":"Invalid login request"}`. The lockout threshold is in 3a.
5. RESOLVED (one run, self-hosted, run 40506401413): with no token `POST /carts` returned 201 `{"id":...}`, `GET /carts/{id}` 200, `POST /carts/{id}` (qty 1) 200 and `DELETE /carts/{id}` 204.
6. Whether the demo resets data on a schedule. Seeded `created_at` values showed today's date (2026-10-27) and invoices dated 2026-10-21, which hints at periodic reseeding but that is not confirmed.
7. RESOLVED (self-hosted). Without `Accept: application/json` (run 40506401413) quantity 99 returned 200 and quantities 100, 101, 1000, 999999 and -1 each returned 302 with an HTML body. With `Accept: application/json` (run 40513349221, commit f91c1de) quantity 100 returned 422 `{"message":"The quantity field must not be greater than 99.","errors":{"quantity":["The quantity field must not be greater than 99."]}}`. Rate limit: 80 sequential `GET /brands` in one run returned 200 every time (0 responses with 429) and no `x-ratelimit-*` or `retry-after` header was printed; a limit above 80 requests is not excluded and was not tested.
8. Admin UI behavior (only the API was probed).
9. Mobile layout behavior.
10. Upstream Docker image tags: only `testsmith/practice-software-testing-web` (arm64 platform warning) and sprint5 api/ui images were used in CI; exact digests not recorded.
11. Whether the Cloudflare challenge on the runner is consistent across runs or IPs (one run observed). No longer affects CI, which uses the self-hosted app.
