## Story: Chat UX improvements — scroll-to-bottom, live draft panel, remove question counter

**Epic reference:** artefacts/2026-05-05-web-ui-model-first-chat/epics/mfc-epic-1.md
**Discovery reference:** artefacts/2026-05-05-web-ui-model-first-chat/discovery.md
**Benefit-metric reference:** artefacts/2026-05-05-web-ui-model-first-chat/benefit-metric.md

## User Story

As a **pipeline operator using the web UI skill chat session**,
I want the **chat to scroll to the latest message, update the draft panel live, and not show a meaningless question counter**,
So that **the session flow matches IDE-native chat conventions and the artefact preview is visible without waiting for a page transition**.

## Benefit Linkage

**Metric moved:** M1 — operator session completion rate; usability friction reduction.
**How:** Scroll-to-top on every turn and a blank live-draft panel both cause operators to lose context mid-session. Fixing these removes friction that causes session abandonment.

## Acceptance Criteria

**AC1:** Given a new model response arrives via the turn API, when the client receives it, then the `#chat-messages` area scrolls to the bottom — the latest assistant bubble is visible without manual scrolling.

**AC2:** Given the user submits an answer, when the form submits, then: (a) the user's message appears immediately as a chat bubble in `#chat-messages` without a page reload, (b) a typing indicator appears below it, (c) the textarea is cleared and the submit button is disabled, and (d) when the model response arrives, the indicator is replaced by the assistant bubble and the button is re-enabled.

**AC3:** Given the model response contains `---ARTEFACT-START---` content, when the turn API returns `done: true` with `artefactContent`, then the right-hand draft panel (element with `id="draft-content"`) is updated with the artefact text — without a page reload — and a "Review & save artefact" link appears in the footer.

**AC4:** Given `renderChat` is called by the server, when the HTML is rendered, then the header does NOT contain the text "questions answered" and does NOT contain a question count progress indicator.

**AC5:** Given `npm test` is run after this story's implementation is merged, then 0 tests fail. The mfc.2 test suite passes in full.

## Out of Scope

- True streaming (SSE / chunked transfer encoding) — deferred; typing indicator is sufficient for this story.
- Persisting session turns across server restarts.
- Changing the artefact format or the `---ARTEFACT-START---` marker protocol.
