# Catalog test cases (CAT)

User story: As a shopper I can browse, sort and search the product catalog on desktop and phone.

Environment labels: "CI-hosted" is the self-hosted Toolshop at the pinned TOOLSHOP_REF (the reference). "Demo" is the public demo. UI sort and search behavior was probed on the demo only, so CI is the first confirmation on CI-hosted.

# Test case: TC-CAT-001 Product list envelope and price sort

| Field | Value |
| --- | --- |
| ID | TC-CAT-001 |
| Title | Product list envelope and price sort |
| Priority | P2 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Stable contract, no data dependency on counts. |
| Source (story or recon section) | CAT story; docs/app-recon.md Products |

## Preconditions
- None.
## Test data
- None.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | GET /products | 200; per_page is 9; data has at most 9 items; total and last_page present |
| 2 | GET /products?sort=price,desc | 200; prices are in descending order |

## Notes and open questions
- Totals (50 products, 6 pages) were seen on the demo only, so they are not asserted.

# Test case: TC-CAT-002 Empty results for no match and unknown category

| Field | Value |
| --- | --- |
| ID | TC-CAT-002 |
| Title | Empty results for no match and unknown category |
| Priority | P2 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Stable behavior confirmed in recon. |
| Source (story or recon section) | CAT story; docs/app-recon.md Products |

## Preconditions
- None.
## Test data
- Search term "zzzznomatch"; category "x".
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | GET /products/search?q=zzzznomatch | 200; data is [] |
| 2 | GET /products?by_category=x | 200; data is [] |

## Notes and open questions
- None.

# Test case: TC-CAT-003 Sort by price descending in the UI (desktop)

| Field | Value |
| --- | --- |
| ID | TC-CAT-003 |
| Title | Sort by price descending in the UI (desktop) |
| Priority | P2 |
| Type | UI |
| Automation | Automate |
| Reason for automation decision | Sort select values and price element are known from the demo; the expected first price comes from the API, not a literal. |
| Source (story or recon section) | CAT story; docs/app-recon.md Products |

## Preconditions
- Home page loaded, desktop viewport.
## Test data
- Expected highest price from GET /products?sort=price,desc, first item.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Select the sort option "price,desc" | The list reloads |
| 2 | Read the first card price | Equals the API's highest price |

## Notes and open questions
- UI option values are from the demo. Not yet confirmed on CI-hosted.

# Test case: TC-CAT-004 Search by product name in the UI (desktop)

| Field | Value |
| --- | --- |
| ID | TC-CAT-004 |
| Title | Search by product name in the UI (desktop) |
| Priority | P2 |
| Type | UI |
| Automation | Automate |
| Reason for automation decision | Search caption and card locators are known; the term is taken from the API, so no counts are hardcoded. |
| Source (story or recon section) | CAT story; docs/app-recon.md Products |

## Preconditions
- Home page loaded, desktop viewport.
## Test data
- The first product's name from the API.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Type the name in the search box and submit | The caption contains the term |
| 2 | Read the product names | The searched product is listed |

## Notes and open questions
- On the demo, "hammer" gave 6 results and reset restored 9 cards. Those counts are demo-only and are not asserted.

# Test case: TC-CAT-005 Browse the catalog on a phone

| Field | Value |
| --- | --- |
| ID | TC-CAT-005 |
| Title | Browse the catalog on a phone |
| Priority | P3 |
| Type | UI |
| Automation | Automate |
| Reason for automation decision | Cheap check that the first page renders 9 cards at phone width (Pixel 7 emulation). |
| Source (story or recon section) | CAT story; docs/app-recon.md Products |

## Preconditions
- Pixel 7 emulation.
## Test data
- None.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Open the home page | 9 product cards are listed |

## Notes and open questions
- Layout beyond the card count is UNKNOWN.

# Test case: TC-CAT-006 Search on a phone

| Field | Value |
| --- | --- |
| ID | TC-CAT-006 |
| Title | Search on a phone |
| Priority | P3 |
| Type | UI |
| Automation | Automate |
| Reason for automation decision | Responsive layout matters here; whether the search box is directly visible on a phone is UNKNOWN, so CI shows it. |
| Source (story or recon section) | CAT story; docs/app-recon.md UNKNOWN |

## Preconditions
- Pixel 7 emulation.
## Test data
- The first product's name from the API.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Search by the name | The caption contains the term and the product is listed |

## Notes and open questions
- If the search box is hidden behind a menu on phones, this case needs a rewrite after review.

# Test case: TC-CAT-007 Filters, pagination and layout judgment

| Field | Value |
| --- | --- |
| ID | TC-CAT-007 |
| Title | Filters, pagination and layout judgment |
| Priority | P3 |
| Type | UI |
| Automation | Keep manual |
| Reason for automation decision | Visual and usability judgment on real devices; filter UI behavior was not probed. |
| Source (story or recon section) | CAT story; docs/app-recon.md UNKNOWN |

## Preconditions
- None.
## Test data
- UNKNOWN
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Use category and brand filters, page 2, and the other sort options | UNKNOWN |

## Notes and open questions
- API ?page=2 and ?between=price,1,20 returned 200 on the demo. UI behavior is for Stage 2B.

**Assumptions**
- Envelope fields and sort/search endpoints as in Products (demo).
- UI sort values and the product-price, search-caption locators were read on the demo.

**Open questions**
- Do the UI sort and search behave the same on CI-hosted?
- Mobile layout: is search or sort hidden behind a menu?
- Filter and pagination UI behavior.
