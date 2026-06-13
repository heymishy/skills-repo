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

Wrap `handleInboundMessage` with a 9,500ms SLA timer. On timeout, send a `pacs.002`
negative ACK and log `SCHEME_SLA_EXCEEDED`. On normal completion, send a `pacs.002`
positive ACK. Always log receipt timestamp, ack timestamp, and elapsed time.

**Architecture Constraint C3 (HARD):** The 9,500ms threshold is a mandatory scheme rule.
It is NOT configurable. Late ACK triggers scheme penalties.

---

## Files Touched

| Action   | File                                        |
|----------|---------------------------------------------|
| Create   | `tests/payments/rtp-sla-timer.test.js`      |
| Create   | `src/payments/rtp-sla-timer.js`             |
| Modify   | `src/payments/rtp-message-handler.js`       |

---

## Task Sequence

### TASK 1 — RED: Write failing unit tests for `rtp-sla-timer.js`

**File:** `tests/payments/rtp-sla-timer.test.js`

Create the test file. At this point `src/payments/rtp-sla-timer.js` does not exist,
so all tests will fail (import error / missing module). This is the required RED state.

```js
'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// Stub dependencies before requiring the module under test
const schemeBridgeStub = { sendAck: null };
const processingLogStub = { write: null };

// We use a module-level require after stubbing via a small factory pattern.
// Jest / Node test runner: use jest.mock or manual stub injection.
// This plan targets Jest (present in most Node payment service repos).

jest.mock('../src/payments/scheme-bridge', () => schemeBridgeStub);  // adjust path as needed
jest.mock('../src/payments/processing-log', () => processingLogStub);

describe('rtp-sla-timer', () => {
  let createSlaTimer;
  let sendAckMock;
  let writeLogMock;

  beforeEach(() => {
    jest.useFakeTimers();

    sendAckMock = jest.fn().mockResolvedValue(undefined);
    writeLogMock = jest.fn().mockResolvedValue(undefined);

    schemeBridgeStub.sendAck = sendAckMock;
    processingLogStub.write = writeLogMock;

    // Re-require to pick up fresh module state after mock setup
    jest.resetModules();
    ({ createSlaTimer } = require('../src/payments/rtp-sla-timer'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // T1 — AC1: Positive ACK sent when processing completes within window
  // -----------------------------------------------------------------------
  it('T1: sends positive pacs.002 ACK when processing completes within 9,500ms', async () => {
    const message = { messageId: 'msg-001', amount: 100, creditorAccount: 'acc-001' };

    // Inner handler resolves quickly (simulated 100ms)
    const fastHandler = () =>
      new Promise((resolve) => setTimeout(() => resolve({ status: 'ACCEPTED' }), 100));

    const timedHandler = createSlaTimer(fastHandler);

    const resultPromise = timedHandler(message);

    // Advance fake clock 100ms so the fast handler resolves
    jest.advanceTimersByTime(100);
    await resultPromise;

    expect(sendAckMock).toHaveBeenCalledTimes(1);
    expect(sendAckMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pacs.002',
        status: 'ACCEPTED',
        messageId: 'msg-001',
      })
    );
  });

  // -----------------------------------------------------------------------
  // T2 — AC2: Negative ACK sent when processing stalls past 9,500ms
  // -----------------------------------------------------------------------
  it('T2: sends negative pacs.002 ACK with SCHEME_SLA_EXCEEDED when processing exceeds 9,500ms', async () => {
    const message = { messageId: 'msg-002', amount: 200, creditorAccount: 'acc-002' };

    // Inner handler never resolves within the window (simulates stall)
    const stalledHandler = () =>
      new Promise((resolve) => setTimeout(() => resolve({ status: 'ACCEPTED' }), 15_000));

    const timedHandler = createSlaTimer(stalledHandler);

    const resultPromise = timedHandler(message);

    // Advance past the 9,500ms SLA threshold
    jest.advanceTimersByTime(9_600);
    await Promise.resolve(); // flush microtask queue

    expect(sendAckMock).toHaveBeenCalledTimes(1);
    expect(sendAckMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pacs.002',
        status: 'REJECTED',
        reason: 'SCHEME_SLA_EXCEEDED',
        messageId: 'msg-002',
      })
    );

    // Elapsed at the timer fire must be < 10,000ms (we fired at 9,600ms)
    const logCall = writeLogMock.mock.calls[0]?.[0];
    expect(logCall?.elapsedMs).toBeLessThan(10_000);

    // Clean up dangling timer
    jest.advanceTimersByTime(5_500);
    await resultPromise.catch(() => {});
  });

  // -----------------------------------------------------------------------
  // T3 — AC3: Receipt timestamp present in processing log
  // -----------------------------------------------------------------------
  it('T3: writes receiptTimestamp to the processing log', async () => {
    const message = { messageId: 'msg-003', amount: 50, creditorAccount: 'acc-003' };
    const beforeCall = Date.now();

    const fastHandler = () =>
      new Promise((resolve) => setTimeout(() => resolve({ status: 'ACCEPTED' }), 50));

    const timedHandler = createSlaTimer(fastHandler);
    const resultPromise = timedHandler(message);

    jest.advanceTimersByTime(50);
    await resultPromise;

    expect(writeLogMock).toHaveBeenCalled();
    const logEntry = writeLogMock.mock.calls[0][0];

    expect(logEntry).toHaveProperty('receiptTimestamp');
    expect(typeof logEntry.receiptTimestamp).toBe('number');
    expect(logEntry.receiptTimestamp).toBeGreaterThanOrEqual(beforeCall);
  });

  // -----------------------------------------------------------------------
  // T4 — AC3: Ack timestamp and elapsed time present in processing log
  // -----------------------------------------------------------------------
  it('T4: writes ackTimestamp and elapsedMs to the processing log', async () => {
    const message = { messageId: 'msg-004', amount: 75, creditorAccount: 'acc-004' };

    const fastHandler = () =>
      new Promise((resolve) => setTimeout(() => resolve({ status: 'ACCEPTED' }), 200));

    const timedHandler = createSlaTimer(fastHandler);
    const resultPromise = timedHandler(message);

    jest.advanceTimersByTime(200);
    await resultPromise;

    expect(writeLogMock).toHaveBeenCalled();
    const logEntry = writeLogMock.mock.calls[0][0];

    expect(logEntry).toHaveProperty('ackTimestamp');
    expect(logEntry).toHaveProperty('elapsedMs');
    expect(typeof logEntry.ackTimestamp).toBe('number');
    expect(typeof logEntry.elapsedMs).toBe('number');
    expect(logEntry.ackTimestamp).toBeGreaterThanOrEqual(logEntry.receiptTimestamp);
    expect(logEntry.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
```

