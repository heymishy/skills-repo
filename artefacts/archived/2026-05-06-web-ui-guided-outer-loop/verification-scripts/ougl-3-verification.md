# AC Verification Script — ougl.3: Journey entry screen and start endpoint

**Story:** ougl.3 — Journey entry screen and start endpoint
**Verified by:** Developer / BA / tech lead
**When to run:** After implementation. Run unit tests first, then browser smoke check.

---

## Pre-conditions

- `src/web-ui/routes/journey.js` created
- `server.js` wires `GET /journey` and `POST /api/journey`
- Server started with GitHub OAuth credentials in `.env`

---

## Run unit tests

```powershell
node tests/check-ougl3-journey-entry-and-start.js
```

**Expected before implementation:** All 7 tests fail. `Failed: 7`.
**Expected after implementation:** All 7 tests pass. `Failed: 0`.

---

## Browser smoke check (start server first)

```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object { $k,$v = $_ -split '=',2; Set-Item "env:$k" $v }
node src/web-ui/server.js
```

---

## AC Scenario Walkthroughs

### AC1 — Auth GET /journey → 200 with form
1. Open browser, log in via GitHub OAuth.
2. Navigate to `http://localhost:3000/journey`.
3. Verify: page loads with HTTP 200, page contains a form with `method="POST"` and action pointing to `/api/journey` (or equivalent).
4. PASS if form visible. FAIL if page is missing or form is absent.

### AC2 — Unauth GET → 302 redirect to /auth/github
1. In an incognito window (no session), visit `http://localhost:3000/journey`.
2. Verify browser redirected to `http://localhost:3000/auth/github` (or GitHub OAuth URL).
3. PASS if redirected. FAIL if page loads without auth.

### AC3 — POST creates journey, session, and links them
1. Log in, visit `/journey`, submit the form.
2. In server logs, verify: `createJourney` called, `registerHtmlSession` called with `skillName === 'discovery'`, `setActiveSession` called, `linkSessionToJourney` called.
3. PASS if all four log events present. FAIL if any missing.

### AC4 — POST → 303 redirect to discovery chat
1. Submit the form (authenticated).
2. Verify browser is redirected to `/skills/discovery/sessions/[sessionId]/chat`.
3. PASS if URL matches pattern. FAIL if redirect goes elsewhere or page is a 500.

### AC5 — Unauth POST → 302
1. In an incognito window, POST directly to `/api/journey` (e.g., via curl or devtools).
2. Verify: response is 302 to `/auth/github`.
3. PASS if redirected. FAIL if request processed without auth.

### AC6 — HTML has "journey" heading; no hidden inputs
1. Load `GET /journey` authenticated.
2. View page source. Verify: (a) heading or title contains the word "journey" (case-insensitive), (b) no `<input type="hidden"` elements in the form.
3. PASS if heading present and no hidden inputs. FAIL if either fails.

### AC7 — POST error → 500 with readable HTML error page
1. Temporarily make the server throw during session creation (e.g., disconnect journey store or inject a throw).
2. Submit the form.
3. Verify: response is HTTP 500, page is rendered HTML (not a raw JSON error or stack trace), page shows a human-readable error message.
4. PASS if rendered HTML with message. FAIL if raw stack trace shown.

---

## Regression check

Run `npm test` after implementation and confirm all previously-passing tests still pass.
