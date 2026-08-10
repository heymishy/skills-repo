## Definition of Ready: mgtc-s1 — The mock LLM gateway returns the identical response on every turn, blocking multi-turn skill progression in mock mode

**Story:** artefacts/2026-08-10-mock-gateway-turn-index-cycling/stories/mgtc-s1-turn-index-aware-mock-responses.md
**Review artefact:** artefacts/2026-08-10-mock-gateway-turn-index-cycling/review/mgtc-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-mock-gateway-turn-index-cycling/test-plans/mgtc-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/modules/mock-llm-gateway.js` — `_defaultMockGatewayClient.getMockResponse` (~line 230): accept an optional `turnIndex` parameter; when the loaded fixture has a `responses` array, return `responses[Math.min(turnIndex || 0, responses.length - 1)]`'s content; otherwise fall back to today's single-`response` behaviour unchanged. `getMockResponse` (~line 265, the public lookup) and `setMockGatewayClient`'s documented contract (~line 152): thread the new optional `turnIndex` parameter through.
- `src/modules/skill-turn-executor.js` — `_resolveMockGatewayResponse` (~line 569) and `_streamMockGatewayResponse` (~line 581): accept a `turnIndex` parameter and pass it to `getMockResponse`. `skillTurnExecutor` (~line 611) and `skillTurnExecutorStream` (~line 652): compute `turnIndex = (history || []).length` and pass it to the respective mock-resolution helper.
- New test file: `tests/check-mgtc-s1-turn-index-cycling.js`.

**Files explicitly out of scope (must not be touched):**
- `src/web-ui/routes/journey.js`'s `_mockScenarioForStage` and `src/web-ui/routes/skills.js`'s `scenarioName` resolution — reused as-is; turnIndex is computed entirely within `skill-turn-executor.js` from the `history` parameter already passed to it.
- Every existing fixture file under `tests/e2e/fixtures/llm-gateway/` — none are modified; the `responses` array is a new, opt-in field only.
- `_callAnthropic`/`_callAnthropicStream`/`_callCopilot`/`_callCopilotStream` (the real-provider branches) — untouched.

### Architecture Constraints

No new architectural decision — additive, backward-compatible fixture-format extension and parameter threading through an existing, already-in-scope value (`history`). No ADR required.

### Human oversight

**Medium** — touches a shared execution path (`skill-turn-executor.js`) used by every skill turn in the app, both mocked and real. The real-provider branches and the single-response fixture path must remain byte-identical to today; care needed in review to confirm the backward-compatibility ACs (AC3, AC5) are genuinely exercised, not just asserted.

### Coding Agent Instructions

1. In `mock-llm-gateway.js`'s `_defaultMockGatewayClient.getMockResponse`, add a 4th parameter `turnIndex` (default `0` if omitted). When `fixture.responses` is an array, select `fixture.responses[Math.min(turnIndex, fixture.responses.length - 1)]` and build the return object from that entry's `response`/`usage`/`model` fields (same shape as today, just sourced from the selected array entry instead of the fixture root). When `fixture.responses` is absent, behave exactly as today (use `fixture.response` directly, `turnIndex` has no effect).
2. Thread `turnIndex` through the public `getMockResponse(stage, model, scenarioName, turnIndex)` function (~line 265) to the adapter call.
3. In `skill-turn-executor.js`, add `turnIndex` as a parameter to `_resolveMockGatewayResponse` and `_streamMockGatewayResponse`, passed through to `mockLlmGateway.getMockResponse(...)`.
4. In `skillTurnExecutor` and `skillTurnExecutorStream`, compute `const turnIndex = (history || []).length;` right before the mock-routing branch and pass it into the respective helper call.
5. Write the 4 unit tests + 2 integration tests per the test plan.
6. Run the new test file plus the existing `check-bri-s3.1-mock-llm-gateway*.js` suites (or equivalent — whichever currently cover `mock-llm-gateway.js`/`skill-turn-executor.js`) unmodified — zero regression, specifically confirming every existing single-`response` fixture still resolves identically and the real-provider branches are untouched.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified (none — pure function-boundary assertions)

**PROCEED: Yes**
