# AC Verification Script: /branch-complete's freshness check must not be invalidated by /verify-completion's own bookkeeping commit

**Story reference:** artefacts/2026-11-06-bcfx-s1/stories/bcfx-s1-freshness-bookkeeping-commit-fix.md
**Technical test plan:** artefacts/2026-11-06-bcfx-s1/test-plans/bcfx-s1-test-plan.md

---

## Scenarios

### Scenario 1: A bookkeeping-only commit doesn't poison freshness

**Covers:** AC1

**Steps:**
1. Run `/verify-completion`, then immediately `/branch-complete` for a story, with no real code changes between them.

**Expected outcome:**
> `/branch-complete` reuses the fresh result and skips the full-suite rerun, despite `/verify-completion`'s own closing commit having happened in between.

**Result:** [ ] Pass  [ ] Fail

---

### Scenario 2: A real code change still forces a rerun

**Covers:** AC2

**Steps:**
1. Run `/verify-completion`, make a real code change and commit it, then run `/branch-complete`.

**Expected outcome:**
> `/branch-complete` reruns the full suite — the fix must not cause it to skip when it shouldn't.

**Result:** [ ] Pass  [ ] Fail

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
