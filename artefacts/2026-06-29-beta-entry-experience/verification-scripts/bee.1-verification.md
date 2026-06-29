# AC Verification Script: bee.1 — Public landing page

**Story reference:** `artefacts/2026-06-29-beta-entry-experience/stories/bee.1.md`
**Technical test plan:** `artefacts/2026-06-29-beta-entry-experience/test-plans/bee.1-test-plan.md`
**Script version:** 1
**Verified by:** ____________ | **Date:** ____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. Make sure you have a `.env` file (or equivalent local env config) in the repo root. The minimum required variables are `SESSION_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL`. `POSTHOG_KEY` does **not** need to be set for this story's scenarios.
3. Start the server. If the server uses `--env-file=.env` (as in `package.json`), run:
   ```
   npm start
   ```
   If you prefer to load env manually first:
   ```powershell
   # PowerShell
   Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
   node src/web-ui/server.js
   ```
   ```bash
   # bash/zsh
   export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
   ```
4. Open your browser. Make sure you are **not** logged in (clear cookies for `localhost:3000` if needed, or use a private/incognito window).

**Reset between scenarios:** Clear cookies for `localhost:3000` in your browser, or switch between a normal window (logged out) and an authenticated session as needed.

---

## Scenarios

---

### Scenario 1: Unauthenticated visitor sees landing page

**Covers:** AC1, AC3, AC4

**Steps:**
1. Open a new private/incognito browser window.
2. Navigate to `http://localhost:3000/`.

**Expected outcome:**
> The page loads with HTTP 200 (you can verify in browser DevTools → Network tab). The page body is visible and contains:
> - A short description (1–2 sentences) explaining what the Skills Platform does
> - A description of what a "skill session" produces (e.g. "a governed artefact" or similar)
> - A clearly visible "Sign in with GitHub" link or button
> The page looks readable with no broken layout. There are no references to Bootstrap, Tailwind, or any CDN-hosted CSS framework in the page source (right-click → View Page Source, search for "cdn.").

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Authenticated user at / is redirected to dashboard

**Covers:** AC2

**Steps:**
1. Log in to the app via the normal GitHub OAuth flow (click "Sign in with GitHub" from Scenario 1, complete the GitHub authorisation).
2. Once authenticated and landed on the dashboard (or any authenticated page), manually navigate to `http://localhost:3000/` in the same browser window.

**Expected outcome:**
> The browser does **not** show the landing page. Instead, it automatically redirects you to `/journeys` (or the authenticated home route). You should see the dashboard. The URL bar should show `/journeys`, not `/`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: "Sign in with GitHub" CTA links to the correct URL

**Covers:** AC1, AC4

**Steps:**
1. Open a private/incognito window and navigate to `http://localhost:3000/`.
2. Hover over (or right-click → "Copy link") the "Sign in with GitHub" link.

**Expected outcome:**
> The link target is `/auth/github`. Clicking it starts the GitHub OAuth flow (redirects to GitHub's authorisation page).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Landing page is self-contained — no CDN CSS framework

**Covers:** AC3

**Steps:**
1. Open a private/incognito window and navigate to `http://localhost:3000/`.
2. Right-click → View Page Source.
3. Search the source for: `bootstrap`, `tailwind`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `unpkg.com`.

**Expected outcome:**
> None of these strings appear in the page source. All styling is either inline (`<style>` tags) or references a local asset only. The page is readable — not completely unstyled.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Page renders usably without JavaScript

**Covers:** AC3

**Steps:**
1. Open a private/incognito window.
2. Disable JavaScript in the browser (Chrome: DevTools → Settings → Preferences → Debugger → Disable JavaScript; or use a browser extension).
3. Navigate to `http://localhost:3000/`.

**Expected outcome:**
> The landing page content (description and "Sign in with GitHub" link) is visible and usable. The page is not blank or broken. The "Sign in with GitHub" link is a plain `<a>` element that navigates without JavaScript.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Existing routes are unaffected (health, auth, journeys)

**Covers:** AC5

**Steps:**
1. With the server running, open a terminal and run:
   ```
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health
   ```
2. Run: `curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3000/auth/github` (note: this will redirect to GitHub — that's the expected 302)
3. Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/github` (without `-L`, so redirects are not followed)
4. In a logged-in browser session, navigate to `http://localhost:3000/journeys`.
5. In a logged-out browser session (private window), navigate to `http://localhost:3000/journeys`.

**Expected outcome:**
> 1. `GET /health` → prints `200`
> 2. `GET /auth/github` without `-L` → prints `302`
> 3. (same as 2 above)
> 4. Logged-in `/journeys` → loads the dashboard page (200 OK)
> 5. Logged-out `/journeys` → redirects to `/auth/github` or the landing page (not a 404 or 500)

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 7: File path is not derived from the request URL

**Covers:** AC6

**Steps:**
1. With the server running, open a terminal and run:
   ```
   curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/../package.json"
   curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/%2e%2e%2fpackage.json"
   ```

**Expected outcome:**
> Both requests return a status code other than 200 (likely 400 or 404). The server does **not** serve the contents of `package.json` or any file outside the intended public directory. If the landing page handler serves a static file, the path traversal attempts must be rejected.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1: Landing page for unauthenticated visitor | | |
| Scenario 2: Authenticated redirect to /journeys | | |
| Scenario 3: CTA links to /auth/github | | |
| Scenario 4: No CDN CSS framework | | |
| Scenario 5: Renders without JavaScript | | |
| Scenario 6: Existing routes unaffected | | |
| Scenario 7: Path traversal rejected | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
