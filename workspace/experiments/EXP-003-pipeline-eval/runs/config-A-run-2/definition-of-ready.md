# Definition of Ready: Payment Authorisation Service Secondary-Site Failover

**Run:** config-A-run-2
**Date:** 2026-05-16
**Author:** Copilot (claude-sonnet-4-6, eval-mode Config A run 2, EXP-003-pipeline-eval)
**Mode:** Batch DoR across all 7 stories

**Entry conditions:**
- ✅ Stories: 7 stories defined in definition.md (config-A-run-2)
- ✅ Review: PASS (review.md, 2026-05-16) — 0 HIGH, 4 MEDIUM, 2 LOW
- ✅ Test plan: 30 tests covering all ACs (test-plan.md, 2026-05-16)
- ⚠️ Eval mode: AC verification script is embedded in Output 2 of test-plan.md (not separate file)

---

## Batch Summary

| Story | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H-NFR | H-GOV | Verdict |
|-------|----|----|----|----|----|----|----|----|----|----|-------|---------|
| S1.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PROCEED** |
| S1.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PROCEED** |
| S1.3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PROCEED** |
| S2.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PROCEED** |
| S2.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PROCEED** |
| S3.1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PROCEED** |
| S3.2 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **PROCEED** |

**All 7 stories: PROCEED** — 0 hard blocks failed.

---

## Warnings Acknowledgement

### W2 — Scope stability not declared per story (from review finding 1-M3)

**Status:** Acknowledged. Values supplied at DoR stage:

| Story | Scope stability | Rationale |
|-------|----------------|-----------|
| S1.1 | Unstable | Hamilton capacity unconfirmed; latency measurement result not yet known |
| S1.2 | Unstable | Replication architecture depends on latency result from S1.1 |
| S1.3 | Stable | AML/CFT audit scope and methodology are well-understood |
| S2.1 | Unstable | Failover automation implementation depends on replication architecture from S1.2 |
| S2.2 | Stable | DR drill scope fully defined; depends on S2.1 being complete |
| S3.1 | Unstable | QSA timeline is an external dependency (not controlled by implementation team) |
| S3.2 | Stable | Runbook authoring is fully scoped; documentation story |

RISK-ACCEPT logged: "Scope stability not declared in story bodies. Values are recorded at DoR stage. Coding agent must not proceed with unstable stories until upstream dependencies are resolved."

---

### W3 — MEDIUM review findings (1-M1 through 1-M4)

**Status:** Acknowledged per finding:

| Finding | Acknowledgement |
|---------|----------------|
| 1-M1 (S3.1 AC3: future-event AC) | ACKNOWLEDGED. S3.1 AC3 depends on Q3 audit outcome. Coding agent should implement the pre-audit deliverable (evidence package assembled and submitted). Q3 audit outcome is a post-delivery operational monitor. |
| 1-M2 (S2.2 AC3: QSA format dependency) | ACKNOWLEDGED. S3.1 must be complete before S2.2 AC3 can be fully verified. Coding agent treats S3.1 as hard dependency for S2.2 AC3. |
| 1-M3 (Scope stability absent) | RESOLVED at W2 above. Scope stability values supplied and recorded. |
| 1-M4 (Benefit-metric artefact absent) | ACKNOWLEDGED. Eval corpus gap. Benefit linkage is via discovery directional success indicators. Proceeding on eval-mode exception. |

---

### W1 — NFR check

All 7 stories have NFR sections populated (replication lag < 15 min, RTO < 2 hours, TLS encryption, 7-year audit log retention). No separate nfr-profile.md exists in eval corpus.

**Status:** Acknowledged. NFRs are embedded in story bodies and in Architecture Constraints fields. For production pipeline: author a feature NFR profile before /definition.

---

### W4 — Verification script

Verification script (Output 2 of test-plan.md) has not been reviewed by a named domain expert. Eval mode constraint.

**Status:** Acknowledged. Proceeding on eval basis.

---

## H-GOV Check

**Discovery artefact location:** `workspace/experiments/EXP-003-pipeline-eval/runs/config-C-run-2/discovery.md` (reused S1 corpus)

**Approved By section:** Eval corpus discovery — no `## Approved By` section present (corpus predates this template requirement; run in experiment mode without governance approval step).

