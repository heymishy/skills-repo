# Review: NZ Real-Time Payments (RTP) — Inbound Payment Integration

**Status:** Approved with HIGH findings resolved (eval-mode — EXP-008-corpus-breadth-eval / Config A / S3)
**Feature slug:** rtp-receiving-integration
**Date:** 2026-05-18
**Skill version:** /review
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Source artefacts read from disk before this stage:** `runs/config-A-S3/discovery.md`, `runs/config-A-S3/definition.md`

---

## Review summary

| Severity | Count | Disposition |
|---------|-------|-------------|
| HIGH | 3 | All 3 addressed via gate conditions in test plan / story ACs — see detail below |
| MEDIUM | 2 | Both addressed in story ACs; no blocking issues |
| LOW | 2 | Noted; addressed via confirmation tasks in story ACs |
| **Overall verdict** | **Proceed with test plan** | HIGH findings are resolved by design gates already embedded in definition |

---

## HIGH findings

### H1 — AML latency at RTP peak load (C2/C3 interaction — unresolved architectural risk)

**Finding:** The AML Screening Service has a current P99 of 8 seconds at 10,000 tph. The RTP peak volume is estimated at 40,000 tph — four times the tested capacity. The definition commits to an AML screening call P99 ≤ 6 seconds (Story 2.2 AC6), but this threshold has never been tested at the required volume. The EA registry AML-RISK-001 classifies this as CRITICAL.

**Risk:** If the AML Screening Service cannot achieve P99 ≤ 6 seconds at 40,000 tph under the current architecture, the entire 10-second acknowledgement window (C3) is at risk. AML is a mandatory synchronous step (C2). The enterprise cannot bypass AML screening to meet the acknowledgement window. If no architecture change resolves this, the scheme go-live date (C1) is at risk.

**Concern with current definition:** Story 2.2 documents the AML spike gate condition in AC6, but the timing is ambiguous — the definition states the spike must complete before AC targets are "finalised" but does not enforce that the spike must complete before Epic 1 or Epic 2 implementation begins. If the spike reveals an AML integration architecture redesign is required, the redesign will be a scope and timeline change.

**Resolution required:** The test plan must include a dedicated load test gate (T-AML-LOAD) that is explicitly sequenced before Story 2.2 can enter test; the spike must be a named deliverable on the project plan, not just an implied precondition. Story 2.2 AC6 must be strengthened so that the AML spike completion is an entry condition for any implementation work on Story 2.2 (not just for AC finalisation). The test plan should treat the AML load test as a blocking verification step for the entire Epic 2 integration.

**Resolved by:** T-AML-LOAD gate in test plan + Story 2.2 AC6 entry condition in DoR

---

### H2 — Fraud architecture decision gap (C4 — unresolved before implementation can begin)

**Finding:** Story 2.3 is gated on an approved fraud architecture ADR (AC1) but the ADR has not been written and no timeline for the ADR decision is specified. The definition correctly flags that the vendor real-time beta API must not be used in production, but the rule-based pre-screen approach has not been formally assessed against fraud risk performance expectations. The ADR is a pre-condition for Story 2.3 implementation, but without the ADR being produced, there is no governance record of why the vendor beta API is excluded from the current release.

**Risk:** Without the ADR: (1) the implementation team may inadvertently use the vendor beta API if the rule-based engine underperforms; (2) fraud risk and information security teams have not signed off the fraud detection posture for the RTP channel; (3) the enterprise has no documented rationale for the pre-screen approach if Payments NZ or an external audit requests evidence.

**Resolution required:** The test plan must include a test case (T-FRAUD-ADR) that verifies the ADR exists and has been approved before any Story 2.3 implementation begins. The ADR must be treated as a hard precondition gate, not just a named step in AC1. The DoR must list the fraud ADR as a dependency that must be confirmed before the Story 2.3 test plan is signed off.

**Resolved by:** T-FRAUD-ADR gate in test plan + DoR H9 dependency check

