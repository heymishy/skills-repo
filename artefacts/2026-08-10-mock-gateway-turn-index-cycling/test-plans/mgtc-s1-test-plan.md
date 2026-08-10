## Test Plan: The mock LLM gateway returns the identical response on every turn, blocking multi-turn skill progression in mock mode

**Story reference:** artefacts/2026-08-10-mock-gateway-turn-index-cycling/stories/mgtc-s1-turn-index-aware-mock-responses.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | responses[K] returned for turn K < N | 1 test | — | — | — | — | 🟢 |
| AC2 | Last entry repeats past the scripted sequence | 1 test | — | — | — | — | 🟢 |
| AC3 | Single-response fixtures unchanged, byte-identical | 1 test | — | — | — | — | 🟢 |
| AC4 | Turn index reflects history.length across a 3-turn sequence | — | 2 tests | — | — | — | 🟢 |
| AC5 | Mock-disabled path completely unchanged | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All ACs are deterministic function-boundary assertions (array indexing, parameter threading) — no CSS/DOM/layout dependency.

---

## Test Data Strategy

**Source:** Hand-authored fixture objects matching `_defaultMockGatewayClient.getMockResponse`'s existing and new (`responses` array) input shapes; hand-authored `history` arrays of varying length for AC4.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fixture with `responses: [a, b, c]` | Hand-authored | None | |
| AC2 | Same fixture, turnIndex ≥ 3 | Hand-authored | None | |
| AC3 | Existing single-`response` fixture shape (reuse a real one, e.g. `ideate.success.json`) | Existing fixture | None | Must assert byte-identical output to a pre-change capture |
| AC4 | 3-entry `history` array, spy on `getMockResponse` | Hand-authored | None | |
| AC5 | `isMockGatewayEnabled()` stubbed false | Hand-authored | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### getMockResponse_turnIndexWithinScriptedSequence_returnsThatIndexEntry (AC1)

- **Verifies:** AC1
- **Precondition:** A fixture (hand-authored, written to a scratch fixture dir or injected via a test-only adapter) with `responses: [{response:'A'}, {response:'B'}, {response:'C'}]`.
- **Action:** `getMockResponse(stage, model, scenarioName, 1)`.
- **Expected result:** Returned `text` is `'B'` — the index-1 entry, not the first or last.

### getMockResponse_turnIndexBeyondScriptedSequence_returnsLastEntry (AC2)

- **Verifies:** AC2
- **Precondition:** Same 3-entry fixture.
- **Action:** `getMockResponse(stage, model, scenarioName, 7)`.
- **Expected result:** Returned `text` is `'C'` (the last entry) — no throw, no undefined.

### getMockResponse_singleResponseFixture_unchangedRegardlessOfTurnIndex (AC3)

- **Verifies:** AC3
- **Precondition:** A real existing fixture file (e.g. `ideate.success.json`, no `responses` array).
- **Action:** Call `getMockResponse(stage, model, scenarioName, 0)` and again with `turnIndex=5`.
- **Expected result:** Both calls return byte-identical output to each other AND to a captured pre-change baseline call with no turnIndex argument at all — confirms zero regression for every untouched fixture.

### skillTurnExecutor_mockDisabled_behaviourUnchanged (AC5)

- **Verifies:** AC5
- **Precondition:** `isMockGatewayEnabled()` stubbed to return `false`; `meta.stage` set.
- **Action:** `skillTurnExecutor(systemPrompt, history, currentInput, token, meta)`.
- **Expected result:** Routes to the real-provider branch (`_callAnthropic`/`_callCopilot`) exactly as before this story — `getMockResponse` is never called.

## Integration Tests

### skillTurnExecutor_threeTurnHistory_passesCorrectTurnIndexEachCall (AC4)

- **Verifies:** AC4
- **Precondition:** Mock gateway enabled; a spy replacing `mockLlmGateway.getMockResponse` that records its `turnIndex` argument.
- **Action:** Call `skillTurnExecutor` three times in sequence, simulating a growing `history` array (`history.length` = 0, 1, 2 respectively, matching a real 3-turn conversation).
- **Expected result:** The spy recorded turnIndex arguments `[0, 1, 2]` in that order — exactly `history.length` at each call.

### skillTurnExecutorStream_threeTurnHistory_passesCorrectTurnIndexEachCall (AC4)

- **Verifies:** AC4
- **Precondition:** Same as above, using `skillTurnExecutorStream` instead.
- **Action:** Same 3-call simulated sequence.
- **Expected result:** Same `[0, 1, 2]` turnIndex sequence recorded — confirms both the streaming and non-streaming executor paths thread the index identically.

---

## NFR Tests

None beyond the ACs above.

---

## Out of Scope for This Test Plan

- Real multi-turn `responses` fixture content for `/ideate` — that's `mds-s1`'s (or a follow-up's) test plan, not this one.
- The clarify/estimate side-trip reachability hypothesis — not independently tested here; flagged in the story as needing its own confirmation during implementation.

---

## Test Gaps and Risks

None identified as blocking.
