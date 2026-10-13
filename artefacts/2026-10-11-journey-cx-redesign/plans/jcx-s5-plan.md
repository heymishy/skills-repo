# Implementation Plan: Authorization and tenant-scoping verification across the placeholder-trigger and mapping-conversion surface

**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s5.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s5-test-plan.md
**DoR:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s5-dor.md

## Summary

Verification-only story. No new production code is expected. One new test file: `tests/check-jcx-s5-authorization.js`, with 4 integration tests (AC1–AC4). AC5 is verified by the full suite run at merge, not a dedicated test.

Pre-read findings (confirming the DoR's own expectations before writing tests):
- `src/web-ui/server.js` lines 4105–4123: both `POST /journeys/:id/stages/:stageId/placeholder-features` and `POST /journeys/:id/stages/:stageId/placeholder-features/:mappingId/trigger` are already wired through `authGuard` → `requireNonViewer` → handler, matching every other mutating route in this file. AC3 is expected to confirm this wiring already holds, not to find and fix a gap.
- `check-jcx-s1-placeholder-feature.js` already has handler-level cross-tenant tests for both routes (404, zero mutation). jcx-s5's AC1/AC2 tests are dedicated story-level confirmations of the same behaviour, kept in this story's own file per the test plan, not a duplicate-detection exercise.
- `handleGetJourneyCanvas` (journeys.js:661) runs its own tenant-scoped `customer_journeys` SELECT (line 703) and returns 404 **before** `checkPlaceholderConversions` is ever called (line 734). A cross-tenant journey id therefore 404s with zero conversion attempted — this is the exact mechanism AC4 verifies.
- `check-vrne-s4-edge-case-gate.js` (lines 117–207) has the exact real-dispatch harness AC3 must reuse: env vars set before requiring `../src/web-ui/server`, `router`/`seedTestSession` imports, `integrationMockRes()`, `dispatchAndAwaitResponse(req)`, and `seedMultiUserRolesForIntegrationTest(sharedOrg)` via `/test/seed-multi-user-roles`. Session id must be hex-only and distinct from `faceb00c04` (already used by vrne-s4) and any other hardcoded session id in the suite.

## Tasks

### Task 1: AC1 — cross-tenant placeholder-feature creation, dedicated story-level test
- Write a test in `tests/check-jcx-s5-authorization.js` calling `handlePostPlaceholderFeature` directly with a mock pool, a stage owned by tenant A, and a session for tenant B.
- Assert: response status 404, zero `INSERT` calls recorded against the mock pool.
- Reuse the mock-pool shape from `check-jcx-s1-placeholder-feature.js`'s own `makeMockPool` (new local copy in this file — no shared helper module exists yet, matching this session's own established per-file convention).

### Task 2: AC2 — cross-tenant trigger, dedicated story-level test
- Write a test calling `handleTriggerPlaceholderFeature` directly with a mapping owned by tenant A, a session for tenant B, and a scratch `repoRoot` (via `fs.mkdtempSync`).
- Assert: response status 404; no `artefacts/` folder created under the scratch root at all.
- Clean up the scratch dir after the assertion (`fs.rmSync(..., { recursive: true, force: true })`), matching every other scratch-dir test in this session.

### Task 3: AC3 — viewer-role session denied via real server.js dispatch
- Reuse `check-vrne-s4-edge-case-gate.js`'s own harness verbatim: set `NODE_ENV=test` + fake OAuth env vars + delete `POSTHOG_KEY`/`DATABASE_URL` before `require('../src/web-ui/server')`.
- Seed a viewer-role session via `/test/seed-multi-user-roles` (new, distinct `sharedOrg` value) then `seedTestSession` with `login: 'e2e-viewer'` and a new hex-only session id not used elsewhere in the suite (e.g. `'5ec5b5a1a5'`).
- Dispatch two real requests through `router(req, res)`: one to the placeholder-creation route, one to the trigger route (both with the viewer session cookie).
- Assert both return 403.
- No request body is needed — `requireNonViewer` denies before either handler reads `req.body`.

### Task 4: AC4 — cross-tenant mapping-conversion, no partial conversion
- Write a test calling `handleGetJourneyCanvas` directly with a mock pool, a journey owned by tenant A, and a session for tenant B.
- Assert: response status 404; zero `UPDATE ... mapping_state = 'linked'` calls recorded against the mock pool (confirming `checkPlaceholderConversions` never ran).
- Reuse the canvas mock-pool shape from `check-jcx-s1-placeholder-feature.js`'s own `makeCanvasMockPool` (new local copy in this file).

### Task 5: Run full suite, verify no regression (AC5), clean up
- Run `npm test` in the worktree; confirm 0 failures across the full suite (not just the new file).
- Run the new file in isolation first to confirm all 4 tests pass before the full run.
- Verify in a Linux/Node 24 Docker container before pushing, matching this session's own established practice (the AC2/path-traversal class of platform-dependent failure in `jcx-s1` was only caught this way).

## Expected file changes

- **New:** `tests/check-jcx-s5-authorization.js`
- **No production code changes expected.** If Task 1–4 reveal a genuine gap (not expected, per the pre-read findings above), fix it in `jcx-s1`/`jcx-s2`'s own code directly — per the DoR's explicit constraint — and note the fix as a deviation in the DoD, not as new scope.

## Risks

- If AC3's real-dispatch test reveals `requireNonViewer` is NOT actually reached (e.g. a routing regex mismatch), that is a genuine production bug in `jcx-s1`'s own route wiring and must be fixed directly, not worked around. Pre-read above found the wiring already correct, so this is not expected.
