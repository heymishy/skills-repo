# AC Verification Script: Grouped item rows show the parent feature's own name instead of repeating the epic group header, and epic-grouped view becomes the default when a product has more than one epic

**Story reference:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/stories/pefl-s1-feature-name-not-epic-name-on-grouped-rows.md
**Technical test plan:** artefacts/2026-09-04-product-page-epic-grouping-and-feature-label/test-plans/pefl-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a product on `skills-framework.fly.dev` (production) with a multi-epic feature — the `cli-deterministic-governance` feature (`cdg.3`–`cdg.7` under its "Phase 2" epic) is the exact example that surfaced this defect.
2. Note: newly-added `featureName` data only appears in a product's cached taxonomy after its next sync — if the page still shows the old duplicated text immediately after deploy, a sync refresh may be needed first.

**Reset between scenarios:** Reload the product page fresh before each scenario.

---

## Scenarios

---

### Scenario 1: By Phase tab rows show the feature name, not a repeated epic name

**Covers:** AC1, AC2

**Steps:**
1. Load the `cli-deterministic-governance` product/feature's product page.
2. Click the "By Phase" tab.
3. Expand the "Phase 2 — skills advance, web UI gate enforcement, and chain-hash trace" group.

**Expected outcome:**
> Each child row (`cdg.3`–`cdg.7`) shows the feature's own display name as its sub-label — not the epic name already shown in the group header above.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: By Module and All tabs are unaffected

**Covers:** AC2 (regression guard)

**Steps:**
1. On the same page, click "By Module" and then "All".

**Expected outcome:**
> Row sub-labels in both tabs look exactly as they did before this fix — no change to their own behaviour.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A multi-epic product defaults to By Phase, even with custom Modules

**Covers:** AC3, AC4

**Steps:**
1. Load a product with more than one epic and at least one custom Module.
2. Note which tab is active by default without clicking anything.

**Expected outcome:**
> "By Phase" is the default active tab — not "By Module", despite the product having custom Modules.

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
