# AC Verification Script: Show org-level guardrails/standards even when a product has no connected repo

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s4-no-connected-repo-fallback.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s4-no-connected-repo-fallback-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Create or use a product with no GitHub repo connected yet.
2. Have your tenant's org repo already designated (from `wugs-s3`'s setup) so the org-level section has real content.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: A product with no connected repo shows a clear "connect a repo" prompt

**Covers:** AC1

**Steps:**
1. Open the guardrails/standards view for a product with no connected repo.

**Expected outcome:**
> You see a message specifically inviting you to connect a repo — different wording from "no guardrails found in this repo" (which implies a repo already exists).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Org-level content still shows even without a product repo

**Covers:** AC2

**Steps:**
1. On the same page, look at the org-level section.

**Expected outcome:**
> The org-level guardrails/standards content still displays normally — the missing product repo doesn't blank out the whole page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Clicking "connect a repo" takes you to the real connection flow

**Covers:** AC3

**Steps:**
1. Click the "connect a repo" prompt.

**Expected outcome:**
> You land on the same repo-connection screen you'd reach from the product page's own "Connect repo" option — not a different or broken page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: After connecting a repo, the page shows real content next time, not the old prompt

**Covers:** AC4

**Steps:**
1. Connect a repo for the product from Scenario 1.
2. Reload the guardrails/standards view.

**Expected outcome:**
> You now see the real product-level content from the newly connected repo — the "connect a repo" prompt is gone.

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
