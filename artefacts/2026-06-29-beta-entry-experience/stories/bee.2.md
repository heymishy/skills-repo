# Story bee.2 — First-run empty-state experience

**Feature:** 2026-06-29-beta-entry-experience
**Epic:** bee-entry-surface
**Status:** Definition
**Complexity:** 1
**Scope stability:** Stable

## User story

As a beta developer who has just logged in for the first time and has no journeys yet,
I want to see a guided empty state on the dashboard that explains what to do next,
So that I can start my first skill session without needing help from Hamish — enabling M1 (beta activation rate) by converting confused first-time users into active ones.

## Metric linkage

- **M1** (Beta activation rate): the empty-state guides users to their first session. Without it, new users see a blank list with no instruction and are likely to abandon. This story is the primary driver of activation conversion.
- **M2** (Cross-tenant isolation confirmed): enabling any second tenant to reach the dashboard and start a session is the prerequisite for M2 verification. This story ensures that second tenant onboarding experience is functional.

## Acceptance criteria

**AC1** — Empty dashboard shows guided empty state when no journeys exist
Given an authenticated user whose `listJourneys(tenantId)` call returns an empty array,
When they load the dashboard (e.g. GET `/journeys`),
Then the response HTML contains the empty-state content (as verified by AC2) rather than a blank list or an error.

**AC2** — Empty-state content is informative and actionable
Given the empty-state HTML,
When a developer reads it,
Then it contains: (a) an explanation that no skill sessions have been started yet, (b) a description of what a skill session produces (a governed artefact), and (c) a link or button that navigates to the skill picker (the URL where skills can be selected to start a new session).

**AC3** — Populated dashboard is unaffected
Given an authenticated user whose `listJourneys(tenantId)` call returns one or more journeys,
When they load the dashboard,
Then the HTTP response is 200, the response HTML contains one journey card element per journey returned by `listJourneys()`, the empty-state block is absent from the HTML body, and the page title or heading reflects the journey list view (not the empty-state heading). [Resolved: 1-M1]

**AC4** — Server-side detection only
Given the dashboard route handler,
When determining whether to render the empty state or the journey list,
Then the correct state (empty-state block or journey list) is present in the initial HTTP response body without requiring JavaScript execution. Verification: the expected HTML content is present when the raw response body is inspected directly (e.g. via `curl`), with no dependency on client-side script execution. [Resolved: 1-M2]

**AC5** — `listJourneys()` adapter failure is handled gracefully
Given an authenticated user whose `listJourneys(tenantId)` call throws an error,
When the dashboard route handler runs,
Then the server responds with HTTP 500 (or the application's standard error response for unhandled adapter failures), the empty-state block is not present in the response HTML, and a `[journey-store]` error line is emitted to console. The response must not be a silent 200 with an empty list. [Resolved: 1-M3]

## Out of scope

- PostHog instrumentation on this page — that is bee.3
- An interactive or animated onboarding tutorial (tooltips, hotspots, modal walkthrough) — the empty state is a static informational HTML block
- A "skip" or "dismiss" mechanism for the empty state — it transitions naturally to the journey list once the first journey is created
- Any change to the skill picker itself — the empty state links to the existing skill picker URL

## Dependencies

- **bee.1** — landing page must be complete so that the unauthenticated-to-authenticated flow is established before first-run is verified end-to-end

## Architecture constraints

- **Node.js CommonJS** — dashboard route handler modification uses `require()`. No TypeScript or ES modules.
- **No Express** — the dashboard handler is in the existing `src/web-ui/routes/journey.js` (or equivalent) and is called by `src/web-ui/server.js`. No `app.get()` syntax.
- **Zero new npm dependencies** — empty-state HTML is a string literal or inline template. No Mustache, Handlebars, or any other template engine.
- **`listJourneys()` adapter** — the existing adapter is used as-is. This story does not introduce a new injectable adapter. If `listJourneys()` does not yet exist as an injectable, this story surfaces the gap and the fix is to ensure the injectable is wired correctly (see D37).
- **`req.session.accessToken` is canonical** — tenantId derivation (from `req.session.login` or `req.session.tenantId`) must not use `req.session.token`.
- **ADR-011** — this story artefact must exist before any `src/` implementation is committed.

## NFRs

- No additional latency beyond the existing `listJourneys()` call — the empty-state branch is entered synchronously after the adapter returns an empty array
- Empty-state HTML must render without JavaScript — server-side rendered static content only
