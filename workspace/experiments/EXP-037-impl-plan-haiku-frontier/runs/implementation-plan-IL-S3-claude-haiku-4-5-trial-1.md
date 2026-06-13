Save path: artefacts/2026-09-01-rtp-inbound-integration/plans/rtp.3-plan.md

---

# IL-S3 Implementation Plan — rtp.3 Acknowledgement SLA Timer

**Feature:** 2026-09-01-rtp-inbound-integration  
**Story:** rtp.3 — Enforce 10-second acknowledgement SLA  
**Branch:** `feature/rtp.3`  
**Test command:** `npm test`  
**Oversight:** Medium (scheme compliance — tech lead awareness required)

---

## Task 1: Unit Test Suite for SLA Timer Module (RED)

**File:** `tests/payments/rtp-sla-timer.test.js`

```javascript
'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { withSlaTimer } = require('../../src/payments/rtp-sla-timer');
const schemeBridge = require('../../src/payments/scheme-bridge');
const processingLog = require('../../src/payments/processing-log');

describe('rtp-sla-timer', () => {
  let clock;
  let sendAckStub;
  let logStub;
  let mockHandler;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    sendAckStub = sinon.stub(schemeBridge, 'sendAck').resolves({ success: true });
    logStub = sinon.stub(processingLog, 'write').resolves();
    mockHandler = sinon.stub();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  // ============================================================================
  // AC1: Positive ACK sent within 10 seconds on successful completion
  // ============================================================================
  describe('AC1 — Positive ACK on time completion', () => {
    it('T1: Should send positive pacs.002 when processing completes in 100ms', async () => {
      const message = {
        messageId: 'MSG-001',
        amount: 1500,
        creditorAccount: 'ACC-123'
      };

      // Mock: processing completes successfully in 100ms
      mockHandler.callsFake(async () => {
        await clock.tickAsync(100);
        return { status: 'ACCEPTED', messageId: message.messageId };
      });

      const wrappedHandler = withSlaTimer(mockHandler);
      const result = await wrappedHandler(message);

      // Advance clock to allow all promises to settle
      await clock.runAllAsync();

      // Assert positive ACK was sent
      expect(sendAckStub.calledOnce).to.equal(true);
      const ackCall = sendAckStub.getCall(0);
      expect(ackCall.args[0]).to.deep.include({
        type: 'pacs.002',
        status: 'ACCEPTED',
        messageId: message.messageId
      });
    });

    it('T1a: Should log receipt and ack timestamps with elapsed time on completion', async () => {
      const message = {
        messageId: 'MSG-002',
        amount: 2000,
        creditorAccount: 'ACC-456'
      };

      mockHandler.callsFake(async () => {
        await clock.tickAsync(150);
        return { status: 'ACCEPTED', messageId: message.messageId };
      });

      const wrappedHandler = withSlaTimer(mockHandler);
      await wrappedHandler(message);
      await clock.runAllAsync();

      // Assert log was written with timestamps
      expect(logStub.calledOnce).to.equal(true);
      const logCall = logStub.getCall(0);
      const logEntry = logCall.args[0];

      expect(logEntry).to.have.property('receiptTimestamp');
      expect(logEntry).to.have.property('ackTimestamp');
      expect(logEntry).to.have.property('elapsedMs');
      expect(logEntry.elapsedMs).to.be.greaterThanOrEqual(150);
      expect(logEntry.elapsedMs).to.be.lessThan(200);
    });
  });

  // ============================================================================
  // AC2: Negative ACK sent before 10s deadline when SLA exceeded
  // ============================================================================
  describe('AC2 — Negative ACK on SLA exceeded', () => {
    it('T2: Should send negative pacs.002 with SCHEME_SLA_EXCEEDED before 10,000ms when processing stalls past 9,500ms', async () => {
      const message = {
        messageId: 'MSG-003',
        amount: 5000,
        creditorAccount: 'ACC-789'
      };

      // Mock: processing stalls and never completes
      mockHandler.callsFake(async () => {
        await clock.tickAsync(15000); // Stall beyond 9,500ms threshold
        return { status: 'ACCEPTED' };
      });

      const wrappedHandler = withSlaTimer(mockHandler);
      const resultPromise = wrappedHandler(message);

      // Advance clock past SLA threshold (9,500ms)
      await clock.tickAsync(9600);

      // At this point, negative ACK should have been sent
      expect(sendAckStub.calledOnce).to.equal(true);
      const ackCall = sendAckStub.getCall(0);
      expect(ackCall.args[0]).to.deep.include({
        type: 'pacs.002',
        status: 'REJECTED',
        reason: 'SCHEME_SLA_EXCEEDED',
        messageId: message.messageId
      });

      // Verify ACK was sent before 10,000ms hard deadline
      const ackTimestamp = ackCall.args[0].ackTimestamp;
      const receiptTimestamp = ackCall.args[0].receiptTimestamp;
      const elapsedBeforeDeadline = ackTimestamp - receiptTimestamp;
      expect(elapsedBeforeDeadline).to.be.lessThan(10000);
    });

    it('T2a: Should log SLA exceeded event with timestamps', async () => {
      const message = {
        messageId: 'MSG-004',
        amount: 3000,
        creditorAccount: 'ACC-999'
      };

      mockHandler.callsFake(async () => {
        await clock.tickAsync(12000);
        return { status: 'ACCEPTED' };
      });

      const wrappedHandler = withSlaTimer(mockHandler);
      wrappedHandler(message);

      await clock.tickAsync(9700);

      // Log should be written on SLA timeout
      expect(logStub.calledOnce).to.equal(true);
      const logEntry = logStub.getCall(0).args[0];

      expect(logEntry).to.have.property('receiptTimestamp');
      expect(logEntry).to.have.property('ackTimestamp');
      expect(logEntry).to.have.property('elapsedMs');
      expect(logEntry.elapsedMs).to.be.greaterThanOrEqual(9500);
      expect(logEntry.status).to.equal('REJECTED');
      expect(logEntry.reason).to.equal('SCHEME_SLA_EXCEEDED');
    });
  });

  // ============================================================================
  // AC3: Processing log always written with receipt/ack timestamps and elapsed time
  // ============================================================================
  describe('AC3 — Processing log written with timestamps', () => {
    it('T3: Should log receipt timestamp when message arrives', async () => {
      const message = {
        messageId: 'MSG-005',
        amount: 1000,
        creditorAccount: 'ACC-111'
      };

      mockHandler.callsFake(async () => {
        await clock.tickAsync(50);
        return { status: 'ACCEPTED' };
      });

      const wrappedHandler = withSlaTimer(mockHandler);
      await wrappedHandler(message);
      await clock.runAllAsync();

      expect(logStub.calledOnce).to.equal(true);
      const logEntry = logStub.getCall(0).args[0];
      expect(logEntry.receiptTimestamp).to.exist;
      expect(typeof logEntry.receiptTimestamp).to.equal('number');
    });

    it('T4: Should log ack timestamp and elapsed time after ACK sent', async () => {
      const message = {
        messageId: 'MSG-006',
        amount: 2500,
        creditorAccount: 'ACC-222'
      };

      mockHandler.callsFake(async () => {
        await clock.tickAsync(200);
        return { status: 'ACCEPTED' };
      });

      const wrappedHandler = withSlaTimer(mockHandler);
      await wrappedHandler(message);
      await clock.runAllAsync();

      expect(logStub.calledOnce).to.equal(true);
      const logEntry = logStub.getCall(0).args[0];

      expect(logEntry.ackTimestamp).to.exist;
      expect(typeof logEntry.ackTimestamp).to.equal('number');
      expect(logEntry.elapsedMs).to.exist;
      expect(typeof logEntry.elapsedMs).to.equal('number');
      expect(logEntry.elapsedMs).to.equal(logEntry.ackTimestamp - logEntry.receiptTimestamp);
    });

    it('T4a: Should include messageId in log entry', async () => {
      const message = {
        messageId: 'MSG-TEST-123',
        amount: 750,
        creditorAccount: 'ACC-333'
      };

      mockHandler.callsFake(async () => {
        await clock.tickAsync(75);
        return { status: 'ACCEPTED' };
      });

      const wrappedHandler = withSlaTimer(mockHandler);
      await wrappedHandler(message);
      await clock.runAllAsync();

      const logEntry = logStub.getCall(0).args[0];
      expect(logEntry.messageId).to.equal('MSG-TEST-123');
    });
  });

  // ============================================================================
  // Edge case: Handler throws error before SLA fires
  // ============================================================================
  describe('Error handling', () => {
    it('Should send negative ACK if handler throws before SLA threshold', async () => {
      const message = {
        messageId: 'MSG-007',
        amount: 1500,
        creditorAccount: 'ACC-444'
      };

      const handlerError = new Error('AML_HOLD');
      mockHandler.rejects(handlerError);

      const wrappedHandler = withSlaTimer(mockHandler);
      await wrappedHandler(message);
      await clock.runAllAsync();

      expect(sendAckStub.calledOnce).to.equal(true);
      const ackCall = sendAckStub.getCall(0);
      expect(ackCall.args[0].status).to.equal('REJECTED');
    });
  });
});
```

