# Definition of Ready: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** PROCEED — all hard blocks pass (mock — EXP-008 S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-06-21
**Skill version:** /definition-of-ready

---

## Gate check results

| Gate | ID | Status | Notes |
|------|----|--------|-------|
| Discovery artefact exists and is approved | H1 | ✅ PASS | Problem statement, personas, MVP scope, constraints, assumptions all populated; C5 [PRECONDITION] clearly flagged |
| Benefit metric active | H2 | ✅ PASS | All 5 constraints identified; measurable targets set |
| All stories have ACs | H3 | ✅ PASS | All 7 stories (1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2) have complete ACs; NFR thresholds specified |
| Review passed (no unresolved HIGH findings) | H4 | ✅ PASS | 3 HIGH findings in review; all 3 resolved (H1→T-AML-LOAD, H2→T-FRAUD-ADR, H3→T-CERT-GATE) |
| Test plan exists with failing tests | H5 | ✅ PASS | 33 test cases; 4 gate tests (T-AML-LOAD, T-FRAUD-ADR, T-CERT-GATE, T-DEPLOY-001) explicitly blocking |
| Regulatory constraints identified and addressed | H6 | ✅ PASS | C1–C5 all identified with explicit gate conditions |
| Out-of-scope register present | H7 | ✅ PASS | 6 out-of-scope items; recall processing has Story 3.1 AC2 escalation trigger |
| Architecture concerns addressed | H8 | ✅ PASS | 3 architecture risk areas addressed in story ACs or test cases |
| Dependencies confirmed | H9 | ✅ PASS | AML load test (T-AML-LOAD), fraud ADR (T-FRAUD-ADR), scheme admission (T-CERT-GATE) all gated with named owners |
| E2E test coverage present | H-E2E | ✅ PASS | T-E2E-001, T-E2E-002, T-E2E-003, T-DEPLOY-001 |
| NFR thresholds specified | H-NFR | ✅ PASS | 5 NFR tests with explicit P99 thresholds |
| Test data strategy present | H-NFR3 | ✅ PASS | Synthetic data isolation protocol; Financial Crime Compliance sign-off required |

---

## Warning gates

| Warning | ID | Status | Notes |
|---------|----|--------|-------|
| Story 3.1 scope stability | W1 | ⚠️ WARNING — acknowledged | 16 unknown certification items may reveal hidden requirements; Story 3.1 AC1-AC2 include escalation triggers |
| AML spike timing | W2 | ⚠️ WARNING — acknowledged | T-AML-LOAD is a blocking gate but spike has not run; timeline risk to 2026-09-01 if spike fails |
| Fraud ADR not yet written | W3 | ⚠️ WARNING — acknowledged | ADR must be completed before Story 2.3 sprint; responsible owner named below |

---

## Oversight level

**HIGH** — AML/CFT Act 2009 statutory obligation, Payments NZ scheme contractual commitment ($50k/day penalty), and scheme certification precondition (C5) all require executive oversight.

**Required sign-offs before implementation:**
1. Executive sponsor confirms programme start including certification workstream
2. Financial Crime Compliance Lead reviews and signs off T-AML-LOAD results before Story 2.2 acceptance
3. Payment Architecture Lead + fraud risk team approve fraud ADR before Story 2.3 implementation
4. Programme director confirms go-live decision once scheme admission reference received (T-CERT-GATE)

---

## Deployment gate fields

| Gate field | Type | Owner | Block condition |
|-----------|------|-------|----------------|
| `scheme_admission_reference` | Payments NZ reference string | Head of Payments | Empty or absent → deployment blocked |
| `aml_peak_load_test_reference` | Load test report URL/reference | Financial Crime Compliance Lead | Empty or absent → deployment blocked |
| `fraud_architecture_adr_reference` | ADR document reference | Payment Architecture Lead / CTO | Empty or absent → deployment blocked |
| `e2e_load_test_reference` | E2E test report reference | Payment Operations Team Lead | Empty or absent → deployment blocked |
| `aml_domestic_threshold_confirmation` | Financial Crime Compliance sign-off ref | Financial Crime Compliance Lead | Empty or absent → deployment blocked |

**ALL 5 gate fields must be present, non-empty, and valid before production deployment. Deployment tooling must enforce this programmatically (T-CERT-GATE, T-DEPLOY-001).**

---

## Coding agent instructions

```
STORY: rtp-receiving-integration
OVERSIGHT: HIGH
VERDICT: PROCEED

GATE CONDITIONS:
- Story 2.2: T-AML-LOAD must pass; Financial Crime Compliance threshold confirmation required. Do not begin before gate cleared.
- Story 2.3: Fraud ADR must exist and be approved before implementation.
- Story 3.1: Begin day 1. Gap assessment must complete within 2 weeks. Scheme admission reference is a hard deployment gate.
- Production: All 5 deployment gate fields must be present. T-DEPLOY-001 must pass.

REGULATORY SUMMARY:
- C1: Payments NZ — 2026-09-01 hard deadline; $50k/day penalty
- C2: AML/CFT Act 2009 — mandatory synchronous screening before account credit
- C3: 10-second acknowledgement window — P99 ≤ 10s at 40,000 tph; T-E2E-001 required before production
- C4: Fraud screening required; rule-based pre-screen; vendor beta not in scope
- C5 [PRECONDITION]: Scheme certification must complete; scheme admission reference required in deployment manifest
```

---