# AC Verification Script: /design//definition produce Data Model diagrams

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s4-design-produces-data-model-diagrams.md
**Technical test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Run `/design` (or `/definition`) for a test feature that proposes at least one new table and reuses one existing table.
2. Have this repo's real migration files open for comparison (`src/web-ui/modules/migrate-schema-credits.js` or similar).

**Reset between scenarios:** Use a fresh feature slug for each scenario.

---

## Scenarios

---

### Scenario 1: Proposing a new table gives you a diagram of it

**Covers:** AC1

**Steps:**
1. Run `/design`, propose a new table with 2-3 columns.
2. Look at the generated diagram.

**Expected outcome:**
> A diagram appears showing the new table and its columns, matching what you described.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Reusing an existing table still shows up in the diagram

**Covers:** AC2

**Steps:**
1. Run `/design` for a feature that only reuses the existing `credits` table — no new columns proposed.
2. Look at the generated diagram.

**Expected outcome:**
> The `credits` table appears in the diagram — you are not shown an empty diagram just because nothing new was added. Other unrelated tables in the repo do not appear.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Diagram names match the real thing exactly

**Covers:** AC3

**Steps:**
1. Look at the diagram from Scenario 2.
2. Open `src/web-ui/modules/migrate-schema-credits.js` and find the real `credits` table definition.
3. Compare the table name and column names in both.

**Expected outcome:**
> Every name in the diagram matches the real migration file exactly — no generic names like "Table1", no paraphrasing (e.g. "Balance" instead of the real column name).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Proposing a genuinely new entity gets a "does this already exist?" check

**Covers:** AC4

**Steps:**
1. Run `/design` for a feature proposing a brand-new entity that has no obvious existing equivalent.
2. Watch what happens right before the diagram is finalised.

**Expected outcome:**
> You are asked an explicit question — something like "does an existing entity already cover this concept?" — before the diagram locks in the new entity. If you say no, the new entity proceeds normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
