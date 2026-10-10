## Story: Keyboard-accessible node movement (WCAG 2.1 AA)

**Epic reference:** artefacts/2026-10-10-infinite-canvas/epics/canvas-replacement-for-journey-stages.md
**Discovery reference:** artefacts/2026-10-10-infinite-canvas/discovery.md
**Benefit-metric reference:** artefacts/2026-10-10-infinite-canvas/benefit-metric.md
**Domain:** [web-ui]

## User Story

As an **outer loop practitioner (PO / SME / discovery lead) who cannot or does not want to use a mouse**,
I want **to reposition a stage node using the keyboard**,
So that **the canvas is genuinely usable for me, not just for mouse/touch users — matching this platform's existing WCAG 2.1 AA commitment**.

## Benefit Linkage

**Metric moved:** M1 — Spatial layout actually used
**How:** M1 measures whether a node is repositioned and kept, regardless of input method. A keyboard-only operator with no way to reposition a node would never be able to contribute to this metric at all — this story closes that gap, and also prevents M2's CX judgment from being dragged down by an accessibility failure.

## Architecture Constraints

- **`decisions.md` ASSUMPTION entry from `/clarify`**: the committed interaction model is snap-to-grid discrete movement — arrow keys move a selected node by a fixed step — explicitly extending `ep1-s4`'s own already-shipped, already-accessible up/down-button reorder precedent to two dimensions, rather than attempting continuous freehand keyboard dragging.
- **`product/constraints.md` #9**: WCAG 2.1 AA, already a hard constraint on the journey canvas generally.
- **Node focusability is not assumed — it must be built.** drawflow's own node elements are plain `<div class="drawflow-node">` wrappers, not natively keyboard-focusable. This story must explicitly add `tabindex="0"` to each node and a visible `:focus` style — see AC1a.

## Dependencies

- **Upstream:** `ic-s2` — this story reuses its position-persistence route; a focused node's keyboard-driven move writes to the same `position_x`/`position_y` fields via the same mechanism as a mouse drag.
- **Downstream:** None.

## Acceptance Criteria

**AC1a:** Given a canvas node, When the page renders, Then the node has `tabindex="0"` and a visible `:focus` style (not the browser default, matching this app's own existing focus-style convention) — nodes are not keyboard-reachable by default in drawflow and must be made so explicitly.

**AC1b:** Given a canvas node, When the operator presses Tab to focus it and presses an arrow key, Then the node moves one fixed step in that direction (up/down/left/right), and the new position is saved via the exact same route `ic-s2` established for mouse-drag persistence.

**AC2:** Given a focused node, When the operator presses Tab (or Shift+Tab), Then focus moves cleanly to the next (or previous) focusable element on the page — no focus trap — consistent with this app's own existing focus-management convention (`ep1-s3`'s precedent for the stage side panel).

**AC3:** Given the canvas and its nodes, When exercised with no mouse at all (keyboard-only walkthrough), Then every node can be focused, moved, and its new position reflected on reload — confirmed via the same "no mouse" manual verification technique already established for `ep1-s4`'s own reorder buttons.

**AC4:** Given mouse/touch drag (`ic-s2`) and keyboard snap-to-grid movement (this story), When either input method is used on the same node, Then both write to the exact same `position_x`/`position_y` fields — there is no divergent or parallel data model between the two input methods.

**AC5:** Given a node has just been moved via arrow key, When the operator continues pressing the same arrow key, Then the node keeps moving by the fixed step each time (not a one-shot nudge) — matching the expected, predictable behaviour of a discrete-movement control.

## Out of Scope

- **Continuous freehand keyboard dragging** — explicitly ruled out in `/clarify`; snap-to-grid discrete movement is the committed MVP model.
- **Keyboard-based canvas pan/zoom** — flagged as a separate, unresolved open question in `ic-s3`'s own Out of Scope; not addressed here either.
- **Configurable step size** — the fixed step is a single, hardcoded value for MVP; making it configurable is a future enhancement, not named in discovery.

## NFRs

- **Accessibility:** This story's entire purpose is WCAG 2.1 AA conformance for node-repositioning functionality — AC3 is the direct conformance check (keyboard-only operability confirmed by hands-on walkthrough, not merely asserted).
- **Performance:** None beyond `ic-s2`'s own bounds — this story reuses that story's persistence mechanism unchanged.
- **Security:** None beyond `ic-s2`'s own bounds — same route, same guard.
- **Audit:** None.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
