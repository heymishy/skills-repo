# Definition: Payment Authorisation Service Secondary-Site Failover

**Status:** Definition — Ready for /review
**Created:** 2026-05-16
**Author:** Copilot (claude-sonnet-4-6, eval-mode Config A run 2, EXP-003-pipeline-eval)
**Slicing Strategy:** Risk-first

---

## Entry Condition Verification

✅ **Discovery loaded:** Payment Authorisation Service Secondary-Site Failover
✅ **MVP scope items found:** 6 in-scope items
  1. Secondary site provisioning for active transaction processing (Hamilton co-location)
  2. Automated failover trigger and execution (failure detection, RTO ≤ 2h)
  3. Replication to RPO ≤ 15 minutes (continuous data sync Auckland → Hamilton)
  4. AML/CFT replication verification and gap closure (statutory 5-year retention)
  5. QSA assessment engagement (PCI DSS architectural review before go-live)
  6. Operational runbook and DR drill (documented procedure, 2 timed drills)

✅ **Personas identified:**
- Payment operations engineers (incident response, failover execution)
- Security and compliance team (PCI DSS / QSA relationship, AML/CFT obligation, audit finding)
- Board Risk Committee (DR policy governance, RTO/RPO compliance visibility)

✅ **Architecture guardrails:** No `.github/architecture-guardrails.md` found; proceeding without guardrail seeding.

---

## Slicing Strategy — Risk-First

**Rationale for risk-first:** This MVP carries two categories of delivery risk that dominate all others:

1. **Regulatory gate risk:** PCI DSS requires QSA assessment before any architectural change to the cardholder data environment (CDE) can go live. This gate cannot be parallelised — it blocks final deployment of all implementation stories. Stories that expand CDE scope must be identified and flagged before detailed implementation begins.

2. **Technical unknown risk:** The Auckland–Hamilton fibre link latency is unconfirmed. Whether continuous replication can achieve RPO ≤ 15 minutes depends on this measurement. A vertical-slice approach that commits to detailed implementation before latency is confirmed creates rework risk.

**Epic sequencing:** Infrastructure validation and replication configuration first (highest technical risk + most regulatory trigger points), failover automation second (depends on proven replication), compliance and operations third (gates and runbook complete the chain).

---

## Epic Structure

- **Epic E1: Secondary Site Infrastructure and Replication** — 3 stories — Hamilton site readiness, replication configuration, and AML/CFT gap closure (highest technical risk + most regulated constraint trigger points)
- **Epic E2: Failover Automation and Validation** — 2 stories — Automated failure detection, failover execution, and RTO verification through timed DR drills (depends on E1 replication being proven)
- **Epic E3: Compliance Gates and Operational Readiness** — 2 stories — PCI DSS QSA assessment completion and operational runbook (compliance gates and operational documentation)

---

## Step 4a — Regulated Constraint Propagation Check

### Step 4a.1 — Regulated Constraints Identified

From the discovery Constraints section, the following constraints reference an external compliance framework, a legal obligation, or a third-party assessment gate:

| Constraint ID | Name | Gate Type | Regulatory Framework |
|---------------|------|-----------|---------------------|
| C2 | PCI DSS: QSA architectural assessment required before any go-live that expands cardholder data environment scope | Process gate — third-party assessment | Payment Card Industry Data Security Standard (PCI DSS v4.0) |
| C3 | AML/CFT Act: Transaction records must replicate to secondary site within statutory 5-year retention window | Technical retention requirement + legal obligation | Anti-Money Laundering and Countering Financing of Terrorism Act 2009 (NZ) |
| C5 | AML replication gap: Current batch replication to Hamilton has not been validated against AML/CFT retention requirements | Regulatory-adjacent — open audit finding requiring evidenced closure | AML/CFT Act — internal audit finding, unresolved |

**Note on C5:** C5 is classified regulatory-adjacent rather than a primary regulatory framework because it is an open audit finding rather than a named statute. It shares trigger stories with C3 because closing the gap requires the same replication verification work.

---

### Step 4a.2 — Trigger Table

**Definition of triggering:** A story triggers a regulated gate if it introduces, modifies, or removes a system component (data store, network path, encryption mechanism, access control, API, replication channel) within the regulated scope, OR has ACs that require implementation code rather than documentation, vendor engagement, or validation only.

| Constraint | Stories that trigger it | Rationale |
|-----------|------------------------|-----------|
| **C2 (PCI DSS QSA)** | S1.1, S1.2, S2.1 | S1.1 provisions Hamilton as a new CDE node (expands PCI DSS audit scope); S1.2 configures continuous replication channel between CDE nodes; S2.1 implements failover logic affecting data state transitions and access controls across CDE boundary |
| **C3 (AML/CFT 5-year retention)** | S1.2, S1.3 | S1.2 implements the replication mechanism responsible for propagating transaction records; S1.3 explicitly closes the statutory retention gap with auditable evidence |
| **C5 (AML replication gap)** | S1.2, S1.3 | S1.2 implements the replication fix that may close or confirm the gap; S1.3 verifies and documents closure with evidence for internal audit sign-off |