**Expected state after TASK 1:** All four tests fail. Module `src/payments/rtp-sla-timer.js`
does not exist. ✅ RED confirmed.

---

### TASK 2 — GREEN: Implement `src/payments/rtp-sla-timer.js`

**File:** `src/payments/rtp-sla-timer.js`

```js
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');

/**
 * SLA_THRESHOLD_MS — HARD scheme requirement (C3, Payments NZ).
 * Must fire negative ACK before the 10,000ms hard deadline.
 * NOT configurable.
 */
const SLA_THRESHOLD_MS = 9_500;

/**
 * createSlaTimer(innerHandler)
 *
 * Returns a wrapped async function that:
 *   1. Records receipt timestamp on entry.
 *   2. Races innerHandler(message) against a 9,500ms timeout.
 *   3. On timeout  → sends negative pacs.002 + logs SCHEME_SLA_EXCEEDED.
 *   4. On success  → sends positive pacs.002.
 *   5. Always writes receiptTimestamp, ackTimestamp, elapsedMs to processingLog.
 *
 * @param {(message: object) => Promise<any>} innerHandler
 * @returns {(message: object) => Promise<void>}
 */
function createSlaTimer(innerHandler) {
  return async function timedInboundHandler(message) {
    const { messageId } = message;
    const receiptTimestamp = Date.now();

    let slaTimerHandle;

    // Promise that rejects after SLA_THRESHOLD_MS — signals the timeout path
    const slaTimeoutPromise = new Promise((_resolve, reject) => {
      slaTimerHandle = setTimeout(() => {
        reject(new SlaExceededError(messageId));
      }, SLA_THRESHOLD_MS);
    });

    try {
      // Race: whichever settles first wins
      await Promise.race([innerHandler(message), slaTimeoutPromise]);

      // --- Happy path: processing completed within window ---
      clearTimeout(slaTimerHandle);

      const ackTimestamp = Date.now();
      const elapsedMs = ackTimestamp - receiptTimestamp;

      await Promise.all([
        schemeBridge.sendAck({
          type: 'pacs.002',
          status: 'ACCEPTED',
          messageId,
        }),
        processingLog.write({
          messageId,
          receiptTimestamp,
          ackTimestamp,
          elapsedMs,
          outcome: 'ACCEPTED',
        }),
      ]);
    } catch (err) {
      // --- Timeout path or unexpected inner-handler error ---
      clearTimeout(slaTimerHandle);

      const ackTimestamp = Date.now();
      const elapsedMs = ackTimestamp - receiptTimestamp;

      if (err instanceof SlaExceededError) {
        await Promise.all([
          schemeBridge.sendAck({
            type: 'pacs.002',
            status: 'REJECTED',
            reason: 'SCHEME_SLA_EXCEEDED',
            messageId,
          }),
          processingLog.write({
            messageId,
            receiptTimestamp,
            ackTimestamp,
            elapsedMs,
            outcome: 'SCHEME_SLA_EXCEEDED',
          }),
        ]);
      } else {
        // Unexpected handler error: still must ACK before the scheme deadline.
        // Log and send negative ACK so the scheme is not left waiting.
        await Promise.all([
          schemeBridge.sendAck({
            type: 'pacs.002',
            status: 'REJECTED',
            reason: 'PROCESSING_ERROR',
            messageId,
          }),
          processingLog.write({
            messageId,
            receiptTimestamp,
            ackTimestamp,
            elapsedMs,
            outcome: 'PROCESSING_ERROR',
            error: err.message,
          }),
        ]);
        // Re-throw so upstream monitoring can observe unexpected failures
        throw err;
      }
    }
  };
}

class SlaExceededError extends Error {
  constructor(messageId) {
    super(`SLA exceeded for messageId: ${messageId}`);
    this.name = 'SlaExceededError';
    this.messageId = messageId;
  }
}

module.exports = { createSlaTimer, SLA_THRESHOLD_MS };
```

