## Story: Canvas pan and zoom

**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-10-10-infinite-canvas/benefit-metric.md
**Domain:** [web-ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead)**,
I want **to pan and zoom the journey canvas**,
So that **I can work with journeys that have more stages than fit comfortably in the viewport at once, without the canvas becoming unusable**.

## Benefit Linkage

**Metric moved:** M2 — Operator CX judgment vs. the list view
**How:** A spatial canvas that cannot be navigated once it has more than a handful of nodes is strictly worse than the list it replaced (which scrolls naturally). Pan/zoom is a precondition for the operator's CX judgment to be fair — without it, a larger journey would make the canvas feel broken rather than genuinely better.

## Architecture Constraints

None identified beyond those already named in the epic (`decisions.md` ADR-001 — not `architecture-guardrails.md`'s unrelated repo-level ADR-001) — this story is pure client-side interaction wiring, no new route or persisted data.

## Dependencies

- **Upstream:** `ic-s1` — the canvas must exist before it can be panned/zoomed.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the canvas has more stages than fit in the viewport, When the operator holds `Ctrl` and scrolls over the canvas, Then the canvas zooms in or out — matching drawflow's own built-in `Ctrl+scroll` convention, confirmed in the spike (`spikes/zero-build-canvas-library-outcome.md`). Plain scroll (no `Ctrl`) does not zoom, to avoid conflicting with the page's own normal scroll behaviour.

**AC2:** Given the canvas, When the operator drags empty canvas space (not a node), Then the whole view pans — matching drawflow's own built-in behaviour, confirmed in the spike.

**AC3:** Given the operator has panned and/or zoomed away from the default view, When they reload the page, Then the canvas returns to its default pan/zoom level — pan/zoom state is session-only and deliberately not persisted, in contrast to node position (`ic-s2`), which is persisted. This distinction must be observably correct, not just documented.

**AC4:** Given the Canvas tab is nested inside this app's own page layout (sidebar + header), When a pan or zoom interaction occurs over the canvas, Then it stays contained within the canvas viewport and does not trigger the surrounding page's own outer scroll or layout shift.

## Out of Scope

- **Persisting pan/zoom state across reloads** — deliberately session-only; see AC3.
- **Keyboard-based pan/zoom of the canvas view itself.** `/clarify`'s own committed WCAG 2.1 AA interaction model (`decisions.md`) addressed keyboard-accessible *node* movement only (`ic-s4`), not keyboard-accessible canvas navigation (pan/zoom). **Formally RISK-ACCEPTed** (`decisions.md`, 2026-10-10, Hamish King — Platform Owner) rather than silently omitted — see that entry for the full rationale and revisit trigger.

## NFRs

- **Performance:** Pan/zoom interactions render at a perceived-smooth frame rate for journeys with up to 20 stages (matching `ic-s1`'s own performance bound) — this is drawflow's own default rendering behaviour, not custom code, so no additional optimisation work is anticipated.
- **Security:** None — no new input surface, no persisted data.
- **Accessibility:** See Out of Scope above — RISK-ACCEPTed in `decisions.md` (2026-10-10), not a silently accepted gap.
- **Audit:** None.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
