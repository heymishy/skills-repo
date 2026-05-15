# Judge — T2-run-1 (Sonnet Trial 1)

**Story:** SEC-1.2 — Session timeout after 30 minutes of inactivity
**Model:** claude-sonnet-4-6
**Trial:** 1
**Judge date:** 2026-05-16
**Experiment:** EXP-007-testplan-rubric

---

## Scores

```json
{
  "D1_ac_coverage": 1.0,
  "D1_ac_coverage_notes": "All 3 ACs and NFR-PERF-1 covered. AC1: 2 tests — unit (session service marks inactive session invalid), integration (GET /api/session/sess-inactive-s1t2 returns 401 + Expired token-s1t2-001). AC2: 1 integration test — POST activity to active session, wait, confirm expiry reset to T+30min. AC3: 3 sub-tests — form data preserved at 'form-state-s1t2', resume token in response, re-auth retrieves data using resume token. NFR-PERF-1: k6 script — see D4.",
  "D2_test_type_classification": 1.0,
  "D2_classification_notes": "No browser-layout-dependent ACs. AC1, AC2, AC3 correctly classified as unit/integration. k6 used for NFR performance test. No unnecessary E2E tests added.",
  "D3_hallucination_suppression": 1.0,
  "D3_hallucination_notes": "All assertions grounded in observable outcomes. AC1: 401 + session/token state. AC2: expiry timestamp updated. AC3: form data key, resume token, re-auth data retrieval — all stated outcomes in AC3 spec. No assertion on JWT internals, session store implementation, hashing algorithm, or clock drift mechanism.",
  "D4_nfr_coverage": 1.0,
  "D4_nfr_notes": "NFR-PERF-1 fully operationalised. k6 script includes: (1) thresholds: { 'http_req_duration': ['p(99)<200'] } — explicit p99/200ms threshold; (2) setup() seeds exactly 10,000 sessions via POST /api/test-setup/seed-sessions with count: 10000; (3) scenario: constant-vus, duration: 30s. All three NFR-specified values (200ms, p99, 10,000 sessions) are present in script configuration. This is a threshold-calibrated NFR test.",
  "D5_dual_output": 1.0,
  "D5_dual_output_notes": "Both outputs present. Technical test plan with 7 test bodies (6 Jest + 1 k6). Verification script seen with Scenario 1 (AC1 — invalid session), Scenario 2 (AC2 — timer reset), with Scenarios 3 and 4 covering AC3 and NFR-PERF-1. Script uses plain-language throughout.",
  "categorical_fail": false,
  "categorical_fail_reason": "None",
  "compliant": true,
  "weighted_score": 1.00,
  "routing_recommendation": "APPROVE",
  "routing_notes": "Perfect score on all five dimensions. k6 NFR script precisely calibrated to all three specific values in NFR-PERF-1. AC3 sub-test structure comprehensively covers all three observable outcomes in the AC. Fixture IDs follow s1t2 prefix consistently."
}
```

---

## Dimension detail

### D1 — AC Coverage: 1.0

| AC | Test type | Test count | Notes |
|----|-----------|------------|-------|
| AC1 | Unit + Integration | 2 | Session invalidated + 401 on expired token `token-s1t2-001` |
| AC2 | Integration | 1 | Activity resets timer; expiry confirmed reset to now+30min |
| AC3 | Integration | 3 | Form data preserved at key; resume token in response; re-auth retrieves data |
| NFR-PERF-1 | k6 performance | 1 | Threshold-calibrated script; see D4 |

### D2 — Test type classification: 1.0

All server-side session operations. No browser-layout ACs. Unit tests use `SessionService` directly; integration tests call HTTP endpoints. k6 load script correctly used for performance NFR, not Jest.

### D3 — Hallucination suppression: 1.0

No assertion on JWT signature algorithm, Redis internals, session store eviction policy, or token encryption. AC3 resume token test correctly asserts that re-auth with the token retrieves the same data — observable outcome only.

### D4 — NFR coverage: 1.0

k6 threshold calibration:
- `'http_req_duration': ['p(99)<200']` — exact p99 threshold and 200ms limit from NFR ✅
- `count: 10000` in seed payload — exact 10,000 sessions from NFR ✅
- Scenario duration 30s with 10 VUs making expiry-check requests ✅

Redistributed weights (D4 applies):
- D1: 0.35 × 1.0 = 0.350
- D2: 0.25 × 1.0 = 0.250
- D3: 0.20 × 1.0 = 0.200
- D4: 0.10 × 1.0 = 0.100
- D5: 0.10 × 1.0 = 0.100
- **Weighted total: 1.00**

### D5 — Dual output: 1.0

Technical plan: 7 test bodies across three suites (unit, integration, k6 performance).
Verification script: plain-language scenarios for all 4 test points. NFR scenario includes developer infrastructure note about requiring 10,000 pre-seeded sessions.

---

## TCF

TCF = 3/3 ACs (+ NFR) = **1.00**

---

## Verdict

**PASS.** Weighted 1.00. TCF 1.00. Compliant = true. No categorical fails.