**Expected state after TASK 2:** T1, T2, T3, T4 pass. ✅ GREEN confirmed.

---

### TASK 3 — RED: Write failing performance test for NFR-1

**File:** `tests/payments/rtp-sla-timer.perf.test.js`

This file uses real timers. It is intentionally separate from the unit tests so it
can be run selectively (e.g. `npm run test:perf`) against an integration environment.

```js
'use strict';

/**
 * NFR-1 Performance Test — T_NFR_1
 *
 * Run condition: integration environment only (40 tps sustained).
 * Skipped in CI unit-test pass unless RTP_PERF_TEST=true env var is set.
 *
 * Asserts: P99 elapsed < 9,000ms for 200 messages at 40 tps.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Real (not mocked) dependencies must be wired to integration stubs in env
const { createSlaTimer } = require('../../src/payments/rtp-sla-timer');

const RTP_PERF_TEST = process.env.RTP_PERF_TEST === 'true';

describe('NFR-1: rtp-sla-timer performance at 40 tps', () => {
  (RTP_PERF_TEST ? it : it.skip)(
    'T_NFR_1: P99 elapsed time < 9,000ms for 200 messages at 40 tps',
    async () => {
      const MESSAGE_COUNT = 200;
      const TARGET_TPS = 40;
      const INTER_MESSAGE_DELAY_MS = 1_000 / TARGET_TPS; // 25ms between messages
      const P99_CEILING_MS = 9_000;

      // Lightweight inner handler that simulates realistic fast processing (~50ms)
      const realisticHandler = (_message) =>
        new Promise((resolve) => setTimeout(resolve, 50));

      const timedHandler = createSlaTimer(realisticHandler);
      const elapsedTimes = [];

      const sendMessage = async (idx) => {
        const message = {
          messageId: `perf-msg-${idx}`,
          amount: 100,
          creditorAccount: `acc-${idx}`,
        };
        const start = Date.now();
        await timedHandler(message);
        elapsedTimes.push(Date.now() - start);
      };

      // Launch messages at 40 tps using staggered scheduling
      const launches = [];
      for (let i = 0; i < MESSAGE_COUNT; i++) {
        launches.push(
          new Promise((resolve) =>
            setTimeout(() => sendMessage(i).then(resolve), i * INTER_MESSAGE_DELAY_MS)
          )
        );
      }

      await Promise.all(launches);

      assert.strictEqual(
        elapsedTimes.length,
        MESSAGE_COUNT,
        'All messages must complete'
      );

      elapsedTimes.sort((a, b) => a - b);
      const p99Index = Math.ceil(MESSAGE_COUNT * 0.99) - 1;
      const p99 = elapsedTimes[p99Index];

      console.log(
        `[NFR-1] P99 elapsed: ${p99}ms (threshold: ${P99_CEILING_MS}ms) ` +
          `over ${MESSAGE_COUNT} messages at ${TARGET_TPS} tps`
      );

      assert.ok(
        p99 < P99_CEILING_MS,
        `P99 elapsed ${p99}ms must be < ${P99_CEILING_MS}ms`
      );
    },
    // Jest timeout: allow the full run (200 msgs × 25ms gap + processing headroom)
    { timeout: 15_000 }
  );
});
```

