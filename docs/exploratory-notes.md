# Exploratory notes from scripted probing (Stage 2B, run by Claude Code)

These notes come from scripted probing of the public demo by Claude Code, using Playwright scripts and plain HTTP calls. They are not notes from a manual session by the repository owner, and no raw manual session logs exist in this repository.

Run on 2026-10-27 UTC. Environment: the **public demo** (https://practicesoftwaretesting.com and https://api.practicesoftwaretesting.com) only, driven with scripted Playwright (desktop 1280x900) and plain HTTP calls. The observations below were made on the demo, except where "CI-hosted" is named. BUG-001, BUG-002 and BUG-003 were later reproduced against the CI-hosted app at the pinned ref (probe run 40596218053, see the bug reports). The demo may be a different version, and its data is shared and changes: it had 59 products today, where the earlier recon saw 50.

Throwaway data created on the demo: one registered user (`lockout-ui-<ts>@example.com`, now locked), a handful of carts and about 12 invoices. No delete endpoint is known for them. The seeded customer was used only for valid logins and invoices, never for failed logins.

Not covered: real-device layout (only emulation was used earlier, and no judgment was made here). CI-hosted confirmation exists only for BUG-001 to BUG-003 (probe run 40596218053); the rest of this file is demo only.

## Results per case that was marked Keep manual

| Case | Result | Evidence (demo) |
| --- | --- | --- |
| TC-CHK-007 empty payment details | Reproduced. Candidate defect, see BUG-001. | credit-card, bank-transfer and buy-now-pay-later with `{}`: 500 `{"message":"Something went wrong"}`. credit-card with only a card number: 500. cash-on-delivery with `{}`: 201. `payment_details` omitted: 422 "The payment details field must be present." |
| TC-CHK-008 gift card format | Answered. | Upstream `docs/gift-card-validation.md` at the pinned ref: number is exactly 16 alphanumeric characters, code is exactly 4. Probes: `1234567890123456` + `1A2B` gave 201. 15-digit number gave 422 on the number. 3-character code gave 422 on the code. 10 digits + 4 digits gave 422. This case can now be automated. |
| TC-CHK-009 guest checkout via UI | Works. | Steps: add to cart, `/checkout`, proceed, click the "Continue as Guest" tab (role tab), fill `guest-email`, `guest-first-name`, `guest-last-name`, `guest-submit`, then `proceed-2-guest` ("Proceed to checkout"). With NL / 1122AB / house number 98 the address auto-filled (street Kanhaistraat, city Scherpenzeel, state Groningen). Cash on delivery: "Payment was successful", then the confirmation. Requests: POST /payment/check 200, POST /invoices/guest 201. |
| Order confirmation text | Answered. | `#order-confirmation`: "Thanks for your order! Your invoice number is INV-2026000027." (number varies). |
| Postcode auto-fill in the UI | Answered. | Shown above; the form hint reads "Enter country, postal code and house number. We will fill in the rest automatically." |
| Cart state after an invoice | Candidate defect, see BUG-002. | After POST /invoices (201), GET /carts/{id} still returned 200 with the item. In the UI, after a guest order the cart badge still showed 1 and `/checkout` still listed 1 row. |
| TC-AUTH-006 lockout via UI | Works. | Throwaway user: attempts 1 to 3 gave 401 and the UI text "Invalid email or password". Attempt 4 gave 423 and "Account locked, too many failed attempts. Please contact the administrator." Attempt 5 with the right password gave 423 and the same text. The page stayed on /auth/login. |
| TC-AUTH-007 token expiry | Answered. | JWT iat 21:53:29, exp 21:58:29 UTC (300 s). At 21:57:47 `GET /users/me` gave 200. At 21:58:57 it gave 401 `{"message":"Unauthorized"}`. UI behavior at expiry was not checked. |
| TC-CART-004 anonymous cart | Works, by design or not is unclear. | POST /carts with no token: 201. Adding with no token: 200. Adding to the same cart with a customer token: 200 (a cart is not bound to a user). GET of an unknown cart id: 404 `{"message":"Requested item not found"}`. Cart ids are ULIDs. |
| TC-CART-005 quantity edits in UI | Works, with one visual inconsistency (BUG-003). | The input is `product-quantity` with min 1, max 99. 3 gave line and total $42.45 (product $14.15). 99 gave $1,400.85. 100 snapped back to 99. 0 and -1 snapped back to 1. 2.5 gave a PUT /carts/{id}/product/quantity 422 and an alert "The quantity field must be an integer.", but the line showed $35.38 while the total stayed $14.15. A reload showed quantity 1. |
| TC-CAT-007 filters, pagination, default price range | Observed. | The filter panel has Sort (6 options), a Price Range slider (scale 0 to 200, default selection 1 to 100), Search, and 47 checkboxes (categories). Page 2 shows 9 cards. A category checkbox changed the card list. Details below. |
| 404 vs 422 for quantity 0 and unknown product (TC-CART-003) | Explained. | With `Accept: application/json`: quantity 0 gave 422 "The quantity field must be at least 1." and an unknown product gave 422 "The selected product id is invalid." Without that header the API answered 302 to the API root. A client that follows redirects ends with a different status, which matches the 404 seen earlier. Confirmed on CI-hosted. TC-CART-003 now sends the header and asserts 422. |

## Catalog: the default price range hides products

The UI's Price Range slider defaults to 1 to 100 (scale 0 to 200). The unfiltered API returned 59 products. `GET /products?sort=price,desc&between=price,1,100` returned 54 and started at 89.55, which matches the UI list sorted by price descending. The API without `between` started at 178.2, then 172.52, 125.23, 119.24, 100.79. So 5 products above 100 are not shown until the slider is moved. The same 178.2 versus 89.55 difference appeared in the CI-hosted run of TC-CAT-003's first version. Whether the default is intended is a product question, so it is not logged as a bug.

## Notes for follow-up

- TC-CHK-008 (gift card) and TC-CHK-009 (guest UI checkout) now have enough information to be automated.
- A CI-hosted probe (Stage 2C) confirmed: BUG-001 (500 on empty details), BUG-002 at the API level only (logged-in UI cart was empty after the order, unlike the demo guest flow), BUG-003 in the UI, the gift-card format, and the Accept-header explanation for 404 versus 422.
- TC-CHK-007, 008, 009 are now automated, and TC-CART-003 asserts 422 with the header. TC-CHK-007 was later split into TC-CHK-007, 011 and 012 (one per payment method); they are expected failures only while the BUG-001 500 is observed.
- Mobile layout: still not judged.
