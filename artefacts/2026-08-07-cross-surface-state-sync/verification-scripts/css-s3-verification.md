# AC Verification Script: Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s3-detect-and-resolve-cross-surface-conflicts.md
**Technical test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s3-test-plan.md
**Script version:** 1
**Verified by:** Claude (session) | **Date:** 2026-10-25 | **Context:** [x] Pre-code  [ ] Post-merge  [ ] Demo

**REVISED 2026-10-25** — see `decisions.md`'s five css-s3 ARCH entries. This story's real, branch-taking conflict detection/resolution is wired into css-s2's direction only (`pipeline-state-github-writer.js`); css-s1's direction gets `lastSyncedStage` bookkeeping only (no real conflict-branch call there — see the wiring-scope-refinement entry). A real journey-side correction (Task 7) was added after the first final cross-cutting review found AC2's journey-correction half missing, then itself fixed twice more after independent review found a Critical vocabulary-mismatch bug (the resolved value can be outside the web journey's own 8-stage model) and a Minor documentation inaccuracy. All evidence below is automated-integration-level (real `applyStateUpdate`/`handlePostGateConfirm`, faked Postgres pool only) rather than a live manual walkthrough — manually reproducing two surfaces genuinely racing each other to advance the same feature differently is impractical to stage by hand with the same fidelity the automated integration tests already provide.

---

## Setup

**Before you start:**
1. Have a repo-connected feature with both css-s1 and css-s2's sync mechanisms working.
2. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Use a fresh test feature for each scenario so conflict history doesn't carry over.

---

## Scenarios

---

### Scenario 1: Advancing both sides independently triggers a conflict, and pipeline-state.json wins

**Covers:** AC1, AC2

**Steps:**
1. Advance a gate on the CLI side for a feature (e.g. run `bin/skills gate-advance` for `test-plan-complete`).
2. Before that syncs, also complete a *different* stage on the same feature's web-UI journey (simulating two people or two surfaces disagreeing).
3. Let the sync mechanism run.
4. Check the web-UI journey's stage record afterward.

**Expected outcome:**
> The journey's stage record now matches whatever `pipeline-state.json` says — not whatever was set on the web UI in step 2.

**Result:** [x] Pass (automated)
**Notes:** `tests/check-css-s3-pipeline-state-conflict-wiring.js` T1 proves AC1/AC2's pipeline-state.json side via the real `applyStateUpdate`. `tests/check-css-s3-journey-correction.js`'s first test proves AC2's journey-correction side via the real `handlePostGateConfirm`: a genuine conflict (resolved value within the journey's own stage model) correctly redirects based on the resolved value, not the journey's own stale belief. A second test in the same file proves the safety boundary found at review: when the resolved value is OUTSIDE the journey's own 8-stage model (e.g. an inner-loop gate name), the correction is correctly skipped rather than risking a false journey-completion or a fabricated audit trace — pipeline-state.json's own side remains correctly protected either way.

---

### Scenario 2: A resolved conflict leaves a visible trail

**Covers:** AC3

**Steps:**
1. After Scenario 1, check the conflict log (location confirmed at implementation time — likely a maintainer-facing query or admin view).

**Expected outcome:**
> There's a record showing: which feature had the conflict, what each side's value was, which one won, and when it happened.

**Result:** [x] Pass (automated)
**Notes:** The `sync_log` table (`entry_type='conflict'`) records `feature_slug`, `pipeline_state_value`, `journey_value`, `resolved_value`, and `created_at` — confirmed by `tests/check-css-s3-conflict-resolver.js` T4 and `tests/check-css-s3-pipeline-state-conflict-wiring.js` T1/T3. T3 also proves the Critical dedup fix: exactly one log entry per logical conflict, even across the writer's own unrelated 409-retry loop (which would otherwise re-detect and re-log the same conflict up to 3 times).

---

### Edge case: A normal single-sided advance doesn't show up as a conflict

**Covers:** AC4

**Steps:**
1. Advance a gate on only one side (CLI or web UI) for a feature — don't touch the other side at all.
2. Check the conflict log afterward.

**Expected outcome:**
> Nothing new appears in the conflict log — this was an ordinary sync, not a disagreement, and the log is reserved for genuine conflicts only.

**Result:** [x] Pass (automated)
**Notes:** Proven at both unit level (`tests/check-css-s3-conflict-resolver.js` T2/T2b/T2c — `detectConflict` returns `null` for single-sided advances and for both-sides-agree cases) and integration level (`tests/check-css-s3-pipeline-state-conflict-wiring.js` T2 — zero `sync_log` conflict writes for an ordinary single-sided advance against the real wired call site).

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass (automated) | Both halves of AC2 (pipeline-state.json protected, journey corrected when representable) |
| Scenario 2 | Pass (automated) | sync_log conflict entries, dedup across retries |
| Edge case | Pass (automated) | AC4, unit + integration level |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
