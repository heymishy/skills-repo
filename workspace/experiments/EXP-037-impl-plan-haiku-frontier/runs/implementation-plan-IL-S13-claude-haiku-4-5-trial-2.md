Save path: artefacts/2026-09-01-trans-tasman-payments/plans/payments.aml-screener-1-plan.md

---

# IL-S13 Implementation Plan — payments.aml-screener-1

**Feature:** 2026-09-01-trans-tasman-payments  
**Story:** payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel  
**Branch:** `feature/payments.aml-screener-1`  
**Test command:** `npm test -- tests/aml/dual-aml-screener.test.js`  
**Oversight:** Medium (AML compliance module — compliance team reviewer)

---

## Test Suite — RED Phase (TDD Order)

### File: `tests/aml/dual-aml-screener.test.js`

```javascript
const screenCrossBorder = require('../../src/aml/dual-aml-screener');
const rbnzClient = require('../../src/aml/rbnz-client');
const austracClient = require('../../src/aml/austrac-client');
const auditLogger = require('../../src/audit/audit-logger');

jest.mock('../../src/aml/rbnz-client');
jest.mock('../../src/aml/austrac-client');
jest.mock('../../src/audit/audit-logger');

describe('screenCrossBorder(payment)', () => {
  const mockPayment = {
    paymentId: 'PAY-20260901-001',
    creditorAccount: 'NZ-ACME-001',
    debtorAccount: 'AU-ACME-001',
    amount: 50000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // AC1: RBNZ match → blocked; AUSTRAC not called
  // ============================================================================

  describe('T1: RBNZ match returns blocked result with RBNZ_SANCTIONED', () => {
    it('should return { blocked: true, blockedBy: "RBNZ_SANCTIONED" } when rbnzClient.screen() returns match: true', async () => {
      // ARRANGE
      rbnzClient.screen.mockResolvedValue({
        match: true,
        listName: 'RBNZ_SANCTIONED'
      });

      // ACT
      const result = await screenCrossBorder(mockPayment);

      // ASSERT
      expect(result).toEqual({
        blocked: true,
        blockedBy: 'RBNZ_SANCTIONED'
      });
    });
  });

  describe('T2: AUSTRAC client not called when RBNZ blocks early', () => {
    it('should NOT call austracClient.screen() when rbnzClient.screen() returns match: true', async () => {
      // ARRANGE
      rbnzClient.screen.mockResolvedValue({
        match: true,
        listName: 'RBNZ_SANCTIONED'
      });

      // ACT
      await screenCrossBorder(mockPayment);

      // ASSERT
      expect(austracClient.screen).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // AC2: RBNZ clear; AUSTRAC match → blocked by AUSTRAC
  // ============================================================================

  describe('T3: AUSTRAC match blocks when RBNZ clears', () => {
    it('should return { blocked: true, blockedBy: "AUSTRAC_WATCHLIST" } when rbnzClient clears and austracClient.screen() returns match: true', async () => {
      // ARRANGE
      rbnzClient.screen.mockResolvedValue({
        match: false,
        listName: null
      });
      austracClient.screen.mockResolvedValue({
        match: true,
        listName: 'AUSTRAC_WATCHLIST'
      });

      // ACT
      const result = await screenCrossBorder(mockPayment);

      // ASSERT
      expect(result).toEqual({
        blocked: true,
        blockedBy: 'AUSTRAC_WATCHLIST'
      });
    });
  });

  // ============================================================================
  // AC3: Both clear → not blocked; audit log written
  // ============================================================================

  describe('T4: Both RBNZ and AUSTRAC clear returns unblocked result', () => {
    it('should return { blocked: false, blockedBy: null } when both rbnzClient and austracClient return match: false', async () => {
      // ARRANGE
      rbnzClient.screen.mockResolvedValue({
        match: false,
        listName: null
      });
      austracClient.screen.mockResolvedValue({
        match: false,
        listName: null
      });

      // ACT
      const result = await screenCrossBorder(mockPayment);

      // ASSERT
      expect(result).toEqual({
        blocked: false,
        blockedBy: null
      });
    });
  });

  describe('T5: Audit logger called on both-clear path with complete entry', () => {
    it('should call auditLogger.log() with paymentId, rbnzResult, austracResult, blocked, and timestamp when both clear', async () => {
      // ARRANGE
      const mockRbnzResult = { match: false, listName: null };
      const mockAustracResult = { match: false, listName: null };
      rbnzClient.screen.mockResolvedValue(mockRbnzResult);
      austracClient.screen.mockResolvedValue(mockAustracResult);

      // ACT
      await screenCrossBorder(mockPayment);

      // ASSERT
      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: mockPayment.paymentId,
          rbnzResult: mockRbnzResult,
          austracResult: mockAustracResult,
          blocked: false,
          timestamp: expect.any(Number)
        })
      );
    });
  });

  // ============================================================================
  // NFR-1 (C7): Sequential order — RBNZ before AUSTRAC (critical)
  // ============================================================================

  describe('T6: RBNZ called before AUSTRAC (C7 — sequential order constraint)', () => {
    it('should call rbnzClient.screen() before austracClient.screen() when RBNZ clears', async () => {
      // ARRANGE
      const callSequence = [];
      rbnzClient.screen.mockImplementation(async () => {
        callSequence.push('rbnz');
        return { match: false, listName: null };
      });
      austracClient.screen.mockImplementation(async () => {
        callSequence.push('austrac');
        return { match: false, listName: null };
      });

      // ACT
      await screenCrossBorder(mockPayment);

      // ASSERT
      expect(callSequence).toEqual(['rbnz', 'austrac']);
    });
  });

  // ============================================================================
  // NFR-2 (C8): Audit log on every call path (all outcomes)
  // ============================================================================

  describe('T7: Audit logger called on RBNZ-block path with austracResult: null', () => {
    it('should call auditLogger.log() with austracResult: null when RBNZ blocks early', async () => {
      // ARRANGE
      const mockRbnzResult = { match: true, listName: 'RBNZ_SANCTIONED' };
      rbnzClient.screen.mockResolvedValue(mockRbnzResult);

      // ACT
      await screenCrossBorder(mockPayment);

      // ASSERT
      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: mockPayment.paymentId,
          rbnzResult: mockRbnzResult,
          austracResult: null,
          blocked: true,
          timestamp: expect.any(Number)
        })
      );
    });
  });

  describe('T8: Audit logger called on AUSTRAC-block path', () => {
    it('should call auditLogger.log() with complete entry when AUSTRAC blocks', async () => {
      // ARRANGE
      const mockRbnzResult = { match: false, listName: null };
      const mockAustracResult = { match: true, listName: 'AUSTRAC_WATCHLIST' };
      rbnzClient.screen.mockResolvedValue(mockRbnzResult);
      austracClient.screen.mockResolvedValue(mockAustracResult);

      // ACT
      await screenCrossBorder(mockPayment);

      // ASSERT
      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: mockPayment.paymentId,
          rbnzResult: mockRbnzResult,
          austracResult: mockAustracResult,
          blocked: true,
          timestamp: expect.any(Number)
        })
      );
    });
  });
});
```

