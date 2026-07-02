# Definition of Ready — lab-s2.1 — Google OAuth — second auth provider

**Story:** lab-s2.1
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 12 tests covering 7 ACs
**Verification script:** 7 scenarios

---

## Contract Proposal

See `dor/lab-s2.1-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. CSRF state validation (AC7) is a hard unit test, not a manual check. AC5 ("Continue with Google" visible) is DOM-presence only — not CSS-layout-dependent. GitHub regression (AC6) is an explicit test runner invocation.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As a new visitor / prospective user…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 7 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T1.1–T7.2 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 5 explicit exclusions |
| H5 | Benefit linkage references a named metric | PASS | M1 |
| H6 | Complexity rated | PASS | Complexity: 2 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | No gaps — all ACs unit testable |
| H8-ext | Cross-story schema dependency check | PASS | `schemaDepends: [dorStatus]` declared; `dorStatus` in schema |
| H9 | Architecture Constraints populated | PASS | sec-perf rotateSessionId, CSRF state mandatory, canonical accessToken field, CJS-only |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | No CSS-layout ACs (AC5 is DOM-presence, not layout) |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None |
| H-NFR3 | Data classification not blank | PASS | Classified |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | Google provider adapter: stub throws (re-uses registry D37 from s1.3), wiring in server.js is a required touchpoint |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — No credentials committed, audit log on login |
| W2 | Scope stability declared | PASS — Stable |
| W3 | MEDIUM review findings acknowledged | PASS — All resolved |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator. Already logged. |
| W5 | No UNCERTAIN items in gap table | PASS — No gaps |

---

## Oversight Level

**Low** — personal-scope project.

---

## Standards Injection

No `domain` field — skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s2.1

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low
**Entry gate: lab-s1.3 must be signed-off before implementation begins.**

---

## Coding Agent Instructions

**Story:** lab-s2.1 — Google OAuth — second auth provider
**Complexity:** 2 | **Oversight:** Low
**Entry gate:** lab-s1.3 DoR signed-off (provider registry in place).

### What to build

Add Google OAuth 2.0 to the provider registry. Two handlers:

**`GET /auth/google`** — Build Google OAuth redirect URL with: `client_id` from env, `redirect_uri` from `GOOGLE_CALLBACK_URL`, `scope=openid email`, `response_type=code`, and a crypto-random `state` stored in `req.session.oauthState`. Respond 302.

**`GET /auth/google/callback`** — Validate `req.query.state` against `req.session.oauthState`; mismatch → 403, audit log `oauth_state_mismatch`, no token stored. On match: exchange `code` for Google access token, fetch userinfo (`sub`, `email`), set session fields (`accessToken`, `userId`, `tenantId`, `login`), call `rotateSessionId`, redirect to `/dashboard` (or `/welcome` if first login — check `firstLogin` flag if lab-s2.3 is merged; otherwise always `/dashboard`).

Update auth chooser template to include "Continue with Google" button.

### Required touchpoints

- `src/web-ui/routes/auth.js` or `src/web-ui/routes/auth-google.js` — CREATE/MODIFY (two Google handlers)
- `src/web-ui/auth/oauth-adapter.js` — MODIFY (add Google provider config to registry)
- `src/web-ui/server.js` — MODIFY (register `/auth/google` and `/auth/google/callback`, wire Google adapter)
- `src/web-ui/templates/` — MODIFY (add "Continue with Google" button to auth chooser)

### MUST NOT touch

- GitHub OAuth handler logic (regression risk — AC6)
- `src/web-ui/routes/public.js` (landing page, lab-s1.2 scope)
- Email/password auth (lab-s2.2 scope)

### Test runner

`node tests/check-lab-s2.1-google-oauth.js`

Regression: `node tests/check-wuce1-oauth-flow.js` — must show 0 failures (AC6)

### Task order (implementation plan)

**Task 1:** Add Google provider config to `oauth-adapter.js` / registry — `getGoogleAuthUrl(state)`, injectable `fetchGoogleUserInfo(code)` with throwing stub
**Task 2:** Implement `handleAuthGoogle` handler — builds redirect URL, stores state in session
**Task 3:** Implement `handleAuthGoogleCallback` handler — state validation, code exchange, session population, rotateSessionId, redirect
**Task 4 (separate D37 task):** Wire Google adapter in `server.js` — register routes, wire real Google userinfo fetcher
**Task 5:** Update auth chooser template — "Continue with Google" button
**Task 6:** Run test suite + regression — 0 failures each

### Architecture constraints

- CSRF state parameter: always store in `req.session.oauthState` before redirect; always validate on callback — mismatch is 403, not 302
- `req.session.accessToken` = Google access token (canonical field) — never store as `req.session.googleToken`
- `rotateSessionId` must be called after every successful Google callback (sec-perf AC4)
- No credentials committed: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` are Fly.io secrets only

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 6 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — both test files 0 failures
5. /branch-complete
