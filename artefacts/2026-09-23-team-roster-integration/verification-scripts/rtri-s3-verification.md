# AC Verification Script: Render a real member list on /team/members

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s3.md
**Technical test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s3-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as an admin of a tenant ("Team A") with at least 2 real teammates already added.
2. Have a second tenant ("Team B") available with zero teammates added.
3. Have one identity ready that has logged into the app at least once but is not yet a teammate of any tenant, so you can add them live.

**Reset between scenarios:** No reset needed — this page only reads and adds, never removes.

---

## Scenarios

---

### Scenario 1: The page shows your real team, not just a form

**Covers:** AC1

**Steps:**
1. Go to Team members (`/team/members`).

**Expected outcome:**
> Above (or alongside) the existing "Add teammate" form, you see a list showing your real teammates — each with their real identity and their role. Not just the empty form you'd have seen before.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A team with no members yet says so clearly

**Covers:** AC2

**Steps:**
1. Sign out, sign in as Team B's admin (zero teammates added).
2. Go to Team members.

**Expected outcome:**
> You see a clear message like "No team members yet" — not a blank space, not an error, and the "Add teammate" form is still there and working.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Adding someone makes them show up immediately

**Covers:** AC3

**Steps:**
1. Sign back in as Team A's admin. Go to Team members.
2. Use the existing "Add teammate" form to add the identity you prepared in Setup step 3, with any role.
3. Reload the page.

**Expected outcome:**
> The person you just added now appears in the list, with the role you gave them. You didn't have to wait or do anything special — reloading the page was enough.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: You can't see another team's members

**Covers:** AC4

**Steps:**
1. While signed in as Team A's admin on Team members, note the identities shown.
2. Sign out, sign in as Team B's admin, go to Team members.

**Expected outcome:**
> Team B's admin never sees Team A's teammates in the list, and vice versa. Each admin only ever sees their own team.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A malicious-looking identity is shown safely, not run as code

**Covers:** AC5

**Steps:**
1. This scenario requires a developer to temporarily seed a test teammate whose identity string contains something like `<img src=x onerror=alert(1)>` (not expected with real identities, but must be handled safely).
2. Go to Team members and look at the list.

**Expected outcome:**
> The odd-looking text is shown exactly as typed, as plain text in the list. No pop-up/alert box appears. The page layout is unaffected.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Real team shown | | |
| Scenario 2 — Empty state | | |
| Scenario 3 — Live add-then-reload | | |
| Scenario 4 — Tenant isolation | | |
| Edge case — No script injection | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
