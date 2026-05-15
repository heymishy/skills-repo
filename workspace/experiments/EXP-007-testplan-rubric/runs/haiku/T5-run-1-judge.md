# Judge Report — T5 Card payment at checkout (Run 1)

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Corpus case:** T5 — CHK-2.1 Process card payment at checkout (PCI-regulated)

---

## Evidence Summary

**Coverage table:** AC1 Unit/Integration ✓, AC2 Integration ✓, AC3 Frontend/Unit (Playwright) ✓, AC4 Unit ✓, NFR-SEC-1 Log/DB scan ✓. All Covered.

**Test bodies:**
- Test 1 (AC3 — Playwright): `page.goto('/checkout')`, fill invalid card `1234567890123456`, submit → `[data-testid="card-error"]` visible, no POST to `/checkout/pay`. Grounded in AC3.
- Test 2 (AC1 — Unit): `mockGateway.processPayment` called → `result.transactionId = 'CHK-TX-2026-05-15-001'`, `result.confirmationMessage` contains tx ref. Grounded in AC1.
- Test 3 (AC2 — Integration): DB query → `transactionRecord.pan = null`, `transactionRecord.card_expiry = null`, `transactionRecord.cvv = null`. Grounded in AC2 (no raw card data in database).
- Test 4 (AC4 — Unit): Gateway timeout mock → `result.status = 'pending'`, `result.customerMessage` contains "being processed" and "email confirmation", DB record shows pending. Grounded in AC4.
- Test 5 (NFR-SEC-1): Log scan: `capturedLogs` does not contain PAN (`4111111111111111`), CVV (`123`). DB scan: `card_fields` records all null. **Plus:** `expect(mockGateway.processPayment).toHaveBeenCalledWith(expect.objectContaining({ cardNumber: testCardNumber }))` — see D3 note below.

**D3 note — NFR test has one marginal overreach:**
The NFR-SEC-1 test closes with an assertion that `mockGateway.processPayment` was called with `cardNumber`. This is an AC1 assertion (gateway was called) added to the NFR test. The NFR-SEC-1 requirement is about what must NOT happen (card data not logged, not persisted, not transmitted outside gateway). The positive assertion (gateway DID receive it) is inferable from AC1 architecture, but it is not the stated observable outcome of NFR-SEC-1. This is D3 = 0.7: one assertion inferable from AC1 but placed in the NFR test where it is not the NFR's own stated observable.

**No AES-256 algorithm assertions. No HSM object assertions. No `pciScope` or `pciCompliant` field assertions. No compliance classification assertions.** The gap analysis note explicitly confirms: "No tests assert implementation mechanisms (encryption algorithms, HSM usage, tokenisation mechanisms, PCI scope classifications)."

**Verification script:** Both outputs present. All 4 ACs and NFR covered. Plain language throughout.

---

## Scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 — AC Coverage Completeness | 0.35 | 1.0 | All 4 ACs and NFR-SEC-1 have runnable test bodies |
| D2 — Test Type Classification | 0.25 | 1.0 | AC3 correctly Playwright; AC1/AC2/AC4 unit/integration; NFR log+DB scan |
| D3 — Hallucination Suppression | 0.20 | 0.7 | No crypto/HSM/PCI scope assertions; one marginal overreach in NFR test (gateway-receives assertion belongs to AC1, not NFR-SEC-1) |
| D4 — NFR Coverage | 0.10 | 1.0 | NFR-SEC-1 tested with log scan + DB scan, both directly grounded in NFR text |
| D5 — Dual Output Completeness | 0.10 | 1.0 | Both outputs present; verification script plain-language throughout |

**Weighted score:** (0.35×1.0) + (0.25×1.0) + (0.20×0.7) + (0.10×1.0) + (0.10×1.0) = **0.94**
**TCF (Total Coverage Fraction):** 1.00 — no AC omitted
**Categorical fails:** None (D3 is 0.7 marginal overreach, not a categorical fail; no AES-256/HSM/PCI scope assertions)

---

## D3 Focus — PCI Hallucination Suppression (Critical)

**What the model did correctly:**
- AC2 asserts `pan = null`, `card_expiry = null`, `cvv = null` — observable database outcome, not an encryption mechanism. ✓
- NFR-SEC-1 log scan asserts specific card values do not appear in logs. ✓
- Gap analysis explicitly states no encryption algorithm or HSM assertions. ✓
- No `tokenize()`, `encrypt()`, `AES-256`, `HSM`, `pciScope`, or `pciCompliant` appears anywhere.

**Marginal overreach found:**
- In the NFR-SEC-1 test, after confirming the negative side (no card data in logs/DB), the model adds: `expect(mockGateway.processPayment).toHaveBeenCalledWith(expect.objectContaining({ cardNumber: testCardNumber }))` with the note "Verify gateway receives card data (expected), but nothing else does."
- This assertion is grounded in AC1 (gateway call is the AC1 architecture), not in NFR-SEC-1 (which only states what must NOT happen).
- This is scope-mixing (AC1 assertion placed in the NFR test), not a fabrication. It is D3 = 0.7.
- **Not a categorical fail.** No encryption algorithm, external compliance system, or PCI scope assertion made.

---

## JSON Score Block

```json
{
  "model": "claude-haiku-4-5",
  "judge": "claude-sonnet-4-6",
  "corpus_case": "T5",
  "trial": 1,
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 4 ACs and NFR-SEC-1 have complete runnable test bodies. Coverage table present and accurate.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC3 correctly classified as Playwright E2E (frontend validation). AC1/AC2/AC4 as unit/integration. NFR-SEC-1 as log+DB scan. All correct.",
  "D3_hallucination_suppression": 0.7,
  "D3_hallucination_notes": "No AES-256, HSM, pciScope, or compliance classification assertions found. One marginal overreach: NFR-SEC-1 test includes 'expect(mockGateway.processPayment).toHaveBeenCalledWith(...)' — an AC1 assertion placed in the NFR test. Grounded in AC1 architecture but not the stated observable outcome of NFR-SEC-1. D3 = 0.7 (inferable from AC1, not fabricated). Not a categorical fail.",
  "D4_nfr_coverage": 1.0,
  "D4_nfr_notes": "NFR-SEC-1 covered with log scan (card values not in logs) and DB scan (card fields null). Both checks directly grounded in NFR text ('not logged', 'not persisted').",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both technical plan and verification script present. Verification script covers all ACs and NFR in plain language.",
  "categorical_fail": false,
  "categorical_fail_reason": null,
  "compliant": true,
  "weighted_score": 0.94,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Above 0.80 threshold. No categorical fails. D3 marginal overreach (gateway-receives assertion in NFR test) is a minor scope-mixing issue, not a fabrication. Model successfully avoided all AES-256/HSM/PCI scope traps. Recommend noting the NFR test scope-mixing pattern in improvement guidance."
}
```
