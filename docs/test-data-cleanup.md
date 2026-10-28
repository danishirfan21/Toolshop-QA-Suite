# Test data cleanup

What each test leaves behind, as read from the code on 2026-10-29. "Deleted" means a test or fixture deletes it. Nothing here was re-run against a live app for this review (no Docker locally); the cart teardown below is new and unverified until CI runs it.

| Data | Created by | Removed how | Left behind on the public demo? |
| --- | --- | --- | --- |
| Products | `adminApi.createProduct` in TC-AUTH-004 | Deleted explicitly: the test deletes it, and `afterEach` calls `deleteProduct` (tolerates 404). `DELETE /products/{id}` returned 204 for admin (docs/app-recon.md). | No, unless a run is killed between create and teardown. |
| Carts created through the API client | `ApiClient.createCart` (cart and checkout API specs) | `ApiClient.dispose()` sends `DELETE /carts/{id}` for each cart it created and only logs unexpected statuses. That endpoint returned 204 once on CI-hosted without a token; it is not verified with a customer token or for a cart that was ordered. | Previously yes. Now expected to be removed; confirm in CI. |
| Carts created by the browser (UI checkout and cart specs) | The front end on add-to-cart | Not deleted: the cart id is held by the browser, not the test. | Yes. Harmless but unmanaged. |
| Invoices | The 201 cases (TC-CHK-001, 002, 005, 006, 008, 009, 010) | Not deleted: no delete endpoint is known for invoices, and none is invented here. | Yes. Each run adds invoices. |
| Registered users | TC-AUTH-003 (one throwaway user per run) | Not deleted: no user delete endpoint is recorded in app-recon, and none is assumed. | Yes. |
| Seeded customer and admin | Seed data | Never modified, except that the unlock in TC-AUTH-003 targets its own throwaway user. Failed-login tests must not use the seeded customer (it would be locked, see docs/app-recon.md 3a). | n/a |

## Disposable CI database

CI runs `php artisan migrate:fresh --seed` on a new MariaDB container for every run, so invoices, users and any carts disappear with the job. Cleanup gaps only matter on a persistent environment, mainly the public demo.

## Limitations

- Because invoices and users cannot be deleted, running the full suite against the public demo mutates a shared environment. The README recommends the self-hosted app. The default `BASE_URL` and `API_URL` still point at the public demo for local runs; set the self-hosted URLs before running mutating specs.
- Teardown runs only when the worker finishes normally; a killed run can leave a product or cart behind.
