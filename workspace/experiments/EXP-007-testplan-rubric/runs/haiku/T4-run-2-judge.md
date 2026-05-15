# Judge Report — T4 Fraud detection event (Run 2)

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Corpus case:** T4 — FRAUD-1.1 Publish payment events to fraud detection system

---

## Evidence Summary

**Coverage table:** AC1 Unit ✓, AC2 Manual E2E ✓ (verification script), AC3 Integration ✓. All Covered.

**Test bodies:**
- Test 1 (AC1): `mockPublisher.publishCalled = true`, `lastPublishedTopic = 'payments.fraud-detection'`, message fields (transactionId, amount, merchantId, customerId, timestamp) verified, timing `< 500ms`. Grounded in AC1.
- Test 2 (AC1 variant — failed payment): `publishCalled = true`, topic correct, `message.status = 'failed'`. Grounded in AC1.
- Test 3 (AC3): Broker throws → `result.paymentProcessed = true`, `mockRetryQueue.itemCount = 1`, `queuedItem.topic = 'payments.fraud-detection'`, retry fields present. Grounded in AC3.

**AC2 treatment (critical D3 check):**
- AC2 explicitly routed to verification script as manual E2E step.
- Annotated: "requires full E2E environment" with instruction to navigate to fraud system dashboard to verify event receipt.
- **No `fraudDetectionClient`, `fraudSystem.eventLog`, or equivalent external system assertions in any test body.** Clean.

**Verification script:** Both outputs present. AC2 annotated with ⚠️ "requires full E2E environment" and describes navigating to the fraud system's dashboard. All 3 ACs covered.

**No NFRs.** Distinct transaction IDs and fixture data from Trial 1.

---

## Scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 — AC Coverage Completeness | 0.389* | 1.0 | All 3 ACs covered; AC2 in verification script with rationale |
| D2 — Test Type Classification | 0.278* | 1.0 | AC1/AC3 unit/integration; AC2 correctly manual E2E |
| D3 — Hallucination Suppression | 0.222* | 1.0 | No external system internals asserted; clean boundary maintained |
| D4 — NFR Coverage | N/A | N/A | No NFRs in story |
| D5 — Dual Output Completeness | 0.111* | 1.0 | Both outputs present; AC2 manual scenario well-described |

*Weight redistributed from standard 0.35/0.25/0.20/0.10/0.10 due to D4=N/A.

**Weighted score:** 1.00
**TCF (Total Coverage Fraction):** 1.00 — no AC omitted
**Categorical fails:** None

---

## D3 Focus — External System Isolation (Critical)

Consistent with Trial 1 — no assertions on fraud system internals. AC2 correctly identified as requiring manual E2E verification. The verification script describes the AC2 scenario at the system level (navigate to fraud dashboard) without fabricating any SDK or database access.

**No D3 categorical fail. Consistent across both trials.**

---

## JSON Score Block

```json
{
  "model": "claude-haiku-4-5",
  "judge": "claude-sonnet-4-6",
  "corpus_case": "T4",
  "trial": 2,
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs covered. AC2 routed to verification script with ⚠️ E2E environment annotation.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC1/AC3 unit/integration. AC2 manual E2E. All correct.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "No fraudDetectionClient or external system internals asserted. Consistent clean boundary across both trials.",
  "D4_nfr_coverage": null,
  "D4_nfr_notes": "N/A — no NFRs. Weight redistributed.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. AC2 manual scenario described at system-observable level (navigate to fraud system dashboard).",
  "categorical_fail": false,
  "categorical_fail_reason": null,
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Consistent with Trial 1. Correct external system boundary handling across both trials. No fabricated SDK or internal state assertions."
}
```
