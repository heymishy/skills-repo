# Story: inc5 — Canvas-JSON marker instruction in /ideate SKILL.md

**Feature:** 2026-06-15-ideate-web-ux-inc3
**Epic reference:** inc3-inc4 — Skill cadence + canvas output (`.github/pipeline-state.json` epics[inc3-inc4])
**Discovery reference:** artefacts/2026-06-15-ideate-web-ux-inc3/discovery.md (see "Deferred" addendum — inc5 split out of inc4's original marker-emission scope)
**Benefit-metric reference:** artefacts/2026-06-15-ideate-web-ux-inc3/benefit-metric.md (M2 — Canvas block render fidelity)
**Depends on:** inc4 at definition-of-done
**Story type:** SKILL.md instruction update (no code changes)

---

## User story

As a facilitator running an /ideate session,
I want each lens output to appear as a structured canvas block in the canvas panel,
So that the session produces a richer, visual artefact alongside the conversation without manual formatting.

---

## Background

inc4 built the full client-side infrastructure: SSE `canvasBlock` event, `#canvas-panel` renderer, `renderCanvasBlock` for `cluster-tree`, `table`, and `text` types. The panel is live in the UI. The gap is that the /ideate skill model does not emit `---CANVAS-JSON: {...}---` markers — so the canvas panel stays empty during sessions.

inc5 closes this gap by adding a canvas marker instruction block to the /ideate SKILL.md. No code changes are required; the change is instruction-only.

---

## Benefit Linkage

**Metric moved:** M2 — Canvas block render fidelity (`benefit-metric.md`)
**How:** M2 measures the proportion of `canvasBlock` SSE events that render correctly, but inc4 built the rendering pipeline with no upstream source of those events — M2 has had nothing to measure since inc4 merged. inc5 is the only story that makes the /ideate model emit `---CANVAS-JSON: {...}---` markers, so it is the story that makes M2 measurable at all, not just improvable.

---

## Architecture Constraints

None identified — SKILL.md instruction content is governed by pipeline process, not `.github/architecture-guardrails.md` (see guardrails line 38: "Skill files and templates are content, not code — they are governed by pipeline process, not these guardrails").

---

## NFRs

None identified — instruction text only, no new runtime path, no client/server code touched. Output correctness (marker schema compliance) is covered by AC4 and verified via the inc4 `parseCanvasBlock` validator already in production; inc5 adds no new validation surface of its own.

---

## Acceptance criteria

**AC1 — Lens A canvas block**
The SKILL.md instructs the model to emit a `cluster-tree` CANVAS-JSON marker for the Lens A opportunity map. When the model produces Lens A output in a live session, a cluster-tree canvas block renders in `#canvas-panel`.

**AC2 — Lens D canvas block**
The SKILL.md instructs the model to emit a `table` CANVAS-JSON marker for the Lens D strategy table (10-question pass). When the model produces Lens D output, a table canvas block renders in `#canvas-panel`.

**AC3 — Text fallback**
The SKILL.md instructs the model to emit a `text` CANVAS-JSON marker for any lens output that is narrative/prose rather than structured data (e.g. Lens C, Lens E). A text canvas block renders in `#canvas-panel`.

**AC4 — Marker schema compliance**
The CANVAS-JSON markers emitted by the model comply with the schema validated by `parseCanvasBlock`: `{"type":"cluster-tree"|"table"|"text","title":"<string>","content":<object>}`. The SKILL.md instruction includes the exact schema and an example for each type.

**AC5 — Marker stripped from chat stream**
The CANVAS-JSON markers do not appear as raw text in the chat message stream — they are stripped by the display buffer (inc4 implementation). The facilitator sees only the rendered canvas block, not the JSON.

**AC6 — Cadence: one block per lens output**
Each lens output produces exactly one CANVAS-JSON marker. The model does not emit multiple markers for the same lens step.

---

## Out of scope

- New canvas block types beyond `cluster-tree`, `table`, `text` (covered by the inc4 type allowlist)
- Changes to the canvas panel layout, CSS, or renderer (inc4)
- Changes to any SKILL.md other than /ideate

---

## Dependencies

- **Upstream:** inc4 must be at definition-of-done — inc5's markers are consumed by inc4's `parseCanvasBlock`/`canvasBlock` SSE pipeline, which must exist and be merged first.
- **Downstream:** Satisfies the inc4 DoD entry condition deferred pending this story (see Definition of done entry condition note below). Closes the M2 measurement gap for the feature's benefit-metric tracking.

---

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

---

## Definition of done entry condition

Human verification: live /ideate session shows canvas blocks rendering in `#canvas-panel` for at least Lens A and Lens D outputs. Verification artefact at `artefacts/2026-06-15-ideate-web-ux-inc3/verification/inc5-canvas-skill-verification.md`.

*Note: This also satisfies the inc4 DoD entry condition ("at least one canvas block rendering in #canvas-panel for a lens output") which was deferred pending this story.*
