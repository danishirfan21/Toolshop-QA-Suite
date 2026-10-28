# Checkout test review (2026-10-29)

A code read of `pages/checkout.page.ts`, `tests/checkout/` and the checkout API spec. Nothing in this review was executed against a live app (no Docker locally), so every point is a code-reading judgment, not an observation.

## Kept as is

- `addProductToCart` waits for the add-item `POST /carts/{id}` response before returning, which is the synchronization added after the flake in docs/app-recon.md (2d). The root cause of that flake is still UNKNOWN: it did not reproduce in 15, 20 and 30 repeats, and the link between the cancelled `POST /carts` and the empty cart was never proven. The wait is a plausible mitigation, not a proven fix.
- No fixed sleeps and no raised timeouts anywhere in the checkout flow.

## Changed

- The UI checkout specs fetched the postcode lookup with `call(...).json()` and no status check, so a failed lookup produced `undefined` city and state and a confusing downstream failure. They now use `ApiClient.postcodeLookup`, which throws with the real status.
- API-created carts are deleted in fixture teardown on a best-effort basis (docs/test-data-cleanup.md).

## Remaining weaknesses (not changed, no evidence to justify a change yet)

- `expectCartHasItems(1)` counts rows; it does not check that the row is the product that was added. A leftover item would pass. Asserting the product name needs the cart row's text to be confirmed first.
- `expectOrderConfirmed` asserts only that the confirmation contains `INV-`. The API contract is `INV-<digits>`, but the UI text is not confirmed to match it, so the stricter pattern was not applied.
- `fillAddress` waits for `postcode-lookup-loading` to have count 0. If the check runs before the indicator appears it passes immediately, so the auto-fill could still arrive afterwards. The test fills city and state with the same looked-up values, so the outcome is unaffected today, but the wait does not prove the lookup finished.
- TC-CHK-005, 006 and 009 share the same address and steps by design (desktop, phone, guest). The mobile test confirms only that the flow works in Pixel 7 emulation; layout was not judged.
