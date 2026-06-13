Save path: artefacts/2026-09-01-rtp-inbound-integration/plans/rtp.3-plan.md

```markdown
# Implementation Plan — rtp.3: Enforce 10-second Acknowledgement SLA

**Feature:** 2026-09-01-rtp-inbound-integration
**Story:** rtp.3
**Branch:** `feature/rtp.3`
**Oversight:** Medium (tech lead awareness required)
**Test command:** `npm test`

---

## Overview

Wrap the existing `handleInboundMessage` function with a 9,500ms SLA timer. If processing
completes before the threshold, send a positive `pacs.002` ACK. If processing stalls past
9,500ms, fire a negative `pacs.002` ACK before the 10,000ms hard scheme deadline. Always
write receipt timestamp, ack timestamp, and elapsed time to the processing log.

**Architecture constraint C3 is a hard scheme rule.** The 9,500ms threshold is not
configurable and must never be removed or increased.

---

## Files

| Action   | Path                                      |
|----------|-------------------------------------------|
| CREATE   | `src/payments/rtp-sla-timer.js`           |
| CREATE   | `tests/payments/rtp-sla-timer.test.js`    |
| MODIFY   | `src/payments/rtp-message-handler.js`     |

---

## Task Sequence

### TASK 1 — RED: Write failing tests for `rtp-sla-timer.js`

**File:** `tests/payments/rtp-sla-timer.test.js`

Create the test file. At this point `src/payments/rtp-sla-timer.js` does not yet exist, so
all tests must fail (module-not-found or assertion failure).

```js
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { useFakeTimers } = require('sinon'); // or jest.useFakeTimers() if jest

// -------------------------------------------------------------------
// Dependency doubles
// -------------------------------------------------------------------
const schemeBridge = { sendAck: null };
const processingLog = { write: null };

// Reset doubles before each test
function resetDoubles() {
  schemeBridge.sendAck = async () => {};
  processingLog.write = async () => {};
}

// -------------------------------------------------------------------
// Module under test — loaded AFTER doubles are wired so that
// dependency injection via factory works correctly.
// -------------------------------------------------------------------
const { wrapWithSlaTimer } = require('../../src/payments/rtp-sla-timer');