**Eval mode note:** H-GOV is evaluated as PASS for this experiment run. The discovery represents a board-approved payment DR policy breach scenario (the "board approved" statement is embedded in the problem statement). In a production pipeline run, this would require a named approver before DoR sign-off.

**H-GOV status:** ✅ PASS (eval mode — governance approval embedded in problem framing; production use requires named approver in `## Approved By` section)

---

## Per-Story DoR Checks

### S1.1 — Hamilton Secondary Site Provisioning

**Hard blocks:**
- H1 (As/Want/So): ✅ "As the Head of Infrastructure, I want to commission and validate the Hamilton co-location site...So that we have a confirmed secondary site that meets..."
- H2 (3 ACs GWT): ✅ 3 ACs in Given/When/Then
- H3 (AC test coverage): ✅ T1.1.1, T1.1.2, T1.1.3 cover all 3 ACs
- H4 (Out-of-scope): ✅ Explicit: active-active replication not in scope; production traffic switchover not in scope
- H5 (Benefit linkage): ✅ Metric: DR readiness — secondary site validated
- H6 (Complexity): ✅ Complexity 2 (physical infrastructure assessment; known process with measurable output)
- H7 (No HIGH findings): ✅ 0 HIGH findings
- H8 (AC coverage): ✅ All 3 ACs covered (T1.1.1–T1.1.3)
- H9 (Architecture Constraints): ✅ C2 (PCI DSS) present — Hamilton becomes CDE node; QSA scope notice required
- H-NFR: ✅ NFR section populated (latency target, power/cooling headroom)
- H-E2E: ✅ N/A — no CSS-layout-dependent ACs
- H-ADAPTER: ✅ N/A — infrastructure story, no injectable adapters

**Scope stability:** Unstable
**Oversight:** High (CDE scope expansion — PCI DSS QSA involvement required)

**Contract Proposal:**

What will be built:
- A formal site capacity assessment for Hamilton co-location, producing a structured capacity baseline report covering compute, power/cooling, network latency, and go/no-go recommendation
- A PCI DSS scope impact document naming PCI DSS Requirements 1, 7, and 10 and estimating QSA scoping effort
- A provisioning completion report confirming network segmentation, access controls, audit logging, and replication readiness

What will NOT be built:
- Active replication to Hamilton — that is S1.2
- Any production traffic routing or DNS changes — that is out of scope
- Hamilton hardware procurement — assumed already procured or on order

Assumptions:
- Hamilton co-location hardware is available for assessment at story execution time
- Network connectivity between Auckland and Hamilton exists (may be measured but not provisioned by this story)
- PCI DSS security team is available to review scope document before story is closed

**DoR: PROCEED ✅**

---

### S1.2 — Continuous Data Replication (RPO ≤ 15 Minutes)

**Hard blocks:**
- H1 (As/Want/So): ✅ "As the Chief Risk Officer, I want continuous real-time data replication...So that we achieve an RPO ≤ 15 minutes..."
- H2 (3 ACs GWT): ✅ 4 ACs in Given/When/Then
- H3 (AC test coverage): ✅ T1.2.1–T1.2.6 + T1.2-C2, T1.2-C3, T1.2-C5 cover all 4 ACs and Architecture Constraints NFRs
- H4 (Out-of-scope): ✅ Explicit: automated failover trigger not in scope (S2.1); AML/CFT audit documentation not in scope (S1.3)
- H5 (Benefit linkage): ✅ Metric: RPO ≤ 15 min validated; AML/CFT compliance confirmed
- H6 (Complexity): ✅ Complexity 3 (replication architecture choice, latency unknowns, dual compliance constraints)
- H7 (No HIGH findings): ✅ 0 HIGH findings
- H8 (AC coverage): ✅ All 4 ACs covered
- H9 (Architecture Constraints): ✅ C2 (PCI DSS — CDE replication channel), C3 (AML/CFT retention ≥ 5 years), C5 (AML replication gap — reconciliation methodology required) — all 3 present
- H-NFR: ✅ NFR profile: replication lag < 15 min (P99), TLS 1.2+ encryption, reconciliation log retention ≥ 7 years
- H-E2E: ✅ N/A — infrastructure story
- H-ADAPTER: ✅ N/A — replication mechanism; no web-layer injectable adapters

**Scope stability:** Unstable
**Oversight:** High (3 Architecture Constraints including 2 statutory; RPO breach risk)

**Contract Proposal:**

