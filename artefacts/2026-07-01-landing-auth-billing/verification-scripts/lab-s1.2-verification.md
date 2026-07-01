# AC Verification Script — lab-s1.2 — Landing page at `/`

**Story:** lab-s1.2
**Feature:** 2026-07-01-landing-auth-billing
**Audience:** Operator / domain expert, QA, BA

---

## Purpose

1. **Pre-code sign-off** — confirm the described landing page behaviour is correct before implementation begins.
2. **Post-merge smoke test** — confirm the shipped landing page matches these scenarios.
3. **Delivery review** — structured walkthrough for stakeholders.

---

## Setup

Start the server with environment variables loaded. The server uses `--env-file=.env` (Node.js built-in). Ensure `.env` is present and `POSTHOG_KEY` is set (or left unset — the landing page must render without it).

```powershell
# PowerShell — load .env then start server
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

```bash
# bash/zsh
export $(grep -v '^#' .env | xargs) && node src/web-ui/server.js
```

Open `http://localhost:3000` in a browser. Make sure you are NOT logged in (open in an incognito window or clear cookies first).

**Run automated checks first:**
```
node tests/check-lab-s1.2-landing-page.js
```
Expected: all checks pass. Zero failures.

---

## Scenarios

### Scenario AC1 — Landing page renders correctly for an unauthenticated visitor

1. Open `http://localhost:3000` in an incognito/private browser window (to ensure no session).
2. **Expected:** The page loads. You can see:
   - A headline describing what the platform does (the platform pitch)
   - A short paragraph describing the value proposition
   - A button or link labelled "Get started"
3. If any of these three elements are missing, AC1 fails.

---

### Scenario AC2 — "Get started" CTA goes to the auth page

1. On the landing page (from AC1), click the "Get started" button.
2. **Expected:** The browser navigates to `/auth/github` (or the multi-provider auth page if lab-s1.3 is already merged). You should see either a redirect to GitHub's OAuth page or a sign-in options screen.
3. If clicking "Get started" does nothing, or navigates anywhere other than the auth entry point, AC2 fails.

---

### Scenario AC3 — Logged-in users are redirected away from the landing page

1. Log into the platform via `/auth/github` (complete a real GitHub OAuth login).
2. After login, navigate directly to `http://localhost:3000/`.
3. **Expected:** You are immediately redirected to `/dashboard`. You do not see the landing page content.
4. If you see the landing page content while logged in, AC3 fails.

---

### Scenario AC4 — PostHog landing page event (requires PostHog account)

*Skip this scenario if `POSTHOG_KEY` is not set — note the gap.*

1. Open the PostHog dashboard for this project.
2. In an incognito window, navigate to `http://localhost:3000/`.
3. Within 30 seconds, check PostHog's live event stream.
4. **Expected:** A `landing_page_viewed` event appears. The event has no personal data — no email, no name, no session token.
5. If `POSTHOG_KEY` is not set, write this in the verification notes: "PostHog key not configured — AC4 deferred to post-POSTHOG_KEY setup."

---

### Scenario AC5 — 🔴 Responsive layout (MANUAL ONLY — CSS-layout-dependent)

*This scenario requires a real browser. It cannot be automated without Playwright.*

**At 320px width (mobile):**
1. Open browser developer tools. Set the viewport to exactly 320px wide.
2. Navigate to `http://localhost:3000/` (unauthenticated).
3. **Expected:** The page headline, value proposition paragraph, and "Get started" button are ALL visible on screen without needing to scroll left or right (no horizontal scrollbar). The "Get started" button is large enough to tap with a finger — at least 44px tall.
4. **What broken looks like:** Text is cut off on the right edge. A horizontal scrollbar appears. The CTA button is tiny or overlaps other elements.

**At 1280px width (desktop):**
5. Set the viewport to 1280px wide.
6. **Expected:** The same three elements are visible. No elements are hidden, clipped, or squeezed.
7. If either viewport has layout issues, AC5 fails.

*Note: AC5 is accepted as manual-only (RISK-ACCEPT 2026-07-01). Mark 🔴 if untested at either breakpoint.*

---

### Scenario AC6 — No auth data in the landing page HTML

1. Navigate to `http://localhost:3000/` in an incognito window.
2. Right-click → "View Page Source" (or press Ctrl+U).
3. Use Ctrl+F to search for the following strings in the page source:
   - `accessToken`
   - `session_id`
   - Any long hex string (30+ characters) that might be a token
4. **Expected:** Zero occurrences of any of these strings in the HTML source.
5. Also check the response headers in developer tools → Network → select the `/` request → Headers tab. Confirm no `Set-Cookie` header exposes a token value in the response body.
6. If any auth-related string is found in the HTML source, AC6 fails.

---

## Reset instructions

Between AC1–AC6, use separate incognito windows to avoid session state carrying over. To reset logged-in state: close and reopen an incognito window, or clear all cookies for `localhost`.
