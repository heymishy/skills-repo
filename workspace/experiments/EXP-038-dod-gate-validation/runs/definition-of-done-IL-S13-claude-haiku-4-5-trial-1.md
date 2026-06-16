# /definition-of-done — payments.aml-screener-1

## ✅ DONE

**Story:** Implement dual-AML screener for trans-Tasman payment channel  
**PR:** #264 (merged)  
**Run date:** [Current]

---

## Acceptance Criteria — ALL PASS ✅

| AC | Requirement | Evidence | Status |
|-------|-------------|----------|--------|
| **AC1** | RBNZ match → `{ blocked: true, blockedBy: 'RBNZ_SANCTIONED' }`; AUSTRAC not called | T1 PASS; T2 PASS (`austracClient.screen` not invoked) | ✅ |
| **AC2** | RBNZ clear + AUSTRAC match → `{ blocked: true, blockedBy: 'AUSTRAC_WATCHLIST' }` | T3 PASS | ✅ |
| **AC3** | Both clear → `{ blocked: false, blockedBy: null }` + audit log entry written | T4 PASS; T5 PASS (audit fields correct) | ✅ |

---

## Non-Functional Requirements — ALL PASS ✅

| NFR | Requirement | Evidence | Status |
|-------|-------------|----------|--------|
| **NFR-1 (C7)** | Sequential RBNZ-then-AUSTRAC. No `Promise.all`. | T6 PASS: call order `['rbnz', 'austrac']` deterministically verified; code review: sequential `await` pattern confirmed; no parallelization. | ✅ |
| **NFR-2 (C8)** | `auditLogger.log()` called on every screening call | T5 PASS (both-clear path); T7 PASS (RBNZ-block path); code review confirms all three outcome paths invoke audit. `austracResult: null` when RBNZ blocks early. | ✅ |

---

## Test Coverage — 7/7 PASSING ✅

```
PASS  tests/aml/dual-aml-screener.test.js
  ✓ T1 — RBNZ match → RBNZ_SANCTIONED
  ✓ T2 — AUSTRAC not called on RBNZ block
  ✓ T3 — AUSTRAC match when RBNZ clear
  ✓ T4 — Both clear → not blocked
  ✓ T5 — Audit log on clear with correct fields
  ✓ T6 — Call order verified (RBNZ before AUSTRAC)
  ✓ T7 — Audit log on RBNZ block; austracResult null

7 passed, 7 total
```

---

## Scope Checklist ✅

- ✅ AML screening logic (dual screener) — **IN SCOPE**
- ✅ Audit trail integration — **IN SCOPE**
- ❌ Payment routing — **OUT OF SCOPE** (correctly excluded)
- ❌ SWIFT notification artefact — **OUT OF SCOPE** (correctly excluded)
- ❌ AUSTRAC transaction reporting — **OUT OF SCOPE** (correctly excluded)
- ❌ FX reporting — **OUT OF SCOPE** (correctly excluded)
- ❌ DIA registration — **OUT OF SCOPE** (correctly excluded)

---

## Code Quality ✅

| Aspect | Status | Notes |
|--------|--------|-------|
| **Files changed** | ✅ Minimal | 2 files: `dual-aml-screener.js` (new), `dual-aml-screener.test.js` (new) |
| **Module exports** | ✅ Clear | `screenCrossBorder(payment)` — single responsibility |
| **Test mocking** | ✅ Proper | `jest.mock` for external clients (rbnzClient, austracClient, auditLogger) |
| **Sequential pattern** | ✅ Correct | `await` chains; no `Promise.all` |

---

## **DEFINITION OF DONE: SATISFIED** ✅

**Recommendation:** Story ready for deployment to production.