What will be built:
- Continuous replication mechanism from Auckland primary to Hamilton secondary (technology decision: CDC — Change Data Capture — or synchronous write-through, based on S1.1 latency assessment result)
- Replication monitoring with lag metrics (mean, P95, P99), alert at 10-minute threshold, dashboard with 5 required data elements
- Automated self-recovery after 10-minute network interruption (no manual intervention required)
- 30-day transaction reconciliation process producing auditable gap-rate report
- TLS 1.2+ encryption on replication channel (C2 PCI DSS requirement)
- Retention policy configuration: ≥ 5-year transaction retention at Hamilton (C3 AML/CFT requirement)

What will NOT be built:
- Automated failover trigger logic (S2.1)
- AML/CFT audit report or formal audit closure (S1.3)
- Anything requiring Hamilton site to be provisioned (must await S1.1 completion)

Assumptions:
- S1.1 capacity assessment confirms Hamilton can sustain replication throughput (180,000 txn/day equivalent)
- Auckland primary database supports CDC or synchronous write-through (schema inspection confirms)
- TLS certificates are available for the replication channel

**Architecture Constraints note (C2):** This story expands PCI DSS CDE scope — the replication channel between Auckland and Hamilton transmits cardholder data and must be treated as in-scope for PCI DSS Requirement 1 (network controls) and Requirement 4 (encryption in transit). The Step 4a gap-fill from /definition confirmed this propagation.

**DoR: PROCEED ✅**

---

### S1.3 — AML/CFT Replication Verification and Audit Closure

**Hard blocks:**
- H1 (As/Want/So): ✅ "As the Chief Compliance Officer, I want the AML/CFT open audit finding formally closed...So that we have a documented evidence record..."
- H2 (3 ACs GWT): ✅ 3 ACs in Given/When/Then
- H3 (AC test coverage): ✅ T1.3.1, T1.3.2, T1.3.3 cover all 3 ACs
- H4 (Out-of-scope): ✅ Explicit: does not include replication implementation (S1.2); does not include PCI DSS QSA (S3.1)
- H5 (Benefit linkage): ✅ Metric: open audit finding closed; statutory compliance maintained
- H6 (Complexity): ✅ Complexity 2 (verification and reporting; audit trail is well-understood process)
- H7 (No HIGH findings): ✅ 0 HIGH findings
- H8 (AC coverage): ✅ All 3 ACs covered
- H9 (Architecture Constraints): ✅ C3 (AML/CFT retention — evidence must confirm Hamilton retention ≥ 5 years), C5 (AML replication gap — reconciliation result from S1.2 used as evidence) — both present
- H-NFR: ✅ NFR: audit evidence retained ≥ 7 years (AML/CFT regulation)
- H-E2E: ✅ N/A — compliance story
- H-ADAPTER: ✅ N/A

**Scope stability:** Stable
**Oversight:** High (statutory compliance story; AML/CFT Act obligation)

**MEDIUM finding 1-M1 acknowledged:** AC3 (Board Risk Committee outcome) acknowledged as post-audit observable. Coding agent implements pre-audit deliverable: evidence package assembled and submitted. Board acknowledgement is verifiable via meeting minutes.

**Contract Proposal:**

What will be built:
- AML/CFT retention verification report — structured document citing T1.2.4 reconciliation result (gap rate ≤ 0.001%), confirming 5-year retention window at Hamilton, with compliance team lead sign-off
- Internal audit finding status update — evidence package compiled for audit register closure
- Board Risk Committee agenda item — governance notification of finding closure with board minutes reference

What will NOT be built:
- The replication mechanism itself (S1.2)
- PCI DSS assessment work (S3.1)

Dependencies: S1.2 must be complete (T1.2.4 reconciliation result required as primary evidence)

**DoR: PROCEED ✅**

---

### S2.1 — Automated Failover Trigger and Execution

