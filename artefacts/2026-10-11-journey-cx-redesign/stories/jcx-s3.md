## Story: Connected emotion curve across stages on the Customer experience tab

**Epic reference:** artefacts/2026-10-11-journey-cx-redesign/epics/journey-map-and-placeholder-trigger.md
**Discovery reference:** artefacts/2026-10-11-journey-cx-redesign/discovery.md
**Benefit-metric reference:** artefacts/2026-10-11-journey-cx-redesign/benefit-metric.md
**Domain:** [web-ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **to see a connected emotion curve across all stages on the Customer experience tab**,
So that **I can read the journey's emotional arc at a glance, the way the reference examples (Spotify, supermarket, Hustle Badger) all do — not piece it together from per-stage text**.

## Benefit Linkage

**Metric moved:** M1 — Operator CX judgment vs. the reference bar; M3 — Emotion/persona data actually populated
**How:** The emotion curve is the single most consistently-cited structural element of a journey map per the CX best-practice spike (`spikes/cjm-best-practice-outcome.md`) — this is the headline change that closes the gap M1 measures. It is also the direct mechanism that prompts M3 (visible curve gaps make missing `emotion` data obvious, encouraging operators to fill it in).

## Architecture Constraints

- **No new npm dependency unless justified** — `product/constraints.md` and `ic-s1`'s own `decisions.md` precedent (drawflow.js vs. Cytoscape spike). The emotion curve should be rendered as inline SVG (connecting the already-existing per-stage emotion chip positions), not a charting library, unless a direct comparison justifies one.
- **MC-A11Y-02 (existing convention, confirmed in `journeys.js` line 608)** — emotion must never be conveyed by colour alone; the existing emotion chip already pairs colour with a text label (`positive`/`neutral`/`negative`/`mixed`) — the curve must preserve this, not regress to colour-only.
- `product/constraints.md` #9 — WCAG 2.1 AA hard floor.

## Dependencies

- **Upstream:** None — reuses the already-shipped `emotion` field and `STAGE_EMOTION_VALUES` enum (`journeys.js`); no schema change.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a journey with 2+ stages, each with an `emotion` value set, When the operator opens the Customer experience tab, Then a connected curve/line renders across the stages, visually tracking the emotion value's position (e.g. positive higher, negative lower, matching a conventional emotion-curve shape) — not just independent per-stage chips with no connecting line.

**AC2:** Given a journey where some stages have `emotion` set and others do not, When the curve renders, Then stages with no `emotion` value show an explicit "no emotion data yet" empty-state marker on the curve — the curve does not silently skip them or render a misleading flat/default position (per `/clarify`, 2026-10-11: confirmed this is a required MVP element, not an assumption of pre-populated data).

**AC3:** Given a journey where NO stages have any `emotion` value set, When the operator opens the tab, Then the whole curve area shows a clear, friendly empty state (not a blank space or a broken-looking flat line) — this is the expected common case per `/clarify`'s own confirmation that existing data is mostly empty.

**AC4:** Given the curve is rendering, When checked against MC-A11Y-02, Then each point on the curve still carries a text label (not colour alone) — reusing the existing emotion chip's own text-label convention, not a regression.

**AC5:** Given a screen-reader user, When they reach the emotion curve, Then its content is exposed in an accessible, linear order (e.g. via appropriate ARIA structure or an equivalent text alternative) — a purely visual SVG curve with no accessible fallback fails WCAG 2.1 AA.

## Out of Scope

- A charting library — inline SVG unless a direct comparison justifies a dependency (see Architecture Constraints).
- Editing emotion values directly from the curve — the existing side-panel editing flow (`sw-stage-field-emotion` select) remains the only way to set emotion; the curve is read-only visualization for this story.
- Per-stage illustration/storyboard alongside the curve — separate, deferred per `discovery.md`'s own Out of Scope.

## NFRs

- **Performance:** Curve renders without noticeable delay for journeys up to 20 stages (matching `ic-s1`'s own established performance bound for the canvas).
- **Security:** None beyond existing read-only data display — no new input surface.
- **Accessibility:** WCAG 2.1 AA hard floor (product/constraints.md #9); MC-A11Y-02 colour-plus-label convention preserved; AC5's screen-reader requirement.
- **Audit:** None — read-only visualization of already-audited data.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

---CANVAS-JSON: {"type":"data-model","title":"Data model","content":{"mermaid":"erDiagram\n    CUSTOMER_JOURNEY_STAGES {\n        uuid id PK\n        uuid journey_id FK\n        text tenant_id\n        text name\n        integer position\n        text emotion\n        text pain_points\n        text opportunities\n    }"}}---

<!-- No schema change -- pure reuse of the already-shipped emotion/pain_points/opportunities columns (STAGE_EMOTION_VALUES enum, confirmed in journeys.js), shown per csd-s4's own reuse-without-schema-change rule. -->
