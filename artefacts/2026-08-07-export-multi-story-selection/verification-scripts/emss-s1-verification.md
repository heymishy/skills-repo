# AC Verification Script: Let a --from-saas export request specify which DoR-approved story to fetch

**Story reference:** artefacts/2026-08-07-export-multi-story-selection/stories/emss-s1-select-story-for-saas-export.md
**Technical test plan:** artefacts/2026-08-07-export-multi-story-selection/test-plans/emss-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Find (or create) a feature with 2 or more DoR-signed-off stories.

**Reset between scenarios:** No reset needed — read-only requests.

---

## Scenarios

---

### Scenario 1: Nothing changes if you don't ask for a specific story

**Covers:** AC1

**Steps:**
1. Run `--from-saas <slug>` for your multi-story feature without any story selector.

**Expected outcome:**
> You get exactly the same story's artefact you always would have — no change in behaviour.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can now pick a specific story

**Covers:** AC2, AC4

**Steps:**
1. Run `skills-repo init <dir> --from-saas <slug> --story <a specific story's slug>`.

**Expected outcome:**
> You get that specific story's artefact, not whichever one happened to be first.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Asking for a story that doesn't exist tells you clearly

**Covers:** AC3

**Steps:**
1. Run the same command with a made-up story slug that doesn't exist on the feature.

**Expected outcome:**
> You get a clear "not found" error — not a silent fallback to some other story.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
