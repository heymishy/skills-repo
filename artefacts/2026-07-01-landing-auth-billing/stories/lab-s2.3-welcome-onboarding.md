# Story lab-s2.3 — /welcome onboarding — first-login detection + plan selection redirect

**Feature:** 2026-07-01-landing-auth-billing
**Epic:** lab-e2-providers-onboarding
**Discovery:** artefacts/2026-07-01-landing-auth-billing/discovery.md
**Benefit-metric:** artefacts/2026-07-01-landing-auth-billing/benefit-metric.md
**Status:** Definition
**Complexity:** 2
**Scope stability:** Stable

## User story

As a new visitor / prospective user completing their first login,
I want to be guided through a plan selection step before reaching my dashboard,
So that I can choose a subscription plan and begin using the platform without manual operator intervention.

## Metric linkage

- **M1** (Self-serve signup conversion, benefit-metric.md §M1): `/welcome` is the `plan_selected` step in the PostHog funnel. The full funnel: `landing_page_viewed` → `cta_clicked` → `auth_completed` → `plan_selected` → `dashboard_reached`. Without this step, `plan_selected` and `dashboard_reached` events cannot fire in the correct sequence.
- **M3** (Monthly cost recovery rate, benefit-metric.md §M3): Plan selection in `/welcome` is the entry point to Stripe Checkout. Users who complete plan selection are the source of Stripe revenue.
- **M4** (Time to first paid plan, benefit-metric.md §M4): The first `checkout.session.completed` Stripe webhook begins here — a user who completes `/welcome` and selects a paid plan is the M4 subject.

## Acceptance criteria

**AC1** — Auth callbacks redirect first-time users to `/welcome` instead of `/dashboard`
Given a user logs in for the first time via any provider (GitHub, Google, or email/password),
When the auth callback handler runs,
Then: (1) a `firstLogin: true` flag is set on the user's record (Postgres `users` table or equivalent), (2) the redirect target is `/welcome` instead of `/dashboard`.

**AC2** — Returning users skip `/welcome` entirely
Given a user who has previously completed `/welcome` (i.e. `firstLogin` flag was cleared) logs in,
When the auth callback handler runs,
Then the redirect target is `/dashboard` — `/welcome` is not visited.

**AC3** — `GET /welcome` is protected: unauthenticated access redirects to `/`
Given an unauthenticated user navigates to `/welcome`,
When the server handles the request,
Then the response is 302 to `/` — the landing page.

**AC4** — `GET /welcome` renders a plan selection page for first-time users
Given an authenticated first-time user navigates to `/welcome`,
When the server handles the request,
Then the response is HTTP 200 containing: (1) a greeting ("Welcome to the platform"), (2) available plan options (names and brief descriptions sourced from env-configured Stripe price IDs — not hardcoded), and (3) a "Select this plan" CTA for each plan option that initiates Stripe Checkout for that plan.

**AC5** — Plan selection CTA form targets the billing checkout endpoint
Given the `/welcome` page is rendered for an authenticated first-time user,
When the response HTML is inspected,
Then each plan's "Select this plan" button or enclosing form element has its action set to `POST /billing/checkout` and includes a `planId` field identifying the selected plan. This is independently testable without a live Stripe connection — it verifies the wiring between /welcome and the checkout route. The full redirect-to-Stripe-Checkout happy path is verified as part of lab-s3.2.

**AC6** — `plan_selected` PostHog event fires when user submits plan selection
Given a first-time user clicks "Select this plan" on `/welcome`,
When the form is submitted,
Then a `plan_selected` PostHog event is captured with `{ planName }` properties.

**AC7** — Direct navigation to `/welcome` by a user who has already selected a plan redirects to `/dashboard`
Given a user who has already completed plan selection (and the `firstLogin` flag is cleared) directly navigates to `/welcome`,
When the server handles the request,
Then the response is 302 to `/dashboard`.

## Out of scope

- The actual Stripe Checkout session creation (lab-s3.2)
- Credit provisioning after checkout completion (lab-s3.4 webhook handler)
- The billing portal or plan management UI (lab-s3.5)
- Email confirmation of plan selection (post-MVP)
- A "skip for now" option — plan selection is required to reach the dashboard in MVP

## Dependencies

- **lab-s1.3 must be complete** — auth callbacks must be in place to redirect to `/welcome`
- **lab-s3.2 (Stripe Checkout)** provides the `POST /billing/checkout` endpoint that AC5 links to. AC5 is verifiable only after lab-s3.2 is merged — this is documented as an inter-story dependency at DoR.
- Neon Postgres `users` table with `firstLogin` column (or equivalent flag mechanism)

## Implementation touchpoints

- `src/web-ui/routes/public.js` (modified): add `GET /welcome` handler; `POST /welcome/plan-select` or redirect to `POST /billing/checkout`
- `src/web-ui/routes/auth.js` (modified): update callback to check `firstLogin` and set redirect target
- `src/web-ui/templates/welcome.html` (new): plan selection page with env-sourced plan names and CTAs
- `src/web-ui/modules/user-flags.js` (new): `getFirstLoginFlag(userId)`, `clearFirstLoginFlag(userId)` with injectable Postgres adapter (D37)
- `src/web-ui/server.js` (modified): wire `/welcome` route; wire user-flags adapter

## Architecture Constraints

- **D37 (Injectable adapter rule, CLAUDE.md)**: `user-flags.js` DB adapter must have a throwing default stub. Production wiring in `server.js` is a separate implementation task and explicit DoR AC.
- **ADR-011 (Artefact-first)**: `src/web-ui/modules/user-flags.js` is a new `src/` module — covered by this story artefact.
- **No plan IDs hardcoded (SCOPE-001 in decisions.md)**: Plan names and Stripe price IDs are sourced from environment variables. The `/welcome` template reads plan config from server-side env vars, not from hardcoded constants.
- **CSS-layout-dependent ACs (B2, CLAUDE.md)**: AC4's "plan options are rendered" involves CSS layout. RISK-ACCEPT: verified by manual smoke test at pre-launch (lab-s3.5). Logged in decisions.md.
- **`req.session.accessToken` canonical field (CLAUDE.md)**: `authGuard` on `/welcome` checks `req.session.accessToken`.

## NFRs

- **Plan ID placeholders**: Plan names displayed on `/welcome` must use env-var-sourced values. A placeholder like `PLAN_NAME_PLACEHOLDER` appearing in the rendered HTML is a defect.
- **PostHog capture non-blocking (AC6)**: `plan_selected` event must not delay the form submission response.

## Test

Node.js tests: `tests/check-lab-s2.3-welcome.js` (new) — verify (1) `GET /welcome` with no session → 302 to `/` (AC3), (2) `GET /welcome` with `firstLogin: true` session → 200 with plan options (AC4), (3) `GET /welcome` with `firstLogin: false` session → 302 to `/dashboard` (AC7), (4) first-time auth callback sets redirect to `/welcome` (AC1), (5) returning user auth callback sets redirect to `/dashboard` (AC2), (6) `plan_selected` PostHog event fired on plan selection (AC6). Monkeypatch user-flags adapter.
