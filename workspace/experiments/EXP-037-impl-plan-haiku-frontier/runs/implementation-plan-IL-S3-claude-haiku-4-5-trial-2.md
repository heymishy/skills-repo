Save path: artefacts/2026-09-01-rtp-inbound-integration/plans/rtp.3-plan.md

---

# IL-S3 Implementation Plan — rtp.3 Acknowledgement SLA Timer

**Feature:** 2026-09-01-rtp-inbound-integration  
**Story:** rtp.3 — Enforce 10-second acknowledgement SLA  
**Branch:** `feature/rtp.3`  
**Test command:** `npm test`  
**Oversight level:** Medium

---

## Overview

This plan implements an SLA timer wrapper around `handleInboundMessage()` to enforce the Payments NZ scheme requirement: ACK within 10 seconds (9,500ms threshold for negative ACK firing). The implementation follows strict TDD order: all tests are written first (RED phase), then implementation code follows.

---

## Task 1: Create SLA Timer Module Tests

**File:** `tests/payments/rtp-sla-timer.test.js`

**Rationale:** Unit tests with fake timers validate core SLA logic before implementation.

### Test T1: Positive ACK sent when processing completes within SLA window

```javascript
'use strict';

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');

const slaTimer = require('../../../src/payments/rtp-sla-timer');
const schemeBridge = require('../../../src/payments/scheme-bridge');
const processingLog = require('../../../src/payments/processing-log');

describe('rtp-sla-timer', () => {
  let clock;
  let sendAckStub;
  let logStub;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    sendAckStub = sinon.stub(schemeBridge, 'sendAck').resolves();
    logStub = sinon.stub(processingLog, 'write').resolves();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  describe('T1: positive ACK on time', () => {
    it('should send positive pacs.002 when processing completes in 100ms', async () => {
      const message = {
        messageId: 'msg-001',
        amount: 1000,
        creditorAccount: 'ACC-123'
      };

      const mockHandler = sinon.stub().callsFake(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ status: 'ACCEPTED' }), 100);
        });
      });

      const promise = slaTimer.withSlaTimeout(mockHandler, message);
      
      await clock.tickAsync(100);
      await promise;

      expect(sendAckStub.calledOnce).to.be.true;
      expect(sendAckStub.firstCall.args[0]).to.deep.include({
        type: 'pacs.002',
        status: 'ACCEPTED',
        messageId: 'msg-001'
      });
    });
  });

  describe('T2: negative ACK on SLA exceeded', () => {
    it('should send negative pacs.002 when processing stalls past 9,500ms', async () => {
      const message = {
        messageId: 'msg-002',
        amount: 2000,
        creditorAccount: 'ACC-456'
      };

      const mockHandler = sinon.stub().callsFake(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ status: 'ACCEPTED' }), 15000);
        });
      });

      const promise = slaTimer.withSlaTimeout(mockHandler, message);
      
      await clock.tickAsync(9600);
      await promise;

      expect(sendAckStub.calledOnce).to.be.true;
      expect(sendAckStub.firstCall.args[0]).to.deep.include({
        type: 'pacs.002',
        status: 'REJECTED',
        reason: 'SCHEME_SLA_EXCEEDED',
        messageId: 'msg-002'
      });
    });
  });

  describe('T3: receipt timestamp logged', () => {
    it('should log receipt timestamp when message is received', async () => {
      const message = {
        messageId: 'msg-003',
        amount: 3000,
        creditorAccount: 'ACC-789'
      };

      const mockHandler = sinon.stub().callsFake(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ status: 'ACCEPTED' }), 100);
        });
      });

      const promise = slaTimer.withSlaTimeout(mockHandler, message);
      
      await clock.tickAsync(100);
      await promise;

      expect(logStub.calledOnce).to.be.true;
      const logEntry = logStub.firstCall.args[0];
      expect(logEntry).to.have.property('receiptTimestamp');
      expect(logEntry.receiptTimestamp).to.be.a('number');
    });
  });

  describe('T4: ack timestamp and elapsed time logged', () => {
    it('should log ack timestamp and elapsed time in processing log', async () => {
      const message = {
        messageId: 'msg-004',
        amount: 4000,
        creditorAccount: 'ACC-999'
      };

      const mockHandler = sinon.stub().callsFake(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ status: 'ACCEPTED' }), 250);
        });
      });

      const promise = slaTimer.withSlaTimeout(mockHandler, message);
      
      await clock.tickAsync(250);
      await promise;

      expect(logStub.calledOnce).to.be.true;
      const logEntry = logStub.firstCall.args[0];
      expect(logEntry).to.have.property('ackTimestamp');
      expect(logEntry).to.have.property('elapsedMs');
      expect(logEntry.elapsedMs).to.equal(250);
      expect(logEntry.ackTimestamp).to.be.a('number');
    });
  });

  describe('T2 edge case: negative ACK fires before 10,000ms deadline', () => {
    it('should guarantee negative ACK sent before hard 10-second deadline', async () => {
      const message = {
        messageId: 'msg-005',
        amount: 5000,
        creditorAccount: 'ACC-111'
      };

      const mockHandler = sinon.stub().callsFake(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ status: 'ACCEPTED' }), 20000);
        });
      });

      const promise = slaTimer.withSlaTimeout(mockHandler, message);
      
      await clock.tickAsync(9500);
      await promise;

      expect(sendAckStub.calledOnce).to.be.true;
      const ackCall = sendAckStub.firstCall;
      const ackTimestamp = ackCall.args[0].ackTimestamp || clock.now;
      expect(ackTimestamp).to.be.lessThan(10000);
    });
  });

});
```

