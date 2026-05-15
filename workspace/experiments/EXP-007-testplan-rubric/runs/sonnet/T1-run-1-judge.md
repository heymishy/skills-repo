# Judge — T1-run-1 (Sonnet Trial 1)

**Story:** PAY-3.1 — Send payment confirmation email after successful transaction
**Model:** claude-sonnet-4-6
**Trial:** 1
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 4 ACs covered with runnable test bodies. AC1: email sent to registered address (unit test — mockEmailService.send called with correct 'to'). AC2: no email on failure (unit — send not called) + failure logged (unit — auditLog.record called with payment_failed). AC3: email body contains all 4 required fields — tx ref, amount, merchant, datetime (unit — capturedEmails[0].body assertions). AC4: payment completes despite email failure (unit — result.transactionStatus === 'completed') + failure logged with tx ref (unit — auditLog.record called with email_delivery_failed) + email queued for retry (integration — retryQueue.list() shows 1 item). 7 tests total.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "No browser-layout-dependent ACs in this story. All ACs correctly classified as unit (6 tests) or integration (1 test). No E2E tests added unnecessarily.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in observable AC outcomes. No fabricated internals — no assertion on SMTP protocol, email provider, retry count, encryption, or queue implementation. AC4 retry test checks the observable output (item in queue matches tx ref and email) not the retry mechanism.",
  "D4_nfr_coverage": "N/A",
  "D4_nfr_notes": "No NFRs in this story. D4 weight redistributed proportionally to D1, D2, D3, D5.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. Technical test plan with 7 test bodies. Verification script has 4 plain-language scenarios covering all 4 ACs. Scenario 4 (AC4) includes developer instructions for simulating email service outage and verifying queue and retry behaviour. No technical assertion code in verification script.",
  "categorical_fail": false,
  "categorical_fail_reason": "None",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all applicable dimensions. All 4 ACs have runnable test bodies. Verification script is plain-language and complete. No hallucination concerns. 7 tests with distinct fixture IDs (TXN-001-SONNET through TXN-007-SONNET)."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC | Test type | Test count | Notes |
|----|-----------|------------|-------|
| AC1 | Unit | 1 | `mockEmailService.send` called once with `to: 'customer@example.com'` |
| AC2 | Unit | 2 | `send` not called on failure; `auditLog.record` called with `event: 'payment_failed'` |
| AC3 | Unit | 1 | `capturedEmails[0].body` asserted to contain tx ref, amount, merchant, datetime |
| AC4 | Unit + Integration | 3 | Payment completes; failure logged with tx ref; email queued in retry queue |

### D2 — Test type classification: 1.0

No browser-layout-dependent ACs. Email test infrastructure correctly uses injectable adapter (mock). The integration test for AC4 uses `InMemoryEmailRetryQueue` — appropriate level for queue state assertion.

### D3 — Hallucination suppression: 1.0

No assertion on:
- SMTP connection protocol
- Email provider internals
- Specific retry count/interval
- Encryption or security mechanism

All 7 test assertions trace directly to language in one of the 4 ACs.

### D4 — NFR coverage: N/A

No NFRs defined in PAY-3.1.

Redistributed weights:
- D1: 0.389 × 1.0 = 0.389
- D2: 0.278 × 1.0 = 0.278
- D3: 0.222 × 1.0 = 0.222
- D5: 0.111 × 1.0 = 0.111
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

Technical plan: 7 test bodies across 2 suites.
Verification script: 4 numbered scenarios. All scenarios use plain English. Scenario 4 includes developer co-ordination steps for outage simulation — appropriate for a manual-assisted AC.

---

## TCF

TCF = 4/4 = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails.
