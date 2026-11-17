# lpw-s4 Definition of Done

Date: 2026-11-18. Story: the four pod browser specs run against a seeded team roster and join the browser suite. Pull request #1145 merged 2026-11-18 (`5afb85470`). It closes no issue. The change touches the test server, the fake test database, the four pod specs, a shared helper, the capability matrix and one new test.

## Result: COMPLETE

All five acceptance criteria (AC, Acceptance Criterion) were verified by 7 automated tests, the browser specs and CI before merge. All 10 checks on the final commit passed, including the three required jobs.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (seed route creates a member the roster returns, idempotently) | ✅ | `check-lpw-s4-seed-team-member` T1a to T1c against the real test server: a seeded member comes back from `GET /api/team/members` with its role; two identities keep their own roles; seeding twice adds one | automated (real server) | the story used the role `member`; the real roles are admin, engineer, product, viewer, so the tests and route use those |
| AC2 (guard and validation) | ✅ | T2a: the route carries the same inline `NODE_ENV === 'test'` guard as its siblings; T2c: eight bad identities and one bad role are refused 400 and nothing is written | automated | the planned T2b (boot a server outside test mode) was dropped as too fragile; T2a covers the guard by source |
| AC3 (four specs seed, select by seeded names, pass alone and in core order) | ✅ | the four specs pass alone and together (9 tests, `--workers=1`); the whole core in CI order twice locally (120 passed, 3 skipped, 0 failed) and in CI (Core browser tests green after one fix) | live (CI) | needed more than seed data: since rtri-s2 adding a member is Add, a Pod role selector, then Confirm; the role tabs are hidden; ids are identity strings; "Darren" and the role-tab filter are gone. A shared helper `tests/e2e/fixtures/pods.js` drives the real flow |
| AC4 (matrix) | ✅ | T4a: the four specs are `core` with no reason; matrix guards (`check-lpw-s2-*`, `check-lpw-s3-matrix-reason`) unchanged and passing. Lanes now: core 33, extended 36, scenario 6, quarantined 20 | automated | all four went to core, not one |
| AC5 (no product code changed) | ✅ | T5: nothing under `src/web-ui/public/`, `modules/` or `routes/` changed; only `server.js` (the seed route) and `fake-test-db.js` (the seed helper) | automated | none |

## Observations and follow-ups

- **A flake of mine, fixed in the same pull request.** ep4's modal check swapped an auto-retrying `toHaveCount(2)` for a one-shot `count()`, which read 0 in CI before the pod list had rendered. It now waits for the two named pods first.
- **Master was red for an unrelated reason while this was open.** The web app's pipeline-state writer created a feature as `{slug, id}` with no `track`, `name`, `health` or `stage`, which failed the integrity check, trace validation and `check-bfl-s2` on every pull request. Repaired by hand on master (`935c260d5`, `42ff38856`); the writer defect is issue #1146, still open and likely to recur on the next feature started in the app.
- **First live report of `Gate files changed`.** It ran on this pull request, listed `tests/e2e/capability-matrix.json`, said observe mode, and the job passed; recorded against gic-s1's AC5.
- **Specs share state.** They share the `e2e-tester` tenant and the in-memory org with the rest of the core, so they pass under `--workers=1` (how the core job runs) and can race under parallel workers, as other specs already do. The ep4 modal asserts "at least these two pods" for the same reason.
- **Noise worth knowing about, not fixed:** the test server logs a non-fatal `urpv-s3 ... Adapter not wired: fetchRepoPath` warning during feature creation.
- **Still quarantined:** 20 spec files (down from 24), review date 2026-12-15. Remaining capability gaps: model sessions and the `ep2-s2` crash (lpw-s5), reference-upload, dsda-s1 and iwu2 rewrites, regress-back #1042.

## Scope Deviations

- AC3's work was larger than the story's "four selectors", as noted above; still test-only, no product change.
- AC4 moved all four specs to core rather than at least one.
