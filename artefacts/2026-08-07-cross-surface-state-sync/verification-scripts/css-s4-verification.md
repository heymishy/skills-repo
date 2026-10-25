# AC Verification Script: Extend automatic sync to the full gate/stage vocabulary and add the reconciliation safety net

**Story reference:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s4-full-gate-coverage-and-reconciliation-safety-net.md
**Technical test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s4-test-plan.md
**Script version:** 1
**Verified by:** Claude (orchestrating session) | **Date:** 2026-10-25 | **Context:** Post-implementation, pre-merge — verified via automated test evidence (see each scenario's own Notes), not a live manual walkthrough. Matches css-s2/css-s3's own established convention for this story's epic.

---

## Setup

**Before you start:**
1. Have css-s1, css-s2, and css-s3's mechanisms already working.
2. Run `npm test` first to confirm the automated suite passes before doing manual verification.

**Reset between scenarios:** Use a fresh test feature per gate type tested.

---

## Scenarios

---

### Scenario 1: Every journey-representable gate syncs, not just discovery-approved

**Covers:** AC1

**Steps:**
1. For each of the 7 `gate-map.js` gates (discovery-approved, benefit-metric-active, definition-complete, test-plan-complete, dor-signed-off, branch-complete, definition-of-done), advance that gate on the CLI for a feature with a connected journey.

**Expected outcome:**
> For the 5 journey-representable gates (discovery-approved → discovery, benefit-metric-active → benefit-metric, definition-complete → definition, test-plan-complete → test-plan, dor-signed-off → definition-of-ready), the connected journey reflects that specific stage's completion — not just the first one you tried. For the 2 CLI-only inner-loop gates (`branch-complete`, `definition-of-done`), there is deliberately no journey-side effect at all — the web journey model has no concept of these stages (see `decisions.md`'s "gate-to-journey-stage mapping" ARCH entry and the DoR contract's 2026-10-25 revision); confirm these 2 gates advance cleanly on the CLI side with no error and no attempted journey write, not that they produce a journey-visible change.

**Result:** [x] Pass  [ ] Fail
**Notes:** Automated evidence: `tests/check-css-s4-gate-vocabulary.js` T1-T7 (22 assertions) — T3 confirms the 5 representable mappings, T4 confirms the 2 null mappings, T5 confirms no transport call for a null-mapped gate, T6/T7 confirm a representable gate syncs/conflicts correctly. `tests/check-css-s4-css-s2-vocabulary.js` (8 assertions) proves css-s2's own direction (`pipeline-state-github-writer.js`) is already generic across all 7 values. `scripts/check-sync-mechanism-is-parameterized.js` confirms one parameterized implementation, not 7 copies. No live CLI walkthrough performed.

---

### Scenario 2: A gap that failed to sync gets picked up the next time you touch that feature

**Covers:** AC2

**Steps:**
1. (Requires a test setup where the `pipeline-state.json` write is deliberately made to fail once, logging a gap.)
2. Later, do any other authenticated action on that same feature's journey in the web UI.

**Expected outcome:**
> The earlier gap gets resolved as part of that later action — you don't have to do anything special to trigger it, and you never had to re-enter any credentials for it to happen.

**Result:** [x] Pass  [ ] Fail
**Notes:** Automated evidence: `tests/check-css-s4-reconciliation.js` (15 assertions, T1-T5). T3 proves the opportunistic re-attempt uses the CALLING request's own live context/writer (never a stored credential) AND replays the gap's own stored `storyId`/`stateUpdate` (not whatever the triggering request happens to be writing — the exact defect found and fixed during this story's final review). T4 proves a failed re-attempt leaves the gap open. T5 (added as a direct regression test for the final-review finding) proves a gap with no stored payload safely no-ops rather than guessing. Wired into `handlePostGateConfirm` so any later authenticated gate-confirm on the same feature triggers it automatically. No live manual walkthrough performed.

---

### Edge case: Measuring the real automatic-agreement rate after 4 weeks

**Covers:** AC3

**Steps:**
1. After this feature has been live for 4 weeks, count the total number of phase-boundary advances (from the reconciliation/sync log) and how many of them required a manual intervention (a logged gap that a human had to resolve directly, rather than the reconciliation mechanism catching it).
2. Calculate the percentage that propagated automatically.

**Expected outcome:**
> The reported percentage is stated honestly — whether it's above or below the 90% minimum signal from `benefit-metric.md`. If it's below, that's a real finding to act on, not something to round up or gloss over.

**Result:** [ ] Pass  [ ] Fail (not yet measurable — see Notes)
**Notes:** Correctly scoped as Manual verification requiring 4 weeks of real production usage after this story merges (and css-s2/css-s3 merge alongside it) — cannot be measured at implementation time. See `decisions.md`'s RISK-ACCEPT entry. Not an open gap; deliberately deferred per the DoR contract's own AC-verification table.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | AC1 — automated, see scenario notes |
| Scenario 2 | Pass | AC2 — automated, see scenario notes |
| Edge case | Deferred (not an open gap) | AC3 — Manual, requires 4 weeks of real production usage |

**Overall verdict:** [x] All pass — ready to proceed (AC3's Manual edge case is a deliberately-deferred RISK-ACCEPT, not a failure)
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| (none open) | — | — | — | — |

A material AC2 defect (reconciliation replaying the wrong request's payload) and a Minor documentation inaccuracy (Scenario 1's own prior wording) were both found during this story's final cross-cutting review and fixed before this verification pass — see `decisions.md` and commits `51aa3554`/`616c549a`. No findings remain open at the time of this verification.
