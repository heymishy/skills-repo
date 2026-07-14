## Story: CSRF tokens on server-rendered form POST endpoints

**Feature reference:** artefacts/2026-07-01-security-perf-hardening
**DoR reference (parent deferral):** artefacts/2026-07-01-security-perf-hardening/dor/sec-perf.md — "CSRF tokens on POST endpoints — separate story"
**Sibling story (parallel, same feature):** sec-perf-s2 (different scope — do not conflict; only `stories[]` array entries collide and are centrally merged)

## User Story

As a **platform operator**,
I want **server-rendered form POST endpoints to require a valid per-session CSRF (Cross-Site Request Forgery) token**,
So that **an attacker cannot forge a state-changing request (admin credit adjustment, team role change, billing checkout, account signup/login) by tricking a logged-in user's browser into submitting a hidden cross-site form**.

## Benefit Linkage

**Metric moved:** Closes the CSRF gap explicitly deferred at the parent `sec-perf` DoR sign-off (2026-07-01) — the parent story shipped rate limiting, safe Redis scans, open-redirect hardening, I/O ordering, and session-fixation rotation, but named CSRF as an open item requiring its own story.
**How:** Without a CSRF token, any of this app's server-rendered POST forms can be triggered cross-site by an attacker's page while a victim's session cookie is attached automatically by the browser (unless every other layer of defence holds). This story adds an explicit, defence-in-depth, session-scoped token check on the highest-value state-changing forms so a forged cross-site submission is rejected even if a future change ever weakens the existing cookie policy.

## Architecture Constraints

