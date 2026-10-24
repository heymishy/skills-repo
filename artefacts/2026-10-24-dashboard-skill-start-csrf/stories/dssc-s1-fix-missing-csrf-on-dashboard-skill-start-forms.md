## Story: Fix missing CSRF token on dashboard "Run a skill" start forms

**Epic reference:** None — short-track (confirmed production bug, 403 Forbidden on every click)
**Discovery reference:** None — short-track skips discovery; context stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Product Owner or platform maintainer trying to start a skill session from the dashboard**,
I want **the "Start →" button on any "Run a skill" card to actually work**,
So that **I can begin a Discovery, Definition, Test plan, etc. session without hitting an unconditional 403 Forbidden error**.

## Benefit Linkage

**Metric moved:** Direct bug-fix enabler (short-track, no formal benefit-metric artefact). This is a **separate, confirmed-distinct defect** from the one `jgcc-s1` already fixed (the in-chat gate-confirm form's missing `_csrf` field) and the one `csdl-s1` added diagnostic logging to investigate (a since-refuted "stale cross-machine session cache" theory for the gate-confirm form). This bug blocks the **dashboard's own "Run a skill" cards** — the very first click a user makes to start any outer-loop skill — making the platform's entry point unusable via the web UI. Discovered live on 2026-10-24 while attempting to verify `css-s1`'s own merged mechanism end-to-end against real staging infrastructure.

**How:** Root-caused via real `fly logs` evidence (machine `84eed25a235568`, session `75421862`, token `24b7d4ee`): the generated token and the session's stored `expected` token matched exactly, but the **submitted** `_csrf` value was `(empty)` on every single attempt — not a stale/mismatched value, a value that was never sent at all. This refutes any cross-machine-cache theory for this specific form; the actual root cause is structural: `src/web-ui/views/dashboard-view.js`'s `renderDashboard()` function renders every "Run a skill" card's `<form>` with zero `_csrf` hidden input, and neither of the two route handlers that call it — `src/web-ui/routes/dashboard.js`'s `handleDashboard` and `src/web-ui/routes/products.js`'s `handleGetDashboard`/`_renderProductDashboard` (the one actually serving `/dashboard` on staging, selected whenever `DATABASE_URL` is set) — ever generate or pass a CSRF token into it. The fix pattern is already established and working elsewhere in this exact codebase: `products.js`'s own `_renderProductNew`/`handleGetProductNew` already correctly threads `await _csrf.generateCsrfToken(req)` through to its form. This story applies that same pattern to `renderDashboard()`.

## Architecture Constraints

- **Chosen approach:** Mirror the existing, already-proven `csrf.generateCsrfToken(req)` + `csrf.csrfField(token)` pattern used by `_renderProductNew`/`handleGetProductNew` (`products.js`) and `jgcc-s1`'s own in-chat gate-confirm fix (`routes/skills.js`). No new mechanism, no new module.
- **Single shared view, two call sites:** `dashboard-view.js`'s `renderDashboard()` is called from BOTH `dashboard.js`'s `handleDashboard` (used when `DATABASE_URL` is unset) and `products.js`'s `handleGetDashboard`/`_renderProductDashboard` (used when `DATABASE_URL` is set — the real path on staging/production). Both call sites must pass a real token; the view itself must accept and embed it. Fixing only one call site would leave the bug live wherever `DATABASE_URL` is configured (i.e. everywhere it matters).
- **Do not change the CSRF mechanism itself** (`src/web-ui/middleware/csrf.js` is untouched) — this is purely a missing-field-and-missing-generation-call fix, the same class of fix as `jgcc-s1`, not a redesign.
- **Do not regenerate a token per request.** `generateCsrfToken` is already idempotent within a session (reuses `req.session.csrfToken` if already set) — call it normally, do not special-case the dashboard.

## Dependencies

- **Upstream:** `jgcc-s1` (merged) — established the fix pattern this story reuses. `csdl-s1` (merged) — its diagnostic logging is what made this story's root-cause confirmation possible (real `fly logs` evidence, not guesswork).
- **Downstream:** None identified. `csdl-s1`'s own decisions.md tracked a required follow-up to remove/reduce its temporary diagnostic logging once a mismatch mechanism was confirmed — that cleanup is a separate, narrower follow-up (logging-removal only) and is out of scope for this story, which is about the dashboard fix specifically.

## Acceptance Criteria

**AC1:** Given `GET /dashboard` is rendered via `dashboard.js`'s `handleDashboard` (the `DATABASE_URL`-unset path), When the response HTML is inspected, Then each "Run a skill" card's `<form>` contains a hidden `<input type="hidden" name="_csrf" value="...">` whose value matches the session's real, currently-stored CSRF token (via `csrf.generateCsrfToken(req)`), not an empty or placeholder value.

**AC2:** Given `GET /dashboard` is rendered via `products.js`'s `handleGetDashboard`/`_renderProductDashboard` (the `DATABASE_URL`-set path — the one actually serving staging/production), When the response HTML is inspected, Then each "Run a skill" card's `<form>` contains the same correct hidden `_csrf` field as AC1.

**AC3:** Given a user is on the rendered dashboard (either path) with a valid session, When they submit a "Run a skill" card's form (`POST /api/skills/:name/sessions`), Then the request passes `csrfGuard` and proceeds to the real skill-start handler — no `403 Forbidden`.

**AC4 (regression guard):** Given the existing test suite for `dashboard.js`, `products.js`'s dashboard rendering, and `dashboard-view.js`, When re-run after this change, Then all pass unchanged in substance — only assertions about the new `_csrf` field are added, nothing existing is weakened or removed.

**AC5:** Given the full test suite (`node scripts/run-all-tests.js`), When run after this change, Then it passes with no new failures.

## Out of Scope

- **Removing `csdl-s1`'s temporary diagnostic logging.** Tracked as `csdl-s1`'s own required follow-up; a separate, narrower story. This story's fix does not depend on that logging being removed, and the logging remains harmless (non-secret-leaking) in the interim.
- **Any other form in this codebase.** This story fixes only the dashboard's "Run a skill" cards (`renderDashboard()` and its two callers). A broader "audit every form for a missing `_csrf` field" sweep is a separate, larger initiative if warranted — not assumed necessary here since this is the only form currently known to be broken.
- **Changing `csrfGuard`'s behavior, response shape, or the CSRF mechanism itself.**

## NFRs

- **Performance:** Negligible — one `await csrf.generateCsrfToken(req)` call per dashboard render, already idempotent and already used elsewhere on the same request path (e.g. the impersonation banner generates one unconditionally today when impersonating).
- **Security:** This is itself a security-relevant fix (CSRF protection was silently inert for this form — any submission, legitimate or not, was rejected, which is fail-safe but also fail-*unusable*; the fix restores the intended defense without weakening it).
- **Accessibility:** Not applicable — a hidden input, no visible/interactive change.
- **Audit:** Not applicable — no new audit requirement; `csrf.js`'s existing diagnostic logging (`csdl-s1`) will naturally show `match: true` going forward for this form once this fix lands, which is itself a useful confirmation signal worth checking post-deploy.

## Complexity Rating

**Rating:** 1 — a well-precedented, narrowly-scoped fix: add one parameter to one shared view function, thread a token through two call sites. No new mechanism, no architectural decision.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed — short-track, no epic; oversight is Medium: this touches a security-relevant form (CSRF) on the production-serving dashboard route, even though the fix itself is a narrow, well-precedented field addition.