**Stories explicitly excluded from C2 trigger:**
- S1.3 (AML/CFT verification): documentation and audit evidence gathering — no CDE component implementation
- S2.2 (DR drill and RTO validation): operational test procedure — no implementation code, executes against already-deployed infrastructure
- S3.1 (QSA assessment): IS the gate resolution story — engagement and project management, not implementation
- S3.2 (Operational runbook): documentation only — no system component implementation

Trigger exclusions logged in decisions.md (source: agent-auto, Step 4a, 2026-05-16).

---

### Step 4a.3 — Architecture Constraints Gap Check

**Pre-step-4a status (Sonnet natural decomposition):**

Before running the formal Step 4a check, my natural decomposition included C2 in S1.1 and S1.2 (I identified both as CDE scope expansions), C3 in S1.2/S1.3, and C5 in S1.2/S1.3. However, C2 was NOT initially included in S2.1 Architecture Constraints — the failover automation story was framed as an operational capability change, and the CDE scope implication of modifying data-state transitions under failover was not surfaced until Step 4a forced the explicit per-story trigger check.

**Gap identification — C2 missing from S2.1:**

> ⚠️ **REGULATED CONSTRAINT GAP: C2 (PCI DSS QSA) not in S2.1 Architecture Constraints.**
>
> This story triggers the gate because: S2.1 implements failover logic that affects data access controls and transaction state transitions across the Auckland–Hamilton CDE boundary. Any implementation modifying how cardholder data is accessed or transitioned during failover falls within PCI DSS CDE scope and requires QSA assessment.
>
> Fix applied: C2 added to S2.1 Architecture Constraints.

**Post-gap-closure verification:**

| Pair | C2 present? | C3 present? | C5 present? |
|------|-------------|-------------|-------------|
| S1.1 Architecture Constraints | ✅ Yes (natural) | N/A (not triggered) | N/A (not triggered) |
| S1.2 Architecture Constraints | ✅ Yes (natural) | ✅ Yes (natural) | ✅ Yes (natural) |
| S1.3 Architecture Constraints | N/A (not triggered by C2) | ✅ Yes (natural) | ✅ Yes (natural) |
| S2.1 Architecture Constraints | ✅ Yes (**Step 4a gap-fill**) | N/A (not triggered) | N/A (not triggered) |

✅ **Regulated constraint propagation check complete (Step 4a)**
Constraints checked: 3 | Stories updated: 1 (S2.1, C2 gap-fill) | Trigger exclusions logged: 4

---

## Epic E1: Secondary Site Infrastructure and Replication

**Epic ID:** E1
**Slicing strategy:** Risk-first — technical feasibility and regulatory scope before implementation commitment

---

### Story S1.1: Hamilton Secondary Site Provisioning for Active Transaction Processing

**Story ID:** S1.1
**Priority:** Critical (technical risk — Hamilton capacity unconfirmed)
**Complexity:** 2 (significant uncertainty; known unknowns on compute capacity and network latency)
**Persona:** Payment operations engineers

#### User Story

As a **payment operations engineer**,
I want to **assess and provision the Hamilton co-location facility for full-volume active payment authorisation processing during a failover event**,
So that **the secondary site can sustain 180,000 transactions per day at production latency tolerances, enabling the DR failover infrastructure to be implemented with a confirmed capacity baseline**.

#### Acceptance Criteria

**AC1 — Capacity baseline report**
Given the Hamilton co-location facility is currently configured for backup storage (not active transaction processing),
When the operations and infrastructure teams complete a technical assessment of the Hamilton site,
Then a capacity baseline report is produced that documents:
- Available compute resources (CPU cores, RAM, storage IOPS) vs. the Auckland primary site profile required to sustain 180,000 txn/day
- Power and cooling headroom at the Hamilton site relative to a full-volume transaction processing workload
- Network bandwidth available on the Auckland–Hamilton fibre link (bi-directional throughput measured under load)
- Round-trip latency on the Auckland–Hamilton fibre link at peak and off-peak load (measured, not estimated)
- A go/no-go recommendation: can the Hamilton site sustain full-volume processing within the latency tolerances required for card authorisation (typically <200ms end-to-end)?

**AC2 — PCI DSS scope document**
Given the capacity baseline shows Hamilton can sustain full-volume processing,
When the security and compliance team reviews the proposed Hamilton provisioning plan,
Then a PCI DSS scope impact document is produced that states:
- Which PCI DSS requirements apply to the Hamilton site once it becomes an active CDE node (physical security, network segmentation, access controls, logging, monitoring)
- Specific PCI DSS requirements that require Hamilton site evidence for the Q3 QSA assessment
- An estimate of QSA scoping effort required to assess the Hamilton site additions
- Whether any deficiencies are identified at Hamilton that would require remediation before QSA assessment

