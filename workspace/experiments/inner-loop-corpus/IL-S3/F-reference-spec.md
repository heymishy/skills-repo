# IL-S3 Reference Implementation Spec — rtp.3

**Expected task count:** 4
**Difficulty:** MEDIUM
**Primary evaluation risk:** IP5 (NFR-1 P99 assertion must appear in task 4 — models may omit it thinking T_NFR_1 is "infrastructure only")

---

## Expected task structure

| Task | Description | Files |
|------|-------------|-------|
| Task 1 | Create failing unit tests for T1–T4 | `tests/payments/rtp-sla-timer.test.js` (RED) |
| Task 2 | Create `rtp-sla-timer.js` module with `Promise.race` wrapper | `src/payments/rtp-sla-timer.js` |
| Task 3 | Modify `rtp-message-handler.js` to use the timer wrapper | `src/payments/rtp-message-handler.js` |
| Task 4 | Add NFR-1 performance test (T_NFR_1) and verify P99 < 9,000ms | `tests/payments/rtp-sla-timer.test.js` (NFR-1 section) |

---

## Correct implementation

### `src/payments/rtp-sla-timer.js`

```javascript
'use strict';

const SLA_TRIGGER_MS = 9500;

function withSlaTimer(handler, schemeBridge, processingLog) {
  return async function slaEnforcedHandler(message) {
    const receiptTimestamp = Date.now();
    processingLog.write({ messageId: message.messageId, receiptTimestamp });

    let timerHandle;
    const slaTimeoutPromise = new Promise((resolve) => {
      timerHandle = setTimeout(() => {
        resolve({ timedOut: true });
      }, SLA_TRIGGER_MS);
    });

    const result = await Promise.race([
      handler(message).then((r) => ({ timedOut: false, result: r })),
      slaTimeoutPromise,
    ]);

    clearTimeout(timerHandle);

    const ackTimestamp = Date.now();
    const elapsedMs = ackTimestamp - receiptTimestamp;

    if (result.timedOut) {
      processingLog.write({ messageId: message.messageId, ackTimestamp, elapsedMs, event: 'SCHEME_SLA_EXCEEDED' });
      return schemeBridge.sendAck({ type: 'pacs.002', status: 'REJECTED', reason: 'SCHEME_SLA_EXCEEDED', messageId: message.messageId });
    }

    processingLog.write({ messageId: message.messageId, ackTimestamp, elapsedMs, event: 'ACCEPTED' });
    return result.result;
  };
}

module.exports = { withSlaTimer, SLA_TRIGGER_MS };
```

---

## Negative controls (IP2 categorical fail triggers)

| Trigger | Expected model behaviour | Expected IP2 score |
|---------|--------------------------|-------------------|
| Model adds retry logic on SLA timeout | IP2 = 0.0 — scheme rule requires sending negative ACK immediately; retrying delays the ACK beyond the 10-second deadline | 0.0 |
| Model references live fraud vendor API integration | IP2 = 0.0 — explicitly out of scope per DoR Contract Proposal | 0.0 |
| Model adds a SWIFT RTGS fallback path | IP2 = 0.0 — no SWIFT routing in this story; that is IL-S13 context | 0.0 |

---

## Negative controls (IP4 TDD discipline fail triggers)

| Trigger | Expected model behaviour | Expected IP4 score |
|---------|--------------------------|-------------------|
| Implementation created before tests | IP4 < 0.5 — RED phase must precede implementation | < 0.5 |
| T_NFR_1 added after tests pass without RED state | IP4 < 0.8 — NFR-1 test must start in RED, then implementation makes it GREEN | < 0.8 |

---

## Negative controls (IP5 NFR inheritance fail triggers)

| Trigger | Expected model behaviour | Expected IP5 score |
|---------|--------------------------|-------------------|
| NFR-1 P99 assertion not present in task 4 | IP5 = 0.0 — model deferred performance evidence to "go-live gate" | 0.0 |
| SLA_TRIGGER_MS set to 10000 (not 9500) | IP5 partial — 500ms buffer is part of the NFR; 10,000ms threshold gives no buffer before the scheme deadline | 0.3 |

---

## DoD expected verdict

**COMPLETE** — all 5 tests (T1–T4 + T_NFR_1) pass; AC1, AC2, AC3, NFR-1 satisfied; no out-of-scope scope.
