# IL-S3 — RTP Acknowledgement SLA (MEDIUM difficulty)

**Feature:** 2026-09-01-rtp-inbound-integration
**Story:** rtp.3
**Difficulty:** MEDIUM
**Expected Phase A score:** ~0.85

## Operator input

> You are running /implementation-plan on the following story in eval mode.
> Your FIRST line of output must be exactly: Save path: artefacts/2026-09-01-rtp-inbound-integration/plans/rtp.3-plan.md

DoR artefact:

# IL-S3 DoR Artefact — rtp.3

**Feature:** 2026-09-01-rtp-inbound-integration
**Story:** rtp.3 — Enforce 10-second acknowledgement SLA
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (scheme compliance story — tech lead awareness required)
**Warnings:** W1 acknowledged (NFR-1 load test at full 40,000 tph requires production-like infrastructure; risk accepted — integration environment test at 40 tps is the pre-production evidence)

### Contract Proposal

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
| AC1 — ACK sent within 10 seconds | Unit test: mock processing completes in 100ms; assert positive pacs.002 sent | Unit (fake timers) |
| AC2 — SLA exceeded → negative ACK | Unit test: mock processing stalls past 9,500ms; assert negative pacs.002 sent before 10,000ms | Unit (fake timers) |
| AC3 — Processing log written | Unit test: assert log entry with receipt timestamp, ack timestamp, elapsed time | Unit |
| NFR-1 — P99 at 40 tps | Performance test: 200 messages at 40 tps; measure P99 elapsed; assert < 9,000ms | Integration (real timers) |

**Estimated touch points:**
- Modify: `src/payments/rtp-message-handler.js` (wrap with SLA timer)
- Create: `src/payments/rtp-sla-timer.js` (the timer module)
- Create: `tests/payments/rtp-sla-timer.test.js`

### Coding Agent Instructions

**Goal:** Wrap the existing `handleInboundMessage` with a 9,500ms SLA timer. Negative ACK on timeout, positive ACK on completion. Always log receipt/ack timestamps.

**Branch:** `feature/rtp.3`
**Test command:** `npm test`
**Oversight:** Medium

**Architecture Constraint (C3 — SCHEME RULE):** The 10-second SLA is a HARD scheme requirement. The timer (9,500ms threshold) must fire a negative ACK before the 10,000ms hard deadline. Scheme penalties apply if missed.

**NFR-1:** Performance test at 40 tps (200 messages) must show P99 < 9,000ms.

**Files to touch:**
- Modify: `src/payments/rtp-message-handler.js`
- Create: `src/payments/rtp-sla-timer.js`
- Create: `tests/payments/rtp-sla-timer.test.js`

**Out of scope:** Fraud vendor API, outbound RTP, AML load test, batch reconciliation.

---

Definition artefact:

# IL-S3 Definition Artefact — RTP Acknowledgement Timer

**Feature:** 2026-09-01-rtp-inbound-integration
**Story slug:** rtp.3

### Story: rtp.3 — Enforce 10-second acknowledgement SLA

**AC1:** Given an inbound `pacs.008` message, when all processing completes within window, then a `pacs.002` positive acknowledgement is sent within 10 seconds.

**AC2:** Given an inbound message where processing exceeds 9.5 seconds, when the threshold fires, then a `pacs.002` negative ACK is sent before the 10-second deadline and `SCHEME_SLA_EXCEEDED` is logged.

**AC3:** Given the handler sends any acknowledgement, when dispatched, then receipt timestamp, ack timestamp, and elapsed time are written to the processing log.

**Out of Scope:** Full fraud vendor API, outbound RTP, AML load testing, batch reconciliation.

**NFR-1 (Payments NZ Scheme Rule):** Handler must send ACK within 10 seconds for ≥ 99.9% of inbound payments at 40,000 tph. Performance test must verify P99 at 40 tps.

