Save path: artefacts/2026-06-13-payment-retry-processor/plans/retry.1-plan.md

```markdown
# Implementation Plan — retry.1: Classify and Route Failed Payments

**Feature:** 2026-06-13-payment-retry-processor
**Story:** retry.1
**Branch:** `feature/retry.1`
**Oversight level:** Low
**Test command:** `npm test`

---

## Overview

Implement a pure, stateless `classifyFailure(payment)` function exported from
`src/payments/failure-classifier.js`. The function maps `payment.failureCode`
to a `status` of `"retryable"` (with `retryCount: 0`) or `"permanent"`, and
emits `console.warn` for unknown codes.

Two files will be created; no existing files will be modified.

---

## File Inventory

| Action | Path |
|--------|------|
| CREATE | `tests/payments/failure-classifier.test.js` |
| CREATE | `src/payments/failure-classifier.js` |

---

## Task Sequence

Tasks are ordered RED → GREEN per TDD protocol.
Each test task must be completed (and failing) before its paired implementation task.

---

### Task 1 — RED: Write failing tests for `classifyFailure`

**File:** `tests/payments/failure-classifier.test.js`

```js
'use strict';

const { classifyFailure } = require('../../src/payments/failure-classifier');

describe('classifyFailure', () => {

  // ── AC1: Retryable failure codes ────────────────────────────────────────

  describe('AC1 — retryable codes', () => {
    test('T1: TIMEOUT maps to status "retryable" with retryCount 0', () => {
      const payment = { id: 'p1', failureCode: 'TIMEOUT' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
    });

    test('T2: ISSUER_TEMP_UNAVAIL maps to status "retryable" with retryCount 0', () => {
      const payment = { id: 'p2', failureCode: 'ISSUER_TEMP_UNAVAIL' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
    });
  });

  // ── AC2: Permanent failure codes ────────────────────────────────────────

  describe('AC2 — permanent codes', () => {
    test('T3: INSUFFICIENT_FUNDS maps to status "permanent"', () => {
      const payment = { id: 'p3', failureCode: 'INSUFFICIENT_FUNDS' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('permanent');
    });

    test('T4: CARD_BLOCKED maps to status "permanent"', () => {
      const payment = { id: 'p4', failureCode: 'CARD_BLOCKED' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('permanent');
    });

    test('T5: FRAUD_DECLINE maps to status "permanent"', () => {
      const payment = { id: 'p5', failureCode: 'FRAUD_DECLINE' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('permanent');
    });
  });

  // ── AC3: Unknown failure codes ──────────────────────────────────────────

  describe('AC3 — unknown codes', () => {
    let warnSpy;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    test('T6: unknown code maps to status "permanent"', () => {
      const payment = { id: 'p6', failureCode: 'SOME_UNKNOWN_CODE' };
      const result = classifyFailure(payment);
      expect(result.status).toBe('permanent');
    });

    test('T7: unknown code triggers console.warn with the unknown code string', () => {
      const payment = { id: 'p7', failureCode: 'ANOTHER_UNKNOWN' };
      classifyFailure(payment);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('ANOTHER_UNKNOWN');
    });
  });

  // ── Structural contract ─────────────────────────────────────────────────

  describe('return-value contract', () => {
    test('returns a new object, not the original payment reference', () => {
      const payment = { id: 'p8', failureCode: 'TIMEOUT' };
      const result = classifyFailure(payment);
      expect(result).not.toBe(payment);
    });

    test('retryable result does NOT carry retryCount on a permanent classification', () => {
      const payment = { id: 'p9', failureCode: 'CARD_BLOCKED' };
      const result = classifyFailure(payment);
      expect(result.retryCount).toBeUndefined();
    });

    test('preserves all other payment fields on the returned object', () => {
      const payment = { id: 'p10', amount: 9900, failureCode: 'TIMEOUT' };
      const result = classifyFailure(payment);
      expect(result.id).toBe('p10');
      expect(result.amount).toBe(9900);
    });
  });
});
```

**Expected state after this task:** All tests fail with
`Cannot find module '../../src/payments/failure-classifier'`.

---

### Task 2 — GREEN: Implement `classifyFailure`

**File:** `src/payments/failure-classifier.js`

```js
'use strict';

/**
 * Failure codes that indicate a transient error.
 * Payments with these codes may be retried.
 */
const RETRYABLE_CODES = new Set([
  'TIMEOUT',
  'ISSUER_TEMP_UNAVAIL',
]);

/**
 * Failure codes that indicate a permanent error.
 * Payments with these codes must not be retried.
 */
const PERMANENT_CODES = new Set([
  'INSUFFICIENT_FUNDS',
  'CARD_BLOCKED',
  'FRAUD_DECLINE',
]);

/**
 * Classifies a failed payment by its `failureCode` and returns a new payment
 * object with an updated `status` field (and `retryCount: 0` for retryable
 * payments).
 *
 * Unknown failure codes are treated as permanent and trigger a console.warn.
 *
 * @param {Object} payment - The payment object to classify.
 * @param {string} payment.failureCode - The failure code from the payment processor.
 * @returns {Object} A new payment object with `status` (and optionally `retryCount`) set.
 */
function classifyFailure(payment) {
  const { failureCode } = payment;

  if (RETRYABLE_CODES.has(failureCode)) {
    return { ...payment, status: 'retryable', retryCount: 0 };
  }

  if (!PERMANENT_CODES.has(failureCode)) {
    // Unknown code — treat as permanent and warn the operator.
    console.warn(failureCode);
  }

  return { ...payment, status: 'permanent' };
}

module.exports = { classifyFailure, RETRYABLE_CODES, PERMANENT_CODES };
```

**Expected state after this task:** All tests pass; `npm test` exits 0.

---

## Acceptance Criteria Coverage

| AC | Tasks | Tests |
|----|-------|-------|
| AC1 — retryable code → `{ status: 'retryable', retryCount: 0 }` | Task 1 (T1, T2) → Task 2 | T1, T2 |
| AC2 — permanent code → `{ status: 'permanent' }` | Task 1 (T3–T5) → Task 2 | T3, T4, T5 |
| AC3 — unknown code → `{ status: 'permanent' }` + `console.warn` | Task 1 (T6, T7) → Task 2 | T6, T7 |

---

## Scope Boundary Confirmation

The following are explicitly **out of scope** for this story and must not appear
in the implementation:

- Retry scheduling or exponential backoff (`retry.2`)
- Modifications to `src/payments/queue.js`
- Network calls, database writes, or any I/O
- PCI-DSS-sensitive data handling

---

## Definition of Done Checklist

- [ ] `tests/payments/failure-classifier.test.js` created with all 10 tests
- [ ] All 10 tests fail before implementation file exists (RED confirmed)
- [ ] `src/payments/failure-classifier.js` created
- [ ] All 10 tests pass after implementation (GREEN confirmed)
- [ ] `npm test` exits 0 with no skipped tests
- [ ] No existing files modified
- [ ] No out-of-scope functionality introduced
```