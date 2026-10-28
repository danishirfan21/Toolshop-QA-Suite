# Authentication and role access test cases (AUTH)

User story: As a user I can log in and am locked out after repeated failures; a customer cannot do admin actions.

Environment labels: "CI-hosted" is the self-hosted Toolshop at the pinned TOOLSHOP_REF (the reference). "Demo" is the public demo.

# Test case: TC-AUTH-001 Valid login returns a bearer token

| Field | Value |
| --- | --- |
| ID | TC-AUTH-001 |
| Title | Valid login returns a bearer token |
| Priority | P1 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Stable contract confirmed in recon. |
| Source (story or recon section) | AUTH story; docs/app-recon.md Authentication |

## Preconditions
- Seeded customer exists.
## Test data
- Seeded customer credentials from the environment configuration.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | POST /users/login with valid credentials | 200 |
| 2 | Read the body | token_type is bearer, expires_in is 300, access_token is a string |

## Notes and open questions
- Behavior after the token expires is UNKNOWN.

# Test case: TC-AUTH-002 Invalid logins are rejected

| Field | Value |
| --- | --- |
| ID | TC-AUTH-002 |
| Title | Invalid logins are rejected |
| Priority | P1 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Stable error shapes confirmed in recon. Uses an unknown email and an empty body so it never counts failures against the seeded customer for long. |
| Source (story or recon section) | AUTH story; docs/app-recon.md Authentication |

## Preconditions
- None.
## Test data
- Unknown email "nobody@example.com". Empty body.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | POST /users/login with an unknown email | 401 {"error":"Unauthorized"} |
| 2 | POST /users/login with an empty body | 401 {"error":"Invalid login request"} |

## Notes and open questions
- A wrong password on the seeded customer also gives 401, but it counts toward lockout on a shared user, so it is not used in automation.

# Test case: TC-AUTH-003 Account locks after repeated failures and an admin can unlock it

| Field | Value |
| --- | --- |
| ID | TC-AUTH-003 |
| Title | Account locks after repeated failures and an admin can unlock it |
| Priority | P1 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Deterministic on CI-hosted; runs on a freshly registered throwaway user so shared accounts are never locked. |
| Source (story or recon section) | AUTH story; docs/app-recon.md Authentication |

## Preconditions
- Admin token available.
## Test data
- A throwaway user registered through /users/register with a unique email.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Log in with the right password | 200 |
| 2 | Log in with a wrong password three times | 401 each time |
| 3 | Log in with a wrong password a fourth time | 423 |
| 4 | Log in with the right password | 423 (still locked; no expiry seen within 2 h) |
| 5 | Admin PATCH /users/{id} with failed_login_attempts 0 | 200 |
| 6 | Log in with the right password | 200 |

## Notes and open questions
- Confirmed on CI-hosted. The lock does not expire in the observed window. Demo behavior is not verified.
- There is no user delete endpoint known, so throwaway users remain.

# Test case: TC-AUTH-004 Customer cannot delete a product, admin can

| Field | Value |
| --- | --- |
| ID | TC-AUTH-004 |
| Title | Customer cannot delete a product, admin can |
| Priority | P1 |
| Type | API |
| Automation | Automate |
| Reason for automation decision | Core role-access check, stable status codes. Test data is created and removed through the admin API. |
| Source (story or recon section) | AUTH story; docs/app-recon.md Admin product create, update, delete |

## Preconditions
- Admin and customer tokens.
## Test data
- A product created by the admin through the API for this test.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Customer DELETE /products/{id} | 403 |
| 2 | Admin GET /products/{id} | 200 (product survives) |
| 3 | Admin DELETE /products/{id} | 204 |
| 4 | Admin GET /products/{id} | 404 |

## Notes and open questions
- Customer 403 body is {message:"Forbidden"} on CI-hosted.

# Test case: TC-AUTH-005 Customer logs in through the UI

| Field | Value |
| --- | --- |
| ID | TC-AUTH-005 |
| Title | Customer logs in through the UI |
| Priority | P1 |
| Type | UI |
| Automation | Automate |
| Reason for automation decision | The login form locators are known and the login is already exercised by setup. Valid credentials only. |
| Source (story or recon section) | AUTH story; docs/app-recon.md Authentication |

## Preconditions
- Not logged in (plain browser context).
## Test data
- Seeded customer credentials.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Open /auth/login | The login form is visible |
| 2 | Submit valid credentials | The page leaves /auth/login, the JWT is stored in localStorage `auth-token`, and `GET /users/me` with that token returns 200 |

## Notes and open questions
- The exact landing page is UNKNOWN, so it is not asserted. Authentication is shown by the stored token and `GET /users/me` (docs/app-recon.md, Front end storage and Authentication), not by any visible UI element, because no authenticated UI locator has been confirmed.

# Test case: TC-AUTH-006 Lockout through the UI

| Field | Value |
| --- | --- |
| ID | TC-AUTH-006 |
| Title | Lockout through the UI |
| Priority | P2 |
| Type | UI |
| Automation | Keep manual |
| Reason for automation decision | UI message for a locked account is UNKNOWN, and repeated failures would lock a user; needs a throwaway account. |
| Source (story or recon section) | AUTH story; docs/app-recon.md UNKNOWN |

## Preconditions
- A throwaway user.
## Test data
- Wrong password repeatedly.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Fail login in the UI four times | UNKNOWN (what the user sees on the 423) |

## Notes and open questions
- Candidate for Stage 2B manual exploration.

# Test case: TC-AUTH-007 Token expiry after 300 seconds

| Field | Value |
| --- | --- |
| ID | TC-AUTH-007 |
| Title | Token expiry after 300 seconds |
| Priority | P3 |
| Type | API |
| Automation | Keep manual |
| Reason for automation decision | Needs a 5 minute wait and the expiry response is UNKNOWN; a fixed sleep is not allowed. |
| Source (story or recon section) | AUTH story; docs/app-recon.md Authentication |

## Preconditions
- A fresh token.
## Test data
- None.
## Steps
| # | Action | Expected result |
| --- | --- | --- |
| 1 | Use the token after 300 s | UNKNOWN |

## Notes and open questions
- Open.

**Assumptions**
- Seeded accounts and credentials are as listed in Seeded accounts.
- Login contract and lockout as in Authentication (CI-hosted).
- Admin PATCH with failed_login_attempts unlocks (Authentication).
- Role split on product delete (Admin product create, update, delete).

**Open questions**
- UI behavior on a locked account.
- What happens when a token expires.
- Whether the lock ever expires.
- Whether lockout behaves the same on the demo.
