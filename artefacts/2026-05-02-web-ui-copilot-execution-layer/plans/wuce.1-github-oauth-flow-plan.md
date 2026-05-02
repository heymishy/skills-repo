# Implementation Plan: wuce.1 — GitHub OAuth flow and session establishment

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.1
**Plan date:** 2026-05-02
**Implementing agent:** VS Code Copilot inner loop

---

## Loaded inputs

**Story:** GitHub OAuth flow and authenticated session
**ACs:** 5 (AC1–AC5; AC4 manual-only — SAML SSO external dependency)
**Tests:** 18 test cases (T1.1–T1.4, T2.1–T2.3, T3.1–T3.3, T5.1–T5.2, IT1–IT4, NFR1–NFR2)
**Arch constraints:** ADR-004, ADR-009, ADR-012, mandatory CSRF, HttpOnly/Secure/SameSite=Strict

---

## Context policy

Zero external npm dependencies — Node.js built-ins only. No Express, no supertest, no jest. Follow existing repo test pattern (plain `assert` function, `passed`/`failed` counters, `node tests/check-*.js` runner).

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `tests/fixtures/github/oauth-token-exchange-success.json` | Create | Fixture: successful token exchange response |
| `tests/fixtures/github/oauth-token-exchange-error.json` | Create | Fixture: failed token exchange response |
| `tests/fixtures/github/user-identity.json` | Create | Fixture: GitHub user identity response |
| `tests/check-wuce1-oauth-flow.js` | Create | AC verification test file (18 test cases) |
| `src/web-ui/auth/oauth-adapter.js` | Create | Standalone OAuth adapter (ADR-012) |
| `src/web-ui/middleware/session.js` | Create | Session middleware + cookie config |
| `src/web-ui/routes/auth.js` | Create | Route handlers — auth separate from read/write (ADR-009) |
| `src/web-ui/server.js` | Create | HTTP server entry point (Node.js built-in http module) |
| `package.json` | Modify | Add `node tests/check-wuce1-oauth-flow.js` to test script |
| `CHANGELOG.md` | Modify | Add wuce.1 entry under ### Added |

---

## Task 1 — Create test fixtures

**Files:** `tests/fixtures/github/*.json`
**Run:** `node -e "require('./tests/fixtures/github/oauth-token-exchange-success.json')"`
**Expected:** No error

### Fixture contents

`oauth-token-exchange-success.json`:
```json
{ "access_token": "gho_test_fixture_token_wuce1", "token_type": "bearer", "scope": "repo,read:user" }
```

`oauth-token-exchange-error.json`:
```json
{ "error": "bad_verification_code", "error_description": "The code passed is incorrect or expired." }
```

`user-identity.json`:
```json
{ "login": "test-stakeholder", "id": 99001, "name": "Test Stakeholder", "email": "stakeholder@example.com", "avatar_url": "https://avatars.githubusercontent.com/u/99001" }
```

**Commit:** `test: add wuce.1 fixture files for OAuth and user identity`

---

## Task 2 — Write RED test file (T1.1–T1.4, T2.1–T2.3, T3.1–T3.3, T5.1–T5.2, IT1–IT4, NFR1–NFR2)

**File:** `tests/check-wuce1-oauth-flow.js`
**Run:** `node tests/check-wuce1-oauth-flow.js`
**Expected RED:** `Cannot find module '../src/web-ui/auth/oauth-adapter'`

Test pattern follows existing repo convention: custom `assert(condition, label)` function, `tests[]` registry, async `main()` runner.

Tests mock `global.fetch` per-test and restore after. Mock req/res objects used for route handler tests.

---

## Task 3 — Implement oauth-adapter.js (GREEN for T1.x, T2.x)

**File:** `src/web-ui/auth/oauth-adapter.js`

