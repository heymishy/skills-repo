## Story: Build the isEnabled() flag helper shared by API and UI

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As **Hamish (Founder/Operator)**,
I want a single `isEnabled(flagKey, context)` helper used identically by every API route and every UI-rendering code path,
So that flag state can never diverge between what the API returns and what the UI renders — a prerequisite for Metric 2 (flags toggle without a redeploy) to mean anything.

## Benefit Linkage

**Metric moved:** Metric 2 — Feature flags toggle without a redeploy
**How:** A single shared evaluation path is what makes "toggle in PostHog → behavior changes everywhere, consistently" possible. Without it, API and UI could disagree on flag state.

## Architecture Constraints

- D37 (injectable adapter rule): `isEnabled()` must be wired via an injectable adapter — default stub throws (`Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.`), real PostHog client wired in `server.js` as a separate task from this handler's implementation.
- Zero-new-npm-dependencies is relaxed for web-ui work (see discovery.md Constraints) — `posthog-node` is a permitted new dependency for this story.

## Dependencies

- **Upstream:** None
- **Downstream:** S1.2 (staging/prod separation), S1.3 (bootstrap), S1.4 (tenant targeting), S1.5 (the 3 named flags) all consume this helper.

## Acceptance Criteria

**AC1:** Given `isEnabled('wizard-ui', { tenantId: 'acme' })` is called with the PostHog adapter wired, When PostHog returns `true` for that flag/context, Then `isEnabled()` returns `true`.

**AC2:** Given the PostHog adapter is not wired (default stub), When `isEnabled()` is called, Then it throws `Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.` — it does not silently return `false`.

**AC3:** Given a route handler and a UI-rendering code path both call `isEnabled()` with the same `flagKey` and `context` in the same request, When PostHog is queried, Then both call sites receive the identical result (same underlying function, not two separate implementations).

**AC4:** Given the PostHog API call fails (network error, timeout), When `isEnabled()` is called, Then it returns a documented safe default (`false` — the feature stays off) rather than throwing an unhandled error that would crash the request.

## Out of Scope

- Caching/memoization of flag state across requests — each call queries PostHog directly (or its SDK's own caching); a custom cache layer is a separate story if latency becomes a problem.
- Percentage-based or multivariate flag values — this helper returns boolean state only.

## NFRs

- **Performance:** `isEnabled()` adds no more than 200ms to any request under normal PostHog API latency.
- **Security:** No `accessToken` or session token is ever passed as part of the flag evaluation `context` object logged or sent to PostHog.
- **Accessibility:** Not applicable — this is a server-side/shared helper, not a rendered UI element.
- **Audit:** Flag evaluation calls are not individually audit-logged (out of scope) — PostHog's own dashboard provides evaluation history.

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
