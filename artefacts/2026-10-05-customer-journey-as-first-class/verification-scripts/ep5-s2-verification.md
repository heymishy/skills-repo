# AC Verification Script: Tenant isolation hardening: adversarial path and cross-tenant guard tests for journey routes

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md
**Technical test plan:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep5-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
This story is pure backend adversarial testing (no UI surface) — there is no real-browser scenario to walk through. Verification is via `npm test` / the dedicated `tests/check-ep5-s2-tenant-isolation-adversarial.js` file's own console output, not a manual browser click-through.

If a direct API check is wanted (optional, requires `curl`/Postman and two real tenant accounts on staging): submit a request for each of the 6 routes using a journey/stage/mapping id known to belong to a DIFFERENT tenant than the authenticated session, and confirm each returns 404 with no data in the response body.

---

## Scenarios

---

### Scenario 1: All 6 adversarial cross-tenant tests pass

**Covers:** AC1-AC6

**Steps:**
1. Run `node tests/check-ep5-s2-tenant-isolation-adversarial.js`.

**Expected outcome:**
> All 6 individual route tests show `[PASS]`, including the new `GET /journeys/:id` case (the one genuine, previously-unverified gap this story closes).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The suite reports zero cross-tenant leaks found

**Covers:** AC7

**Steps:**
1. Check the final summary line of the same test run.

**Expected outcome:**
> The suite's own summary confirms 6/6 (or 7/7 including the aggregate check itself) passed, with an explicit "0 cross-tenant leaks found" style confirmation, matching the `wuce-multi-tenancy` Phase 5 precedent this story is modeled on.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3 (optional, direct API check against staging): a real cross-tenant request to GET /journeys/:id returns 404

**Covers:** AC1 (real-world confirmation beyond the mock-based unit test)

**Steps:**
1. Using `curl`/Postman with a real staging session cookie for tenant A, request `GET /journeys/<a-real-journey-id-owned-by-tenant-B>`.

**Expected outcome:**
> 404 response, no journey name/description in the body.

**Result:** [ ] Pass  [ ] Fail
**Notes:** Requires access to two real tenant accounts on staging; primarily covered by the automated adversarial suite, not expected to be manually walked through in normal use.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — all 6 adversarial tests pass | | |
| Scenario 2 — zero leaks summary | | |
| Scenario 3 — optional real staging API check | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
