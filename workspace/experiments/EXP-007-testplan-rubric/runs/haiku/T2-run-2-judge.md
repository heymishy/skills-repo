# Judge Report — T2 Session timeout with performance NFR (Run 2)

**Model:** claude-haiku-4-5
**Judge:** claude-sonnet-4-6
**Date:** 2026-05-16
**Corpus case:** T2 — SEC-1.2 Automatic session invalidation after 30 minutes inactivity

---

## Evidence Summary

**Coverage table:** AC1 Unit ✓, AC2 Unit ✓, AC3 Integration ✓, NFR-PERF-1 Load test ✓. All Covered.

**Test bodies:**
- Test 1 (AC1): `InMemorySessionStore`, session with 30-min-ago `lastActivityAt` → `runExpiryCheck()` → `getSession()` returns null, `validateToken` returns `{valid: false, statusCode: 401}`. Grounded in AC1.
- Test 2 (AC2): Session at T0, `recordAction(token, T+15min)` → `session.lastActivityAt === actionTime`, `isSessionExpired(id, wouldExpireAt - 1000) === false`. Grounded in AC2.
- Test 3 (AC3): Expired session with form data → `response.statusCode=401`, `response.error='session_expired'`, `response.resumeToken` defined, form data preserved and retrievable after re-auth via `getFormData(newSession.token, resumeToken)`. Grounded in AC3.

**NFR-PERF-1 load test (k6 script):**
- Tool explicitly named: k6
- Threshold: `'http_req_duration': ['p(99)<200']` — exact value from NFR (200ms, p99)
- Session volume: `maxSessions: 10000` in trigger POST body
- Pre-test setup: "Seed 10,000 session records" with explicit loop
- All three specific parameters (200ms, p99, 10,000 sessions) explicitly operationalised

**Verification script:** AC1–AC3 and NFR covered. Both outputs present. Plain language throughout.

Distinct session IDs, token values, and form field content from Trial 1 confirm genuine independent run.

---

## Scores

| Dimension | Weight | Score | Notes |
|-----------|--------|-------|-------|
| D1 — AC Coverage Completeness | 0.35 | 1.0 | All 3 ACs and NFR have complete runnable test bodies |
| D2 — Test Type Classification | 0.25 | 1.0 | Unit/Integration/Load test — all correct |
| D3 — Hallucination Suppression | 0.20 | 1.0 | All assertions grounded in AC/NFR observable outcomes |
| D4 — NFR Coverage | 0.10 | 1.0 | k6 with explicit `p(99)<200`, `maxSessions:10000`, 30s duration; all specifics present |
| D5 — Dual Output Completeness | 0.10 | 1.0 | Both outputs present; verification script plain-language throughout |

**Weighted score:** 1.00
**TCF (Total Coverage Fraction):** 1.00 — no AC or NFR omitted
**Categorical fails:** None

---

## D4 Focus — NFR Threshold Calibration

NFR-PERF-1 requires: ≤200ms, p99, with 10,000 sessions.

The k6 script includes:
- `thresholds: { 'http_req_duration': ['p(99)<200'] }` ← explicit 200ms + p99
- `maxSessions: 10000` in trigger POST body ← explicit count
- Pre-test setup loop: "Seed 10,000 session records" ← explicit count named
- Test runs for 30s duration with `sleep(1)` between iterations

**Score: D4 = 1.0.** Consistent with Trial 1; all three specifics operationalised in configuration.

---

## JSON Score Block

```json
{
  "model": "claude-haiku-4-5",
  "judge": "claude-sonnet-4-6",
  "corpus_case": "T2",
  "trial": 2,
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs and NFR-PERF-1 have complete runnable test bodies. Coverage table accurate.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "Unit for AC1/AC2, Integration for AC3, Load test for NFR-PERF-1. All correct. No browser-layout dependency.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in AC/NFR observable outcomes. No fabricated internals. isSessionExpired() assertion correctly grounded in AC2's 30-minute reset observable.",
  "D4_nfr_coverage": 1.0,
  "D4_nfr_notes": "k6 script with explicit 'p(99)<200' threshold, maxSessions:10000 in trigger call, 30s test duration. All three required specifics (200ms, p99, 10k sessions) present. Consistent with Trial 1.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both technical plan and verification script present. Verification script plain-language throughout.",
  "categorical_fail": false,
  "categorical_fail_reason": null,
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score. Trial 2 uses distinct fixture values from Trial 1 confirming independence. NFR threshold calibration is exemplary and consistent across both trials."
}
```
