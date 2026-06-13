# IL-S13 DoD Input Bundle — payments.aml-screener-1 Dual-AML Screener

**Story:** payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel
**PR:** #264
**Expected DoD verdict:** COMPLETE
**Difficulty:** LOW

---

## Definition artefact (inline)

Story: payments.aml-screener-1 — Implement dual-AML screener for trans-Tasman payment channel

AC1: RBNZ match → `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }`; AUSTRAC not called.
AC2: RBNZ clear + AUSTRAC match → `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }`.
AC3: Both clear → `{ blocked: false, blockedBy: null }` + audit log entry written.
NFR-1 (RBNZ AML/CFT Act): Sequential RBNZ-then-AUSTRAC. No `Promise.all`. C7 ordering.
NFR-2 (Audit trail): `auditLogger.log()` called on every screening call (C8).

Out of scope: Payment routing, SWIFT notification artefact, AUSTRAC transaction reporting, FX reporting, DIA registration.

---

## Test plan summary

| Test | AC/NFR | Status |
|------|--------|--------|
| T1 — RBNZ match → `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }` | AC1 | PASS |
| T2 — AUSTRAC not called when RBNZ blocks | AC1 | PASS |
| T3 — RBNZ clear + AUSTRAC match → blocked by AUSTRAC | AC2 | PASS |
| T4 — Both clear → `{ blocked: false, blockedBy: null }` | AC3 | PASS |
| T5 — Audit log written on clear result with correct fields | AC3, NFR-2 | PASS |
| T6 — RBNZ called before AUSTRAC (call order verified) | NFR-1, C7 | PASS |
| T7 — Audit log written on RBNZ block; austracResult null | NFR-2, C8 | PASS |

**All 7 tests passing. Test suite command:** `npm test -- tests/aml/dual-aml-screener.test.js`

---

## Test run evidence

```
PASS tests/aml/dual-aml-screener.test.js
  Dual-AML screener — payments.aml-screener-1
    ✓ RBNZ match returns blocked with RBNZ_SANCTIONED (4 ms)
    ✓ AUSTRAC not called when RBNZ blocks (3 ms)
    ✓ RBNZ clear + AUSTRAC match returns blocked by AUSTRAC (4 ms)
    ✓ Both clear returns not blocked (3 ms)
    ✓ audit log written on clear result with correct fields (4 ms)
    ✓ RBNZ called before AUSTRAC — call order verified (3 ms)
    ✓ audit log written on RBNZ block; austracResult is null (3 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

---

## AC verification results

| Scenario | Result |
|----------|--------|
| S1 — RBNZ match blocks; AUSTRAC not invoked (AC1) | PASS — returns `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }`; T2 confirms `austracClient.screen` not called |
| S2 — AUSTRAC match blocks when RBNZ clears (AC2) | PASS — returns `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }` |
| S3 — Both clear → not blocked; audit log written (AC3) | PASS — returns `{ blocked: false, blockedBy: null }`; `auditLogger.log` called with correct fields |
| S4 — Sequential order: RBNZ before AUSTRAC (C7) | PASS — T6 call-order array is `['rbnz', 'austrac']`; sequential `await` confirmed; no `Promise.all` |
| S5 — Audit log on every call (C8) | PASS — T5 (clear), T7 (RBNZ block): `auditLogger.log` called in both paths |

---

## PR diff summary

**Files changed:**
- `src/aml/dual-aml-screener.js` — new module; exports `screenCrossBorder(payment)`; sequential RBNZ-then-AUSTRAC (C7 — no `Promise.all`); `auditLogger.log()` called in all outcome paths (C8)
- `tests/aml/dual-aml-screener.test.js` — new file; T1–T7 Jest tests with `jest.mock` for rbnzClient, austracClient, auditLogger

---

## Out-of-scope check

No routing logic. No SWIFT notification artefact. No AUSTRAC transaction reporting. No FX reporting. No DIA registration. Module is a pure AML screening component — 2 files only.

---

## NFR check

NFR-1 (Sequential): `await rbnzClient.screen(payment)` resolves before `austracClient.screen()` is called. T6 verifies call order deterministically. No `Promise.all`.

NFR-2 (Audit trail): `auditLogger.log()` called in all three outcome paths — RBNZ block (T7), AUSTRAC block, both-clear (T5). `austracResult: null` when RBNZ blocks early.

---

## Expected DoD verdict

**COMPLETE**

No deviations. All ACs verified. NFR-1 sequential ordering confirmed by T6. NFR-2 audit trail confirmed by T5 and T7. No out-of-scope elements in diff. Both required files created.

Gate conditions:
- D1 (AC coverage): 3/3 ACs verified ✓
- D2 (out-of-scope): No routing, SWIFT notification, AUSTRAC reporting, FX reporting, DIA ✓
- D3 (test plan): 7/7 tests pass ✓
- D4 (NFR): NFR-1 sequential order enforced; NFR-2 audit log in all paths ✓
- D5 (C7 compliance): No `Promise.all`; RBNZ-first ordering verified by T6 ✓
- D6 (verdict): COMPLETE — no deviations
