## Story: Make the "Continue to next stage" action persistently reachable regardless of scroll position

**Epic reference:** artefacts/2026-08-31-web-ui-navigation-legibility/epics/web-ui-navigation-legibility.md
**Discovery reference:** artefacts/2026-08-31-web-ui-navigation-legibility/discovery.md
**Benefit-metric reference:** artefacts/2026-08-31-web-ui-navigation-legibility/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Developer/engineer or Platform maintainer running a multi-stage feature session through the web UI**,
I want **the "Continue to [next stage] →" action to stay visible and reachable no matter how far I've scrolled through the chat**,
So that **I never have to hunt back through session history to find how to advance, and the "can't find next stage" friction that originally triggered this discovery does not recur**.

## Benefit Linkage

**Metric moved:** M2 — Next-stage-action findability
**How:** The `.sw-journey-gate` control is currently appended once at the end of `bodyContent` and scrolls away with the rest of the chat the moment the operator scrolls up to re-read earlier turns; making it `position: sticky` to the bottom of the viewport keeps it reachable at all times, directly eliminating the specific "couldn't find next stage" incident this metric's baseline was set from (2026-08-31).

## Architecture Constraints

- Reuse the existing, already-live `position: sticky` pattern from `src/web-ui/utils/html-shell.js:568` (`.sw-imp-banner`, the impersonation banner) — same underlying CSS technique, anchored to `bottom: 0` instead of `top: 0` (natural for a "continue forward" action placed at the end of a chat). Do not introduce a new positioning mechanism, a JS-based scroll listener, or a new npm dependency (architecture guardrails: "no new npm dependencies," ADR-009 Express-less design).
- Modify the `journeyPanel`/`.sw-journey-gate` construction in `src/web-ui/routes/skills.js` (~line 4569) — the existing form, CSRF field, button, and "Artefact saved — advance to next stage" caption are reused unchanged; only the wrapping `<div class="sw-journey-gate">`'s own positioning changes.
- Mandatory Constraints (`architecture-guardrails.md`, Accessibility): the sticky control must remain keyboard-accessible (it already is — a standard `<form>`/`<button>`) and must not visually cover or obscure content in a way that makes other interactive elements unreachable by keyboard focus order.

## Dependencies

- **Upstream:** None.
- **Downstream:** None. Touches `src/web-ui/routes/skills.js`, the same file `wnl-s1` modifies (a different section, `buildContextManifestHtml` vs. the journey-gate render) — low conflict risk, but rebase against the latest state of this file before starting either story if both are in flight concurrently.

## Acceptance Criteria

**AC1:** Given a skill session has an active journey stage gate (the "Continue to [next stage] →" button is present), When the operator scrolls up through earlier chat history, Then the gate control remains visible at the bottom of the viewport, not scrolled out of view.

**AC2:** Given the sticky gate control is showing, When the operator clicks "Continue to [next stage] →", Then the form submits to `/api/journey/:journeyId/gate-confirm` exactly as it does today — no change to the submit behaviour, only to its visibility.

**AC3:** Given a short session where the chat content is shorter than the viewport height, When the page renders, Then the gate control still appears in its normal position at the end of the content (not floating awkwardly mid-page) — sticky positioning must not visually misplace the control when there's nothing to scroll past.

**AC4 (regression guard):** Given the sub-step affordance HTML (`subStepHtml`/`subStepJs`, rendered immediately before the journey gate for stages with side trips), When the sticky gate renders, Then the sub-step affordance's own existing behaviour and appearance are unaffected — this story changes only the journey-gate div's positioning, not the sub-step markup or logic.

**AC5:** Given the sticky gate control is visible at the bottom of the viewport, When other page content is scrolled behind it, Then no interactive element (links, buttons, form fields elsewhere on the page) becomes permanently hidden or unreachable behind the sticky control — verified by checking the control's height/z-index doesn't create a dead zone over content that needs to remain clickable.

## Out of Scope

- Any redesign of the gate control's own visual style, button copy, or the "Artefact saved — advance to next stage" caption text.
- Making any other page element sticky (e.g. a persistent header/toolbar) — this story is scoped to the journey-gate control only.
- A collapsed/minimized state for the sticky control if it turns out to feel cluttering in practice — if that risk (named in the discovery) materialises during implementation or review, it becomes a follow-up story, not silently added here.

## NFRs

- **Performance:** None material — CSS-only positioning change, no new JS, no new requests.
- **Security:** None — no new input surface; the existing CSRF-protected form is reused unchanged.
- **Accessibility:** Sticky control must not break keyboard focus order or hide other focusable elements behind it (AC5); no new accessibility regression versus the current non-sticky rendering.
- **Audit:** None identified — no change to what the gate-confirm action logs, only to the control's visibility.

## Complexity Rating

**Rating:** 1 — a CSS positioning change reusing an already-live, already-established pattern in this exact codebase (`.sw-imp-banner`). No new backend logic, no new component.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