**AC3 — Provisioning runbook**
Given the capacity baseline and PCI DSS scope documents are approved by the security and compliance lead,
When provisioning activities are executed at the Hamilton site,
Then a provisioning completion report documents:
- Hardware and network configuration applied at Hamilton
- Network segmentation configuration verifiable against PCI DSS Requirement 1 (network controls)
- Access control configuration verifiable against PCI DSS Requirement 7 (restrict access to system components)
- Logging and monitoring configuration verifiable against PCI DSS Requirement 10 (log and monitor all access)
- Confirmation that Hamilton is ready to accept replication from the Auckland primary (S1.2 dependency satisfied)

#### Dependencies

- None (first story in sequence)

#### Architecture Constraints

- **C2 (PCI DSS):** Provisioning Hamilton as an active CDE node expands PCI DSS audit scope. All provisioning decisions must be documented for QSA review. No production go-live until QSA assessment is complete (S3.1).
- Primary Auckland site architectural documentation must be available as reference for Hamilton parity configuration.

#### Out of Scope

- Implementing continuous replication from Auckland to Hamilton (that is S1.2)
- Configuring automated failover trigger logic (that is S2.1)
- Completing the QSA assessment (that is S3.1 — S1.1 only produces the scoping documentation)
- Active-active multi-site configuration (deferred per discovery)

#### NFRs

- Network latency measurement must be taken under load (not idle baseline)
- Capacity assessment must test 100% of peak transaction volume (180,000 txn/day), not a representative subset
- PCI DSS scope document must be reviewed by the security and compliance team lead before provisioning proceeds

---

### Story S1.2: Continuous Data Replication to Hamilton (RPO ≤ 15 Minutes)

**Story ID:** S1.2
**Priority:** Critical (highest regulatory trigger density — C1, C2, C3, C5 all apply)
**Complexity:** 3 (high — replication mechanism must meet RPO, AML/CFT retention, and PCI DSS CDE scope simultaneously)
**Persona:** Payment operations engineers, Security and compliance team

#### User Story

As a **payment operations engineer**,
I want to **implement continuous data replication from the Auckland primary site to the Hamilton secondary site such that Hamilton's transaction state is never more than 15 minutes stale**,
So that **the secondary site can resume payment authorisation from a near-current state during a failover, satisfying both the board-approved RPO ≤ 15 minutes policy and the AML/CFT statutory transaction record retention requirement**.

#### Acceptance Criteria

**AC1 — Replication mechanism implemented and measured**
Given the Hamilton site is provisioned and network connectivity is established (S1.1 complete),
When the continuous replication mechanism is implemented and running under production-equivalent load (180,000 txn/day),
Then replication lag monitoring shows:
- Mean replication lag < 5 minutes under normal load conditions
- 99th-percentile replication lag < 15 minutes under peak load conditions
- Replication lag never exceeds 15 minutes during a 72-hour continuous observation window at production-equivalent load
- An automated alert fires when replication lag exceeds 10 minutes (giving 5-minute warning headroom to the RPO boundary)

**AC2 — RPO validation via simulated primary failure**
Given continuous replication is operating and being monitored,
When a simulated primary site failure is triggered (controlled test, not production),
Then:
- The last committed transaction on the Auckland primary at the point of simulated failure is recorded (T_failure)
- The first transaction state available on the Hamilton secondary is reconciled against T_failure
- The delta (T_failure minus earliest available Hamilton state) is ≤ 15 minutes
- This measurement is repeated 3 times across different times of day (peak morning, mid-day, off-peak evening) to confirm consistency

**AC3 — Transaction record completeness check**
Given continuous replication has been operating for a minimum 30-day observation window,
When the security and compliance team runs a transaction record completeness audit,
Then:
- A reconciliation of Auckland primary transaction log vs Hamilton secondary transaction log for the observation period shows ≤ 0.001% record gap rate (no more than 1 in 100,000 transactions missing from the secondary)
- Any gap is traceable to a specific time window with an identified cause (network interruption, maintenance window, etc.)
- The reconciliation methodology is documented and auditable (required for AML/CFT audit finding closure in S1.3)

**AC4 — Replication monitoring dashboard**
Given the replication mechanism is in production operation,
When the operations team reviews replication health,
Then a replication monitoring dashboard displays:
- Current replication lag (updated at minimum every 60 seconds)
- 24-hour replication lag trend (P50, P95, P99)
- Alert history (any lag breaches of the 10-minute warning threshold)
- Replication throughput (transactions per second replicated)
- Last confirmed full-consistency timestamp

#### Dependencies

- S1.1 complete (Hamilton site provisioned, network connectivity established, capacity confirmed)

#### Architecture Constraints

