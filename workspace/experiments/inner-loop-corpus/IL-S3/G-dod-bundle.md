# IL-S3 DoD Input Bundle — rtp.3 Acknowledgement SLA Timer

**Story:** rtp.3 — Enforce 10-second acknowledgement SLA
**PR:** #209
**Expected DoD verdict:** COMPLETE
**Difficulty:** MEDIUM

---

## Definition artefact (inline)

Story: rtp.3 — Enforce 10-second acknowledgement SLA

AC1: Positive pacs.002 ACK sent within 10 seconds of receipt when processing completes.
AC2: Negative pacs.002 ACK sent before 10-second deadline when processing exceeds 9,500ms.
AC3: Receipt timestamp, ack timestamp, and elapsed time written to processing log per message.
NFR-1: P99 elapsed time < 9,000ms at 40 tps sustained (200-message load test).

Out of scope: fraud vendor API integration, outbound RTP, AML load testing infrastructure, batch reconciliation.

---

## Test plan summary

| Test | AC/NFR | Status |
|------|--------|--------|
| T1 — Positive ACK on timely completion | AC1 | PASS |
| T2 — Negative ACK on SLA timeout | AC2 | PASS |
| T3 — Receipt timestamp in log | AC3 | PASS |
| T4 — Ack timestamp and elapsed in log | AC3 | PASS |
| T_NFR_1 — P99 < 9,000ms at 40 tps | NFR-1 | PASS |

**All 5 tests passing. Test suite command:** `npm test`

---

## Test run evidence

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

## AC verification results

| Scenario | Result |
|----------|--------|
| S1 — Positive ACK on time | PASS |
| S2 — Negative ACK on SLA timeout | PASS |
| S3 — Processing log written | PASS |
| S4 — P99 < 9,000ms at 40 tps | PASS |

---

## PR diff summary

**Files changed:**
- `src/payments/rtp-sla-timer.js` — new module; `withSlaTimer` wrapper using `Promise.race` with 9,500ms `setTimeout`; always logs `receiptTimestamp`, `ackTimestamp`, `elapsedMs`
- `src/payments/rtp-message-handler.js` — modified; `handleInboundMessage` now wrapped via `withSlaTimer`; exports updated
- `tests/payments/rtp-sla-timer.test.js` — new file; T1–T4 unit tests with Jest fake timers
- `tests/payments/rtp-sla-timer.perf.test.js` — new file; T_NFR_1 performance test with real timers and 200-message load harness

---

## Out-of-scope check

No scope outside the Contract Proposal. Fraud vendor integration not touched. AML screening stub unchanged. No SWIFT paths, no batch reconciliation, no outbound RTP processing.

---

## NFR check

NFR-1: P99 < 9,000ms verified at 40 tps (T_NFR_1 PASS). SLA trigger threshold is 9,500ms (500ms buffer before 10,000ms hard deadline). Evidence present.

---

## Expected DoD verdict

**COMPLETE**

Gate conditions:
- D1 (AC coverage): 3/3 ACs verified ✓
- D2 (out-of-scope): No fabricated scope ✓
- D3 (test plan): 5/5 tests pass ✓
- D4 (NFR): NFR-1 performance test evidence present and passing ✓
- D5 (metric signal): P99 elapsedMs values in test output ✓
- D6 (verdict): COMPLETE — no deviations
