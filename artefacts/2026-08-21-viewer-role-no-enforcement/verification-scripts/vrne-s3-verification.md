# AC Verification Script: Wire the viewer-write-block gate to Credits/billing routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s3-credits-billing.md`
**Technical test plan:** `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s3-test-plan.md`
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Two logged-in sessions: one `viewer`-role teammate, one `admin`.
2. Use Stripe's test mode (this repo's existing local-dev default) — no real payment will be attempted.

**Reset between scenarios:** No shared state.

---

## Scenarios

---

### Scenario 1: A viewer-role teammate cannot start a billing checkout

**Covers:** AC1

**Steps:**
1. As the viewer-role teammate, open Settings → Billing.
2. Click "Upgrade" or "Change plan" (whichever button initiates checkout).

**Expected outcome:**
> The checkout does not start — you see an error/denied response, not a redirect to Stripe's checkout page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: An admin can start a billing checkout exactly as before

**Covers:** AC2

**Steps:**
1. As the admin, repeat Scenario 1's steps.

**Expected outcome:**
> You are redirected to Stripe's checkout page normally — no change in behaviour.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A denied checkout attempt shows up in the audit log

**Covers:** AC3

**Steps:**
1. Repeat Scenario 1.
2. Ask a developer to check the application logs for the denial.

**Expected outcome:**
> The log contains an entry showing who attempted it, which organisation, when, and the route.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — viewer denied checkout | | |
| Scenario 2 — admin unaffected | | |
| Edge case — denial logged | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |

<!-- AC4 (webhook unaffected) is not included as a manual scenario — it has no UI surface a human can exercise; it is fully covered by the automated integration/unit test webhook-stripe-unaffected-by-gate in the technical test plan. -->