- **C1 (RTO/RPO policy):** Replication lag must remain ≤ 15 minutes continuously. This is a board-approved policy requirement. Any replication architecture that cannot guarantee ≤ 15 minutes RPO under peak load must be redesigned before implementation proceeds.
- **C2 (PCI DSS):** The replication channel transmits cardholder data between two CDE nodes. The replication mechanism itself falls within PCI DSS CDE scope. Encryption of replication traffic in transit is mandatory (PCI DSS Requirement 4). The channel design must be documented for QSA review. No production go-live until QSA assessment is complete (S3.1).
- **C3 (AML/CFT Act):** The replication mechanism is the technical control responsible for propagating transaction records to the secondary site within the statutory 5-year retention window. If the mechanism does not capture all transaction records (including records written during network partitions or maintenance windows), the AML/CFT retention obligation may not be met. AC3 of this story provides the evidence baseline for S1.3 audit closure.
- **C5 (AML replication gap):** The current batch replication process to Hamilton has not been validated against AML/CFT retention requirements. This story's implementation either fixes or confirms the gap. The AC3 reconciliation exercise is the primary evidence for the open internal audit finding.

#### Out of Scope

- Verifying AML/CFT compliance and closing the internal audit finding (that is S1.3 — S1.2 provides the technical evidence; S1.3 closes the finding)
- Configuring the automated failover trigger (that is S2.1)
- Changes to payment authorisation business logic, fraud rules, or AML screening rules during replication (must be zero-drift replication of current logic)
- Active-active replication (deferred per discovery)

#### NFRs

- Replication traffic must be encrypted in transit (TLS 1.2 minimum, TLS 1.3 preferred)
- Replication must survive a 10-minute network interruption and self-recover without manual intervention, resuming from the interruption point rather than restarting
- Replication monitoring must be observable from the existing operations monitoring toolstack (no new monitoring infrastructure in scope)

---

### Story S1.3: AML/CFT Replication Verification and Internal Audit Finding Closure

**Story ID:** S1.3
**Priority:** High (regulatory obligation — open audit finding must be closed before Q3 QSA)
**Complexity:** 2 (documentation and verification; depends on S1.2 evidence being available)
**Persona:** Security and compliance team

#### User Story

As a **member of the security and compliance team**,
I want to **verify that the continuous replication mechanism provides auditable evidence that transaction records replicate to the Hamilton secondary site within the AML/CFT Act's statutory 5-year retention window, and formally close the open internal audit finding**,
So that **the organisation meets its statutory AML/CFT obligation, the internal audit finding is closed with documented evidence, and the Board Risk Committee receives governance confirmation that the compliance gap has been resolved**.

#### Acceptance Criteria

**AC1 — AML/CFT retention verification completed**
Given the continuous replication mechanism is implemented and the 30-day observation window from S1.2 AC3 is available,
When the security and compliance team conducts the AML/CFT retention verification,
Then a verification report is produced that includes:
- Confirmation that transaction records replicate to the Hamilton secondary site with ≤ 0.001% record gap rate (citing S1.2 AC3 reconciliation as evidence)
- A statement confirming that the replication mechanism satisfies the 5-year statutory retention window (i.e., records are not subject to deletion or expiry at the secondary site)
- Identification of any time-limited replication windows (e.g., maintenance windows) during which records may not replicate, with documented recovery procedures
- A sign-off from the security and compliance team lead confirming the verification methodology is auditable

**AC2 — Internal audit finding formally closed**
Given the AML/CFT retention verification report is complete and signed off,
When the internal audit team reviews the evidence,
Then:
- The open internal audit finding (AML/CFT transaction record replication gap to Hamilton) is marked as closed in the internal audit register
- The closure evidence package includes: S1.2 replication monitoring data, the reconciliation report, the retention verification report, and the compliance team sign-off
- The internal audit team provides a written closure confirmation before the Q3 QSA audit
- The closure confirmation references the specific audit finding ID in the register

**AC3 — Board Risk Committee notification**
Given the internal audit finding is formally closed,
When the compliance team prepares the quarterly governance report,
Then:
- The Board Risk Committee agenda includes an item confirming the AML/CFT audit finding is resolved
- The agenda item references: the internal audit finding ID, the closure date, and the evidence package summary
- The Board Risk Committee minutes record acknowledgement of closure

#### Dependencies

- S1.2 complete (continuous replication operational; 30-day observation data and reconciliation report available)

#### Architecture Constraints

- **C3 (AML/CFT Act):** This story is the direct governance closure action for the statutory retention obligation. The verification methodology must produce evidence that can withstand scrutiny from both the internal audit team and a potential AML/CFT regulatory examination. The retention window (5 years) must be explicitly addressed — point-in-time verification is insufficient; the mechanism must demonstrate ongoing retention, not just retention at the verification date.
- **C5 (AML replication gap):** This story closes the open internal audit finding. The internal audit sign-off (AC2) is the formal evidence of closure. This story cannot be completed before S1.2 delivers the reconciliation data.

