# BUG-003: Fractional quantity in the cart shows an updated line price although the server rejects it

| Field | Value |
| --- | --- |
| Severity | Low |
| Status | CONFIRMED IN CI |
| Found by | Scripted probing of the public demo by Claude Code (not a manual session by the repository owner) |
| Triage | Not triaged by the repository owner |
| Related case | TC-CART-005 |
| Automated test | `TC-CART-005 BUG-003 ...` in `tests/cart/cart.desktop.spec.ts` (test.fail, passes while the bug exists) |
| Environment | CI-hosted app at the pinned ref (probe run 40596218053: line $35.38 against total $14.15 in 3 of 3 attempts, desktop Chromium) and the public demo (2026-10-27 UTC) |
| Expected behavior basis | UPSTREAM DOCS: `docs/user-stories/v5.md` at the pinned ref ae7caecb, section "Checkout - Cart Review", AC2: after a quantity change "the item total and cart total are recalculated". The upstream docs do not say how a non-integer quantity should be handled. |

## Steps
1. Add a product priced $14.15 to the cart and open `/checkout`.
2. Type `2.5` into the quantity field (`product-quantity`) and leave the field.

## Expected
The line price and the cart total stay consistent with what the server accepted, or the field is corrected.

## Actual
`PUT /carts/{id}/product/quantity` returns 422, and the page shows the alert "The quantity field must be an integer." The quantity field still shows 2.5 and the line price shows $35.38, while the cart total stays $14.15. After a reload the quantity is 1.

## Evidence
CI-hosted: line $35.38 against total $14.15, and the quantity field stayed 2.5; no alert was captured within 2 s. Scripted run on the demo, 2026-10-27. Quantities 0 and -1 snap back to 1 and 100 snaps back to 99, so only the non-integer case behaves this way.
