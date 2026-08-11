# AC Verification Script: Request a product-level guardrail/standard be promoted to org level

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s8-request-promotion.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s8-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a product with at least one product-level guardrail/standard entry.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: Requesting promotion creates a visible pending request

**Covers:** AC1, AC3

**Steps:**
1. Click "request promotion" on a product-level entry.
2. Reload the page.

**Expected outcome:**
> The entry now shows a "promotion requested, pending approval" label.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Requesting promotion twice for the same entry doesn't create duplicates

**Covers:** AC2

**Steps:**
1. With a pending request already showing (from Scenario 1), click "request promotion" again on the same entry.

**Expected outcome:**
> You see the existing pending request (not a new one) — the system doesn't create a second, duplicate request.

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
