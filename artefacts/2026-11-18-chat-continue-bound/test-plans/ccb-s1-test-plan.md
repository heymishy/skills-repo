## Test Plan: The chat page stops sending hidden "continue" turns after a few, and shows the operator what it has

**Story reference:** artefacts/2026-11-18-chat-continue-bound/stories/ccb-s1-bound-hidden-continue-turns.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-ccb-s1-continue-bound.js`. It reuses the jsdom harness of `tests/check-icv-s1-ideate-canvas-turn2-render-fix.js`: the real `handleGetChatHtml` page, the real extracted client script, and a fetch stub that serves scripted server-sent-event replies in the real stream format.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No-question replies: at most 2 continues, then input and notice | - | 2 (T1a, T1b, jsdom with the real page script) | - | - | - | 🟢 |
| AC2 | Truncated replies: at most 5; a chain finishing in the cap is unchanged | - | 2 (T2a, T2b) | - | - | - | 🟢 |
| AC3 | An identical continue stops the chain | - | 1 (T3) | - | - | - | 🟢 |
| AC4 | The operator's message resets the count | - | 1 (T4) | - | - | - | 🟢 |
| AC5 | Question, done and ideate replies unchanged; existing tests pass | - | 3 (T5a to T5c) + existing suites | the four lpw-s5 specs | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| The notice's real look in a browser is not asserted (no CSS-layout AC) | AC1, AC3 | None needed | It is plain text in the thread; asserted by text only |

## Tests

All run the real page script in jsdom; a reply is scripted as `{ chunks, done, truncated }` and served in the stream format (`data: {"chunk":...}` then `data: {"done":...,"truncated":...}`), and a counter records how many stream requests the page made. Each test is red against the unbounded page.

- **T1a (AC1).** Every reply is "A statement with no question", not done, not truncated: after 3 requests the page makes no more (checked after a settle period), the send button is enabled, and the last reply text is in the thread.
- **T1b (AC1).** The notice text ("Stopped asking the model to continue ...") appears once in the thread.
- **T2a (AC2).** Every reply is truncated and different each time: exactly 6 requests (the first plus 5 continues), then the button is enabled and the notice appears.
- **T2b (AC2).** Two truncated replies then a done reply carrying an artefact: 3 requests, the artefact is shown, no notice.
- **T3 (AC3).** The second reply equals the first (same text, not done, not truncated): 2 requests only, notice shown (below the cap of 3).
- **T4 (AC4).** After the cap is hit, the test types a message and submits it: a new first request is made, and it can be followed by up to 2 continues again.
- **T5a (AC5).** A reply ending in "?" and not done: exactly 1 request, button enabled, no notice.
- **T5b (AC5).** A done reply: exactly 1 request, no notice.
- **T5c (AC5).** An ideate session with a statement reply: exactly 1 request (icv-s1's exemption), no notice.
- **Regression (AC5).** `check-icv-s1-ideate-canvas-turn2-render-fix`, `check-ltd-s1-truncation-detection` and every other test that reads the chat-page script pass unchanged; the four lpw-s5 browser specs pass.

## Out of scope for this plan

The server's truncation detection, the mock gateway, any change to ideate.