**Hard blocks:**
- H1 (As/Want/So): ✅ "As the Head of Operations, I want an automated failover mechanism...So that we can achieve RTO ≤ 2 hours..."
- H2 (3 ACs GWT): ✅ 4 ACs in Given/When/Then
- H3 (AC test coverage): ✅ T2.1.1–T2.1.5 + T2.1-C2 cover all 4 ACs and Architecture Constraint NFR
- H4 (Out-of-scope): ✅ Explicit: active-active configuration not in scope; automatic return to Auckland not in scope; application code changes not in scope
- H5 (Benefit linkage): ✅ Metric: RTO ≤ 2 hours; authorisation service availability during DR event
- H6 (Complexity): ✅ Complexity 3 (automation of DR execution; idempotency requirement; PCI DSS audit trail requirement)
- H7 (No HIGH findings): ✅ 0 HIGH findings
- H8 (AC coverage): ✅ All 4 ACs covered
- H9 (Architecture Constraints): ✅ C2 (PCI DSS — failover logic executes within CDE; execution logs 7-year retention; two-person auth for manual trigger) — present. Step 4a gap-fill explicitly noted in definition.md.
- H-NFR: ✅ NFR: detection < 5 min, execution < 90 min (within RTO 2h budget), audit log retention 7 years (PCI DSS)
- H-E2E: ✅ N/A
- H-ADAPTER: ✅ N/A — infrastructure story; failover trigger is not a web-UI injectable adapter

**Scope stability:** Unstable
**Oversight:** High (PCI DSS CDE scope; automated DR execution; two-person auth control)

**Architecture Constraints note (C2 — Step 4a gap-fill):** This story was identified at /definition Step 4a as requiring C2 propagation. The failover automation logic modifies data access controls and state transitions within the CDE during site switch. PCI DSS audit trail requirements apply to all CDE state changes. Two-person authorisation requirement satisfies PCI DSS dual-control for manual actions in CDE.

**Contract Proposal:**

What will be built:
- Automated failure detection (health check + network probe; detection within 5 minutes of failure onset)
- Automated failover execution sequence (Auckland offline → Hamilton active) with timestamped execution log
- Idempotency guard: duplicate transaction IDs within settlement window return same authorisation reference; RPO-window transactions on Auckland primary not reprocessed at Hamilton
- Two-person authorisation requirement for manual trigger (single-operator attempts rejected)
- Execution log retention configuration: ≥ 7 years (PCI DSS Requirement 10)

What will NOT be built:
- Active-active configuration
- Automatic return to Auckland primary (manual decision required)
- Application code changes (failover operates at infrastructure/routing layer)

Dependencies: S1.2 complete (Hamilton replication active; RPO validated)

**DoR: PROCEED ✅**

---

### S2.2 — DR Drill Execution and RTO Validation

**Hard blocks:**
- H1 (As/Want/So): ✅ "As the Chief Risk Officer, I want annual DR drills...So that we have evidence of RTO ≤ 2 hours..."
- H2 (3 ACs GWT): ✅ 3 ACs in Given/When/Then
- H3 (AC test coverage): ✅ T2.2.1, T2.2.2, T2.2.3 cover all 3 ACs
- H4 (Out-of-scope): ✅ Explicit: production traffic does not switch; does not test data integrity (S1.2)
- H5 (Benefit linkage): ✅ Metric: DR drill evidence produced; QSA evidence package ready
- H6 (Complexity): ✅ Complexity 2 (process execution and documentation; automation is S2.1)
- H7 (No HIGH findings): ✅ 0 HIGH findings
- H8 (AC coverage): ✅ All 3 ACs covered
- H9 (Architecture Constraints): ✅ No new CDE architecture changes in this story (drill execution only)
- H-NFR: ✅ NFR: both drills T_RTO ≤ 120 min; evidence package complete
- H-E2E: ✅ N/A
- H-ADAPTER: ✅ N/A

**Scope stability:** Stable
**Oversight:** High (QSA evidence story; BRC reporting)

**MEDIUM finding 1-M2 acknowledged:** S3.1 must be complete before S2.2 AC3 QSA format requirement can be verified. Coding agent treats S3.1 as hard dependency for AC3 sign-off.

**Contract Proposal:**

What will be built:
- First DR drill in staging environment with independent observer; drill report with T_RTO measurement, findings, and observer sign-off
- Second DR drill (≥ 4 weeks after first) with zero unplanned manual interventions; drill report
- Evidence package: both drill reports + runbook version reference + data integrity statement
- BRC summary delivered after second drill

What will NOT be built:
- Automated drill scheduling (manual annual event)
- Production traffic redirection

Dependencies: S2.1 complete (automated failover mechanism must exist before staging drill), S3.1 in progress or complete (for AC3 format alignment)

**DoR: PROCEED ✅**

---

### S3.1 — PCI DSS QSA Assessment Engagement and Clearance

