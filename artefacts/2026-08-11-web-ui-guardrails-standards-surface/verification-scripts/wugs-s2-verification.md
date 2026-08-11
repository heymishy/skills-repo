# AC Verification Script: Show a product's own guardrails and standards, read live from its connected repo

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s2-product-level-guardrails-view.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the web UI with an account that has a product connected to a real GitHub repo containing `.github/architecture-guardrails.md` and a `standards/` folder.
2. Open that product's guardrails/standards view.

**Reset between scenarios:** Not needed — each scenario is a fresh page load.

---

## Scenarios

---

### Scenario 1: The real guardrails file content shows up

**Covers:** AC1

**Steps:**
1. Open the product's guardrails/standards view.

**Expected outcome:**
> You see the actual text from `.github/architecture-guardrails.md` in the connected repo — not a placeholder, not "coming soon."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The standards folder's real entries are listed

**Covers:** AC2

**Steps:**
1. On the same page, look at the standards section.

**Expected outcome:**
> You see the real list of discipline folders from the connected repo's `standards/` folder (e.g. names like `data`, `devops`, `ux`) — matching what's actually in the repo, not a fixed list.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A product with no guardrails/standards content shows a clear "none found" message

**Covers:** AC3

**Steps:**
1. Open the guardrails/standards view for a product whose connected repo has no `.github/architecture-guardrails.md` and no `standards/` folder.

**Expected outcome:**
> You see a clear message saying nothing was found in this repo — not a blank white space, not an error page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The full sidebar and page navigation still work on this page

**Covers:** AC5

**Steps:**
1. Open any product's guardrails/standards view.
2. Look at the left sidebar.

**Expected outcome:**
> You see the full Products list, "See all products" link, and the current product highlighted as active — exactly like every other product page. Nothing is missing.

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
