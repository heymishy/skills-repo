# Judge — T5-run-1 (Sonnet Trial 1)

**Story:** CHK-2.1 — Process card payment at checkout (PCI DSS)
**Model:** claude-sonnet-4-6
**Trial:** 1
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 4 ACs and NFR-SEC-1 covered. AC1: unit — mockGateway.processPayment called; result.transactionId == 'GW-TXN-S1T5-001'; result.status == 'approved'; confirmationMessage contains tx ref. AC2: integration — DB query on card_transactions for GW-TXN-S1T5-003; expect(pan).toBeNull(), expect(cvv).toBeNull(), expect(expiry_date).toBeNull(). AC3: Playwright E2E — page.fill invalid Luhn card number; expect card-number-error visible; network request interception asserts no gateway call. AC4: unit — gateway timeout after 10s; result.status == 'pending'; result.customerMessage matches /being processed/i and /email confirmation/i. NFR-SEC-1: integration — TestLogCapture; pass testPan/testCvv/testExpiry to processPayment; assert capturedLogs not containing any of the three values.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "AC3 correctly classified as Playwright E2E with explicit rationale (field-level error rendering + network request interception require real browser). ACs 1, 2, 4 and NFR-SEC-1 correctly classified as unit/integration. No unnecessary E2E tests. No jsdom for AC3.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "PCI constraint section at top of plan explicitly prohibits assertions on: specific encryption algorithms, tokenisation mechanisms, HSM usage, or PCI DSS scope boundaries. No such assertions found anywhere in any test. NFR-SEC-1 test is cleanly scoped to negative log assertions only (capturedLogs not containing testPan/testCvv/testExpiry) — no positive gateway-call assertion added to the NFR test (contrast with Haiku's T5 pattern where AC1 gateway assertion was mixed into NFR test). AC2 and NFR-SEC-1 are separate tests with distinct describe blocks. No AC1 assertion placed inside the NFR-SEC-1 test. D3 = 1.0 (scope-mixing pattern NOT reproduced — key Sonnet/Haiku differentiator).",
  "D4_nfr_coverage": 1.0,
  "D4_nfr_notes": "NFR-SEC-1 covered by two complementary integration tests: (1) log scan via TestLogCapture asserts PAN/CVV/expiry not in logs; (2) DB null field check asserts raw card data not persisted (AC2 test also serves NFR-SEC-1 DB constraint). Both dimensions of NFR-SEC-1 ('not logged to application logs' and 'not persisted to application database') are operationalised.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. Technical test plan with 6 test bodies (2 unit + 3 integration + 1 Playwright E2E). Verification script has 5 plain-language scenarios covering all 4 ACs and NFR-SEC-1. Scenario 3 includes browser step indicators for AC3 Playwright test. All scenarios in plain English.",
  "categorical_fail": false,
  "categorical_fail_reason": "None. No AES-256/HSM/PCI scope assertions. D3 categorical fail definitively avoided.",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all five dimensions. D3 = 1.0 distinguishes Sonnet from Haiku on this case: the NFR-SEC-1 test is cleanly scoped (negative log assertions only), with no scope-mixing of an AC1-style gateway assertion. PCI constraint section at top of plan demonstrates explicit awareness of the hallucination trap. Fixture IDs use S1T5 suffix consistently."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC / NFR | Test type | Test count | Notes |
|----------|-----------|------------|-------|
| AC1 | Unit | 1 | Gateway returns tx ref and approval; confirmationMessage verified |
| AC2 | Integration | 1 | DB null check on PAN, CVV, expiry_date for processed transaction |
| AC3 | E2E (Playwright) | 1 | Invalid Luhn card; field-level error visible; no gateway request |
| AC4 | Unit | 1 | Gateway timeout 10s; pending status; customer message matches regex |
| NFR-SEC-1 | Integration | 1 | Log scan — testPan/testCvv/testExpiry not in capturedLogs |

### D2 — Test type classification: 1.0

AC3 requires field-level error rendering in the browser UI and network request interception — both require a real browser. Playwright correctly selected and justified. All backend ACs use unit/integration with injectable gateway and DB adapter pattern.

### D3 — Hallucination suppression: 1.0

**Critical trap check: D3 categorical fail criteria — AES-256, HSM, or PCI scope assertion.**

Scan of all test assertions:
- No `aesKey`, `AES-256`, `AES256`, `encryptionAlgorithm` ✅
- No `hsmClient`, `hsmVault`, `hardwareSecurityModule` ✅
- No `pciScope`, `cardholderDataEnvironment`, `SAQLevel`, `pciAudit` ✅
- No `tokenizationVault` or tokenisation mechanism assertions ✅

**NFR-SEC-1 scope-mixing check:**
The NFR-SEC-1 test contains ONLY:
```
expect(capturedLogs).not.toContain(testPan)
expect(capturedLogs).not.toContain(testCvv)
expect(capturedLogs).not.toContain(testExpiry)
```
No `expect(mockGateway.processPayment).toHaveBeenCalledWith(...)` in the NFR test.
No AC1-style positive assertion mixed in.

**This is the key Sonnet/Haiku differentiator on T5:** Haiku consistently adds a positive gateway-call assertion (`expect(mockGateway.processPayment).toHaveBeenCalledWith(...)`) inside the NFR test, earning D3=0.7 in both trials. Sonnet keeps the NFR test cleanly scoped to negative constraints only — D3=1.0.

**Categorical fail: NOT triggered.**

### D4 — NFR coverage: 1.0

NFR-SEC-1: "PAN, CVV, and expiry_date must not be logged to application logs or persisted to the application database."

- Log dimension: TestLogCapture integration test — passes raw card values in, checks they are absent from captured logs ✅
- DB dimension: AC2 integration test queries DB and asserts all three fields are null ✅

Both dimensions of NFR-SEC-1 operationalised.

Weights (D4 applies):
- D1: 0.35 × 1.0 = 0.350
- D2: 0.25 × 1.0 = 0.250
- D3: 0.20 × 1.0 = 0.200
- D4: 0.10 × 1.0 = 0.100
- D5: 0.10 × 1.0 = 0.100
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

Technical plan: 6 test bodies across 3 suites. Verification script: 5 numbered scenarios covering all ACs + NFR-SEC-1. Plain-language throughout. Scenario 3 uses browser step indicators for Playwright steps.

---

## TCF

TCF = 4/4 ACs (+ NFR) = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails.

**Key finding:** Sonnet scores D3=1.0 on T5 (vs. Haiku D3=0.7 both trials). The NFR-SEC-1 scope-mixing pattern that Haiku exhibits consistently is absent in Sonnet's output. Sonnet correctly separates the NFR test (negative log assertions) from the AC1 test (gateway call assertion).
