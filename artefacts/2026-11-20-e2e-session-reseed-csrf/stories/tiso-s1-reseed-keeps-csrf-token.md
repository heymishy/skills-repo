## Story: Re-seeding the shared E2E test session no longer invalidates the CSRF token of a test that is already running

**Epic reference:** None - short-track (test-support defect; the root cause of a family of intermittent E2E failures found while closing esh-s1 and ctab-s1)
**Discovery reference:** None - short-track skips discovery. Evidence, measured on 2026-11-20: every Playwright test that uses `withAuth` shares one fixed session id (`E2E_SESSION_ID`, `tests/e2e/fixtures/auth.js`), and each test's setup calls `GET /test/session`, which calls `seedTestSession` (`src/web-ui/middleware/session.js`): `_sessions.set(id, Object.assign({}, data))`. That replaces the whole session object, including its `csrfToken`. A test that has already loaded a page (and so holds that page's embedded token) therefore has its token invalidated by whichever test starts next on another worker, and its next POST gets the plain-text 403 `Forbidden` from `csrfGuard`. The page's own script reports this as "Network error - try again", because the body is not JSON. Deterministic proof, one spec and no parallelism: a token fetched from `/products/new` returns 302 on `POST /products/confirm`; after one `GET /test/session` the same token returns 403 `text/plain`. In the parallel run the failing request was `POST /products/fake-product-3/set-default-pod` -> 403 `text/plain` `Forbidden`. Local runs of `frsr-s1` + `ep2-s1` + `ep2-s2` (any spec that creates a product and a feature next to the `ep2` specs) failed an `ep2` spec in 7 of 8 recorded runs, on master too.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [testing] [web-ui-test-support]

## User Story

As **the operator of the platform, who reads the E2E jobs to learn whether a change broke something**,
I want **starting one E2E test not to invalidate the CSRF token of another test that is already running**,
So that **the intermittent CSRF 403 failures stop, and the failing list shows real problems instead of which specs happened to overlap**.

## Benefit Linkage

**Metric moved:** the number of local runs of `frsr-s1` + `ep2-s1` + `ep2-s2` in which an `ep2` spec fails falls from 7 of 8 to 0 of at least 5; the CSRF 403 reproduction above turns from 403 to 302; and the full-suite failing list on one machine (two runs before and two after) loses the specs whose failure is this 403.
**How:** `seedTestSession` keeps the `csrfToken` an existing session already holds when it re-seeds that session, and still replaces every other field with the seed data, so a test that mutated other session state is still reset.

## Architecture Constraints

- Change confined to `seedTestSession` in `src/web-ui/middleware/session.js`, one new node check, one new E2E spec, one capability-matrix entry (the lpw-s2 rule), and artefacts. `src/` changes go through a pull request.
- `seedTestSession` keeps its existing guard (throws outside `NODE_ENV=test` unless `allowOutsideTest`) and its signature. The `/test/session` route is not changed.
- Only the `csrfToken` key is carried over. No other field (`accessToken`, `userId`, `login`, `tenantId`, plan state, anything a test may have set) survives a re-seed, so the "reset after a logout or other mutation" purpose of the re-seed is kept.
- A token is carried over only when the existing session has one; a session without one gets exactly the seed data, and one is created on demand by `generateCsrfToken`, as today.
- No production code path calls `seedTestSession` outside the test and staging-bypass routes; production sessions are not touched.
- Preserve each file's existing line endings.

## Dependencies

- **Upstream:** sec-perf-s3 and rcfc-s1 (CSRF protection on these POSTs), lpw-s2 (the capability matrix), esh-s1 and ctab-s1 (found it).
- **Downstream:** moving `ctab-s1` and the five specs repaired in esh-s1 out of the extended and quarantined lanes (the matrix update the operator asked to do after this story, all together).

## Acceptance Criteria

**AC1:** Given a session id whose stored session holds a `csrfToken`, When `seedTestSession` is called for that id, Then the stored session has the same `csrfToken` as before and all its other fields equal the seed data.
**AC2:** Given a stored session whose seeded fields were changed (a different `login`, `tenantId` or `accessToken`) and which has extra fields, When `seedTestSession` is called again, Then the seeded fields are restored and the extra fields are gone, so a re-seed still resets everything except the CSRF token.
**AC3:** Given a session id with no stored session, or a stored session with no `csrfToken`, When `seedTestSession` is called, Then the stored session is exactly the seed data and has no `csrfToken` key.
**AC4:** Given a page whose embedded CSRF token a test holds, When `GET /test/session` is called (as the next test's setup does) and the test then POSTs with the held token, Then the POST is accepted (302), not rejected with 403; the spec fails against the unchanged code and passes after.
**AC5:** Given `seedTestSession` called outside `NODE_ENV=test` without `allowOutsideTest`, Then it still throws; and the existing session and CSRF checks pass unchanged.
**AC6:** Given `frsr-s1`, `ep2-s1` and `ep2-s2` run together, When run at least five times locally, Then all pass in every run (before: an `ep2` spec failed in 7 of 8 recorded runs).
**AC7:** Given the pull request, When its changed files are listed, Then `src/` has only `middleware/session.js`, and the rest are the new check, the new spec, its matrix entry and artefacts.

## Out of Scope

- Giving each spec its own session and tenant (a larger isolation change for shared data such as journeys and pods; decided afterwards, from what remains failing).
- The leaked-journey counts in `dsa-s2` and `ep1-s4`, the shared roster and pods, and any other shared data.
- The remaining consistent failures (`bmau-s1`, `ep3-s1`, `fpd-s4`, `wuce18`).
- Moving specs between lanes of the capability matrix, which is done after this story, for all of them together.
- `continue-on-error`.

## NFRs

- **Test safety:** the change is reachable only through `seedTestSession`, which refuses to run outside test mode (or the staging bypass); no production session is read or changed.
- **Reliability:** a spec's CSRF token stays valid for as long as its session lives, whatever other specs start.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