// -------------------------------------------------------------------
// T1 — AC1: Positive ACK when processing completes within window
// -------------------------------------------------------------------
describe('rtp-sla-timer', () => {
  let clock;

  beforeEach(() => {
    resetDoubles();
  });

  afterEach(() => {
    if (clock) {
      clock.restore();
      clock = null;
    }
  });

  describe('T1 — AC1: positive ACK sent when processing completes within SLA', () => {
    it('calls sendAck with ACCEPTED when handler resolves in 100ms', async () => {
      clock = useFakeTimers();

      const calls = [];
      schemeBridge.sendAck = async (payload) => { calls.push(payload); };

      // Handler resolves quickly
      const fastHandler = async (_message) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      };

      const message = { messageId: 'msg-001', amount: 100, creditorAccount: 'acc-A' };
      const wrappedPromise = wrapWithSlaTimer(fastHandler, message, { schemeBridge, processingLog });

      // Advance past the handler's internal delay but well inside SLA
      await clock.tickAsync(200);
      await wrappedPromise;

      assert.equal(calls.length, 1, 'sendAck should be called exactly once');
      assert.equal(calls[0].type, 'pacs.002');
      assert.equal(calls[0].status, 'ACCEPTED');
      assert.equal(calls[0].messageId, 'msg-001');
    });
  });

  // -------------------------------------------------------------------
  // T2 — AC2: Negative ACK when processing stalls past 9,500ms
  // -------------------------------------------------------------------
  describe('T2 — AC2: negative ACK sent when processing exceeds 9,500ms threshold', () => {
    it('calls sendAck with REJECTED/SCHEME_SLA_EXCEEDED at 9,500ms, before 10,000ms', async () => {
      clock = useFakeTimers();

      const calls = [];
      schemeBridge.sendAck = async (payload) => { calls.push({ payload, firedAt: clock.now }); };

      // Handler never resolves within the test window
      const stalledHandler = async (_message) => {
        await new Promise((resolve) => setTimeout(resolve, 20_000));
      };

      const message = { messageId: 'msg-002', amount: 200, creditorAccount: 'acc-B' };
      const wrappedPromise = wrapWithSlaTimer(stalledHandler, message, { schemeBridge, processingLog });

      // Advance fake clock to just past the SLA threshold
      await clock.tickAsync(9_600);

      // Await the wrapper — it should have resolved via the timeout branch
      await wrappedPromise;

      assert.equal(calls.length, 1, 'sendAck should be called exactly once');
      assert.equal(calls[0].payload.type, 'pacs.002');
      assert.equal(calls[0].payload.status, 'REJECTED');
      assert.equal(calls[0].payload.reason, 'SCHEME_SLA_EXCEEDED');
      assert.equal(calls[0].payload.messageId, 'msg-002');

      // Must have fired BEFORE the 10,000ms hard deadline
      assert.ok(
        calls[0].firedAt < 10_000,
        `ACK fired at ${calls[0].firedAt}ms — must be before 10,000ms`
      );
    });
  });

  // -------------------------------------------------------------------
  // T3 — AC3: receipt timestamp present in log
  // -------------------------------------------------------------------
  describe('T3 — AC3: receipt timestamp written to processing log', () => {
    it('log entry contains receiptTimestamp', async () => {
      clock = useFakeTimers();

      const logEntries = [];
      processingLog.write = async (entry) => { logEntries.push(entry); };

      const fastHandler = async (_message) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      };

      const message = { messageId: 'msg-003', amount: 50, creditorAccount: 'acc-C' };
      const wrappedPromise = wrapWithSlaTimer(fastHandler, message, { schemeBridge, processingLog });
      await clock.tickAsync(200);
      await wrappedPromise;

      assert.equal(logEntries.length, 1, 'exactly one log entry should be written');
      assert.ok(
        typeof logEntries[0].receiptTimestamp === 'number',
        'receiptTimestamp must be a number (epoch ms)'
      );
    });
  });

  // -------------------------------------------------------------------
  // T4 — AC3: ack timestamp and elapsed time present in log
  // -------------------------------------------------------------------
  describe('T4 — AC3: ack timestamp and elapsed time written to processing log', () => {
    it('log entry contains ackTimestamp and elapsedMs', async () => {
      clock = useFakeTimers();

      const logEntries = [];
      processingLog.write = async (entry) => { logEntries.push(entry); };

      const fastHandler = async (_message) => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      };

      const message = { messageId: 'msg-004', amount: 75, creditorAccount: 'acc-D' };
      const wrappedPromise = wrapWithSlaTimer(fastHandler, message, { schemeBridge, processingLog });
      await clock.tickAsync(300);
      await wrappedPromise;

      const entry = logEntries[0];
      assert.ok(typeof entry.ackTimestamp === 'number', 'ackTimestamp must be a number (epoch ms)');
      assert.ok(typeof entry.elapsedMs === 'number', 'elapsedMs must be a number');
      assert.ok(entry.elapsedMs >= 0, 'elapsedMs must be non-negative');
      assert.ok(
        entry.ackTimestamp >= entry.receiptTimestamp,
        'ackTimestamp must be >= receiptTimestamp'
      );
      // elapsedMs must approximately equal the difference (within 10ms tolerance for fake timer)
      assert.ok(
        Math.abs(entry.elapsedMs - (entry.ackTimestamp - entry.receiptTimestamp)) <= 10,
        'elapsedMs must match ackTimestamp - receiptTimestamp'
      );
    });
  });
});
```

**Verification:** Run `npm test`. All four tests fail (module not found or assertion
errors). No implementation exists yet. ✓ RED confirmed.

---

### TASK 2 — GREEN: Implement `src/payments/rtp-sla-timer.js`

**File:** `src/payments/rtp-sla-timer.js`

```js
'use strict';