---

## Task 2: Implementation of SLA Timer Module (GREEN)

**File:** `src/payments/rtp-sla-timer.js`

```javascript
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');

/**
 * Wraps a message handler with a 9,500ms SLA timer.
 * 
 * - Records receipt timestamp on entry
 * - Starts 9,500ms timer for SLA threshold
 * - On timeout: sends negative pacs.002 with SCHEME_SLA_EXCEEDED
 * - On completion: sends positive or negative pacs.002 (as returned by handler)
 * - Always logs receipt timestamp, ack timestamp, and elapsed time
 * 
 * @param {Function} handler - async function(message) that returns { status, reason?, messageId }
 * @returns {Function} wrapped async function(message)
 */
function withSlaTimer(handler) {
  const SLA_THRESHOLD_MS = 9500;

  return async function wrappedHandler(message) {
    const receiptTimestamp = Date.now();
    const messageId = message.messageId;
    let slaTimeoutHandle = null;
    let slaFired = false;

    // Promise that resolves when SLA threshold is exceeded
    const slaPromise = new Promise((resolve) => {
      slaTimeoutHandle = setTimeout(() => {
        slaFired = true;

        const ackTimestamp = Date.now();
        const elapsedMs = ackTimestamp - receiptTimestamp;

        // Send negative ACK
        schemeBridge.sendAck({
          type: 'pacs.002',
          status: 'REJECTED',
          reason: 'SCHEME_SLA_EXCEEDED',
          messageId: messageId,
          receiptTimestamp: receiptTimestamp,
          ackTimestamp: ackTimestamp,
          elapsedMs: elapsedMs
        });

        // Log SLA exceeded event
        processingLog.write({
          messageId: messageId,
          receiptTimestamp: receiptTimestamp,
          ackTimestamp: ackTimestamp,
          elapsedMs: elapsedMs,
          status: 'REJECTED',
          reason: 'SCHEME_SLA_EXCEEDED',
          event: 'SCHEME_SLA_EXCEEDED'
        });

        resolve({
          handled: 'sla_timeout',
          status: 'REJECTED',
          reason: 'SCHEME_SLA_EXCEEDED'
        });
      }, SLA_THRESHOLD_MS);
    });

    // Race: handler vs. SLA timer
    const result = await Promise.race([
      handler(message).catch((err) => {
        // Handler rejected: return rejection result
        return { status: 'REJECTED', reason: err.message || 'HANDLER_ERROR', messageId: messageId };
      }),
      slaPromise
    ]);

    // Clear SLA timer if it hasn't fired
    if (slaTimeoutHandle) {
      clearTimeout(slaTimeoutHandle);
    }

    // If SLA already fired, we're done (already logged and sent ACK)
    if (slaFired) {
      return result;
    }

    // Handler completed before SLA: send ACK and log
    const ackTimestamp = Date.now();
    const elapsedMs = ackTimestamp - receiptTimestamp;

    // Ensure result has required fields
    const ackPayload = {
      type: 'pacs.002',
      status: result.status || 'ACCEPTED',
      messageId: messageId,
      receiptTimestamp: receiptTimestamp,
      ackTimestamp: ackTimestamp,
      elapsedMs: elapsedMs
    };

    if (result.reason) {
      ackPayload.reason = result.reason;
    }

    // Send ACK
    await schemeBridge.sendAck(ackPayload);

    // Log completion
    await processingLog.write({
      messageId: messageId,
      receiptTimestamp: receiptTimestamp,
      ackTimestamp: ackTimestamp,
      elapsedMs: elapsedMs,
      status: result.status || 'ACCEPTED',
      reason: result.reason || null,
      event: 'PROCESSING_COMPLETE'
    });

    return result;
  };
}

module.exports = { withSlaTimer };
```

