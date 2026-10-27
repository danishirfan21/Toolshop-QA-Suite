# BUG-002: The cart still holds its items after a successful order

| Field | Value |
| --- | --- |
| Severity | Medium |
| Status | Open, candidate (demo only, not yet confirmed on CI-hosted) |
| Related case | TC-CHK-001, TC-CHK-005 |
| Environment | Public demo, 2026-10-27 UTC. CI-hosted not checked. |

## Steps (UI)
1. As a guest, add a product, go to `/checkout`, continue as guest, fill the address (NL / 1122AB / 98), pay cash on delivery.
2. See "Thanks for your order! Your invoice number is INV-...".
3. Look at the cart badge, then open `/checkout` again.

## Steps (API)
1. Create a cart, add a product, `POST /invoices` (201).
2. `GET /carts/{id}`.

## Expected
An ordered cart is emptied or no longer usable, so the same items are not ordered twice. This expectation is my assumption; the recon and the upstream docs I read do not state it.

## Actual
- UI: the badge showed 1 right after the order, and `/checkout` listed 1 row afterwards.
- API: `GET /carts/{id}` returned 200 with `cart_items` still containing the product.

## Evidence
Scripted runs on the demo on 2026-10-27, output recorded in `docs/exploratory-notes.md`.
