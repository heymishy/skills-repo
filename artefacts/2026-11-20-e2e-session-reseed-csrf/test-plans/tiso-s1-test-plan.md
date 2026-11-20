## Test Plan: Re-seeding the shared E2E test session no longer invalidates the CSRF token of a test that is already running

**Story reference:** artefacts/2026-11-20-e2e-session-reseed-csrf/stories/tiso-s1-reseed-keeps-csrf-token.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Test runner (read from package.json and playwright.config.js):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-tiso-s1-reseed-keeps-csrf-token.js`, plain Node, calling `seedTestSession` and `getSession` from `src/web-ui/middleware/session.js` directly. New E2E spec: `tests/e2e/tiso-s1-reseed-keeps-csrf.spec.js`, Playwright, outside the `npm test` chain (ADR-018), run with `NODE_ENV=test`, `E2E_LOCAL_SUITE=true` and `npx playwright test <file>`, using the `withAuth` and `getCsrfToken` fixtures.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Re-seeding keeps the CSRF token, other fields equal the seed | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Re-seeding still resets mutated and extra fields | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | No session, or no token: exactly the seed data | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | A token held before `GET /test/session` still works after | - | - | 1 (T-E1) | - | - | 🟢 |
| AC5 | Guard outside test mode unchanged; existing session and CSRF checks pass | 1 (T4) + existing | - | - | - | - | 🟢 |
| AC6 | `frsr-s1` + `ep2-s1` + `ep2-s2` pass together, at least 5 runs | - | - | existing (3 specs) | 1 (M1) | Needs repeated runs | 🟡 |
| AC7 | Changed files are as stated | - | - | - | 1 (M2) | Diff check | 🟢 |

AC6 is yellow because it is a repeated-run measurement of a timing-dependent failure: a pass in 5 of 5 is strong evidence given 7 of 8 failures before, but not a proof; the deterministic proof is T-E1.

## Red-first plan

T1 fails before the change (the stored session loses its token). T-E1 fails before the change (the POST after the re-seed returns 403, reproduced on 2026-11-20 with a probe). T2, T3 and T4 pass before and after: they pin what must not change (the reset of other fields, the no-token case, the guard). Each is run before the change and the failing result is recorded in the pull request.

## Tests

- **T1 (AC1):** seed id A with `{ login: 'a' }`; set `getSession(A).csrfToken = 'tok'`; seed A again with `{ login: 'a' }`; assert `csrfToken === 'tok'` and `login === 'a'`.
- **T2 (AC2):** seed A with `{ login: 'a', tenantId: 't', accessToken: 'x' }`; mutate `login`, `tenantId`, add `planState: 'paid'` and a `csrfToken`; seed A again; assert `login`, `tenantId`, `accessToken` are the seed values, `planState` is absent and `csrfToken` is kept.
- **T3 (AC3):** seed a fresh id B: the session has exactly the seed fields and `'csrfToken' in session` is false; seed an id whose session has no token: still no `csrfToken` key.
- **T4 (AC5):** with `NODE_ENV` set to something other than `test`, `seedTestSession(id, data)` throws, and with `{ allowOutsideTest: true }` it does not; `NODE_ENV` is restored afterwards.
- **T-E1 (AC4):** with `withAuth`, post the draft to `/products/new`, fetch a token with `getCsrfToken`, `POST /products/confirm` with it and assert 302; call `GET /test/session`; `POST /products/confirm` again with the same token (new product name) and assert 302 (before the change: 403, `text/plain`).

## Manual steps

- **M1 (AC6):** run `npx playwright test tests/e2e/frsr-s1-feature-row-session-resume.spec.js tests/e2e/ep2-s1-presence-sidebar.spec.js tests/e2e/ep2-s2-stage-visibility.spec.js` at least five times; record the pass or fail of each run (before: an `ep2` spec failed in 7 of 8 recorded runs). Also run the whole local suite twice before and twice after on the same machine and compare the failing sets (the local machine has about 20 extra failures of its own; only the difference matters).
- **M2 (AC7):** `git diff --stat master...HEAD` lists only `src/web-ui/middleware/session.js`, the new check, the new spec, `tests/e2e/capability-matrix.json` and artefacts.
- Run the whole `npm test` and `scripts/ci-test-regression-check.js` before pushing, not only the checks that mention the file (the lesson from ctab-s1).

## Deliberate updates to existing tests

None expected. If an existing check pins the replace-everything behaviour of `seedTestSession`, it is updated deliberately and listed in the pull request.
