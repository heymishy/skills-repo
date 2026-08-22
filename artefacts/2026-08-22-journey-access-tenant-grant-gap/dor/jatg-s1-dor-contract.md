# Contract Proposal — Restore same-tenant journey access under POLICY.TENANT

**Story:** `jatg-s1` — `artefacts/2026-08-22-journey-access-tenant-grant-gap/stories/jatg-s1-restore-same-tenant-journey-access.md`
**Test plan:** `artefacts/2026-08-22-journey-access-tenant-grant-gap/test-plans/jatg-s1-test-plan.md`
**Date:** 2026-08-22

---

## What will be built

In `src/web-ui/middleware/journey-access.js`, `requireJourneyAccess(journey, session, policy)` gains one additional early-return branch: when `policy === POLICY.TENANT` and `isSameTenant(journey, session)` is true, return (grant access) before reaching the unconditional `throw { code: 'FORBIDDEN' }` at the end of the function. All existing branches (null journey → `NOT_FOUND`, missing session → `UNAUTHENTICATED`, unowned journey → grant, owner match → grant) are unchanged.

The implementer verifies the exact fix shape against the story's own suggested version (in the story's "Root cause" section) and against all 11 real `POLICY.TENANT` call sites in `journey.js`, adjusting if any call site reveals an assumption the suggested shape doesn't account for — the suggested code is a strong starting point, not a mandate.

## What will NOT be built

- No change to `POLICY.OWNER` semantics — `handlePostJourneyRecommit`/`handlePostJourneyStageCommit` (the two `POLICY.OWNER` call sites) stay owner-only.
- No change to `requireGrantAccess`/the `agency-client-organisations` relationship-grant extension in the same file.
- No production database audit for historical wrongly-denied access attempts.
- No broader re-review of each of the 11 `POLICY.TENANT` callers' own business logic beyond confirming the shared guard change doesn't regress them.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: same-tenant non-owner + `POLICY.TENANT` → returns without throwing | unit |
| AC2 | Unit test: different-tenant non-owner + `POLICY.TENANT` → throws `FORBIDDEN`, `asHttpResponse` → 404 | unit |
| AC3 | Unit test: same-tenant non-owner + `POLICY.OWNER` → still throws `FORBIDDEN` | unit |
| AC4 | 5 existing-behaviour regression unit tests (owner grant, unowned-journey grant, null-journey `NOT_FOUND`, missing-session `UNAUTHENTICATED`) + full-suite regression run | unit + integration |
| AC5 | Re-run `tests/check-wsm2-collaborative-sessions.js` unmodified — T2b/T2c/T2d/T4a/T4b must flip from failing to passing, 22/22 total | integration (existing file) |

## Assumptions

- `isSameTenant(journey, session)` itself is correct and unchanged — this story fixes only the missing grant path that should have called it, not the tenant-comparison logic.
- No other file duplicates or reimplements `requireJourneyAccess`'s logic independently (unverified assumption — if the implementer finds a second implementation during the fix, it becomes a new finding, not silently folded into this story's scope).

## Estimated touch points

**Files:** `src/web-ui/middleware/journey-access.js` (the fix); a new `tests/check-jatg-s1-*.js` test file, or additions to an existing journey-access test file if one already exists — implementer's choice.
**Services:** None — pure in-process authorization logic, no external calls.
**APIs:** None directly, though the fix changes the observable HTTP response (200 vs 404) for 11 existing routes under `journey.js` for the specific same-tenant-non-owner case.
