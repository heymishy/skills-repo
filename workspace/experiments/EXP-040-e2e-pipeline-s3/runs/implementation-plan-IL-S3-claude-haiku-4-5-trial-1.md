Save path: artefacts/2026-09-01-rtp-inbound-integration/plans/rtp.3-plan.md

---

# IL-S3 Implementation Plan — rtp.3 Acknowledgement SLA

**Feature:** 2026-09-01-rtp-inbound-integration  
**Story:** rtp.3 — Enforce 10-second acknowledgement SLA  
**Branch:** `feature/rtp.3`  
**Test command:** `npm test`  
**Oversight:** Medium

---

## Phase 1: SLA Timer Module (RED → GREEN → REFACTOR)

### Task 1.1: Create SLA Timer Unit Test Suite

**File:** `tests/payments/rtp-sla-timer.test.js`

```js
'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { withSlaTimer } = require('../../src/payments/rtp-sla-timer');

describe('rtp-sla-timer', () => {
  let clock;
  let schemeBridgeStub;
  let processingLogStub;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    schemeBridgeStub = {
      sendAck: sinon.stub().resolves()
    };
    processingLogStub = {
      write: sinon.stub().resolves()
    };
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T1: Positive ACK sent within 10 seconds (AC1)
  // ═══════════════════════════════════════════════════════════════════════
  describe('T1 — AC1: Positive ACK on time completion', () => {
    it('should send ACCEPTED pacs.002 when processing completes in 100ms', async () => {
      // ARRANGE: Mock handler that resolves quickly
      const mockHandler = sinon.stub().resolves({ 
        status: 'ACCEPTED', 
        messageId: 'msg-001' 
      });
      
      const wrappedHandler = withSlaTimer(mockHandler, schemeBridgeStub, processingLogStub);
      
      const message = {
        messageId: 'msg-001',
        amount: 1000,
        creditorAccount: 'ACC-123'
      };

      // ACT: Call wrapped handler
      const promise = wrappedHandler(message);
      
      // Advance clock by 100ms (processing time)
      clock.tick(100);
      
      await promise;

      // ASSERT: Positive ACK sent
      expect(schemeBridgeStub.sendAck.calledOnce).to.be.true;
      const ackCall = schemeBridgeStub.sendAck.firstCall.args[0];
      expect(ackCall.type).to.equal('pacs.002');
      expect(ackCall.status).to.equal('ACCEPTED');
      expect(ackCall.messageId).to.equal('msg-001');
    });

    it('should log receipt timestamp, ack timestamp, and elapsed time on positive ACK', async () => {
      const mockHandler = sinon.stub().resolves({ 
        status: 'ACCEPTED', 
        messageId: 'msg-002' 
      });
      
      const wrappedHandler = withSlaTimer(mockHandler, schemeBridgeStub, processingLogStub);
      
      const message = {
        messageId: 'msg-002',
        amount: 500,
        creditorAccount: 'ACC-456'
      };

      const promise = wrappedHandler(message);
      const receiptTime = Date.now();
      
      clock.tick(150);
      await promise;

      expect(processingLogStub.write.calledOnce).to.be.true;
      const logEntry = processingLogStub.write.firstCall.args[0];
      expect(logEntry).to.have.property('receiptTimestamp');
      expect(logEntry).to.have.property('ackTimestamp');
      expect(logEntry).to.have.property('elapsedMs');
      expect(logEntry.elapsedMs).to.equal(150);
      expect(logEntry.messageId).to.equal('msg-002');
    });
  });

  // ═══════════════════════════════════════════════════��═══════════════════
  // T2: Negative ACK sent on SLA exceeded (AC2)
  // ═══════════════════════════════════════════════════════════════════════
  describe('T2 — AC2: Negative ACK when SLA threshold exceeded', () => {
    it('should send REJECTED pacs.002 with SCHEME_SLA_EXCEEDED when processing stalls past 9,500ms', async () => {
      // ARRANGE: Mock handler that never resolves (stalls)
      const mockHandler = sinon.stub().returns(new Promise(() => {}));
      
      const wrappedHandler = withSlaTimer(mockHandler, schemeBridgeStub, processingLogStub);
      
      const message = {
        messageId: 'msg-003',
        amount: 2000,
        creditorAccount: 'ACC-789'
      };

      // ACT: Call wrapped handler
      const promise = wrappedHandler(message);
      
      // Advance fake timer to 9,600ms (past 9,500ms SLA threshold)
      clock.tick(9600);
      
      await promise;

      // ASSERT: Negative ACK sent before 10,000ms deadline
      expect(schemeBridgeStub.sendAck.calledOnce).to.be.true;
      const ackCall = schemeBridgeStub.sendAck.firstCall.args[0];
      expect(ackCall.type).to.equal('pacs.002');
      expect(ackCall.status).to.equal('REJECTED');
      expect(ackCall.reason).to.equal('SCHEME_SLA_EXCEEDED');
      expect(ackCall.messageId).to.equal('msg-003');
    });

    it('should log SCHEME_SLA_EXCEEDED event when SLA timer fires', async () => {
      const mockHandler = sinon.stub().returns(new Promise(() => {}));
      
      const wrappedHandler = withSlaTimer(mockHandler, schemeBridgeStub, processingLogStub);
      
      const message = {
        messageId: 'msg-004',
        amount: 3000,
        creditorAccount: 'ACC-999'
      };

      const promise = wrappedHandler(message);
      clock.tick(9600);
      await promise;

      // ASSERT: Log entry written with SLA_EXCEEDED event
      expect(processingLogStub.write.called).to.be.true;
      const logEntry = processingLogStub.write.firstCall.args[0];
      expect(logEntry).to.have.property('event');
      expect(logEntry.event).to.equal('SCHEME_SLA_EXCEEDED');
      expect(logEntry).to.have.property('elapsedMs');
    });

    it('should fire negative ACK before 10,000ms hard deadline', async () => {
      const mockHandler = sinon.stub().returns(new Promise(() => {}));
      
      const wrappedHandler = withSlaTimer(mockHandler, schemeBridgeStub, processingLogStub);
      
      const message = {
        messageId: 'msg-005',
        amount: 1500,
        creditorAccount: 'ACC-555'
      };

      const promise = wrappedHandler(message);
      
      // Advance to just before 10,000ms
      clock.tick(9900);
      await promise;

      // ASSERT: Negative ACK must have been sent by now
      expect(schemeBridgeStub.sendAck.calledOnce).to.be.true;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T3–T4: Processing log entries (AC3)
  // ═══════════════════════════════════════════════════════════════════════
  describe('T3–T4 — AC3: Processing log written with timestamps', () => {
    it('should log receipt timestamp when message arrives', async () => {
      const mockHandler = sinon.stub().resolves({ 
        status: 'ACCEPTED', 
        messageId: 'msg-006' 
      });
      
      const wrappedHandler = withSlaTimer(mockHandler, schemeBridgeStub, processingLogStub);
      
      const message = {
        messageId: 'msg-006',
        amount: 800,
        creditorAccount: 'ACC-111'
      };

      const promise = wrappedHandler(message);
      clock.tick(50);
      await promise;

      expect(processingLogStub.write.calledOnce).to.be.true;
      const logEntry = processingLogStub.write.firstCall.args[0];
      expect(logEntry).to.have.property('receiptTimestamp');
      expect(typeof logEntry.receiptTimestamp).to.equal('number');
    });

    it('should log ack timestamp and elapsed time on completion', async () => {
      const mockHandler = sinon.stub().resolves({ 
        status: 'ACCEPTED', 
        messageId: 'msg-007' 
      });
      
      const wrappedHandler = withSlaTimer(mockHandler, schemeBridgeStub, processingLogStub);
      
      const message = {
        messageId: 'msg-007',
        amount: 1200,
        creditorAccount: 'ACC-222'
      };

      const promise = wrappedHandler(message);
      clock.tick(200);
      await promise;

      expect(processingLogStub.write.calledOnce).to.be.true;
      const logEntry = processingLogStub.write.firstCall.args[0];
      expect(logEntry).to.have.property('ackTimestamp');
      expect(logEntry).to.have.property('elapsedMs');
      expect(logEntry.elapsedMs).to.be.greaterThan(0);
      expect(typeof logEntry.ackTimestamp).to.equal('number');
    });
  });
});
```

