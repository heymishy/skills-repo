# Story bee.3 — PostHog instrumentation

**Feature:** 2026-06-29-beta-entry-experience
**Epic:** bee-entry-surface
**Status:** Definition
**Complexity:** 2
**Scope stability:** Stable

## User story

As Hamish King (platform operator),
I want PostHog event tracking on the landing page and dashboard so that I can see who visits, who signs up, where they came from, and whether they activated — without requiring manual fly log inspection for every user,
So that M3 (landing page conversion rate) is measurable via a proper funnel and M4 (referral attribution coverage) is achievable from day one.

## Metric linkage

- **M3** (Landing page conversion rate): PostHog `landing_page_view` and `cta_clicked` events create the funnel that measures M3. Without bee.3, M3 can only be approximated via fly log ratios.
- **M4** (Referral attribution coverage): PostHog auto-captures UTM parameters on landing page load; `posthog.identify()` links them to the authenticated user's Person record. M4 is only measurable after bee.3 is deployed.
- **M1** (Beta activation rate): `journey_created` and `login_completed` events provide a named-user view of activation progress in PostHog Persons, supplementing the fly log approach.

## Acceptance criteria

**AC1** — PostHog CDN snippet present in landing page HTML
Given a GET request to `/` (unauthenticated),
When the server responds,
Then the HTML body contains the PostHog CDN `<script>` initialisation snippet with the configured `POSTHOG_KEY` value embedded. The snippet URL must use the PostHog CDN (not a self-hosted endpoint). If `POSTHOG_KEY` is unset or empty, the snippet is omitted entirely (no broken `<script>` tag with an undefined key).

**AC2** — PostHog CDN snippet present in dashboard HTML
Given a GET request to the authenticated dashboard (e.g. `/journeys`),
When the server responds,
Then the HTML body contains the PostHog CDN `<script>` initialisation snippet with the configured `POSTHOG_KEY` value embedded, using the same graceful-degradation rule as AC1.

**AC3** — `landing_page_view` event captured on landing page load
Given the landing page HTML,
When inspected,
Then it contains a `posthog.capture('landing_page_view')` call that fires on page load (e.g. in an inline `<script>` after the PostHog init snippet, or via a `DOMContentLoaded` listener).

**AC4** — `cta_clicked` event captured on Sign in with GitHub click
Given the landing page HTML,
When inspected,
Then the "Sign in with GitHub" CTA element has an event listener or inline handler that calls `posthog.capture('cta_clicked')` before (or alongside) navigating to `/auth/github`. The navigation must not be blocked — if PostHog is unavailable, the CTA still navigates.

**AC5** — `posthog.identify()` called on dashboard load with GitHub login and tenant_id
Given the authenticated dashboard HTML,
When inspected,
Then it contains a `posthog.identify(login, { tenant_id: tenantId })` call, where `login` and `tenantId` are injected server-side from the authenticated session. The `login` value is used as the PostHog `distinct_id`. This call fires on every authenticated dashboard load; PostHog handles deduplication.

**AC6** — `login_completed` event captured on dashboard load
Given the authenticated dashboard HTML,
When inspected,
Then it contains a `posthog.capture('login_completed')` call that fires after `posthog.identify()` on page load.

**AC7** — `journey_created` event captured when a new journey is first created
Given the HTML response (or client-side script) that a user receives immediately after successfully creating a new journey (i.e. the first turn of a skill session is initiated),
When inspected,
Then it contains a `posthog.capture('journey_created')` call in the HTML of `GET /skills/:name/sessions/:id/chat` — the chat page the user lands on immediately after the POST-to-303 redirect that creates the journey. This is the first HTML page served after journey creation and is the committed placement. [Resolved: 1-M1]

**AC8** — `POSTHOG_KEY` is read from environment, not hardcoded in source
Given the server startup code or route handler,
When `process.env.POSTHOG_KEY` is set to a non-empty string,
Then that value appears verbatim in the PostHog init snippet embedded in HTML responses. If `process.env.POSTHOG_KEY` is unset or an empty string, no PostHog snippet is injected.

**AC9** — No npm package added for PostHog
Given `package.json` and `package-lock.json` (or equivalent),
When inspected after this story is implemented,
Then no `posthog-js`, `posthog-node`, or any other PostHog npm package appears in `dependencies` or `devDependencies`. The PostHog CDN URL is the only PostHog integration point.

## Out of scope

- PostHog server-side event tracking (Node.js PostHog SDK) — client-side CDN only
- PostHog feature flags, cohort analysis, session recordings, or custom dashboards — all deferred to Group 2
- PostHog A/B testing or experiments
- Any analytics platform other than PostHog
- Verifying that PostHog actually receives and stores events in the PostHog Cloud UI — AC verification is by code inspection of HTML responses, not by live PostHog event confirmation

## Dependencies

- **bee.1** — landing page HTML must exist before the PostHog snippet can be added to it
- **bee.2** — dashboard HTML empty-state must exist; PostHog identify call goes in the dashboard response

## Architecture constraints

- **PostHog via CDN only** — no `require('posthog-js')` or any npm PostHog package. The `<script>` tag loads PostHog from the PostHog CDN URL (`eu.posthog.com` recommended for EU data residency).
- **Zero new npm dependencies** — the PostHog snippet is a string literal embedded in the HTML response. No build step, no bundler, no template compilation.
- **`POSTHOG_KEY` as env var** — read via `process.env.POSTHOG_KEY`. Not a fly secret. Graceful degradation: if unset, snippet is omitted.
- **Server-side injection of key and session values** — `POSTHOG_KEY`, `login`, and `tenantId` are injected server-side into the HTML string before the response is written. No client-side fetch of these values.
- **No credential exposure** — `req.session.accessToken` (the GitHub OAuth token) must never appear in any HTML response or client-side JavaScript. Only `login` and `tenantId` from the session are injected (AC5). These are not sensitive values.
- **CTA navigation must not be blocked** — AC4 `cta_clicked` event must be fire-and-forget. All `posthog.capture()` and `posthog.identify()` calls in inline scripts must be guarded with `typeof posthog !== 'undefined'` before invocation, OR the PostHog CDN snippet must include the standard PostHog stub array (which queues calls before PostHog loads). When `POSTHOG_KEY` is unset and the snippet is omitted entirely, no inline script may reference `posthog` — either the call sites are also conditionally omitted server-side, or the guard is always present. Clicking the CTA must navigate to `/auth/github` without a JavaScript error in all paths. [Resolves: 1-M2]
- **ADR-011** — this story artefact must exist before any `src/` implementation is committed.
- **ADR-018** — if AC3–AC7 are verified via browser-level tests, use Playwright in `tests/e2e/`. Unit tests (asserting HTML string contents) are preferred for ACs that are code-inspection-level.

## NFRs

- PostHog CDN `<script>` must be loaded asynchronously (`async` attribute) — must not block page render
- If `POSTHOG_KEY` is unset, no JavaScript error is thrown on page load — the snippet is simply absent
- No personal data beyond GitHub login and tenantId is sent to PostHog from server-injected values
