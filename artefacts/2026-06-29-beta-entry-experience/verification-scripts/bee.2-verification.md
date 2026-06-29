# AC Verification Script: bee.2 — First-run empty-state experience

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.2.md`
**Technical test plan:** `artefacts/2026-06-29-beta-entry-experience/test-plans/bee.2-test-plan.md`
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. Start the server:
   ```
   npm start
   ```
   Or with manual env loading:
   ```powershell
   # PowerShell
   Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
   node src/web-ui/server.js
   ```
   ```bash
   # bash/zsh
   export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
   ```
3. You will need two user states: one with **no journeys** (freshly created GitHub account or cleared database) and one with **at least one journey** (a session that has been previously started).
4. Log in via GitHub OAuth before starting Scenarios 2–5.

**Reset between scenarios:** To test the empty state, use a test GitHub account that has never started a skill session on this platform. To test the populated state, use an account that has at least one completed session.

---

## Scenarios

---

### Scenario 1: New user sees guided empty state

**Covers:** AC1, AC2

**Steps:**
1. Log in with a GitHub account that has **no existing journeys** on this platform.
2. Navigate to `http://localhost:3000/journeys` (or wherever the dashboard route lives).

**Expected outcome:**
> The page loads (HTTP 200). Instead of a blank list, you see an "empty state" block that contains:
> (a) An explanation that no skill sessions have been started yet — e.g. "You haven't started any skill sessions yet" or similar
> (b) A description of what a skill session produces — e.g. "a governed artefact" or "a discovery document"
> (c) A clearly visible link or button that navigates to the skill picker (the URL where you can choose a skill to start a new session — typically `/skills`)
> There is no error message, no blank white page, and no raw JSON.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Empty-state link navigates to skill picker

**Covers:** AC2c

**Steps:**
1. While on the empty dashboard (Scenario 1 state), click the link or button in the empty-state block that is meant to take you to the skill picker.

**Expected outcome:**
> The browser navigates to `/skills` (or the equivalent skill picker page). The skill picker page loads — you can see the list of available skills to start a new session. You are not taken to a 404 page or an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: User with existing journeys sees journey list, not empty state

**Covers:** AC3

**Steps:**
1. Log in with a GitHub account that has **at least one existing journey** on this platform.
2. Navigate to `http://localhost:3000/journeys`.

**Expected outcome:**
> The page loads (HTTP 200). The page shows a list of journey cards — one card per journey that exists for this user. The empty-state block (the "no sessions yet" message and skill picker link from Scenario 1) is **not visible** anywhere on the page. The page heading or title reflects the journey list view (not an empty-state heading).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Empty-state is server-rendered — visible in raw HTML

**Covers:** AC4

**Steps:**
1. With the server running and using a test account that has no journeys, open a terminal and run:
   ```
   curl -s http://localhost:3000/journeys -H "Cookie: <your-session-cookie>"
   ```
   (To get your session cookie: log in via browser, then open DevTools → Application → Cookies → copy the session cookie value and format it as `connect.sid=<value>` or equivalent.)

**Expected outcome:**
> The `curl` response body (printed to the terminal) contains the empty-state content — the "no sessions yet" explanation and the skill picker link — without running any JavaScript. The text is present in the raw HTML string, not loaded dynamically after the page renders.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: listJourneys failure returns error, not silent empty list

**Covers:** AC5

**Steps:**
1. This scenario requires a deliberate error state. If you can temporarily break the database connection (e.g. stop the database process, or change DATABASE_URL to an invalid value and restart the server), do so.
2. Log in and navigate to `http://localhost:3000/journeys`.
3. Check the server terminal output (where the server process is running).

**Expected outcome:**
> The browser receives an HTTP 500 error response (you can check: DevTools → Network tab → `/journeys` request → Status column shows 500). The response body does **not** show the empty-state block ("no sessions yet" message is absent). In the server terminal, you should see an error log line containing `[journey-store]` (e.g. `[journey-store] listJourneys error: ...`). The response is not a blank 200 page or an empty journey list.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1: New user sees empty state | | |
| Scenario 2: Empty-state link navigates to skill picker | | |
| Scenario 3: Existing journeys — journey list shown, no empty state | | |
| Scenario 4: Empty-state present in raw HTML (server-rendered) | | |
| Scenario 5: Error path returns 500, not silent empty list | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
