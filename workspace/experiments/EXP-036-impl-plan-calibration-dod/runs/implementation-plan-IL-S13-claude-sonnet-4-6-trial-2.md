Save path: artefacts/2026-09-01-trans-tasman-payments/plans/payments.aml-screener-1-plan.md

```markdown
# Implementation Plan — payments.aml-screener-1
# Dual-AML Screener for Trans-Tasman Payment Channel

**Feature:** 2026-09-01-trans-tasman-payments
**Branch:** `feature/payments.aml-screener-1`
**Oversight:** Medium (compliance team reviewer required)
**Test command:** `npm test -- tests/aml/dual-aml-screener.test.js`

---

## Overview

Implements `src/aml/dual-aml-screener.js` exporting `screenCrossBorder(payment)`.
Sequential RBNZ-then-AUSTRAC screening is a hard regulatory constraint (C7 / NFR-1).
Audit logging on every call in every outcome path is mandatory (C8 / NFR-2).

**Files to create:**
1. `tests/aml/dual-aml-screener.test.js` — written first (RED), per TDD protocol
2. `src/aml/dual-aml-screener.js` — written second (GREEN)

**Files to NOT modify:**
- `src/aml/rbnz-client.js`
- `src/aml/austrac-client.js`
- `src/audit/audit-logger.js`

---

## Task 1 — Write failing tests (RED)

**File:** `tests/aml/dual-aml-screener.test.js`

All tests must fail at this point because `src/aml/dual-aml-screener.js` does not yet exist.

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

const PAYMENT = {
  paymentId:       'PAY-001',
  creditorAccount: 'NZ-ACC-111',
  debtorAccount:   'AU-ACC-222',
  amount:          5000,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// T1 — AC1: RBNZ match returns blocked: true, blockedBy: 'RBNZ_SANCTIONED'
// ---------------------------------------------------------------------------
test('T1 — RBNZ match → returns { blocked: true, blockedBy: "RBNZ_SANCTIONED" }', async () => {
  rbnzClient.screen.mockResolvedValue({ match: true, listName: 'RBNZ_SANCTIONED' });
  // austracClient should not be called; no mock needed for it in this path

  const result = await screenCrossBorder(PAYMENT);

  expect(result).toEqual({ blocked: true, blockedBy: 'RBNZ_SANCTIONED' });
});

// ---------------------------------------------------------------------------
// T2 — AC1: RBNZ match → austracClient.screen is NOT called
// ---------------------------------------------------------------------------
test('T2 — RBNZ match → austracClient.screen is NOT called', async () => {
  rbnzClient.screen.mockResolvedValue({ match: true, listName: 'RBNZ_SANCTIONED' });

  await screenCrossBorder(PAYMENT);

  expect(austracClient.screen).not.toHaveBeenCalled();
});

// ---------------------------------------------------------------------------
// T3 — AC2: RBNZ clear + AUSTRAC match → blocked by AUSTRAC
// ---------------------------------------------------------------------------
test('T3 — RBNZ clear + AUSTRAC match → returns { blocked: true, blockedBy: "AUSTRAC_WATCHLIST" }', async () => {
  rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
  austracClient.screen.mockResolvedValue({ match: true, listName: 'AUSTRAC_WATCHLIST' });

  const result = await screenCrossBorder(PAYMENT);

  expect(result).toEqual({ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' });
});

// ---------------------------------------------------------------------------
// T4 — AC3: Both clear → returns { blocked: false, blockedBy: null }
// ---------------------------------------------------------------------------
test('T4 — Both clear → returns { blocked: false, blockedBy: null }', async () => {
  rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
  austracClient.screen.mockResolvedValue({ match: false, listName: null });

  const result = await screenCrossBorder(PAYMENT);

  expect(result).toEqual({ blocked: false, blockedBy: null });
});

// ---------------------------------------------------------------------------
// T5 — AC3 + NFR-2: Both clear → auditLogger.log called with correct entry
// ---------------------------------------------------------------------------
test('T5 — Both clear → auditLogger.log called with correct shape', async () => {
  rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
  austracClient.screen.mockResolvedValue({ match: false, listName: null });

  await screenCrossBorder(PAYMENT);

  expect(auditLogger.log).toHaveBeenCalledTimes(1);
  const entry = auditLogger.log.mock.calls[0][0];
  expect(entry.paymentId).toBe(PAYMENT.paymentId);
  expect(entry.rbnzResult).toEqual({ match: false, listName: null });
  expect(entry.austracResult).toEqual({ match: false, listName: null });
  expect(entry.blocked).toBe(false);
  expect(typeof entry.timestamp).toBe('string'); // ISO string
});

// ---------------------------------------------------------------------------
// T6 — NFR-1 / C7: Call order — RBNZ completes before AUSTRAC is invoked
// ---------------------------------------------------------------------------
test('T6 — Sequential order: RBNZ is called and resolves before AUSTRAC is called', async () => {
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

  // Strict sequential order: RBNZ must appear first, AUSTRAC second.
  // A Promise.all implementation produces non-deterministic / simultaneous
  // scheduling and cannot guarantee this ordering — this test will catch it.
  expect(callOrder).toEqual(['rbnz', 'austrac']);
});

// ---------------------------------------------------------------------------
// T7 — NFR-2: RBNZ blocks early → auditLogger called with austracResult: null
// ---------------------------------------------------------------------------
test('T7 — RBNZ blocks → auditLogger.log called with austracResult: null', async () => {
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

// ---------------------------------------------------------------------------
// T8 — NFR-2: AUSTRAC blocks → auditLogger called with correct entry
// ---------------------------------------------------------------------------
test('T8 — AUSTRAC blocks → auditLogger.log called with correct shape', async () => {
  rbnzClient.screen.mockResolvedValue({ match: false, listName: null });
  austracClient.screen.mockResolvedValue({ match: true, listName: 'AUSTRAC_WATCHLIST' });

  await screenCrossBorder(PAYMENT);

  expect(auditLogger.log).toHaveBeenCalledTimes(1);
  const entry = auditLogger.log.mock.calls[0][0];
  expect(entry.paymentId).toBe(PAYMENT.paymentId);
  expect(entry.rbnzResult).toEqual({ match: false, listName: null });
  expect(entry.austracResult).toEqual({ match: true, listName: 'AUSTRAC_WATCHLIST' });
  expect(entry.blocked).toBe(true);
  expect(typeof entry.timestamp).toBe('string');
});
```