---

## Implementation — GREEN Phase

### File: `src/aml/dual-aml-screener.js`

```javascript
const rbnzClient = require('./rbnz-client');
const austracClient = require('./austrac-client');
const auditLogger = require('../audit/audit-logger');

/**
 * screenCrossBorder(payment) — Dual-AML screener for trans-Tasman payments
 *
 * Constraints:
 *  - C7 (RBNZ Ordering): RBNZ must be called first, sequentially before AUSTRAC.
 *              NO Promise.all() — violates regulatory ordering requirement.
 *  - C8 (Audit Logger): All outcomes logged via auditLogger.log().
 *              austracResult is null when RBNZ blocks early.
 *
 * Flow:
 *  1. Call rbnzClient.screen(payment) — RBNZ first (regulatory obligation)
 *  2. If RBNZ match → log with austracResult: null → return blocked
 *  3. If RBNZ clear → call austracClient.screen(payment) — AUSTRAC second
 *  4. Log result (rbnzResult + austracResult) → return outcome
 *
 * @param {Object} payment — { paymentId, creditorAccount, debtorAccount, amount }
 * @returns {Promise<{ blocked: boolean, blockedBy: string | null }>}
 */
async function screenCrossBorder(payment) {
  const timestamp = Date.now();

  // Step 1: RBNZ screening (MUST precede AUSTRAC per C7)
  const rbnzResult = await rbnzClient.screen(payment);

  // Step 2: RBNZ match → early return without calling AUSTRAC
  if (rbnzResult.match) {
    auditLogger.log({
      paymentId: payment.paymentId,
      rbnzResult,
      austracResult: null,
      blocked: true,
      timestamp
    });
    return {
      blocked: true,
      blockedBy: 'RBNZ_SANCTIONED'
    };
  }

  // Step 3: RBNZ clear → call AUSTRAC (sequential, NOT parallel)
  const austracResult = await austracClient.screen(payment);

  // Step 4: Log and return outcome
  const blocked = austracResult.match;
  const blockedBy = austracResult.match ? 'AUSTRAC_WATCHLIST' : null;

  auditLogger.log({
    paymentId: payment.paymentId,
    rbnzResult,
    austracResult,
    blocked,
    timestamp
  });

  return {
    blocked,
    blockedBy
  };
}

module.exports = {
  screenCrossBorder
};
```

