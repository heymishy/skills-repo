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

Implement a pure, synchronous `classifyFailure(payment)` function exported from
`src/payments/failure-classifier.js`. The function inspects `payment.failureCode`
and returns a new payment object annotated with `status` (and `retryCount` where
applicable). No external dependencies, no side-effects beyond a `console.warn`
for unknown codes.

---

## Touch Points

| Action | Path |
|--------|------|
| CREATE | `tests/payments/failure-classifier.test.js` |
| CREATE | `src/payments/failure-classifier.js` |

---

## Task Sequence

### TASK 1 — Write failing tests (RED)

**File:** `tests/payments/failure-classifier.test.js`

```js
'use strict';

const { classifyFailure } = require('../../src/payments/failure-classifier');

describe('classifyFailure', () => {

  // ── AC1: retryable codes ────────────────────────────────────────────────

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

    test('T1-shape: original payment fields are preserved', () => {
      const result = classifyFailure({ failureCode: 'TIMEOUT', id: 'pay_001', amount: 99 });
      expect(result.id).toBe('pay_001');
      expect(result.amount).toBe(99);
    });
  });

  // ── AC2: permanent codes ────────────────────────────────────────────────

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

    test('T2-shape: permanent result does NOT set retryCount', () => {
      const result = classifyFailure({ failureCode: 'INSUFFICIENT_FUNDS' });
      expect(result.retryCount).toBeUndefined();
    });
  });

  // ── AC3: unknown codes ──────────────────────────────────────────────────

  describe('AC3 — unknown failure codes', () => {
    let warnSpy;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    test('T6: unknown code → status permanent', () => {
      const result = classifyFailure({ failureCode: 'SOME_UNKNOWN_CODE' });
      expect(result.status).toBe('permanent');
    });

    test('T7: unknown code → console.warn emitted with the unknown code', () => {
      classifyFailure({ failureCode: 'SOME_UNKNOWN_CODE' });
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('SOME_UNKNOWN_CODE')
      );
    });

    test('T7-extra: known codes do NOT trigger console.warn', () => {
      classifyFailure({ failureCode: 'TIMEOUT' });
      classifyFailure({ failureCode: 'INSUFFICIENT_FUNDS' });
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

});
```

**Expected result:** All 10 tests fail with `Cannot find module
'../../src/payments/failure-classifier'` — confirming RED state.

---

### TASK 2 — Write the implementation (GREEN)

**File:** `src/payments/failure-classifier.js`

```js
'use strict';

/**
 * Failure codes that are safe to retry (transient / infrastructure errors).
 * @type {Set<string>}
 */
const RETRYABLE_CODES = new Set([
  'TIMEOUT',
  'ISSUER_TEMP_UNAVAIL',
]);

/**
 * Failure codes that are permanent (no value in retrying).
 * @type {Set<string>}
 */
const PERMANENT_CODES = new Set([
  'INSUFFICIENT_FUNDS',
  'CARD_BLOCKED',
  'FRAUD_DECLINE',
]);

/**
 * Classify a failed payment by its failure code.
 *
 * Returns a new payment object (original is not mutated) with:
 *   - status: "retryable" + retryCount: 0   for transient failure codes
 *   - status: "permanent"                    for hard failure codes or
 *                                            any unrecognised code
 *
 * A console.warn is emitted when the failure code is not in either
 * known set, to surface unexpected codes during operations.
 *
 * @param  {object} payment
 * @param  {string} payment.failureCode
 * @returns {object} classified payment (shallow copy, never mutates input)
 */
function classifyFailure(payment) {
  const { failureCode } = payment;

  if (RETRYABLE_CODES.has(failureCode)) {
    return { ...payment, status: 'retryable', retryCount: 0 };
  }

  if (!PERMANENT_CODES.has(failureCode)) {
    // Unknown code — treat conservatively as permanent but alert operators.
    console.warn(
      `[failure-classifier] Unknown failure code encountered: ${failureCode}. ` +
      `Classifying as permanent.`
    );
  }

  return { ...payment, status: 'permanent' };
}

module.exports = { classifyFailure };
```

**Expected result:** All 10 tests pass — GREEN state achieved.

---

### TASK 3 — Verify scope boundary (static check, no new files)

Confirm by inspection that the implementation:

- [ ] Contains **no** `require` / `import` of external modules
- [ ] Does **not** import or reference `queue.js`
- [ ] Does **not** implement scheduling, backoff, or timers
- [ ] Does **not** make network calls
- [ ] Mutates **nothing** — always returns a shallow copy via spread

---

## Acceptance Criteria Coverage Map

| AC | Tests | Status |
|----|-------|--------|
| AC1 — retryable codes | T1, T2, T1-shape | Covered |
| AC2 — permanent codes | T3, T4, T5, T2-shape | Covered |
| AC3 — unknown code → permanent + warn | T6, T7, T7-extra | Covered |

---

## Definition of Done

- [ ] `tests/payments/failure-classifier.test.js` created and committed first
- [ ] All 10 tests pass under `npm test` with no skips
- [ ] `src/payments/failure-classifier.js` created
- [ ] No files outside the two touch points are modified
- [ ] `console.warn` is never triggered by known retryable or permanent codes
- [ ] PR targets branch `feature/retry.1`
```