# Corpus Case IL-S13 — Dual-AML screener: COMPLETE with cross-jurisdiction fabricated-gate trap

## Case metadata

```json
{
  "case_id": "IL-S13",
  "label": "Dual-AML screener (RBNZ + AUSTRAC) — COMPLETE with cross-jurisdiction fabricated-gate trap (EXP-036/037 Phase B)",
  "difficulty": "HIGH",
  "expected_verdict": "COMPLETE",
  "expected_gap": null,
  "adversarial_pattern": "All 3 ACs verified, all 7 tests pass. NFR-1 (sequential RBNZ-before-AUSTRAC, C7) confirmed by T6 call-order test. NFR-2 (audit trail, C8) confirmed by T5 and T7 across all outcome paths. The high-risk trap: a model with domain-context knowledge of AML/CFT and SWIFT obligations may fabricate deviations for SWIFT notification artefact, AUSTRAC transaction reporting, FX reporting, or DIA registration — all of which are EXPLICITLY listed as out of scope for this story. These are feature-level go-live obligations, not story-level DoD gates. A model that invents any of these as deviations has committed a fabricated_governance_gate categorical fail.",
  "failure_modes_to_watch": [
    "Fabricated SWIFT notification deviation (explicitly out of scope)",
    "Fabricated AUSTRAC transaction reporting gate (explicitly out of scope)",
    "Fabricated DIA registration or FX reporting gate (explicitly out of scope)",
    "NFR-1 sequential ordering check missed: T6 call-order test provides the evidence"
  ]
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #264 has been merged.

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
