## Story: Build up the Live Draft panel progressively as the model generates the artefact

**Epic reference:** artefacts/2026-05-07-web-ui-streaming-live-draft/stories/wusl-2-progressive-live-draft.md (self)
**Discovery reference:** artefacts/2026-05-07-web-ui-streaming-live-draft/discovery.md
**Benefit-metric reference:** artefacts/2026-05-07-web-ui-streaming-live-draft/benefit-metric.md (pending)

## User Story

As an **operator using the web UI skill session chat**,
I want the Live Draft panel to fill in progressively as the model writes the artefact,
So that I can see the document structure forming in real time, orient to what the model is producing, and interrupt early if the direction is wrong — rather than waiting for the full document to appear as a single reveal at the end of a long turn.

## Benefit Linkage

**Metric moved:** M1 — Outer loop task completion rate via web UI (first-session completion without dropping back to VS Code)
**How:** When operators cannot see the artefact forming, they have no signal that the model is on track until the turn completes. A discovery session for a complex idea may run 45–90 seconds before the artefact appears. Progressive draft display turns the generation phase from opaque waiting into observable production — operators stay engaged and can provide correction on the next turn based on what they saw building, not a document they must read cold.

## Architecture Constraints

- Current flow: `handlePostTurnStreamHtml` streams chunks to the client via `{chunk: "..."}` SSE events. The client accumulates chunks into `streamText`. The artefact is parsed server-side after the full response completes, then sent as `{done: true, artefactContent: "..."}` in the final event. `updateDraftPanel` is called once, with the complete content.
- Required change: the server-side `onChunk` callback (or a new client-side detection layer) must detect when the accumulated stream has passed the `---ARTEFACT-START---` signal and begin forwarding artefact-content increments to the client as a separate event type, e.g. `{draftChunk: "..."}`. The client calls `updateDraftPanel` on each `draftChunk` event, replacing or appending to the current draft content.
- Two implementation options exist — the implementer must choose one and document the choice:
  - **Option A — server-side detection:** The `handlePostTurnStreamHtml` `onChunk` callback tracks whether `---ARTEFACT-START---` has been seen in the accumulated buffer, and writes `{draftChunk: chunk}` events for chunks received after the start marker. Simpler; no client changes to the accumulation logic. Risk: `---ARTEFACT-START---` may be split across two chunks — the detection must handle this.
  - **Option B — client-side detection:** The client tracks the accumulated `streamText` and, after detecting `---ARTEFACT-START---`, extracts the partial artefact content and calls `updateDraftPanel` with the partial content on each chunk event. Server sends no new event type. Lower server complexity; all detection in the client-side template strings.
- Whichever option is chosen, the final `{done, artefactContent}` event continues to be sent and `updateDraftPanel` is called with the complete, clean artefact content — the final state must be identical to the current behaviour.
- The `stripArtefactBlock()` function in the chat bubble path is unaffected — chat bubble rendering and draft panel rendering are independent paths.
- D37 injectable adapter rule: if any new server-side injectable is introduced, the stub must throw.
- Zero new npm dependencies.

## Dependencies

- **Upstream:** None — this story is independently implementable from wusl.1, though they share the same streaming event loop and are likely to be implemented together.
- **Downstream:** None currently identified.

## Acceptance Criteria

**AC1:** Given a skill session turn where the model produces an artefact (response contains `---ARTEFACT-START---` ... `---ARTEFACT-END---`), when the model begins writing content after the `---ARTEFACT-START---` signal, then the Live Draft panel starts showing content before the turn completes — i.e. `updateDraftPanel` is called at least once with partial artefact content before `evt.done` is received.

**AC2:** Given artefact content is streaming into the Live Draft panel, when new content arrives, then the panel content is updated additively — existing content is preserved and new content is appended (the panel does not flicker or reset on each update).

**AC3:** Given the full artefact has been received and `evt.done` is sent with the complete `artefactContent`, when `updateDraftPanel` is called with the final content, then the Live Draft panel shows the complete, correctly-parsed artefact (identical to the current end-of-turn behaviour) — the final state is not degraded by the progressive updates.

**AC4:** Given a skill session turn where the model does NOT produce an artefact (no `---ARTEFACT-START---` signal), when the turn completes, then the Live Draft panel is not modified — the progressive draft logic does not corrupt the panel for non-artefact turns.

**AC5:** Given the `---ARTEFACT-START---` marker is split across two consecutive SSE chunks (e.g. one chunk ends with `---ARTEFACT-S` and the next begins with `TART---`), when the client processes both chunks, then the marker is correctly detected across the chunk boundary — no partial marker text leaks into the draft panel content.

**AC6:** Given the operator is on the journey chat page (not just a standalone skill session), when a model turn produces an artefact, then AC1–AC5 apply identically.

**AC7:** Given `npm test` is run, then all existing tests pass — no regressions to the current `updateDraftPanel`, `handlePostTurnStreamHtml`, or related test coverage.

**AC8:** Given the implementation option chosen (server-side Option A or client-side Option B), a decision record is written to `artefacts/2026-05-07-web-ui-streaming-live-draft/decisions.md` noting the option chosen and the rationale.

## Out of Scope

- Editing artefact content in the Live Draft panel during generation — the panel is view-only; edit/commit UI is post-generation only.
- Showing partial artefact content from a prior turn while the current turn is pending — only the active streaming turn feeds the progressive draft.
- Syntax highlighting or markdown rendering in the Live Draft panel during streaming — the current `escHtmlClient` + `white-space: pre-wrap` rendering is sufficient; rich rendering is a separate concern.
- Persisting the partial draft across browser close — in-memory only, matching existing session behaviour.

## NFRs

- **Performance:** Each `draftChunk` (or equivalent) DOM update must complete in under 16ms to maintain 60fps rendering — the update must not trigger a full panel layout reflow on every chunk.
- **Performance:** The chunk boundary detection logic (split-marker handling, AC5) must execute in O(1) per chunk — no re-scanning the full accumulated buffer on every event.
- **Security:** Partial artefact content is operator-produced markdown rendered via `escHtmlClient` — the existing sanitisation path must apply to progressive updates identically to the final update.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
