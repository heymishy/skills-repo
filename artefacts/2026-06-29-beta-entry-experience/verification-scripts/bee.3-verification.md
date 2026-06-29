# AC Verification Script: bee.3 — PostHog instrumentation

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.3.md`
**Technical test plan:** `artefacts/2026-06-29-beta-entry-experience/test-plans/bee.3-test-plan.md`
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. You will need two configurations — one with POSTHOG_KEY set and one without. Start with POSTHOG_KEY set to a test value (e.g. `phc_testkey123`):
   ```powershell
   # PowerShell — set POSTHOG_KEY and start server
   $env:POSTHOG_KEY = 'phc_testkey123'
   Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
   node src/web-ui/server.js
   ```
   ```bash
   # bash/zsh
   POSTHOG_KEY=phc_testkey123 $(grep -v '^#' .env | xargs) node src/web-ui/server.js
   ```
3. Open your browser. Keep DevTools open (F12) on the Network and Console tabs throughout.

**Reset between scenarios:** Stop and restart the server as needed when switching between POSTHOG_KEY set and unset configurations.

---

## Scenarios

---

### Scenario 1: PostHog CDN snippet appears on landing page when key is set

**Covers:** AC1, AC8

**Steps:**
1. Start the server with `POSTHOG_KEY=phc_testkey123` (see Setup above).
2. Open a private/incognito browser window and navigate to `http://localhost:3000/`.
3. Right-click → View Page Source.
4. Search (Ctrl+F) for `posthog`.

**Expected outcome:**
> The page source contains a PostHog `<script>` initialisation snippet. The snippet:
> - Loads from a PostHog CDN URL (e.g. `eu.posthog.com` or `us.posthog.com` — not a `localhost` or `self-hosted` URL)
> - Contains the key value `phc_testkey123` embedded in the snippet
> - Has an `async` attribute on the `<script>` tag so it does not block page rendering
> The snippet appears in the page source without running any JavaScript.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: PostHog CDN snippet absent when key is unset

**Covers:** AC1, AC8

**Steps:**
1. Stop the server. Start it WITHOUT setting `POSTHOG_KEY` (or with `POSTHOG_KEY=`):
   ```
   npm start
   ```
   (Assuming POSTHOG_KEY is not in your .env file.)
2. Open a private/incognito window and navigate to `http://localhost:3000/`.
3. Right-click → View Page Source. Search for `posthog`.

**Expected outcome:**
> The page source contains **no** reference to PostHog. The word "posthog" does not appear anywhere in the page source. There is no broken `<script>` tag with an empty or undefined key. The browser Console tab shows no JavaScript errors.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: landing_page_view event fires on landing page load

**Covers:** AC3

**Steps:**
1. Start the server with `POSTHOG_KEY=phc_testkey123`.
2. Open a private/incognito window and navigate to `http://localhost:3000/`.
3. View Page Source and search for `landing_page_view`.

**Expected outcome:**
> The page source contains `posthog.capture('landing_page_view')` (or with double quotes). This appears in an inline `<script>` block after the PostHog init snippet. The call fires on page load — it is not inside a click handler or conditional.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: cta_clicked event fires when "Sign in with GitHub" is clicked

**Covers:** AC4

**Steps:**
1. Start the server with `POSTHOG_KEY=phc_testkey123`.
2. Open a private/incognito window and navigate to `http://localhost:3000/`.
3. Open DevTools → Network tab. Make sure "Preserve log" is checked.
4. Click "Sign in with GitHub".

**Expected outcome:**
> In the Network tab, you will see a request to a PostHog `capture` endpoint (e.g. `eu.posthog.com/.../e/` or similar) shortly before or during the redirect to GitHub. The browser proceeds to redirect to GitHub's OAuth page — the click is **not blocked**. If PostHog is slow or unavailable, the navigation still happens.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: CTA navigation not blocked when PostHog is unavailable

**Covers:** AC4 (navigation must not be blocked)

**Steps:**
1. Start the server with `POSTHOG_KEY=phc_testkey123`.
2. Open a private/incognito window and navigate to `http://localhost:3000/`.
3. Open DevTools → Network tab. Right-click any network request → Block request URL → block `posthog.com` (or use the Network Conditions panel to simulate offline).
4. Click "Sign in with GitHub".

**Expected outcome:**
> Even with PostHog blocked, clicking "Sign in with GitHub" navigates to GitHub's OAuth page. The browser Console shows **no** JavaScript error (specifically no `ReferenceError: posthog is not defined` or `TypeError: Cannot read properties of undefined`). The navigation proceeds normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: PostHog snippet in dashboard; identify called with login and tenant_id

**Covers:** AC2, AC5

**Steps:**
1. Start the server with `POSTHOG_KEY=phc_testkey123`.
2. Log in via GitHub OAuth (click Sign in with GitHub and complete the flow).
3. Once on the dashboard, View Page Source and search for `posthog`.

**Expected outcome:**
> The dashboard page source contains:
> - A PostHog CDN `<script>` snippet with the key `phc_testkey123` embedded (async)
> - A call to `posthog.identify(...)` with your GitHub login as the first argument and `tenant_id` set to your GitHub organisation name (or equivalent tenantId value)
> - Neither your GitHub OAuth access token nor any other sensitive credential appears in the page source — only your GitHub login username and tenantId

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: login_completed event fires on dashboard load

**Covers:** AC6

**Steps:**
1. Start the server with `POSTHOG_KEY=phc_testkey123`.
2. Log in via GitHub OAuth.
3. Once on the dashboard, View Page Source and search for `login_completed`.

**Expected outcome:**
> The page source contains `posthog.capture('login_completed')`. This call appears **after** the `posthog.identify(...)` call in the inline script. Both calls are in the same inline `<script>` block or in sequential `<script>` blocks.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: journey_created fires on the chat page immediately after a new journey

**Covers:** AC7

**Steps:**
1. Start the server with `POSTHOG_KEY=phc_testkey123`.
2. Log in and navigate to `/skills` (the skill picker).
3. Start a new skill session (e.g. select "definition" and click to begin).
4. Once the new session starts, View Page Source of the chat page (the URL should be something like `/skills/definition/sessions/<id>/chat`).
5. Search the page source for `journey_created`.

**Expected outcome:**
> The chat page source (the first HTML page after the POST that created the journey) contains `posthog.capture('journey_created')`. This event fires immediately on page load — it is not conditional on any user action on the chat page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 8: No PostHog npm package in package.json

**Covers:** AC9

**Steps:**
1. Open a terminal in the repo root and run:
   ```
   cat package.json
   ```
   Or open `package.json` in a text editor.
2. Search for `posthog` in the file.

**Expected outcome:**
> The word "posthog" does not appear in `package.json`. Specifically, neither `posthog-js`, `posthog-node`, nor any other PostHog package appears in `dependencies` or `devDependencies`. The PostHog CDN `<script>` tag is the only integration point.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1: CDN snippet on landing page (key set) | | |
| Scenario 2: No snippet on landing page (key unset) | | |
| Scenario 3: landing_page_view event on landing page | | |
| Scenario 4: cta_clicked event on CTA click | | |
| Edge case: CTA navigation not blocked when PostHog unavailable 🔴 | | |
| Scenario 5: CDN snippet + identify on dashboard | | |
| Scenario 6: login_completed on dashboard | | |
| Scenario 7: journey_created on chat page | | |
| Scenario 8: No posthog npm package | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