#### Out of Scope

- Redesigning the replication mechanism (that is S1.2)
- Retention policy changes (the 5-year obligation is defined by statute; not subject to change)
- Changes to AML transaction screening or monitoring logic
- Customer or merchant notifications related to AML/CFT compliance

#### NFRs

- Retention verification must cover a minimum 30 continuous days of replication data (not a spot sample)
- The audit closure evidence package must be stored in a format accessible for 7 years (AML/CFT audit records retention)

---

## Epic E2: Failover Automation and Validation

**Epic ID:** E2
**Slicing strategy:** Risk-first — automated detection and execution before validation drill

---

### Story S2.1: Automated Failover Trigger and Execution

**Story ID:** S2.1
**Priority:** Critical (core DR capability — without this, RTO target is not achievable)
**Complexity:** 3 (high — failure detection logic, automated execution, and PCI DSS scope implications)
**Persona:** Payment operations engineers

#### User Story

As a **payment operations engineer**,
I want to **implement automated failure detection and failover initiation capability that brings the Hamilton secondary site to active payment authorisation processing status within 2 hours from the point of Auckland primary site failure detection**,
So that **the organisation meets the Board Risk Committee-approved RTO ≤ 2 hours DR policy and eliminates the manual, unstructured recovery procedures that failed to achieve RTO in the three documented outages**.

#### Acceptance Criteria

**AC1 — Automated failure detection**
Given the Auckland primary site is operating normally,
When a failure condition occurs (network failure, compute failure, or application health check failure),
Then an automated monitoring system detects the failure within 5 minutes of onset, logs the detection timestamp, and triggers the failover initiation sequence — no manual monitoring or human detection required to initiate the sequence.

**AC2 — Automated failover execution within RTO**
Given the failover initiation sequence has been triggered,
When the automated execution sequence runs without manual intervention,
Then:
- The Hamilton secondary site transitions from standby to active payment authorisation processing mode
- The transition completes within 90 minutes of failure detection (allowing 30-minute headroom against the 2-hour RTO)
- The execution log records each step with timestamp, outcome (success/failure), and elapsed time
- A runbook-linked alert notifies the operations team with current execution status and ETA

**AC3 — Transaction continuity on failover**
Given the failover sequence has completed and Hamilton is processing transactions,
When a payment authorisation request is submitted to the secondary site,
Then:
- The request is processed using the transaction state available on the Hamilton secondary (consistent with RPO ≤ 15 minutes — no transactions post-RPO window are assumed available)
- Duplicate authorisation requests (retried by merchant systems during outage) are handled idempotently — the same transaction ID does not produce duplicate authorisations
- No transactions that were committed on the Auckland primary within the RPO window are reprocessed as new transactions at Hamilton

**AC4 — Operator-initiated failover capability**
Given the automated failover sequence is configured,
When an operations team member triggers a manual failover (e.g., planned maintenance or partial Auckland degradation not meeting automatic trigger threshold),
Then:
- A manual trigger capability exists requiring two-person authorisation (prevent accidental trigger)
- The same execution sequence runs as for automated trigger
- The manual trigger is logged with the initiating operator identities and trigger timestamp
- The capability is accessible from the existing operations toolstack (no new tooling required)

#### Dependencies

- S1.1 complete (Hamilton site provisioned and ready to receive workload)
- S1.2 complete (replication operating at RPO ≤ 15 minutes — S2.1 depends on replication being confirmed before failover automation is built on top)

#### Architecture Constraints

- **C1 (RTO/RPO policy):** The failover sequence must complete within the 2-hour RTO from failure detection. The 90-minute execution target (AC2) provides headroom. If any automated step exceeds its expected execution time, an alert must escalate to human intervention immediately.
- **C2 (PCI DSS):** This story implements failover logic that modifies how cardholder data is accessed and transitioned across the Auckland–Hamilton CDE boundary during a failover event. The failover sequence — including the order of steps, access control transitions, and encryption key handling during site switch — falls within PCI DSS CDE scope and must be reviewed by the QSA before production go-live. **Step 4a gap-fill:** C2 was not initially included in this story's Architecture Constraints in the natural decomposition (the failover logic was framed as an operational capability, not a CDE scope change). Step 4a identified the gap: any modification to data access control flows within the CDE requires QSA assessment. This constraint is mandatory and non-deferrable.

#### Out of Scope

- Changes to fraud screening or AML transaction screening logic during failover
- Merchant and customer notification automation during failover events (deferred per discovery)
- Tertiary site failover capability
- Active-active configuration (deferred per discovery)

#### NFRs

- Failure detection must not require human action to initiate (fully automated detection and trigger)
- Two-person authorisation required for manual trigger (security control)
- Failover execution log must be retained for 7 years (PCI DSS audit trail requirement)
- No single point of failure in the failover detection mechanism itself (the monitoring system must be independent of the Auckland primary)

