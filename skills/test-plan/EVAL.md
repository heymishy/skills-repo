# EVAL.md — /test-plan skill evaluation specification

**Skill:** `/test-plan`
**SKILL.md path:** `.github/skills/test-plan/SKILL.md`
**Corpus path:** `.github/skills/test-plan/corpus/`
**Last calibrated:** 2026-05-15
**Calibration model:** claude-sonnet-4-6

---

## Purpose

This file defines the evaluation specification for the `/test-plan` skill, scoped to **Test Coverage Fidelity (TCF)** — whether the model correctly covers every AC with at least one runnable, correctly-classified test or manual scenario, avoids hallucinating tests that are not grounded in any AC, and produces both required outputs (technical test plan + AC verification script).

It is consumed by:

1. **Layer 1 — Operator runbook** (`.github/skills/model-sweep/SKILL.md`): the judge prompt is used manually after saving model outputs
2. **Layer 2 — Programmatic script** (`scripts/run-model-sweep.js`): the judge prompt and dimension weights are consumed directly to produce per-cell structured scores

The five dimensions are derived from the `/test-plan` SKILL.md — specifically: the AC coverage requirement (Step 4), the two-output structure (technical plan + verification script), the test type classification rules (Step 3a browser-layout detection), the NFR test data section, and the TDD discipline requirement. Do not add dimensions not grounded in the SKILL.md.

**Experiment context:** This EVAL.md was written for EXP-007-testplan-rubric. The primary question is whether Haiku can replace Sonnet at the /test-plan stage while achieving TCF = 1.00 with zero categorical fails. A missed AC produces no test for a user-visible outcome — the coding agent proceeds without a failing test for that outcome, which is a TDD discipline failure and a DoR hard-block (H2 requires tests exist before sign-off). A browser-layout AC misclassified as a unit test produces a test that passes in CI but does not verify the actual rendered behaviour, giving false confidence and potentially blocking a B2 DoR violation from being caught.

---

## Primary metric: Test Coverage Fidelity (TCF)

$$TCF = \frac{\text{ACs with at least one correctly classified test or manual scenario}}{\text{total ACs in the story}}$$

**TCF threshold for routing approval:** 1.00 across all evaluated cases, zero categorical fails. A model that omits any AC — no test and no manual scenario — is disqualified from production /test-plan use regardless of its weighted score on other dimensions.

**TCF threshold for conditional approval:** If TCF ≥ 0.90 with zero categorical fails on the most critical dimensions (D1, D2), a model may be approved with a SKILL.md annotation noting the specific omission pattern.

---

## Grading dimensions

### D1 — AC coverage completeness
**Weight:** 0.35
**What it measures:** Does every AC in the story have at least one test entry in the technical test plan, or at least one manual scenario in the verification script? An AC that appears in the coverage table marked "covered" but has no test body in the plan is scored 0.5 — the model acknowledged it but did not write the test. An AC with no coverage table entry at all is scored 0.0.

| Score | Meaning |
|-------|---------|
| 1.0 | Every AC has at least one runnable test in the technical plan, or a manual scenario in the verification script with a clear rationale for why automated testing is not appropriate |
| 0.7 | One AC covered only in the verification script without an automated test, but no rationale given for why automation is not appropriate — model defaulted to manual without surfacing the gap |
| 0.5 | One AC listed in the coverage table but no test body written — acknowledged but not implemented |
| 0.0 | Any AC absent from both the technical test plan and the verification script |

**Categorical fail:** D1 = 0.0 on any case → `compliant = false`. An omitted AC means the coding agent will implement that AC with no failing test to drive the implementation — TDD iron law violation.

**Corpus anchors:**
- T1 → 1.0: All four ACs have test entries; test bodies are written (not just listed); verification script has all four scenarios
- T1 → 0.5: AC3 listed in coverage table as "covered" but no `describe` block or test assertion present in the plan body
- T1 → 0.0: AC4 (email service unavailable) absent from test plan entirely — model treated it as out-of-scope
- T4 → 1.0: AC1 and AC3 have unit/integration tests; AC2 has a manual scenario in the verification script noting external system dependency; all three ACs accounted for
- T4 → 0.5: AC2 has a verification script scenario but it is written at the same level as the unit tests ("assert the fraud system received the event") without acknowledging that this is a manual step requiring an E2E environment

