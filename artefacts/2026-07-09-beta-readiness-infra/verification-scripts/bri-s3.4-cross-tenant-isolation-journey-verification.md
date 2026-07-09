# AC Verification Script: Cross-tenant isolation journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.4-cross-tenant-isolation-journey.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.4-cross-tenant-isolation-journey-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Run bri-s2.4's seed script against staging so at least two synthetic tenants exist (Tenant A and Tenant B), each with its own journeys, products, and standards.
2. Log in as a user belonging to Tenant A.
3. Have a Tenant B resource ID handy (for example, a Tenant B journey ID) — you can get this by looking at the seed data directly, since you won't be able to see it through Tenant A's own UI.

**Reset between scenarios:** No reset needed — each scenario is an independent read or write attempt from Tenant A's session.

---

## Scenarios

---

### Scenario 1: Tenant A cannot read Tenant B's data by guessing or knowing its ID

**Covers:** AC1

**Steps:**
1. While logged in as Tenant A, try to open a Tenant B journey, product, or standard directly by its ID (for example, by editing the URL to point at Tenant B's resource ID).

**Expected outcome:**
> You get a "not found" result (404) — the same result you'd see for an ID that doesn't exist at all. You do not get an "access denied" (403) message, which would confirm the resource exists even if you can't see it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Tenant A's lists never show Tenant B's items

**Covers:** AC2

**Steps:**
1. While logged in as Tenant A, open the journey list and the product list.
2. Check every item shown against the known list of Tenant B's seeded items.

**Expected outcome:**
> None of the items shown belong to Tenant B — every single item in both lists belongs to Tenant A only.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Tenant A cannot change Tenant B's data

**Covers:** AC3

**Steps:**
1. While logged in as Tenant A, attempt to edit or delete a Tenant B resource (using its known ID).
2. Afterward, check that Tenant B resource's data directly (via the seed data or an admin view) to see if anything changed.

**Expected outcome:**
> The attempt is rejected. When you check afterward, the Tenant B resource's data is exactly the same as before the attempt — nothing was modified.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: This spec runs the same way every time, with no real AI calls

**Covers:** AC5

**Steps:**
1. Confirm the spec file is tagged `@mocked` and `@multi-tenant`.
2. Run it while watching for real calls to the AI service.

**Expected outcome:**
> Both tags are present. No real calls to the GitHub Copilot Chat Completions API happen during the run, and the result is the same every time it's run.

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

**Note on AC4 (zero skip/flake over 20 consecutive runs):** this cannot be verified in a single walkthrough. Once this spec is live in CI, check the CI history after 20 consecutive runs and record the result separately — any single skip or flake is treated as a defect, not noise.

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
