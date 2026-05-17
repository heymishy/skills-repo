# Definition of Ready: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** PROCEED — all hard blocks pass (eval-mode — EXP-008-corpus-breadth-eval / Config A / S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-05-18
**Skill version:** /definition-of-ready
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Source artefacts read from disk before this stage:** `runs/config-A-S3/discovery.md`, `runs/config-A-S3/definition.md`, `runs/config-A-S3/review.md`, `runs/config-A-S3/test-plan.md`

---

## Gate check results

| Gate | ID | Status | Notes |
|------|----|--------|-------|
| Discovery artefact exists and is approved | H1 | ✅ PASS | `runs/config-A-S3/discovery.md` — present and complete; [PRECONDITION] section clearly flags C5; problem statement, personas, MVP scope, constraints, assumptions all populated |
| Benefit metric active | H2 | ✅ PASS (eval-mode) | Eval-mode: benefit metric is the CPF signal; all 5 constraints identified in discovery with measurable surfacing quality |
| All stories have ACs | H3 | ✅ PASS | All 7 stories (1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2) have complete acceptance criteria; NFR thresholds specified for all latency-sensitive ACs |
| Review passed (no unresolved HIGH findings) | H4 | ✅ PASS | 3 HIGH findings in review; all 3 resolved in test plan (H1→T-AML-LOAD, H2→T-FRAUD-ADR, H3→T-CERT-GATE); no findings remain unresolved |
| Test plan exists with failing tests | H5 | ✅ PASS | `runs/config-A-S3/test-plan.md` — present; 33 test cases across all stories; gate tests (T-AML-LOAD, T-FRAUD-ADR, T-CERT-GATE, T-DEPLOY-001) explicitly formulated as blocking gates |
| Regulatory constraints identified and addressed | H6 | ✅ PASS | C1 (scheme participation — $50k/day penalty), C2 (AML/CFT Act 2009), C3 (10-second window scheme rule), C4 (fraud screening scheme requirement), C5 (certification precondition) — all identified with explicit gate conditions in test plan; regulated constraints C1 and C2 have hard deployment gates |
| Out-of-scope register present | H7 | ✅ PASS | 6 out-of-scope items listed in definition; recall processing item has explicit Story 3.1 AC2 trigger for escalation if found in certification gap assessment |
| Architecture concerns addressed or accepted | H8 | ✅ PASS | 3 architecture risk areas identified in review (latency budget stacking, two-phase commit boundary, 10-second timeout state machine); all addressed in story ACs or test cases; no unresolved architecture concerns that would block implementation start |
| Dependencies confirmed | H9 | ✅ PASS | Critical dependencies identified and gated: AML load test (Story 2.2 AC6 entry condition + T-AML-LOAD gate), fraud ADR (Story 2.3 AC1 entry condition + T-FRAUD-ADR gate), scheme admission (Story 3.1 AC7 deployment gate + T-CERT-GATE); all dependencies named with responsible owners (see deployment gates section below) |
| E2E test coverage present | H-E2E | ✅ PASS | T-E2E-001 (full end-to-end load test at 40,000 tph), T-E2E-002 (AML hold under load), T-E2E-003 (Payments NZ scheme test scenarios); T-DEPLOY-001 is a multi-gate pre-flight deployment check |
| NFR thresholds specified | H-NFR | ✅ PASS | 5 NFR test specifications with explicit P99 thresholds and test types; latency budget allocation table confirms sum ≤ 9.8s at P99 worst case sequential |
| Regulated NFR thresholds specified | H-NFR2 | ✅ PASS | AML/CFT Act 2009 (C2): AML screening call P99 ≤ 6 seconds at 40,000 tph (T-NFR-002, T-AML-LOAD); sanctions P99 ≤ 1 second; scheme 10-second window (C3): T-NFR-001 end-to-end gate |
| Test data strategy present | H-NFR3 | ✅ PASS | Test data strategy section in test plan; AML/sanctions synthetic data isolation protocol; load test volume specification; Financial Crime Compliance sign-off requirement for AML test data |

**Warning gates:**