---

### Story S2.2: DR Drill Execution and RTO Validation

**Story ID:** S2.2
**Priority:** High (validation evidence required for board and QSA)
**Complexity:** 1 (well-understood procedure once S2.1 is implemented)
**Persona:** Payment operations engineers, Board Risk Committee

#### User Story

As a **payment operations engineer**,
I want to **execute at least two controlled DR drills using the automated failover capability, recording RTO measurement evidence**,
So that **the organisation can demonstrate to the Board Risk Committee and the Q3 QSA auditor that RTO ≤ 2 hours is achievable in practice, not just in theory**.

#### Acceptance Criteria

**AC1 — First DR drill executed (acceptance test)**
Given the automated failover capability is deployed to a staging environment equivalent to production,
When the first DR drill is executed with an observer from the internal audit or security and compliance team,
Then:
- Time from simulated failure detection to Hamilton processing payments (T_RTO) is recorded
- T_RTO ≤ 2 hours
- Any manual intervention required (steps not covered by automation) is logged as a drill finding
- The runbook is validated: operations team can execute the full procedure using only the documented runbook, without escalating outside the documented procedure
- A drill report is produced within 48 hours of completion

**AC2 — Drill findings resolved and second drill passes**
Given the first drill findings have been addressed (either resolved or risk-accepted),
When the second DR drill is executed (minimum 4 weeks after the first),
Then:
- T_RTO ≤ 2 hours with zero manual interventions not covered in the runbook
- No new drill findings are identified
- The Board Risk Committee receives a summary showing: drill date, T_RTO, observer identity, conclusion (PASS/FAIL)

**AC3 — QSA-ready evidence package**
Given both drills have passed,
When the security and compliance team assembles the Q3 QSA evidence package,
Then:
- The evidence package includes: both drill reports (signed by observer), the T_RTO measurements, the runbook version used in each drill
- The evidence package is in the format requested by the QSA firm for the Q3 audit submission
- A statement confirming no data integrity issues were observed during either drill is included

#### Dependencies

- S2.1 complete (automated failover capability implemented and tested in isolation)
- S3.1 in progress or complete (QSA engagement ensures evidence package format is confirmed before second drill)

#### Architecture Constraints

- DR drills must not use production transaction data — synthetic or anonymised transaction load only
- Drill environment must be isolated from live Auckland primary processing to prevent inadvertent transaction conflicts

#### Out of Scope

- Recovery from a real production outage (drills only — real incident response uses the runbook from S3.2)
- QSA assessment completion (that is S3.1)

#### NFRs

- Minimum 4-week gap between first and second drill (avoid recency bias in results)
- Both drill observers must be independent of the failover implementation team (audit independence)

---

## Epic E3: Compliance Gates and Operational Readiness

**Epic ID:** E3
**Slicing strategy:** Risk-first — QSA assessment (hard gate) before operational documentation

---

### Story S3.1: PCI DSS QSA Assessment Engagement and Clearance

**Story ID:** S3.1
**Priority:** Critical (hard gate — no production go-live until QSA assessment is complete)
**Complexity:** 2 (process uncertainty; QSA availability and scope are external dependencies)
**Persona:** Security and compliance team

#### User Story

As a **member of the security and compliance team**,
I want to **scope and complete the required PCI DSS architectural assessment with the existing QSA firm before the Q3 audit deadline**,
So that **the organisation can deploy the Hamilton secondary site changes to production with a cleared PCI DSS assessment, and the Q3 QSA audit does not encounter unassessed architectural changes to the cardholder data environment**.

#### Acceptance Criteria

**AC1 — QSA scoping conversation completed within 2 weeks of project approval**
Given the existing QSA relationship (preliminary conversations available within approximately 2 weeks),
When the security and compliance team initiates contact with the QSA firm,
Then within 2 weeks:
- A scoping call has been held with the QSA firm covering: Hamilton site CDE expansion scope, replication channel changes, and failover automation changes
- A preliminary scope document is agreed with the QSA firm listing: which PCI DSS requirements the assessment will cover, which systems and components are in scope, and the assessment timeline
- The assessment timeline confirms completion before the Q3 audit go-live deadline

**AC2 — QSA assessment completed with no unresolved HIGH findings**
Given implementation stories S1.1, S1.2, S2.1 are complete and Hamilton is ready for QSA assessment,
When the QSA firm conducts the architectural assessment,
Then:
- The QSA firm issues an assessment report covering all in-scope PCI DSS requirements
- Any HIGH-severity findings are remediated before go-live
- Any MEDIUM-severity findings have documented remediation plans accepted by the QSA firm
- The assessment report is provided to the Board Risk Committee before the production go-live authorisation