---

### D2 — Test type classification
**Weight:** 0.25
**What it measures:** Are tests assigned to the correct test type (unit, integration, E2E/browser)? The SKILL.md Step 3a defines browser-layout-dependent ACs — drag-drop, CSS-position, `getBoundingClientRect`, visual rendering — and requires E2E tests for these. A DOM simulation environment (jsdom, happy-dom) does not compute CSS layout and must not be used for browser-layout-dependent ACs.

| Score | Meaning |
|-------|---------|
| 1.0 | All ACs classified at the correct test type; browser-layout-dependent ACs explicitly flagged and written as E2E tests (or manual with E2E tooling gap noted); no DOM simulation test written for a layout-dependent AC |
| 0.7 | One AC classified at the wrong level (e.g. an integration test written at unit level) but not a browser-layout violation; no categorical issue |
| 0.4 | One browser-layout-dependent AC uses a DOM simulation approach but includes a comment acknowledging the limitation — model shows awareness but does not act on it |
| 0.0 | Any browser-layout-dependent AC written as a unit or integration test using jsdom, `fireEvent`, `simulate`, or `trigger` with no acknowledgement that CSS layout is not computed |

**Categorical fail:** D2 = 0.0 on T3 → `compliant = false`. A unit test for a drag-drop or CSS-position AC will pass in CI without verifying the actual rendered behaviour. The coding agent will implement based on a test that cannot catch the class of bug the AC is guarding against.

**Corpus anchors:**
- T3 → 1.0: AC1 and AC3 written as E2E test descriptions (`test.describe('drag-drop reorder')` with Playwright or equivalent); a note states "jsdom cannot resolve CSS layout — E2E framework required"; AC2 written as an integration test (persistence check, no layout dependency)
- T3 → 0.4: AC1 uses `fireEvent.dragStart` and `fireEvent.drop` with a comment "// Note: this may not reflect actual rendered position"; model shows awareness but still writes the jsdom test
- T3 → 0.0: AC1 and AC3 written as `fireEvent.drag(card, { target: secondCard })` style unit tests with no browser-layout acknowledgement — categorical fail
- T1 → 1.0: All four ACs correctly classified as unit/integration (no layout dependency present); no E2E tests added unnecessarily

---

### D3 — Hallucination suppression
**Weight:** 0.20
**What it measures:** Does the model avoid generating test assertions that are not grounded in any AC or NFR in the story? This dimension penalises two patterns: (1) fabricated implementation assertions (e.g. asserting a specific encryption algorithm not stated in any AC) and (2) fabricated external system assertions (e.g. asserting the internal state of an external service that is not testable from the application layer). Both patterns produce tests that assert things the coding agent was never told to implement, potentially driving incorrect implementation or creating a false sense of compliance coverage.

| Score | Meaning |
|-------|---------|
| 1.0 | Every test assertion maps to an observable outcome stated in an AC or NFR; no test asserts implementation details, external system internals, or compliance properties not stated in the story |
| 0.7 | One test asserts an implementation detail (e.g. a specific retry count) that is inferable from an AC but not stated explicitly — marginal overreach rather than fabrication |
| 0.4 | One test asserts a compliance property (e.g. `expect(log.contains('PAN')).toBe(false)`) that is implied by the PCI NFR but not stated as an observable AC outcome — model is adding implied checks |
| 0.0 | Any test asserts behaviour not grounded in any AC or NFR, at a level that would require specific implementation decisions not made by the story (e.g. specific algorithm, specific field name in external system, specific internal library call) |

**Categorical fail on T5:** D3 = 0.0 on T5 (PCI story) → `compliant = false` when a test asserts a specific cryptographic algorithm (`AES-256`, `RSA-2048`, etc.), a specific HSM usage, or a specific internal compliance check not stated in any AC. This is the most dangerous hallucination pattern — it implies compliance coverage that may not exist or may be wrong.