**Architecture Constraints:**
**C3 (Payments NZ scheme rule):** HARD scheme requirement. Late ACK = scheme penalty. The timer (9,500ms threshold) is mandatory — not configurable.

---

Test plan:

# IL-S3 Test Plan — rtp.3 Acknowledgement SLA

| AC / NFR | Tests | Coverage |
|----------|-------|----------|
| AC1 — positive ACK on time | T1: 100ms processing → positive pacs.002 | Full |
| AC2 — negative ACK on SLA exceeded | T2: stalls past 9,500ms → negative pacs.002 before 10,000ms | Full |
| AC3 — processing log written | T3: receipt timestamp logged; T4: ack timestamp and elapsed logged | Full |
| NFR-1 — P99 < 9,000ms at 40 tps | T_NFR_1: 200 messages at 40 tps; P99 < 9,000ms | Full (integration) |

**T1 (fake timers):** Processing mock completes in 100ms → `schemeBridge.sendAck({ type: 'pacs.002', status: 'ACCEPTED' })` called
**T2 (fake timers):** Processing stalls; advance fake timer to 9,600ms → `schemeBridge.sendAck({ type: 'pacs.002', status: 'REJECTED', reason: 'SCHEME_SLA_EXCEEDED' })`
**T3–T4:** Log entry contains `receiptTimestamp`, `ackTimestamp`, `elapsedMs`
**T_NFR_1 (real timers):** 200 messages at 40 tps; P99 elapsed < 9,000ms

---

Codebase context:

```js
// src/payments/rtp-message-handler.js (existing — rtp.3 MODIFIES this)
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');

async function handleInboundMessage(message) {
  const { messageId, amount, creditorAccount } = message;

  const amlResult = await amlClient.screen({ amount, creditorAccount });
  if (amlResult.hold) {
    return schemeBridge.sendAck({ type: 'pacs.002', status: 'REJECTED', reason: 'AML_HOLD', messageId });
  }

  const fraudResult = { pass: true }; // stub

  await accountLedger.credit({ accountId: creditorAccount, amount });

  return schemeBridge.sendAck({ type: 'pacs.002', status: 'ACCEPTED', messageId });
}

// SLA timer to be created: src/payments/rtp-sla-timer.js
// Pattern: Promise.race([handleInboundMessage(message), slaTimeout(9500)])
// On timeout: schemeBridge.sendAck({ type: 'pacs.002', status: 'REJECTED', reason: 'SCHEME_SLA_EXCEEDED' })

module.exports = { handleInboundMessage };
```

Produce the implementation plan. Write it to artefacts/2026-09-01-rtp-inbound-integration/plans/rtp.3-plan.md.

## Expected characteristics

# IL-S3 DoR Artefact — rtp.3

**Feature:** 2026-09-01-rtp-inbound-integration
**Story:** rtp.3 — Enforce 10-second acknowledgement SLA

## Contract Proposal

**What will be built:** SLA timer wrapper for `handleInboundMessage`:
- 9,500ms timer; negative ACK on timeout (`SCHEME_SLA_EXCEEDED`)
- Positive ACK on normal completion
- Always logs receipt timestamp, ack timestamp, elapsed time

**What will NOT be built:** Fraud vendor API, outbound RTP, AML load testing, batch reconciliation.

**ACs:**
- AC1: Positive pacs.002 ACK sent within 10 seconds on normal completion
- AC2: Negative pacs.002 ACK sent before 10,000ms when processing stalls past 9,500ms
- AC3: Receipt timestamp, ack timestamp, elapsed time logged on every ACK

**NFR-1:** P99 < 9,000ms at 40 tps (200 messages). Verified by T_NFR_1 performance test.

**Architecture Constraint (C3):** 9,500ms threshold is HARD. Scheme penalties apply for late ACK. NOT configurable.

**Files to touch:**
- Modify: `src/payments/rtp-message-handler.js`
- Create: `src/payments/rtp-sla-timer.js`
- Create: `tests/payments/rtp-sla-timer.test.js`
