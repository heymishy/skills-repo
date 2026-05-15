# EXP-007 Sonnet Trial 1 Scorecard

**Model:** claude-sonnet-4-6
**Judge:** claude-sonnet-4-6 (self-eval, calibration model)
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
| T5 | CHK-2.1 Card payment (PCI) | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | **1.00** | 1.00 | ✅ | APPROVE |

**Trial 1 summary:**
- Min score: 1.00
- Max score: 1.00
- Mean score: 1.00
- TCF: 1.00 across all cases
- Categorical fails: 0
- Cases compliant: 5/5

---

## Dimension Analysis

### D1 — AC Coverage (weight 0.35)
**5/5 cases score 1.0.** All ACs covered with runnable test bodies in every case. AC2 in T4 correctly routed to verification script with explicit rationale (external system not testable from app layer). No AC omitted from either output in any case.

Notable:
- T1: 7 tests covering all 4 ACs including the AC4 email-unavailable integration case
- T2: 7 tests (6 Jest + 1 k6) covering all 3 ACs + NFR-PERF-1
- T3: 4 tests; AC3 asserts all three shifted positions explicitly (pos 1, 2, 3)
- T5: 6 tests covering all 4 ACs + NFR-SEC-1 with separate log scan test

### D2 — Test Type Classification (weight 0.25)
**5/5 cases score 1.0.** Notable:
- **T3:** AC1 and AC3 correctly classified as Playwright E2E with a dedicated "⚠️ Browser-layout detection" section explaining the jsdom limitation and naming fireEvent.dragStart as a false-positive technique. `page.dragAndDrop()` used exclusively for both ACs. No D2 categorical fail triggered.
- **T4:** AC2 correctly classified as manual (external system boundary respected).
- **T5:** AC3 correctly classified as Playwright E2E (field-level error + network interception).

### D3 — Hallucination Suppression (weight 0.20)
**5/5 cases score 1.0.** Zero deductions across all cases.
- **T4 (critical):** No `fraudDetectionClient` or external system state assertions. Gap table explicitly names `fraudDetectionSystem.getLastEvent()` as a fabricated interface — active avoidance.
- **T5 (key differentiator vs Haiku):** NFR-SEC-1 test contains only negative log assertions (`capturedLogs not.toContain(testPan/testCvv/testExpiry)`). No positive AC1 gateway-call assertion mixed into the NFR test. This clean separation distinguishes Sonnet from Haiku on T5 — Haiku consistently scores D3=0.7 on this case due to scope-mixing; Sonnet scores D3=1.0. No AES-256, HSM, or PCI scope assertions anywhere.

### D4 — NFR Coverage (weight 0.10)
**T2 scores 1.0. T5 scores 1.0. T1, T3, T4: N/A.**
- **T2:** k6 script with `thresholds: { 'http_req_duration': ['p(99)<200'] }`, setup() seeds exactly `count: 10000` sessions, 30s duration. All three NFR-PERF-1 specifics (200ms, p99, 10,000 sessions) operationalised.
- **T5:** NFR-SEC-1 covered by log scan (TestLogCapture) + DB null-field check. Both the log dimension and the DB persistence dimension of NFR-SEC-1 are operationalised.

### D5 — Dual Output (weight 0.10)
**5/5 cases score 1.0.** All cases produce both a technical test plan with runnable test bodies and a plain-language verification script. Verification scripts use plain English throughout. T3 uses browser step indicators (🔴). T4 uses ⚠️ SHARED ENVIRONMENT annotation for manual AC2 scenario.

---

## Critical Trap Assessments

| Trap | Expectation | Result | Notes |
|------|-------------|--------|-------|
| T3 — jsdom/fireEvent for drag-drop | Must NOT use jsdom for AC1/AC3 | ✅ PASS | Playwright used. Dedicated ⚠️ section rejects fireEvent by name. |
| T3 — uncaveated dragStart assertion | Any uncaveated dragStart = categorical fail | ✅ PASS | No dragStart assertion. Mentioned only in explanatory rejection. |
| T4 — fraudDetectionClient assertion | Any external system internal = categorical fail | ✅ PASS | No external system assertions. Gap table names the forbidden pattern explicitly. |
| T5 — AES-256/HSM/PCI scope assertion | Any encryption/compliance internal = categorical fail | ✅ PASS | No crypto/HSM/PCI scope assertions. PCI constraint block at top. |
| T5 — NFR scope-mixing (AC1 in NFR test) | Extra gateway-call assertion in NFR test | ✅ PASS | NFR test is clean negative assertions only. No scope-mixing. |
| T2 — threshold-calibrated performance test | Must cite 200ms, p99, 10k sessions | ✅ PASS | All three specifics in k6 script. |

---

## Trial 1 Verdict

**PASS.** TCF = 1.00. Compliant = true across all five cases. No categorical fails.

All five cases score 1.00 weighted. This is a perfect result against the EVAL.md rubric. No deductions on any dimension.

**Key qualitative observation — T5:** Sonnet avoids the T5 D3 scope-mixing issue that Haiku exhibits in both trials. The NFR-SEC-1 test is cleanly scoped in Sonnet's output. This represents a measurable model-level quality difference on the PCI-scoped hallucination suppression dimension.

---

## Judge files referenced

- [T1-run-1-judge.md](T1-run-1-judge.md)
- [T2-run-1-judge.md](T2-run-1-judge.md)
- [T3-run-1-judge.md](T3-run-1-judge.md)
- [T4-run-1-judge.md](T4-run-1-judge.md)
- [T5-run-1-judge.md](T5-run-1-judge.md)