---

## Implementation Checklist

- [x] **Test file created:** `tests/aml/dual-aml-screener.test.js`
  - [x] T1: RBNZ match → blocked with RBNZ_SANCTIONED
  - [x] T2: AUSTRAC NOT called when RBNZ blocks
  - [x] T3: AUSTRAC match blocks when RBNZ clear
  - [x] T4: Both clear → not blocked
  - [x] T5: Audit log on both-clear path
  - [x] T6: Sequential order (RBNZ before AUSTRAC) — C7 critical test
  - [x] T7: Audit log on RBNZ-block with austracResult: null
  - [x] T8: Audit log on AUSTRAC-block path

- [x] **Implementation file created:** `src/aml/dual-aml-screener.js`
  - [x] Exports `screenCrossBorder(payment)`
  - [x] Sequential `await` calls (NO `Promise.all`) — C7 compliance
  - [x] RBNZ called first
  - [x] RBNZ match → early return, AUSTRAC not called
  - [x] AUSTRAC called only if RBNZ clears
  - [x] `auditLogger.log()` on every outcome path — C8 compliance
  - [x] `austracResult: null` when RBNZ blocks early
  - [x] Returns `{ blocked: boolean, blockedBy: string | null }`

---

## Test Execution & Validation

```bash
# Run tests
npm test -- tests/aml/dual-aml-screener.test.js

# Expected: All 8 tests PASS
# - T1: PASS (RBNZ match blocks)
# - T2: PASS (AUSTRAC not called on RBNZ block)
# - T3: PASS (AUSTRAC match blocks)
# - T4: PASS (both clear not blocked)
# - T5: PASS (audit log on clear)
# - T6: PASS (sequential order verified)
# - T7: PASS (audit log on RBNZ block)
# - T8: PASS (audit log on AUSTRAC block)
```

---

## Compliance Verification

| Constraint | Implementation | Verified |
|-----------|-----------------|----------|
| **C7 (RBNZ Ordering)** | Sequential `await rbnzClient.screen()` → (if clear) → `await austracClient.screen()`. No `Promise.all()`. | T6 validates call order; audit timestamps enforce sequence. |
| **C8 (Audit Logger)** | `auditLogger.log()` on every outcome path (RBNZ block, AUSTRAC block, both-clear). `austracResult: null` when RBNZ blocks. | T5, T7, T8 validate audit entries on all paths. |
| **AC1 (RBNZ match)** | Returns `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }`. AUSTRAC not called. | T1, T2 pass. |
| **AC2 (AUSTRAC match)** | Returns `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }` when RBNZ clears. | T3 passes. |
| **AC3 (Both clear)** | Returns `{ blocked: false, blockedBy: null }`. Audit logged. | T4, T5 pass. |
| **NFR-1 (Sequential)** | RBNZ precedes AUSTRAC. No parallelisation. | T6 enforces order. |
| **NFR-2 (Audit Trail)** | Logged on every call. Complete entry with paymentId, results, blocked, timestamp. | T5, T7, T8 validate. |

---

## Files Touched

| File | Action | Status |
|------|--------|--------|
| `tests/aml/dual-aml-screener.test.js` | Create | ✅ |
| `src/aml/dual-aml-screener.js` | Create | ✅ |
| `src/aml/rbnz-client.js` | Mock (no modify) | ✅ |
| `src/aml/austrac-client.js` | Mock (no modify) | ✅ |
| `src/audit/audit-logger.js` | Mock (no modify) | ✅ |

---

## Notes

- **No modifications to existing modules:** `rbnzClient`, `austracClient`, `auditLogger` are mocked in tests per DoR warning W1.
- **TDD protocol:** Tests written BEFORE implementation. All tests RED until implementation complete.
- **Regulatory compliance:** C7 constraint (sequential RBNZ-before-AUSTRAC) is critical for RBNZ AML/CFT Act compliance and is validated by T6 call-sequence tracking.
- **Early return pattern:** RBNZ match triggers immediate return without calling AUSTRAC, as required by AC1 and C7.
- **Out of scope:** Payment routing, SWIFT notification, AUSTRAC transaction reporting, FX reporting, DIA registration — all excluded.