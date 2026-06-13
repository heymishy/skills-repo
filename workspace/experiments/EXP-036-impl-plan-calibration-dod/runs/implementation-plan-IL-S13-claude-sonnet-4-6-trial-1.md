Save path: artefacts/2026-09-01-trans-tasman-payments/plans/payments.aml-screener-1-plan.md

```markdown
# Implementation Plan — payments.aml-screener-1
# Dual-AML Screener for Trans-Tasman Payment Channel

**Feature:** 2026-09-01-trans-tasman-payments
**Branch:** `feature/payments.aml-screener-1`
**Oversight:** Medium (compliance team reviewer required)
**Test command:** `npm test -- tests/aml/dual-aml-screener.test.js`

---

## Files to Create

| File | Action |
|------|--------|
| `tests/aml/dual-aml-screener.test.js` | CREATE — test file (written first, RED phase) |
| `src/aml/dual-aml-screener.js` | CREATE — implementation (written second, GREEN phase) |

## Files NOT to Touch

| File | Reason |
|------|--------|
| `src/aml/rbnz-client.js` | Existing module — W1 prohibition |
| `src/aml/austrac-client.js` | Existing module — W1 prohibition |
| `src/audit/audit-logger.js` | Existing module — W1 prohibition |

---

## Task Sequence

---

### TASK 1 — RED: Write failing tests
**File:** `tests/aml/dual-aml-screener.test.js`
**Status at end of task:** All tests fail (module under test does not exist yet)

```js
// tests/aml/dual-aml-screener.test.js

const rbnzClient  = require('../../src/aml/rbnz-client');
const austracClient = require('../../src/aml/austrac-client');
const auditLogger = require('../../src/audit/audit-logger');

jest.mock('../../src/aml/rbnz-client');
jest.mock('../../src/aml/austrac-client');
jest.mock('../../src/audit/audit-logger');