/**
 * SLA_THRESHOLD_MS — C3 SCHEME RULE: HARD REQUIREMENT.
 * Must fire negative ACK before the 10,000ms scheme deadline.
 * This value is NOT configurable and must NOT be increased.
 */
const SLA_THRESHOLD_MS = 9_500;

/**
 * wrapWithSlaTimer
 *
 * Wraps a handler function with a 9,500ms SLA timer.
 *
 * - If the handler resolves before the threshold: sends positive pacs.002 ACK.
 * - If the threshold fires first: sends negative pacs.002 ACK (SCHEME_SLA_EXCEEDED).
 * - Always writes a processing log entry with receipt timestamp, ack timestamp,
 *   and elapsed time.
 *
 * @param {Function} handler          - async function(message) — the inner handler
 * @param {Object}   message          - the inbound pacs.008 message
 * @param {Object}   deps             - injected dependencies
 * @param {Object}   deps.schemeBridge
 * @param {Object}   deps.processingLog
 * @returns {Promise<void>}
 */
async function wrapWithSlaTimer(handler, message, deps) {
  const { schemeBridge, processingLog } = deps;
  const { messageId } = message;

  const receiptTimestamp = Date.now();

  let slaTimerHandle;

  /**
   * SLA timeout promise — resolves after SLA_THRESHOLD_MS.
   * Resolves (not rejects) so that Promise.race selects it cleanly.
   */
  const slaTimeoutPromise = new Promise((resolve) => {
    slaTimerHandle = setTimeout(() => resolve({ __slaExceeded: true }), SLA_THRESHOLD_MS);
  });

  /**
   * Handler promise — wraps the inner handler; resolves to a result object.
   * Any rejection from the handler is caught and treated as a processing failure
   * (does NOT suppress the error — it re-throws after ACK is sent on the
   * timeout branch; if the handler itself fails we still honour the SLA).
   */
  const handlerPromise = handler(message).then(
    () => ({ __slaExceeded: false }),
    (err) => { throw err; }
  );

  let outcome;
  try {
    outcome = await Promise.race([handlerPromise, slaTimeoutPromise]);
  } catch (_handlerError) {
    // Handler threw — SLA timer may still be running; treat as processing failure.
    // Send a negative ACK to satisfy the scheme SLA obligation, then re-throw.
    clearTimeout(slaTimerHandle);
    const ackTimestamp = Date.now();
    const elapsedMs = ackTimestamp - receiptTimestamp;

    await Promise.all([
      schemeBridge.sendAck({
        type: 'pacs.002',
        status: 'REJECTED',
        reason: 'PROCESSING_ERROR',
        messageId,
      }),
      processingLog.write({ messageId, receiptTimestamp, ackTimestamp, elapsedMs }),
    ]);

    throw _handlerError;
  }

  // Handler or timer won the race — clear the timer either way.
  clearTimeout(slaTimerHandle);

  const ackTimestamp = Date.now();
  const elapsedMs = ackTimestamp - receiptTimestamp;

  if (outcome.__slaExceeded) {
    // AC2 — SLA exceeded: negative ACK
    await Promise.all([
      schemeBridge.sendAck({
        type: 'pacs.002',
        status: 'REJECTED',
        reason: 'SCHEME_SLA_EXCEEDED',
        messageId,
      }),
      processingLog.write({ messageId, receiptTimestamp, ackTimestamp, elapsedMs }),
    ]);
  } else {
    // AC1 — Processing completed within SLA: positive ACK
    await Promise.all([
      schemeBridge.sendAck({
        type: 'pacs.002',
        status: 'ACCEPTED',
        messageId,
      }),
      processingLog.write({ messageId, receiptTimestamp, ackTimestamp, elapsedMs }),
    ]);
  }
}

module.exports = { wrapWithSlaTimer, SLA_THRESHOLD_MS };
```

**Verification:** Run `npm test`. T1, T2, T3, T4 must all pass. ✓ GREEN confirmed.

---

### TASK 3 — REFACTOR: Integrate SLA timer into `rtp-message-handler.js`

**File:** `src/payments/rtp-message-handler.js`

Replace the bare `handleInboundMessage` export with a version wrapped by the SLA timer.
The inner function retains its original processing logic unchanged.

```js
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');
const { wrapWithSlaTimer } = require('./rtp-sla-timer');