---

### H3 — Scheme certification precondition not explicitly enforced as a hard sequencing gate (C5 — structural risk)

**Finding:** The discovery correctly identified the [PRECONDITION] nature of the C5 scheme certification gap. The definition positioned Story 3.1 as a parallel workstream starting from day one. However, Story 3.1's acceptance criteria (AC7) make the scheme admission reference a mandatory field in the production deployment manifest, but there is no explicit enforcement mechanism at the story or epic level preventing a production deployment authorisation from being issued before Story 3.1 AC5 (scheme admission granted) is confirmed.

**The specific risk:** If Stories 1.1, 1.2, 2.1, 2.2, 2.3, and 3.2 all complete but Story 3.1 AC5 is not yet confirmed, a pressure-driven decision to go live before scheme admission is issued creates exactly the regulatory penalty risk the C5 finding was intended to prevent. The definition's framing (Story 3.1 AC7 "required field in production deployment manifest") relies on the deployment process to enforce the gate. This is a process gate, not a technical gate, and process gates are vulnerable to schedule pressure.

**Resolution required:** The test plan must include an explicit test case (T-CERT-GATE) that verifies no production deployment can be authorised unless the scheme admission reference field is present and non-empty in the deployment manifest. This test must be part of the production deployment readiness check, not a documentation check. The DoR must also include the scheme admission reference as a hard deployment gate — not just a documentation field — with a named responsible owner.

**Resolved by:** T-CERT-GATE test + deployment gate field enforcement in test plan + DoR Section H9 explicit gate check

---

## MEDIUM findings

### M1 — Reconciliation failure modes not assessed (Story 2.1 — operational risk)

**Finding:** The in-memory ledger + end-of-day batch reconciliation pattern is described as an "enterprise first" (Story 2.1, Complexity 3 rationale). The payment operations team has not reviewed the reconciliation design. The definition includes a reconciliation design review as Story 2.1 AC5, but there is no assessment of the failure modes: what happens if the in-memory ledger and core banking produce different account balances, if the reconciliation window is missed, or if the core banking batch rejects credits from the in-memory ledger.

**Resolution:** Story 2.1 must include specific ACs covering reconciliation exception escalation and the definition of "unresolved discrepancy." The test plan should include reconciliation failure tests (T-RECON-FAIL). The operations team sign-off is a gate condition for Story 2.1 — not a post-implementation review.

**Status:** Addressed in Story 2.1 AC3 and AC5; test plan must include reconciliation failure tests.

---

### M2 — Recall processing not explicitly assessed in Story 3.1 item-by-item review scope

**Finding:** Inbound payment recall (pacs.004 negative, camt.056) is explicitly out of scope in the out-of-scope register. However, the scope accumulator noted that Story 3.1 AC1 must identify whether any of the 16 outstanding certification items require recall handling as a certification requirement. The out-of-scope decision could be overridden by the certification assessment. This creates an ambiguity: if recall processing is a certification item, it is simultaneously out of scope and a required certification deliverable.

**Resolution:** Story 3.1 AC2 escalation procedure must explicitly name recall processing as one of the items to check and escalate if found. The test plan should include a test case verifying that this escalation step is documented in the Story 3.1 completion record. If recall processing is a certification requirement, the out-of-scope register must be updated and Epic 1 scope revised.

**Status:** Addressed by Story 3.1 AC2 escalation trigger; confirmed in test plan scope.

---

## LOW findings

### L1 — AML/CFT domestic RTP threshold not confirmed (C2 — open question from discovery)

**Finding:** The AML/CFT Act 2009 monitoring threshold for domestic RTP inbound payments has not been confirmed by Financial Crime Compliance. Story 2.2 AC7 requires this confirmation before the story goes to test. However, if the domestic threshold is different from the international payment threshold, the screening rules in Story 2.2 will need to be updated before the story can be accepted — this is a late-stage change risk.