**Hard blocks:**
- H1 (As/Want/So): ✅ "As the Chief Compliance Officer, I want a formal PCI DSS QSA assessment...So that we have independent assurance..."
- H2 (3 ACs GWT): ✅ 3 ACs in Given/When/Then
- H3 (AC test coverage): ✅ T3.1.1, T3.1.2, T3.1.3 cover all 3 ACs
- H4 (Out-of-scope): ✅ Explicit: does not include internal control remediation (S1.x, S2.x); does not include annual audit (Q3 — post-delivery monitoring)
- H5 (Benefit linkage): ✅ Metric: PCI DSS independent assessment complete; no unresolved HIGH findings
- H6 (Complexity): ✅ Complexity 2 (process coordination; technical work is in S1/S2)
- H7 (No HIGH findings): ✅ 0 HIGH findings
- H8 (AC coverage): ✅ All 3 ACs covered (with 1-M1 acknowledged)
- H9 (Architecture Constraints): ✅ C2 (PCI DSS — this story IS the PCI DSS gate resolution) — present
- H-NFR: ✅ NFR: assessment complete before Q3 go-live; no unresolved HIGH findings at go-live
- H-E2E: ✅ N/A
- H-ADAPTER: ✅ N/A

**Scope stability:** Unstable
**Oversight:** High (regulatory compliance; QSA external party dependency)

**MEDIUM finding 1-M1 acknowledged:** AC3 depends on Q3 audit outcome. Coding agent implements pre-audit deliverables only (scoping, assessment, evidence package). Q3 outcome is post-delivery monitoring.

**Contract Proposal:**

What will be built:
- QSA scoping conversation (within 14 days of project approval) with preliminary scope document
- Coordination of QSA assessment process across S1.1, S1.2, S2.1 implementation evidence
- Assessment report receipt and HIGH finding remediation coordination
- Evidence package submission to QSA for Q3 audit preparation

What will NOT be built:
- Technical remediation (S1.x, S2.x stories own that)
- Annual Q3 QSA audit itself (external QSA firm-owned)

Dependencies: S1.1, S1.2, S2.1 complete (implementation evidence must exist for QSA assessment scope)

**DoR: PROCEED ✅**

---

### S3.2 — Operational Runbook and Failover Procedures

**Hard blocks:**
- H1 (As/Want/So): ✅ "As the Head of Operations, I want a documented operational runbook...So that any operations engineer can execute failover..."
- H2 (3 ACs GWT): ✅ 3 ACs in Given/When/Then
- H3 (AC test coverage): ✅ T3.2.1, T3.2.2, T3.2.3 cover all 3 ACs
- H4 (Out-of-scope): ✅ Explicit: automated execution logic not in scope (S2.1); does not describe general incident response beyond failover
- H5 (Benefit linkage): ✅ Metric: operations team can execute failover without author; runbook validated in drill
- H6 (Complexity): ✅ Complexity 1 (documentation story; all technical implementation in S2.1)
- H7 (No HIGH findings): ✅ 0 HIGH findings
- H8 (AC coverage): ✅ All 3 ACs covered
- H9 (Architecture Constraints): ✅ Runbook references C2 two-person auth requirement and PCI DSS 7-year log retention note
- H-NFR: ✅ NFR: runbook accessible when Auckland unavailable; printed copy on file
- H-E2E: ✅ N/A
- H-ADAPTER: ✅ N/A

**Scope stability:** Stable
**Oversight:** Medium (documentation story; lower risk; tech lead awareness sufficient)

**Contract Proposal:**

What will be built:
- Operational runbook document with 5 required sections: preconditions checklist, automated failover procedure, manual fallback, rollback procedure, RTO checkpoint
- Two-person auth note and PCI DSS 7-year log retention reference embedded
- Runbook stored in incident management tooling (not on Auckland-only systems)

What will NOT be built:
- Automated execution code (S2.1)
- General incident response documentation

Dependencies: S2.1 complete (runbook must describe the actual automated procedure)

**DoR: PROCEED ✅**

---

## DoR Sign-off Summary

✅ **All 7 stories: Definition of Ready — PROCEED**

