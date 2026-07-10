# Auth journey spec — Implementation Plan

> **For agent execution:** Executed task-by-task in this session (/tdd discipline), no subagent fan-out used — single coherent auth-stack story with tight coupling between unit/integration/E2E layers.

**Goal:** Make every test in the test plan pass (AC1–AC5): deterministic browser-driven coverage of GitHub OAuth first-login/returning-user redirect, session expiry re-authentication, cross-provider `accessToken` leak prevention, and a `@mocked` Playwright variant that never calls real OAuth endpoints.
**Branch:** `feature/bri-s3.6`
**Worktree:** `.worktrees/bri-s3.6`
**Test command:** `node tests/check-bri-s3.6-auth-journey.js` (unit + integration) and `npx playwright test tests/e2e/bri-s3.6-auth-journey.spec.js` (E2E)

---

## File map

```
Create:
  tests/check-bri-s3.6-auth-journey.js       — unit + integration tests for AC1, AC2, AC4, AC5
  tests/e2e/bri-s3.6-auth-journey.spec.js    — Playwright E2E spec (@mocked), covers AC1–AC5

Modify:
  package.json                                — register new check file in scripts.test chain
```

No production code changes are expected — the auth stack (`auth.js`, `auth-email.js`, `oauth-adapter.js`, `middleware/session.js`, `modules/user-flags.js`) already implements the `f845caf7`-fixed behaviour this spec locks in. If a test reveals an actual defect, the fix is scoped strictly to the failing AC.

---

## Task 1: Unit test — `rotateSessionId` called once per provider login

**Files:**
- Create: `tests/check-bri-s3.6-auth-journey.js` (this task adds the file + first test group; later tasks append to it)

- [ ] **Step 1: Write the failing test**

```javascript
// U1: rotateSessionId invoked exactly once per login, for GitHub, Google, and email/password
test('U1a GitHub login calls rotateSessionId exactly once', async () => { /* spy rotateSessionId via auth.js require, stub oauth-adapter, call handleAuthCallback, assert spy.callCount === 1 */ });
test('U1b Google login calls rotateSessionId exactly once', async () => { /* same via handleAuthGoogleCallback */ });
test('U1c email/password login calls rotateSessionId exactly once', async () => { /* same via handleEmailLogin */ });
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s3.6-auth-journey.js
```

Expected output: `Cannot find module '../tests/check-bri-s3.6-auth-journey.js'` (file does not exist yet) — or once the file is scaffolded with only a stub, a clear assertion failure until the spy wiring is correct.

- [ ] **Step 3: Write minimal implementation**

No production code change — wire `_rotateSessionId`-style spies via the existing D37 injectable seams (`auth-email.js`'s `setRotateSessionId`, monkeypatching `session.rotateSessionId` used by `auth.js`, mirroring `check-arl-s4-admin-billing-bypass.js`'s pattern).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s3.6-auth-journey.js
```

Expected output: `U1a/U1b/U1c [PASS]`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-wuce1-oauth-flow.js && node tests/check-arl-s4-admin-billing-bypass.js
```

Expected output: all passing (pre-existing suites unaffected)

- [ ] **Step 6: Commit**

```bash
git add tests/check-bri-s3.6-auth-journey.js
git commit -m "test(bri-s3.6): rotateSessionId called once per provider login"
```

---

## Task 2: Integration tests — first-time vs returning redirect (AC1/AC2), token-leak scan (AC4), no-real-OAuth-call assertion (AC5)

**Files:**
- Modify: `tests/check-bri-s3.6-auth-journey.js` (append test groups)

- [ ] **Step 1: Write the failing tests**

```javascript
// IT1: first-time GitHub login -> 302 /welcome; returning GitHub login -> 302 /dashboard
// IT2: accessToken never appears in HTML body or captured logs, any of the 3 providers
// IT3: OAuth provider exchange is stubbed; zero real fetch() calls hit github.com/accounts.google.com
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-bri-s3.6-auth-journey.js
```