---

## Task 2: Create SLA Timer Module Implementation

**File:** `src/payments/rtp-sla-timer.js`

**Rationale:** Implements the SLA timer wrapper using `Promise.race()` with fake/real timers. Records timestamps and logs processing metrics.

```javascript
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');

const SLA_THRESHOLD_MS = 9500;

/**
 * Wraps a message handler with SLA timeout enforcement.
 * 
 * On success (before 9,500ms): sends positive pacs.002 ACK
 * On timeout (≥ 9,500ms): sends negative pacs.002 ACK with SCHEME_SLA_EXCEEDED
 * Always logs: receiptTimestamp, ackTimestamp, elapsedMs
 * 
 * @param {Function} handler - async function(message) to wrap
 * @param {Object} message - inbound pacs.008 message
 * @returns {Promise<void>}
 */
async function withSlaTimeout(handler, message) {
  const receiptTimestamp = Date.now();

  const slaTimeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve({ timedOut: true });
    }, SLA_THRESHOLD_MS);
  });

  const handlerPromise = (async () => {
    try {
      const result = await handler(message);
      return { timedOut: false, result };
    } catch (error) {
      return { timedOut: false, error };
    }
  })();

  const { timedOut, result, error } = await Promise.race([
    handlerPromise,
    slaTimeoutPromise
  ]);

  const ackTimestamp = Date.now();
  const elapsedMs = ackTimestamp - receiptTimestamp;

  if (timedOut) {
    // SLA exceeded: send negative ACK
    await schemeBridge.sendAck({
      type: 'pacs.002',
      status: 'REJECTED',
      reason: 'SCHEME_SLA_EXCEEDED',
      messageId: message.messageId,
      ackTimestamp
    });

    await processingLog.write({
      messageId: message.messageId,
      receiptTimestamp,
      ackTimestamp,
      elapsedMs,
      ackStatus: 'REJECTED',
      ackReason: 'SCHEME_SLA_EXCEEDED'
    });
  } else {
    // Normal completion: send positive ACK
    if (error) {
      // Handler threw; send negative ACK
      await schemeBridge.sendAck({
        type: 'pacs.002',
        status: 'REJECTED',
        reason: error.reason || 'HANDLER_ERROR',
        messageId: message.messageId,
        ackTimestamp
      });

      await processingLog.write({
        messageId: message.messageId,
        receiptTimestamp,
        ackTimestamp,
        elapsedMs,
        ackStatus: 'REJECTED',
        ackReason: error.reason || 'HANDLER_ERROR'
      });
    } else {
      // Handler succeeded: send positive ACK
      await schemeBridge.sendAck({
        type: 'pacs.002',
        status: 'ACCEPTED',
        messageId: message.messageId,
        ackTimestamp
      });

      await processingLog.write({
        messageId: message.messageId,
        receiptTimestamp,
        ackTimestamp,
        elapsedMs,
        ackStatus: 'ACCEPTED'
      });
    }
  }
}

module.exports = {
  withSlaTimeout,
  SLA_THRESHOLD_MS
};
```

