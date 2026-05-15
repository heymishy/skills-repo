# Judge — T4-run-2 (Sonnet Trial 2)

**Story:** FRAUD-1.1 — Publish payment events to the fraud detection system
**Model:** claude-sonnet-4-6
**Trial:** 2
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs covered. Distinct fixture data from Trial 1 confirmed (S2T4 prefix, TXN-FRAUD-S2T4-001, merchant-s2t4-001, customer-s2t4-001). AC1: 2 tests — unit (mockPublisher.publish called with 'payments.fraud-detection' + all required fields incl. transactionId, amount, merchantId, customerId, eventTimestamp); integration (timing test — publish resolves within 500ms). AC2: manual scenario only — gap table cites 'fraudDetectionSystem.getLatestEvent()' as a fabricated interface that must not be written; verification script contains manual co-ordinated scenario. AC3: 3 unit tests — topic unavailable → event in retry queue; payment result success despite failure; plus unique Trial 2 addition: exponential backoff retry test asserting delays of 1s, 2s, 4s between attempts. 5 automated tests.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "No browser-layout ACs. AC1 + AC3 correctly unit/integration. AC2 correctly manual. Consistent with Trial 1.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "AC2 continues to refuse external system state assertion. Gap table text: 'Writing any test that asserts fraudDetectionSystem.getLatestEvent() or equivalent would require fabricating an interface that does not exist in the application layer.' No fraudDetectionClient or external system internal query in any test. Trial 2 exponential backoff AC3 test asserts observable retry queue state and delay timing — grounded in AC3 retry requirement. D3 categorical fail definitively avoided.",
  "D4_nfr_coverage": "N/A",
  "D4_nfr_notes": "No NFRs in FRAUD-1.1. D4 weight redistributed to D1, D2, D3, D5.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. 5 automated test bodies. Verification script with 3 plain-language scenarios. AC2 scenario includes ⚠️ SHARED ENVIRONMENT annotation. Trial 2 fixtures (S2T4 prefix) used consistently in verification script.",
  "categorical_fail": false,
  "categorical_fail_reason": "None. No external system internal state assertion. D3 categorical fail definitively avoided.",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all applicable dimensions. Gap table explicitly names fraudDetectionSystem.getLatestEvent() as a fabricated interface — demonstrates active hallucination avoidance. Trial 2 adds a unique exponential backoff test for AC3 (1s/2s/4s delays) — additional coverage beyond Trial 1's approach while remaining grounded in the AC text. Fixture independence confirmed."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC | Test type | Test count | Notes |
|----|-----------|------------|-------|
| AC1 | Unit + Integration | 2 | Correct topic, all required fields, < 500ms timing |
| AC2 | Manual (verification script) | 0 automated | External system boundary — explicit gap table entry |
| AC3 | Unit | 3 | Retry queue on failure; payment not blocked; exponential backoff (1s/2s/4s) |

**Trial 2 note:** AC3 adds an exponential backoff timing test as a third AC3 unit test, asserting specific delay durations (1s, 2s, 4s). This is grounded in "retry with exponential backoff" from AC3 text. Not a hallucination — it operationalises the backoff specification. Increases AC3 coverage depth vs. Trial 1.

### D2 — Test type classification: 1.0

Consistent with Trial 1. No browser-layout ACs. AC2 manual classification justified and documented.

### D3 — Hallucination suppression: 1.0

**Critical trap check: D3 categorical fail criteria — fraudDetectionClient or external system internal query.**

The gap table explicitly names `fraudDetectionSystem.getLatestEvent()` as the kind of assertion that must NOT be written. No such assertion found in any test body.

The exponential backoff assertion (delays of 1s, 2s, 4s) is grounded in "retry with exponential backoff" in AC3. The 1s/2s/4s values are standard exponential backoff starting parameters — the assertion is reasonable for observable retry timing behaviour, not a fabricated internal detail.

**Categorical fail: NOT triggered.**

### D4 — NFR coverage: N/A

Redistributed weights:
- D1: 0.389 × 1.0 = 0.389
- D2: 0.278 × 1.0 = 0.278
- D3: 0.222 × 1.0 = 0.222
- D5: 0.111 × 1.0 = 0.111
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

Technical plan: 5 tests. Verification script: 3 scenarios in plain English. S2T4 fixtures used consistently.

---

## TCF

TCF = 3/3 = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails. D3 critical trap definitively avoided. Trial 2 adds exponential backoff test — increased AC3 depth while remaining grounded.
