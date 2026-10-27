# Checkout test cases (CHK)

User story: As a shopper I can pay for my cart with a payment method and get an invoice number, as a guest or logged in, on desktop and phone.

Environment labels: "CI-hosted" is the self-hosted Toolshop at the pinned TOOLSHOP_REF (the reference). "Demo" is the public demo, which may be a different version.

# Test case: TC-CHK-001 Guest invoice is created

| Field | Value |
| --- | --- |
| ID | TC-CHK-001 |
| Title | Guest invoice is created |
| Priority | P1 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Stable, repeatable, status codes and number format are confirmed in recon. |
| Source (story or recon section) | CHK story; docs/app-recon.md Checkout |

## Preconditions
- A cart with one product exists.
## Test data
- Address: country NL, postcode 1122AB. City and state come from GET /postcode-lookup, never hardcoded.
- Payment: cash-on-delivery with empty details. Guest fields: first name, last name, email (all required).
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | GET /postcode-lookup for NL / 1122AB | 200 with city and state |
| 2 | POST /invoices/guest with the looked-up city, the guest fields and the cart id | 201 |
| 3 | Read invoice_number, billing_city and total | invoice_number matches INV-<digits>; billing_city equals the looked-up city; total is greater than 0 |

## Notes and open questions
- Cart state after the invoice is UNKNOWN. No delete endpoint for invoices is known, so created invoices stay.

# Test case: TC-CHK-002 Logged-in customer invoice is created

| Field | Value |
| --- | --- |
| ID | TC-CHK-002 |
| Title | Logged-in customer invoice is created |
| Priority | P1 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Same stable contract as the guest path, with a bearer token. |
| Source (story or recon section) | CHK story; docs/app-recon.md Checkout |

## Preconditions
- Seeded customer token. A cart with one product exists.
## Test data
- As TC-CHK-001, without guest fields.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | POST /invoices as the customer with the looked-up city | 201 |
| 2 | Read invoice_number | Matches INV-<digits> |

## Notes and open questions
- Confirmed on CI-hosted. Not re-verified on the demo.

# Test case: TC-CHK-003 City that does not match the postcode lookup is rejected

| Field | Value |
| --- | --- |
| ID | TC-CHK-003 |
| Title | City that does not match the postcode lookup is rejected |
| Priority | P1 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Deterministic validation rule confirmed in recon. |
| Source (story or recon section) | CHK story; docs/app-recon.md Checkout |

## Preconditions
- A cart with one product exists.
## Test data
- NL / 1122AB with billing_city "Nowhere".
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | POST /invoices as the customer with the wrong city | 422 |
| 2 | Inspect the raw response JSON | Names billing_country |

## Notes and open questions
- The same checks sent to POST /invoices/guest returned 404 on the public demo for the wrong city (cause UNKNOWN), so the automated case uses the customer endpoint.
- The CI-hosted body has no `errors` key, so the assertion uses the raw JSON text, not a field path.

# Test case: TC-CHK-004 Invalid payment input and missing token are rejected

| Field | Value |
| --- | --- |
| ID | TC-CHK-004 |
| Title | Invalid payment input and missing token are rejected |
| Priority | P1 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Stable validation responses, confirmed on CI-hosted. |
| Source (story or recon section) | CHK story; docs/app-recon.md Checkout |

## Preconditions
- A cart with one product exists.
## Test data
- Payment method "bogus"; gift-card with empty details; POST /invoices with no token.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | POST /invoices as the customer with payment_method "bogus" | 422 naming payment_method |
| 2 | POST /invoices as the customer with gift-card and {} details | 422 naming payment_details.gift_card_number and payment_details.validation_code |
| 3 | POST /invoices with no token | 401 |

## Notes and open questions
- Accepted gift-card format: see TC-CHK-008.

# Test case: TC-CHK-005 Customer pays cash on delivery on desktop

| Field | Value |
| --- | --- |
| ID | TC-CHK-005 |
| Title | Customer pays cash on delivery on desktop |
| Priority | P1 |
| Type | Functional |
| Automation | Automate |
| Reason for automation decision | Core revenue flow; recon confirms the steps and locators. |
| Source (story or recon section) | CHK story; docs/app-recon.md Checkout |

## Preconditions
- Logged in as the seeded customer (storage state), desktop viewport.
## Test data
- One product (first from the API). Address NL / 1122AB, house number 98, street "Test street". City and state from the lookup API.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Open the product page and add it to the cart | The cart POST succeeds |
| 2 | Open /checkout | The cart lists 1 item |
| 3 | Proceed from cart and from sign-in (already logged in) | Address step shown |
| 4 | Fill the address and proceed | Payment step shown |
| 5 | Choose cash on delivery and confirm | Payment success message shown, then the confirmation shows an INV- number |

