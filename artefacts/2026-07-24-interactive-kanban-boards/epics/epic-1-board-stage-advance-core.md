## Epic: An operator can move a real journey to its next pipeline stage directly from the board, without dropping to the chat session

**Discovery reference:** artefacts/2026-07-24-interactive-kanban-boards/discovery.md
**Benefit-metric reference:** artefacts/2026-07-24-interactive-kanban-boards/benefit-metric.md
**Slicing strategy:** Risk-first — this epic proves the single riskiest, highest-uncertainty integration in the whole feature (calling the real, existing `POST /api/journey/:journeyId/gate-confirm` route from a new board-driven action, including its `session.done` precondition) via the simplest possible interaction (a click), before Epic 3 or any visual work invests in drag-and-drop polish on top of it.

## Goal

An operator viewing any of the three kanban boards (product/org/tenant) can advance a card whose current stage session has genuinely completed, directly from the board, via a click action — with no change to the underlying `gate-confirm` mechanism, and a clear, honest explanation shown when a card isn't actually ready to advance (session still in progress). Drag-and-drop (Epic 3) reuses this same proven action; this epic does not include drag-and-drop itself.

## Out of Scope

- Drag-and-drop interaction itself — this epic proves the underlying action works via a simple click/button; Epic 3 layers drag-and-drop on top of the same action.
- Visual redesign of the board (Epic 2) — this epic's UI work is the minimum needed to expose the action, not the full visual pass.
- Any change to `handlePostGateConfirm`'s own validation, artefact-writing, or `pipelineStateWriterFactory` logic — this epic consumes that route as-is.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1: Board-to-CLI parity for real stage transitions | 0% | ≥ 50% (min signal ≥ 20%) | This epic is the entire mechanism by which any board-driven transition becomes possible at all — without it, M1 cannot move. |

## Stories in This Epic

- [ ] S1.1: Add a "ready to advance" board action that calls the real gate-confirm route for a completed session
- [ ] S1.2: Show a clear, honest reason when a card's session isn't yet ready to advance

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This epic wires a new caller (the kanban board) into an existing, real, artefact-validating, state-mutating route (`handlePostGateConfirm`) for the first time from outside the chat-session UI. The blast radius (any real customer journey, across all three board scopes) and the novelty of the integration path warrant a human review at PR, not full autonomous proceed — per this repo's own `team-identity-roles` learnings on verifying wired behaviour is actually correct, not just present.

## Complexity Rating

**Rating:** 2 — some ambiguity: the exact UX for the "not ready" case (S1.2) needs care, and the real precondition (`session.done`) must be surfaced accurately from data the board doesn't currently fetch (per-card session-done state is not part of `_aggregateJourneysByStage`'s current card shape — this epic must add it).

## Scope Stability

**Stability:** Stable — the underlying mechanism (`handlePostGateConfirm`) is a real, existing, already-proven route; the only new surface is a thin caller.
