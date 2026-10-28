# BUG-002: The cart still holds its items after a successful order

| Field | Value |
| --- | --- |
| Severity | Medium |
| Status | CONFIRMED IN CI |
| Found by | Scripted probing of the public demo by Claude Code (not a manual session by the repository owner) |
| Triage | Not triaged by the repository owner |
| Scope | API level only. The logged-in UI on CI-hosted showed an empty cart after the order. |
| Related case | TC-CHK-010 (also TC-CHK-001, TC-CHK-005) |
| Automated test | `TC-CHK-010 BUG-002 ...` in `tests/api/checkout.api.spec.ts` (test.fail, passes while the bug exists) |
| Environment | CI-hosted app at the pinned ref (probe run 40596218053: `GET /carts/{id}` returned 200 with 1 item after a 201 invoice, 3 of 3 attempts) and the public demo (2026-10-27 UTC) |
| Expected behavior basis | UPSTREAM DOCS: `docs/user-stories/v5.md` at the pinned ref ae7caecb, section "Checkout - Payment (Advanced)", AC9: after a successful order "the cart is cleared". The statement is written for the checkout UI; the upstream docs do not describe the API cart endpoints after an invoice. |

## Steps (UI)
1. As a guest, add a product, go to `/checkout`, continue as guest, fill the address (NL / 1122AB / 98), pay cash on delivery.
2. See "Thanks for your order! Your invoice number is INV-...".
3. Look at the cart badge, then open `/checkout` again.

## Steps (API)
1. Create a cart, add a product, `POST /invoices` (201).
2. `GET /carts/{id}`.

## Expected
An ordered cart is emptied or no longer usable, so the same items are not ordered twice. The upstream user story states the cart is cleared after a successful order (see the basis line above).

## Actual
- UI: the badge showed 1 right after the order, and `/checkout` listed 1 row afterwards.
- API: `GET /carts/{id}` returned 200 with `cart_items` still containing the product (demo and CI-hosted).
- UI on CI-hosted, logged in: after the order the badge was absent and `/checkout` had 0 rows, so the UI does not show the problem in that flow. The demo guest flow did show it. Whether the difference is the guest versus logged-in flow or the app version is not established.

## Open question for developers
The UI cart is empty after an order while the API cart persists, so is cart cleanup the API's or the client's responsibility?

## Evidence
Scripted runs on the demo on 2026-10-27, output recorded in `docs/exploratory-notes.md`.
