# IL-T1 Reference Implementation Spec — retry.1

## What a correct implementation plan should contain

**Expected task count:** 3 tasks (one per AC; T6+T7 can share a task for AC3)

**Required file paths:**
- Create: `src/payments/failure-classifier.js`
- Create: `tests/payments/failure-classifier.test.js`

**Required NFR implementation steps:** None (no NFRs defined for this story)

**Constraint that must appear in at least one task:**
- AC3 fail-safe: unknown codes must default to `permanent` (the safe choice — never retry an unknown failure code)
- `console.warn` emission is part of the AC, not optional

**Expected implementation structure in Task 1 (or equivalent):**

```javascript
// src/payments/failure-classifier.js
'use strict';

const RETRYABLE_CODES = new Set(['TIMEOUT', 'ISSUER_TEMP_UNAVAIL']);
const PERMANENT_CODES = new Set(['INSUFFICIENT_FUNDS', 'CARD_BLOCKED', 'FRAUD_DECLINE']);

function classifyFailure(payment) {
  const { failureCode } = payment;
  if (RETRYABLE_CODES.has(failureCode)) {
    return { ...payment, status: 'retryable', retryCount: 0 };
  }
  if (!PERMANENT_CODES.has(failureCode)) {
    console.warn(`[failure-classifier] Unknown failure code: ${failureCode} — defaulting to permanent`);
  }
  return { ...payment, status: 'permanent' };
}

module.exports = { classifyFailure };
```

**Expected test structure:**

```javascript
// tests/payments/failure-classifier.test.js
const { classifyFailure } = require('../../src/payments/failure-classifier');

const basePayment = { id: 'pay_123', amount: 100, merchantId: 'merch_1', failureCode: null };

describe('classifyFailure', () => {
  test('TIMEOUT → retryable with retryCount 0', () => {
    const result = classifyFailure({ ...basePayment, failureCode: 'TIMEOUT' });
    expect(result.status).toBe('retryable');
    expect(result.retryCount).toBe(0);
  });
  // ... T2 through T7 follow same pattern
});
```

---

## Negative controls: what a weak plan will fabricate or miss

1. **Fabrication:** Implementing exponential backoff delay logic (e.g. `backoffMs = Math.pow(2, retryCount) * 1000`) — this is retry.2 scope
2. **Fabrication:** Adding a circuit breaker counter that disables retries after N failures — explicitly deferred
3. **Omission:** AC3 unknown-code warn step: a weak plan covers AC1 and AC2 but writes a single AC3 test without the `console.warn` check (T7)
4. **Omission:** Task granularity too coarse — "implement classifier" as a single task without discrete failing-test step for each AC (IP4 failure)
5. **IP2 categorical fail signal:** If the plan includes any task that modifies `src/payments/queue.js` to add retry scheduling — this is scope beyond the DoR
