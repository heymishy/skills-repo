# AC Verification Script: Deterministic story-coverage check on the review-artefact splitter

**Story reference:** artefacts/2026-09-30-review-split-coverage-check/stories/rsc-s1.md
**Technical test plan:** artefacts/2026-09-30-review-split-coverage-check/test-plans/rsc-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. No special setup — the fix is a pure-function + logging change, verifiable by running the test suite.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: A review session that misses a story gets a distinguishable, logged signal

**Covers:** AC1, AC3, AC4

**Steps:**
1. Ask a developer to run `node tests/check-rsc-s1-review-split-coverage.js` and look at the AC1/AC3/AC4 results.

**Expected outcome:**
> If the model's own review output only covers some of the feature's known stories (or none at all — the exact scenario that happened in web-ui-learnings-and-improvements), a `console.warn` fires naming exactly which stories are missing. This is a deterministic comparison against the feature's own known story list, not a guess based on whether the model happened to follow the formatting instructions.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A complete review session, or one with no known story list, produces no false alarm

**Covers:** AC2, AC5, AC6

**Steps:**
1. Ask a developer to run `node tests/check-rsc-s1-review-split-coverage.js` and look at the AC2/AC5/AC6 results.

**Expected outcome:**
> When the review session's output covers every known story, nothing is logged. When the feature has no known story list at all (a standalone or non-journey-linked review), the check is skipped entirely — no false alarm, no error, existing behaviour unaffected.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — missing story detected and logged | | |
| Scenario 2 — no false alarms | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
