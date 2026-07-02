# Definition of Ready — lab-s2.2 — Email/password — third auth provider

**Story:** lab-s2.2
**Feature:** 2026-07-01-landing-auth-billing
**DoR run date:** 2026-07-01
**Review:** PASS — Run 1, 2026-07-01
**Test plan:** 13 tests covering 7 ACs
**Verification script:** 7 scenarios

---

## Contract Proposal

See `dor/lab-s2.2-dor-contract.md` (approved).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs. bcrypt hash verification (AC1/AC5) uses real bcrypt in tests (not mocked) — intentional, as the NFR cost-factor requirement (≥10) can only be verified by parsing the hash prefix. Rate limiter (AC4) uses in-memory counter for MVP. AC5 password-not-in-logs assertion is a captured-logger check, not manual inspection.

---

## Hard Block Checklist

| # | Check | Result | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | PASS | "As a new visitor / prospective user…" |
| H2 | ≥3 ACs in Given / When / Then format | PASS | 7 ACs, all GWT |
| H3 | Every AC has at least one test | PASS | T1.1–T7.1, NFR1, NFR2 cover all ACs |
| H4 | Out-of-scope section populated | PASS | 5 explicit exclusions |
| H5 | Benefit linkage references a named metric | PASS | M1 |
| H6 | Complexity rated | PASS | Complexity: 3 |
| H7 | No unresolved HIGH findings | PASS | 0 HIGH findings |
| H8 | Test plan covers all ACs; gaps acknowledged | PASS | All ACs covered |
| H8-ext | Cross-story schema dependency check | PASS | `schemaDepends: [dorStatus]` declared; field in schema |
| H9 | Architecture Constraints populated | PASS | D37 (bcrypt wrapper injectable), sec-perf rotateSessionId, canonical accessToken, password never in logs, ADR-011, CJS-only |
| H-E2E | CSS-layout ACs have RISK-ACCEPT | PASS | No CSS-layout ACs |
| H-NFR | NFR profile exists | PASS | Confirmed |
| H-NFR2 | Compliance NFRs with regulatory clauses | PASS | None |
| H-NFR3 | Data classification not blank | PASS | Classified |
| H-NFR-profile | Story NFRs → NFR profile exists | PASS | Profile present |
| H-GOV | discovery.md Approved By | PASS | "Hamish King — Platform operator — 2026-07-01" |
| H-ADAPTER | Injectable adapters have wiring ACs | PASS | `password.js` D37: stub throws; wiring in server.js is a required touchpoint (separate task) |
| H-INF | Infra-plan gate | PASS | Not triggered |
| H-MIG | Migration-review gate | PASS | Not triggered |

**Hard blocks: 19/19 PASS**

---

## Warnings

| # | Check | Status |
|---|-------|--------|
| W1 | NFRs populated | PASS — bcrypt cost ≥10, rate limiting, no plaintext passwords |
| W2 | Scope stability declared | PASS — Stable |
| W3 | MEDIUM review findings acknowledged | PASS — All resolved |
| W4 | Verification script reviewed by domain expert | RISK-ACCEPT — Solo operator. Already logged. |
| W5 | No UNCERTAIN items in gap table | PASS |

---

## Oversight Level

**Low** — personal-scope project.

---

## Standards Injection

No `domain` field — skipped.

---

## ✅ Definition of Ready: PROCEED — lab-s2.2

Hard blocks: 19/19 passed
Warnings: W4 RISK-ACCEPT acknowledged
Oversight: Low
**Entry gate: lab-s1.3 must be signed-off before implementation begins.**

---

## Coding Agent Instructions

**Story:** lab-s2.2 — Email/password — third auth provider
**Complexity:** 3 | **Oversight:** Low
**Entry gate:** lab-s1.3 DoR signed-off.

### What to build

**`src/web-ui/modules/password.js`** — bcrypt wrapper with D37 injectable adapter:
- `hashPassword(plaintext)` → `bcrypt.hash(plaintext, 10)` (cost factor ≥10 mandatory)
- `verifyPassword(plaintext, hash)` → `bcrypt.compare(plaintext, hash)`
- `setPasswordAdapter(impl)` — injectable; default stub throws `Error('Adapter not wired: passwordAdapter. Call setPasswordAdapter() before use.')`

**`scripts/migrate-schema-users.js`** — `CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now())`

**`src/web-ui/routes/auth-email.js`** — Two handlers:
- `handleEmailSignup`: normalise email to lowercase → check duplicate (409 if exists) → `hashPassword` → store `{email, password_hash}` → create session with `accessToken = crypto.randomBytes(32).toString('hex')`, `userId`, `tenantId` (email as tenantId), `login` (email) → `rotateSessionId` → 302 `/welcome`
- `handleEmailLogin`: find user by email → `verifyPassword` (wrong → 401 "Invalid email or password"; same message for non-existent email) → create session → `rotateSessionId` → 302 `/dashboard`

Rate limiter: 10 attempts per IP per 5 minutes on both endpoints → 429 on 11th.

### Required touchpoints

- `src/web-ui/modules/password.js` — CREATE (bcrypt wrapper, injectable)
- `src/web-ui/routes/auth-email.js` — CREATE (signup + login handlers)
- `scripts/migrate-schema-users.js` — CREATE (users table migration)
- `src/web-ui/server.js` — MODIFY (register routes, wire password adapter, wire DB adapter — separate task)
- `src/web-ui/templates/` — MODIFY (add email/password form to auth chooser)

### MUST NOT touch

- `src/web-ui/routes/auth.js` (GitHub/Google OAuth handler — regression risk)
- `src/web-ui/auth/oauth-adapter.js` (provider registry from lab-s1.3)
- `posthog-server.js` (existing adapter — do not modify)

### Test runner

`node tests/check-lab-s2.2-email-password.js`

### Task order (implementation plan)

**Task 1:** Create `scripts/migrate-schema-users.js` — idempotent `users` table migration
**Task 2:** Create `src/web-ui/modules/password.js` — bcrypt wrapper with throwing stub default
**Task 3:** Implement `handleEmailSignup` in `auth-email.js` — signup flow (email normalise, duplicate check, hash, session, rotateSessionId, 302 /welcome)
**Task 4:** Implement `handleEmailLogin` in `auth-email.js` — login flow (lookup, bcrypt compare, session, rotateSessionId, 302 /dashboard)
**Task 5:** Add rate limiter to both endpoints (in-memory, 10/5min/IP)
**Task 6 (separate D37 task):** Wire password adapter + register routes in `server.js`
**Task 7:** Update auth chooser template with email/password form
**Task 8:** Run test suite — all 13 tests must pass, 0 failures

### Architecture constraints

- bcrypt cost factor MUST be exactly 10 or higher — NFR1, verified by parsing `$2b$NN$` prefix in hash (NFR1 test parses prefix)
- Password MUST NEVER appear in any log payload, DB write, or response body — AC5 test captures logger calls
- `accessToken` for email/password sessions is `crypto.randomBytes(32).toString('hex')` — NOT the password hash
- `rotateSessionId` called on both signup AND login (AC6)
- Non-existent email → same 401 message as wrong password — timing-safe enumeration prevention
- D37: password.js default stub MUST throw, not return null

### Inner loop order

0. /decisions — no additional RISK-ACCEPTs
1. /branch-setup
2. /implementation-plan — 8 tasks as above
3. /subagent-execution or /tdd per task
4. /verify-completion — `node tests/check-lab-s2.2-email-password.js` 0 failures
5. /branch-complete