- **Existing CSRF-adjacent convention:** `src/web-ui/routes/auth.js`'s `oauthState` / `validateOAuthState` pattern (a random token stored in session, checked on receipt, 403 + `text/plain` `"Forbidden"` body on mismatch) is the closest existing precedent in this codebase. It protects the OAuth callback flow specifically (not general form POSTs) — this story introduces a new, session-wide CSRF token following the *same generate/store-in-session/validate/403-on-mismatch shape*, for consistency, but as its own mechanism (`req.session.csrfToken`, not `req.session.oauthState`).
- **New module:** `src/web-ui/middleware/csrf.js` — exports `generateCsrfToken(req)` (creates and caches a random token on `req.session.csrfToken` if absent, returns it), `csrfField(token)` (returns an escaped `<input type="hidden" name="_csrf" value="...">` HTML string), and `csrfGuard(req, res)` (async; reads and parses the request body, caches it on `req.body` for the downstream handler's own body-reader to reuse — mirrors the existing `if (req.body !== undefined) return Promise.resolve(req.body);` short-circuit already present in every `_readBody` helper in this codebase — validates the `_csrf` field against `req.session.csrfToken`, writes `403`/`"Forbidden"` and returns `false` on mismatch, returns `true` on match).
- **Existing session cookie policy already provides real, independent CSRF mitigation:** `SESSION_COOKIE_CONFIG` in `src/web-ui/middleware/session.js` sets `SameSite=Strict`, which already blocks the cookie being attached on cross-site navigations/form-submits/fetches in modern browsers. This story is a defence-in-depth layer on top of that, not a fix for a currently-exploitable-in-all-browsers gap — stated explicitly so this story is not scoped as "zero protection exists today."
- **`AC6` on `handleRoot` (`public.js`) says the landing-page response "never contains session tokens or user identity data."** A CSRF token is neither an access token nor user-identity data — it is a per-session anti-forgery nonce with no bearing on who the user is. Injecting it into the landing page's login/signup forms via a template placeholder replace (the same `.replace('<!--PLACEHOLDER-->', ...)` pattern `handleWelcome` already uses for `_WELCOME_HTML`) does not violate that AC's intent; this distinction is recorded here so a future reviewer does not read it as a regression.

## Dependencies

- **Upstream:** None (parent `sec-perf` story already merged; this is a standalone deferred item).
- **Downstream:** None known. If a JSON/fetch-only POST endpoint later needs CSRF-equivalent protection, that is a separate story (see Out of Scope).

## Acceptance Criteria

**AC1 — Admin credit adjustment protected:** Given an authenticated admin has loaded `GET /admin/credits` (which embeds a valid `_csrf` hidden field per row's form), When `POST /api/admin/credits/adjust` is submitted without a `_csrf` field, or with a `_csrf` value that does not match `req.session.csrfToken`, Then the response is `403` with body `"Forbidden"` and no balance is changed. When the same request is submitted with the correct `_csrf` value, Then the request succeeds exactly as it did before this story (balance adjusted, `302` to `/admin/credits`).

**AC2 — Team member add/role-assign protected:** Given an authenticated admin has loaded `GET /team/members` (which embeds a valid `_csrf` hidden field in the add-teammate form), When `POST /api/team/members` is submitted without a valid `_csrf` field, Then the response is `403` with body `"Forbidden"` and no teammate row is added or updated. When submitted with the correct `_csrf` value, Then the request succeeds exactly as before (teammate added/role updated).

**AC3 — Billing checkout protected:** Given an authenticated first-login user has loaded `GET /welcome` (which embeds a valid `_csrf` hidden field in each plan's form), When `POST /billing/checkout` is submitted without a valid `_csrf` field, Then the response is `403` with body `"Forbidden"` and no Stripe Checkout session is created. When submitted with the correct `_csrf` value, Then the request succeeds exactly as before (`302` to the Stripe Checkout URL).

**AC4 — Email signup/login protected:** Given a visitor has loaded `GET /` (which embeds a valid `_csrf` hidden field in both the sign-in and sign-up forms), When `POST /auth/email/signup` or `POST /auth/email/login` is submitted without a valid `_csrf` field, Then the response is `403` with body `"Forbidden"` and no user row is created / no session is authenticated. When submitted with the correct `_csrf` value, Then the request succeeds exactly as before.

**AC5 — Token is per-session, not global:** Given two different sessions (e.g. two different browsers/cookies), When each loads a protected form, Then each receives a distinct `csrfToken` value, and session A's token is rejected (403) if submitted against a form action while session A's cookie is not the one presenting it (i.e. the token is bound to `req.session`, not a single process-wide constant).

**AC6 — Legitimate flow round-trip (not just guard-in-isolation):** For each of AC1–AC4, at least one test drives the full round trip — render the GET page, extract the embedded `_csrf` value from the rendered HTML (not from `req.session` directly), and submit the POST with that extracted value — proving the embed-and-validate pair actually works end-to-end, not merely that `csrfGuard` accepts a value equal to whatever is in the session (per `CLAUDE.md`'s D37/wiring-test-behavioural-correctness convention: a test must exercise the real generate → embed → submit → validate path, not assert two internal values are `===` to each other).

## Out of Scope

- **JSON/fetch-only API POST endpoints** (e.g. `/api/ideas`, `/api/skills/:name/sessions/:id/turn-stream`, `/api/journey/:slug/gate-confirm` when called via JS `fetch()`, `/api/team/bulk-add-github-org`, and the majority of `journey.js`/`skills.js` POST routes) — these are consumed by same-origin JS, not raw cross-site-forgeable `<form>` submits, and are already covered by the same `SameSite=Strict` cookie policy that mitigates classic CSRF for forms. If a stronger double-submit-header convention is wanted for these later, that is a separate story.
- **`POST /webhook/stripe`** — authenticated by Stripe's own HMAC signature header (`stripe-signature`), not by session cookie. CSRF (a browser-session-cookie attack) does not apply to a server-to-server webhook.
- **`POST /test/seed-definition-session`, `POST /test/complete-onboarding`** — gated behind `NODE_ENV==='test'`, unreachable in production.
- **Remaining server-rendered form POSTs not named in AC1–AC4** — `POST /journey/wizard`, `POST /api/journey` (and its sibling journey-flow forms), `POST /api/artefacts/:slug/:file/annotations`, `POST /api/skills/:name/sessions` (form path), `POST /api/skills/:name/sessions/:id/commit` (form path), `POST /products/confirm`, `POST /products/:id/features` — all real server-rendered forms, all currently unprotected by an app-level CSRF token. Deferred to a follow-up story to keep this one bounded to the highest-value routes (money-moving, privilege-changing, and account-creation endpoints) named explicitly in this story's scope. Listed here so the gap is visible, not silently dropped.
- **CSRF protection for the legacy `renderLoginPage()` fallback shell** (`src/web-ui/utils/html-shell.js`, used only at the server.js catch-all route) — this is a secondary, rarely-hit fallback rendering path distinct from the primary `GET /` landing page (`public.js` / `templates/landing.html`, which this story does protect); flagged for the same follow-up story above.

## NFRs

- **Performance:** Token generation is a single `crypto.randomBytes(32)` call, cached on first generation per session (not regenerated per request) — negligible overhead.
- **Security:** Token comparison must be constant-time-safe in intent (a `!==` string check is acceptable here since the token is not itself a secret used for cryptographic authentication beyond same-origin-forgery prevention — consistent with how `validateOAuthState` already compares `oauthState`), and the token must never be logged.
- **Accessibility:** Hidden `<input type="hidden">` field — no visible UI/accessibility surface change.
- **Audit:** A CSRF rejection (403) is not separately audit-logged in this story — matching the existing `oauthState` mismatch handling, which only logs via `_logger.warn('oauth_state_mismatch', ...)` in `auth.js` itself, not as a new audit event category. If audit logging of CSRF rejections is wanted, that is a follow-up decision.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
