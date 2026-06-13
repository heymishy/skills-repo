# IL-S3 Test Plan — rtp.3 Acknowledgement SLA

**Framework:** Jest (`npm test`)
**Test data strategy:** Synthetic — mocked ISO 20022 message objects; Jest fake timers for SLA unit tests; real timers for NFR-1 performance test

---

## AC coverage table

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 — positive ACK sent on time | T1: processing completes in 100ms → positive pacs.002 sent | Full | Jest fake timers |
| AC2 — negative ACK on SLA exceeded | T2: processing stalls past 9,500ms → negative pacs.002 sent before 10,000ms | Full | Jest fake timers |
| AC3 — processing log written | T3: receipt timestamp logged; T4: ack timestamp and elapsed logged | Full | — |
| NFR-1 — P99 < 9,000ms at 40 tps | T_NFR_1: 200 messages at 40 tps; measure P99 elapsed; assert < 9,000ms | Full (integration) | Real timers; integration environment |

No test plan gaps.

---

## Unit tests (T1–T4 — Jest fake timers)

### T1 — Positive ACK sent when processing completes within window

**AC:** AC1
**Precondition:** Processing mock completes in 100ms; fake timers enabled
**Expected:** `schemeBridge.sendAck` called with `{ type: 'pacs.002', status: 'ACCEPTED' }` within 10,000ms

### T2 — Negative ACK sent when SLA threshold exceeded

**AC:** AC2
**Precondition:** Processing mock stalls (never resolves); fake timers advance to 9,600ms
**Expected:** `schemeBridge.sendAck` called with `{ type: 'pacs.002', status: 'REJECTED', reason: 'SCHEME_SLA_EXCEEDED' }` before fake timer reaches 10,000ms

### T3 — Receipt timestamp written to processing log

**AC:** AC3
**Expected:** Processing log entry contains `receiptTimestamp` within 5ms of `Date.now()` at call time

### T4 — Ack timestamp and elapsed written to processing log

**AC:** AC3
**Expected:** Processing log entry contains `ackTimestamp` and `elapsedMs` (positive integer) after ACK dispatch

---

## Integration / performance test (T_NFR_1 — real timers)

### T_NFR_1 — P99 < 9,000ms at 40 tps sustained

**NFR:** NFR-1
**Method:** Send 200 synthetic `pacs.008` messages at 40 messages/second (one per 25ms) using a test harness. Record elapsed time from receipt to ACK dispatch for each message. Calculate P99.
**Expected:** P99 elapsed time < 9,000ms (buffer before 9,500ms trigger threshold)
**Environment:** Integration environment with real async I/O (not fake timers)
**Note:** This test requires the full async pipeline including the AML stub. Run time ~5 seconds.

---

## Gap table

No gaps.