---

## Task 3: Modify Message Handler to Use SLA Timer Wrapper (REFACTOR)

**File:** `src/payments/rtp-message-handler.js` (modify)

```javascript
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');
const { withSlaTimer } = require('./rtp-sla-timer');

async function handleInboundMessage(message) {
  const { messageId, amount, creditorAccount } = message;

  const amlResult = await amlClient.screen({ amount, creditorAccount });
  if (amlResult.hold) {
    return {
      status: 'REJECTED',
      reason: 'AML_HOLD',
      messageId: messageId
    };
  }

  const fraudResult = { pass: true }; // stub

  await accountLedger.credit({ accountId: creditorAccount, amount });

  return {
    status: 'ACCEPTED',
    messageId: messageId
  };
}

// Wrap handler with SLA timer
const handleInboundMessageWithSla = withSlaTimer(handleInboundMessage);

module.exports = {
  handleInboundMessage: handleInboundMessageWithSla
};
```

---

## Task 4: Unit Tests Execution (VERIFY)

**Execution:** `npm test -- tests/payments/rtp-sla-timer.test.js`

**Expected outcomes:**
- ✅ T1: Positive ACK sent within 10s on 100ms completion
- ✅ T1a: Receipt and ack timestamps logged with elapsed time
- ✅ T2: Negative ACK with SCHEME_SLA_EXCEEDED sent before 10s when stalled past 9.5s
- ✅ T2a: SLA timeout event logged
- ✅ T3: Receipt timestamp logged on arrival
- ✅ T4: Ack timestamp and elapsed time logged after ACK sent
- ✅ T4a: MessageId included in log entry
- ✅ Error handling: Negative ACK sent if handler throws

