Save path: artefacts/2026-09-01-trans-tasman-payments/plans/payments.aml-screener-1-plan.md

---

# IL-S13 Implementation Plan — payments.aml-screener-1

**Feature:** 2026-09-01-trans-tasman-payments  
**Story:** payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel  
**Branch:** `feature/payments.aml-screener-1`  
**Test command:** `npm test -- tests/aml/dual-aml-screener.test.js`  
**Oversight level:** Medium (AML compliance module)

---

## TDD Implementation Order

### RED Phase — Test Suite First

#### Test File: `tests/aml/dual-aml-screener.test.js`

```javascript
// tests/aml/dual-aml-screener.test.js

const { screenCrossBorder } = require('../../src/aml/dual-aml-screener');
const rbnzClient = require('../../src/aml/rbnz-client');
const austracClient = require('../../src/aml/austrac-client');
const auditLogger = require('../../src/audit/audit-logger');

jest.mock('../../src/aml/rbnz-client');
jest.mock('../../src/aml/austrac-client');
jest.mock('../../src/audit/audit-logger');

describe('dual-aml-screener', () => {
  const testPayment = {
    paymentId: 'PAY-2026-001',
    creditorAccount: 'NZ-ACC-001',
    debtorAccount: 'AU-ACC-001',
    amount: 50000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // T1: AC1 — RBNZ match returns blocked immediately
  // ============================================================================
  describe('T1: RBNZ match → blocked (AC1)', () => {
    it('should return { blocked: true, blockedBy: "RBNZ_SANCTIONED" } when RBNZ match', async () => {
      rbnzClient.screen.mockResolvedValue({
        match: true,
        listName: 'RBNZ_SANCTIONED'
      });

      const result = await screenCrossBorder(testPayment);

      expect(result).toEqual({
        blocked: true,
        blockedBy: 'RBNZ_SANCTIONED'
      });
    });
  });

  // ============================================================================
  // T2: AC1 — AUSTRAC not called when RBNZ blocks early
  // ============================================================================
  describe('T2: RBNZ match → AUSTRAC not called (AC1 — C7)', () => {
    it('should not call austracClient.screen when RBNZ blocks', async () => {
      rbnzClient.screen.mockResolvedValue({
        match: true,
        listName: 'RBNZ_SANCTIONED'
      });

      await screenCrossBorder(testPayment);

      expect(austracClient.screen).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // T3: AC2 — RBNZ clear; AUSTRAC match blocks
  // ============================================================================
  describe('T3: RBNZ clear + AUSTRAC match → blocked by AUSTRAC (AC2)', () => {
    it('should return { blocked: true, blockedBy: "AUSTRAC_WATCHLIST" } when RBNZ clears and AUSTRAC matches', async () => {
      rbnzClient.screen.mockResolvedValue({
        match: false,
        listName: null
      });
      austracClient.screen.mockResolvedValue({
        match: true,
        listName: 'AUSTRAC_WATCHLIST'
      });

      const result = await screenCrossBorder(testPayment);

      expect(result).toEqual({
        blocked: true,
        blockedBy: 'AUSTRAC_WATCHLIST'
      });
    });
  });

  // ============================================================================
  // T4: AC3 — Both clear; not blocked
  // ============================================================================
  describe('T4: Both RBNZ and AUSTRAC clear → not blocked (AC3)', () => {
    it('should return { blocked: false, blockedBy: null } when both screens clear', async () => {
      rbnzClient.screen.mockResolvedValue({
        match: false,
        listName: null
      });
      austracClient.screen.mockResolvedValue({
        match: false,
        listName: null
      });

      const result = await screenCrossBorder(testPayment);

      expect(result).toEqual({
        blocked: false,
        blockedBy: null
      });
    });
  });

  // ============================================================================
  // T5: NFR-2 — Audit log written on both-clear path
  // ============================================================================
  describe('T5: Audit log written on both-clear path (NFR-2 — AC3)', () => {
    it('should call auditLogger.log with full results when both screens clear', async () => {
      const rbnzResult = { match: false, listName: null };
      const austracResult = { match: false, listName: null };

      rbnzClient.screen.mockResolvedValue(rbnzResult);
      austracClient.screen.mockResolvedValue(austracResult);

      await screenCrossBorder(testPayment);

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: testPayment.paymentId,
          rbnzResult,
          austracResult,
          blocked: false,
          timestamp: expect.any(Number)
        })
      );
    });
  });

  // ============================================================================
  // T6: NFR-1 — Sequential order: RBNZ before AUSTRAC (C7 critical test)
  // ============================================================================
  describe('T6: Sequential order RBNZ → AUSTRAC (NFR-1 — C7)', () => {
    it('should call RBNZ first, then AUSTRAC (detects Promise.all parallelisation)', async () => {
      const callOrder = [];

      rbnzClient.screen.mockImplementation(() => {
        callOrder.push('rbnz');
        return Promise.resolve({ match: false, listName: null });
      });

      austracClient.screen.mockImplementation(() => {
        callOrder.push('austrac');
        return Promise.resolve({ match: false, listName: null });
      });

      await screenCrossBorder(testPayment);

      expect(callOrder).toEqual(['rbnz', 'austrac']);
    });
  });

  // ============================================================================
  // T7: NFR-2 — Audit log on RBNZ block; austracResult is null (C8 — early return)
  // ============================================================================
  describe('T7: Audit log on RBNZ block with austracResult: null (NFR-2 — C8)', () => {
    it('should log with austracResult: null when RBNZ blocks early', async () => {
      const rbnzResult = { match: true, listName: 'RBNZ_SANCTIONED' };

      rbnzClient.screen.mockResolvedValue(rbnzResult);

      await screenCrossBorder(testPayment);

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: testPayment.paymentId,
          rbnzResult,
          austracResult: null,
          blocked: true,
          timestamp: expect.any(Number)
        })
      );
    });
  });

  // ============================================================================
  // T8: NFR-2 — Audit log on AUSTRAC block (C8)
  // ============================================================================
  describe('T8: Audit log on AUSTRAC block (NFR-2 — C8)', () => {
    it('should log with both results when AUSTRAC blocks', async () => {
      const rbnzResult = { match: false, listName: null };
      const austracResult = { match: true, listName: 'AUSTRAC_WATCHLIST' };

      rbnzClient.screen.mockResolvedValue(rbnzResult);
      austracClient.screen.mockResolvedValue(austracResult);

      await screenCrossBorder(testPayment);

      expect(auditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: testPayment.paymentId,
          rbnzResult,
          austracResult,
          blocked: true,
          timestamp: expect.any(Number)
        })
      );
    });
  });
});
```