**AC3 — Q3 QSA audit evidence package accepted**
Given the QSA assessment is complete,
When the Q3 annual QSA audit reviews the Hamilton site changes,
Then:
- The assessor confirms the Hamilton site changes are within assessed PCI DSS scope
- No new findings related to the secondary site are raised during the Q3 audit that were not identified in the pre-go-live assessment
- The audit report notes the proactive pre-assessment as a positive control

#### Dependencies

- S1.1 complete (Hamilton provisioning documentation available for QSA scoping)
- S1.2 and S2.1 complete before formal assessment (QSA needs completed implementation to assess)

#### Architecture Constraints

- **C2 (PCI DSS):** This story IS the PCI DSS gate resolution. All implementation stories (S1.1, S1.2, S2.1) must document their CDE scope impact for QSA review. No production deployment of any CDE-impacting story without QSA clearance.

#### Out of Scope

- Remediating pre-existing PCI DSS findings unrelated to the Hamilton site changes
- Conducting the annual QSA audit (the annual audit is a separate engagement — this story scopes and completes a targeted architectural assessment for the Hamilton changes only)
- Changes to PCI DSS compliance programme beyond what is directly related to the secondary site

#### NFRs

- QSA engagement must begin within 2 weeks of project approval — schedule risk requires early initiation
- QSA firm selection is not in scope — the existing QSA relationship is used

---

### Story S3.2: Operational Runbook and Failover Procedure Documentation

**Story ID:** S3.2
**Priority:** High (required for DR drill — S2.2 depends on runbook being validated)
**Complexity:** 1 (documentation; well-understood once implementation is complete)
**Persona:** Payment operations engineers

#### User Story

As a **payment operations engineer**,
I want to **have a documented failover procedure runbook that the operations team can execute without undocumented workarounds or unplanned escalation**,
So that **any on-call operations engineer can execute a failover to the Hamilton secondary site within the 2-hour RTO window, regardless of who is on call at the time of an incident**.

#### Acceptance Criteria

**AC1 — Runbook complete and validated against implementation**
Given the automated failover capability (S2.1) is implemented,
When the runbook author (operations engineer) writes the procedure against the live implementation,
Then the runbook documents:
- Pre-conditions checklist: steps to confirm before initiating failover
- Automated failover trigger procedure: how to initiate automated failover, with expected outputs at each step
- Manual failover procedure (fallback): step-by-step procedure if automation fails mid-execution, with decision points, expected outputs, and escalation criteria
- Rollback procedure: how to restore Auckland primary as the active site after Hamilton is operational
- RTO checkpoint: a stage in the procedure where the operator must confirm progress against elapsed time — if behind pace, escalation is triggered

**AC2 — Runbook validated in DR drill**
Given the runbook is complete (AC1),
When an operations engineer who did not author the runbook executes a DR drill using only the runbook,
Then:
- The operator completes the drill without requesting assistance outside the runbook
- Any step requiring information not in the runbook is logged as a gap
- All identified gaps are resolved in the runbook before the second DR drill (S2.2)

**AC3 — Runbook accessible during incidents**
Given the runbook is finalised and validated,
When a production incident requires failover,
Then:
- The runbook is accessible from the operations team's incident management tooling (not stored only on a system that may be unavailable during an Auckland primary outage)
- A printed copy is available at the Auckland operations site (resilience against digital tooling unavailability)

#### Dependencies

- S2.1 complete (automated failover capability must be implemented before runbook can be validated)

#### Architecture Constraints

- Runbook must reference the 2-person authorisation requirement for manual trigger (C2 compliance control documented in S2.1)
- Runbook must note the PCI DSS audit trail requirement for failover execution logs

#### Out of Scope

- Merchant and customer communication templates during outages
- Runbooks for scenarios other than Auckland–Hamilton failover (tertiary site, non-DR escalations)

#### NFRs

- Runbook must be executable by any trained operations engineer — no dependency on tribal knowledge
- Runbook must be version-controlled with change history

---

## Benefit Coverage Matrix

| Metric | Stories that move it |
|--------|---------------------|
| RTO ≤ 2h (board policy compliance) | S2.1 (implements failover), S2.2 (validates RTO in drill), S3.2 (runbook enables consistent execution) |
| RPO ≤ 15min (board policy compliance) | S1.2 (implements replication at required cadence), S2.1 (failover starts from ≤15min stale state) |
| AML/CFT audit finding closed | S1.2 (provides reconciliation evidence), S1.3 (formally closes finding with audit sign-off) |
| PCI DSS QSA cleared before Q3 | S1.1 (CDE scoping documentation), S1.2 (replication channel CDE documentation), S2.1 (failover logic CDE documentation), S3.1 (QSA assessment completion) |
| Operational DR capability (drills passed) | S2.1 (capability), S2.2 (drill execution), S3.2 (runbook) |

✅ All 5 benefit metrics have at least one story.
✅ All 7 stories trace to at least one benefit metric.

---

## Scope Accumulator

**Discovery MVP scope items:** 6
**Stories written:** 7
**Scope ratio:** 7/6 = 1.17 — within acceptable range