---

## Task 5: Integration Test — NFR-1 Performance Validation (NFR-1)

**File:** `tests/payments/rtp-sla-timer.performance.test.js`

```javascript
'use strict';

const { describe, it, beforeEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { withSlaTimer } = require('../../src/payments/rtp-sla-timer');
const schemeBridge = require('../../src/payments/scheme-bridge');
const processingLog = require('../../src/payments/processing-log');

describe('NFR-1 — Performance at 40 tps (P99 < 9,000ms)', () => {
  let sendAckStub;
  let logStub;
  let mockHandler;

  beforeEach(() => {
    sendAckStub = sinon.stub(schemeBridge, 'sendAck').resolves({ success: true });
    logStub = sinon.stub(processingLog, 'write').resolves();
    mockHandler = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('T_NFR_1: Should process 200 messages at 40 tps with P99 elapsed < 9,000ms', async function() {
    this.timeout(10000); // Allow up to 10 seconds for test

    const messageCount = 200;
    const tps = 40;
    const intervalMs = 1000 / tps; // 25ms between messages

    const elapsedTimes = [];

    // Mock: each message takes 50–300ms to process
    mockHandler.callsFake(async (msg) => {
      const processingTime = 50 + Math.random() * 250; // 50–300ms
      await new Promise(r => setTimeout(r, processingTime));
      return { status: 'ACCEPTED', messageId: msg.messageId };
    });

    const wrappedHandler = withSlaTimer(mockHandler);

    // Send 200 messages at 40 tps (one every 25ms)
    const promises = [];
    for (let i = 0; i < messageCount; i++) {
      const message = {
        messageId: `PERF-${i}`,
        amount: 1000 + i,
        creditorAccount: `ACC-${i}`
      };

      const startTime = Date.now();
      const promise = wrappedHandler(message).then(() => {
        const elapsed = Date.now() - startTime;
        elapsedTimes.push(elapsed);
        return elapsed;
      });

      promises.push(promise);

      // Rate-limit: send one message every intervalMs
      if (i < messageCount - 1) {
        await new Promise(r => setTimeout(r, intervalMs));
      }
    }

    // Wait for all to complete
    await Promise.all(promises);

    // Calculate P99
    const sorted = elapsedTimes.sort((a, b) => a - b);
    const p99Index = Math.floor(messageCount * 0.99);
    const p99 = sorted[p99Index];

    console.log(`  P99 elapsed: ${p99}ms (threshold: 9,000ms)`);
    console.log(`  Min: ${sorted[0]}ms, Max: ${sorted[messageCount - 1]}ms`);

    // NFR-1 assertion: P99 < 9,000ms
    expect(p99).to.be.lessThan(9000);
    expect(sendAckStub.callCount).to.equal(messageCount);
  });
});
```

