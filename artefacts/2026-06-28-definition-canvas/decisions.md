# Design Decisions: Definition Story Map — Interactive Canvas

**Feature:** artefacts/2026-06-28-definition-canvas/
**Decision log owner:** Hamish King — Platform operator / tech lead

---

## ADR-DIC-001: Epic rename is blocked on canvas, not silently auto-rewritten

**Date:** 2026-06-28
**Context:** The Phase 2 design spec described canvas edits triggering real skill actions. Epic rename is one such edit. The question was whether an operator attempt to rename an epic on the canvas should (a) be silently blocked — a tooltip appears, no edit field opens — or (b) be allowed with an automatic definition rewrite underneath.
**Decision:** Epic rename on the canvas is **blocked entirely**. No inline edit field opens. An inline message states "Epic names are set by the Definition skill — return to the chat to rename." The operator must enter the rename as a chat instruction, which the model processes as a normal turn.
**Rationale:** Epic naming is not a cosmetic label — it encodes the grouping logic for the entire decomposition. A canvas rename that triggers an automatic definition rewrite would update the epic header in definition.md but leave the rationale section, story-epic references, and prior artefacts referring to the old name. The rewrite would be partial and potentially inconsistent. Blocking the canvas rename forces the name change through the full model turn path, which applies the rename consistently across the artefact. This is not an overly restrictive UX decision — epic names change rarely; the friction is appropriate.
**Operator confirmation:** Hamish King confirmed this interpretation 2026-06-28 ("confirm this means an operator-initiated rename should be blocked entirely on canvas — not silently allowed with an automatic rewrite underneath").

---

## ADR-DIC-002: Seeding is within /definition only — no cross-skill seeding from /ideate Lens A

**Date:** 2026-06-28
**Context:** The original Phase 2 spec described opportunity clusters from /ideate Lens A seeding into the Definition story map as inherited/dashed ancestor cards. The question was whether this cross-skill seeding should be implemented or whether seeding should remain within /definition's own SSE stream output.
**Decision:** Seeding is **within /definition only**. Model-emitted stories (from the current /definition session's SSE stream) appear as inherited/dashed cards. Operator-added stories (via the add-story canvas flow) appear as new/solid cards. No cross-skill seeding from /ideate Lens A.
**Rationale:** The governed lineage from /ideate to /definition is: Lens A clusters → discovery.md scope items → definition.md epics/stories. This lineage is already captured in the artefact chain. Adding a second visual seeding path from ideation.md cluster output to the definition canvas would create two records of the same lineage that can drift (if the operator edited clusters after the session, or if discovery.md was revised). Cluster-to-epic mapping requires editorial judgment (one cluster can produce multiple epics; one epic may address parts of multiple clusters) that the canvas cannot make automatically. The within-definition seeding signal (model vs. operator origin) is meaningful and implementable without these coupling problems.
**Future enhancement:** A `sourceCluster` field on discovery.md scope items (noting which Lens A cluster gave rise to each scope item) would allow epic column headers to carry a tooltip linking to their origin cluster. This is out of scope for this feature.

---

## ADR-DIC-003: Canvas edits are batched on an explicit "Apply changes" action, not per-drag

**Date:** 2026-06-28
**Context:** Canvas edits (story reorder, story add) could either fire immediately (per-drag skill call) or batch on an explicit operator action. The Phase 2 spec noted this was an open decision and asked for explicit resolution against the existing SSE turn-based protocol.
**Decision:** Canvas edits are **batched** on an explicit "Apply changes (N pending)" button. Each drag or add updates local canvas state optimistically; no skill write occurs until the operator confirms the batch.
**Rationale:** The existing `handlePostTurnStreamHtml` SSE flow is turn-based: the operator submits a turn, the model responds in a stream, the stream completes before the next turn can start. A per-drag model would need to fire one turn per drag (potentially many in quick succession), serialize them (a second drag during the first rewrite's stream would race), and handle failure mid-sequence. The batched model matches the existing turn-based protocol: one "apply" action → one server request → one definition rewrite → one artefact returned → canvas refreshes. This is structurally consistent with how the assume-confirm pattern (iwu.4) batches assumption card state updates at the confirm action rather than on each card interaction.
**Audit trail implication:** The batch apply produces a single audit entry per change record in the batch. Each change record is individually logged (type, subject, new value) as a structured field in the audit entry — the batch is not collapsed into a single opaque "canvas edit" entry. This preserves per-change traceability.

---

## ADR-DIC-004: Phase model defaults to single "Phase 1 (current)" row when discovery.md has no phases section

**Date:** 2026-06-28
**Context:** The story map's phase rows require a data source for phase names and sequence. Discovery.md may or may not have a phases section.
**Decision:** If the session's feature has a discovery.md with a parseable phases section, phase rows are derived from it in sequence order. If discovery.md is absent, or has no phases section, the story map renders a single "Phase 1 (current)" row with no locked future-phase rows. The fallback is a no-error, single-row display — not an error state.
**Rationale:** Many existing features predate the phase model and have discovery.md files with no phases section. Crashing or showing an error for these sessions would be a regression. The single-row fallback preserves the interactive canvas value (drag reorder, add-story) for all sessions regardless of whether discovery phases are defined.