**Corpus anchors:**
- T5 → 1.0: AC2 tested as "database query for card fields returns no results after payment" — testing the observable AC outcome (no stored card data), not the mechanism; no encryption algorithm asserted
- T5 → 0.4: test includes `expect(paymentService.encrypt.algorithm).toBe('AES-256')` — implied by PCI but not in any AC; overreach but not a fabrication of non-existent behaviour
- T5 → 0.0: test includes `expect(hsmClient.tokenize).toHaveBeenCalled()` — asserts a specific internal implementation (HSM tokenisation) not stated in any AC; the coding agent was never told to use an HSM
- T4 → 1.0: AC2 routed to manual verification only; no test asserts `fraudSystem.lastReceivedEvent.transactionId === expectedId`
- T4 → 0.0: test asserts `fraudDetectionClient.receivedMessages[0].amount === 100` — fabricates access to external system state not testable from app layer

---

### D4 — NFR test coverage
**Weight:** 0.10
**What it measures:** Are NFRs in the story's Non-Functional Requirements section represented in the test plan? An NFR is not an AC — it does not have Given/When/Then structure — but it specifies observable properties (performance, load, security) that should have corresponding test coverage. A model that covers all ACs but ignores explicit NFRs produces a test plan with a coverage gap that the coding agent will not notice.

| Score | Meaning |
|-------|---------|
| 1.0 | Every NFR in the story has at least one corresponding test, load test description, or manual scenario with the NFR explicitly cited; performance NFRs include a threshold value matching the story |
| 0.7 | NFR test present but threshold value not cited (e.g. "performance test for session timeout" without the "200ms p99 @ 100 concurrent" constraint) — test exists but is not calibrated |
| 0.4 | NFR mentioned in the test plan's coverage table but no test body written — acknowledged but not implemented |
| 0.0 | NFR section in the story present but no test entry of any kind for any NFR in the test plan |

**Note:** D4 is scored N/A for cases with no NFRs (T1, T3, T4). On those cases, the D4 weight (0.10) is redistributed proportionally to D1, D2, and D3.

**Corpus anchors:**
- T2 → 1.0: load test description names the scenario ("100 concurrent users, session expiry check under 200ms p99"), names a test tool (k6, artillery, JMeter, or equivalent), and either provides a runnable script stub or a step-by-step manual procedure
- T2 → 0.7: performance test present but threshold is "fast enough" rather than citing "200ms (p99)"
- T2 → 0.4: test plan includes "Performance: verify session timeout is efficient" in the coverage table with no test body
- T2 → 0.0: test plan covers all 3 ACs fully but the NFR section is absent or states "out of scope"

---

### D5 — Dual output completeness
**Weight:** 0.10
**What it measures:** Does the model produce both required outputs — (1) a technical test plan and (2) an AC verification script? The SKILL.md mandates both for every story. The verification script is the human-readable counterpart: it describes what to check in plain language for BA/QA pre-code sign-off and post-merge smoke testing. A model that produces only the technical plan leaves the verification script absent, which means the DoD smoke test step has no script to follow.

| Score | Meaning |
|-------|---------|
| 1.0 | Both outputs present; verification script covers every AC with a scenario written in plain language for a non-engineer reader; technical plan specifies test bodies |
| 0.7 | Both outputs nominally present; verification script present but one or more ACs have scenarios that are technical rather than plain-language (copy-paste of test assertion code rather than a human-readable description) |
| 0.4 | Technical plan present; verification script present but covers fewer than half the ACs — model produced a partial script |
| 0.0 | Verification script absent; or output is a single document that mixes technical test bodies and verification scenarios without separating the two audiences |

**Corpus anchors:**
- Any case → 1.0: output contains a clearly separated "AC Verification Script" section with numbered scenarios in plain language ("1. Navigate to checkout, enter card details, submit. Verify a transaction reference appears on the confirmation screen.")
- Any case → 0.7: verification script present but scenarios read as "expect(confirmationPage.transactionRef).toBeTruthy()" — technical assertion, not human-readable
- Any case → 0.0: no verification script section; or model says "the technical test plan above serves as the verification script"

---

## Pass threshold

**Weighted score threshold:** ≥ 0.80

The weighted score for each case is:

$$\text{weighted score} = (D1 \times 0.35) + (D2 \times 0.25) + (D3 \times 0.20) + (D4 \times 0.10) + (D5 \times 0.10)$$

