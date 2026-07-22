## Contract Proposal — Stand up a staging-safe GitHub OAuth/email auth stub for real-staging E2E

**What will be built:**
- A staging-only auth stub mechanism, gated by an environment variable/credential that exists only in the `wuce-staging` Fly app config (`fly.staging.toml`), never in `fly.toml` (production). Concretely: a test-only route or middleware branch in `src/web-ui/routes/auth.js` (or a new `src/web-ui/routes/auth-stub.js`) that, when the gating env var is set, accepts a signed test-bypass token or a fixed test GitHub identity and creates/logs in a real user record — bypassing the real GitHub OAuth round-trip, not the session/tenant creation logic.
- A Playwright helper/fixture (`tests/e2e/fixtures/staging-auth.js` or similar) that both A1's own spec and downstream specs (A2-A5, B1) import to authenticate against staging via this mechanism or via email/password signup.
- Two new Node scripts (non-Playwright, run via `npm test`): one that greps `fly.toml` for the stub's env var name (AC3), one that greps `.github/architecture-guardrails.md` for the ADR-018 addendum (AC4).
- An ADR-018 addendum in `.github/architecture-guardrails.md` documenting the mechanism.

**What will NOT be built:**
- A real GitHub OAuth test account or live third-party round-trip — explicitly out of scope.
- Any change to the production auth flow itself (`fly.toml`'s config, or `auth.js`'s real GitHub/Google OAuth handlers) beyond confirming the stub gate cannot fire there.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Playwright spec authenticates via the stub fixture against real `wuce-staging`, asserts a real user record + valid session cookie | E2E |
| AC2 | Playwright spec drives email/password signup independently, asserts a real user record + valid session | E2E |
| AC3 | Node script greps `fly.toml` for the stub env var name, asserts absence | Integration |
| AC4 | Node script greps `.github/architecture-guardrails.md` for the ADR-018 addendum marker | Integration |

**Assumptions:**
- `wuce-staging`'s Fly app config (`fly.staging.toml`) can have a new env var added and set as a CI secret without requiring a redeploy cycle beyond the normal manual deploy process already in use this session.
- The staging database/API already exposes a way to query a user record by email/identity (reused from existing auth code, not newly built).

**Estimated touch points:**
Files: `src/web-ui/routes/auth.js` or new `auth-stub.js`, `fly.staging.toml`, `tests/e2e/fixtures/staging-auth.js`, `tests/e2e/a1-staging-auth-stub.spec.js`, `tests/check-a1-fly-config-isolation.js`, `tests/check-a1-adr018-addendum.js`, `.github/architecture-guardrails.md`
Services: `wuce-staging` (Fly app)
APIs: staging's existing user/session creation endpoints (reused, not newly built)
