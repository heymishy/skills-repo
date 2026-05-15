# Judge — T2-run-2 (Sonnet Trial 2)

**Story:** SEC-1.2 — Session timeout after 30 minutes of inactivity
**Model:** claude-sonnet-4-6
**Trial:** 2
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs and NFR-PERF-1 covered. Distinct fixture data from Trial 1 confirmed (sess-idle-s2t2-001, token-s2t2-001, user-s2t2-003 through user-s2t2-006 vs Trial 1's s1t2 prefix). AC1: session invalidated (sess-idle-s2t2-001) + 401 on expired token-s2t2-001. AC2: activity resets timer on active session. AC3: 3 sub-tests — form data preserved at form-state-s2t2 key, resume token in response, re-auth with resume token retrieves data for user-s2t2-006. NFR-PERF-1: k6 script with threshold and 10,000 seeded sessions. 7 tests (6 Jest + 1 k6).",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "No browser-layout-dependent ACs. All classified as unit/integration. k6 used for NFR performance test. Consistent with Trial 1.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in observable outcomes. Distinct fixture IDs from Trial 1 across all tests. No JWT internals, session store implementation, or hashing algorithm assertions. AC3 sub-tests assert only the observable outputs stated in the AC: form data at key, resume token present, data retrievable after re-auth.",
  "D4_nfr_coverage": 1.0,
  "D4_nfr_notes": "NFR-PERF-1 fully operationalised. k6 script: thresholds: { 'http_req_duration': ['p(99)<200'] } — explicit p99/200ms threshold. setup() seeds sessionCount: 10000 sessions — exact 10,000 value. vus: 50, duration: '30s'. All three NFR-specified values present. Consistent precision with Trial 1.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. Technical test plan with 7 test bodies (6 Jest + 1 k6). Verification script with 4 plain-language scenarios covering all ACs and NFR. Uses s2t2 fixture identifiers consistently. Scenarios distinguishable from Trial 1 by fixture data.",
  "categorical_fail": false,
  "categorical_fail_reason": "None",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all five dimensions. k6 NFR script identically calibrated to Trial 1 (p99<200, 10000 sessions) — confirms stable NFR handling. Fixture independence confirmed. AC3 coverage consistent between trials."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC | Test type | Test count | Notes |
|----|-----------|------------|-------|
| AC1 | Unit + Integration | 2 | sess-idle-s2t2-001 invalidated; 401 on expired token-s2t2-001 |
| AC2 | Integration | 1 | Activity resets timer; expiry confirmed updated |
| AC3 | Integration | 3 | Form data key preserved; resume token in response; re-auth retrieves data |
| NFR-PERF-1 | k6 | 1 | Threshold-calibrated; see D4 |

### D2 — Test type classification: 1.0

Consistent with Trial 1. No browser-layout ACs. All server-side operations tested at unit/integration level.

### D3 — Hallucination suppression: 1.0

No assertions on session store internals, JWT signature, clock mechanism, or token format. All observables grounded in AC text.

### D4 — NFR coverage: 1.0

k6 threshold calibration (Trial 2):
- `'http_req_duration': ['p(99)<200']` ✅
- `sessionCount: 10000` in setup seed ✅
- `vus: 50, duration: '30s'` ✅

Weights (D4 applies):
- D1: 0.35 × 1.0 = 0.350
- D2: 0.25 × 1.0 = 0.250
- D3: 0.20 × 1.0 = 0.200
- D4: 0.10 × 1.0 = 0.100
- D5: 0.10 × 1.0 = 0.100
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

Technical plan: 7 tests. Verification script: 4 scenarios in plain English. Fixture IDs distinct from Trial 1.

---

## TCF

TCF = 3/3 ACs (+ NFR) = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails.
