# AC Verification Script: Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage

**Story reference:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md
**Technical test plan:** artefacts/2026-10-19-real-playback-capture-automation/test-plans/rpca-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Pick a real feature with at least one AC that has a matching `tests/e2e/*.spec.js` file (e.g. `fpd-s4`, which has `tests/e2e/fpd-s4-caption-sync.spec.js`)
2. Create or locate a feature with an AC that has no E2E spec, to see the skip/warning behaviour

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1: An AC with a real E2E spec gets its selector automatically

**Covers:** AC1

**Steps:**
1. Run the CLI against `fpd-s4` (or another feature with a real E2E spec naming an AC)
2. Check the CLI's own output for how it resolved `AC3`'s own selector

**Expected outcome:**
> The CLI reports it found `AC3`'s own selector from `tests/e2e/fpd-s4-caption-sync.spec.js` (or names the real file it used) — not a manual-fallback message, not a skip.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: An AC with a manual fallback entry uses it

**Covers:** AC2

**Steps:**
1. Create a `selectors-manual.json` file for a feature with one AC that has no E2E spec, giving it a real `{url, selector}` entry
2. Run the CLI against that feature

**Expected outcome:**
> The CLI reports it used the manual fallback entry for that AC and produces a real screenshot for it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An AC with neither source is skipped, not crashed

**Covers:** AC3

**Steps:**
1. Run the CLI against a feature with an AC that has no E2E spec and no manual fallback entry
2. Watch the CLI's own output and confirm it finishes

**Expected outcome:**
> The CLI completes the whole run (doesn't crash), and its output names the specific AC it skipped, with a clear reason ("no E2E spec, no manual fallback" or equivalent).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A mixed run reports accurate counts

**Covers:** AC4

**Steps:**
1. Run the CLI against a feature with a mix of E2E-derivable, manual-fallback, and uncovered ACs
2. Read the final summary line

**Expected outcome:**
> The summary states the exact number of ACs captured versus skipped, matching what you set up (e.g. "3 captured, 1 skipped").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 (AC1 — E2E-derived) | | |
| Scenario 2 (AC2 — manual fallback) | | |
| Scenario 3 (AC3 — skip, not crash) | | |
| Scenario 4 (AC4 — accurate counts) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