**Expected state after Task 1:** All 8 tests fail with `Cannot find module '../../src/aml/dual-aml-screener'`. This is the correct RED state.

---

## Task 2 — Write implementation (GREEN)

**File:** `src/aml/dual-aml-screener.js`

Created only after tests are written. Implements the exact contract defined in the DoR.

```js
// src/aml/dual-aml-screener.js

'use strict';

const rbnzClient   = require('./rbnz-client');
const austracClient = require('./austrac-client');
const auditLogger  = require('../audit/audit-logger');

/**
 * Screens a cross-border payment against RBNZ and AUSTRAC watchlists.
 *
 * Regulatory constraint (C7 — RBNZ AML/CFT Act):
 *   RBNZ screening MUST complete before AUSTRAC screening begins.
 *   Promise.all is prohibited — calls are strictly sequential awaits.
 *
 * Audit constraint (C8):
 *   auditLogger.log() is called on every invocation in every outcome path.
 *   austracResult is null when RBNZ blocks early (AUSTRAC was not called).
 *
 * @param {{ paymentId: string, creditorAccount: string, debtorAccount: string, amount: number }} payment
 * @returns {Promise<{ blocked: boolean, blockedBy: string|null }>}
 */
async function screenCrossBorder(payment) {
  const { paymentId } = payment;

  // Step 1 — RBNZ screening (MUST be first per C7)
  const rbnzResult = await rbnzClient.screen(payment);

  if (rbnzResult.match) {
    // Step 2 — RBNZ match: log with austracResult null (AUSTRAC not called), return blocked
    auditLogger.log({
      paymentId,
      rbnzResult,
      austracResult: null,
      blocked:   true,
      timestamp: new Date().toISOString(),
    });
    return { blocked: true, blockedBy: 'RBNZ_SANCTIONED' };
  }

  // Step 3 — RBNZ clear: now call AUSTRAC (strictly after RBNZ resolves)
  const austracResult = await austracClient.screen(payment);

  if (austracResult.match) {
    // Step 4 — AUSTRAC match: log and return blocked
    auditLogger.log({
      paymentId,
      rbnzResult,
      austracResult,
      blocked:   true,
      timestamp: new Date().toISOString(),
    });
    return { blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' };
  }

  // Step 5 — Both clear: log and return not blocked
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

**Expected state after Task 2:** All 8 tests pass (GREEN).

---

## Task 3 — Verify no prohibited patterns (static review checklist)

Before raising the PR, confirm each item:

| Check | Requirement | Verified by |
|-------|-------------|-------------|
| No `Promise.all` | C7 / NFR-1 — parallelisation prohibited | Grep: `Promise.all` must not appear in `dual-aml-screener.js` |
| No `console.log` / `console.*` | C8 — log via `auditLogger` only | Grep: `console` must not appear in `dual-aml-screener.js` |
| `rbnzClient` called before `austracClient` | C7 | T6 call-order test; code reading confirms `await rbnzClient.screen` precedes `await austracClient.screen` |
| `auditLogger.log` called in all 3 outcome paths | NFR-2 | T5 (both clear), T7 (RBNZ block), T8 (AUSTRAC block) |
| `austracResult: null` when RBNZ blocks | NFR-2 / C8 | T7 asserts `austracResult` is `null` |
| `rbnz-client.js` not modified | W1 | File diff — only `dual-aml-screener.js` and test file changed |
| `austrac-client.js` not modified | W1 | File diff |
| `audit-logger.js` not modified | W1 | File diff |
| Timestamp is ISO string | C8 | `new Date().toISOString()` — T5/T7/T8 assert `typeof entry.timestamp === 'string'` |

---

## Task 4 — PR checklist

- [ ] Branch: `feature/payments.aml-screener-1`
- [ ] All 8 tests pass: `npm test -- tests/aml/dual-aml-screener.test.js`
- [ ] No `Promise.all` in implementation file
- [ ] No `console.*` in implementation file
- [ ] Only two new files in diff (`dual-aml-screener.js`, `dual-aml-screener.test.js`)
- [ ] Compliance team added as reviewer (Medium oversight requirement)
- [ ] PR description references C7 (sequential ordering) and C8 (audit trail) constraints

---

## Acceptance criteria traceability

| AC / NFR | Tests | Status after GREEN |
|----------|-------|--------------------|
| AC1 — RBNZ match → blocked; AUSTRAC not called | T1, T2 | ✓ |
| AC2 — RBNZ clear + AUSTRAC match → AUSTRAC blocked | T3 | ✓ |
| AC3 — Both clear → not blocked + audit log | T4, T5 | ✓ |
| NFR-1 / C7 — Sequential, RBNZ first | T6 | ✓ |
| NFR-2 / C8 — Audit log on every path | T5, T7, T8 | ✓ |
```