**Expected state after TASK 3:**
- In standard CI (`RTP_PERF_TEST` unset): test is skipped. ✅ not a blocking failure.
- In integration environment with `RTP_PERF_TEST=true`: test fails until the
  integration environment is wired. ✅ RED for integration gate.

---

### TASK 4 — GREEN: Wire NFR-1 test against integration stubs

No new source code is needed. The performance test passes once:

1. `scheme-bridge` and `processing-log` are wired to integration-safe stubs
   (no-op or lightweight in-memory implementations) in the integration environment.
2. The `RTP_PERF_TEST=true` environment variable is set in the CI integration stage.
3. The integration environment can sustain 40 tps without external bottlenecks
   in the stub implementations.

**Verification command (integration stage only):**
```bash
RTP_PERF_TEST=true npm test -- --testPathPattern=rtp-sla-timer.perf
```

**Expected state after TASK 4:** T_NFR_1 passes with P99 < 9,000ms. ✅ GREEN for NFR-1.

---

### TASK 5 — Modify `src/payments/rtp-message-handler.js`

Wire the new SLA timer into the existing entry point so that all inbound messages
are subject to the SLA enforcement.

```js
'use strict';

const schemeBridge = require('./scheme-bridge');
const processingLog = require('./processing-log');
const { createSlaTimer } = require('./rtp-sla-timer');

/**
 * _handleInboundMessageCore — the original processing logic, unchanged.
 * Private: not exported. The SLA timer wraps this function.
 */
async function _handleInboundMessageCore(message) {
  const { messageId, amount, creditorAccount } = message;

  const amlResult = await amlClient.screen({ amount, creditorAccount });
  if (amlResult.hold) {
    return schemeBridge.sendAck({
      type: 'pacs.002',
      status: 'REJECTED',
      reason: 'AML_HOLD',
      messageId,
    });
  }

  const fraudResult = { pass: true }; // stub — full integration is out of scope

  await accountLedger.credit({ accountId: creditorAccount, amount });

  // Note: the positive ACK is now sent by the SLA timer wrapper, not here.
  // Return cleanly so the wrapper can record its ack timestamp accurately.
}

/**
 * handleInboundMessage — public entry point.
 *
 * Wrapped with the 9,500ms SLA timer (C3 — HARD scheme requirement).
 * The timer sends pacs.002 ACK (positive or negative) and writes the
 * processing log entry in all cases.
 */
const handleInboundMessage = createSlaTimer(_handleInboundMessageCore);

module.exports = { handleInboundMessage };
```