const { screenCrossBorder } = require('../../src/aml/dual-aml-screener');

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const PAYMENT = {
  paymentId:       'PMT-001',
  creditorAccount: 'NZ12-3456-7890123-00',
  debtorAccount:   'AU12345678901234',
  amount:          5000,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// AC1 — T1: RBNZ match → returns blocked:true / blockedBy:'RBNZ_SANCTIONED'
// ---------------------------------------------------------------------------
test('T1: RBNZ match → returns { blocked: true, blockedBy: "RBNZ_SANCTIONED" }', async () => {
  rbnzClient.screen.mockResolvedValue({ match: true, listName: 'RBNZ_SANCTIONED' });
  // austracClient should not be called; no need to set it up

  const result = await screenCrossBorder(PAYMENT);

  expect(result).toEqual({ blocked: true, blockedBy: 'RBNZ_SANCTIONED' });
});

// ---------------------------------------------------------------------------
// AC1 — T2: RBNZ match → AUSTRAC is NOT called
// ---------------------------------------------------------------------------
test('T2: RBNZ match → austracClient.screen() is never called', async () => {
  rbnzClient.screen.mockResolvedValue({ match: true, listName: 'RBNZ_SANCTIONED' });

  await screenCrossBorder(PAYMENT);

  expect(austracClient.screen).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// AC2 — T3: RBNZ clear + AUSTRAC match → blocked by AUSTRAC
// ---------------------------------------------------------------------------
test('T3: RBNZ clear + AUSTRAC match → returns { blocked: true, blockedBy: "AUSTRAC_WATCHLIST" }', async () => {
  rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
  austracClient.screen.mockResolvedValue({ match: true, listName: 'AUSTRAC_WATCHLIST' });

  const result = await screenCrossBorder(PAYMENT);

  expect(result).toEqual({ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' });
});

// ---------------------------------------------------------------------------
// AC3 — T4: Both clear → returns { blocked: false, blockedBy: null }
// ---------------------------------------------------------------------------
test('T4: Both clear → returns { blocked: false, blockedBy: null }', async () => {
  rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
  austracClient.screen.mockResolvedValue({ match: false, listName: null });

  const result = await screenCrossBorder(PAYMENT);

  expect(result).toEqual({ blocked: false, blockedBy: null });
});

// ---------------------------------------------------------------------------
// AC3 / NFR-2 — T5: Both clear → auditLogger.log() is called with correct shape
// ---------------------------------------------------------------------------
test('T5: Both clear → auditLogger.log() called with correct entry', async () => {
  rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
  austracClient.screen.mockResolvedValue({ match: false, listName: null });

  await screenCrossBorder(PAYMENT);

  expect(auditLogger.log).toHaveBeenCalledTimes(1);

  const entry = auditLogger.log.mock.calls[0][0];
  expect(entry.paymentId).toBe(PAYMENT.paymentId);
  expect(entry.rbnzResult).toEqual({ match: false, listName: null });
  expect(entry.austracResult).toEqual({ match: false, listName: null });
  expect(entry.blocked).toBe(false);
  expect(typeof entry.timestamp).toBe('string'); // ISO timestamp
});

// ---------------------------------------------------------------------------
// NFR-1 / C7 — T6: Sequential call order — RBNZ first, AUSTRAC second
// ---------------------------------------------------------------------------
test('T6: RBNZ is called before AUSTRAC (sequential order enforced — C7)', async () => {
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

// ---------------------------------------------------------------------------
// NFR-2 — T7: RBNZ blocks early → auditLogger.log() called with austracResult: null
// ---------------------------------------------------------------------------
test('T7: RBNZ block → auditLogger.log() called with austracResult: null', async () => {
  rbnzClient.screen.mockResolvedValue({ match: true, listName: 'RBNZ_SANCTIONED' });

  await screenCrossBorder(PAYMENT);

  expect(auditLogger.log).toHaveBeenCalledTimes(1);

  const entry = auditLogger.log.mock.calls[0][0];
  expect(entry.paymentId).toBe(PAYMENT.paymentId);
  expect(entry.rbnzResult).toEqual({ match: true, listName: 'RBNZ_SANCTIONED' });
  expect(entry.austracResult).toBeNull();
  expect(entry.blocked).toBe(true);
  expect(typeof entry.timestamp).toBe('string');
});
```

**Expected outcome:** 7 tests collected, all fail with `Cannot find module '../../src/aml/dual-aml-screener'`.

---

### TASK 2 — GREEN: Write implementation
**File:** `src/aml/dual-aml-screener.js`
**Depends on:** TASK 1 (tests must already exist and be failing)

```js
// src/aml/dual-aml-screener.js

'use strict';

const rbnzClient   = require('./rbnz-client');
const austracClient = require('./austrac-client');
const auditLogger  = require('../audit/audit-logger');

/**
 * screenCrossBorder — dual-AML screener for trans-Tasman payments.
 *
 * C7  — RBNZ screening MUST precede AUSTRAC. Sequential await only.
 *        Promise.all() is explicitly prohibited.
 * C8  — All screening outcomes logged via auditLogger (never console).
 * NFR-1 — RBNZ match triggers early return; AUSTRAC is never called.
 * NFR-2 — auditLogger.log() is called on every exit path.
 *
 * @param {{ paymentId: string, creditorAccount: string,
 *            debtorAccount: string, amount: number }} payment
 * @returns {Promise<{ blocked: boolean, blockedBy: string|null }>}
 */
async function screenCrossBorder(payment) {
  const { paymentId } = payment;

  // ── Step 1: RBNZ screening (C7 — MUST be first) ─────────────────────────
  const rbnzResult = await rbnzClient.screen(payment);

  if (rbnzResult.match) {
    // ── RBNZ match: log with austracResult: null, then early-return (NFR-2) ─
    auditLogger.log({
      paymentId,
      rbnzResult,
      austracResult: null,           // AUSTRAC was never called (NFR-1 / C7)
      blocked:   true,
      timestamp: new Date().toISOString(),
    });

    return { blocked: true, blockedBy: 'RBNZ_SANCTIONED' };
  }

  // ── Step 2: AUSTRAC screening (C7 — only reached when RBNZ clears) ───────
  const austracResult = await austracClient.screen(payment);

  const blocked = austracResult.match === true;

  // ── Step 3: Audit log for all remaining paths (NFR-2) ────────────────────
  auditLogger.log({
    paymentId,
    rbnzResult,
    austracResult,
    blocked,
    timestamp: new Date().toISOString(),
  });

  if (blocked) {
    return { blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' };
  }

  return { blocked: false, blockedBy: null };
}

module.exports = { screenCrossBorder };
```

**Expected outcome:** All 7 tests pass.

---

## Constraint Compliance Checklist

| Constraint | Mechanism in implementation | Test that enforces it |
|------------|-----------------------------|-----------------------|
| C7 — RBNZ before AUSTRAC; no `Promise.all` | Sequential `await rbnzClient.screen()` then `await austracClient.screen()`; no `Promise.all` present | T6 (call-order array) |
| C7 — AUSTRAC not called on RBNZ match | Early `return` before `austracClient.screen()` is reached | T2 |
| C8 — `auditLogger.log()` on every path | Three exit paths each call `auditLogger.log()` before returning | T5, T7 |
| NFR-1 — RBNZ match = no AUSTRAC call | Structural: `austracClient.screen()` is below the RBNZ-match guard | T2, T6 |
| NFR-2 — Audit log completeness | `auditLogger.log()` called on RBNZ-block path, AUSTRAC-block path, and both-clear path | T5 (clear), T7 (RBNZ block) |
| NFR-2 — `austracResult: null` when RBNZ blocks | Explicit `austracResult: null` in the RBNZ-match branch | T7 |
| W1 — Do not modify existing modules | Implementation only requires/imports them; never modifies | (static — no test needed) |

---

## Rollback / Review Notes

- This module is AML-compliance-critical. The compliance team is a required reviewer per oversight level Medium.
- The sequential `await` ordering (C7) is load-bearing for the RBNZ AML/CFT Act obligation. Any future refactor that introduces concurrency (e.g. `Promise.all`, `Promise.race`, `Promise.allSettled`) on these two calls is a regulatory violation — T6 will catch it.
- `auditLogger.log()` receives `austracResult: null` (not `undefined`) when RBNZ blocks, to satisfy the C8 schema contract explicitly.
```