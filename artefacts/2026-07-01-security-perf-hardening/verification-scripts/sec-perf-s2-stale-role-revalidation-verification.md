# AC Verification Script: Re-validate admin role on every gated request

**Story reference:** artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s2.md
**Technical test plan:** artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s2-stale-role-revalidation-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code [ ] Post-merge [ ] Demo

---

## Setup

**Before you start:**
1. Two admin-capable accounts in the same tenant: person A (will be demoted) and person B (the demoting admin). Both must have logged in at least once so they exist in `people`/`team_memberships`.

**Reset between scenarios:** Re-promote person A back to `admin` via `/team/members` between Scenario 1 and Scenario 2 if reusing the same account.

---

## Scenarios

---

### Scenario 1: A demoted admin loses access on their very next click — no logout required

**Covers:** AC1, AC2

**Steps:**
1. Log in as person A (admin) in one browser/tab. Visit `/admin/credits` — confirm it loads.
2. Without logging person A out, log in as person B (also admin) in a second browser/tab (or use `/team/members` as person B).
3. As person B, demote person A to `engineer` via the team members page.
4. Switch back to person A's tab (still logged in, same session) and click any link to `/admin/credits` again — do not refresh via login.

**Expected outcome:**
> Person A's second visit to `/admin/credits` is denied (403 Forbidden) — even though they never logged out. Before this story, person A would have kept admin access for the rest of their session.

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Scenario 2: A promoted user gains access on their very next click

**Covers:** AC3

**Steps:**
1. Log in as a non-admin person C. Attempt to visit `/admin/credits` — confirm it is denied.
2. As an admin, promote person C to `admin` via `/team/members`, without person C logging out.
3. Person C attempts `/admin/credits` again in their existing session.

**Expected outcome:**
> Person C's second attempt succeeds — proving the check works in both directions (not just revoking access, but also granting it live).

**Result:** [ ] Pass [ ] Fail
**Notes:**

---

### Edge case: Database hiccup during the live check denies access rather than trusting a stale cached role

**Covers:** AC6

**Steps:**
1. This is best verified by the automated test (T10) rather than manually, since it requires simulating a database failure. If you have a staging environment where the role-lookup DB can be briefly interrupted, attempt an admin-gated request during the interruption.

**Expected outcome:**
> The request is denied (403), not silently allowed through on a stale cached role.

**Result:** [ ] Pass [ ] Fail [ ] Not tested manually (covered by automated test T10)
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
