Save path: artefacts/2026-09-01-trans-tasman-payments/plans/payments.aml-screener-1-plan.md

```markdown
# Implementation Plan — payments.aml-screener-1
# Dual-AML Screener for Trans-Tasman Payment Channel

**Feature:** 2026-09-01-trans-tasman-payments
**Branch:** `feature/payments.aml-screener-1`
**Test command:** `npm test -- tests/aml/dual-aml-screener.test.js`
**Oversight level:** Medium (compliance team reviewer required)

---

## Files to Create

| File | Action |
|------|--------|
| `tests/aml/dual-aml-screener.test.js` | CREATE — full test suite (written first, RED) |
| `src/aml/dual-aml-screener.js` | CREATE — implementation (written after tests) |

## Files NOT to Touch

| File | Reason |
|------|--------|
| `src/aml/rbnz-client.js` | Existing module — W1 mock only |
| `src/aml/austrac-client.js` | Existing module — W1 mock only |
| `src/audit/audit-logger.js` | Existing module — W1 mock only |

---

## Constraints Checklist (must be verified at every task)

| Constraint | Rule |
|------------|------|
| C7 — RBNZ ordering | `await rbnzClient.screen()` completes BEFORE `austracClient.screen()` is called. `Promise.all` is **prohibited**. |
| C8 — Audit logger | `auditLogger.log(...)` called on **every** outcome path. `console.log` is **prohibited**. |
| NFR-1 — Sequential | RBNZ match → early return, AUSTRAC never called. |
| NFR-2 — Audit completeness | Log in all three paths: RBNZ-block, AUSTRAC-block, both-clear. `austracResult: null` when RBNZ blocked early. |

---

## Task 1 — RED: Write the failing test file

**Action:** Create `tests/aml/dual-aml-screener.test.js`
**Status at end of task:** All tests FAIL (module under test does not exist yet)

```js
// tests/aml/dual-aml-screener.test.js

'use strict';

jest.mock('../../src/aml/rbnz-client');
jest.mock('../../src/aml/austrac-client');
jest.mock('../../src/audit/audit-logger');

const rbnzClient   = require('../../src/aml/rbnz-client');
const austracClient = require('../../src/aml/austrac-client');
const auditLogger  = require('../../src/audit/audit-logger');
const { screenCrossBorder } = require('../../src/aml/dual-aml-screener');

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const PAYMENT = {
  paymentId:       'PAY-001',
  creditorAccount: 'NZ12-3456-7890',
  debtorAccount:   'AU98-7654-3210',
  amount:          500.00,
};

// ---------------------------------------------------------------------------
// Reset all mocks before every test to prevent state bleed
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// AC1 — RBNZ match: returns blocked by RBNZ, AUSTRAC not called
// ---------------------------------------------------------------------------
describe('AC1 — RBNZ match', () => {

  // T1: Return value is { blocked: true, blockedBy: 'RBNZ_SANCTIONED' }
  test('T1: returns { blocked: true, blockedBy: "RBNZ_SANCTIONED" } when RBNZ matches', async () => {
    rbnzClient.screen.mockResolvedValue({ match: true, listName: 'RBNZ_SANCTIONED' });
    // austracClient.screen should never be reached — no mock needed for this path

    const result = await screenCrossBorder(PAYMENT);

    expect(result).toEqual({ blocked: true, blockedBy: 'RBNZ_SANCTIONED' });
  });

  // T2: AUSTRAC mock must NOT be called when RBNZ matches (C7 / NFR-1)
  test('T2: does NOT call austracClient.screen when RBNZ matches', async () => {
    rbnzClient.screen.mockResolvedValue({ match: true, listName: 'RBNZ_SANCTIONED' });

    await screenCrossBorder(PAYMENT);

    expect(austracClient.screen).not.toHaveBeenCalled();
  });

});