---

### Task 1.2: Create SLA Timer Module Implementation

**File:** `src/payments/rtp-sla-timer.js`

```js
'use strict';

/**
 * withSlaTimer: Wraps a message handler with 9,500ms SLA enforcement.
 * 
 * @param {Function} handler - The original async handler function
 * @param {Object} schemeBridge - Scheme ACK dispatcher
 * @param {Object} processingLog - Processing log writer
 * @returns {Function} Wrapped handler with SLA timer
 */
function withSlaTimer(handler, schemeBridge, processingLog) {
  const SLA_THRESHOLD_MS = 9500;

  return async function wrappedHandler(message) {
    const receiptTimestamp = Date.now();
    let ackTimestamp = null;
    let elapsedMs = null;
    let slaExceeded = false;

    // Promise that races: normal handler vs SLA timeout
    const result = await Promise.race([
      // Execution path: Run the handler
      (async () => {
        try {
          const handlerResult = await handler(message);
          ackTimestamp = Date.now();
          elapsedMs = ackTimestamp - receiptTimestamp;
          
          // Log successful completion
          await processingLog.write({
            messageId: message.messageId,
            receiptTimestamp,
            ackTimestamp,
            elapsedMs,
            event: 'PROCESSING_COMPLETED',
            status: 'ACCEPTED'
          });

          return { success: true, result: handlerResult };
        } catch (err) {
          ackTimestamp = Date.now();
          elapsedMs = ackTimestamp - receiptTimestamp;

          // Log error completion
          await processingLog.write({
            messageId: message.messageId,
            receiptTimestamp,
            ackTimestamp,
            elapsedMs,
            event: 'PROCESSING_FAILED',
            error: err.message
          });

          return { success: false, error: err };
        }
      })(),

      // Timeout path: SLA threshold
      new Promise((resolve) => {
        setTimeout(() => {
          slaExceeded = true;
          ackTimestamp = Date.now();
          elapsedMs = ackTimestamp - receiptTimestamp;
          resolve({ slaExceeded: true });
        }, SLA_THRESHOLD_MS);
      })
    ]);

    // Handle SLA exceeded case
    if (result.slaExceeded) {
      await schemeBridge.sendAck({
        type: 'pacs.002',
        status: 'REJECTED',
        reason: 'SCHEME_SLA_EXCEEDED',
        messageId: message.messageId
      });

      await processingLog.write({
        messageId: message.messageId,
        receiptTimestamp,
        ackTimestamp,
        elapsedMs,
        event: 'SCHEME_SLA_EXCEEDED'
      });

      return;
    }

    // Handle normal completion (positive or negative ACK from handler)
    if (result.success) {
      await schemeBridge.sendAck({
        type: 'pacs.002',
        status: 'ACCEPTED',
        messageId: message.messageId
      });
    } else {
      // If handler threw an error, send negative ACK
      await schemeBridge.sendAck({
        type: 'pacs.002',
        status: 'REJECTED',
        reason: 'PROCESSING_ERROR',
        messageId: message.messageId
      });
    }
  };
}

module.exports = { withSlaTimer };
```

