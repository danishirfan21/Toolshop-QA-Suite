# BUG-003: Fractional quantity in the cart shows an updated line price although the server rejects it

| Field | Value |
| --- | --- |
| Severity | Low |
| Status | Open, candidate (reproduced on demo and CI-hosted) |
| Related case | TC-CART-005 |
| Environment | Public demo 2026-10-27 UTC and CI-hosted app at the pinned ref (probe run), desktop Chromium. |

## Steps
1. Add a product priced $14.15 to the cart and open `/checkout`.
2. Type `2.5` into the quantity field (`product-quantity`) and leave the field.

## Expected
The line price and the cart total stay consistent with what the server accepted, or the field is corrected.

## Actual
`PUT /carts/{id}` returns 422, and the page shows the alert "The quantity field must be an integer." The quantity field still shows 2.5 and the line price shows $35.38, while the cart total stays $14.15. After a reload the quantity is 1.

## Evidence
CI-hosted: line $35.38 against total $14.15, and the quantity field stayed 2.5; no alert was captured within 2 s. Scripted run on the demo, 2026-10-27. Quantities 0 and -1 snap back to 1 and 100 snaps back to 99, so only the non-integer case behaves this way.