// ---------------------------------------------------------------------------
// AC2 — RBNZ clear + AUSTRAC match: returns blocked by AUSTRAC
// ---------------------------------------------------------------------------
describe('AC2 — RBNZ clear, AUSTRAC match', () => {

  // T3: Return value is { blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }
  test('T3: returns { blocked: true, blockedBy: "AUSTRAC_WATCHLIST" } when RBNZ clears and AUSTRAC matches', async () => {
    rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
    austracClient.screen.mockResolvedValue({ match: true, listName: 'AUSTRAC_WATCHLIST' });

    const result = await screenCrossBorder(PAYMENT);

    expect(result).toEqual({ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' });
  });

});

// ---------------------------------------------------------------------------
// AC3 — Both clear: returns not blocked; audit log written
// ---------------------------------------------------------------------------
describe('AC3 — Both clear', () => {

  // T4: Return value is { blocked: false, blockedBy: null }
  test('T4: returns { blocked: false, blockedBy: null } when both screen clear', async () => {
    rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
    austracClient.screen.mockResolvedValue({ match: false, listName: null });

    const result = await screenCrossBorder(PAYMENT);

    expect(result).toEqual({ blocked: false, blockedBy: null });
  });

  // T5: auditLogger.log is called with correct shape when both clear (NFR-2)
  test('T5: calls auditLogger.log with correct entry when both clear', async () => {
    const rbnzResult   = { match: false, listName: null };
    const austracResult = { match: false, listName: null };

    rbnzClient.screen.mockResolvedValue(rbnzResult);
    austracClient.screen.mockResolvedValue(austracResult);

    await screenCrossBorder(PAYMENT);

    expect(auditLogger.log).toHaveBeenCalledTimes(1);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId:    PAYMENT.paymentId,
        rbnzResult,
        austracResult,
        blocked:      false,
        timestamp:    expect.any(String),   // ISO timestamp
      })
    );
  });

});

// ---------------------------------------------------------------------------
// NFR-1 / C7 — Sequential ordering: RBNZ MUST complete before AUSTRAC starts
// ---------------------------------------------------------------------------
describe('NFR-1 / C7 — Sequential call order', () => {

  // T6: Call-sequence tracking — shared array must be ['rbnz', 'austrac']
  test('T6: calls rbnzClient.screen before austracClient.screen (sequential order)', async () => {
    const callOrder = [];

    rbnzClient.screen.mockImplementation(async () => {
      callOrder.push('rbnz');
      return { match: false, listName: null };
    });

    austracClient.screen.mockImplementation(async () => {
      callOrder.push('austrac');
      return { match: false, listName: null };
    });

    await screenCrossBorder(PAYMENT);

    expect(callOrder).toEqual(['rbnz', 'austrac']);
  });

});

// ---------------------------------------------------------------------------
// NFR-2 — Audit log completeness: every outcome path must log
// ---------------------------------------------------------------------------
describe('NFR-2 — Audit log on every outcome path', () => {

  // T5 (covered above) — both-clear path logs

  // T7: RBNZ-block path — auditLogger called with austracResult: null
  test('T7: calls auditLogger.log with austracResult: null when RBNZ blocks early', async () => {
    const rbnzResult = { match: true, listName: 'RBNZ_SANCTIONED' };

    rbnzClient.screen.mockResolvedValue(rbnzResult);

    await screenCrossBorder(PAYMENT);

    expect(auditLogger.log).toHaveBeenCalledTimes(1);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId:    PAYMENT.paymentId,
        rbnzResult,
        austracResult: null,
        blocked:       true,
        timestamp:     expect.any(String),
      })
    );
  });

  // T8: AUSTRAC-block path — auditLogger called with correct rbnzResult and austracResult
  test('T8: calls auditLogger.log with full results when AUSTRAC blocks', async () => {
    const rbnzResult    = { match: false, listName: null };
    const austracResult = { match: true,  listName: 'AUSTRAC_WATCHLIST' };

    rbnzClient.screen.mockResolvedValue(rbnzResult);
    austracClient.screen.mockResolvedValue(austracResult);

    await screenCrossBorder(PAYMENT);

    expect(auditLogger.log).toHaveBeenCalledTimes(1);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId:    PAYMENT.paymentId,
        rbnzResult,
        austracResult,
        blocked:      true,
        timestamp:    expect.any(String),
      })
    );
  });

});
```

**Verify RED:** Run `npm test -- tests/aml/dual-aml-screener.test.js`.
Expected: all 8 tests fail with `Cannot find module '../../src/aml/dual-aml-screener'`.
Do NOT proceed to Task 2 until this failure is confirmed.

---

## Task 2 — GREEN: Write the implementation

**Action:** Create `src/aml/dual-aml-screener.js`
**Constraint reminder before writing:**
- Sequential `await` — no `Promise.all`
- `auditLogger.log(...)` in every branch
- `austracResult: null` in the RBNZ-early-return branch
- No `console.log`

```js
// src/aml/dual-aml-screener.js

'use strict';

const rbnzClient   = require('./rbnz-client');
const austracClient = require('./austrac-client');
const auditLogger  = require('../audit/audit-logger');

