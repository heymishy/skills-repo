# Implementation Plan: cpr-s1 — Close the CSRF-persist race with process suspend

**Story:** artefacts/2026-08-27-csrf-persist-race-on-suspend/stories/cpr-s1-await-csrf-persist-before-response.md
**Test plan:** artefacts/2026-08-27-csrf-persist-race-on-suspend/test-plans/cpr-s1-test-plan.md
**DoR:** artefacts/2026-08-27-csrf-persist-race-on-suspend/dor/cpr-s1-dor.md
**Decision:** Option A (decisions.md) — await end-to-end
**Worktree:** .worktrees/cpr-s1 (branch `cpr-s1`, based on origin/master)

---

## Tasks

### Task 1 — Core fix: `persistSession` + `generateCsrfToken`
- `session.js`: `persistSession` returns the promise from `adapter.writeSession(...).catch(...)`, with a ~500ms timeout cap (`Promise.race`) so a hung write can never block the response indefinitely.
- `csrf.js`: `generateCsrfToken` becomes `async`; `await persistSession(req.sessionId)` in the token-minting branch.
- ACs covered: AC1, AC3, AC4.

### Task 2 — Update all 27 production call sites
- Add `await` at every `generateCsrfToken(req)` call site across the 12 files enumerated in the DoR.
- Convert `dashboard.js`'s `handleDashboard` to `async function`.
- ACs covered: infrastructure for AC1 (no functional AC of its own — these sites already work, this just makes them correctly await the now-async call).

### Task 3 — Migrate the 3 existing test files
- `tests/check-sec-perf-s3-csrf-middleware.js` (M1, M2), `tests/check-sec-perf-s3-admin-credits-csrf.js`, `tests/check-ctpr-s1-csrf-token-persistence.js` (5 call sites) — add `await`.
- ACs covered: AC5.

### Task 4 — New tests + full regression sweep
- Write `tests/check-cpr-s1-csrf-persist-race.js` covering AC1-AC4/AC6, including the critical injected-latency test.
- Re-run all 9 CSRF-focused test files, then each of the 12 touched route files' own existing test suites, then the full suite.

---

## Sequencing

Task 1 must complete before Tasks 2-3 (both depend on the async signature existing). Task 2 and Task 3 can happen in either order. Task 4 last.
