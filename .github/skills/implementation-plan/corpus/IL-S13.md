# IL-S13 — Dual-AML Screener Module (LOW difficulty)

**Feature:** 2026-09-01-trans-tasman-payments
**Story:** payments.aml-screener-1
**Difficulty:** LOW
**Expected Phase A score:** ~0.75–0.85
**Key IP5 signal:** `Promise.all([rbnzClient.screen, austracClient.screen])` violates C7 → IP5=0.0

## Operator input

> You are running /implementation-plan on the following story in eval mode.

DoR artefact:

# IL-S13 DoR Artefact — payments.aml-screener-1

**Feature:** 2026-09-01-trans-tasman-payments
**Story:** payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (AML compliance module — compliance team added as reviewer)
**H-NFR1 (Sequential screening):** PASS — NFR-1 sequential RBNZ-before-AUSTRAC is a hard RBNZ regulatory obligation; parallelisation prohibited
**H-NFR2 (Audit trail):** PASS — NFR-2 audit log required on every screening call for AML compliance
**H-C7 (RBNZ ordering):** PASS — `Promise.all` parallelisation is prohibited
**Warnings:** W1 — `rbnzClient` and `austracClient` are existing modules; mock them in tests; do not modify them

## Contract Proposal

**What will be built:**

A screener module `src/aml/dual-aml-screener.js` exporting `screenCrossBorder(payment)`:
- Calls `rbnzClient.screen(payment)` first (C7 — RBNZ domestic regulator obligation)
- RBNZ match → immediately returns `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }` without calling AUSTRAC
- RBNZ clear → calls `austracClient.screen(payment)` second
- AUSTRAC match → returns `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }`
- Both clear → returns `{ blocked: false, blockedBy: null }`
- On every call: `auditLogger.log({ paymentId, rbnzResult, austracResult, blocked, timestamp })` (C8)

**What will NOT be built:** Payment routing, SWIFT notification artefact, AUSTRAC transaction reporting, FX reporting, DIA registration.

**Files to touch:**
- Create: `src/aml/dual-aml-screener.js`
- Create: `tests/aml/dual-aml-screener.test.js`

## Coding Agent Instructions

**Branch:** `feature/payments.aml-screener-1`
**Test command:** `npm test -- tests/aml/dual-aml-screener.test.js`
**Oversight:** Medium

**Architecture Constraint (C7 — RBNZ AML/CFT ACT):** RBNZ screening MUST precede AUSTRAC screening. Do NOT use `Promise.all([rbnzClient.screen(payment), austracClient.screen(payment)])` — this parallelises the calls and violates C7 by removing the guaranteed RBNZ-first ordering in audit logs. Use sequential `await` calls: `rbnzClient.screen()` completes before `austracClient.screen()` is called.

**Architecture Constraint (C8 — AUDIT LOGGER):** All screening outcomes must be logged via `src/audit/audit-logger.js`. Use `auditLogger.log({ paymentId, rbnzResult, austracResult, blocked, timestamp })`. `austracResult` is `null` when RBNZ blocks early. Do NOT log to console.

**NFR-1 (Sequential order):** `await rbnzClient.screen()` → (if clear) → `await austracClient.screen()`. RBNZ match = early return without calling AUSTRAC.
**NFR-2 (Audit log completeness):** Log on EVERY call in all outcome paths — RBNZ block, AUSTRAC block, both-clear.

**Out of scope:** Payment routing, SWIFT notification, AUSTRAC reporting, FX reporting, DIA registration.

---

Definition artefact:

# IL-S13 Definition Artefact — Dual-AML Screener Module

**Feature:** 2026-09-01-trans-tasman-payments
**Story slug:** payments.aml-screener-1

## Story: payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel

**AC1:** Given `rbnzClient.screen()` returns `{ match: true }`, when `screenCrossBorder(payment)` is called, then it returns `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }` and does NOT call `austracClient.screen()`.

**AC2:** Given RBNZ clears and `austracClient.screen()` returns `{ match: true }`, when `screenCrossBorder(payment)` is called, then it returns `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }`.

**AC3:** Given both return `{ match: false }`, when `screenCrossBorder(payment)` is called, then it returns `{ blocked: false, blockedBy: null }` and an audit log entry is written.

**Out of Scope:** Payment routing, SWIFT notification artefact, AUSTRAC transaction reporting, FX reporting, DIA registration.

**NFR-1 (RBNZ AML/CFT Act — Sequential):** RBNZ must precede AUSTRAC. No `Promise.all`. Strictly sequential `await`.

**NFR-2 (Audit Trail):** `auditLogger.log()` on every call — all outcome paths. `austracResult: null` when RBNZ blocks early.

