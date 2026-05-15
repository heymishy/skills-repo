# EXP-007 Haiku Trial 2 Scorecard

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric
**Trial:** 2

---

## Score Summary

| Case | Story | D1 | D2 | D3 | D4 | D5 | Weighted | TCF | Compliant | Routing |
|------|-------|----|----|----|----|-----|---------|-----|-----------|---------|
| T1 | PAY-3.1 Payment confirmation email | 1.0 | 1.0 | 1.0 | N/A | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |
| T2 | SEC-1.2 Session timeout + NFR | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |
| T3 | BL-2.4 Backlog drag-and-drop | 1.0 | 1.0 | 1.0 | N/A | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |
| T4 | FRAUD-1.1 Fraud detection event | 1.0 | 1.0 | 1.0 | N/A | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |
| T5 | CHK-2.1 Card payment (PCI) | 1.0 | 1.0 | 0.7 | 1.0 | 1.0 | **0.94** | 1.00 | ✅ | APPROVE |

**Trial 2 summary:**
- Min score: 0.94 (T5)
- Max score: 1.00 (T1, T2, T3, T4)
- Mean score: 0.99
- TCF: 1.00 across all cases
- Categorical fails: 0
- Cases compliant: 5/5

---

## Dimension Analysis

### D1 — AC Coverage (weight 0.35)
**5/5 cases score 1.0.** All ACs covered with runnable test bodies. Distinct fixture data from Trial 1 confirms genuine independent runs (e.g. T1 uses `TXN-TEST-003` / `199.99` vs Trial 1's `ABC123` / `99.99`; T2 uses `sess-inactive-001` / `token-inactive-001` vs Trial 1's distinct values).

### D2 — Test Type Classification (weight 0.25)
**5/5 cases score 1.0.**
- **T3:** AC1 and AC3 correctly classified as Playwright E2E. Explicit rationale: "AC1 requires verifying the dragged card 'appears immediately above the target card in the displayed backlog order'... Both depend on CSS layout computation, which jsdom does not support." `fireEvent.dragStart()` mentioned only in a rationale note rejecting it. No uncaveated dragStart assertion.

### D3 — Hallucination Suppression (weight 0.20)
**4/5 cases score 1.0. T5 scores 0.7.**
- **T4:** No `fraudDetectionClient` or external system assertions. AC2 correctly routed to manual verification.
- **T5:** Same marginal overreach as Trial 1 — gateway-receives assertion in NFR-SEC-1 test. This confirms the pattern is systematic, not noise. No AES-256/HSM/PCI scope categorical fail.

The consistency of the T5 D3=0.7 pattern across both trials makes it a **confirmed systematic tendency** rather than a one-off. Haiku consistently adds the positive gateway-assertion to the NFR negative-constraint test. This should be addressed in prompt guidance for the test-plan skill.

### D4 — NFR Coverage (weight 0.10)
**T2 scores 1.0. T5 scores 1.0 for NFR-SEC-1.**
- **T2:** k6 script with explicit `'http_req_duration': ['p(99)<200']`, trigger body `maxSessions: 10000`, pre-test setup "Seed 10,000 session records", test duration 30s. All three required specifics operationalised. Consistent with Trial 1.

### D5 — Dual Output (weight 0.10)
**5/5 cases score 1.0.** All cases produce both outputs. Verification scripts are plain-language.

---

## Critical Trap Assessments

| Trap | Expectation | Result | Notes |
|------|-------------|--------|-------|
| T3 — jsdom/fireEvent for drag-drop | Must NOT use jsdom for AC1/AC3 | ✅ PASS | Playwright used. fireEvent only in explanatory rejection note. |
| T3 — uncaveated dragStart assertion | Any uncaveated dragStart = categorical fail | ✅ PASS | No dragStart test assertion anywhere. |
| T4 — fraudDetectionClient assertion | Any external system internal = categorical fail | ✅ PASS | No external system assertions. |
| T5 — AES-256/HSM/PCI scope assertion | Any encryption/compliance internal = categorical fail | ✅ PASS | No crypto/HSM/PCI scope assertions. |
| T2 — threshold-calibrated performance test | Must cite 200ms, p99, 10k sessions specifically | ✅ PASS | All three specifics in k6 script. Consistent with Trial 1. |

---

## Cross-Trial Consistency Check

| Case | Trial 1 Score | Trial 2 Score | Δ | Consistency |
|------|-------------|-------------|---|-------------|
| T1 | 1.00 | 1.00 | 0.00 | ✅ Identical |
| T2 | 1.00 | 1.00 | 0.00 | ✅ Identical |
| T3 | 1.00 | 1.00 | 0.00 | ✅ Identical |
| T4 | 1.00 | 1.00 | 0.00 | ✅ Identical |
| T5 | 0.94 | 0.94 | 0.00 | ✅ Identical (same D3 pattern) |

**Trial stability: excellent.** Zero score variance across both trials. The T5 D3=0.7 finding is reproducible.

---

## Trial 2 Verdict

**PASS.** TCF = 1.00. Compliant = true across all five cases. No categorical fails.

Minimum weighted score: 0.94 (T5). All cases above 0.80 threshold.

---

## Judge files referenced

- [T1-run-2-judge.md](T1-run-2-judge.md)
- [T2-run-2-judge.md](T2-run-2-judge.md)
- [T3-run-2-judge.md](T3-run-2-judge.md)
- [T4-run-2-judge.md](T4-run-2-judge.md)
- [T5-run-2-judge.md](T5-run-2-judge.md)
