# Story lab-s2.2 — Email/password — third auth provider

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e2-providers-onboarding
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 3
**Scope stability:** Stable

## User story

As a new visitor / prospective user,
I want to sign up and log in using an email address and password,
So that I can access the platform without needing a GitHub or Google account.

## Metric linkage

- **M1** (Self-serve signup conversion, benefit-metric.md §M1): Email/password removes the final auth barrier for users without GitHub or Google accounts. Completed email/password signups contribute to the `auth_completed` PostHog funnel event.

## Acceptance criteria

**AC1** — `POST /auth/email/signup` creates a new user and returns a session
Given a visitor submits a valid email and password (minimum 12 characters) to `POST /auth/email/signup`,
When the handler runs,
Then: (1) the email is normalised to lowercase, (2) a bcrypt hash of the password is stored (never the plaintext), (3) the user record is saved to the `users` table in Neon Postgres, (4) a session is created with `req.session.accessToken` (a server-generated opaque token — NOT the password hash), `req.session.userId`, `req.session.tenantId` (email address as tenantId when no org allowlist), and `req.session.login` (the email address), (5) `rotateSessionId` is called, and (6) the response is 302 to `/welcome`.

**AC2** — Duplicate email registration returns 409
Given an email address that already exists in the `users` table,
When `POST /auth/email/signup` is called with that email,
Then the response is HTTP 409 with a plain-text body "Email already registered" — no password or hash information is exposed.

**AC3** — `POST /auth/email/login` authenticates returning users
Given a user with a valid email/password account submits their credentials to `POST /auth/email/login`,
When the handler runs,
Then: (1) the submitted password is compared against the stored bcrypt hash using `bcrypt.compare`, (2) on match: a session is created with correct fields, `rotateSessionId` is called, and the response is 302 to `/dashboard` (or `/welcome` if `firstLogin` flag is set), (3) on mismatch: 401 with "Invalid email or password" — no distinction between wrong email and wrong password.

**AC4** — Brute-force protection: rate limiting on auth/email endpoints
Given the email/password login endpoint,
When more than 10 login attempts from the same IP address occur within 5 minutes with incorrect credentials,
Then subsequent attempts from that IP return 429 "Too many attempts" until the window expires.

**AC5** — Password is never stored in plaintext, never logged, never returned in any response
Given a signup or login operation,
When any log statement, response body, or Redis/Postgres write occurs,
Then no plaintext password appears in any of these outputs. Verified by: (1) inspecting the `users` table row — only the bcrypt hash is present, (2) searching all logger calls — no `password` field in any `info` or `warn` payload.

**AC6** — `rotateSessionId` is called after email/password signup and login
Given signup (AC1) or login (AC3) succeeds,
When the session is established,
Then `rotateSessionId` is called and a new `Set-Cookie: session_id=<new-id>` header is sent.

**AC7** — Email/password signup/login form is accessible from the landing page and auth chooser
Given a user is on the landing page or auth chooser,
When the page is rendered,
Then an "Email / password" option is visible alongside GitHub and Google.

## Out of scope

- Password reset / forgot-password flow (deferred to post-MVP)
- Email verification (the email is trusted at signup — no verification email sent in MVP)
- OAuth account linking (GitHub + same email — not in MVP)
- Admin-created accounts or invite-only signup
- Remember-me / persistent sessions (sessions expire per existing session TTL)

## Dependencies

- **lab-s1.3 must be complete** — email/password is added to the provider registry established by s1.3
- **lab-s2.1 (Google OAuth) is a soft predecessor** — not a hard blocker, but auth chooser UI is cleaner if Google is in place first
- `bcrypt` npm package (or `bcryptjs` for pure JS) — approved for this feature under the npm relaxation for auth packages
- `users` table in Neon Postgres (if not created by Better Auth paths A/B, this story creates it for Path C)

## Implementation touchpoints

- `src/web-ui/routes/auth-email.js` (new): `handleEmailSignup`, `handleEmailLogin` handlers
- `src/web-ui/modules/password.js` (new): bcrypt hash/compare wrapper with injectable adapter (D37)
- `src/web-ui/server.js` (modified): register `/auth/email/signup` and `/auth/email/login` routes; wire password adapter
- Database: `users` table — columns: `id` (UUID), `email` (unique), `password_hash`, `created_at`; migration script `scripts/migrate-schema-users.js`
- `src/web-ui/templates/` (modified): add email/password form to auth chooser UI

## Architecture Constraints

- **D37 (Injectable adapter rule, CLAUDE.md)**: The bcrypt wrapper and DB write adapter must have throwing stubs as defaults. Production wiring in `server.js` is a separate implementation task and explicit AC (AC6 wiring check at DoR).
- **sec-perf**: `rotateSessionId` MUST be called after email/password signup and login. Enforced by AC6.
- **`req.session.accessToken` canonical field (CLAUDE.md)**: For email/password sessions, `accessToken` is a server-generated opaque token (e.g. `crypto.randomBytes(32).toString('hex')`) stored in the session — it is NOT the password hash and NOT the user's password. This value is never written to disk or Redis (per `_sanitiseForRedis`).
- **Password never in logs**: The D37 stubs must not log password parameter values. AC5 enforces this.
- **ADR-011 (Artefact-first)**: `src/web-ui/routes/auth-email.js` and `src/web-ui/modules/password.js` are new `src/` modules — covered by this story artefact.
- **CJS-only (Style Guide)**: All new code uses `require()`/`module.exports` unless Path B was chosen in s1.1.

## NFRs

- **bcrypt cost factor ≥ 10**: `bcrypt.hash(password, 10)` minimum. This is a security requirement — a lower cost factor is not acceptable.
- **Rate limiting**: AC4 enforces 10 attempts per 5 minutes per IP. The existing rate-limiter pattern from `src/web-ui/middleware/rate-limiter.js` (or equivalent) should be extended.
- **No plaintext passwords in any output** (AC5): Test suite must verify this.

## Test

Node.js tests: `tests/check-lab-s2.2-email-password.js` (new) — verify (1) signup creates user with bcrypt hash (AC1), (2) duplicate email → 409 (AC2), (3) correct password → session with `accessToken` field (AC3), (4) wrong password → 401 (AC3), (5) password never appears in logs or responses (AC5), (6) `rotateSessionId` called on signup and login (AC6), (7) rate limit fires at 11th attempt (AC4). Monkeypatch DB write adapter.
