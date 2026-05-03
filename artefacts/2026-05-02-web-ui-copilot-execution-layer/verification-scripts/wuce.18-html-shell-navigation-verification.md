# Verification Script: HTML shell and navigation

**Story:** wuce.18 — HTML shell and navigation
**For:** Human reviewer / smoke-test operator after merge

---

## Pre-conditions

- Application running locally with `node --env-file=.env src/web-ui/server.js`
- A valid GitHub OAuth session established (or `NODE_ENV=test` for local checks)
- `tests/check-wuce18-html-shell.js` committed to repository

---

## AC1 — Dashboard page has nav with four links and shows user login

**Automated check (run in terminal):**
```bash
node tests/check-wuce18-html-shell.js
```
All tests must pass including T9, T11, T12.

**Manual smoke check:**
1. Navigate to `http://localhost:3000/dashboard` in a browser (authenticated)
2. Confirm the page contains a visible navigation bar with: "Features", "Actions", "Status", "Run a Skill"
3. Confirm your GitHub login name is visible on the page (in the header)
4. Confirm `Content-Type` response header is `text/html; charset=utf-8` (browser DevTools → Network)

**Pass criteria:** Navigation visible, 4 links present, login name shown, correct Content-Type

---

## AC2 — Unauthenticated /dashboard → 302 to /auth/github

**Automated check:** T10 in `check-wuce18-html-shell.js`

**Manual smoke check:**
1. Open a private/incognito browser window
2. Navigate to `http://localhost:3000/dashboard`
3. Confirm you are redirected to the GitHub OAuth page (or `/auth/github` redirect)

**Pass criteria:** Redirect fires; you do not see the dashboard HTML

---

## AC3 — renderShell produces complete HTML document with all structural elements

**Automated check:** T1–T8, T13–T15, T17 in `check-wuce18-html-shell.js`

All 18 unit/integration tests must pass.

---

## AC4 — XSS: `<script>` in user login appears as `&lt;script&gt;`

**Automated check:** T6, T18 in `check-wuce18-html-shell.js`

**Manual smoke check (if test infrastructure allows login override):**
1. Set mock user login to `<script>alert(1)</script>` in test environment
2. Load `/dashboard`
3. Confirm no alert fires
4. View page source — confirm `&lt;script&gt;alert(1)&lt;/script&gt;` is present, not the raw tag

**Pass criteria:** No alert, escaped text in source

---

## AC5 — Keyboard navigation reaches all four nav links with visible focus

**Automated check:** T19–T20 in `tests/e2e/wuce18-keyboard-nav.spec.ts`

Run with:
```bash
npx playwright test tests/e2e/wuce18-keyboard-nav.spec.ts
```

**Manual smoke check:**
1. Load `/dashboard` in a browser
2. Press Tab from the browser address bar
3. Confirm focus moves to the first nav link ("Features") with a visible outline/ring
4. Press Tab three more times — confirm "Actions", "Status", "Run a Skill" each receive visible focus in order

**Pass criteria:** All 4 links focusable in order; focus outline visible on each

---

## NFR checks

| NFR | Check |
|-----|-------|
| `escHtml()` is exported from `html-shell.js` and not duplicated elsewhere | `grep -r "function escHtml" src/` should return exactly one match in `html-shell.js` |
| No external CSS CDN | `grep -r "cdn\." src/web-ui/utils/html-shell.js` should return nothing |
| `renderShell()` is synchronous | No `async`/`await`/`Promise` in the function body |
