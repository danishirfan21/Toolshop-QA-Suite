# Cart test cases (CART)

User story: As a shopper I can add products to a cart and invalid quantities are rejected.

Environment labels: "CI-hosted" is the self-hosted Toolshop at the pinned TOOLSHOP_REF (the reference). "Demo" is the public demo.

# Test case: TC-CART-001 Added item appears in the cart

| Field | Value |
| --- | --- |
| ID | TC-CART-001 |
| Title | Added item appears in the cart |
| Priority | P2 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Stable contract confirmed in recon. |
| Source (story or recon section) | CART story; docs/app-recon.md Cart |

## Preconditions
- A new cart created through POST /carts.
## Test data
- First product from the API, quantity 2.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | POST /carts/{id} with the product and quantity 2 | 200 |
| 2 | GET /carts/{id} | 200; cart_items has one item with that product id and quantity 2 |

## Notes and open questions
- None.

# Test case: TC-CART-002 Quantity boundary 99 accepted and 100 rejected

| Field | Value |
| --- | --- |
| ID | TC-CART-002 |
| Title | Quantity boundary 99 accepted and 100 rejected |
| Priority | P2 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Boundary confirmed on CI-hosted when the Accept: application/json header is sent. |
| Source (story or recon section) | CART story; docs/app-recon.md Cart |

## Preconditions
- A new cart.
## Test data
- Header Accept: application/json. Quantities 99 and 100.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Add the product with quantity 99 | 200 |
| 2 | Add the product with quantity 100 (no redirects followed) | 422 mentioning quantity |

## Notes and open questions
- Without the Accept header, 100 and -1 gave a 302 HTML redirect on CI-hosted. That is not asserted.

# Test case: TC-CART-003 Quantity 0 and an unknown product are rejected

| Field | Value |
| --- | --- |
| ID | TC-CART-003 |
| Title | Quantity 0 and an unknown product are rejected |
| Priority | P2 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Rejection is stable. With the JSON Accept header the status is 422 (confirmed on CI-hosted). |
| Source (story or recon section) | CART story; docs/app-recon.md Cart |

## Preconditions
- A new cart.
## Test data
- Quantity 0 with a valid product; product id "does-not-exist" with quantity 1.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Add the valid product with quantity 0, sending Accept: application/json | 422 mentioning quantity |
| 2 | Add the unknown product, same header | 422 mentioning the product |

## Notes and open questions
- Recon first saw 422 and later 404 {"message":"Resource not found"}. Cause found (docs/exploratory-notes.md): without Accept: application/json the API answers 302 to the API root, and a redirect-following client then sees 404. The test sends the header and does not follow redirects.

# Test case: TC-CART-004 Cart works without a token

| Field | Value |
| --- | --- |
| ID | TC-CART-004 |
| Title | Cart works without a token |
| Priority | P3 |
| Type | API |
| Automation | Keep manual |
| Reason for automation decision | Whether anonymous carts are intended is a product question; it works on CI-hosted, but the test would pin an unreviewed rule. |
| Source (story or recon section) | CART story; docs/app-recon.md Cart |

## Preconditions
- None.
## Test data
- None.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Create, fill, read and delete a cart without a token | Observed 201, 200, 200, 204 on CI-hosted; intended behavior UNKNOWN |

## Notes and open questions
- Anyone who knows a cart id can change it. Worth a manual security look in Stage 2B.

# Test case: TC-CART-005 Cart quantity edits in the UI

| Field | Value |
| --- | --- |
| ID | TC-CART-005 |
| Title | Cart quantity edits in the UI |
| Priority | P2 |
| Type | UI |
| Automation | Automate |
| Reason for automation decision | Only the fractional quantity check is automated, as a test.fail for BUG-003 (reproduced on CI-hosted). Other quantity edits were explored manually, see docs/exploratory-notes.md. |
| Source (story or recon section) | CART story; docs/exploratory-notes.md |

## Preconditions
- A product in the cart.
## Test data
- Quantity 2.5 typed into product-quantity.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Type 2.5 into the quantity field and leave it | The line price equals the cart total (observed: PUT 422, line $35.38, total $14.15, see BUG-003) |

## Notes and open questions
- Marked test.fail while BUG-003 is open.

**Assumptions**
- Cart endpoints and responses as in Cart.
- The 99/100 boundary applies with the JSON Accept header (Cart).

**Open questions**
- Why quantity 0 and unknown product returned 422 once and 404 later.
- Whether anonymous carts are intended.
- Whether a fractional quantity should be corrected by the UI.
