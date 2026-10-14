# Spike Outcome: Delivery view design — closing the one view never design-reviewed this session

**Opened:** 2026-10-14 | **Scope:** Standard | **Steps taken:** 4 (direct read of the Delivery view's own current markup in `journeys.js`; web search on requirements-traceability-matrix UI patterns; web search on feature-roadmap-linked-to-journey-stage UI patterns; web search on status-badge design best practice)
**Done condition met:** Yes
**Artefact path:** `artefacts/2026-10-14-journey-authoring-experience/spikes/delivery-view-design-outcome.md`
**Trigger:** Operator follow-up action #3 from the `whole-journey-experience-across-views` spike — the one view (of Canvas / Customer experience / Delivery) never design-reviewed at all this session.

---

## Outcome: REDESIGN (same structural fix as the Customer-experience tab, not a new pattern)

### What was found

1. **The Delivery view today is structurally identical to the Customer-experience tab BEFORE `jcx-s6`** — a vertical stack of per-stage cards, each showing the stage name, a health badge (`Covered`/`Needs metrics`/`No coverage`), optional moment-of-truth badge, reorder controls, and 3 action affordances (`Edit stage`, `Map feature`, `Add placeholder`), followed by a separate "delivery annotations" block (actual feature mappings + metric coverage). Confirmed by direct code read — this is the EXACT shape `jcx-s6`'s own spike found for the Customer-experience tab before that story restructured it into a swimlane grid.

2. **The requirements-traceability-matrix pattern (the closest established analogue to "which features cover which journey stage") is a TABLE, not a vertical card stack.** Established tooling in this space (Polarion, HP ALM/Micro Focus, Visual Paradigm) consistently uses a matrix/grid structure: one axis is the requirement/stage, the other is the covering artifact (feature, test case), with coverage status as a cell value — not a stacked list of cards each describing its own status in prose/badge form.

3. **Status-badge design guidance directly validates this app's own EXISTING badge design, not just its layout.** Concise 1-2 word labels, a semantic color per status, and crucially: "place badges... in their own column for scannability in tables" — a direct, independent confirmation that the fix here is STRUCTURAL (move to a table/grid), not a redesign of the badges themselves. `Covered` (green/check), `Needs metrics` (amber/warning), `No coverage` (red/cross) are already well-formed per this guidance — reused as-is, not reinvented.

4. **The fix this points to is a close structural cousin of `jcx-s6`'s own already-shipped swimlane grid — high reuse potential, low net-new design work.** `jcx-s6` already built the exact column-per-stage, shared-`gridTemplateColumns`, horizontal-scroll-with-pinned-labels mechanism this view would need (stage columns, with rows for: mapped feature(s), coverage status, moment-of-truth). `jcx-s7` already polished its own muted-empty-state and single-click-to-edit conventions. A Delivery-view redesign would most likely REUSE `buildDataRow`/the grid CSS classes directly (per ADR-026) rather than invent a second grid mechanism — this is not a "from scratch" research problem, it is close to a direct application of already-validated, already-shipped patterns.

### Reasoning

The Delivery view's own gap is not that its information is wrong or its badges are poorly designed — both the health-status concept and the badge styling are already sound, confirmed against 2 independent sources. The gap is the SAME structural one `jcx-s6` already fixed for Customer-experience: a vertical stack of cards doesn't read as "the plan" (the `whole-journey-experience-across-views` spike's own framing) the way a real coverage matrix/grid would, and the established pattern for exactly this kind of content (what covers what, with a status) is a table, not a card list.

---

## If REDESIGN

**What needs to change:** Restructure the Delivery view's own stage-by-stage vertical stack into a grid matching `jcx-s6`'s own swimlane-grid shape: stage name + health badge as the header row (mirroring the CX grid's own header row), then data rows for "Mapped feature(s)," "Placeholder status" (if applicable), and the existing `Map feature`/`Add placeholder` action affordances — reusing the grid's own column-sharing/scroll/pinned-label mechanism directly.

**Suggested direction, prioritized:**

- **P0 — Reuse, don't reinvent.** Any implementation should directly reuse `buildDataRow`/the `.sw-cx-grid-*` CSS classes (renamed or namespaced for Delivery, e.g. `.sw-delivery-grid-*`, but structurally identical) per ADR-026 — this is the single highest-leverage finding: the hard design work (column sharing, scroll behavior, muted empty-state, 8px spacing, single-click-to-edit) is already done and already validated.
- **P1 — Keep the existing badge design exactly as-is.** `Covered`/`Needs metrics`/`No coverage` with their current icon+color treatment need no change per the status-badge research — only their CONTAINER (card → grid cell) changes.
- **P2 — Decide where `Map feature`/`Add placeholder` live in the new grid.** Candidates: a dedicated row (consistent with the matrix-table pattern), or inline within the coverage-status cell (more compact, closer to today's per-card layout). Needs an operator call before a story is written — not resolved by this spike.

**Not recommended:** Inventing a new grid/table mechanism for Delivery. `jcx-s6`'s own grid is a direct structural match for this content shape; building a second, parallel mechanism would violate ADR-026 and double the maintenance surface for no benefit.

**Return to:** Operator decision below on whether to scope this as a new story now, given it is not yet a written story — this spike is itself one of the 4 follow-up actions, not a commitment to build.

---

## Sources

- Direct read of `src/web-ui/routes/journeys.js`'s own Delivery-view markup (`stagesHtml`, `buildHealthIndicator`, `buildDeliveryAnnotations`) — grounds finding 1 in the actual shipped code, not assumption
- Requirements-traceability-matrix UI pattern research (web search) — Polarion, Micro Focus ALM, Visual Paradigm, Docsie — table/matrix structure, not a card stack
- Feature-roadmap/journey-stage status-badge pattern research (web search)
- Status-badge design best practice (web search) — Shopify, Siemens IX, EUI (Elastic) — confirms this app's own existing badge concept and styling convention, points at table/column placement specifically

---

## Discovery fields resolved

No discovery-field changes — this spike is scoped to research only; no story has been written yet, and no existing feature's discovery.md is affected. If this proceeds to a story, it would most naturally extend the `journey-authoring-guided-creation` epic or form a new epic within this same feature slug (`2026-10-14-journey-authoring-experience`), not require a new discovery pass — the structural fix pattern (grid replacing card stack) is already well-precedented within this app's own codebase.
