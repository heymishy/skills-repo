Save path: artefacts/2026-06-13-payment-retry-processor/plans/retry.1-plan.md

---

# Implementation Plan — retry.1 Failure Classification

**Feature:** 2026-06-13-payment-retry-processor  
**Story:** retry.1 — Classify and route failed payments  
**Branch:** `feature/retry.1`  
**Test command:** `npm test`  
**Oversight:** Low

---

## Overview

Implement a pure synchronous `classifyFailure(payment)` function that reads `payment.failureCode` and returns a modified payment object with appropriate status and metadata. This function will be the entry point for routing failed payments to either retry or permanent review queues.

---

## Task 1: AC1 — Retryable Failure Codes (TIMEOUT, ISSUER_TEMP_UNAVAIL)

### 1.1 RED — Test: TIMEOUT maps to retryable status

**File:** `tests/payments/failure-classifier.test.js`

```javascript
describe('classifyFailure', () => {
  describe('AC1 — Retryable codes', () => {
    it('T1: should classify TIMEOUT as retryable with retryCount 0', () => {
      const payment = { id: 'pay_123', failureCode: 'TIMEOUT' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
      expect(result.id).toBe('pay_123'); // original properties preserved
    });
  });
});
```

### 1.2 RED — Test: ISSUER_TEMP_UNAVAIL maps to retryable status

**File:** `tests/payments/failure-classifier.test.js`

```javascript
    it('T2: should classify ISSUER_TEMP_UNAVAIL as retryable with retryCount 0', () => {
      const payment = { id: 'pay_456', failureCode: 'ISSUER_TEMP_UNAVAIL' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
      expect(result.id).toBe('pay_456');
    });
```

### 1.3 GREEN — Implementation: Retryable codes

**File:** `src/payments/failure-classifier.js`

```javascript
'use strict';

const RETRYABLE_CODES = new Set([
  'TIMEOUT',
  'ISSUER_TEMP_UNAVAIL',
]);

const PERMANENT_CODES = new Set([
  'INSUFFICIENT_FUNDS',
  'CARD_BLOCKED',
  'FRAUD_DECLINE',
]);

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
  
  // Unknown code: permanent + warn
  console.warn(`Unknown payment failure code: ${failureCode}`);
  return {
    ...payment,
    status: 'permanent',
  };
}

module.exports = { classifyFailure };
```

---

## Task 2: AC2 — Permanent Failure Codes (INSUFFICIENT_FUNDS, CARD_BLOCKED, FRAUD_DECLINE)

### 2.1 RED — Test: INSUFFICIENT_FUNDS maps to permanent status

**File:** `tests/payments/failure-classifier.test.js`

```javascript
  describe('AC2 — Permanent codes', () => {
    it('T3: should classify INSUFFICIENT_FUNDS as permanent', () => {
      const payment = { id: 'pay_789', failureCode: 'INSUFFICIENT_FUNDS' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('permanent');
      expect(result.id).toBe('pay_789');
    });
```

### 2.2 RED — Test: CARD_BLOCKED maps to permanent status

**File:** `tests/payments/failure-classifier.test.js`

```javascript
    it('T4: should classify CARD_BLOCKED as permanent', () => {
      const payment = { id: 'pay_101', failureCode: 'CARD_BLOCKED' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('permanent');
      expect(result.id).toBe('pay_101');
    });
```

### 2.3 RED — Test: FRAUD_DECLINE maps to permanent status

**File:** `tests/payments/failure-classifier.test.js`

```javascript
    it('T5: should classify FRAUD_DECLINE as permanent', () => {
      const payment = { id: 'pay_202', failureCode: 'FRAUD_DECLINE' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('permanent');
      expect(result.id).toBe('pay_202');
    });
  });
```

### 2.4 GREEN — Implementation already covers AC2

The implementation in Task 1.3 already handles all permanent codes via the `PERMANENT_CODES` set. No additional code needed.

---

## Task 3: AC3 — Unknown Failure Codes

### 3.1 RED — Test: Unknown code maps to permanent status

**File:** `tests/payments/failure-classifier.test.js`

```javascript
  describe('AC3 — Unknown codes', () => {
    it('T6: should classify unknown code as permanent', () => {
      const payment = { id: 'pay_999', failureCode: 'UNKNOWN_ERROR_XYZ' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('permanent');
      expect(result.id).toBe('pay_999');
    });
```

### 3.2 RED — Test: Unknown code triggers console.warn

**File:** `tests/payments/failure-classifier.test.js`

```javascript
    it('T7: should emit console.warn for unknown code', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const payment = { id: 'pay_999', failureCode: 'UNKNOWN_ERROR_XYZ' };
      
      classifyFailure(payment);
      
      expect(warnSpy).toHaveBeenCalledWith('Unknown payment failure code: UNKNOWN_ERROR_XYZ');
      warnSpy.mockRestore();
    });
  });
});
```