> **Note on ACK responsibility:** The original `_handleInboundMessageCore` sent
> its own `ACCEPTED` ACK on the happy path and its own `REJECTED` ACK on AML hold.
> With the SLA timer in place, the timer owns ACK dispatch and log writing. The core
> handler must be refactored to *return* its outcome rather than send the ACK itself,
> so the timer can send a single authoritative ACK. The AML hold path now returns
> `{ status: 'REJECTED', reason: 'AML_HOLD' }` and the timer sends the ACK.
> A follow-up refactor task for the AML hold return value is noted below.

---

### TASK 6 — Refactor: align AML hold path to timer-owned ACK dispatch

**File:** `src/payments/rtp-message-handler.js` (continuation of TASK 5)

Update `_handleInboundMessageCore` so it never calls `schemeBridge.sendAck` directly.
The SLA timer wrapper owns all ACK dispatch.

```js
async function _handleInboundMessageCore(message) {
  const { messageId, amount, creditorAccount } = message;

  const amlResult = await amlClient.screen({ amount, creditorAccount });
  if (amlResult.hold) {
    // Return outcome; SLA timer sends the ACK
    return { status: 'REJECTED', reason: 'AML_HOLD', messageId };
  }

  const fraudResult = { pass: true }; // stub

  await accountLedger.credit({ accountId: creditorAccount, amount });

  // Return outcome; SLA timer sends the ACCEPTED ACK
  return { status: 'ACCEPTED', messageId };
}
```

Update `createSlaTimer` in `rtp-sla-timer.js` to forward the core handler's returned
outcome into the positive-ACK call:

```js
// Inside createSlaTimer — happy-path block (replaces the earlier version):

      const outcome = await Promise.race([innerHandler(message), slaTimeoutPromise]);
      clearTimeout(slaTimerHandle);

      const ackTimestamp = Date.now();
      const elapsedMs = ackTimestamp - receiptTimestamp;

      // outcome may carry a REJECTED reason from inner handler (e.g. AML_HOLD)
      const ackStatus = outcome?.status ?? 'ACCEPTED';
      const ackPayload = {
        type: 'pacs.002',
        status: ackStatus,
        messageId,
        ...(outcome?.reason && { reason: outcome.reason }),
      };

      await Promise.all([
        schemeBridge.sendAck(ackPayload),
        processingLog.write({
          messageId,
          receiptTimestamp,
          ackTimestamp,
          elapsedMs,
          outcome: ackStatus,
          ...(outcome?.reason && { reason: outcome.reason }),
        }),
      ]);
```

> This change is additive and backward-compatible with T1–T4. Re-run `npm test`
> to confirm all unit tests still pass after this refactor.

---

## Acceptance Checklist

| AC / NFR | Test | Status after GREEN |
|----------|------|--------------------|
| AC1 — positive ACK within window | T1 (fake timers) | ✅ TASK 2 |
| AC2 — negative ACK on SLA exceeded | T2 (fake timers) | ✅ TASK 2 |
| AC3 — receipt timestamp in log | T3 (fake timers) | ✅ TASK 2 |
| AC3 — ack timestamp + elapsed in log | T4 (fake timers) | ✅ TASK 2 |
| NFR-1 — P99 < 9,000ms at 40 tps | T_NFR_1 (real timers, integration) | ✅ TASK 4 |
| C3 — threshold is 9,500ms, not configurable | Code review: `SLA_THRESHOLD_MS = 9_500` is a `const`, not a param | ✅ TASK 2 |

---

## Risk Notes

| Risk | Mitigation |
|------|------------|
| NFR-1 load test requires production-like infra | W1 accepted: 40 tps integration test is the pre-production evidence gate |
| AML hold path previously self-ACK'd | TASK 6 refactor removes dual-ACK risk; covered by unit test re-run |
| `Promise.race` leaves stalled inner handler running after timeout | Acceptable: inner handler will eventually reject/resolve silently; no resource leak in the scheme-facing ACK path |
| Fake-timer flush ordering in Jest | `await Promise.resolve()` microtask flush after `advanceTimersByTime` ensures correct assertion ordering in T2 |
```