**Architecture Constraints:**
**C7 (RBNZ Ordering):** RBNZ MUST precede AUSTRAC. `Promise.all` prohibited.
**C8 (Audit Logger):** Log via `src/audit/audit-logger.js` — not console.

---

Test plan:

# IL-S13 Test Plan — payments.aml-screener-1

| AC / NFR | Tests | Coverage |
|----------|-------|----------|
| AC1 — RBNZ match blocks; AUSTRAC not called | T1: RBNZ match → blocked; T2: AUSTRAC mock NOT called | Full |
| AC2 — RBNZ clear; AUSTRAC match blocks | T3: RBNZ clear + AUSTRAC match → blocked by AUSTRAC | Full |
| AC3 — Both clear; audit log written | T4: both clear → not blocked; T5: auditLogger called | Full |
| NFR-1 — Sequential order (C7) | T6: call-order tracking → RBNZ first, AUSTRAC second | Full |
| NFR-2 — Audit log on every call | T5, T7: auditLogger called for clear and RBNZ-block paths | Full |

**T6 (C7 critical test):** Track call sequence using shared array — both mocks append name when invoked. Expected: `['rbnz', 'austrac']`. A `Promise.all` implementation produces non-deterministic order and fails T6.

**T7:** RBNZ blocks early — `auditLogger.log` called with `austracResult: null`.

---

Codebase context:

```js
// src/aml/rbnz-client.js (existing — do NOT modify)
// async function screen({ paymentId, creditorAccount, debtorAccount, amount }) {
//   // Returns: { match: boolean, listName: 'RBNZ_SANCTIONED' | null }
// }

// src/aml/austrac-client.js (existing — do NOT modify)
// async function screen({ paymentId, creditorAccount, debtorAccount, amount }) {
//   // Returns: { match: boolean, listName: 'AUSTRAC_WATCHLIST' | null }
// }

// src/audit/audit-logger.js (existing — do NOT modify)
// function log(entry) {
//   // entry: { paymentId, rbnzResult, austracResult, blocked, timestamp }
//   //   austracResult is null when RBNZ blocked early (AUSTRAC not called per C7)
// }

// src/aml/dual-aml-screener.js (to be CREATED by payments.aml-screener-1)
// Must export: screenCrossBorder(payment) → Promise<{ blocked: boolean, blockedBy: string | null }>
//
// Sequential flow (C7 — NO Promise.all):
//   1. await rbnzClient.screen(payment)   — RBNZ first
//   2. if match → log (austracResult: null) → return { blocked: true, blockedBy: 'RBNZ_SANCTIONED' }
//   3. await austracClient.screen(payment) — AUSTRAC second
//   4. log result → if match → return { blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }
//   5. return { blocked: false, blockedBy: null }

// tests/aml/dual-aml-screener.test.js (to be CREATED by payments.aml-screener-1)
// jest.mock('../../src/aml/rbnz-client')
// jest.mock('../../src/aml/austrac-client')
// jest.mock('../../src/audit/audit-logger')
```

Produce the implementation plan. Write it to artefacts/2026-09-01-trans-tasman-payments/plans/payments.aml-screener-1-plan.md.

## Expected characteristics

# IL-S13 DoR Artefact — payments.aml-screener-1

**Feature:** 2026-09-01-trans-tasman-payments
**Story:** payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium

## Contract Proposal

**What will be built:** Module `src/aml/dual-aml-screener.js` exporting `screenCrossBorder(payment)`:
- Sequential: `await rbnzClient.screen()` → (if clear) → `await austracClient.screen()`
- RBNZ match → `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }` (AUSTRAC not called)
- AUSTRAC match → `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }`
- Both clear → `{ blocked: false, blockedBy: null }`
- Every call: `auditLogger.log({ paymentId, rbnzResult, austracResult, blocked, timestamp })`

**What will NOT be built:** Routing, SWIFT notification, AUSTRAC reporting, FX reporting, DIA registration.

**ACs:**
- AC1: RBNZ match → blocked; AUSTRAC NOT called
- AC2: RBNZ clear + AUSTRAC match → blocked by AUSTRAC
- AC3: Both clear → not blocked; audit log written

**NFR-1:** Sequential RBNZ → AUSTRAC. C7 ordering. NO `Promise.all`.
**NFR-2:** `auditLogger.log()` on every call in all outcome paths. `austracResult: null` on RBNZ early exit.

**Architecture Constraints:**
- C7: RBNZ MUST precede AUSTRAC. `Promise.all` = C7 violation = IP5=0.0 categorical fail.
- C8: Audit via `src/audit/audit-logger.js` only — not console.

**Files to touch:**
- Create: `src/aml/dual-aml-screener.js`
- Create: `tests/aml/dual-aml-screener.test.js`
