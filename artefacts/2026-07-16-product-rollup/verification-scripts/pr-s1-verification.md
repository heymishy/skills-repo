# AC Verification Script: Designate Product as a named primitive and register skills-framework as a product

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s1.md
**Technical test plan:** artefacts/2026-07-16-product-rollup/test-plans/pr-s1-test-plan.md
**Script version:** 1
**Verified by:** _______________ | **Date:** _______________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to an operator account logged into the web UI.
2. Have access to `docs/concepts/README.md` in this repository, either in an editor or on GitHub.
3. Know the URL of skills-framework's own product page once created (ask the implementer for the product ID).

**Reset between scenarios:** No reset needed — none of the scenarios below change state.

---

## Scenarios

---

### Scenario 1: skills-framework has its own product row

**Covers:** AC1

**Steps:**
1. Log into the web UI as the operator.
2. Go to the Products list page.

**Expected outcome:**
> A product representing skills-framework itself appears in the list — you should recognise it by name (e.g. "skills-framework" or similar).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: skills-framework's product page loads like any other product

**Covers:** AC2

**Steps:**
1. Click into skills-framework's product from the Products list.

**Expected outcome:**
> The page loads successfully (no error page). You see the product's name and a list of its features, in the same layout you'd see for any other product you've created.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: "Product" appears in the primitives list documentation

**Covers:** AC3

**Steps:**
1. Open `docs/concepts/README.md` in this repository.
2. Find the list of primitives.

**Expected outcome:**
> The list now includes "Product" alongside the existing seven primitives (Assurance gate, Eval suite, Learnings log, Model evaluation, Pipeline state, Skill, Surface adapter). The description for "Product" says it's the existing `products` table and web UI — it does not describe a brand-new schema or table.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Two different accounts never see each other's products

**Covers:** AC4

**Steps:**
1. Log in as one operator account and note which products appear in the Products list.
2. Log in as a second, different operator account (a different tenant).
3. Look at the second account's Products list.

**Expected outcome:**
> The second account's Products list does not contain any product belonging to the first account — each account only ever sees its own products.

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
