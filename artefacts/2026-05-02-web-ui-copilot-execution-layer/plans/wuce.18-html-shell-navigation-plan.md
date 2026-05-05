# Implementation Plan: wuce.18 — HTML shell and navigation

**Branch:** feature/wuce.18-html-shell-navigation
**Worktree:** .worktrees/wuce.18-html-shell-navigation
**Date:** 2026-05-04

---

## Contract note — DoR contract vs DoR instructions discrepancy

The DoR contract (`wuce.18-html-shell-navigation-dor-contract.md`) says not to touch `server.js` or route handlers, but:
1. The Coding Agent Instructions in the DoR explicitly require modifying `server.js` and adding to `routes/dashboard.js`
2. The test plan (AC1/AC2 integration tests) requires GET /dashboard to return HTML with nav and 302 when unauthenticated
3. The story ACs (AC1, AC2) cannot pass without a server route change

**Resolution:** Follow Coding Agent Instructions + test plan + story ACs. A PR comment notes the discrepancy.

The current `/dashboard` stub uses `authGuard` which redirects to `/` (not `/auth/github`). AC2 and T10 require redirect to `/auth/github`. `handleDashboard` will perform its own auth check and redirect to `/auth/github` directly.

---

## Files to create/modify

| File | Action |
|------|--------|
| `src/web-ui/utils/html-shell.js` | Create — `renderShell()` and `escHtml()` |
| `src/web-ui/routes/dashboard.js` | Modify — add `handleDashboard` export |
| `src/web-ui/server.js` | Modify — import `handleDashboard`, update `/dashboard` route |
| `tests/check-wuce18-html-shell.js` | Create — 18 unit/integration tests |
| `tests/e2e/wuce18-keyboard-nav.spec.ts` | Create — 2 Playwright E2E tests (not in npm test) |
| `package.json` | Modify — add `node tests/check-wuce18-html-shell.js` to test chain |

---

## Task 1 — Create test file (RED)

**File:** `tests/check-wuce18-html-shell.js`  
**TDD step:** Write failing tests first. Tests fail because `src/web-ui/utils/html-shell.js` doesn't exist yet.

**Commit:** `test(wuce.18): add failing tests for html-shell and dashboard (RED)`

---

## Task 2 — Create html-shell.js (GREEN — unit tests)

**File:** `src/web-ui/utils/html-shell.js`

**Exports:**
- `escHtml(str)` — escapes `&`, `<`, `>`, `"`, `'` to HTML entities
- `renderShell({ title, bodyContent, user })` — returns full HTML document string

**HTML structure:**
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>{title}</title>
    <style>/* focus-visible outline */</style>
  </head>
  <body>
    <header><span class="user-login">{user.login}</span></header>
    <nav aria-label="Main navigation">
      <a href="/features">Features</a>
      <a href="/actions">Actions</a>
      <a href="/status">Status</a>
      <a href="/skills">Run a Skill</a>
    </nav>
    <main>{bodyContent}</main>
  </body>
</html>
```

**After this task:** T1–T8, T13–T17 pass (14 unit tests GREEN). T9–T12, T16, T18 still RED (need handleDashboard).

**Commit:** `feat(wuce.18): add html-shell.js with renderShell and escHtml`

---

## Task 3 — Add handleDashboard to dashboard.js + update server.js (GREEN — integration tests)

**File:** `src/web-ui/routes/dashboard.js` (add handleDashboard)

**handleDashboard:**
- If `!req.session || !req.session.accessToken` → 302 to `/auth/github`
- Else: write audit log `{ userId, route: '/dashboard', timestamp }`, render shell with user login, respond 200 text/html; charset=utf-8

**File:** `src/web-ui/server.js` (update /dashboard route)
- Add `handleDashboard` to import from `./routes/dashboard`
- Replace authGuard+stub with direct `handleDashboard(req, res)` call (auth check is inside handler)

**After this task:** All 18 tests GREEN.

**Commit:** `feat(wuce.18): add handleDashboard route and wire to server.js`

---

## Task 4 — Create E2E spec (not in npm test)

**File:** `tests/e2e/wuce18-keyboard-nav.spec.ts`

T19: Tab navigation reaches all four nav links in order
T20: Focused nav link has visible outline (outline-style != 'none')

**Commit:** `test(wuce.18): add Playwright E2E spec for keyboard navigation`

---

## Task 5 — Add to package.json test chain

**File:** `package.json`
- Append `&& node tests/check-wuce18-html-shell.js` to the end of the test script

**Commit:** `chore(wuce.18): add check-wuce18-html-shell to npm test chain`
