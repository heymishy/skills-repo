# AC Verification Script: Expose the real team roster as a read API

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s1.md
**Technical test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have two tenant accounts available where you can add teammates: one ("Team A") with at least 2 real, previously-logged-in people who can be added, and one ("Team B") with at least 1 real, previously-logged-in person.
2. Sign in as an admin of Team A. Go to Team members and add 2 real teammates by their identity (GitHub login, Google email, or email/password email) — this is the existing, unmodified add-teammate form.
3. Sign in as an admin of Team B (a different account) and add 1 real teammate the same way.
4. You will need a way to call the new endpoint directly (a browser tab while signed in, or a tool like `curl`/Postman with your session cookie) and a way to make a request with no session at all (an incognito/private browser window).

**Reset between scenarios:** No reset needed — each scenario reads existing data and does not change it.

---

## Scenarios

---

### Scenario 1: The roster shows real teammates, not fake ones

**Covers:** AC1

**Steps:**
1. While signed in as Team A's admin, open the new team roster endpoint (`/api/team/members`) in a browser tab, or call it with your session cookie.

**Expected outcome:**
> The response lists exactly the 2 real teammates you added in Setup step 2 — each shown by their real identity (the GitHub login, Google email, or email they were added with) and their assigned role. No demo names (Hamish, Susan, Darren) appear anywhere.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A teammate who has never logged in doesn't break the list

**Covers:** AC2

**Steps:**
1. Ask an admin to add a teammate by an identity that has never actually signed into the app (this will be rejected by the existing add-teammate form with "no existing person found" — so this scenario is really: confirm that if such a row ever existed, the roster wouldn't error).
2. Alternative check: open the roster endpoint as in Scenario 1 and confirm the response loads successfully with no error, even though the underlying data model allows for an unresolvable entry.

**Expected outcome:**
> The roster endpoint never shows an error, a blank/broken entry, or a placeholder row — it only ever lists real, fully-resolved teammates.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Team A can't see Team B's members

**Covers:** AC3

**Steps:**
1. While signed in as Team A's admin, open the roster endpoint (as in Scenario 1).
2. Note the identities shown.
3. Sign out, sign in as Team B's admin, and open the same roster endpoint.

**Expected outcome:**
> Team A's roster never shows Team B's teammate's identity, and Team B's roster never shows Team A's 2 teammates' identities. Each team sees only its own real members.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The endpoint returns real, structured data

**Covers:** AC4

**Steps:**
1. While signed in as Team A's admin, open the roster endpoint.

**Expected outcome:**
> The response is structured data (JSON) — a list of team members, each with an identity and a role, matching exactly what you saw in Scenario 1. Not an HTML page, not an error page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Signed-out request is rejected

**Covers:** AC5

**Steps:**
1. Open a private/incognito browser window (no sign-in).
2. Try to open the roster endpoint directly.

**Expected outcome:**
> You are redirected — you land back on the app's sign-in page, exactly the same as if you tried to open any other page in this app while signed out. You never see any team member data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Real teammates shown | | |
| Scenario 2 — Unresolvable entry doesn't break the list | | |
| Scenario 3 — Tenant isolation | | |
| Scenario 4 — Structured data response | | |
| Edge case — Signed-out request rejected | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