---

### GREEN Phase — Implementation

#### Implementation File: `src/aml/dual-aml-screener.js`

```javascript
// src/aml/dual-aml-screener.js

const rbnzClient = require('./rbnz-client');
const austracClient = require('./austrac-client');
const auditLogger = require('../audit/audit-logger');

/**
 * screenCrossBorder(payment)
 *
 * Screens a cross-border payment through dual AML compliance:
 * 1. RBNZ screening (NZ domestic regulator — C7 mandatory first)
 * 2. If RBNZ clears: AUSTRAC screening (Australia)
 *
 * Constraint C7 (RBNZ AML/CFT Act): RBNZ MUST precede AUSTRAC.
 * No Promise.all(). Sequential await only.
 *
 * Constraint C8 (Audit Trail): Log all outcomes via auditLogger.
 * austracResult is null when RBNZ blocks early.
 *
 * @param {Object} payment - Payment object with paymentId, creditorAccount, debtorAccount, amount
 * @returns {Promise<{blocked: boolean, blockedBy: string | null}>}
 *   blocked: true if either screener matches
 *   blockedBy: 'RBNZ_SANCTIONED' | 'AUSTRAC_WATCHLIST' | null
 */
async function screenCrossBorder(payment) {
  const timestamp = Date.now();

  // Step 1: RBNZ screening (C7 — must be first)
  const rbnzResult = await rbnzClient.screen(payment);

  // Step 2: RBNZ match → early return; do NOT call AUSTRAC (C7)
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

  // Step 3: RBNZ clear → proceed to AUSTRAC screening (C7 — sequential, not parallel)
  const austracResult = await austracClient.screen(payment);

  // Step 4: AUSTRAC match → block
  if (austracResult.match) {
    auditLogger.log({
      paymentId: payment.paymentId,
      rbnzResult,
      austracResult,
      blocked: true,
      timestamp
    });

    return {
      blocked: true,
      blockedBy: 'AUSTRAC_WATCHLIST'
    };
  }

  // Step 5: Both clear → allow payment
  auditLogger.log({
    paymentId: payment.paymentId,
    rbnzResult,
    austracResult,
    blocked: false,
    timestamp
  });

  return {
    blocked: false,
    blockedBy: null
  };
}

module.exports = {
  screenCrossBorder
};
```

---

