Save path: artefacts/2026-06-13-payment-retry-processor/plans/retry.1-plan.md

---

# Implementation Plan — retry.1 Failure Classification

**Feature:** 2026-06-13-payment-retry-processor  
**Story:** retry.1 — Classify and route failed payments  
**Branch:** `feature/retry.1`  
**Test command:** `npm test`  

---

## Overview

This plan implements a pure `classifyFailure(payment)` function that reads `payment.failureCode` and returns a modified payment object with appropriate status and metadata. The implementation follows TDD: all tests are written first (RED phase), then implementation follows (GREEN phase).

---

## Task 1: Create test file with all failing tests (RED)

**File:** `tests/payments/failure-classifier.test.js`

```js
'use strict';

const { classifyFailure } = require('../../src/payments/failure-classifier');

describe('classifyFailure', () => {
  // AC1: Retryable codes
  describe('AC1 — Retryable failure codes', () => {
    test('T1: TIMEOUT maps to retryable status with retryCount 0', () => {
      const payment = { failureCode: 'TIMEOUT' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
    });

    test('T2: ISSUER_TEMP_UNAVAIL maps to retryable status with retryCount 0', () => {
      const payment = { failureCode: 'ISSUER_TEMP_UNAVAIL' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
    });
  });

  // AC2: Permanent codes
  describe('AC2 — Permanent failure codes', () => {
    test('T3: INSUFFICIENT_FUNDS maps to permanent status', () => {
      const payment = { failureCode: 'INSUFFICIENT_FUNDS' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('permanent');
    });

    test('T4: CARD_BLOCKED maps to permanent status', () => {
      const payment = { failureCode: 'CARD_BLOCKED' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('permanent');
    });

    test('T5: FRAUD_DECLINE maps to permanent status', () => {
      const payment = { failureCode: 'FRAUD_DECLINE' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('permanent');
    });
  });

  // AC3: Unknown codes
  describe('AC3 — Unknown failure codes', () => {
    test('T6: Unknown code maps to permanent status', () => {
      const payment = { failureCode: 'UNKNOWN_CODE_XYZ' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('permanent');
    });

    test('T7: Unknown code emits console.warn with the code', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const payment = { failureCode: 'UNKNOWN_CODE_XYZ' };
      classifyFailure(payment);
      expect(warnSpy).toHaveBeenCalledWith('UNKNOWN_CODE_XYZ');
      warnSpy.mockRestore();
    });
  });
});
```

**Rationale:**
- Tests follow the AC structure directly (AC1, AC2, AC3).
- Each test is granular and focuses on one assertion or behavior.
- T7 uses `jest.spyOn` to verify the console.warn side effect.
- All tests are written before implementation (TDD RED phase).

---

## Task 2: Implement the failure classifier function (GREEN)

**File:** `src/payments/failure-classifier.js`

```js
'use strict';

/**
 * Retryable failure codes — transient errors that may succeed on retry.
 */
const RETRYABLE_CODES = new Set([
  'TIMEOUT',
  'ISSUER_TEMP_UNAVAIL',
]);

/**
 * Permanent failure codes — errors that will not succeed on retry.
 */
const PERMANENT_CODES = new Set([
  'INSUFFICIENT_FUNDS',
  'CARD_BLOCKED',
  'FRAUD_DECLINE',
]);

/**
 * Classify a failed payment by its failure code and assign appropriate status.
 *
 * @param {Object} payment — Payment object with at least a `failureCode` property.
 * @returns {Object} Modified payment object with `status` and `retryCount` set.
 *
 * Behavior:
 * - If failureCode is in RETRYABLE_CODES: status='retryable', retryCount=0
 * - If failureCode is in PERMANENT_CODES: status='permanent'
 * - If failureCode is unknown: status='permanent', console.warn emitted
 */
function classifyFailure(payment) {
  const { failureCode } = payment;

  if (RETRYABLE_CODES.has(failureCode)) {
    return {
      ...payment,
      status: 'retryable',
      retryCount: 0,
    };
  }

  if (PERMANENT_CODES.has(failureCode)) {
    return {
      ...payment,
      status: 'permanent',
    };
  }

  // Unknown code: treat as permanent and warn
  console.warn(failureCode);
  return {
    ...payment,
    status: 'permanent',
  };
}

module.exports = { classifyFailure };
```

**Rationale:**
- Uses `Set` for O(1) lookup performance.
- Retryable codes set `retryCount: 0` as specified in AC1.
- Permanent codes and unknown codes both set `status: 'permanent'`.
- Unknown codes emit `console.warn(failureCode)` as specified in AC3.
- Function is pure (no side effects except the intentional warn) and stateless.
- Spreads incoming payment object to preserve any other properties.

---

## Task 3: Verify all tests pass (GREEN)

**Command:** `npm test -- tests/payments/failure-classifier.test.js`

**Expected output:**
```
 PASS  tests/payments/failure-classifier.test.js
  classifyFailure
    AC1 — Retryable failure codes
      ✓ T1: TIMEOUT maps to retryable status with retryCount 0
      ✓ T2: ISSUER_TEMP_UNAVAIL maps to retryable status with retryCount 0
    AC2 — Permanent failure codes
      ✓ T3: INSUFFICIENT_FUNDS maps to permanent status
      ✓ T4: CARD_BLOCKED maps to permanent status
      ✓ T5: FRAUD_DECLINE maps to permanent status
    AC3 — Unknown failure codes
      ✓ T6: Unknown code maps to permanent status
      ✓ T7: Unknown code emits console.warn with the code

7 passed (23ms)
```

---

## Integration Notes

The `classifyFailure` function integrates cleanly with the existing `FailedPaymentsQueue.processNext(classifyFn)` pattern in `src/payments/queue.js`:

```js
const queue = new FailedPaymentsQueue();
queue.enqueue({ id: '123', failureCode: 'TIMEOUT', amount: 100 });
const classified = queue.processNext(classifyFailure);
// classified = { id: '123', failureCode: 'TIMEOUT', amount: 100, status: 'retryable', retryCount: 0 }
```

---

## Acceptance Criteria Coverage

| AC | Test(s) | Status |
|----|---------|--------|
| AC1 — retryable code → retryable status + retryCount=0 | T1, T2 | ✅ COVERED |
| AC2 — permanent code → permanent status | T3, T4, T5 | ✅ COVERED |
| AC3 — unknown code → permanent + console.warn | T6, T7 | ✅ COVERED |

---

## Files Modified / Created

| File | Type | Purpose |
|------|------|---------|
| `tests/payments/failure-classifier.test.js` | Create | Unit tests (7 tests covering all ACs) |
| `src/payments/failure-classifier.js` | Create | Implementation of `classifyFailure` function |

---

## Success Criteria

✅ All 7 tests pass  
✅ No implementation before tests (TDD order maintained)  
✅ All ACs verified by unit tests  
✅ No external dependencies or network calls  
✅ No retry scheduling or exponential backoff (out of scope)  
✅ Function is pure and stateless  

---

**Estimated effort:** 30 minutes  
**Risk level:** Low  
**Dependencies:** None (pure function)