For cases where D4 is N/A, redistribute D4 weight proportionally:
- D1: 0.35 + (0.10 × 0.35/0.90) ≈ 0.389
- D2: 0.25 + (0.10 × 0.25/0.90) ≈ 0.278
- D3: 0.20 + (0.10 × 0.20/0.90) ≈ 0.222
- D5: 0.10 + (0.10 × 0.10/0.90) ≈ 0.111

**TCF threshold:** 1.00 — no AC may be omitted.

**Categorical fail rules:**
- D1 = 0.0 on any case → `compliant = false` regardless of weighted score
- D2 = 0.0 on T3 → `compliant = false` regardless of weighted score
- D3 = 0.0 on T5 (PCI hallucination) → `compliant = false` regardless of weighted score

A model passes EXP-007 if: TCF = 1.00 AND `compliant = true` across both trials for all five cases.

---

## Judge prompt

Use the following prompt to evaluate each model output. Replace `[CORPUS CASE]` and `[MODEL OUTPUT]` with the actual content.

---

```
You are evaluating a /test-plan skill output against the EXP-007-testplan-rubric EVAL.md specification.

CASE CONTEXT (expected output characteristics / scoring note from corpus case):
{CASE_CONTEXT}

MODEL OUTPUT:
{OUTPUT}

Score the output on each of the following dimensions. Return a JSON object with this structure:

{
  "D1_ac_coverage": <0.0 | 0.5 | 0.7 | 1.0>,
  "D1_ac_coverage_notes": "<which ACs were covered and which were missing or incomplete>",
  "D2_test_type_classification": <0.0 | 0.4 | 0.7 | 1.0>,
  "D2_classification_notes": "<how browser-layout ACs were handled; any misclassifications>",
  "D3_hallucination_suppression": <0.0 | 0.4 | 0.7 | 1.0>,
  "D3_hallucination_notes": "<any fabricated assertions; what was asserted and what AC (if any) it maps to>",
  "D4_nfr_coverage": <0.0 | 0.4 | 0.7 | 1.0 | "N/A">,
  "D4_nfr_notes": "<how NFRs were handled; threshold citation accuracy>",
  "D5_dual_output": <0.0 | 0.4 | 0.7 | 1.0>,
  "D5_dual_output_notes": "<whether verification script is present, complete, and human-readable>",
  "categorical_fail": <true | false>,
  "categorical_fail_reason": "<which categorical fail condition was triggered, if any>",
  "compliant": <true | false>,
  "weighted_score": <0.00–1.00>,
  "routing_recommendation": "<APPROVE | CONDITIONAL | DISQUALIFY>",
  "routing_notes": "<key observations that would affect the routing decision>"
}

Apply these categorical fail rules strictly:
- D1 = 0.0 on any case → categorical_fail = true
- D2 = 0.0 on T3 (drag-drop case) → categorical_fail = true
- D3 = 0.0 on T5 (PCI case) → categorical_fail = true

Do not give partial credit for a categorical fail dimension. Score it 0.0 if the condition is met.
```

---

## Known calibration notes

**D3 boundary — implied vs fabricated:** A test that checks `database.cardNumbers.count() === 0` after a payment (T5 AC2) is grounded in the AC ("no raw card data stored in the application database"). This is NOT a hallucination — it tests the observable AC outcome. A test that checks `encryptionService.algorithm === 'AES-256'` is NOT grounded in any AC — it asserts a specific implementation mechanism not stated in the story. The boundary is: does the assertion verify an observable outcome stated in the story, or does it verify an implementation detail the model inferred or invented?

**D2 boundary — integration vs unit for persistence:** AC2 in T3 ("Given the user reorders the backlog, When the page is refreshed, Then the new order is preserved") is a persistence check. This can be written as an integration test hitting the API or database — not E2E. A unit test mocking the persistence layer is also acceptable. This is NOT a browser-layout-dependent AC.

**D1 boundary — manual scenario acceptability:** An AC that asserts external system state (T4 AC2) can legitimately be covered only in the verification script as a manual step — but the manual scenario must acknowledge the external system dependency explicitly. "Verify the fraud detection system shows the event in its event log" is acceptable. "Assert `fraudSystem.eventLog[0].transactionId === expected`" is not a manual scenario — it is a fabricated test assertion written in test-code style.
