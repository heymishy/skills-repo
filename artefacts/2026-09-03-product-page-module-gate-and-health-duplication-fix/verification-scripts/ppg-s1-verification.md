# AC Verification Script: Module-less products get the full grouped/collapsed/filterable features UI, and health counts render in one place, not three

**Story reference:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/stories/ppg-s1-decouple-modules-gate-and-consolidate-health-counts.md
**Technical test plan:** artefacts/2026-09-03-product-page-module-gate-and-health-duplication-fix/test-plans/ppg-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `skills-framework` on `skills-framework.fly.dev` (production) — the exact product that surfaced this gap (zero custom Modules today).
2. Optionally, have access to a second product WITH at least one custom Module already created, to confirm the regression guard (AC6).

**Reset between scenarios:** Reload the product page fresh before each scenario.

---

## Scenarios

---

### Scenario 1: `skills-framework` (zero modules) now shows the full grouped/collapsed UI

**Covers:** AC1, AC2, AC3

**Steps:**
1. Load the `skills-framework` product page.

**Expected outcome:**
> The page shows By Module / By Phase / All tabs, a search box, and health-filter chips — not a flat list of every story. "By Phase" is the active tab by default. Groups are collapsed by default with a header, item count, and rolled-up health signal, matching `pdt-s1`'s own original design.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Health counts appear once, and are clickable

**Covers:** AC4, AC5

**Steps:**
1. On the same page, locate every place a health-status count (Healthy/Warning/Blocked/Unknown) appears.

**Expected outcome:**
> Each count appears exactly once, as a clickable chip in the filter bar (e.g. "Warning (27)"). The "Overall:" line shows only its own single derived label. No separate triage-strip block, and no repeated per-status breakdown elsewhere on the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A product WITH existing custom Modules is unaffected

**Covers:** AC6

**Steps:**
1. Load a product that already has ≥1 custom Module created.

**Expected outcome:**
> "By Module" is still the default active tab. The bulk-assign bar still renders in that tab. Named module sections render exactly as before this change.

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
