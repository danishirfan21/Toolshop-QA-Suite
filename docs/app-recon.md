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
| CI | Will self-host the upstream Docker setup later. Not done in Stage 1. |

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
- Every attempt to create an invoice with a complete body failed with 422 `{billing_country:["The billing_country does not match the entered address. The city does not belong to the selected country."]}`. Combinations tried: Utrecht/NL, Utrecht/Netherlands, Utrecht/The Netherlands, Vienna/AT, Vienna/Austria, Berlin/DE, New York/US, London/GB, Amsterdam/NL (postal codes `1010`, `1122AB`, `3511AB`, `3511 AB`, `SW1A 1AA`, `10115`, `10001`, `1012AB`, `1012 AB`). Vienna/AT with postal `A-1010` returned a different 422: `The postal code format is not valid for the selected country.` A successful invoice create was never observed.
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
2. A valid `POST /invoices` payload, so the success response shape, the invoice number format on create, and what happens to the cart afterwards.
3. How the billing country is validated (the rule rejected every combination tried).
4. Login failure response (wrong password) status and body, account lockout threshold (`failed_login_attempts` exists on the admin profile only).
5. Cart and `POST /carts` behavior with no token.
6. Whether the demo resets data on a schedule. Seeded `created_at` values showed today's date (2026-10-27) and invoices dated 2026-10-21, which hints at periodic reseeding but that is not confirmed.
7. Rate limits and any maximum quantity per cart item.
8. Admin UI behavior (only the API was probed).
9. Mobile layout behavior.
10. Upstream Docker image tags (not pulled, Docker is unavailable here).
11. Whether the Cloudflare challenge on the runner is consistent across runs or IPs (one run observed).
