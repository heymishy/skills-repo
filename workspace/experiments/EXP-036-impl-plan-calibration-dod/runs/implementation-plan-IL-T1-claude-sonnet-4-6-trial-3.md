Save path: artefacts/2026-06-13-payment-retry-processor/plans/retry.1-plan.md

```markdown
# Implementation Plan — retry.1: Classify and Route Failed Payments

**Feature:** 2026-06-13-payment-retry-processor
**Story:** retry.1
**Branch:** `feature/retry.1`
**Oversight:** Low
**Test command:** `npm test`

---

## Overview

Implement a pure, stateless `classifyFailure(payment)` function exported from
`src/payments/failure-classifier.js`. The function inspects `payment.failureCode`
and returns a new payment object stamped with either `status: "retryable"` (plus
`retryCount: 0`) or `status: "permanent"`. Unknown codes are treated as permanent
and emit a `console.warn`.

No retry scheduling, queue persistence, or network calls are in scope.

---

## Files Touched

| Action | Path |
|--------|------|
| Create | `tests/payments/failure-classifier.test.js` |
| Create | `src/payments/failure-classifier.js` |

---

## Task Sequence

Tasks are ordered RED → GREEN per the TDD protocol. The test file is written
first and must fail before any implementation exists.

---

### Task 1 — Write the failing test suite (RED)

**File:** `tests/payments/failure-classifier.test.js`

```js
'use strict';

const { classifyFailure } = require('../../src/payments/failure-classifier');

describe('classifyFailure', () => {

  // ── AC1: retryable codes ──────────────────────────────────────────────────

  describe('AC1 — retryable failure codes', () => {
    test('T1: TIMEOUT → status retryable, retryCount 0', () => {
      const result = classifyFailure({ failureCode: 'TIMEOUT' });
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
    });

    test('T2: ISSUER_TEMP_UNAVAIL → status retryable, retryCount 0', () => {
      const result = classifyFailure({ failureCode: 'ISSUER_TEMP_UNAVAIL' });
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
    });

    test('T1-extra: original payment fields are preserved for retryable', () => {
      const result = classifyFailure({ failureCode: 'TIMEOUT', id: 'pay_001', amount: 99 });
      expect(result.id).toBe('pay_001');
      expect(result.amount).toBe(99);
    });
  });

  // ── AC2: permanent codes ──────────────────────────────────────────────────

  describe('AC2 — permanent failure codes', () => {
    test('T3: INSUFFICIENT_FUNDS → status permanent', () => {
      const result = classifyFailure({ failureCode: 'INSUFFICIENT_FUNDS' });
      expect(result.status).toBe('permanent');
    });

    test('T4: CARD_BLOCKED → status permanent', () => {
      const result = classifyFailure({ failureCode: 'CARD_BLOCKED' });
      expect(result.status).toBe('permanent');
    });

    test('T5: FRAUD_DECLINE → status permanent', () => {
      const result = classifyFailure({ failureCode: 'FRAUD_DECLINE' });
      expect(result.status).toBe('permanent');
    });

    test('T2-extra: original payment fields are preserved for permanent', () => {
      const result = classifyFailure({ failureCode: 'CARD_BLOCKED', id: 'pay_002' });
      expect(result.id).toBe('pay_002');
    });
  });

  // ── AC3: unknown codes ────────────────────────────────────────────────────

  describe('AC3 — unknown failure codes', () => {
    let warnSpy;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    test('T6: unknown code → status permanent', () => {
      const result = classifyFailure({ failureCode: 'SOME_WEIRD_CODE' });
      expect(result.status).toBe('permanent');
    });

    test('T7: unknown code → console.warn emitted with the unknown code', () => {
      classifyFailure({ failureCode: 'SOME_WEIRD_CODE' });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SOME_WEIRD_CODE')
      );
    });

    test('T6-extra: retryCount is NOT set for unknown/permanent codes', () => {
      const result = classifyFailure({ failureCode: 'UNKNOWN_CODE' });
      expect(result.retryCount).toBeUndefined();
    });
  });

});
```

**Expected state after this task:** All tests fail with
`Cannot find module '../../src/payments/failure-classifier'`.

---

### Task 2 — Implement `classifyFailure` (GREEN)

**File:** `src/payments/failure-classifier.js`

```js
'use strict';

/**
 * Codes that indicate a transient failure; the payment may be retried.
 * @type {ReadonlySet<string>}
 */
const RETRYABLE_CODES = new Set([
  'TIMEOUT',
  'ISSUER_TEMP_UNAVAIL',
]);

/**
 * Codes that indicate a permanent failure; the payment must not be retried.
 * @type {ReadonlySet<string>}
 */
const PERMANENT_CODES = new Set([
  'INSUFFICIENT_FUNDS',
  'CARD_BLOCKED',
  'FRAUD_DECLINE',
]);

/**
 * Classify a failed payment by its failure code and return a new payment
 * object stamped with the appropriate status.
 *
 * - Known retryable code → `{ ...payment, status: 'retryable', retryCount: 0 }`
 * - Known permanent code → `{ ...payment, status: 'permanent' }`
 * - Unknown code         → `{ ...payment, status: 'permanent' }` + console.warn
 *
 * The input object is never mutated.
 *
 * @param {{ failureCode: string, [key: string]: any }} payment
 * @returns {{ status: string, [key: string]: any }}
 */
function classifyFailure(payment) {
  const { failureCode } = payment;

  if (RETRYABLE_CODES.has(failureCode)) {
    return { ...payment, status: 'retryable', retryCount: 0 };
  }

  if (PERMANENT_CODES.has(failureCode)) {
    return { ...payment, status: 'permanent' };
  }

  // Unknown code — treat as permanent and alert for investigation
  console.warn(
    `classifyFailure: unknown failureCode "${failureCode}" — defaulting to permanent`
  );
  return { ...payment, status: 'permanent' };
}

module.exports = { classifyFailure, RETRYABLE_CODES, PERMANENT_CODES };
```

**Expected state after this task:** All 10 tests pass.

---

### Task 3 — Verify and confirm no scope creep

Checklist before marking the story done:

- [ ] `npm test` exits 0 with all tests green
- [ ] `src/payments/failure-classifier.js` contains **no** retry scheduling,
      backoff, queue writes, or network calls
- [ ] `src/payments/queue.js` is **unchanged**
- [ ] No new dependencies added to `package.json`
- [ ] JSDoc accurately describes the contract

---

## Design Notes

### Why `new Set(...)` for code lists?
O(1) lookup; easy to extend without changing the branching logic.

### Why export `RETRYABLE_CODES` / `PERMANENT_CODES`?
Allows retry.2 (backoff scheduler) and any future story to import the
canonical sets without duplicating them, while keeping the classifier as the
single source of truth.

### Input immutability
`{ ...payment, ... }` spread ensures the caller's object is never mutated,
which is important when `FailedPaymentsQueue.processNext` passes a queued
entry — the original entry must not be modified until the queue itself
decides to replace it.

### `console.warn` message format
The warn string deliberately includes the unknown code value so that log
aggregators (e.g. CloudWatch Logs Insights) can extract it with a simple
field filter without needing a structured logger (out of scope for this story).

---

## Acceptance Criteria Cross-Reference

| AC | Covered by | Status after Task 2 |
|----|-----------|---------------------|
| AC1 | T1, T2, T1-extra | ✅ |
| AC2 | T3, T4, T5, T2-extra | ✅ |
| AC3 | T6, T7, T6-extra | ✅ |
```