## Story: Stream model response tokens into the chat bubble in real time

**Epic reference:** artefacts/2026-05-07-web-ui-streaming-live-draft/stories/wusl-1-chat-streaming.md (self)
**Discovery reference:** artefacts/2026-05-07-web-ui-streaming-live-draft/discovery.md
**Benefit-metric reference:** artefacts/2026-05-07-web-ui-streaming-live-draft/benefit-metric.md (pending)

## User Story

As an **operator using the web UI skill session chat**,
I want to see the model's response text appearing token by token in the chat bubble as it is generated,
So that I have immediate live feedback that the model is working and can follow its reasoning in real time — matching the experience I get in VS Code Copilot Chat.

## Benefit Linkage

**Metric moved:** M1 — Outer loop task completion rate via web UI (first-session completion without dropping back to VS Code)
**How:** The frozen "thinking" state during a 20–60 second model turn is the primary source of "is this broken?" confusion that causes operators to abandon the web UI session. Streaming tokens immediately into the chat bubble eliminates the dead-air period and replaces perceived unresponsiveness with visible progress.

## Architecture Constraints

- The `turn-stream` SSE endpoint (`/api/skills/:name/sessions/:id/turn-stream`) already exists and is wired. The client already uses it via `STREAM_URL`. This story targets two gaps in the end-to-end flow: (a) the Anthropic provider stub sends the full response in one `onChunk` call rather than streaming; (b) the visual transition from the thinking spinner to streaming text has not been validated as smooth.
- ADR-019 (dynamic content is per-turn substitution only): chunk events are ephemeral display state — they are not stored in session history. Only the completed `fullText` is added to `session.turns`.
- Zero new npm dependencies.
- The `stripArtefactBlock()` function must continue to run on the accumulated `streamText` before each render — artefact signal markers must never appear in the chat bubble regardless of which provider is in use.
- D37 injectable adapter rule applies to any new or changed adapter (stub must throw, not return empty).

## Dependencies

- **Upstream:** None — the `turn-stream` endpoint and `_skillTurnExecutorStream` injectable adapter exist from mfc.1/mfc.3.
- **Downstream:** wusl.2 (progressive live draft) — depends on the same streaming event loop; both stories can be implemented together but are independently testable.

## Acceptance Criteria

**AC1:** Given a skill session chat page is open and the operator submits an answer, when the model starts generating a response, then the "thinking" spinner disappears and the first token of the model's response appears in the chat bubble within 2 seconds of the POST request completing.

**AC2:** Given the Copilot provider is active, when the model is generating a response, then the chat bubble text updates incrementally — multiple distinct render frames occur before the turn completes (i.e. the text does not jump from empty to fully populated in a single DOM update).

**AC3:** Given the Anthropic provider is active (or any provider whose `skillTurnExecutorStream` falls back to single-chunk), when the model response arrives, then the chat bubble shows a visible animated loading indicator (dots, pulse, or equivalent) from the moment the turn is submitted until the full text appears, so the operator is never looking at a static blank or spinner with no motion.

**AC4:** Given any provider, when the turn completes and `evt.done` is received, then the full response text is rendered in the chat bubble identically to the current non-streaming path — no truncation, no missing content.

**AC5:** Given the model response contains an `---ARTEFACT-START---` / `---ARTEFACT-END---` block, when the response streams into the chat bubble, then the artefact markers and artefact body are stripped from the chat bubble text at every render frame — they never appear in the chat bubble at any point during streaming.

**AC6:** Given the operator is on the journey chat page (not just a standalone skill session page), when a model turn streams, then AC1–AC5 apply identically — the journey and standalone skill chat use the same rendering path.

**AC7:** Given the streaming endpoint returns an error event (`evt.error`), when the client receives it, then the error message is rendered in the chat bubble and the submit button is re-enabled — error handling is not regressed by streaming changes.

**AC8:** Given `npm test` is run, then all existing streaming and chat tests pass — no regressions.

## Out of Scope

- Implementing native Anthropic streaming API (SSE from Anthropic's API) — the fallback single-chunk behaviour is acceptable; AC3 covers the UX gap without requiring provider-level work.
- Showing intermediate "reasoning" or thinking tokens from the model (e.g. Claude extended thinking) — this is a future enhancement.
- Streaming for the legacy Q&A (scrape-first) skill session flow — only the mfc.1 model-first chat path (`handlePostTurnStreamHtml`) is in scope.
- Visual scroll position during streaming — `scrollToBottom()` already handles this and is not a deliverable of this story.

## NFRs

- **Performance:** First visible token in the chat bubble must appear within 2 seconds of the POST to `turn-stream` completing — not 2 seconds from submit (network latency to the model is excluded).
- **Performance:** Each chunk render must not cause layout thrash — `textNode.innerHTML` updates are acceptable; no full DOM reflow on every chunk.
- **Accessibility:** The animated loading indicator (AC3) must use a CSS animation, not a JavaScript timer, to avoid blocking the event loop during model generation.
- **Security:** Chunk content is rendered via `lightMd()` + `innerHTML` — the existing sanitisation path is unchanged; this story must not bypass or weaken it.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