## Notes and open questions
- The full confirmation text is UNKNOWN, so only the INV- prefix is asserted.
- Postcode auto-fill in the UI is UNKNOWN; city and state are filled explicitly.

# Test case: TC-CHK-006 Customer pays cash on delivery on a phone viewport

| Field | Value |
| --- | --- |
| ID | TC-CHK-006 |
| Title | Customer pays cash on delivery on a phone viewport |
| Priority | P1 |
| Type | Functional |
| Automation | Automate |
| Reason for automation decision | Same flow as TC-CHK-005; it checks that the checkout works at phone width in emulation. |
| Source (story or recon section) | CHK story; docs/app-recon.md Checkout |

## Preconditions
- Pixel 7 emulation (width below 768).
## Test data
- As TC-CHK-005.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Run the TC-CHK-005 steps at phone width | Same expected results; an INV- number is shown |

## Notes and open questions
- Mobile layout details (navigation, field visibility) are UNKNOWN; the test relies on CI to show whether they matter.

# Test case: TC-CHK-007 Credit card, bank transfer and buy-now-pay-later with empty details

| Field | Value |
| --- | --- |
| ID | TC-CHK-007 |
| Title | Credit card, bank transfer and buy-now-pay-later with empty details |
| Priority | P2 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | The test expects 422 and is marked test.fail while BUG-001 is open, so it does not pin the 500 and will flag the fix. |
| Source (story or recon section) | CHK story; docs/app-recon.md Checkout |

## Preconditions
- A cart with one product exists.
## Test data
- Each of the three methods with {}.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | POST /invoices with each method and {} details | 422 (observed 500 on demo and CI-hosted, see BUG-001) |

## Notes and open questions
- BUG-001. The 422 expectation is a tester judgment; the test is test.fail until triaged.

# Test case: TC-CHK-008 Gift card payment accepted format

| Field | Value |
| --- | --- |
| ID | TC-CHK-008 |
| Title | Gift card payment accepted format |
| Priority | P3 |
| Type | Functional |
| Automation | Automate |
| Reason for automation decision | Format answered by upstream docs/gift-card-validation.md at the pinned ref and probed on CI-hosted. |
| Source (story or recon section) | CHK story; docs/app-recon.md UNKNOWN |

## Preconditions
- A cart with one product.
## Test data
- Number: exactly 16 alphanumeric characters. Code: exactly 4. Valid 1234567890123456 / 1A2B; short number 123456789012345; short code 1A2.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | POST /invoices with the valid number and code | 201 |
| 2 | Repeat with the 15 character number | 422 on payment_details.gift_card_number |
| 3 | Repeat with the 3 character code | 422 on payment_details.validation_code |

## Notes and open questions
- Rule taken from upstream docs/gift-card-validation.md.

# Test case: TC-CHK-009 Guest checkout through the UI

| Field | Value |
| --- | --- |
| ID | TC-CHK-009 |
| Title | Guest checkout through the UI |
| Priority | P1 |
| Type | Functional |
| Automation | Automate |
| Reason for automation decision | The guest UI path was walked on the demo and CI-hosted; locators and the confirmation text are known. |
| Source (story or recon section) | CHK story; docs/app-recon.md UNKNOWN |

## Preconditions
- Not logged in.
## Test data
- Guest Guest Shopper, guest.qa@example.com. Address NL / 1122AB / 98, city and state from the lookup.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Add a product, open /checkout, proceed, open the Continue as Guest tab and submit the guest fields | The address step opens |
| 2 | Fill the address, pay cash on delivery | The confirmation shows an INV- number |

## Notes and open questions
- Walked in Stage 2B (docs/exploratory-notes.md).

**Assumptions**
- Postcode NL / 1122AB resolves through /postcode-lookup (Checkout).
- Guest fields guest_first_name, guest_last_name, guest_email are required (Checkout).
- Invoice numbers match INV-<digits> (Checkout).
- The UI flow is cash on delivery via /checkout (Checkout).

**Open questions**
- Accepted gift-card format.
- Cart state after an invoice is created.
- Full order confirmation text.
- Whether the 500 on empty card, bank and installment details is intended.
- Mobile layout details of the checkout.
- Cause of the earlier intermittent checkout failure (not reproduced in 15, 20 and 30 repeats).
