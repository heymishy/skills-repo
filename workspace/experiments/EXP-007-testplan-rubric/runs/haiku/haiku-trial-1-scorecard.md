# EXP-007 Haiku Trial 1 Scorecard

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric
**Trial:** 1

---

## Score Summary

| Case | Story | D1 | D2 | D3 | D4 | D5 | Weighted | TCF | Compliant | Routing |
|------|-------|----|----|----|----|-----|---------|-----|-----------|---------|
| T1 | PAY-3.1 Payment confirmation email | 1.0 | 1.0 | 1.0 | N/A | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |
| T2 | SEC-1.2 Session timeout + NFR | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |
| T3 | BL-2.4 Backlog drag-and-drop | 1.0 | 1.0 | 1.0 | N/A | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |
| T4 | FRAUD-1.1 Fraud detection event | 1.0 | 1.0 | 1.0 | N/A | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |
| T5 | CHK-2.1 Card payment (PCI) | 1.0 | 1.0 | 0.7 | 1.0 | 1.0 | **0.94** | 1.00 | ✅ | APPROVE |

**Trial 1 summary:**
- Min score: 0.94 (T5)
- Max score: 1.00 (T1, T2, T3, T4)
- Mean score: 0.99
- TCF: 1.00 across all cases
- Categorical fails: 0
- Cases compliant: 5/5

---

## Dimension Analysis

### D1 — AC Coverage (weight 0.35)
**5/5 cases score 1.0.** All ACs covered with runnable test bodies in every case. AC2 in T4 correctly routed to verification script with explicit rationale (external system not testable from app layer). No AC omitted from either output.

### D2 — Test Type Classification (weight 0.25)
**5/5 cases score 1.0.** Notable:
- **T3:** AC1 and AC3 correctly classified as Playwright E2E with explicit explanation that jsdom cannot compute CSS layout. `fireEvent.dragStart` mentioned only in a note explaining why it is rejected — NOT used as a test assertion. No D2 categorical fail.
- **T4:** AC2 correctly classified as manual E2E (external system boundary respected).

### D3 — Hallucination Suppression (weight 0.20)
**4/5 cases score 1.0. T5 scores 0.7.**
- T1–T4: All assertions grounded in observable AC/NFR outcomes. No fabricated internals.
- **T4 (critical):** No `fraudDetectionClient` or external system state assertions. AC2 correctly refused at the application layer.
- **T5 (marginal overreach):** NFR-SEC-1 test correctly avoids AES-256/HSM/PCI scope assertions, but adds `expect(mockGateway.processPayment).toHaveBeenCalledWith(...)` in the NFR test — an AC1 assertion (gateway was called) placed in a test whose purpose is to verify negative constraints (card data not leaked). Grounded in AC1 architecture, but not the stated observable outcome of NFR-SEC-1. D3 = 0.7. Not a categorical fail.

### D4 — NFR Coverage (weight 0.10)
**T2 scores 1.0 (only case with NFRs). T5 scores 1.0 for NFR-SEC-1.**
- **T2:** k6 script with explicit `thresholds: { 'http_req_duration': ['p(99)<200'] }`, `maxSessions: 10000`, and pre-test setup seeding 10,000 sessions. All three specific values from the NFR (200ms, p99, 10,000 sessions) operationalised in script configuration.
- T1, T3, T4: N/A.

### D5 — Dual Output (weight 0.10)
**5/5 cases score 1.0.** All cases produce both a technical test plan and a plain-language verification script. Verification scripts use plain English throughout. T3 uses 🔴 browser markers for E2E steps. T4 includes a ⚠️ E2E environment annotation for AC2.

---

## Critical Trap Assessments

| Trap | Expectation | Result | Notes |
|------|-------------|--------|-------|
| T3 — jsdom/fireEvent for drag-drop | Must NOT use jsdom for AC1/AC3 | ✅ PASS | Playwright used. fireEvent mentioned only in explanatory rejection note. |
| T3 — uncaveated dragStart assertion | Any uncaveated dragStart = categorical fail | ✅ PASS | No dragStart test assertion anywhere. |
| T4 — fraudDetectionClient assertion | Any external system internal = categorical fail | ✅ PASS | No external system assertions. AC2 refused at app layer. |
| T5 — AES-256/HSM/PCI scope assertion | Any encryption/compliance internal = categorical fail | ✅ PASS | No crypto/HSM/PCI scope assertions. |
| T2 — threshold-calibrated performance test | Must cite 200ms, p99, 10k sessions specifically | ✅ PASS | All three specifics in k6 script. |

---

## Trial 1 Verdict

**PASS.** TCF = 1.00. Compliant = true across all five cases. No categorical fails.

Minimum weighted score: 0.94 (T5). All cases above 0.80 threshold.

The only finding is a systematic D3 = 0.7 on T5: the NFR-SEC-1 test scope-mixes an AC1 assertion (gateway receives card data) with the NFR's negative constraints (card data not logged/persisted). This is a marginal overreach, not a hallucination.

---

## Judge files referenced

- [T1-run-1-judge.md](T1-run-1-judge.md)
- [T2-run-1-judge.md](T2-run-1-judge.md)
- [T3-run-1-judge.md](T3-run-1-judge.md)
- [T4-run-1-judge.md](T4-run-1-judge.md)
- [T5-run-1-judge.md](T5-run-1-judge.md)
