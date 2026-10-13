## Story: Restructure the Customer experience tab into a real timeline + swimlane grid

**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-10-11-journey-cx-redesign/benefit-metric.md
**Spike reference:** artefacts/2026-10-11-journey-cx-redesign/spikes/post-release-cx-visual-gap-outcome.md
**Domain:** [web-ui, design]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **the Customer experience tab to render as an actual left-to-right timeline with labeled swimlane rows (not a vertical stack of per-stage boxes), with the emotion curve and persona card embedded as proper rows/header inside that structure**,
So that **I can put this view in front of a room or a new team member and have it read as a journey map at a glance — the way `jcx-s3`/`jcx-s4` shipped the right data but not yet the right shape, confirmed by a direct comparison against the Hustle Badger reference template's own documented structure (persona header, stage columns, touchpoints row, emotional-tracking row)**.

## Benefit Linkage

**Metric moved:** M1 — Operator CX judgment vs. the reference bar
**How:** This story is the structural fix the post-release spike found: `jcx-s3`/`jcx-s4` closed their own literal ACs without ever restructuring the surrounding layout into the swimlane/timeline format the original `cjm-best-practice` spike identified as the single most load-bearing finding. This story closes that gap directly — it is the mechanism M1's own operator-judgment measurement event depends on.

## Architecture Constraints

- **No data model change.** Reuses `handleGetJourneyCanvas`'s existing stage SELECT (`customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`, `moment_of_truth` are all already queried) and the existing `checkPlaceholderConversions`/persona save-and-scan routes unchanged. This is a presentation-layer restructure of one existing view only.
- **No new chart/UI dependency.** The emotion curve stays pure inline SVG, matching `jcx-s3`'s own existing architecture constraint — only its layout position (now one row inside the grid, not a standalone box above it) and visual weight change.
- **Delivery tab is explicitly out of scope** — it keeps its own existing vertical-stack layout. Only the Customer experience tab's own rendering branch inside `handleGetJourneyCanvas` changes.
- **Canvas (`ic-s1`–`ic-s4`) is explicitly out of scope** — per the original spike's own still-valid finding 3 (journey map vs. flow diagram are different tool categories), reaffirmed in the new spike's own "Not recommended" section.

## Dependencies

- **Upstream:** `jcx-s3` and `jcx-s4` must both be DoD-complete (confirmed — both merged) — this story restructures their own already-shipped output, it does not build new underlying data or routes.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a journey with 2 or more stages, When the Customer experience tab renders, Then the stages are laid out left-to-right as columns (a real timeline), not stacked top-to-bottom as separate boxes.

**AC2:** Given the same journey, When the tab renders, Then the emotion curve, pain points, opportunities, and (newly surfaced) customer actions/touchpoints each render as their own labeled horizontal swimlane row beneath the stage-column headers — each row's label visible on the left, content aligned vertically under its own stage column, consistent row height across all stage columns in that row.

**AC3:** Given the emotion curve specifically, When it renders inside its own swimlane row, Then each point on the curve carries its own stage name directly on the chart (not only in a separately-scrolled list), and the chart fills its row's available width proportionally to stage count (no longer leaving a large empty region when there are few stages).

**AC4:** Given stage data that includes `customer_actions` and/or `touchpoints` (already captured, not currently rendered on this tab), When the tab renders, Then both appear in their own swimlane rows — closing the data-surfacing gap the spike found (finding 5), with no change to how that data is queried or stored.

**AC5:** Given the accessible linear structure `jcx-s3`'s own AC5 already built for the emotion curve (a visually-hidden `<ul>` listing every stage/emotion in document order), When the tab is restructured into a grid, Then that same accessible linear structure is preserved (or equivalently rebuilt) for the new swimlane-row structure as a whole — a screen-reader user must still be able to read the full journey stage-by-stage in order, not just see a visual grid.

**AC6:** Given the restructured layout, When compared side-by-side with the pre-existing Delivery tab, Then the two are visually distinguishable at a glance (e.g. via background tint, typography scale, or de-emphasized/relocated delivery-chrome buttons on the Customer experience tab) — closing the spike's own finding 4 (the two tabs read as structurally identical today).

## Out of Scope

- Splitting the emotion curve into separate positive/negative "thoughts and feelings" rows — reference-grounded (Hustle Badger) but touches the data model (a second sentiment dimension per stage); logged as a deferred follow-up in `decisions.md`, not built here.
- Reframing the persona card as first-person "I want/I need" statements — reference-grounded but touches the data model (a persona narrative field); same deferred-follow-up treatment.
- Any change to the Delivery tab's own layout, or to the Canvas (`ic-s1`–`ic-s4`) view.
- Per-stage illustration — still correctly deprioritized per the original spike's own finding 4; not revisited here.

## NFRs

- **Performance:** None beyond existing route bounds — this is a rendering/CSS-layout change over already-fetched data, no new queries.
- **Security:** None — no new input surface, no auth/CSRF change.
- **Accessibility:** WCAG 2.1 AA; AC5 explicitly preserves the accessible linear reading order through the restructure — this is a CSS-layout-dependent story (grid layout, swimlane alignment, responsive behavior at narrow viewports), so per CLAUDE.md's own B2 rule, every layout-dependent AC (AC1, AC2, AC3, AC6) must be classified at DoR time with either an automated visual-regression test (Playwright screenshot comparison) or an explicit RISK-ACCEPT + manual smoke-test script — not left implicit.
- **Audit:** None — no new mutating action.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