### 3.3 GREEN — Implementation already covers AC3

The implementation in Task 1.3 already handles unknown codes with `console.warn`. No additional code needed.

---

## Complete Test File

**File:** `tests/payments/failure-classifier.test.js`

```javascript
'use strict';

const { classifyFailure } = require('../../src/payments/failure-classifier');

describe('classifyFailure', () => {
  describe('AC1 — Retryable codes', () => {
    it('T1: should classify TIMEOUT as retryable with retryCount 0', () => {
      const payment = { id: 'pay_123', failureCode: 'TIMEOUT' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
      expect(result.id).toBe('pay_123');
    });

    it('T2: should classify ISSUER_TEMP_UNAVAIL as retryable with retryCount 0', () => {
      const payment = { id: 'pay_456', failureCode: 'ISSUER_TEMP_UNAVAIL' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('retryable');
      expect(result.retryCount).toBe(0);
      expect(result.id).toBe('pay_456');
    });
  });

  describe('AC2 — Permanent codes', () => {
    it('T3: should classify INSUFFICIENT_FUNDS as permanent', () => {
      const payment = { id: 'pay_789', failureCode: 'INSUFFICIENT_FUNDS' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('permanent');
      expect(result.id).toBe('pay_789');
    });

    it('T4: should classify CARD_BLOCKED as permanent', () => {
      const payment = { id: 'pay_101', failureCode: 'CARD_BLOCKED' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('permanent');
      expect(result.id).toBe('pay_101');
    });

    it('T5: should classify FRAUD_DECLINE as permanent', () => {
      const payment = { id: 'pay_202', failureCode: 'FRAUD_DECLINE' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('permanent');
      expect(result.id).toBe('pay_202');
    });
  });

  describe('AC3 — Unknown codes', () => {
    it('T6: should classify unknown code as permanent', () => {
      const payment = { id: 'pay_999', failureCode: 'UNKNOWN_ERROR_XYZ' };
      const result = classifyFailure(payment);
      
      expect(result.status).toBe('permanent');
      expect(result.id).toBe('pay_999');
    });

    it('T7: should emit console.warn for unknown code', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const payment = { id: 'pay_999', failureCode: 'UNKNOWN_ERROR_XYZ' };
      
      classifyFailure(payment);
      
      expect(warnSpy).toHaveBeenCalledWith('Unknown payment failure code: UNKNOWN_ERROR_XYZ');
      warnSpy.mockRestore();
    });
  });
});
```

---

## Complete Implementation File

**File:** `src/payments/failure-classifier.js`

```javascript
'use strict';

const RETRYABLE_CODES = new Set([
  'TIMEOUT',
  'ISSUER_TEMP_UNAVAIL',
]);

const PERMANENT_CODES = new Set([
  'INSUFFICIENT_FUNDS',
  'CARD_BLOCKED',
  'FRAUD_DECLINE',
]);

/**
 * Classify a failed payment and determine if it is retryable or permanent.
 * 
 * @param {Object} payment - Payment object with failureCode property
 * @returns {Object} Modified payment object with status and (if retryable) retryCount
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
  
  // Unknown code: permanent + warn
  console.warn(`Unknown payment failure code: ${failureCode}`);
  return {
    ...payment,
    status: 'permanent',
  };
}

module.exports = { classifyFailure };
```

---

## Test Execution Order (RED → GREEN)

1. **RED Phase:**  
   - Run all 7 tests → all fail (function does not exist)

2. **GREEN Phase:**  
   - Create `src/payments/failure-classifier.js` with full implementation
   - Run all 7 tests → all pass

---

## Acceptance Criteria Coverage

| AC | Tests | Status |
|----|-------|--------|
| AC1 — Retryable codes (TIMEOUT, ISSUER_TEMP_UNAVAIL) | T1, T2 | ✅ Fully covered |
| AC2 — Permanent codes (INSUFFICIENT_FUNDS, CARD_BLOCKED, FRAUD_DECLINE) | T3, T4, T5 | ✅ Fully covered |
| AC3 — Unknown codes → permanent + console.warn | T6, T7 | ✅ Fully covered |

---

## Files Created/Modified

- **Create:** `src/payments/failure-classifier.js`
- **Create:** `tests/payments/failure-classifier.test.js`
- **No modifications** to existing queue or integration modules

---

## Scope Confirmation

✅ Pure stateless function  
✅ No external dependencies  
✅ No retry scheduling  
✅ No exponential backoff  
✅ No queue persistence  
✅ No network calls  
✅ No PCI-DSS scope changes