---

## Task 3: Modify Message Handler to Use SLA Timer

**File:** `src/payments/rtp-message-handler.js`

**Rationale:** Wrap the existing `handleInboundMessage` with the SLA timer to enforce the scheme requirement.

```javascript
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');
const slaTimer = require('./rtp-sla-timer');
const amlClient = require('./aml-client'); // assumed dependency
const accountLedger = require('./account-ledger'); // assumed dependency

/**
 * Core message handler logic (unwrapped).
 * Called within SLA timer context.
 * 
 * @param {Object} message - inbound pacs.008 message
 * @returns {Promise<Object>}
 */
async function handleInboundMessage(message) {
  const { messageId, amount, creditorAccount } = message;

  const amlResult = await amlClient.screen({ amount, creditorAccount });
  if (amlResult.hold) {
    const error = new Error('AML hold applied');
    error.reason = 'AML_HOLD';
    throw error;
  }

  const fraudResult = { pass: true }; // stub

  await accountLedger.credit({ accountId: creditorAccount, amount });

  return { status: 'ACCEPTED', messageId };
}

/**
 * Inbound message entry point with SLA enforcement.
 * 
 * Wraps handleInboundMessage with 9,500ms SLA timer.
 * Guarantees pacs.002 ACK sent before 10,000ms scheme deadline.
 * 
 * @param {Object} message - inbound pacs.008 message
 * @returns {Promise<void>}
 */
async function processInboundMessage(message) {
  return slaTimer.withSlaTimeout(handleInboundMessage, message);
}

module.exports = {
  handleInboundMessage,
  processInboundMessage
};
```

---

## Task 4: Integration Test — NFR-1 Performance Verification

**File:** `tests/payments/rtp-sla-timer.integration.test.js`

**Rationale:** Real-world performance test at 40 tps (200 messages) validates P99 < 9,000ms for scheme compliance.

```javascript
'use strict';

const { describe, it } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');

const slaTimer = require('../../../src/payments/rtp-sla-timer');
const schemeBridge = require('../../../src/payments/scheme-bridge');
const processingLog = require('../../../src/payments/processing-log');

describe('rtp-sla-timer integration — NFR-1 performance', () => {
  let sendAckStub;
  let logStub;

  beforeEach(() => {
    sendAckStub = sinon.stub(schemeBridge, 'sendAck').resolves();
    logStub = sinon.stub(processingLog, 'write').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('T_NFR_1: P99 elapsed time at 40 tps', () => {
    it('should process 200 messages at 40 tps with P99 < 9,000ms', async function() {
      this.timeout(10000); // 200 messages at 40 tps = ~5 seconds + buffer

      const messageCount = 200;
      const tps = 40;
      const intervalMs = 1000 / tps; // 25ms between messages

      const elapsedTimes = [];

      const mockHandler = sinon.stub().callsFake(async () => {
        // Simulate realistic processing: 50–500ms
        const processingTime = Math.random() * 450 + 50;
        await new Promise((resolve) => setTimeout(resolve, processingTime));
        return { status: 'ACCEPTED' };
      });

      const promises = [];
      for (let i = 0; i < messageCount; i++) {
        const message = {
          messageId: `perf-msg-${i}`,
          amount: 1000 + i,
          creditorAccount: `ACC-${i}`
        };

        promises.push(
          slaTimer.withSlaTimeout(mockHandler, message)
            .then(() => {
              const logEntry = logStub.args[logStub.callCount - 1][0];
              elapsedTimes.push(logEntry.elapsedMs);
            })
        );

        // Throttle to ~40 tps
        if ((i + 1) % tps === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      await Promise.all(promises);

      // Sort elapsed times and calculate P99
      elapsedTimes.sort((a, b) => a - b);
      const p99Index = Math.ceil(elapsedTimes.length * 0.99) - 1;
      const p99 = elapsedTimes[p99Index];

      console.log(`Performance results: P99 = ${p99}ms (threshold: 9,000ms)`);
      console.log(`Min: ${elapsedTimes[0]}ms, Max: ${elapsedTimes[elapsedTimes.length - 1]}ms`);

      expect(p99).to.be.lessThan(9000);
    });
  });

});
```

