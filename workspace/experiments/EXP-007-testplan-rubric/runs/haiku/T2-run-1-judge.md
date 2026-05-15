# Judge Report — T2 Session timeout with performance NFR (Run 1)

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Corpus case:** T2 — SEC-1.2 Automatic session invalidation after 30 minutes inactivity

---

## Evidence Summary

**Coverage table:** AC1 Unit ✓, AC2 Unit ✓, AC3 Integration ✓, NFR-PERF-1 Load test ✓. All Covered.

**Test bodies:**
- Test 1 (AC1): Mock session 30 min old → `runExpiryCheck()` → `session = null`, `validateToken` returns `{valid: false, statusCode: 401}`. Grounded in AC1.
- Test 2 (AC2): Session created at T0, `recordUserAction` at T+15min → `lastActivityAt` updated, `expiryTime` verified at T+15+30min. Grounded in AC2.
- Test 3 (AC3): Expired session + form data submission → `statusCode=401`, `error='session_expired'`, `resumeToken` defined, form data retrievable via `getFormData(newToken, resumeToken)`. Grounded in AC3.

**NFR-PERF-1 load test (k6 script):**
- Tool explicitly named: k6
- Threshold: `'http_req_duration': ['p(99)<200']` — exact value from NFR (200ms, p99)
- Session volume: `maxSessions: 10000` and setup: "seed Redis with 10,000 session keys"
- All three specific parameters (200ms, p99, 10,000 sessions) explicitly present in test configuration

**Verification script:** AC1–AC3 and NFR-PERF-1 all covered with plain-language scenarios. Both outputs present.

---

## Scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 — AC Coverage Completeness | 0.35 | 1.0 | All 3 ACs and NFR have runnable test bodies |
| D2 — Test Type Classification | 0.25 | 1.0 | Correctly classified: Unit/Integration/Load test; no browser-layout issues |
| D3 — Hallucination Suppression | 0.20 | 1.0 | All assertions map to observable AC/NFR outcomes; no fabricated internals |
| D4 — NFR Coverage | 0.10 | 1.0 | k6 script with explicit `p(99)<200` threshold and 10,000 session seed; all three required specifics present |
| D5 — Dual Output Completeness | 0.10 | 1.0 | Both outputs present; verification script covers all ACs and NFR in plain language |

**Weighted score:** 1.00
**TCF (Total Coverage Fraction):** 1.00 — no AC or NFR omitted
**Categorical fails:** None

---

## D4 Focus — NFR Threshold Calibration

NFR-PERF-1 requires: ≤200ms, p99, with 10,000 sessions.

The k6 script includes:
- `thresholds: { 'http_req_duration': ['p(99)<200'] }` ← explicit 200ms + p99
- `maxSessions: 10000` in the POST body ← explicit 10,000 sessions
- Pre-test setup text: "seed Redis with 10,000 session keys" ← explicit count named again

**Score: D4 = 1.0.** All three specifics present in the test script and commentary.

---

## JSON Score Block

```json
{
  "model": "claude-haiku-4-5",
  "judge": "claude-sonnet-4-6",
  "corpus_case": "T2",
  "trial": 1,
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs and NFR-PERF-1 have complete runnable test bodies. Coverage table accurate.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "Unit for AC1/AC2, Integration for AC3, Load test for NFR-PERF-1. All correct. No browser-layout ACs in this story.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in AC/NFR observable outcomes. Session store mock used correctly. No fabricated internals.",
  "D4_nfr_coverage": 1.0,
  "D4_nfr_notes": "NFR-PERF-1 load test uses k6 with explicit threshold 'p(99)<200', POST body maxSessions:10000, and pre-test setup seeding 10,000 session keys. All three required specifics (200ms, p99, 10k sessions) present and operationalised in script.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both technical plan and verification script present. Verification script covers AC1–AC3 and performance verification in plain language.",
  "categorical_fail": false,
  "categorical_fail_reason": null,
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score. NFR-PERF-1 threshold calibration is exemplary — all three specific values from the story NFR appear in the k6 script configuration."
}
```
