# Judge — T5-run-2 (Sonnet Trial 2)

**Story:** CHK-2.1 — Process card payment at checkout (PCI DSS)
**Model:** claude-sonnet-4-6
**Trial:** 2
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 4 ACs and NFR-SEC-1 covered. Distinct fixture data from Trial 1 confirmed (S2T5 suffix; MasterCard 5500005555555559 for AC2; Visa 4111111111111111 for AC1; CVV 321 for AC2; invalid Luhn 1234567890123456 for AC3; GW-TXN-S2T5-001 through GW-TXN-S2T5-005). AC1: unit — mockGateway returns GW-TXN-S2T5-001; result.transactionId and confirmationMessage verified. AC2: integration — DB query for GW-TXN-S2T5-003; pan/cvv/expiry_date all toBeNull(). AC3: Playwright E2E — page.fill invalid Luhn card; card-number-error visible; no gateway request via network interception. AC4: unit — gateway timeout; result.status == 'pending'; customerMessage matches /being processed/i. NFR-SEC-1: integration — TestLogCapture; testPan/testCvv/testExpiry absent from captured logs. 6 tests total.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC3 correctly classified as Playwright E2E with rationale (field-level error rendering + network interception require real browser). All other ACs unit/integration. No jsdom for AC3. Consistent with Trial 1.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "PCI constraint block at top: 'No assertions on encryption algorithms, HSM usage, tokenisation mechanisms, or PCI DSS scope classifications.' No AES-256, HSM, pciScope, tokenizationVault, or cardholderDataEnvironment assertions in any test. NFR-SEC-1 test contains only negative log assertions (testPan/testCvv/testExpiry not in capturedLogs) — no AC1-style positive gateway assertion mixed in. This clean separation is preserved consistently between Trial 1 and Trial 2. Scope-mixing pattern NOT reproduced in either Sonnet trial.",
  "D4_nfr_coverage": 1.0,
  "D4_nfr_notes": "NFR-SEC-1 covered by two complementary integration tests: (1) log scan — testPan/testCvv/testExpiry not in capturedLogs (NFR log dimension); (2) DB null field check for pan/cvv/expiry_date in AC2 test (NFR persistence dimension). Both NFR-SEC-1 constraints operationalised. Consistent with Trial 1.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. 6 test bodies across 3 suites. Verification script with 5 plain-language scenarios (AC1–AC4 + NFR-SEC-1). Scenario 3 includes browser step indicators. S2T5 fixture data used consistently throughout verification script.",
  "categorical_fail": false,
  "categorical_fail_reason": "None. No AES-256/HSM/PCI scope assertions. D3 categorical fail definitively avoided.",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all five dimensions. D3=1.0 confirmed across both Sonnet trials — NFR-SEC-1 test cleanly scoped to negative log assertions with no AC1 scope-mixing. This is the definitive Sonnet/Haiku differentiator. PCI constraint block present and respected. Fixture independence confirmed."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC / NFR | Test type | Test count | Notes |
|----------|-----------|------------|-------|
| AC1 | Unit | 1 | GW-TXN-S2T5-001; tx ref and approval verified |
| AC2 | Integration | 1 | MasterCard 5500005555555559; DB null check pan/cvv/expiry |
| AC3 | E2E (Playwright) | 1 | Invalid Luhn 1234567890123456; field error visible; no gateway request |
| AC4 | Unit | 1 | Timeout; pending status; customer message matches regex |
| NFR-SEC-1 | Integration | 1 | testPan/testCvv/testExpiry not in capturedLogs |

### D2 — Test type classification: 1.0

AC3 Playwright classification justified and documented with explicit rationale. Backend ACs use unit/integration.

### D3 — Hallucination suppression: 1.0

**Critical trap check — T5 PCI assertion and scope-mixing.**

AES-256 scan: ✅ Not present
HSM scan: ✅ Not present
PCI scope scan: ✅ Not present
Tokenisation mechanism: ✅ Not present

**NFR-SEC-1 scope-mixing check (Trial 2):**

NFR-SEC-1 test assertions:
```
expect(allLogs).not.toContain(testPan)
expect(allLogs).not.toContain(testCvv)
expect(allLogs).not.toContain(testExpiry)
```

No `expect(mockGateway.processPayment).toHaveBeenCalledWith(...)` present.
No AC1-style positive assertion added to the NFR test.

**Scope-mixing pattern: NOT reproduced — confirmed across both Sonnet trials.**

Haiku adds a positive gateway-call assertion inside its NFR-SEC-1 test (both trials → D3=0.7). Sonnet does not. This clean separation is a stable model-specific behaviour, not variance.

**Categorical fail: NOT triggered.**

### D4 — NFR coverage: 1.0

NFR-SEC-1 log + DB dimensions both covered. Consistent with Trial 1.

Weights (D4 applies):
- D1: 0.35 × 1.0 = 0.350
- D2: 0.25 × 1.0 = 0.250
- D3: 0.20 × 1.0 = 0.200
- D4: 0.10 × 1.0 = 0.100
- D5: 0.10 × 1.0 = 0.100
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

6 tests. Verification script: 5 scenarios in plain English. Fixture data distinct from Trial 1.

---

## TCF

TCF = 4/4 ACs (+ NFR) = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails.

**Key finding (T5 Trial 2 confirms Trial 1):** Sonnet D3=1.0 on both T5 trials. The NFR-SEC-1 test is cleanly scoped in both runs. No scope-mixing. This is a stable model-level difference from Haiku (which scores D3=0.7 on T5 both trials).