**Coverage check:**
1. Secondary site provisioning → S1.1 ✅
2. Automated failover trigger and execution → S2.1 ✅
3. Replication to RPO ≤ 15 minutes → S1.2 ✅
4. AML/CFT replication verification and gap closure → S1.3 ✅
5. QSA assessment engagement → S3.1 ✅
6. Operational runbook and DR drill → S2.2 + S3.2 ✅ (split into 2 stories — drill execution and runbook are separate delivery artefacts)

**Scope note for S2.2 + S3.2 split:** The discovery scopes "Operational runbook and DR drill" as a single item. This decomposition separates them into two stories because the runbook (S3.2) is a documentation delivery with its own validation cycle, and the DR drill (S2.2) is an execution event that depends on the runbook being complete. Splitting makes each independently verifiable and avoids a single oversized story. No scope was added — both deliver what the discovery scoped.

✅ **Scope check passed** — 7 stories covering all 6 MVP items (one item split into two stories; scope note recorded).

---

## NFR Profile

**Performance targets:**
- Replication lag ≤ 15 minutes (RPO) under peak load (180,000 txn/day)
- Failover execution ≤ 90 minutes from detection (RTO target with headroom)
- Failure detection within 5 minutes of onset (detection window)

**Security requirements:**
- Replication traffic encrypted in transit (TLS 1.2 minimum)
- Two-person authorisation for manual failover trigger
- Failover execution logs retained 7 years (PCI DSS audit trail)
- No cardholder data in DR drill synthetic transaction load

**Data classification:** Restricted (payment card transaction records, cardholder data)
**Data residency:** Auckland primary + Hamilton secondary (NZ only — no offshore replication in scope)
**Availability SLA:** RTO ≤ 2h, RPO ≤ 15min (board-approved DR policy)
**Compliance frameworks:** PCI DSS v4.0 (QSA gate), AML/CFT Act 2009 NZ (statutory retention obligation)

---

## Definition Complete

**Epics:** 3
**Stories:** 7 (S1.1, S1.2, S1.3, S2.1, S2.2, S3.1, S3.2)
**Slicing strategy:** Risk-first
**Step 4a:** ✅ Complete — C2 gap-fill applied to S2.1 (1 gap identified and closed)
**Scope check:** ✅ 7 stories / 6 MVP items — scope note recorded for S2.2+S3.2 split
**NFR profile:** ✅ Documented above

---

## CPF-TRACE

**Stage:** definition
**Run:** config-A-run-2
**Model:** claude-sonnet-4-6
**Date:** 2026-05-16

| Constraint | Present in output? | Location | Notes |
|-----------|-------------------|----------|-------|
| C1 (RTO/RPO policy) | ✅ Yes | S1.2 AC1-2, S2.1 AC1-2, S2.2 AC1-2 Architecture Constraints; NFR profile | Natural — included without Step 4a intervention |
| C2 (PCI DSS QSA) | ✅ Yes | S1.1 Architecture Constraints (natural); S1.2 Architecture Constraints (natural); S2.1 Architecture Constraints (**Step 4a gap-fill**); S3.1 Architecture Constraints (natural) | **Partial natural propagation.** S1.1 and S1.2 included C2 naturally. S2.1 required Step 4a gap-fill — failover logic was not initially framed as a CDE scope change. Step 4a caught and fixed. |
| C3 (AML/CFT retention) | ✅ Yes | S1.2 Architecture Constraints (natural); S1.3 Architecture Constraints (natural) | Natural — included without Step 4a intervention |
| C4 (single Auckland DC baseline) | ✅ Yes | S1.1 context (no secondary site), discovery problem statement referenced | Natural — contextual reference |
| C5 (AML replication gap) | ✅ Yes | S1.2 Architecture Constraints (natural); S1.3 Architecture Constraints (natural) | Natural — included without Step 4a intervention |

**CPF score (definition stage):**
- C1: 1.0 (present in all relevant stories)
- C2: 1.0 (present after Step 4a gap-fill — 1 gap in S2.1 identified and closed)
- C3: 1.0 (present in all triggering stories)
- C4: 1.0 (contextual reference maintained)
- C5: 1.0 (present in all triggering stories)

**Stage CPF:** 5/5 = **1.00**
**Regulated CPF (C2, C3, C5):** 3/3 = **1.00**

**Step 4a finding — Config A vs Config C comparison note:**
Sonnet 4.6 propagated C2 naturally to S1.1 and S1.2 (CDE provisioning and replication stories) but missed S2.1 (failover automation). Step 4a identified the S2.1 gap and applied the fix. This contrasts with Config C run 2 (Haiku without Step 4a) where C2 was absent from both S1.2 and S2.2 (a wider gap). Step 4a required only 1 gap-fill for Sonnet vs 2+ gap-fills for Haiku. Both reach CPF 1.00 with Step 4a active.