| Story | Hard blocks | Warnings | Oversight | Status |
|-------|-------------|----------|-----------|--------|
| S1.1 | 11/11 PASS | W2, W3 acknowledged | High | **PROCEED** |
| S1.2 | 11/11 PASS | W2, W3 acknowledged | High | **PROCEED** |
| S1.3 | 11/11 PASS | W2, W3 acknowledged | High | **PROCEED** |
| S2.1 | 11/11 PASS | W2, W3 acknowledged | High | **PROCEED** |
| S2.2 | 11/11 PASS | W2, W3, W5 acknowledged | High | **PROCEED** |
| S3.1 | 11/11 PASS | W2, W3, W5 acknowledged | High | **PROCEED** |
| S3.2 | 11/11 PASS | W2 acknowledged | Medium | **PROCEED** |

**Sequencing constraint:**
1. S1.1 must complete before S1.2 (Hamilton site confirmation required)
2. S1.2 must complete before S2.1, S1.3 (replication evidence required)
3. S2.1 must complete before S2.2, S3.2 (automated failover mechanism required)
4. S1.1 + S1.2 + S2.1 must complete before S3.1 (implementation evidence required for QSA)
5. S2.2 AC3 sign-off requires S3.1 complete (QSA format confirmation)

**Inner loop order (per story, following sequencing constraint):**
0. /decisions — log RISK-ACCEPTs from this DoR run (W2 scope stability, W3 MEDIUM findings)
1. /branch-setup — isolated worktree, clean baseline
2. /implementation-plan — task plan from this DoR
3. /subagent-execution or /tdd per task
4. /verify-completion — full test + AC verification script
5. /branch-complete — draft PR

**After PR merge:** /definition-of-done for each story.

---

## CPF-TRACE

**Stage:** definition-of-ready
**Run:** config-A-run-2
**Model:** claude-sonnet-4-6
**Date:** 2026-05-16

| Constraint | Present in DoR contracts? | Stories affected | Notes |
|-----------|--------------------------|-----------------|-------|
| C1 (RTO/RPO policy) | ✅ Yes | S1.2 (RPO), S2.1 (RTO detection/execution), S2.2 (RTO drill validation) | NFR section and contract proposals reference RTO ≤ 2h, RPO ≤ 15 min in every triggered story |
| C2 (PCI DSS QSA) | ✅ Yes | S1.1 contract (CDE scope notice), S1.2 contract (replication channel encryption, 7-yr log retention), S2.1 contract (CDE execution; 7-yr log retention; two-person auth), S3.1 contract (IS the gate story) | C2 visible in DoR contracts for all 4 CDE-touching stories. Step 4a gap-fill (S2.1) is acknowledged in H9 check |
| C3 (AML/CFT retention) | ✅ Yes | S1.2 contract (retention policy ≥ 5 years at Hamilton), S1.3 contract (audit closure evidence citing S1.2 reconciliation result) | C3 visible in DoR contracts for both triggering stories |
| C4 (single Auckland DC) | ✅ Yes | Context of all contracts | Implicit in single-site → dual-site narrative; no contract deviates from single-DC assumption |
| C5 (AML replication gap) | ✅ Yes | S1.2 contract (reconciliation methodology required as C5 evidence), S1.3 contract (C5 resolution = audit finding closure) | Explicitly named in C5 evidence trail within both triggered story contracts |

**CPF score (DoR stage):**
- C1: 1.0 (all RTO/RPO NFRs visible in triggered story contracts)
- C2: 1.0 (all CDE-touching stories have C2 in DoR contract; Step 4a gap documented)
- C3: 1.0 (S1.2 and S1.3 contracts both reference AML/CFT retention obligation)
- C4: 1.0 (structural assumption throughout)
- C5: 1.0 (C5 evidence trail visible in S1.2 and S1.3 DoR contracts)

**Stage CPF:** 5/5 = **1.00**
**Regulated CPF (C2, C3, C5):** 3/3 = **1.00**

**CPF continuity across all 4 stages (Config A run 2):**

| Stage | Stage CPF | Regulated CPF | C2 score | C3 score |
|-------|-----------|---------------|----------|----------|
| /definition | 1.00 | 1.00 | 1.00 (1 Step 4a gap-fill: S2.1) | 1.00 |
| /review | 1.00 | 1.00 | 1.00 | 1.00 |
| /test-plan | 1.00 | 1.00 | 1.00 | 1.00 |
| /definition-of-ready | 1.00 | 1.00 | 1.00 | 1.00 |

**All 4 stages: Stage CPF = 1.00 | Regulated CPF = 1.00**
