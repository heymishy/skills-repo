# Judge — T1-run-2 (Sonnet Trial 2)

**Story:** PAY-3.1 — Send payment confirmation email after successful transaction
**Model:** claude-sonnet-4-6
**Trial:** 2
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 4 ACs covered with runnable test bodies. Distinct fixture data from Trial 1 confirms independent run (TXN-S2-PAY-001, shopper@domain.com, 'Premier Goods Ltd', £249.50 vs Trial 1's TXN-001-SONNET, customer@example.com, etc.). AC1: email dispatched to shopper@domain.com (mockEmailService.send called). AC2: no email on failure + mockAuditLog.write called. AC3: email body contains transaction ref, amount, merchant, datetime. AC4: payment completes despite email service failure + failure logged + retry queue entry. 6 tests (5 unit + 1 integration).",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "No browser-layout-dependent ACs. All correctly classified as unit (5 tests) or integration (1 test). No unnecessary E2E tests.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in observable AC outcomes. No assertions on SMTP protocol, email provider implementation, retry interval, queue technology, or encryption. Distinct fixture IDs and addresses from Trial 1 confirm independent generation without carry-over.",
  "D4_nfr_coverage": "N/A",
  "D4_nfr_notes": "No NFRs in PAY-3.1. D4 weight redistributed to D1, D2, D3, D5.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. Technical test plan with 6 test bodies. Verification script has 4 plain-language scenarios for all 4 ACs. Uses distinct fixture data (shopper@domain.com, Premier Goods Ltd) throughout the verification script, consistent with the test plan.",
  "categorical_fail": false,
  "categorical_fail_reason": "None",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all applicable dimensions. Fixture independence confirmed (distinct names, amounts, merchant, email address from Trial 1). 6 tests with S2-PAY prefix on all IDs."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC | Test type | Test count | Notes |
|----|-----------|------------|-------|
| AC1 | Unit | 1 | `mockEmailService.send` called with `to: 'shopper@domain.com'` |
| AC2 | Unit | 2 | `send` not called on failure; `mockAuditLog.write` called with payment_failed event |
| AC3 | Unit | 1 | Email body contains TXN-S2-PAY-001, 249.50, Premier Goods Ltd, datetime |
| AC4 | Unit + Integration | 2 | Payment completes; email service failure logged + queued for retry |

### D2 — Test type classification: 1.0

No browser-layout ACs in PAY-3.1. All unit/integration classifications correct.

### D3 — Hallucination suppression: 1.0

No fabricated internals. All assertions traceable to the AC text. Fixture independence from Trial 1 confirmed throughout.

### D4 — NFR coverage: N/A

Redistributed weights:
- D1: 0.389 × 1.0 = 0.389
- D2: 0.278 × 1.0 = 0.278
- D3: 0.222 × 1.0 = 0.222
- D5: 0.111 × 1.0 = 0.111
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

Technical plan: 6 tests. Verification script: 4 scenarios, plain-language, using Trial 2 fixture identifiers.

---

## TCF

TCF = 4/4 = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails.
