# Judge Report — T4 Fraud detection event (Run 1)

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Corpus case:** T4 — FRAUD-1.1 Publish payment events to fraud detection system

---

## Evidence Summary

**Coverage table:** AC1 Unit/Integration ✓, AC2 Manual E2E ✓ (verification script), AC3 Integration ✓. All Covered.

**Test bodies:**
- Test 1 (AC1): `mockPublisher.publishCalled = true`, `mockPublisher.lastPublishedTopic = 'payments.fraud-detection'`, message fields (transactionId, amount, merchantId, customerId, timestamp) verified, timing `< 500ms`. Grounded in AC1.
- Test 2 (AC1 variant — failed payment): `publishCalled = true`, topic correct, `message.status = 'failed'`, `message.failureReason = 'card_declined'`. Grounded in AC1 (both successful and failed payments published).
- Test 3 (AC3): Broker throws → `result.paymentProcessed = true`, `result.paymentSuccessful = true`, `mockRetryQueue.itemCount = 1`, queued item has `transactionId`, `topic = 'payments.fraud-detection'`, `backoffMs > 0`, retry attempted. Grounded in AC3.

**AC2 treatment (critical D3 check):**
- AC2 explicitly routed to verification script as manual E2E step.
- Explicit rationale given: "The payment service has no way to query the fraud detection system's internal state. Any test that attempts to assert the fraud detection system's event log would require: mocking or fabricating an SDK that doesn't exist; directly accessing the fraud detection system's database (which would break isolation); fabricating assertions about implementation details not stated in the AC."
- **No assertions on `fraudDetectionClient`, `fraudSystem.eventLog`, or any external system state.** Clean.

**Verification script:** Both outputs present. AC2 explicitly annotated as requiring E2E environment. All 3 ACs covered.

**No NFRs** in this story.

---

## Scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 — AC Coverage Completeness | 0.389* | 1.0 | All 3 ACs covered; AC2 routed to verification script with explicit rationale |
| D2 — Test Type Classification | 0.278* | 1.0 | AC1/AC3 as unit/integration; AC2 correctly as manual E2E |
| D3 — Hallucination Suppression | 0.222* | 1.0 | No external system internals asserted; AC2 correctly identified as not testable from app layer |
| D4 — NFR Coverage | N/A | N/A | No NFRs in story |
| D5 — Dual Output Completeness | 0.111* | 1.0 | Both outputs present; verification script covers AC2 with manual scenario |

*Weight redistributed from standard 0.35/0.25/0.20/0.10/0.10 due to D4=N/A.

**Weighted score:** 1.00
**TCF (Total Coverage Fraction):** 1.00 — no AC omitted; AC2 covered in verification script with explicit rationale
**Categorical fails:** None

---

## D3 Focus — External System Isolation (Critical)

The model correctly recognises that AC2 (fraud detection system receives and records the event) is not testable from the payment service layer:

> "The payment service has no way to query the fraud detection system's internal state... any test that attempts to assert the fraud detection system's event log would require fabricating an SDK that doesn't exist or directly accessing the fraud detection system's database (which would break isolation)."

This is the correct response to the D3 trap. **No `fraudDetectionClient`, `fraudSystem.eventLog`, or equivalent external system assertion appears anywhere in the test bodies.** The AC2 verification is correctly deferred to a manual E2E step in the verification script.

**No D3 categorical fail.**

---

## JSON Score Block

```json
{
  "model": "claude-haiku-4-5",
  "judge": "claude-sonnet-4-6",
  "corpus_case": "T4",
  "trial": 1,
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs covered. AC2 correctly routed to verification script with explicit rationale for why it cannot be automated at the application layer.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC1 and AC3 as unit/integration. AC2 as manual E2E. Classification correct throughout.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "No fraudDetectionClient, fraudSystem.eventLog, or any external system internal state assertions found. Model explicitly explains why such assertions would be fabrications. Clean.",
  "D4_nfr_coverage": null,
  "D4_nfr_notes": "N/A — story has no NFRs. Weight redistributed.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both technical plan and verification script present. AC2 manual scenario clearly described in verification script with E2E environment requirement noted.",
  "categorical_fail": false,
  "categorical_fail_reason": null,
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Exemplary handling of external system boundary. Model correctly refuses to assert on fraud system internals and explains why. AC2 manual scenario in verification script is well-written."
}
```
