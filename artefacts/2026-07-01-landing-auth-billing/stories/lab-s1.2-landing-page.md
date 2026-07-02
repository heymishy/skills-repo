# Story lab-s1.2 — Landing page at `/`

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e1-foundation
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 1
**Scope stability:** Stable

## User story

As a new visitor / prospective user,
I want to arrive at `/` and see a clear platform pitch with a prominent "Get started" CTA,
So that I understand what the platform does and can initiate signup without any operator intervention.

## Metric linkage

- **M1** (Self-serve signup conversion, benefit-metric.md §M1): The landing page is the first step in the PostHog funnel (`landing_page_viewed` event). Without it, M1 cannot be measured. The CTA click fires the `cta_clicked` PostHog event.

## Acceptance criteria

**AC1** — `GET /` returns 200 with a rendered landing page
Given an unauthenticated visitor navigates to `/`,
When the server responds,
Then HTTP 200 is returned and the response body contains the platform pitch headline, a brief value proposition paragraph, and a "Get started" CTA button.

**AC2** — CTA click initiates auth flow
Given the visitor is on the landing page,
When they click the "Get started" CTA,
Then the browser navigates to `/auth/github` (or the multi-provider auth entry point once lab-s1.3 is complete — for this story, `/auth/github` is the target).

**AC3** — Authenticated users are redirected away from `/`
Given a user with a valid `session_id` cookie and `req.session.accessToken` set navigates to `/`,
When the server handles the request,
Then the response is a 302 redirect to `/dashboard` (authenticated users have no reason to see the landing page).

**AC4** — PostHog `landing_page_viewed` event is fired server-side on each `/` visit by an unauthenticated user
Given an unauthenticated visitor navigates to `/`,
When the server handles the request,
Then a `landing_page_viewed` PostHog event is captured via the existing `posthog-server.js` adapter (or queued for capture if PostHog is unavailable).

**AC5** — Landing page is responsive and readable on mobile viewport (320px) and desktop (1280px)
Given the landing page is rendered,
When viewed at 320px width and at 1280px width,
Then the headline, value proposition, and CTA are all visible without horizontal scrolling and the CTA is tappable/clickable. [Testability: accepted by operator on 2026-07-01 — layout verification requires browser render; covered by RISK-ACCEPT + manual smoke test in s4.1-equivalent pre-launch checklist]

**AC6** — No authenticated user data is exposed in the landing page HTML
Given the landing page response is inspected,
When the response body and headers are examined,
Then no `session_id` values, `accessToken` values, or user identity data appear in the HTML source.

## Out of scope

- CMS integration or operator-editable content (content is authored directly in the Node.js template)
- Marketing analytics beyond PostHog (no Google Analytics, no pixel tracking)
- A/B testing of CTA copy or layout
- Multi-language support
- Blog, docs, or any content pages beyond the single `/` route
- The multi-provider auth chooser UI (that is lab-s1.3 — for this story the CTA goes to `/auth/github`)

## Dependencies

- `posthog-server.js` adapter must exist (already present in codebase)
- `authGuard` middleware must exist (already present in `src/web-ui/routes/auth.js`)

## Implementation touchpoints

- `src/web-ui/routes/public.js` (new or modified): handler for `GET /`; checks `req.session.accessToken`, redirects authenticated users to `/dashboard`, renders landing page for unauthenticated users, fires PostHog event
- `src/web-ui/templates/landing.html` or equivalent (new): landing page HTML template with pitch content and CTA
- `src/web-ui/server.js`: register the `/` route (or verify it already exists and update handler)

## Architecture Constraints

- **ADR-011** (Artefact-first, `.github/architecture-guardrails.md`): `src/web-ui/routes/public.js` is a new `src/` module — this story artefact covers it.
- **CJS-only** (Style Guide): All new JS files use `require()` / `module.exports`, no `import`/`export`.
- **No credentials or user data in HTML response** (CLAUDE.md §Security, MC-SEC-02): `accessToken` must never appear in any HTML response.
- **`req.session.accessToken` canonical field** (CLAUDE.md): Use `req.session.accessToken` to check authentication status — never `req.session.token`.
- **CSS-layout-dependent AC (B2, CLAUDE.md)**: AC5 (responsive layout) cannot be verified by Node.js unit tests. RISK-ACCEPT applied: AC5 is verified by manual smoke test at pre-launch (lab-s3.5). Recorded in `decisions.md`.

## NFRs

- **No `accessToken` in HTML** (CLAUDE.md security constraint): Landing page template must not reference or render any session token values.
- **PostHog capture non-blocking**: PostHog event capture must not delay the landing page response. Fire-and-forget pattern (existing `posthog-server.js` pattern applies).

## Test

Node.js unit test: `tests/check-lab-s1.2-landing-page.js` — verify (1) unauthenticated `GET /` returns 200 with expected HTML content, (2) authenticated `GET /` (with mock session.accessToken) returns 302 to `/dashboard`, (3) response body does not contain any auth token patterns. PostHog event: verify capture is called on unauthenticated visit.