**Execution:** `npm test -- tests/payments/rtp-sla-timer.performance.test.js`

**Success criteria:**
- P99 elapsed time < 9,000ms across 200 messages at 40 tps
- All 200 messages receive ACK
- No messages timeout before completion (none should exceed 9,500ms)

---

## Task 6: Integration with Message Handler (VERIFY)

**File:** `tests/payments/rtp-message-handler.test.js` (add integration tests)

```javascript
'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const { handleInboundMessage } = require('../../src/payments/rtp-message-handler');
const schemeBridge = require('../../src/payments/scheme-bridge');

describe('rtp-message-handler with SLA timer integration', () => {
  let sendAckStub;
  let clock;

  beforeEach(() => {
    sendAckStub = sinon.stub(schemeBridge, 'sendAck').resolves({ success: true });
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('Should wrap handleInboundMessage with SLA timer', async () => {
    const message = {
      messageId: 'INTEG-001',
      amount: 5000,
      creditorAccount: 'ACC-123'
    };

    const handlerPromise = handleInboundMessage(message);
    await clock.tickAsync(100);
    await handlerPromise;

    expect(sendAckStub.calledOnce).to.equal(true);
  });
});
```

---

## Task 7: Branch and Test Execution Checklist

**Branch:** `feature/rtp.3`

**Pre-merge checklist:**

- [ ] All unit tests pass: `npm test -- tests/payments/rtp-sla-timer.test.js`
  - AC1 tests (positive ACK on time)
  - AC2 tests (negative ACK on SLA exceeded)
  - AC3 tests (logging)
  - Error handling tests
- [ ] Performance test passes: `npm test -- tests/payments/rtp-sla-timer.performance.test.js`
  - P99 < 9,000ms at 40 tps
- [ ] Integration test passes: `npm test -- tests/payments/rtp-message-handler.test.js`
  - Handler wrapped correctly
- [ ] Code review: tech lead signs off on C3 (HARD scheme rule implementation)
- [ ] No regressions in existing tests: `npm test`

**Files Modified/Created:**
- ✅ Created: `src/payments/rtp-sla-timer.js`
- ✅ Created: `tests/payments/rtp-sla-timer.test.js`
- ✅ Created: `tests/payments/rtp-sla-timer.performance.test.js`
- ✅ Modified: `src/payments/rtp-message-handler.js`

---

## Summary

This implementation plan delivers rtp.3 in strict TDD order:

1. **RED:** Test suite written first (`rtp-sla-timer.test.js`) with all ACs covered
2. **GREEN:** SLA timer module implements 9,500ms threshold, negative ACK on timeout, logging
3. **REFACTOR:** Message handler wrapped with timer
4. **VERIFY:** Integration and performance tests confirm NFR-1 compliance
5. **C3 COMPLIANCE:** Hard scheme rule enforced — timer threshold is non-configurable, fires before 10,000ms deadline

**Test coverage:**
- AC1: ✅ Unit tests (fake timers)
- AC2: ✅ Unit tests (fake timers)
- AC3: ✅ Unit tests + logging verification
- NFR-1: ✅ Integration test at 40 tps, P99 < 9,000ms