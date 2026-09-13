## Story: Wire real client-side PostHog identity tracking into the routes actually served in production

**Epic reference:** None — short-track (bounded behavioural fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator building funnel analytics on top of this product's real PostHog project**,
I want **a real anonymous-to-identified-user link on the routes actually served in production, and `login_completed`/`cta_clicked` to genuinely fire**,
So that **an activation funnel (landing visit → signup → first journey) becomes possible, instead of being structurally blocked by dead client-side code attached to unreachable routes**.

## Benefit Linkage

**Metric moved:** None formal — instrumentation-correctness fix, per this story's own short-track Benefit Linkage convention.
**How:** Directly requested by the operator after building the "Production Overview" PostHog dashboard (2026-09-13) and discovering the activation funnel could never link, because `landing_page_viewed` fires server-side with the literal `distinctId: 'anonymous'` (no real per-visitor identity) and separately investigating found that BOTH `login_completed` and `cta_clicked` are entirely unreachable in production: `landing.js`'s `handleLanding` (which builds a working client-side PostHog snippet) is imported in `server.js` but never wired to any route — the real `GET /` handler is `public.js`'s `handleRoot`, which has no client-side snippet at all. Separately, `journey.js`'s `buildDashboardPostHogScript` (which correctly calls `posthog.identify()` and fires `login_completed`) is wired to `/journeys`, but the real, actually-visited post-login dashboard route is `/dashboard` → `handleGetDashboard` in `products.js`, which has zero PostHog client-side wiring. Net effect: no page a real user visits today ever loads the PostHog browser SDK, so no anonymous-to-identified merge can ever happen.

## Architecture Constraints

- **New shared module**: `src/web-ui/modules/posthog-client-snippet.js`, exporting `buildPostHogScript(key, opts)` and `buildClickCaptureScript(key, selector, eventName)` — a single, tested source of the PostHog CDN init snippet, replacing the drift risk of the near-identical copies already duplicated across `landing.js` and `journey.js` (only one of which was ever reachable, and neither on the correct route).
- **Additive, not replacing**: the existing server-side `_getPosthog().capture('anonymous', 'landing_page_viewed')` call in `public.js`'s `handleRoot` MUST remain exactly as-is — it has an existing, passing regression test (`tests/check-lab-s1.2-landing-page.js`, T4) asserting it fires. The new client-side wiring is additive: loading the real posthog-js SDK on `/` causes PostHog's own automatic `$pageview` autocapture to fire with a real, alias-able per-visitor cookie ID — this becomes the actually-linkable top-of-funnel signal, without renaming, removing, or duplicating the existing named event.
- **`journey.js` and `landing.js` are NOT touched by this story.** `journey.js`'s `buildDashboardPostHogScript`/`/journeys` route keeps working exactly as today (it is not broken, merely not the primary route) — deduplicating it onto the new shared module is out of scope. `landing.js`'s `handleLanding` remains unreferenced dead code; deleting it is a separate cleanup decision, not part of this fix.
- **Security invariant carried over unchanged** from `journey.js`'s existing `buildDashboardPostHogScript` (NFR-T1/T11): only `req.session.login` and `req.session.tenantId` may ever be injected into a client-side script. `req.session.accessToken` (or any other token field) must never appear in `buildPostHogScript`'s output, in either module's call sites.
- **AC8 graceful degradation preserved**: both new functions return `''` when `key` (POSTHOG_KEY) is falsy/empty, matching every existing PostHog-snippet builder in this codebase.
- **Only the primary (non-board, non-JSON) HTML branch of `handleGetDashboard`** gets the new wiring — the `?view=board` kanban branch and the `res.json` API branch are unchanged, out of scope.

## Dependencies

- **Upstream:** None — `public.js` and `products.js` both already exist and are independently editable; the new shared module has no dependency beyond Node's string concatenation (matching `journey.js`'s/`landing.js`'s existing style).
- **Downstream:** None known. This does not change any existing route's URL, status code, or auth behaviour — only appends a script tag to already-rendered HTML when `POSTHOG_KEY` is set.

## Acceptance Criteria

**AC1:** Given `POSTHOG_KEY` is set and a request to `GET /` from an unauthenticated visitor, When the response is rendered, Then the HTML contains a client-side PostHog init snippet (loading `us-assets.i.posthog.com/static/array.js`) in addition to — not instead of — the existing server-side `landing_page_viewed` capture call, which must still fire exactly as it does today.

**AC2:** Given `POSTHOG_KEY` is set and a request to `GET /` from an unauthenticated visitor, When the response is rendered, Then the HTML contains a click-tracking script that fires a `cta_clicked` PostHog event when the GitHub sign-in link is clicked, guarded by the existing `typeof posthog !== 'undefined'` pattern.

**AC3:** Given `POSTHOG_KEY` is set and an authenticated request to `GET /dashboard` (non-board, non-JSON branch), When the response is rendered, Then the HTML contains `posthog.identify(login, {tenant_id: tenantId})` and `posthog.capture('login_completed')`, using only `req.session.login`/`req.session.tenantId`.

**AC4:** Given any of the above, When `req.session.accessToken` (or any other token field) is set on the session, Then the rendered HTML never contains that token's value anywhere.

**AC5:** Given `POSTHOG_KEY` is unset or empty, When either route above is rendered, Then no new script is injected — behaviour is byte-identical to before this story (AC8 graceful degradation).

**AC6:** Given the existing test suite, When re-run after this change, Then `tests/check-lab-s1.2-landing-page.js` (the existing `landing_page_viewed` server-side regression test) and the `handleGetDashboard`-referencing test files continue to pass unmodified.

## Out of Scope

- Deduplicating `journey.js`'s `buildDashboardPostHogScript` or `landing.js`'s snippet builders onto the new shared module.
- Deleting `landing.js`'s unreferenced `handleLanding` code.
- The `?view=board` kanban branch or the `res.json` API branch of `handleGetDashboard`.
- `dashboard.js`'s `handleDashboard` fallback (used only when no Postgres pool is configured) — out of scope per the operator's own "primarily for production" framing; production always has a Postgres pool.
- Renaming or removing the existing server-side `landing_page_viewed` event.

## NFRs

- **Performance:** N/A — a single additional `<script>` tag appended to already-rendered HTML; no new server-side computation beyond string concatenation.
- **Security:** the accessToken-exclusion invariant (AC4) is the primary security requirement, carried over unchanged from `journey.js`'s existing, already-audited pattern.
- **Audit:** N/A — no new audit surface; PostHog's own client-side capture is unauthenticated/anonymous by design for `$pageview`, and identity-scoped only via `login`/`tenantId` for the dashboard route.

## Complexity Rating

**Rating:** 2 — touches two real production route handlers plus a new shared module, with a genuine security invariant (accessToken exclusion) to test explicitly, though the change itself is small and additive.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
