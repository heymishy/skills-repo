# Discovery: Definition Story Map — Interactive Canvas

**Status:** Approved
**Created:** 2026-06-28
**Approved by:** Hamish King — Platform operator / tech lead — 2026-06-28
**Author:** Copilot (GitHub Copilot — Claude Sonnet 4.6) — informed by Phase 1 codebase read (skills.js, chat-view.js, skills/ideate/SKILL.md, skills/definition/SKILL.md, artefacts/2026-05-21-ideate-web-ux/, product/decisions.md)

---

## Problem Statement

The `/definition` skill session renders a story map in the right panel via `renderDefinitionMap()` in `src/web-ui/routes/skills.js`. That map is static — a read-only snapshot of the model's latest artefact output. An operator who wants to resequence a story within an epic, add a story the conversation missed, or visually reorganise the work must return to the chat input and re-instruct the model, which then re-emits the full artefact. There is no way to act on the map directly.

Three specific failure modes are observed or directly predictable from the current implementation:

**1. Resequencing requires a full re-emit.** When the model orders stories suboptimally within an epic (common on complex features with many ACs), the operator must type a correction, wait for the model to re-generate the artefact, and re-parse the story map from the new draftChunk stream. The visual structure the operator was working with is replaced entirely, losing their mental orientation of the map.

**2. Operator-added stories are indistinguishable from model-emitted ones after the first rewrite.** There is no inherited/new signal on cards. When the operator adds a story via chat ("add a story for the audit trail") and the model rewrites the artefact to include it, the new story looks identical to the ones the model originally generated. The operator cannot tell, on reload, which stories were theirs and which were the model's initial decomposition.

**3. Future phases are invisible.** If the feature discovery named multiple phases (Now, Next, Later), `renderDefinitionMap()` has no phase model. There is no visual distinction between the current phase (which Definition is actively populating) and future phases (which should be locked and empty). Operators working on Phase 1 stories cannot see the placeholder structure for Phase 2 — even though Discovery named those phases and they exist in the planned scope.

The result: the story map is a passive output display rather than a working surface. Operators are unable to organise, add to, or act on the map without breaking their flow to re-enter the model conversation.

## Who It Affects

**Primary — Platform operator (developer / tech lead)** running `/definition` sessions for feature decomposition. This operator works directly in the story map, iterating between model output and their own editorial judgement about story sequencing, completeness, and phase placement. The current static rendering breaks this iteration loop — the operator has two surfaces (chat and map) that are decoupled, and acting on one does not update the other without a round-trip through the model.

**Secondary — Platform operator reviewing a completed definition artefact from a session they did not attend.** Without inherited/new card distinction, the reviewing operator cannot tell which stories were model-generated (and implicitly derive from the discovery scope items) and which were added by the session operator after the model's first pass. This creates ambiguity in definition-of-ready checks and review: a story that was added because the model missed something looks the same as one that was in the initial decomposition.

## Why Now

Two triggers converge:

1. **Direct delivery friction.** The definition canvas deficiency was first observed during `2026-06-21-strategy-and-data-hub` — the sdg feature. With 6 stories across 2 epics, story sequencing required 4 chat re-instructions to achieve the intended ordering. The operator's remark ("I have to keep explaining what to move where") is the direct signal. This feature is the remediation.

2. **Canvas infrastructure is in place.** `inc4` (completed) wired the `---CANVAS-JSON---` → `canvasBlock` SSE → `appendCanvasBlock()` → `#canvas-panel` pipeline for `/ideate`. The client-side canvas rendering pattern (marker buffer, SSE events, DOM append) is established and tested. Extending it to /definition's story map is a targeted addition to an existing, exercised path — not a structural rebuild.

## MVP Scope

**Interactive story map for `/definition` sessions.** The right panel's `renderDefinitionMap()` output becomes interactive. Specifically:

**Story card drag-and-drop within epic column, current phase only.** A story card in the story map is draggable within its epic column, within the current-phase row. This reorder is local (optimistic) until the operator applies pending changes. Cross-column moves (epic reassignment) are out of scope for the MVP.

**Phase-aware row model.** If the session's feature has a `discovery.md` with a phases section, the story map renders one row per phase in Discovery's sequence order. The current phase is interactive; future-phase rows render as locked/hatched with a "not yet defined — awaits Phase N's Definition pass" label and cannot receive drops or story additions.