Key functions:
- `generateState()` — `crypto.randomBytes(16).toString('hex')`
- `buildOAuthRedirectURL(state)` — `new URL('https://github.com/login/oauth/authorize')` with client_id, scope=`repo,read:user`, state, redirect_uri from env vars
- `exchangeCodeForToken(code)` — POST to `https://github.com/login/oauth/access_token` with URLSearchParams body
- `getUserIdentity(token)` — GET `https://api.github.com/user` with Authorization header
- `storeTokenInSession(req, token)` — `req.session.accessToken = token`
- `validateOAuthState(sessionState, callbackState)` — strict equality, returns false if either is falsy

**Run:** `node tests/check-wuce1-oauth-flow.js`
**Expected:** T1.1–T1.4 and T2.1–T2.3 pass; remaining tests still fail

**Commit:** `feat: wuce.1 — oauth-adapter.js standalone auth functions`

---

## Task 4 — Implement session.js (GREEN for NFR1)

**File:** `src/web-ui/middleware/session.js`

Key exports:
- `SESSION_COOKIE_CONFIG` — `{ httpOnly: true, secure: true, sameSite: 'strict', path: '/' }`
- `sessionMiddleware(req, res)` — parses session_id cookie, attaches req.session/req.sessionId
- `createSession()`, `getSession(id)`, `destroySession(id)` — in-memory Map store

Set-Cookie header: `session_id=<id>; HttpOnly; SameSite=Strict; Path=/; Secure` (Secure omitted in development)

**Run:** `node tests/check-wuce1-oauth-flow.js`
**Expected:** NFR1 passes

**Commit:** `feat: wuce.1 — session middleware with HttpOnly Secure SameSite=Strict config`

---

## Task 5 — Implement routes/auth.js (GREEN for T3.x, T5.x, IT1–IT4, NFR2)

**File:** `src/web-ui/routes/auth.js`

Key functions:
- `handleAuthGithub(req, res)` — generates state, stores in session, redirects to OAuth URL
- `handleAuthCallback(req, res)` — validates state (403 + log on mismatch), exchanges code, stores token, fetches user, logs login, redirects to /dashboard
- `handleLogout(req, res)` — clears session, logs logout, redirects to /
- `authGuard(req, res, next)` — checks req.session.accessToken, redirects to / if absent
- `setLogger(logger)` — replaces internal `_logger` (used in tests)

Security: token never in response body/headers; log entries contain userId + timestamp only; state mismatch logs sessionId (no token)

**Run:** `node tests/check-wuce1-oauth-flow.js`
**Expected:** 43/43 passing

**Commit:** `feat: wuce.1 — GitHub OAuth flow and session establishment` (full commit — see actual commit for details)

---

## Task 6 — Implement server.js

**File:** `src/web-ui/server.js`

Node.js `http.createServer` with router function. Mounts session middleware and auth routes. Zero external dependencies.

---

## Task 7 — Add to npm test chain and CHANGELOG

```powershell
node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.scripts.test+=' && node tests/check-wuce1-oauth-flow.js';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2),'utf8')"
```

Add CHANGELOG entry under `### Added`.

**Commit:** `chore: add wuce.1 test to npm test chain and CHANGELOG`

---

## AC coverage summary

| AC | Description | Tests | Status |
|----|-------------|-------|--------|
| AC1 | OAuth redirect with client ID, scopes, random state | T1.1, T1.2, T1.3, T1.4, IT1 | ✅ |
| AC2 | Valid callback → token exchange → session → dashboard | T2.1, T2.2, T2.3, IT2 | ✅ |
| AC3 | State mismatch → 403, no token, logged | T3.1, T3.2, T3.3, IT3 | ✅ |
| AC4 | SAML SSO enterprise | — | Manual only (external dependency) |
| AC5 | Session expiry → redirect to sign-in, no details exposed | T5.1, T5.2, IT4 | ✅ |
| NFR — Security | HttpOnly Secure SameSite=Strict | NFR1 | ✅ |
| NFR — Audit | Login event logged, no token in log | NFR2 | ✅ |