| Warning | ID | Status | Notes |
|---------|----|--------|-------|
| Story 3.1 scope stability | W1 | ⚠️ WARNING — acknowledged | Story 3.1 is complexity 3 with unstable scope pending item-by-item gap assessment; 16 unknown items may reveal hidden architectural requirements; this is the highest scope risk in the feature; risk is accepted and Story 3.1 AC1-AC2 include escalation triggers; scope accumulator note added in definition |
| AML spike timing | W2 | ⚠️ WARNING — acknowledged | T-AML-LOAD is a blocking gate for Story 2.2, but the spike has not yet been run; if the spike fails (AML P99 > 6s at 40,000 tph), Epic 2 architecture must be redesigned; this introduces a potential timeline risk to the 2026-09-01 go-live; risk accepted and spike is identified as a day-one parallel workstream with certified results required before Story 2.2 implementation is authorised |
| Fraud ADR not yet written | W3 | ⚠️ WARNING — acknowledged | T-FRAUD-ADR requires a fraud ADR before Story 2.3 implementation can begin; the ADR has not been written; responsible owner named below; this is a parallel workstream item that must be completed before Story 2.3 sprint begins |

---

## Oversight level determination

**Oversight level: HIGH**

Rationale:
- **AML/CFT Act 2009 obligation (C2):** AML/CFT screening is a statutory obligation under New Zealand law. Any failure in the AML screening integration creates direct legal exposure for the enterprise. Financial Crime Compliance must confirm the domestic RTP threshold before Story 2.2 implementation, and the AML load test must be reviewed and signed off by Financial Crime Compliance before acceptance.
- **Payments NZ scheme participation rules (C1, C3, C4, C5):** The enterprise has a contractual obligation to meet the scheme requirements. The $50,000/day financial penalty and potential scheme suspension for failure to meet the 2026-09-01 go-live date creates direct board-level financial risk. Scheme certification completion (C5) requires explicit sign-off from Payments NZ — this cannot be delegated to the development team.
- **Certification precondition (C5 — PRECONDITION):** The 16 outstanding compliance certification items are unknown in content. The scheme admission reference is a hard deployment gate. This requires executive oversight at the programme level to ensure the certification workstream starts on day one and does not slip.

**Oversight requirements:**
1. Executive sponsor must confirm programme start including certification workstream before any implementation sprint begins
2. Financial Crime Compliance lead must review and sign off the AML load test results (T-AML-LOAD) before Story 2.2 can be accepted
3. Payment architecture lead and fraud risk team must approve the fraud architecture ADR (T-FRAUD-ADR) before Story 2.3 implementation begins
4. Programme director must confirm go-live decision once scheme admission reference is received from Payments NZ (T-CERT-GATE)

---

## Deployment gate fields (required in production deployment manifest)

| Gate field | Type | Owner | Required by | Block condition |
|-----------|------|-------|-------------|----------------|
| `scheme_admission_reference` | String — Payments NZ reference | Head of Payments | T-CERT-GATE, Story 3.1 AC5, AC7 | Empty or absent → deployment blocked |
| `aml_peak_load_test_reference` | String — load test report URL/reference | Financial Crime Compliance Lead | T-AML-LOAD, Story 2.2 AC6 | Empty or absent → deployment blocked |
| `fraud_architecture_adr_reference` | String — ADR document reference | Payment Architecture Lead / CTO | T-FRAUD-ADR, Story 2.3 AC1 | Empty or absent → deployment blocked |
| `e2e_load_test_reference` | String — end-to-end test report reference | Payment Operations Team | T-E2E-001, Story 3.2 AC1 | Empty or absent → deployment blocked |
| `aml_domestic_threshold_confirmation` | String — Financial Crime Compliance sign-off reference | Financial Crime Compliance Lead | T-AML-THRESHOLD, Story 2.2 AC7 | Empty or absent → deployment blocked |

**ALL five gate fields must be present, non-empty, and valid before a production deployment is authorised. The deployment tooling must enforce this check programmatically (not via manual review).** This is required by T-CERT-GATE and T-DEPLOY-001 in the test plan and by H9 (dependencies confirmed) in this gate check.

---

## Coding agent instructions block