**Recommendation:** The Financial Crime Compliance threshold confirmation should be treated as a sprint 1 task (not a story AC confirmation requirement), and the answer should inform Story 2.2 AC1 before development begins. This is a risk, not a blocker, because the AML integration architecture does not change — only the screening threshold parameter.

**Status:** Noted; Story 2.2 AC7 captures the confirmation requirement. Low-risk because threshold is a configuration parameter.

---

### L2 — Scheme rule version governance gap (ongoing operational risk)

**Finding:** EA registry RTP-RISK-003 (MEDIUM) notes that scheme rule changes require implementation within timeframes specified in the rules. No story in this feature covers the operational process for receiving scheme rule change notifications, assessing implementation impact, and scheduling the work. This is an ongoing operational gap that will persist after the initial go-live.

**Recommendation:** This is a post-MVP operational process gap. It should be recorded in the product decisions log as a post-go-live workstream. It does not affect the current feature scope.

**Status:** Noted. Not a blocker for this feature. Log in decisions.md as a post-go-live operational process item.

---

## Architecture review (Category E)

**Risk area A — Real-time layer boundary:** The in-memory ledger approach creates a two-phase commit problem: the account credit is recorded in the in-memory ledger before it is posted to core banking. If the in-memory ledger service fails after credit but before reconciliation, the account balance visible to the customer may not match core banking. This is an accepted architecture trade-off for the real-time requirement, but the failure detection and recovery path must be designed before implementation. Story 2.1 AC4 covers the unavailability path; the recovery design (re-crediting vs. hold-and-investigate) must be documented in the Story 2.1 design review.

**Risk area B — AML/fraud processing budget stacking:** The sum of all processing budgets within the 10-second window has not been formally specified. Story 1.1 takes 500ms, AML takes up to 6s, sanctions take up to 1s, fraud pre-screen takes up to 1s, account credit takes up to 2s — total worst case = 10.5s at P99 (one combination of upper bounds), which exceeds the 10-second window. The budget must be formally allocated and summed before architecture is committed. This should be a Story 3.2 pre-condition, not a discovery in the load test.

**Risk area C — 10-second timeout handling:** The scheme requires the enterprise to respond within 10 seconds. If a processing step is still running at second 9.5, the acknowledgement must be sent immediately to avoid missing the window, even if processing has not completed. The logic for when to send a "held" pacs.004 vs. a "negative" pacs.004 under time pressure must be defined as an explicit state machine before implementation. Story 1.2 AC2 covers timeout-triggered negative responses but the state machine is not documented.

---

# CPF-TRACE
```yaml
story: S3
stage: /review
model: claude-sonnet-4-6
injection_files_active:
  - S3-ea-registry-rtp-payments.md (post-fix)
injection_design_test:
  ea_registry: "PASS (post-fix — see /discovery trace)"
constraints_surfaced_at_this_stage: [C1, C2, C3, C4, C5]
c5_surfaced: true
c5_surface_stage: /discovery
c5_surface_mechanism: >
  Propagated from /discovery. At /review stage, C5 surfaces as HIGH finding H3 (structural
  gap: certification precondition not technically enforced as a hard deployment gate).
  The review correctly identifies the gap: Story 3.1 AC7 relies on a process gate (deployment
  manifest field) rather than a technical gate. H3 resolution requires an explicit test case
  (T-CERT-GATE) and a hard gate in the DoR. This is a C5 propagation and quality upgrade
  (from "documentation gate" to "technical enforcement gate").
c5_surfacing_quality: full
c5_surfacing_notes: >
  C5 not only propagated but strengthened at the /review stage — the review identified that
  the definition's process-gate approach for scheme certification was insufficient and required
  a technical enforcement gate. This is the expected quality pattern for a full C5 surfacing:
  the constraint continues to improve in precision through the pipeline stages.
blocker_in_discovery: true
blocker_type: scheme_certification_precondition
```