---

## Phase 2: Integration with Message Handler

### Task 2.1: Modify Message Handler to Wrap with SLA Timer

**File:** `src/payments/rtp-message-handler.js` (MODIFY)

```js
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');
const { withSlaTimer } = require('./rtp-sla-timer');

async function handleInboundMessage(message) {
  const { messageId, amount, creditorAccount } = message;

  const amlResult = await amlClient.screen({ amount, creditorAccount });
  if (amlResult.hold) {
    return schemeBridge.sendAck({ 
      type: 'pacs.002', 
      status: 'REJECTED', 
      reason: 'AML_HOLD', 
      messageId 
    });
  }

  const fraudResult = { pass: true }; // stub

  await accountLedger.credit({ accountId: creditorAccount, amount });

  return schemeBridge.sendAck({ 
    type: 'pacs.002', 
    status: 'ACCEPTED', 
    messageId 
  });
}

// Export wrapped handler with SLA timer
const handleInboundMessageWithSla = withSlaTimer(
  handleInboundMessage,
  schemeBridge,
  processingLog
);

module.exports = { 
  handleInboundMessage,
  handleInboundMessageWithSla
};
```

---

## Phase 3: Performance / Integration Test

### Task 3.1: Create Performance Test Suite (NFR-1)

**File:** `tests/payments/rtp-sla-timer.perf.test.js`

