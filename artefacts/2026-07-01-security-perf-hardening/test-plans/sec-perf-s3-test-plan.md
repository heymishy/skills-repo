# Test Plan — CSRF tokens on server-rendered form POST endpoints (sec-perf-s3)

**Feature slug:** 2026-07-01-security-perf-hardening
**Story:** sec-perf-s3
**Story reference:** artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md
**Short-track:** test-plan → DoR → implementation

---

## Scope

Add a session-scoped CSRF (Cross-Site Request Forgery) token, generated via `src/web-ui/middleware/csrf.js`, and wire `csrfGuard` in front of four route groups: admin credit adjustment, team member add/role-assign, billing checkout, and email signup/login. Embed the token as a hidden form field on each corresponding GET-rendered page.

## Test strategy

Node.js unit/integration tests only — no browser, no live Redis/Postgres/Stripe/Anthropic dependency. All adapters replaced with stubs, matching every other test file in this codebase's `tests/` directory. Each protected route gets both:
1. A negative test proving the *unprotected* pre-fix behaviour would have let the request through (written to fail against the pre-fix handler, per `CLAUDE.md`'s D37 wiring-test convention), then pass once `csrfGuard` is wired.
2. A full round-trip positive test: render the GET page, extract the real embedded `_csrf` value from the HTML string (via regex/string search on the response body — not by reading `req.session` directly), then POST with that extracted value and confirm success.

## Test files and acceptance criteria

### `tests/check-sec-perf-s3-csrf-middleware.js` — core module unit tests

| Test | Description | Assertion |
|------|-------------|-----------|
| M1 | `generateCsrfToken(req)` creates a token on first call | `req.session.csrfToken` is a non-empty hex string after call |
| M2 | `generateCsrfToken(req)` is idempotent within a session | Second call returns the same value as the first (no regeneration) |
| M3 | `csrfField(token)` returns a well-formed, HTML-escaped hidden input | Output matches `<input type="hidden" name="_csrf" value="...">`, and a token containing `"` or `<` is escaped |
| M4 | `csrfGuard` rejects when `_csrf` is missing from body | Returns `false`; `res._status === 403`; `res._body === 'Forbidden'` |
| M5 | `csrfGuard` rejects when `_csrf` does not match `req.session.csrfToken` | Returns `false`; `res._status === 403` |
| M6 | `csrfGuard` rejects when `req.session.csrfToken` is unset (no token was ever generated for this session) | Returns `false`; `res._status === 403` |
| M7 | `csrfGuard` accepts when `_csrf` matches `req.session.csrfToken` | Returns `true`; `res._status` untouched (no response written) |
| M8 | `csrfGuard` caches the parsed body on `req.body` so the downstream handler's own `_readBody` does not need to re-read the (already-consumed) request stream | After `csrfGuard` resolves, `req.body` is set to the parsed object; a subsequent call to the handler's own `_readBody(req)` returns the same object without hanging on the stream |

### `tests/check-sec-perf-s3-admin-credits-csrf.js` — AC1

All AC1b–AC1e tests below are written to exercise the full `server.js` router dispatch (not the handler in isolation), so that during the TDD RED phase — before `csrfGuard` is wired into the dispatch table — AC1b and AC1c fail exactly as the pre-fix, unprotected code would behave (the POST succeeds/reaches `adjustBalance` with no `_csrf` field present). This is the proof-of-vulnerability required by `CLAUDE.md`'s D37 wiring-test convention; once `csrfGuard` is wired, the same tests pass. No separate permanently-failing test is kept.

| Test | Description | Assertion |
|------|-------------|-----------|
| AC1b | POST `/api/admin/credits/adjust` via the full `server.js` router with no `_csrf` field | `403`, body `Forbidden`, `adjustBalance` stub never called |
| AC1c | Same POST with a `_csrf` value that does not match session | `403`, `adjustBalance` stub never called |
| AC1d | Full round trip: GET `/admin/credits` → extract embedded `_csrf` from returned HTML → POST `/api/admin/credits/adjust` with that value and valid `tenantId`/`amount` | `302` to `/admin/credits`; `adjustBalance` stub called with correct args (unchanged from pre-story behaviour) |
| AC1e | Non-admin session (or no session) is still rejected exactly as before (requireAdmin still runs first) | `403` — confirms CSRF guard did not weaken/replace the existing `requireAdmin` gate |

### `tests/check-sec-perf-s3-team-members-csrf.js` — AC2

| Test | Description | Assertion |
|------|-------------|-----------|
| AC2a | POST `/api/team/members` with no `_csrf` field | `403`, body `Forbidden`, `addOrUpdateTeammate` never called |
| AC2b | POST with mismatched `_csrf` | `403`, `addOrUpdateTeammate` never called |
| AC2c | Full round trip: GET `/team/members` → extract embedded `_csrf` → POST with valid `identity`/`role` and that token | `200`/success response unchanged from pre-story behaviour; `addOrUpdateTeammate` called with correct args |
| AC2d | requireAdmin still enforced independently of CSRF check | Non-admin session → `403` even with a technically-valid CSRF token for a different (admin) session |

### `tests/check-sec-perf-s3-billing-checkout-csrf.js` — AC3

| Test | Description | Assertion |
|------|-------------|-----------|
| AC3a | POST `/billing/checkout` with no `_csrf` field | `403`, body `Forbidden`, `stripeClient.createCheckoutSession` stub never called |
| AC3b | POST with mismatched `_csrf` | `403`, stub never called |
| AC3c | Full round trip: GET `/welcome` (first-login session) → extract embedded `_csrf` from a plan's form → POST `/billing/checkout` with `planId` and that token | `302` to the Stripe session URL, unchanged from pre-story behaviour |

### `tests/check-sec-perf-s3-auth-email-csrf.js` — AC4

| Test | Description | Assertion |
|------|-------------|-----------|
| AC4a | POST `/auth/email/signup` with no `_csrf` field | `403`, body `Forbidden`, no DB insert attempted |
| AC4b | POST `/auth/email/login` with no `_csrf` field | `403`, body `Forbidden`, no DB lookup attempted |
| AC4c | Full round trip: GET `/` → extract embedded `_csrf` from the sign-up form → POST `/auth/email/signup` with valid email/password and that token | `302` to `/welcome`, unchanged from pre-story behaviour |
| AC4d | Full round trip: GET `/` → extract embedded `_csrf` from the sign-in form → POST `/auth/email/login` with valid credentials and that token | `302` to `/dashboard`, unchanged from pre-story behaviour |
| AC4e | Two separate sessions (two separate cookie jars / session objects) each receive a distinct token, and session A's extracted token is rejected against a submission carrying session B's cookie | `403` on the cross-session attempt (AC5 from the story) |

---

## NFRs under test

- Token is generated once per session and reused (not regenerated per page load) — covered by M2.
- CSRF rejection response body is exactly `Forbidden` with `Content-Type: text/plain`, matching the existing `oauthState` mismatch convention in `auth.js` — covered by M4–M6, AC1b/AC2a/AC3a/AC4a/AC4b.
- No CSRF token value is ever logged — spot-checked by asserting no `_logger`/`console.log` call in `csrf.js` receives the raw token (static review, not a runtime test).

---

## Files touched

| File | Change |
|------|--------|
| `src/web-ui/middleware/csrf.js` | New — `generateCsrfToken`, `csrfField`, `csrfGuard` |
| `src/web-ui/server.js` | Wire `csrfGuard` into dispatch for the 4 protected POST routes; call `generateCsrfToken` + embed via `csrfField` is done inside the GET-rendering route files themselves (see below), not in `server.js` |
| `src/web-ui/routes/admin-credits.js` | `adminCreditsGet` embeds `_csrf` field per row's form |
| `src/web-ui/routes/team-management.js` | Add-teammate form embeds `_csrf` field |
| `src/web-ui/routes/public.js` | `handleWelcome` embeds `_csrf` in each plan form; `handleRoot` injects `_csrf` into `_LANDING_HTML`'s two email forms via a template placeholder replace |
| `src/web-ui/templates/landing.html` | Add `<!--CSRF_TOKEN-->` placeholder inside both `form-signin` and `form-signup` forms |
| `tests/check-sec-perf-s3-csrf-middleware.js` | New |
| `tests/check-sec-perf-s3-admin-credits-csrf.js` | New |
| `tests/check-sec-perf-s3-team-members-csrf.js` | New |
| `tests/check-sec-perf-s3-billing-checkout-csrf.js` | New |
| `tests/check-sec-perf-s3-auth-email-csrf.js` | New |