Expected output: assertion failures until stubs for `_userFlags`, `_oauthAdapter`, and `global.fetch` spies are wired correctly.

- [ ] **Step 3: Write minimal implementation**

No production code change. Test-side stubbing only: `userFlags.setUserFlagsAdapter` (first-time vs returning), `oauthAdapter.setProviderAdapter`/`setGoogleUserInfoAdapter` (stub exchange), a `global.fetch` spy asserting it is never called with a github.com/accounts.google.com real endpoint URL.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s3.6-auth-journey.js
```

Expected output: `IT1/IT2/IT3 [PASS]`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node tests/check-bri-s3.6-auth-journey.js
```

Expected output: all groups passing, 0 failed

- [ ] **Step 6: Commit**

```bash
git add tests/check-bri-s3.6-auth-journey.js
git commit -m "test(bri-s3.6): AC1/AC2 redirect split, AC4 token-leak scan, AC5 no-real-oauth-call assertion"
```

---

## Task 3: E2E Playwright spec — `tests/e2e/bri-s3.6-auth-journey.spec.js` (@mocked)

**Files:**
- Create: `tests/e2e/bri-s3.6-auth-journey.spec.js`

- [ ] **Step 1: Write the failing test**

```javascript
// Scenario 1 (AC1): first-time GitHub login -> /welcome
// Scenario 2 (AC2): returning GitHub login -> /dashboard
// Scenario 3 (AC3): expired/invalidated session -> redirected to re-auth, not a dead end
// Scenario 4 (AC4): rendered page content never contains the literal accessToken value
// Scenario 5 (AC5): call-count spy confirms zero real GitHub/Google OAuth endpoint calls
```

- [ ] **Step 2: Run test — must fail**

```bash
npx playwright test tests/e2e/bri-s3.6-auth-journey.spec.js
```

Expected output: fails (spec file does not exist yet), or fails on a specific assertion once scaffolded before the test-mode session-seed routes it needs exist.

- [ ] **Step 3: Write minimal implementation**

Uses the existing `NODE_ENV=test`-gated `/test/session` endpoint and `tests/e2e/fixtures/auth.js` bypass fixture for the "already authenticated" scenarios (session-expiry, token-leak scan), and drives the real `/auth/github` -> `/auth/github/callback` redirect chain (server-side OAuth exchange stubbed via test-mode wiring in `server.js`) for the first-time/returning login scenarios so the browser genuinely traverses the redirect chain without contacting github.com.

- [ ] **Step 4: Run test — must pass**

```bash
npx playwright test tests/e2e/bri-s3.6-auth-journey.spec.js
```

Expected output: `5 passed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npx playwright test
```

Expected output: existing specs still pass; no shared test-mode state left dirty between specs

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/bri-s3.6-auth-journey.spec.js
git commit -m "test(bri-s3.6): Playwright @mocked auth journey spec for AC1-AC5"
```

---

## Task 4: Register new check file in package.json test chain; final verification

**Files:**
- Modify: `package.json`

- [ ] **Step 1–2:** N/A (config change, not a code unit under test)

- [ ] **Step 3: Write the change**

```json
"test": "... && node tests/check-bri-s2.1-fly-staging-app.js && node tests/check-bri-s3.6-auth-journey.js"
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-bri-s3.6-auth-journey.js
```

Expected output: all groups passing

- [ ] **Step 5: Run full suite**

```bash
npm test
```

Expected output: existing pre-existing unrelated failure in `check-definition-skill.js` (`.github/skills/definition/SKILL.md not found`) blocks the full chain — confirmed present on `origin/master` before this story touched anything; acknowledged as out-of-scope baseline defect, not introduced by bri-s3.6. New check file verified directly via `node tests/check-bri-s3.6-auth-journey.js` instead.

- [ ] **Step 6: Commit**

```bash
git add package.json
git commit -m "chore(bri-s3.6): register auth journey check in test chain"
```