/**
 * _processInboundMessage — the original processing logic, unchanged.
 * This is the inner function wrapped by the SLA timer.
 * It must NOT call schemeBridge.sendAck — the SLA wrapper owns the ACK.
 *
 * @param {Object} message
 */
async function _processInboundMessage(message) {
  const { amount, creditorAccount } = message;

  const amlResult = await amlClient.screen({ amount, creditorAccount });
  if (amlResult.hold) {
    // Signal AML hold by throwing — the SLA wrapper will send REJECTED ACK.
    // NOTE: The original code sent an AML_HOLD ACK here. Preserving that
    //       distinction requires AML result propagation; see note below.
    throw Object.assign(new Error('AML_HOLD'), { reason: 'AML_HOLD' });
  }

  const fraudResult = { pass: true }; // stub — rtp.4 will replace this

  await accountLedger.credit({ accountId: creditorAccount, amount });
  // Handler resolves normally — SLA wrapper sends ACCEPTED ACK.
}

/**
 * handleInboundMessage — public entry point.
 *
 * Delegates to _processInboundMessage wrapped with the 9,500ms SLA timer.
 * All ACK sending and logging is handled by the wrapper.
 *
 * @param {Object} message  — inbound pacs.008 message
 */
async function handleInboundMessage(message) {
  await wrapWithSlaTimer(_processInboundMessage, message, { schemeBridge, processingLog });
}

module.exports = { handleInboundMessage };
```

> **Note — AML_HOLD ACK reason:** The original handler sent `reason: 'AML_HOLD'` on
> the ACK. The SLA wrapper currently sends a generic `PROCESSING_ERROR` for thrown
> errors. If the scheme requires `AML_HOLD` to be preserved in the ACK reason field,
> the `catch` branch in `wrapWithSlaTimer` should be extended to read
> `err.reason` and forward it. This is a scope-contained change within
> `rtp-sla-timer.js` and does not require a story change. Tech lead to confirm
> whether scheme rules require the specific reason code on a rejection ACK.

**Verification:** Run `npm test`. All four unit tests continue to pass (they test the
module directly; the integration with `rtp-message-handler.js` does not break them). ✓

---

### TASK 4 — RED then GREEN: NFR-1 Performance test

**File:** `tests/payments/rtp-sla-timer.perf.test.js`

This test uses **real timers** and a lightweight no-op handler to measure P99 elapsed
time of the SLA wrapper overhead at 40 messages per second (200 total).

```js
'use strict';

