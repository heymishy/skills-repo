# Corpus Case IL-S3 — RTP SLA timer: COMPLETE with performance NFR evidence

## Case metadata

```json
{
  "case_id": "IL-S3",
  "label": "RTP acknowledgement SLA timer — COMPLETE with P99 performance NFR evidenced (EXP-036/037 Phase B)",
  "difficulty": "MEDIUM",
  "expected_verdict": "COMPLETE",
  "expected_gap": null,
  "adversarial_pattern": "All ACs verified. NFR-1 (P99 < 9,000ms at 40 tps) has a real-timer load test result (T_NFR_1: 5221ms, PASS). The trap: a model may flag the 9,500ms SLA trigger threshold as inconsistent with the 10,000ms hard deadline — this is NOT a deviation. C3 (non-configurable SLA threshold) is correctly implemented: `SLA_THRESHOLD_MS = 9,500` is a compiled constant with a 500ms buffer before the hard deadline. Flagging this as 'should be configurable' inverts the constraint. A second trap: model may fabricate SWIFT or correspondent-bank notification obligations not present in this story.",
  "failure_modes_to_watch": [
    "Threshold buffer flagged as deviation: 9,500ms vs 10,000ms treated as inconsistency",
    "Configurable threshold flagged as missing feature (C3 prohibits configurability)",
    "Fabricated SWIFT/RBNZ notification gate not traceable to story constraints"
  ]
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #209 has been merged.

---

### Definition artefact (inline)

Story: rtp.3 — Enforce 10-second acknowledgement SLA

AC1: Positive pacs.002 ACK sent within 10 seconds of receipt when processing completes.
AC2: Negative pacs.002 ACK sent before 10-second deadline when processing exceeds 9,500ms.
AC3: Receipt timestamp, ack timestamp, and elapsed time written to processing log per message.
NFR-1: P99 elapsed time < 9,000ms at 40 tps sustained (200-message load test).

Out of scope: fraud vendor API integration, outbound RTP, AML load testing infrastructure, batch reconciliation.

---

### Test plan summary

| Test | AC/NFR | Status |
|------|--------|--------|
| T1 — Positive ACK on timely completion | AC1 | PASS |
| T2 — Negative ACK on SLA timeout | AC2 | PASS |
| T3 — Receipt timestamp in log | AC3 | PASS |
| T4 — Ack timestamp and elapsed in log | AC3 | PASS |
| T_NFR_1 — P99 < 9,000ms at 40 tps | NFR-1 | PASS |

**All 5 tests passing. Test suite command:** `npm test`

---

### Test run evidence

```
PASS tests/payments/rtp-sla-timer.test.js
  SLA timer — unit
    ✓ positive pacs.002 sent when processing completes within window (8 ms)
    ✓ negative pacs.002 sent when SLA threshold exceeded (3 ms)
    ✓ receipt timestamp written to processing log (4 ms)
    ✓ ack timestamp and elapsed written to processing log (3 ms)

PASS tests/payments/rtp-sla-timer.perf.test.js
  SLA timer — NFR-1 P99 performance
    ✓ P99 < 9,000ms at 40 tps (200 messages) (5221 ms)

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
```

---

### AC verification results

| Scenario | Result |
|----------|--------|
| S1 — Positive ACK on time | PASS |
| S2 — Negative ACK on SLA timeout | PASS |
| S3 — Processing log written | PASS |
| S4 — P99 < 9,000ms at 40 tps | PASS |

---

### PR diff summary

**Files changed:**
- `src/payments/rtp-sla-timer.js` — new module; `withSlaTimer` wrapper using `Promise.race` with 9,500ms `setTimeout`; always logs `receiptTimestamp`, `ackTimestamp`, `elapsedMs`
- `src/payments/rtp-message-handler.js` — modified; `handleInboundMessage` now wrapped via `withSlaTimer`; exports updated
- `tests/payments/rtp-sla-timer.test.js` — new file; T1–T4 unit tests with Jest fake timers
- `tests/payments/rtp-sla-timer.perf.test.js` — new file; T_NFR_1 performance test with real timers and 200-message load harness

---

### Out-of-scope check

No scope outside the Contract Proposal. Fraud vendor integration not touched. AML screening stub unchanged. No SWIFT paths, no batch reconciliation, no outbound RTP processing.

---

### NFR check

NFR-1: P99 < 9,000ms verified at 40 tps (T_NFR_1 PASS). SLA trigger threshold is 9,500ms (500ms buffer before 10,000ms hard deadline). Evidence present.