**Inherited/new card distinction.** Stories emitted by the model in the current Definition session appear as inherited cards (dashed border, `model` tag). Stories added by the operator directly on the canvas appear as new cards (solid border, `new` tag). On session reload, the distinction is derived from session state (cards in the model's latest artefact output = inherited; cards added via the canvas add-story flow = new).

**Add-story canvas flow.** A `+` affordance in each empty cell of the current-phase row per epic allows the operator to add a new story by title, directly on the canvas. New stories are added to the pending changes set and appear as new cards. No skill write occurs until the operator applies changes.

**Epic rename guard.** Attempting to rename an epic column label directly on the canvas is blocked. An inline prompt states "Epic names are set by the Definition skill — return to the chat to rename." No edit field opens. The operator must restate the rename as a chat instruction.

**Touch tap-to-select / tap-to-place fallback.** HTML5 drag-and-drop does not fire on touch devices. A tap-to-select / tap-to-place interaction handles the same reorder flow on touch: tap to select a card (card highlights), then tap a target cell to place it.

**Canvas-edit dispatch.** An "Apply changes (N pending)" button in the story map toolbar batches all pending canvas edits into a single POST request, which the server routes to the appropriate definition skill actions. The definition skill processes each change as if it had been triggered by a conversational turn. The resulting artefact is returned and the canvas refreshes from it. Audit trail parity: canvas-originated writes are structurally identical to conversational-turn-originated writes in the audit log.

## Out of Scope

**Chain forking.** The mechanism for returning to a closed phase by forking a new chain from the same origin artefacts is a separate workstream. It is not implemented in this feature. The phase row model in this feature only renders phases as defined by Discovery; it does not implement fork triggers, fork navigation, or fork canvas representation.

**Epic column reassignment (cross-column drag).** Moving a story from one epic column to another via drag is deferred. The MVP permits resequencing within a column only. Cross-column moves require a definition rewrite that touches multiple epics simultaneously; this is deferred to a follow-on story once the single-column dispatch pattern is proven.

**`/ideate` canvas changes.** No changes to ideate's Lens A/B/C/D/E rendering or marker protocol. The existing `---CANVAS-JSON---` cluster-tree / table / text rendering in `#canvas-panel` is untouched.

**Cross-skill seeding from `/ideate` Lens A.** Opportunity clusters from Lens A are not visually seeded into the Definition story map. The governed lineage path (Lens A clusters → discovery.md scope items → definition.md epics) is the authoritative record. A `sourceCluster` field annotation on discovery.md scope items is noted as a future enhancement that would allow epic column headers to carry a tooltip linking to their origin cluster — this is not implemented here.

**Mobile-first layout.** The existing platform web UI has no mobile-first support. The touch fallback in this feature (tap-to-select / tap-to-place) is the minimum required for touch device usability; it is not a mobile layout redesign.

## Architecture Constraints

All changes are in-place modifications to `src/web-ui/routes/skills.js` and `src/web-ui/views/chat-view.js`. No new `src/` module is introduced by this feature. Client-side JavaScript is embedded as string literals in the existing inline `<script>` block pattern (established by inc4, iwu.3, iwu.5). A new route `POST /api/skills/definition/sessions/:id/canvas-edit` handles the batched canvas-edit dispatch.

The `req.session.accessToken` field name is canonical (per CLAUDE.md). The path traversal guard (`path.resolve().startsWith(repoRoot)`) applies to any file writes triggered by canvas-edit dispatch. Injectable adapters introduced must have stub-throws defaults (per D37).

## Assumptions and Risks

[ASSUMPTION] The phase model can be reliably derived from discovery.md at session start without operator intervention — the "phases" section of discovery.md has a consistent enough format that the server can parse it. If discovery.md phase formats are inconsistent across features, the fallback (single "Phase 1 / current" row) must activate cleanly rather than crashing.

[ASSUMPTION] Operators will use the "Apply changes" batch action rather than expecting per-drag auto-save. If operators expect immediate persistence, the pending-changes model will feel like a loss of changes on browser close or network drop. This is an acceptable MVP constraint: the apply action is explicit and the pending count is visible.

**Known risk — artefact drift on concurrent model turn.** If the operator is in the middle of applying canvas changes while the model is also streaming a new turn (a "continue" auto-fire), the canvas-edit dispatch and the model's draftChunk stream may race. The canvas-edit route must reject if a model turn is in flight for the session. This race condition must be handled explicitly in the dispatch handler, not left as an implicit "last write wins."

**Known risk — definition.md phase-awareness.** Definition sessions that predate this feature have no phase metadata in their session state. When the story map renders for an older session, the phase-row model must fall back to "Phase 1 (current)" without error, treating all existing stories as current-phase.
