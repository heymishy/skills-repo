## Story: Bootstrap flags server-side on session start to avoid UI flicker

**Epic reference:** artefacts/2026-07-09-beta-readiness-infra/epics/epic-1-feature-flags.md
**Discovery reference:** artefacts/2026-07-09-beta-readiness-infra/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-beta-readiness-infra/benefit-metric.md

## User Story

As a **first beta customer**,
I want the wizard canvas to render in its final gated state on first paint,
So that I never see a flicker where a flag-gated element briefly appears then disappears (or vice versa) as flags resolve client-side.

## Benefit Linkage

**Metric moved:** Metric 2 — Feature flags toggle without a redeploy
**How:** A redeploy-free toggle is only a real win for beta customers if it doesn't come at the cost of a visibly broken first render — this story ensures flag state is resolved before HTML is sent, not after.

## Architecture Constraints

- D37: uses the `isEnabled()` adapter from S1.1.
- Model-first web-UI architecture (`product/tech-stack.md` §Web UI layer) — flags must be resolved before `buildSystemPrompt`/page render, consistent with the existing session-start flow.
- ADR-018: AC4's verification is a Playwright spec under `tests/e2e/`.

## Dependencies

- **Upstream:** S1.1 (isEnabled() helper), S1.2 (staging/prod separation)
- **Downstream:** S1.5 (the named flags) relies on this bootstrap existing so `wizard-ui` in particular renders without flicker.

## Acceptance Criteria

**AC1:** Given a user's session starts, When the wizard canvas page is first rendered, Then all relevant flag states for that session are already resolved and included in the initial HTML response — no client-side flag fetch happens before first paint.

**AC2:** Given a flag is toggled in PostHog mid-session, When the user's current page is already rendered, Then the change is not expected to apply until the next session-start (page reload/new session) — this story does not implement live mid-session flag updates.

**AC3:** Given the PostHog flag-resolution call is slow or times out during session bootstrap, When the session start proceeds, Then it falls back to the documented safe default (per S1.1 AC4) rather than blocking session start indefinitely.

**AC4:** Given a Playwright test loads the wizard canvas with a flag explicitly set on/off, When the page's initial HTML is inspected, Then the corresponding gated element is present or absent in that very first response — not added/removed after the fact via a subsequent script execution.

## Out of Scope

- Live, mid-session flag updates without a page reload (e.g. via websocket/SSE) — deferred; a toggled flag applies on next session start, not instantly.
- Client-side flag override for local development/testing — a separate, unscoped developer-experience concern.

## NFRs

- **Performance:** Flag bootstrap adds no more than 200ms to session-start latency (matches S1.1's `isEnabled()` budget).
- **Security:** None beyond S1.1.
- **Accessibility:** No flicker also benefits users relying on assistive technology that would otherwise announce a rapidly-changing DOM.
- **Audit:** None identified beyond S1.1.

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