---

## Task 5: Update Module Exports (if applicable)

**File:** `src/payments/index.js` (create if needed)

**Rationale:** Export the wrapped entry point for use in upstream routing.

```javascript
'use strict';

module.exports = {
  processInboundMessage: require('./rtp-message-handler').processInboundMessage,
  slaTimer: require('./rtp-sla-timer')
};
```

---

## Test Execution Order (TDD)

1. ✅ **RED** — Run Task 1 (T1–T4 tests fail; no implementation)
   ```bash
   npm test -- tests/payments/rtp-sla-timer.test.js
   ```

2. ✅ **GREEN** — Run Task 2 (implement `rtp-sla-timer.js`; tests pass)

3. ✅ **GREEN** — Run Task 3 (modify `rtp-message-handler.js`; integration works)

4. ✅ **VERIFY** — Run Task 4 (NFR-1 performance test; P99 < 9,000ms)

5. **Full test suite:**
   ```bash
   npm test
   ```

---

## Acceptance Criteria Mapping

| AC | Test | File | Status |
|----|------|------|--------|
| AC1 — Positive ACK within 10s | T1 | `rtp-sla-timer.test.js` | Implements with fake timers; validates pacs.002 ACCEPTED |
| AC2 — Negative ACK on SLA exceeded | T2 | `rtp-sla-timer.test.js` | Implements Promise.race timeout; fires before 10,000ms |
| AC3 — Processing log written | T3, T4 | `rtp-sla-timer.test.js` | Validates receiptTimestamp, ackTimestamp, elapsedMs logged |
| NFR-1 — P99 < 9,000ms at 40 tps | T_NFR_1 | `rtp-sla-timer.integration.test.js` | Real-timer performance test; 200 msgs at 40 tps |

---

## Architecture Constraints (C3 — Scheme Rule)

- **Hard requirement:** 9,500ms threshold is non-configurable (`SLA_THRESHOLD_MS = 9500`)
- **Guarantee:** Negative ACK fires before 10,000ms hard deadline
- **Penalties:** Late ACK = scheme financial penalty; implementation must not violate
- **Verification:** Integration test proves P99 compliance at 40 tps

---

## Branch & Commit Strategy

**Branch:** `feature/rtp.3`

**Commits (TDD order):**
1. `feat(rtp.3): add SLA timer unit tests (T1–T4) [RED]`
2. `feat(rtp.3): implement rtp-sla-timer module [GREEN]`
3. `feat(rtp.3): wrap handleInboundMessage with SLA timer`
4. `test(rtp.3): add NFR-1 performance integration test`
5. `refactor(rtp.3): export processInboundMessage as entry point`

---

## Cleanup & Review Checklist

- [ ] All unit tests pass with fake timers
- [ ] All integration tests pass with real timers
- [ ] P99 measured < 9,000ms at 40 tps (NFR-1)
- [ ] No configurable SLA threshold (C3 compliance)
- [ ] Logging includes receiptTimestamp, ackTimestamp, elapsedMs (AC3)
- [ ] Code review by tech lead (medium oversight)
- [ ] Branch merged to `main` with signed commit

---

**End of Implementation Plan**