```js
'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { withSlaTimer } = require('../../src/payments/rtp-sla-timer');

describe('rtp-sla-timer — Performance (NFR-1)', () => {
  let schemeBridgeStub;
  let processingLogStub;
  let elapsedTimes = [];

  beforeEach(() => {
    schemeBridgeStub = {
      sendAck: sinon.stub().resolves()
    };
    processingLogStub = {
      write: sinon.stub().resolves()
    };
    elapsedTimes = [];
  });

  afterEach(() => {
    sinon.restore();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T_NFR_1: P99 at 40 tps with 200 messages (real timers)
  // ══════════════════════���════════════════════════════════════════════════
  describe('T_NFR_1 — P99 latency at 40 tps', () => {
    it('should process 200 messages at 40 tps with P99 elapsed < 9,000ms', async function() {
      this.timeout(15000); // Allow 15s for test execution

      // ARRANGE: Handler that simulates realistic processing (50–200ms)
      const mockHandler = sinon.stub().callsFake(async () => {
        const processingTime = Math.random() * 150 + 50; // 50–200ms
        await new Promise(resolve => setTimeout(resolve, processingTime));
        return { status: 'ACCEPTED', messageId: 'msg-perf' };
      });

      const wrappedHandler = withSlaTimer(mockHandler, schemeBridgeStub, processingLogStub);

      const messages = [];
      for (let i = 0; i < 200; i++) {
        messages.push({
          messageId: `perf-msg-${i}`,
          amount: Math.floor(Math.random() * 5000) + 100,
          creditorAccount: `ACC-${String(i).padStart(4, '0')}`
        });
      }

      // ACT: Send messages at ~40 tps (25ms intervals)
      const messageInterval = 1000 / 40; // ~25ms per message
      const promises = [];

      for (let i = 0; i < messages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, messageInterval));
        
        const startTime = Date.now();
        const promise = wrappedHandler(messages[i]).then(() => {
          const elapsed = Date.now() - startTime;
          elapsedTimes.push(elapsed);
        });
        promises.push(promise);
      }

      await Promise.all(promises);

      // ASSERT: Calculate P99
      elapsedTimes.sort((a, b) => a - b);
      const p99Index = Math.ceil(elapsedTimes.length * 0.99) - 1;
      const p99Value = elapsedTimes[p99Index];

      console.log(`Performance test results:`);
      console.log(`  Total messages: ${elapsedTimes.length}`);
      console.log(`  Min: ${Math.min(...elapsedTimes)}ms`);
      console.log(`  Max: ${Math.max(...elapsedTimes)}ms`);
      console.log(`  Median: ${elapsedTimes[Math.floor(elapsedTimes.length / 2)]}ms`);
      console.log(`  P99: ${p99Value}ms`);

      expect(p99Value).to.be.lessThan(9000, `P99 (${p99Value}ms) must be less than 9,000ms`);
      expect(elapsedTimes.length).to.equal(200);
    });
  });
});
```

---

## Phase 4: Handler Integration Test

### Task 4.1: Create Integration Test for Modified Handler

**File:** `tests/payments/rtp-message-handler.sla.test.js`

