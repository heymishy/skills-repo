## Test Plan: Structured diagnostic for a malformed canvas diagram marker

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s1-diagram-marker-diagnostic.md
**Epic reference:** artefacts/2026-08-29-diagram-validation-and-types/epics/diagram-validation-drift-and-sequence-type.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-29

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Invalid JSON in a marker emits a structured diagnostic SSE event | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Disallowed `type` value names itself and the allowlist | 2 tests | — | — | — | — | 🟢 |
| AC3 | A corrected retry (same-turn or next-turn) renders normally | 2 tests | — | — | — | — | 🟢 |
| AC4 | A second consecutive failure is terminal, distinct from AC3 | 1 test | 1 test | — | — | — | 🟢 |
| AC5 | Existing valid markers are unaffected (regression) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixture markers in setup

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A `---CANVAS-JSON:...---` marker string with deliberately malformed JSON | Synthetic | None | |
| AC2 | A marker with valid JSON, `type` set to a value not in `TYPE_ALLOW` | Synthetic | None | |
| AC3 | A prior failed marker plus a corrected follow-up marker for the same diagram | Synthetic | None | Both same-turn and next-turn setups needed |
| AC4 | Two consecutive failed markers for the same diagram | Synthetic | None | |
| AC5 | A valid marker of each of the 7 existing canvas types | Synthetic | None | Regression fixture set |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### markerWithInvalidJsonProducesStructuredDiagnostic

- **Verifies:** AC1
- **Precondition:** A `---CANVAS-JSON:...---` marker string with a JSON syntax error (e.g. a trailing comma or unclosed brace) is fed to the scan loop's parsing step.
- **Action:** Invoke the marker-scanning function directly with the malformed marker text.
- **Expected result:** The function returns (or the SSE write is captured as) a diagnostic object with a distinct event shape (not `chunk` or `canvasBlock`) naming the parse failure — not `null` with no signal.
- **Edge case:** No.

### disallowedTypeDiagnosticNamesTheValueAndAllowlist

- **Verifies:** AC2
- **Precondition:** A marker with valid JSON and `type: "not-a-real-type"`.
- **Action:** Parse the marker.
- **Expected result:** The diagnostic's message/fields include the literal string `"not-a-real-type"` and the full list of allowed types (`cluster-tree`, `table`, `text`, `data-model`, `system-architecture`, `program-design`, `drift-signal`, `sequence` — post-S5).
- **Edge case:** No.

### disallowedTypeDiagnosticDoesNotFireForAllowedTypes

- **Verifies:** AC2 (negative control)
- **Precondition:** A marker with `type: "table"` (an allowed type).
- **Action:** Parse the marker.
- **Expected result:** No disallowed-type diagnostic fires — proves the check is genuinely type-value-driven, not a hardcoded string match on the test fixture's own value.
- **Edge case:** Yes.

### sameTurnCorrectedMarkerRendersNormally

- **Verifies:** AC3 (same-turn path)
- **Precondition:** A malformed marker has already triggered a diagnostic within the current turn's stream, and the stream is still open (more chunks incoming).
- **Action:** Feed a corrected, valid marker for the same diagram type/title later in the same stream.
- **Expected result:** The corrected marker parses successfully and a normal `canvasBlock` SSE event fires — the earlier diagnostic does not block or suppress the later valid marker.
- **Edge case:** No.

### nextTurnCorrectedMarkerRendersNormally

- **Verifies:** AC3 (next-turn path)
- **Precondition:** A malformed marker triggered a diagnostic in a prior turn (stream already closed).
- **Action:** The following turn includes a corrected, valid marker for the same diagram.
- **Expected result:** The corrected marker parses and renders normally in the new turn — no residual failure state carried over.
- **Edge case:** No.

### secondConsecutiveFailureIsTerminalNotRetried

- **Verifies:** AC4
- **Precondition:** A malformed marker has already triggered one diagnostic (per AC1/AC3's retry).
- **Action:** Feed a SECOND malformed marker attempt for the same diagram.
- **Expected result:** A diagnostic still fires for the second failure (visibility is not lost), but no further automated retry signal or mechanism is triggered — the outcome is recorded/flagged as terminal, distinguishable from AC3's success-after-retry outcome.
- **Edge case:** Yes.

### existingValidMarkersUnaffectedAcrossAll7Types

- **Verifies:** AC5 (regression)
- **Precondition:** One valid marker fixture per existing canvas type (`cluster-tree`, `table`, `text`, `data-model`, `system-architecture`, `program-design`, `drift-signal`).
- **Action:** Parse each fixture through the updated scan loop.
- **Expected result:** All 7 parse and render exactly as before — no diagnostic fires, `canvasBlock` SSE events are identical in shape to pre-change behaviour.
- **Edge case:** No.

---

## Integration Tests

### malformedMarkerDiagnosticFlowsThroughSseScanLoop

- **Verifies:** AC1
- **Components involved:** `handlePostTurnStreamHtml`'s canvas-marker scan loop → `parseCanvasBlock` → the SSE `res.write` call
- **Precondition:** A live (simulated) turn stream containing a malformed marker mid-chunk.
- **Action:** Drive a full simulated turn stream through the handler with the malformed marker embedded.
- **Expected result:** The diagnostic SSE event is observed in the captured `res.write` calls, in the correct position in the stream relative to surrounding valid content — proving the diagnostic flows through the real dispatch path, not a mocked shortcut.

### terminalFailureAfterSecondAttemptEndToEnd

- **Verifies:** AC4
- **Components involved:** Same as above, across two consecutive marker attempts within one simulated turn/session.
- **Precondition:** First malformed marker already processed (diagnostic fired).
- **Action:** Process a second malformed marker for the same diagram within the same simulated session.
- **Expected result:** The terminal-failure signal is observed and is distinguishable in the captured output from the first (retriable) failure's diagnostic.

---

## NFR Tests

### diagnosticGenerationAddsNoModelCall

- **NFR addressed:** Performance
- **Measurement method:** Assert the model/executor mock is called exactly the same number of times with and without a malformed marker present in the turn — zero additional calls attributable to diagnostic generation.
- **Pass threshold:** Zero additional model/executor calls.
- **Tool:** Node test runner, call-count spy.

### diagnosticTextIsEscapedBeforeSsePayload

- **NFR addressed:** Security
- **Measurement method:** Feed a malformed marker containing HTML/script-like characters in its raw text; assert the diagnostic's SSE payload has those characters escaped, not passed through raw.
- **Pass threshold:** No raw `<`/`>`/`&` characters from the malformed input appear unescaped in the diagnostic payload.
- **Tool:** Node test runner, string assertion.

### diagnosticEventIsLoggable

- **NFR addressed:** Audit
- **Measurement method:** Assert a log/audit hook (matching this repo's existing injectable-logger convention) is invoked with the diagnostic's key fields (marker type attempted, failure reason) when a malformed marker is processed.
- **Pass threshold:** Log call observed with the expected fields present.
- **Tool:** Node test runner, stubbed logger.

---

## Out of Scope for This Test Plan

- Invalid mermaid *syntax* inside otherwise-valid marker content — covered by S2's own test plan.
- Real-browser rendering of the diagnostic — this story's scope is the server-side SSE emission only; the client-side visual presentation (if any) belongs to S2's scope (mermaid render failures) since S1's failure mode occurs before any client-side render is attempted.

---

## Test Gaps and Risks

None — all 5 ACs have full unit/integration coverage, and the E2E/browser-layout scan (Step 3a) found no layout-dependent behaviour in this story.
