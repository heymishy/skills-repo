# EXP-007 Sonnet Trial 2 Scorecard

**Model:** claude-sonnet-4-6
**Judge:** claude-sonnet-4-6 (self-eval, calibration model)
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
| T5 | CHK-2.1 Card payment (PCI) | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |

**Trial 2 summary:**
- Min score: 1.00
- Max score: 1.00
- Mean score: 1.00
- TCF: 1.00 across all cases
- Categorical fails: 0
- Cases compliant: 5/5

---

## Dimension Analysis

### D1 — AC Coverage (weight 0.35)
**5/5 cases score 1.0.** All ACs covered with runnable test bodies. Fixture independence from Trial 1 confirmed across all cases:
- T1: TXN-S2-PAY-001, shopper@domain.com, Premier Goods Ltd, £249.50 (vs Trial 1's TXN-001-SONNET, customer@example.com)
- T2: s2t2 prefix, sess-idle-s2t2-001, token-s2t2-001, user-s2t2-003 through -006 (vs s1t2)
- T3: s2t3 prefix, Story P/Q/R/S/T naming (vs Trial 1's Story A/B/C/D/E)
- T4: S2T4 prefix, TXN-FRAUD-S2T4-001 (vs S1T4)
- T5: S2T5 suffix, MasterCard 5500005555555559, CVV 321, GW-TXN-S2T5-001 (vs S1T5)

### D2 — Test Type Classification (weight 0.25)
**5/5 cases score 1.0.**
- **T3:** Stronger classification language than Trial 1 — "AC1 and AC3 MUST use Playwright E2E tests — NOT jsdom or fireEvent simulation." `page.dragAndDrop()` used exclusively. No D2 categorical fail.
- **T4:** AC2 manual classification consistent with Trial 1.
- **T5:** AC3 Playwright E2E consistent with Trial 1.

### D3 — Hallucination Suppression (weight 0.20)
**5/5 cases score 1.0.** Zero deductions.
- **T4:** Gap table consistently names `fraudDetectionSystem.getLatestEvent()` as a fabricated interface. No external system assertions.
- **T5:** NFR-SEC-1 test clean in Trial 2 (identical to Trial 1). Negative log assertions only — no AC1 scope-mixing. Scope-mixing pattern NOT reproduced across either trial.
- **T4 Trial 2 addition:** Exponential backoff retry assertion (1s/2s/4s delays) grounded in "retry with exponential backoff" from AC3 text — not a hallucination.

### D4 — NFR Coverage (weight 0.10)
**T2 scores 1.0. T5 scores 1.0. T1, T3, T4: N/A.**
- **T2:** k6 script: `'http_req_duration': ['p(99)<200']`, `sessionCount: 10000`, 30s duration. All three NFR-PERF-1 specifics operationalised. Consistent with Trial 1.
- **T5:** NFR-SEC-1 log scan + DB null-field check. Both dimensions covered. Consistent with Trial 1.

### D5 — Dual Output (weight 0.10)
**5/5 cases score 1.0.** All cases produce both outputs. Verification scripts use Trial 2 fixture data, confirming independence from Trial 1 scripts.

---

## Critical Trap Assessments

| Trap | Expectation | Result | Notes |
|------|-------------|--------|-------|
| T3 — jsdom/fireEvent for drag-drop | Must NOT use jsdom for AC1/AC3 | ✅ PASS | Playwright used. MUST NOT language explicit — stronger than Trial 1. |
| T3 — uncaveated dragStart assertion | Any uncaveated dragStart = categorical fail | ✅ PASS | No dragStart assertion. Mentioned only in explanatory rejection. |
| T4 — fraudDetectionClient assertion | Any external system internal = categorical fail | ✅ PASS | No external system assertions. Pattern explicitly named and avoided. |
| T5 — AES-256/HSM/PCI scope assertion | Any encryption/compliance internal = categorical fail | ✅ PASS | No crypto/HSM/PCI scope assertions. |
| T5 — NFR scope-mixing (AC1 in NFR test) | Extra gateway-call assertion in NFR test | ✅ PASS | NFR test clean. No scope-mixing confirmed in Trial 2 as well. |
| T2 — threshold-calibrated performance test | Must cite 200ms, p99, 10k sessions | ✅ PASS | All three specifics. Consistent with Trial 1. |

---

## Cross-Trial Consistency Check

| Case | Trial 1 Score | Trial 2 Score | Δ | Consistency |
|------|-------------|-------------|---|-------------|
| T1 | 1.00 | 1.00 | 0.00 | ✅ Identical |
| T2 | 1.00 | 1.00 | 0.00 | ✅ Identical |
| T3 | 1.00 | 1.00 | 0.00 | ✅ Identical |
| T4 | 1.00 | 1.00 | 0.00 | ✅ Identical |
| T5 | 1.00 | 1.00 | 0.00 | ✅ Identical |

**Trial stability: excellent.** Zero score variance across both trials. All five cases score 1.00 in both trials. No regression or degradation between runs.

---

## Trial 2 Verdict

**PASS.** TCF = 1.00. Compliant = true across all five cases. No categorical fails.

All five cases score 1.00 weighted. Perfect result against EVAL.md rubric in both trials. Zero score variance between Trial 1 and Trial 2 — Sonnet is stable on all cases including the PCI-scoped T5 hallucination trap.

---

## Judge files referenced

- [T1-run-2-judge.md](T1-run-2-judge.md)
- [T2-run-2-judge.md](T2-run-2-judge.md)
- [T3-run-2-judge.md](T3-run-2-judge.md)
- [T4-run-2-judge.md](T4-run-2-judge.md)
- [T5-run-2-judge.md](T5-run-2-judge.md)
