# DoR Contract — lab-s2.2 — Email/password — third auth provider

**Story:** lab-s2.2
**Feature:** 2026-07-01-landing-auth-billing
**Contract approved:** 2026-07-01

---

## What will be built

Two new route handlers in `src/web-ui/routes/auth-email.js` (new file): `handleEmailSignup` (`POST /auth/email/signup`) and `handleEmailLogin` (`POST /auth/email/login`). A new bcrypt wrapper module `src/web-ui/modules/password.js` with injectable adapter (D37: default stub throws). A `users` table migration script `scripts/migrate-schema-users.js`. Auth chooser template updated with email/password form. Routes registered and adapters wired in `server.js` (separate wiring task). Rate limiter applied to auth/email endpoints (10 req/5 min/IP).

## What will NOT be built

- Password reset / forgot-password flow (post-MVP)
- Email verification (email trusted at signup — no verification email)
- OAuth account linking, admin-created accounts, remember-me sessions
- Google OAuth or GitHub OAuth changes

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | POST /auth/email/signup with valid email+password → assert: (a) email normalised to lowercase, (b) bcrypt hash stored (not plaintext), (c) session has `accessToken` (server-generated opaque token), `userId`, `tenantId`, `login`, (d) rotateSessionId called, (e) 302 to `/welcome` | Unit |
| AC2 | POST /auth/email/signup with already-registered email → assert 409 "Email already registered" | Unit |
| AC3 | POST /auth/email/login with correct password → session + 302; wrong password → 401 "Invalid email or password"; non-existent email → same 401 message (no distinction) | Unit |
| AC4 | Rate limiter: 10 attempts → 200/401 (pass through); 11th attempt from same IP → 429 | Unit |
| AC5 | DB write inspected: password hash stored, not plaintext; logger calls inspected: no `password` field in any log payload | Unit |
| AC6 | `rotateSessionId` spy: called on both signup and login; new Set-Cookie header present | Unit |
| AC7 | Auth chooser HTML contains email/password form elements | Unit |

## Assumptions

- lab-s1.3 is complete — email/password is added to the provider registry established by s1.3
- `bcrypt` (or `bcryptjs`) npm package is approved for this feature under the npm relaxation for auth packages
- `users` table does not yet exist (migration creates it); if it already exists, migration is idempotent (`CREATE TABLE IF NOT EXISTS`)
- Rate limiter can be implemented via in-memory counter (no Redis dependency for MVP)
- The `accessToken` for email/password sessions is a server-generated opaque token (e.g., `crypto.randomBytes(32).toString('hex')`) — NOT the password or hash

## Estimated touchpoints

Files: `src/web-ui/routes/auth-email.js` (new), `src/web-ui/modules/password.js` (new — bcrypt wrapper, injectable), `scripts/migrate-schema-users.js` (new), `src/web-ui/server.js` (modified — routes + wiring), `src/web-ui/templates/` (modified — email/password form)
Services: Neon Postgres (`users` table)
APIs: none

## schemaDepends

`dorStatus` — upstream story lab-s1.3 must be `dorStatus: "signed-off"` before implementation begins. `dorStatus` is a valid field in `pipeline-state.schema.json`.
