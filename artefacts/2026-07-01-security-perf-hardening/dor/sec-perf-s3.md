# Definition of Ready — sec-perf-s3

**Feature:** 2026-07-01-security-perf-hardening
**Story ID:** sec-perf-s3
**Story title:** CSRF tokens on server-rendered form POST endpoints
**Sign-off date:** 2026-07-14
**Signed off by:** Hamish King (via coding agent, short-track)

---

## Story

**As a** platform operator,
**I want** server-rendered form POST endpoints to require a valid per-session CSRF (Cross-Site Request Forgery) token,
**So that** an attacker cannot forge a state-changing request (admin credit adjustment, team role change, billing checkout, account signup/login) by tricking a logged-in user's browser into submitting a hidden cross-site form.

Full story: `artefacts/2026-07-01-security-perf-hardening/stories/sec-perf-s3.md`
Test plan: `artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s3-test-plan.md`
Review (PASS, 0 HIGH): `artefacts/2026-07-01-security-perf-hardening/review/sec-perf-s3-review-1.md`
Decisions (RISK-ACCEPT for deferred routes): `artefacts/2026-07-01-security-perf-hardening/decisions.md`

---

## Acceptance criteria

**AC1 — Admin credit adjustment protected:** `POST /api/admin/credits/adjust` without a valid `_csrf` field matching `req.session.csrfToken` returns 403 `Forbidden`; with a valid token, behaves exactly as before this story.

**AC2 — Team member add/role-assign protected:** `POST /api/team/members` without a valid `_csrf` field returns 403 `Forbidden`; with a valid token, behaves exactly as before.

**AC3 — Billing checkout protected:** `POST /billing/checkout` without a valid `_csrf` field returns 403 `Forbidden`; with a valid token, behaves exactly as before.

**AC4 — Email signup/login protected:** `POST /auth/email/signup` and `POST /auth/email/login` without a valid `_csrf` field return 403 `Forbidden`; with a valid token, behave exactly as before.

**AC5 — Token is per-session:** two distinct sessions receive two distinct `csrfToken` values; a token from one session is rejected against a submission carrying a different session's cookie.

**AC6 — Round-trip proof:** for AC1–AC4, at least one test per route renders the real GET page, extracts the actually-embedded `_csrf` value from the HTML, and submits it — proving the generate→embed→submit→validate path works end to end, not just that the guard function accepts a value equal to the session's stored token.

---

## Contract

### In scope
- `src/web-ui/middleware/csrf.js` — new module: `generateCsrfToken`, `csrfField`, `csrfGuard`
- `src/web-ui/server.js` — wire `csrfGuard` into dispatch for the 4 named POST routes (after existing `requireAdmin`/`authGuard` checks, which remain unchanged)
- `src/web-ui/routes/admin-credits.js` — embed `_csrf` in `adminCreditsGet`'s rendered form
- `src/web-ui/routes/team-management.js` — embed `_csrf` in the add-teammate form
- `src/web-ui/routes/public.js` — embed `_csrf` in `handleWelcome`'s plan forms and in `handleRoot`'s landing-page forms (via template placeholder)
- `src/web-ui/templates/landing.html` — add `<!--CSRF_TOKEN-->` placeholder to both email forms

### Out of scope
- All JSON/fetch-only POST endpoints — protected differently, via same-origin `fetch()` convention + existing `SameSite=Strict` session cookie policy; a follow-up story if a double-submit-header convention is wanted for defence-in-depth on those too
- `POST /webhook/stripe` — Stripe HMAC signature verification, not session-cookie-based; CSRF does not apply
- `NODE_ENV==='test'`-gated test-seed routes — unreachable in production
- Remaining ~8 server-rendered form POST routes not named in AC1–AC4 (journey/wizard, artefacts annotations, skills sessions/commit form paths, products confirm/features) — RISK-ACCEPTed and named explicitly in `decisions.md`, deferred to a follow-up story
- `renderLoginPage()` fallback shell in `html-shell.js` (secondary catch-all rendering path, distinct from the primary `GET /` landing page this story protects) — also named in the deferral

### Must NOT touch
- `src/web-ui/routes/auth.js`'s existing `oauthState`/`validateOAuthState` mechanism — CSRF-adjacent but a distinct, already-working system; this story must not modify it, only follow its shape as a style precedent
- `src/enforcement/`
- Any SKILL.md files

---

## DoR checklist

- [x] All 6 ACs are specific and independently testable
- [x] Test plan written: `artefacts/2026-07-01-security-perf-hardening/test-plans/sec-perf-s3-test-plan.md`
- [x] Review passed with 0 HIGH findings (2 MEDIUM acknowledged via decisions.md, 1 LOW noted for retrospective)
- [x] D1/B1 check: no "MUST NOT touch" file in the contract conflicts with a required test touchpoint — the test plan's required touchpoints (`server.js`, `admin-credits.js`, `team-management.js`, `public.js`, `templates/landing.html`, new `middleware/csrf.js`) all appear in "In scope," none in "Must NOT touch"
- [x] Response shape for CSRF rejection matches the existing `oauthState` mismatch convention (`403`, `Content-Type: text/plain`, body `Forbidden`) — explicit AC, not left implicit
- [x] Round-trip (AC6) tests specified, not just guard-in-isolation tests, per `CLAUDE.md`'s D37 behavioural-correctness convention
- [x] Deferred scope named explicitly in `decisions.md` (RISK-ACCEPT), not silently dropped

**Proceed: Yes**

---

## Coding agent instructions

Implement in this order:
1. `src/web-ui/middleware/csrf.js` (core module) + its own unit test file — RED then GREEN.
2. Wire `csrfGuard` into `server.js` for the 4 routes, and embed `generateCsrfToken`/`csrfField` in the 4 GET-rendering call sites. Run each route's dedicated test file after wiring that route, before moving to the next — do not wire all 4 routes and then run tests once at the end.
3. Confirm each route's existing pre-story test file (e.g. `tests/check-lab-s2.2-email-password.js` for auth-email, any existing admin-credits/team-members test files) still passes unmodified — CSRF wiring must not break any existing test that already POSTs with a body; those existing tests will need `req.body._csrf` (or an injected `req.session.csrfToken` matching whatever they submit) added as a minimal fixture update if they construct raw POST requests directly. Do not weaken `csrfGuard` to make old tests pass — update the old tests' fixtures instead.
4. Run the full test suite once at the end and confirm no regressions outside the touched files.