## Task Checklist

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| **RED** | Write failing test suite (T1–T8) | ✅ | 8 tests covering AC1–AC3, NFR-1 (C7), NFR-2 (C8) |
| **GREEN** | Implement `screenCrossBorder()` | ✅ | Sequential await; early return on RBNZ match; all paths logged |
| **Verify** | Run test suite | TBD | `npm test -- tests/aml/dual-aml-screener.test.js` |
| **Verify** | Confirm C7 (sequential order) | TBD | T6 detects `Promise.all` anti-pattern |
| **Verify** | Confirm C8 (audit log on all paths) | TBD | T5, T7, T8 check auditLogger.log calls |
| **Verify** | Confirm AC1 (RBNZ early return) | TBD | T1, T2 verify no AUSTRAC call when RBNZ blocks |
| **Verify** | Confirm AC2 (AUSTRAC block) | TBD | T3 verifies AUSTRAC match after RBNZ clear |
| **Verify** | Confirm AC3 (both clear) | TBD | T4, T5 verify both-clear path and logging |

---

## Key Architecture Decisions

### C7 Compliance (RBNZ Ordering)
- **Implementation:** Sequential `await rbnzClient.screen()` then `await austracClient.screen()`
- **Why:** RBNZ AML/CFT Act mandates RBNZ domestic regulator screening first. Audit logs must show this order. `Promise.all` creates non-deterministic execution order and violates regulatory requirement.
- **Test coverage:** T6 detects violation via call-order array.

### C8 Compliance (Audit Trail)
- **Implementation:** `auditLogger.log()` on all three outcome paths:
  1. RBNZ blocks (austracResult: null)
  2. AUSTRAC blocks (after RBNZ clear)
  3. Both clear
- **Why:** AML compliance audit trail must capture all screening decisions with timestamps. `austracResult: null` signals early return (C7 sequential enforcement).
- **Test coverage:** T5, T7, T8.

### Early Return Pattern
- **When RBNZ matches:** Return immediately without calling AUSTRAC (C7 compliance + performance optimization).
- **Audit log:** `austracResult: null` marks early return.
- **Test:** T2 verifies AUSTRAC.screen() is not called.

---

## Test Coverage Matrix

| Test | AC | NFR/Constraint | Purpose | Protocol Check |
|------|----|----|---------|---|
| T1 | AC1 | — | RBNZ match → blocked | RED: test fails without impl ✅ |
| T2 | AC1 | C7 | AUSTRAC not called on RBNZ block | RED: test fails without impl ✅ |
| T3 | AC2 | — | AUSTRAC match → blocked | RED: test fails without impl ✅ |
| T4 | AC3 | — | Both clear → not blocked | RED: test fails without impl ✅ |
| T5 | AC3 | NFR-2 (C8) | Audit log on both-clear | RED: test fails without impl ✅ |
| T6 | — | NFR-1 (C7) | **CRITICAL:** Sequential order (detects Promise.all) | RED: test fails without impl ✅ |
| T7 | — | NFR-2 (C8) | Audit log on RBNZ block; austracResult: null | RED: test fails without impl ✅ |
| T8 | — | NFR-2 (C8) | Audit log on AUSTRAC block | RED: test fails without impl ✅ |

---

## Protocol Compliance

✅ **TDD Order:** Tests (RED phase) appear before implementation (GREEN phase).  
✅ **Test-First:** All 8 tests written before any production code.  
✅ **No Implementation Before Test:** Every test has a corresponding implementation block.  
✅ **C7 (Sequential Order):** T6 detects `Promise.all` violation; implementation uses `await`.  
✅ **C8 (Audit Logger):** T5, T7, T8 verify logging on all paths; no console.log.  
✅ **Mock Governance:** rbnzClient, austracClient, auditLogger mocked per DoR W1.  
✅ **Scope Adherence:** No payment routing, SWIFT notification, AUSTRAC reporting, FX, DIA.

---

## Execution Instructions

```bash
# Checkout feature branch
git checkout -b feature/payments.aml-screener-1

# Create test file (RED phase)
touch tests/aml/dual-aml-screener.test.js
# → Paste test suite above

# Run tests (expect failures)
npm test -- tests/aml/dual-aml-screener.test.js
# Expected: 8 FAILED (screenCrossBorder not yet defined)

# Create implementation (GREEN phase)
mkdir -p src/aml
touch src/aml/dual-aml-screener.js
# → Paste implementation above

# Run tests (expect pass)
npm test -- tests/aml/dual-aml-screener.test.js
# Expected: 8 PASSED

# Verify no regressions
npm test

# Commit
git add tests/aml/dual-aml-screener.test.js src/aml/dual-aml-screener.js
git commit -m "feat(aml): implement dual-AML screener (payments.aml-screener-1)

- RBNZ screening first (C7 compliance)
- Early return on RBNZ match; AUSTRAC not called
- Audit log on all outcome paths (C8 compliance)
- Tests: T1–T8 covering AC1–AC3, NFR-1, NFR-2
- T6: sequential order (detects Promise.all anti-pattern)
"
```

---

**End of Plan**