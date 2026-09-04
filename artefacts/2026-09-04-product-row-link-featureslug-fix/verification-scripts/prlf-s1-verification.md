# AC Verification Script: Product page row links use the resolved feature slug, not the raw (potentially colliding) story slug

**Story reference:** artefacts/2026-09-04-product-row-link-featureslug-fix/stories/prlf-s1-use-featureslug-in-row-links.md
**Technical test plan:** artefacts/2026-09-04-product-row-link-featureslug-fix/test-plans/prlf-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `skills-framework` on `skills-framework.fly.dev` (production).
2. Know the real collision example: `p3.3` under `2026-04-14-skills-platform-phase3`'s "Platform Structural Integrity" epic vs. `p3.3` under `2026-06-22-wuce-multi-tenancy`'s "Phase 3 — State Persistence" epic.

---

## Scenarios

---

### Scenario 1: Clicking the colliding p3.3 row lands on the correct feature

**Covers:** AC1, AC3

**Steps:**
1. Load `skills-framework`'s product page, By Phase tab.
2. Find the "Platform Structural Integrity" epic group and click its `p3.3` row.

**Expected outcome:**
> The URL is `/features/2026-04-14-skills-platform-phase3` — not `/features/p3.3` — and the artefact page shows this feature's own real artefacts (Discovery, Benefit Metric, plus `p3.3`'s own story/test-plan/DoD, once `aada-s1`'s archived-directory fix + a fresh sync land).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A top-level (non-epic-nested) row is unaffected

**Covers:** AC2

**Steps:**
1. Click any top-level feature's own row on the product page (one that isn't nested under an epic).

**Expected outcome:**
> Behaves exactly as before — lands on `/features/<that feature's own slug>`, same as today.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

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
