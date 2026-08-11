# AC Verification Script: Show a tenant's org-level guardrails and standards, read from a designated org repo, seeded on first use

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s3-org-level-guardrails-view-with-seeding.md
**Technical test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s3-org-level-guardrails-view-with-seeding-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have two test tenant accounts ready (or two products under different tenants) for the cross-tenant scenario.
2. One tenant should not have an org repo designated yet.

**Reset between scenarios:** Use a fresh tenant/product for the "no org repo" scenario so earlier designations don't carry over.

---

## Scenarios

---

### Scenario 1: Designating an org repo for the first time seeds it with starter content

**Covers:** AC1

**Steps:**
1. As a tenant with no org repo yet, designate a repo as your org-level guardrails/standards source.

**Expected outcome:**
> A small number of starter guardrail/standard entries appear in that repo — not empty, not a large comprehensive set.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Every product under the tenant shows the same org-level content

**Covers:** AC4

**Steps:**
1. Open two different products belonging to the same tenant.
2. Compare the org-level section on each.

**Expected outcome:**
> Both show identical org-level guardrails/standards content.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A tenant with no org repo designated sees a clear prompt, not an empty section

**Covers:** AC3

**Steps:**
1. As a tenant that hasn't designated an org repo, open any product's guardrails/standards view.

**Expected outcome:**
> The org-level section clearly says no org repo has been designated yet, with a way to designate one — not a blank area.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Two different tenants never see each other's org-level content

**Covers:** AC5

**Steps:**
1. As Tenant A, designate an org repo and note its content.
2. As Tenant B (a completely different account), open any of your own products.

**Expected outcome:**
> Tenant B never sees Tenant A's org repo name or content anywhere — their own org-level section is either empty/prompting or shows only their own designated repo.

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