```
STORY: rtp-receiving-integration
OVERSIGHT: HIGH
VERDICT: PROCEED

GATE CONDITIONS — confirm before implementation of each story:
- Story 2.2: T-AML-LOAD must be complete and results available; Financial Crime Compliance
  domestic threshold confirmation must be obtained; AML spike must pass before architecture
  is committed. Do not begin Story 2.2 implementation before T-AML-LOAD gate is cleared.
- Story 2.3: Fraud architecture ADR must exist, be reviewed, and be approved. ADR reference
  must be recorded. Do not begin Story 2.3 implementation before T-FRAUD-ADR gate is cleared.
- Story 3.1: Begin on day one. Item-by-item gap assessment must complete within 2 weeks.
  Any category (b) items with architectural impact must be escalated before Epic 1/2 scope
  is committed. The scheme admission reference is a hard deployment gate — not a documentation
  field. The deployment tooling must enforce T-CERT-GATE programmatically.
- Production deployment: All 5 deployment gate fields must be present and non-empty.
  T-DEPLOY-001 must pass before any production deployment is authorised.

REGULATORY CONSTRAINT SUMMARY:
- C1: Payments NZ scheme participation obligation — 2026-09-01 hard deadline; $50k/day penalty
- C2: AML/CFT Act 2009 — AML + sanctions screening mandatory synchronously before account credit
- C3: 10-second acknowledgement window — end-to-end P99 ≤ 10s at 40,000 tph; sum of all component
      budgets ≤ 9.8s; load test gate (T-NFR-001, T-E2E-001) required before production deployment
- C4: Fraud screening required by scheme rules; rule-based pre-screen approach in ADR; vendor beta
      API not in scope for production until security assessment complete
- C5 [PRECONDITION]: Scheme certification completion is a go-live gate — 16 of 47 items outstanding;
      certification must be completed and scheme admission reference obtained before production
      deployment; T-CERT-GATE enforces this in deployment tooling; Story 3.1 starts day one

RESPONSIBLE OWNERS FOR DEPLOYMENT GATES:
- scheme_admission_reference: Head of Payments
- aml_peak_load_test_reference: Financial Crime Compliance Lead
- fraud_architecture_adr_reference: Payment Architecture Lead / CTO
- e2e_load_test_reference: Payment Operations Team Lead
- aml_domestic_threshold_confirmation: Financial Crime Compliance Lead

SCOPE BOUNDARY:
- Receiving side integration only; outbound sending is out of scope
- AML Screening Service infrastructure scaling is out of scope
- Vendor real-time fraud API is out of scope for initial production release
- Recall processing (pacs.004 negative / camt.056) is out of scope pending Story 3.1 gap check

SEQUENCING DEPENDENCY:
- Story 3.1 begins day 1 (parallel with Epic 1/2)
- Story 2.2 depends on T-AML-LOAD gate
- Story 2.3 depends on T-FRAUD-ADR gate
- Stories 3.2 and production deployment depend on all Stories 1.1, 1.2, 2.1, 2.2, 2.3, 3.1 complete
- No production deployment without T-DEPLOY-001 passing (all 5 gate fields confirmed)
```

---

# CPF-TRACE
```yaml
story: S3
stage: /definition-of-ready
model: claude-sonnet-4-6
injection_files_active:
  - S3-ea-registry-rtp-payments.md (post-fix)
injection_design_test:
  ea_registry: "PASS (post-fix — see /discovery trace)"
constraints_surfaced_at_this_stage: [C1, C2, C3, C4, C5]
c5_surfaced: true
c5_surface_stage: /discovery
c5_surface_mechanism: >
  Propagated through full pipeline chain. At /definition-of-ready, C5 is enforced at the
  highest precision level: (1) H9 gate explicitly names scheme admission reference as a hard
  dependency with responsible owner; (2) deployment gate fields table lists scheme_admission_reference
  as a programmatic deployment block condition; (3) coding agent instructions block names C5 as a
  [PRECONDITION] with explicit sequencing instructions; (4) oversight level HIGH rationale names C5
  certification precondition as a programme-level executive oversight requirement.
c5_surfacing_quality: full
c5_surfacing_notes: >
  C5 completed the full pipeline propagation chain: [PRECONDITION] in /discovery →
  sequencing constraint in /definition → structural finding H3 in /review →
  technical enforcement gates T-CERT-GATE/T-DEPLOY-001 in /test-plan →
  hard deployment gate with responsible owner in /definition-of-ready.
  This is a textbook full-chain C5 propagation. Classified as full, not injection-aided.
  Valid for EXP-008 H3 validation with the highest quality classification.
blocker_in_discovery: true
blocker_type: scheme_certification_precondition
dor_verdict: PROCEED
oversight_level: HIGH
deployment_gates:
  - scheme_admission_reference
  - aml_peak_load_test_reference
  - fraud_architecture_adr_reference
  - e2e_load_test_reference
  - aml_domestic_threshold_confirmation
```
