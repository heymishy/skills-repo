## Story: Show the session-origin indicator on the /journey dashboard

**Epic reference:** artefacts/2026-09-08-session-origin-badge/epics/session-origin-visibility.md
**Discovery reference:** artefacts/2026-09-08-session-origin-badge/discovery.md
**Benefit-metric reference:** artefacts/2026-09-08-session-origin-badge/benefit-metric.md
**Domain:** [web-ui]

## User Story

As **Hamish King, Platform Owner, triaging the feature backlog**,
I want to **see the same session-origin indicator on the `/journey` dashboard**,
So that **the signal is available on every list surface I actually use to scan features, not just the product-scoped page.**

## Benefit Linkage

**Metric moved:** List-view session-origin visibility
**How:** Extends coverage from one surface (sob-s1) to two of the three surfaces named in the metric's target.

## Architecture Constraints

- **Reuse `deriveSessionOrigin` from sob-s1 unchanged** — no new derivation logic. `.github/architecture-guardrails.md`'s anti-pattern against duplicating a fixed sequence across files applies directly here.
- **No new bulk-lookup seam needed**: `_journeyStore.listJourneys()` (used by `_renderJourneyHome` today) already returns full journey objects with `completedStages` intact — confirmed by reading `journey-store.js`/`journey-store-pg.js` directly during `/design`. This story adds zero new queries.
- **Synthesized entries from `_mergeStateFeaturesIntoJourneyList` carry no `completedStages` array at all** (shape: `{ featureSlug, currentStage, productProfile, createdAt, stages: {} }`) despite representing a feature with real pipeline progress. This story must call `deriveSessionOrigin` with `hasJourney: false` for these entries (see sob-s1's AC9 contract) — not attempt to read a `completedStages` field that doesn't exist on them.
- **Accessibility**: same text-equivalent requirement as sob-s1 (`.github/architecture-guardrails.md`, Mandatory Constraints > Accessibility).

## Dependencies

- **Upstream:** sob-s1 must be DoD-complete — this story imports and reuses its `deriveSessionOrigin` function and visual treatment.
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a real journey card on `/journey` whose completed stages are all session-backed, When the page renders, Then that card shows the "fully session-backed" indicator, visually identical to sob-s1's product-page treatment.

**AC2:** Given a real journey card with a mix of session-backed and non-session-backed completed stages, When the page renders, Then that card shows the "mixed" indicator.

**AC3:** Given a synthesized (non-real-journey) card from `_mergeStateFeaturesIntoJourneyList` — a CLI-authored feature with no real journey record — When the page renders, Then that card shows the "no session" indicator, derived via `hasJourney: false`, not by attempting to read a non-existent `completedStages` field.

**AC4:** Given a real journey card with zero completed stages (still on Idea), When the page renders, Then no session-origin indicator is shown for that card.

**AC5:** Given the `/journey` page renders with a mix of real and synthesized cards, When rendered, Then no new database query or bulk-fetch call is made beyond what `_renderJourneyHome` already performs today (verified by test asserting call count on the existing `listJourneys`/`_mergeStateFeaturesIntoJourneyList` seams is unchanged from pre-story baseline).

## Out of Scope

- Any change to which cards `_mergeStateFeaturesIntoJourneyList` synthesizes, or when — this story only consumes its existing output.
- Wiring the indicator into org kanban — sob-s3.
- Any click/drill-down interaction on the indicator.

## NFRs

- **Performance:** Zero new queries (AC5).
- **Security:** None identified.
- **Accessibility:** Same as sob-s1 — text-equivalent required, not colour alone.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
