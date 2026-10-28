# Manual exploratory charters

Starting points for manual sessions that the repository owner runs personally. **No session below has been performed.** Record results with [templates/exploratory-session.md](templates/exploratory-session.md), saved as `docs/exploratory-sessions/EX-<date>-<nn>.md`, and add the session to the table at the bottom only after it has really been run.

Prefer the CI-hosted app at the pinned ref (`docker-compose.prod.yml`, see README) for anything that mutates data or can lock an account. Use the public demo only for light read-only checks.

| Charter | Existing manual case | Risk | Environment note |
| --- | --- | --- | --- |
| C1. Explore the login form and the lockout message in the browser with a freshly registered throwaway user, to learn what a user sees after the 3rd and 4th wrong password. | TC-AUTH-006 (P2) | Account lockout is confirmed at API level (423), but the UI wording and behavior are not recorded. | Never use the seeded customer: no lock expiry was observed. |
| C2. Explore expiry of the 300 second token in an open browser session with the dev tools network tab open, to learn what the UI does on its first 401. | TC-AUTH-007 (P3) | Needs a real wait of over 5 minutes; the UI behavior after expiry is UNKNOWN. | Any. |
| C3. Explore cart calls with no login, as a guest in a fresh browser profile with the dev tools open, to learn whether the guest cart survives login and reload. | TC-CART-004 (P3) | API works without a token (one self-hosted run); the browser behavior and persistence are UNKNOWN. | CI-hosted preferred. |
| C4. Explore catalog filters, pagination and layout on a real phone and a desktop browser, to judge usability that emulation cannot show. | TC-CAT-007 (P3) | Pixel 7 emulation exists in the suite; real-device visual validation has not been done. | Public demo is fine (read only). |
| C5. Explore the checkout with each payment method in the UI (credit card, bank transfer, buy now pay later, gift card) with empty and partial details, to see what the user is shown when the API answers 500. | BUG-001 (TC-CHK-007, 011, 012) | The 500 is confirmed at API level; the UI message is not recorded. | CI-hosted preferred; each run creates invoices that cannot be deleted. |

## Sessions performed

| Session ID | Charter | Date | Tester | Notes file |
| --- | --- | --- | --- | --- |
| (none yet) | | | | |
