# AC Verification Script: Backfill person_identities on login so existing real memberships become resolvable

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s4.md
**Technical test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s4-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need a tenant where you (or a teammate) were added via the "Add teammate by identity" admin form on `/team/members` — NOT via a real email invite — so their membership exists but their identity has never been explicitly linked.
2. Have access to sign in again as that same person, to trigger a fresh login.

**Reset between scenarios:** No reset needed — this is an additive, one-way fix.

---

## Scenarios

---

### Scenario 1: A real teammate's own roster entry appears after they next log in

**Covers:** AC1, AC2 — this is the direct, end-to-end proof of the fix

**Steps:**
1. Before this fix: check the team roster (`/api/team/members`, or once `rtri-s2`/`rtri-s3` ship, the picker/list itself) for a tenant where a teammate was added via the plain admin form. Note: they do NOT appear (the pre-fix gap — this matches exactly what was found live on `wuce-staging.fly.dev`, 2026-09-24).
2. Sign that teammate out, then sign back in (any of: GitHub, Google, or email/password).
3. Check the team roster again.

**Expected outcome:**
> The teammate now appears in the roster with their real identity and role — the same membership that already existed, now actually visible. You didn't have to re-add them or do anything special beyond a normal sign-in.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Signing in again doesn't cause any duplicate or error

**Covers:** AC3

**Steps:**
1. Continuing from Scenario 1, sign the same teammate out and back in a second time.
2. Check the team roster once more.

**Expected outcome:**
> The teammate still appears exactly once — no duplicate entry, no error message, no broken page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A brand-new signup isn't affected

**Covers:** AC4

**Steps:**
1. Sign up as a genuinely new person (an identity that has never logged in before, and isn't a member of any existing tenant).
2. Confirm sign-up succeeds normally — no error, no unexpected delay.

**Expected outcome:**
> Sign-up works exactly as it did before this change. This new person is not silently added to anyone else's team roster.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Existing "link a second sign-in method" and invite flows still work

**Covers:** AC5

**Steps:**
1. If available, use the existing "Link Google account" (or equivalent) option in Settings for an already-signed-in user.
2. Separately, send and accept a real team invite for a genuinely new person.

**Expected outcome:**
> Both existing flows work exactly as before — no visible change in their behaviour from this story.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Real entry appears after next login | | |
| Scenario 2 — No duplicate on repeat login | | |
| Scenario 3 — New signup unaffected | | |
| Edge case — Existing linking/invite flows unaffected | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