/**
 * NFR-1 Performance Test — rtp.3
 *
 * Verifies that the SLA timer wrapper does not introduce latency that would
 * push P99 processing time above 9,000ms at 40 tps.
 *
 * Uses real timers. The handler is a no-op (simulates zero processing time)
 * to isolate wrapper overhead. Passes if P99 elapsed < 9,000ms.
 *
 * Run condition: integration environment at 40 tps.
 * Full 40,000 tph load test requires production-like infra (W1 — risk accepted).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { wrapWithSlaTimer } = require('../../src/payments/rtp-sla-timer');

const MESSAGE_COUNT = 200;
const RATE_TPS = 40; // messages per second
const INTER_MESSAGE_DELAY_MS = 1_000 / RATE_TPS; // 25ms between messages
const P99_LIMIT_MS = 9_000;

describe('NFR-1 — SLA timer P99 at 40 tps', () => {
  it(`processes ${MESSAGE_COUNT} messages at ${RATE_TPS} tps with P99 elapsed < ${P99_LIMIT_MS}ms`, async () => {
    // Generous test timeout: 200 messages × 25ms spacing = 5 seconds of wall time
    // plus startup. Allow 15 seconds.
    const noOpHandler = async (_message) => {};

    const noOpBridge = { sendAck: async () => {} };
    const noOpLog   = { write:   async () => {} };

    const elapsedTimes = [];

    /**
     * Send messages at 40 tps.
     * We record elapsed time from inside a thin probe wrapper so we capture
     * the full round-trip through wrapWithSlaTimer.
     */
    const sendAt = (index) =>
      new Promise((resolve) => {
        setTimeout(async () => {
          const start = Date.now();
          await wrapWithSlaTimer(noOpHandler, { messageId: `perf-${index}`, amount: 1, creditorAccount: 'acc-perf' }, {
            schemeBridge: noOpBridge,
            processingLog: {
              write: async (entry) => {
                elapsedTimes.push(entry.elapsedMs);
              },
            },
          });
          resolve();
        }, index * INTER_MESSAGE_DELAY_MS);
      });

    const promises = Array.from({ length: MESSAGE_COUNT }, (_, i) => sendAt(i));
    await Promise.all(promises);

    assert.equal(
      elapsedTimes.length,
      MESSAGE_COUNT,
      `Expected ${MESSAGE_COUNT} log entries, got ${elapsedTimes.length}`
    );

    // Compute P99
    const sorted = [...elapsedTimes].sort((a, b) => a - b);
    const p99Index = Math.ceil(0.99 * sorted.length) - 1;
    const p99 = sorted[p99Index];

    console.log(`NFR-1 P99 elapsed: ${p99}ms (limit: ${P99_LIMIT_MS}ms)`);
    console.log(`NFR-1 P50 elapsed: ${sorted[Math.floor(0.5 * sorted.length)]}ms`);
    console.log(`NFR-1 max elapsed: ${sorted[sorted.length - 1]}ms`);

    assert.ok(
      p99 < P99_LIMIT_MS,
      `P99 elapsed ${p99}ms exceeds NFR-1 limit of ${P99_LIMIT_MS}ms`
    );
  });
});
```

**RED step:** Add this file and run `npm test`. The test fails because
`rtp-sla-timer.js` does not yet export from Task 2 (if running tasks in strict
sequence), OR because the file is new and the module path resolves to nothing. In
practice Task 2 will have landed first; the test runs and its assertion is what is
verified.

**GREEN step:** Tasks 2 and 3 are already complete; the no-op handler plus real
timer overhead should produce P99 well under 9,000ms. Run `npm test`. NFR-1 test
passes. ✓

---

## Completion Checklist

| # | Check | Done? |
|---|-------|-------|
| 1 | T1 passes (fake timers, positive ACK in 100ms) | ☐ |
| 2 | T2 passes (fake timers, negative ACK at 9,600ms, fired before 10,000ms) | ☐ |
| 3 | T3 passes (receiptTimestamp in log) | ☐ |
| 4 | T4 passes (ackTimestamp + elapsedMs in log, elapsedMs matches diff) | ☐ |
| 5 | NFR-1 perf test passes (P99 < 9,000ms at 40 tps) | ☐ |
| 6 | `rtp-message-handler.js` delegates to `wrapWithSlaTimer` | ☐ |
| 7 | `SLA_THRESHOLD_MS = 9_500` is a named constant with scheme-rule comment | ☐ |
| 8 | No test imports implementation before the test file is created | ☐ |
| 9 | Tech lead notified (oversight: Medium) | ☐ |
| 10 | AML_HOLD ACK reason question raised with tech lead | ☐ |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| SLA_THRESHOLD_MS edited by future dev | Low | Critical (scheme penalty) | Named constant with HARD SCHEME RULE comment; add lint rule or test asserting `SLA_THRESHOLD_MS === 9_500` |
| Handler throws and stalls timer clearance | Low | Medium | Catch branch clears timer and sends negative ACK before re-throwing |
| Double ACK if handler resolves at exact same tick as timer | Very Low | Medium | `clearTimeout` called immediately after `Promise.race` resolves; only one branch executes |
| W1 — 40,000 tph not validated in integration | Accepted | High | 40 tps integration test is the pre-production evidence; full load test deferred to production-like infra |
```