/**
 * Screens a cross-border payment against both the RBNZ sanctions list and the
 * AUSTRAC watchlist.
 *
 * Ordering constraint (C7 — RBNZ AML/CFT Act):
 *   RBNZ screening MUST complete before AUSTRAC screening begins.
 *   Promise.all is PROHIBITED.
 *
 * Audit constraint (C8):
 *   auditLogger.log() is called on EVERY outcome path.
 *
 * @param {{ paymentId: string, creditorAccount: string, debtorAccount: string, amount: number }} payment
 * @returns {Promise<{ blocked: boolean, blockedBy: string | null }>}
 */
async function screenCrossBorder(payment) {
  const { paymentId } = payment;

  // ── Step 1: RBNZ screening (MUST be first — C7) ─────────────────────────
  const rbnzResult = await rbnzClient.screen(payment);   // completes fully before Step 2

  if (rbnzResult.match) {
    // ── RBNZ-block path ─────────────────────────────────────────────────────
    // AUSTRAC is NOT called (NFR-1).
    // austracResult is recorded as null in the audit log (NFR-2 / C8).
    auditLogger.log({
      paymentId,
      rbnzResult,
      austracResult: null,
      blocked:       true,
      timestamp:     new Date().toISOString(),
    });

    return { blocked: true, blockedBy: 'RBNZ_SANCTIONED' };
  }

  // ── Step 2: AUSTRAC screening (only reached when RBNZ clears — C7) ───────
  const austracResult = await austracClient.screen(payment);

  if (austracResult.match) {
    // ── AUSTRAC-block path ───────────────────────────────────────────────────
    auditLogger.log({
      paymentId,
      rbnzResult,
      austracResult,
      blocked:   true,
      timestamp: new Date().toISOString(),
    });

    return { blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' };
  }

  // ── Both-clear path ────────────────────────────────────────────────────────
  auditLogger.log({
    paymentId,
    rbnzResult,
    austracResult,
    blocked:   false,
    timestamp: new Date().toISOString(),
  });

  return { blocked: false, blockedBy: null };
}

module.exports = { screenCrossBorder };
```

**Verify GREEN:** Run `npm test -- tests/aml/dual-aml-screener.test.js`.
Expected: all 8 tests pass, 0 failures.

---

## Task 3 — REFACTOR: Readability pass (no logic changes)

Permitted refactors only (must not change observable behaviour or break tests):

1. Extract a private `_buildAuditEntry(paymentId, rbnzResult, austracResult, blocked)` helper to de-duplicate the three `auditLogger.log(...)` call-sites.
2. Add JSDoc `@throws` annotation noting that propagated rejections from either client are not caught here (caller responsibility).

**After any refactor:** Re-run `npm test -- tests/aml/dual-aml-screener.test.js` — all 8 tests must still pass.

**Constraint re-check before committing refactor:**
- [ ] No `Promise.all` introduced
- [ ] `auditLogger.log` still called in all three branches
- [ ] `austracResult: null` still used in the RBNZ-block branch
- [ ] No `console.log` present

---

## Acceptance Checklist

| # | Check | How verified |
|---|-------|--------------|
| 1 | T1 passes — RBNZ match returns correct shape | Jest output |
| 2 | T2 passes — AUSTRAC not called on RBNZ block | `expect(austracClient.screen).not.toHaveBeenCalled()` |
| 3 | T3 passes — AUSTRAC match returns correct shape | Jest output |
| 4 | T4 passes — both-clear returns correct shape | Jest output |
| 5 | T5 passes — auditLogger called with correct entry (both-clear) | Jest output |
| 6 | T6 passes — call order array is `['rbnz', 'austrac']` | Jest output |
| 7 | T7 passes — auditLogger called with `austracResult: null` on RBNZ block | Jest output |
| 8 | T8 passes — auditLogger called with full results on AUSTRAC block | Jest output |
| 9 | No `Promise.all` in implementation | Code review / grep |
| 10 | No `console.log` in implementation | Code review / grep |
| 11 | `rbnzClient`, `austracClient`, `auditLogger` not modified | `git diff` |
| 12 | Compliance team added as PR reviewer | PR checklist |

---

## Protocol Violation Guard

> Tests in Task 1 were written **before** the implementation in Task 2.
> The implementation file (`src/aml/dual-aml-screener.js`) did not exist
> when the test file was written, guaranteeing RED-before-GREEN order.
> Any future edit that moves implementation code above test code is a
> protocol violation and must be rejected.
```