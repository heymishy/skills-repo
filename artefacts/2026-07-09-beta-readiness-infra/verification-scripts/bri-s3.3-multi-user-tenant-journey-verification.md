# AC Verification Script: Multi-user within one tenant journey spec

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s3.3-multi-user-tenant-journey.md
**Technical test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s3.3-multi-user-tenant-journey-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start — read this first:**
This story depends on a feature that has not been built yet (`2026-07-09-team-identity-roles`, which delivers the per-person role model and the multi-person-per-tenant schema). Scenarios 1–3 below **cannot be run to completion today** — there is no admin/engineer/viewer role distinction and no second person in a tenant to test against yet. This script is written now so the walkthrough is ready the moment the dependency clears. Attempting these scenarios today will fail not because of a product defect, but because the underlying feature does not exist yet — record that distinction in the Notes field if you attempt them early.

1. Confirm whether `2026-07-09-team-identity-roles` has reached at least definition-of-ready. If not, skip to the Edge case only and record "Blocked — dependency not yet delivered" in the Summary table for Scenarios 1–3.
2. If the dependency has cleared: start the app with the mock LLM gateway active (`NODE_ENV=test`), and seed at least two synthetic tenants, each with at least two people assigned different roles (admin and engineer, plus one viewer for Scenario 3).

**Reset between scenarios:** Log out between each scenario and log back in as the specific role being tested.

---

## Scenarios

---

### Scenario 1: An admin can do something an engineer in the same team cannot

**Covers:** AC1

**Steps:**
1. Log in as the admin-role person and open a role-gated feature (for example, the admin/credits panel).
2. Log out, then log in as the engineer-role person in the same tenant and try to open the same feature.

**Expected outcome:**
> The admin can open and use the feature. The engineer is denied access to the same feature — a clear "access denied" message or equivalent, not a broken page.

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked (dependency not yet delivered)
**Notes:**

---

### Scenario 2: Two people working at the same time don't mess up each other's view

**Covers:** AC2

**Steps:**
1. Log in as two different people in the same tenant, in two separate browser windows.
2. Have both open the same product's dashboard at the same time and each perform one unrelated action.

**Expected outcome:**
> Neither person's action overwrites or corrupts what the other person sees or has done. Each person's own action takes effect correctly; the other person's unrelated data is untouched.

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked (dependency not yet delivered)
**Notes:**

---

### Scenario 3: A viewer cannot make changes, only look

**Covers:** AC3

**Steps:**
1. Log in as the viewer-role person.
2. Try to make any change (for example, edit or create something).

**Expected outcome:**
> The attempt is denied with a clear message — the viewer can see information but cannot change anything.

**Result:** [ ] Pass  [ ] Fail  [ ] Blocked (dependency not yet delivered)
**Notes:**

---

### Edge case: This spec is tagged correctly and doesn't call the real AI service

**Covers:** AC4

**Steps:**
1. Look at the spec file's tags and confirm it is marked `@mocked` and `@multi-tenant`.
2. Run it (or as much of it as currently executes) while watching for real calls to the AI service.

**Expected outcome:**
> The spec file carries both tags. Whatever parts of it do run make zero real calls to the GitHub Copilot Chat Completions API — all answers come from the mock gateway.

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
[ ] Blocked — dependency (`2026-07-09-team-identity-roles`) not yet delivered; re-run once it reaches definition-of-ready

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
