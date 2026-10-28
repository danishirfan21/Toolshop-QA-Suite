# BUG-001: Invoice with empty or partial payment details returns 500 instead of a validation error

| Field | Value |
| --- | --- |
| Severity | Medium |
| Status | CONFIRMED IN CI |
| Found by | Scripted probing of the public demo by Claude Code (not a manual session by the repository owner) |
| Triage | Not triaged by the repository owner |
| Related cases | TC-CHK-007 (credit-card), TC-CHK-011 (bank-transfer), TC-CHK-012 (buy-now-pay-later) |
| Automated tests | `TC-CHK-007`, `TC-CHK-011`, `TC-CHK-012` (`BUG-001 ...`) in `tests/api/checkout.api.spec.ts`: one independent test per method, each with its own cart. Each is marked as an expected failure only when it observes a 500 with the body `Something went wrong`; a 401, 201 or other error fails normally, and a 422 passes. |
| Environment | CI-hosted app at the pinned ref (CI probe run 40596218053: credit-card with `{}` returned 500 in 3 of 3 attempts; the automated tests cover all three methods) and the public demo (2026-10-27 UTC) |
| Expected behavior basis (required fields) | UPSTREAM DOCS: `docs/user-stories/v5.md` at the pinned ref ae7caecb, section "Checkout - Payment (Advanced)", AC2 and AC3 list required fields for bank transfer and credit card. |
| Expected behavior basis (422 instead of 500) | TESTER JUDGMENT: the upstream docs do not state an HTTP status. |

## Steps
1. Log in as the customer and create a cart with one product.
2. Look up NL / 1122AB through `GET /postcode-lookup`.
3. `POST /invoices` with `payment_method` set to `credit-card`, `bank-transfer` or `buy-now-pay-later` and `payment_details: {}` (a billing address with the looked-up city and a valid cart id).

## Expected
A 422 naming the missing payment details, as gift-card does ("payment_details.gift_card_number" and "payment_details.validation_code").

## Actual
500 `{"message":"Something went wrong"}`. Also 500 for credit-card with only `credit_card_number`. For comparison: cash-on-delivery with `{}` gives 201, and omitting `payment_details` entirely gives 422.

## Evidence
- Demo, 2026-10-27: all three methods with `{}` returned 500; credit-card partial returned 500.
- CI-hosted: the same 500 was recorded in recon and again in probe run 40596218053.
- Upstream `StoreInvoice` at the pinned ref only requires `payment_details` to be present, plus format rules for gift-card; there are no rules for the other methods, which fits the 500 coming from later code. This is an inference from the file, not a confirmed cause.
