# Judge Report — T5 Card payment at checkout (Run 2)

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Corpus case:** T5 — CHK-2.1 Process card payment at checkout (PCI-regulated)

---

## Evidence Summary

**Coverage table:** AC1 Unit/Integration ✓, AC2 Integration ✓, AC3 Frontend (Playwright) ✓, AC4 Unit ✓, NFR-SEC-1 Log/DB scan ✓. All Covered.

**Test bodies:**
- Test 1 (AC1 — Unit/Integration): `mockGateway.processPayment` returns `{transactionId, status:'approved'}` → `result.confirmationMessage` contains tx ref. Grounded in AC1.
- Test 2 (AC2 — Integration): `mockDb.query('SELECT pan, card_expiry, cvv...')` → `record.pan = null`, `record.cvv = null`, `record.expiry = null`. Grounded in AC2.
- Test 3 (AC3 — Playwright): `page.fill('[data-testid="card-number"]', '1234567890123456')` → `[data-testid="card-number-error"]` visible, `apiRequests === 0`. Grounded in AC3.
- Test 4 (AC4 — Unit): Gateway timeout → `result.status = 'pending'`, `result.customerMessage` contains "being processed"/"email confirmation", DB shows pending. Grounded in AC4.
- Test 5 (NFR-SEC-1): Log scan: card values (`4111`, `123`, `12/26`) not in logs. DB scan: card fields null. **Plus:** `expect(mockGateway.processPayment).toHaveBeenCalledWith(expect.objectContaining({ cardNumber: testCardNumber }))` — see D3 note below. Same marginal overreach pattern as Trial 1.

**D3 note:** Same gateway-receives assertion in NFR test as Trial 1. D3 = 0.7 (marginal overreach — AC1 assertion placed in NFR-SEC-1 test). Not a categorical fail.

**No AES-256 algorithm assertions. No HSM object assertions. No `pciScope` or `pciCompliant` field assertions.**

**Verification script:** Both outputs present. All 4 ACs and NFR covered. Plain language throughout. Distinct test card values and transaction IDs from Trial 1.

---

## Scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 — AC Coverage Completeness | 0.35 | 1.0 | All 4 ACs and NFR-SEC-1 have runnable test bodies |
| D2 — Test Type Classification | 0.25 | 1.0 | AC3 correctly Playwright E2E; others correctly unit/integration/log-scan |
| D3 — Hallucination Suppression | 0.20 | 0.7 | Same marginal overreach as Trial 1: gateway-receives assertion in NFR test; no crypto/HSM/PCI categorical fail |
  | D4 — NFR Coverage | 0.10 | 1.0 | NFR-SEC-1 log scan + DB scan; both grounded in NFR text |
| D5 — Dual Output Completeness | 0.10 | 1.0 | Both outputs present; plain-language verification script |

**Weighted score:** (0.35×1.0) + (0.25×1.0) + (0.20×0.7) + (0.10×1.0) + (0.10×1.0) = **0.94**
**TCF (Total Coverage Fraction):** 1.00 — no AC omitted
**Categorical fails:** None

---

## D3 Focus — PCI Hallucination Suppression (Critical)

Consistent with Trial 1. The model:
- Does not assert encryption algorithms (no AES-256, no RSA)
- Does not access HSM objects (no `hsmClient`, `hsm.encrypt()`)
- Does not assert PCI scope classifications (no `pciScope`, `pciCompliant`)
- Correctly tests the observable outcomes: database has null card fields, logs have no card data

**Same marginal overreach as Trial 1:** `expect(mockGateway.processPayment).toHaveBeenCalledWith(...)` in the NFR test. This is a consistent pattern across both trials — the model adds the positive check (gateway received data) to the NFR negative-check test. Inferable from AC1, not fabricated. D3 = 0.7.

**No categorical fail. Consistent across both trials.**

---

## JSON Score Block

```json
{
  "model": "claude-haiku-4-5",
  "judge": "claude-sonnet-4-6",
  "corpus_case": "T5",
  "trial": 2,
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 4 ACs and NFR-SEC-1 covered with complete runnable test bodies. Coverage table accurate.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC3 correctly Playwright E2E. AC1/AC2/AC4 unit/integration. NFR-SEC-1 log+DB scan. Consistent with Trial 1.",
  "D3_hallucination_suppression": 0.7,
  "D3_hallucination_notes": "No AES-256, HSM, pciScope assertions. Same marginal overreach as Trial 1: gateway-receives assertion (an AC1 concern) placed in NFR-SEC-1 test. This is a consistent two-trial pattern, confirming it is a systematic model tendency rather than noise. D3 = 0.7. Not a categorical fail.",
  "D4_nfr_coverage": 1.0,
  "D4_nfr_notes": "NFR-SEC-1 covered with log scan and DB scan. Both directly grounded in NFR text.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. Plain-language verification script.",
  "categorical_fail": false,
  "categorical_fail_reason": null,
  "compliant": true,
  "weighted_score": 0.94,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Above 0.80 threshold. No categorical fails. D3=0.7 pattern is consistent across both T5 trials — the model reliably avoids crypto/HSM hallucinations but consistently adds an AC1 assertion to the NFR test. This is a systematic pattern to address in prompt improvement for the test-plan skill."
}
```
