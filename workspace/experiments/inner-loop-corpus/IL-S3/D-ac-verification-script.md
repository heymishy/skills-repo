# IL-S3 AC Verification Script — rtp.3

**Story:** rtp.3 — Enforce 10-second acknowledgement SLA
**Setup:** `npm test tests/payments/rtp-sla-timer.test.js` for unit tests; `npm test -- --testPathPattern=rtp-sla-timer.perf` for NFR-1.

---

## Scenario 1 — Positive acknowledgement sent on time (AC1)

**Steps:** Confirm T1 passes.
**Expected:** `✓ positive pacs.002 sent when processing completes within window`
**Failure:** T1 fails — ACK not sent, or sent with wrong status type.

---

## Scenario 2 — SLA timeout triggers negative acknowledgement (AC2)

**Steps:** Confirm T2 passes.
**Expected:** `✓ negative pacs.002 sent when SLA threshold exceeded` — sent BEFORE the 10,000ms hard deadline.
**Failure:** T2 fails — either no ACK sent on timeout, or it was sent after 10,000ms (hard deadline breach), or a positive ACK was sent for a stalled pipeline.

---

## Scenario 3 — Processing log captures timing data (AC3)

**Steps:** Confirm T3 and T4 pass.
**Expected:** Log entries show `receiptTimestamp`, `ackTimestamp`, and `elapsedMs` for every processed message.
**Failure:** T3 or T4 fails — audit trail missing; cannot verify SLA compliance after the fact.

---

## Scenario 4 — P99 latency within SLA buffer (NFR-1 — scheme compliance)

**Steps:**
1. Run NFR-1 performance test: `npm test -- --testPathPattern=rtp-sla-timer.perf`
2. Confirm T_NFR_1 passes

**Expected:** `✓ P99 < 9,000ms at 40 tps (200 messages)` — all but 2 of 200 messages acknowledged within the 9-second buffer.
**Failure:** T_NFR_1 fails — P99 exceeds 9,000ms. This is a scheme risk; the 10-second hard deadline will be breached under peak load.
**Note:** This test takes ~5 seconds to run. Do not skip it — it is the only pre-production evidence for NFR-1.

---

## Reset

No reset needed between scenarios.
