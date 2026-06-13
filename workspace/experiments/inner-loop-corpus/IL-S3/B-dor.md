# IL-S3 DoR Artefact — rtp.3

**Feature:** 2026-09-01-rtp-inbound-integration
**Story:** rtp.3 — Enforce 10-second acknowledgement SLA
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (scheme compliance story — tech lead awareness required)
**Hard blocks:** 13/13 passed
**Warnings:** W1 acknowledged (NFR-1 load test at full 40,000 tph requires production-like infrastructure not yet available; risk accepted — integration environment test at 40 tps is the pre-production evidence; full load test is a go-live prerequisite tracked at feature level)

---

## Contract Proposal

**What will be built:**
An SLA timer wrapper around the existing `handleInboundMessage(message)` function in `src/payments/rtp-message-handler.js`. The wrapper:
- Records receipt timestamp on message arrival
- Starts a `setTimeout` for 9,500ms (the SLA trigger threshold)
- On timeout: sends `pacs.002` negative ACK to scheme and logs `SCHEME_SLA_EXCEEDED`
- On normal completion: sends `pacs.002` positive ACK and logs elapsed time
- Always logs receipt timestamp, ack timestamp, and elapsed time (AC3)

**What will NOT be built:**
- Full fraud vendor API integration
- Outbound RTP payment processing
- AML load testing infrastructure
- Batch reconciliation

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — ACK sent within 10 seconds | Unit test: mock processing to complete in 100ms; assert positive pacs.002 sent within 10s | Unit |
| AC2 — SLA exceeded → negative ACK | Unit test: mock processing to stall past 9,500ms; assert negative pacs.002 sent before 10,000ms | Unit (with Jest fake timers) |
| AC3 — Processing log written | Unit test: assert log entry written with receipt timestamp, ack timestamp, elapsed time | Unit |
| NFR-1 — P99 at 40 tps | Performance test: send 200 messages at 40 tps concurrently; measure P99 elapsed from receipt to ACK dispatch | Integration (Jest + actual timer) |

**Estimated touch points:**
- Modify: `src/payments/rtp-message-handler.js` (wrap with SLA timer)
- Create: `src/payments/rtp-sla-timer.js` (the timer module)
- Create: `tests/payments/rtp-sla-timer.test.js`

---

## Coding Agent Instructions

**Goal:** Wrap the existing `handleInboundMessage` with a 9,500ms SLA timer that sends negative ACK on timeout and positive ACK on completion. Always log receipt/ack timestamps.

**Branch:** `feature/rtp.3`
**Test command:** `npm test`
**Oversight:** Medium

**Architecture Constraint (C3 — SCHEME RULE):** The 10-second SLA is a HARD scheme requirement. The timer (9,500ms threshold) must fire a negative ACK before the 10,000ms hard deadline. This is not a warning — it is a scheme penalty event if missed.

**NFR-1:** Performance test at 40 tps (200 messages) must show P99 < 9,000ms (with 500ms buffer before the trigger threshold).

**Files to touch:**
- Modify: `src/payments/rtp-message-handler.js`
- Create: `src/payments/rtp-sla-timer.js`
- Create: `tests/payments/rtp-sla-timer.test.js`

**Out of scope:** Fraud vendor API, outbound RTP, AML load test.