```js
'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { handleInboundMessageWithSla } = require('../../src/payments/rtp-message-handler');

describe('rtp-message-handler — SLA Integration', () => {
  let clock;
  let schemeBridgeStub;
  let processingLogStub;
  let amlClientStub;
  let accountLedgerStub;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    schemeBridgeStub = { sendAck: sinon.stub().resolves() };
    processingLogStub = { write: sinon.stub().resolves() };
    amlClientStub = { screen: sinon.stub().resolves({ hold: false }) };
    accountLedgerStub = { credit: sinon.stub().resolves() };
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('should wrap handler and send positive ACK within SLA', async () => {
    const message = {
      messageId: 'integration-001',
      amount: 5000,
      creditorAccount: 'ACC-INTEG-001'
    };

    // Execute wrapped handler
    const promise = handleInboundMessageWithSla(message);
    clock.tick(100);
    await promise;

    // Verify SLA timer fired and ACK sent
    expect(schemeBridgeStub.sendAck.called).to.be.true;
  });
});
```

---

## Phase 5: Verification Tasks

### Task 5.1: Unit Test Execution (TDD RED → GREEN)

**Command:** `npm test -- tests/payments/rtp-sla-timer.test.js`

**Expected outcome:**
- ✅ All 8 unit tests PASS
- ✅ AC1: Positive ACK on time
- ✅ AC2: Negative ACK on SLA exceeded
- ✅ AC3: Log entries with timestamps

### Task 5.2: Performance Test Execution (NFR-1)

**Command:** `npm test -- tests/payments/rtp-sla-timer.perf.test.js`

**Expected outcome:**
- ✅ P99 < 9,000ms at 40 tps (200 messages)
- ✅ All messages processed
- ✅ No SLA timeout errors in normal path

### Task 5.3: Integration Test Execution

**Command:** `npm test -- tests/payments/rtp-message-handler.sla.test.js`

**Expected outcome:**
- ✅ Handler wrapper functions correctly
- ✅ SLA timer integrates seamlessly with existing handler

### Task 5.4: Full Test Suite

**Command:** `npm test`

**Expected outcome:**
- ✅ All existing tests still pass
- ✅ All new SLA tests pass
- ✅ No regressions

---

## Acceptance Criteria Mapping

| AC | Task | Test | Status |
|----|------|------|--------|
| **AC1** — Positive ACK within 10s | 1.2, 2.1 | T1 in `rtp-sla-timer.test.js` | ✅ Unit test (RED → GREEN) |
| **AC2** — Negative ACK on SLA exceeded | 1.2, 2.1 | T2 in `rtp-sla-timer.test.js` | ✅ Unit test (fake timers) |
| **AC3** — Processing log with timestamps | 1.2, 2.1 | T3–T4 in `rtp-sla-timer.test.js` | ✅ Unit test |
| **NFR-1** — P99 < 9,000ms at 40 tps | 3.1 | T_NFR_1 in `rtp-sla-timer.perf.test.js` | ✅ Integration test (real timers) |

---

## Architecture & Scheme Compliance

**C3 (HARD Scheme Rule):** ✅ Enforced
- 9,500ms SLA threshold (hard-coded, non-configurable)
- Negative ACK sent before 10,000ms deadline
- SCHEME_SLA_EXCEEDED event logged
- No configurable override permitted

**Design Pattern:**
- `Promise.race()` for timeout vs. handler completion
- Closure captures receipt timestamp at message entry
- Log entry written for every outcome (success, error, SLA exceeded)
- schemeBridge.sendAck() called in all paths

---

## File Manifest

| File | Status | Purpose |
|------|--------|---------|
| `src/payments/rtp-sla-timer.js` | CREATE | SLA timer wrapper module |
| `src/payments/rtp-message-handler.js` | MODIFY | Add SLA wrapper export |
| `tests/payments/rtp-sla-timer.test.js` | CREATE | Unit tests (fake timers) AC1–AC3 |
| `tests/payments/rtp-sla-timer.perf.test.js` | CREATE | Performance test NFR-1 |
| `tests/payments/rtp-message-handler.sla.test.js` | CREATE | Integration test |

---

## Implementation Order (TDD)

1. **Write tests first** (`tests/payments/rtp-sla-timer.test.js`) — RED
2. **Implement SLA timer module** (`src/payments/rtp-sla-timer.js`) — GREEN
3. **Integrate with handler** (`src/payments/rtp-message-handler.js`) — REFACTOR
4. **Add performance test** (`tests/payments/rtp-sla-timer.perf.test.js`)
5. **Run all tests** → All PASS

---

**End of Implementation Plan**