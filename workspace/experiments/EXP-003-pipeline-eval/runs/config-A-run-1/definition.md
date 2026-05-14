# Definition: Payment Authorisation Service — DR Failover

**Feature:** 2026-05-14-payment-auth-dr-failover
**Discovery status:** Approved (eval-mode)
**Benefit-metric:** NOT PRESENT — skipped for EXP-003 CPF measurement (experimental simplification)
**Model:** claude-sonnet-4-6 (Config A)
**Date:** 2026-05-14

---

## Step 0 — Entry condition check (eval-mode)

- Discovery artefact: ✅ present (`runs/config-A-run-1/discovery.md`, status: Approved)
- Benefit-metric artefact: ⚠️ NOT PRESENT — experimental simplification for EXP-003 CPF measurement. Stories will reference the observability targets from the discovery artefact in lieu of a formal benefit-metric artefact.
- Reference materials: none found

**Architecture constraints scan:**
`architecture-guardrails.md` found in `.github/` — review shows it governs the skills platform repository conventions, not the payment authorisation service. No directly applicable constraints for this feature. Proceeding without platform-specific guardrail annotations in stories.

**Slicing strategy:** Risk-first (Strategy 4) — highest regulatory and technical risks first. The PCI DSS QSA dependency (C2) and the AML replication gap (C5) are the constraints most likely to expand scope or block go-live. De-risking these first validates the compliance envelope before investing in operational procedures.

---

## Epic Structure

**Epic 1: DR Infrastructure Foundation** — 3 stories — establishes secondary site capability and validates data replication meeting RPO

**Epic 2: Failover Procedures and Drills** — 2 stories — defines and validates the manual failover process, demonstrating RTO compliance

**Epic 3: Regulatory Compliance Confirmation** — 2 stories — QSA DR assessment (PCI DSS) and AML transaction record replication audit

Total: 7 stories covering all 5 MVP scope items from the discovery artefact.

---

## Epic 1: DR Infrastructure Foundation

### Story 1.1 — Secondary Site Capacity Validation

**As a** payment operations engineer,
**I want** the Hamilton co-location facility validated as capable of supporting 100% of production transaction volume,
**So that** I can confirm the secondary site is a viable DR target before infrastructure investment.

**Out of scope:** Configuring active processing workloads at the secondary site (that is Story 1.2). Network routing changes (Story 2.1). QSA assessment (Epic 3).

**Acceptance Criteria:**

AC1: Given the Hamilton facility network and hardware inventory, when a capacity assessment is performed against the production transaction throughput baseline (180,000 transactions/day, peak throughput TBD from operations team), then a written capacity assessment report confirms or denies that available compute, memory, and network bandwidth is sufficient for 100% failover volume.

AC2: Given the capacity assessment report, when the findings are reviewed, then any identified gaps (compute, memory, network) are recorded in a remediation backlog with estimated effort, and a go/no-go recommendation is produced for the DR project.

AC3: Given the capacity assessment report is approved by the operations lead, when the DR project proceeds, then the secondary site infrastructure provisioning (Story 1.2) uses the assessed capacity as its baseline specification.

**Architecture Constraints:**
- C1 (RTO/RPO): The secondary site must be physically capable of supporting the service under the 2-hour RTO window — capacity gaps found here may extend the RTO beyond the Board-approved target.
- C4 (Single data centre): This story addresses the C4 constraint — the move from single Auckland DC to dual-site.

**NFR:**
- Security: The Hamilton facility must operate within PCI DSS cardholder data environment (CDE) scope if any payment card data is processed there — preliminary PCI DSS scoping (C2) should be initiated in parallel with capacity validation.
- Data classification: Confidential (capacity and infrastructure detail).

---

### Story 1.2 — Secondary Site Provisioning for Active Payment Processing

**As a** payment operations engineer,
**I want** the Hamilton secondary site configured to host the payment authorisation service in active-passive mode,
**So that** the secondary site is ready to accept traffic during a failover without requiring ad-hoc configuration.

**Out of scope:** Active traffic routing to the secondary site (that is the failover procedure — Story 2.1). PCI DSS QSA assessment of the provisioned environment (Story 3.1). Provisioning any service other than the payment authorisation service.

**Acceptance Criteria:**

AC1: Given the secondary site provisioning specification (from Story 1.1 capacity assessment), when the environment is provisioned, then the payment authorisation service stack can be started at the secondary site from a documented runbook within 30 minutes of initiating the procedure.

AC2: Given the secondary site environment, when a test transaction is processed in isolation from the primary site, then the transaction is authorised, recorded, and the result is returned within the authorisation service's normal response time SLA.

AC3: Given the provisioned secondary environment, when a PCI DSS preliminary scoping exercise is conducted, then the secondary site is confirmed to be within CDE scope and the QSA engagement brief (Story 3.1) references this environment.

**Architecture Constraints:**
- C1 (RTO/RPO): The provisioning runbook must support completing the secondary site startup within the 2-hour RTO window. Runbook must be tested as part of Story 2.2 failover drills.
- C2 (PCI DSS): The secondary site environment must be within PCI DSS CDE scope. Any cardholder data stored or processed at the secondary site requires QSA assessment (Story 3.1) before go-live.
- C4 (Single data centre → dual site): This story eliminates the C4 constraint.

**NFR:**
- Availability: The secondary site environment must be configured to maintain standby readiness (configuration current, dependencies available) without requiring manual intervention between drill cycles.
- Security (C2 — PCI DSS): All cardholder data environment controls (network segmentation, encryption at rest and in transit, access logging) must be applied to the secondary site at the same standard as the primary site. This is a prerequisite for QSA assessment.
- Data residency: Both primary (Auckland) and secondary (Hamilton) sites are within New Zealand. Data residency requirements are met.

---

### Story 1.3 — Transaction Data Replication to RPO Target

**As a** payment operations engineer,
**I want** a continuous replication mechanism that keeps the secondary site within 15 minutes of the primary at all times,
**So that** if a failover occurs, no more than 15 minutes of transactions are unrecoverable (Board-approved RPO).

**Out of scope:** AML record completeness verification (that is Story 3.2 — separate audit requirement). Replication for services other than the payment authorisation service. Active-active synchronous replication (the MVP is asynchronous with an RPO target).

**Acceptance Criteria:**

AC1: Given the replication mechanism is running, when the replication lag is sampled at 1-minute intervals over a 4-hour test window, then the maximum observed lag does not exceed 15 minutes in any sample, and the 95th percentile lag does not exceed 10 minutes.

AC2: Given a simulated primary site outage at a known timestamp T, when the secondary site is examined at T+30s, then transaction records at the secondary are complete up to timestamp T-15min or better.

AC3: Given the replication mechanism is running, when the operations team queries the replication status dashboard, then the current lag in minutes is visible in real time, with an alert triggered if lag exceeds 10 minutes.

**Architecture Constraints:**
- C1 (RPO): Replication must sustain ≤ 15-minute lag to meet the Board-approved RPO. Any replication design that cannot guarantee this under normal load violates C1.
- C3 (AML/CFT Act): Transaction records subject to the 5-year AML/CFT retention requirement must be included in this replication stream. The replication mechanism must not exclude any record type that falls within the AML/CFT scope.
- C5 (AML gap — unverified): The current replication process has an unverified gap regarding whether all AML-scope records replicate within the statutory retention window. This story must ensure that AML-scope records are explicitly included in the replication design. Story 3.2 will audit completeness against the full 5-year window.

**NFR:**
- Performance: Replication must sustain the target lag under peak transaction load (180,000 transactions/day).
- Reliability (C1 — RPO): Replication failure must trigger an alert and be investigated within 15 minutes of detection. A prolonged replication failure invalidates the RPO guarantee.
- Security (C2 — PCI DSS): Transaction data replicated to the secondary site is cardholder data in scope for PCI DSS. Replication channel must be encrypted in transit. Secondary site storage must be encrypted at rest. Both requirements are within QSA assessment scope (Story 3.1).
- Data classification: Restricted (payment card transaction data — PCI DSS CDE).
- Compliance (C3 — AML/CFT Act): All transaction records within AML/CFT scope must be included in the replication stream. Exclusion of any AML-scope record type is a statutory compliance failure.

---

## Epic 2: Failover Procedures and Drills

### Story 2.1 — Manual Failover Runbook

**As a** payment operations engineer,
**I want** a documented, step-by-step manual failover procedure that any on-call engineer can execute,
**So that** the team can switch payment processing to the secondary site within the 2-hour RTO window without requiring specialist knowledge.

**Out of scope:** Automated failover (out of scope for the MVP). Failback from secondary to primary (a follow-on story post-MVP). Network routing automation. Notification workflows for merchants or customers during failover.

**Acceptance Criteria:**

AC1: Given an on-call engineer with standard access credentials and the published runbook, when they follow the runbook step-by-step from "declare outage" to "payment processing confirmed at secondary", then each step is unambiguous — no step requires knowledge not provided in the runbook itself.

AC2: Given the runbook, when a subject-matter-expert reviews it, then every dependency (credentials location, runbook access method, secondary site login procedure, health check URL) is documented with a fallback in case the primary source is unavailable during an outage.

AC3: Given a declared primary site outage, when the on-call engineer executes the runbook, then the estimated completion time (sum of step durations) does not exceed 90 minutes, leaving 30 minutes contingency within the 2-hour RTO.

**Architecture Constraints:**
- C1 (RTO): The runbook is the mechanism for achieving RTO ≤ 2 hours. Any runbook step that cannot be completed within the RTO window violates C1. Total estimated runbook duration must be ≤ 90 minutes (with 30-minute contingency).
- C2 (PCI DSS): Failover access to the secondary CDE must follow PCI DSS access control requirements — no credentials stored in plaintext in the runbook, access via approved mechanisms only. This requirement must be confirmed in the QSA assessment (Story 3.1).

**NFR:**
- Availability: The runbook must be accessible when the primary data centre is unavailable — it must not be hosted only on primary-site systems.
- Security (C2 — PCI DSS): Credential management in the runbook must comply with PCI DSS access control requirements.

---

### Story 2.2 — Failover Drill Testing and RTO Validation

**As a** payment operations engineer,
**I want** to conduct two timed failover drills before go-live and confirm that RTO ≤ 2 hours is achieved,
**So that** the Board Risk Committee has evidence that the service meets its approved DR policy targets.

**Out of scope:** Full production traffic cutover (drills use test data / controlled conditions). Merchant communication during drills. Automated failover detection.

**Acceptance Criteria:**

AC1: Given the failover runbook (Story 2.1) and the provisioned secondary site (Story 1.2), when Drill 1 is conducted with a timed start and end, then the full failover process — from outage declaration to payment authorisation confirmed operational at the secondary site — completes within 120 minutes (RTO ≤ 2 hours).

AC2: Given the results of Drill 1, when any steps that exceeded their estimated duration are identified, then the runbook is updated to reflect actual timings and any corrective actions before Drill 2 is conducted.

AC3: Given the failover runbook (updated after Drill 1), when Drill 2 is conducted, then the process completes within 120 minutes, and a written drill report is produced confirming RTO compliance for both drills.

AC4: Given the drill reports for Drill 1 and Drill 2, when the Board Risk Committee receives the DR compliance evidence package, then the evidence package includes the drill timestamps, the measured completion time for each drill, and a sign-off from the operations lead confirming RTO ≤ 2 hours was achieved.

**Architecture Constraints:**
- C1 (RTO/RPO): This story is the primary validation mechanism for C1. Both drills must confirm RTO ≤ 2 hours. RPO compliance (data recovered within 15 minutes) must also be confirmed during each drill via the transaction reconciliation procedure from Story 1.3.
- C2 (PCI DSS): Drill conditions must not compromise the CDE boundary — no production cardholder data is used in test conditions unless specifically approved by the QSA.

**NFR:**
- Audit trail: Drill reports must be retained as compliance evidence — date, start/end timestamps, outcome, sign-off.
- Compliance (C1 — Board policy): Drill evidence is the primary artefact for demonstrating Board DR policy compliance. Both drills must produce written, signed-off reports.

---

## Epic 3: Regulatory Compliance Confirmation

### Story 3.1 — PCI DSS QSA DR Environment Assessment

**As a** security and compliance team member,
**I want** the payment card DR environment at the secondary site assessed by our QSA before go-live,
**So that** architectural changes to the payment authorisation service remain PCI DSS compliant as required by our annual QSA audit.

**Out of scope:** Full PCI DSS assessment of the primary site (that is the annual QSA audit in Q3 — out of scope for this story). Remediation of PCI DSS findings at the primary site. PCI DSS assessment for any service other than the payment authorisation DR environment.

**Acceptance Criteria:**

AC1: Given the DR environment architecture documentation (from Stories 1.1, 1.2, and 1.3), when the QSA scope brief is submitted, then the QSA engagement is confirmed with a scheduled assessment date that falls before the go-live target.

AC2: Given the QSA assessment is completed, when findings are reviewed, then any Critical or High findings are remediated before go-live, and any Medium findings have a documented remediation plan with owner and target date.

AC3: Given all Critical and High QSA findings are remediated, when the QSA issues a written confirmation that the DR environment is assessed within PCI DSS requirements, then that letter is filed in the compliance record and referenced in the DR go-live approval.

**Architecture Constraints:**
- C2 (PCI DSS — regulated): This story directly satisfies the PCI DSS QSA assessment requirement. No production failover may be conducted until the QSA sign-off letter (AC3) is obtained. This is a hard go-live gate.

**NFR:**
- Compliance (C2 — PCI DSS — regulated): QSA assessment is a statutory obligation. The assessment must be completed and all Critical/High findings remediated before go-live. Any deviation requires explicit risk acceptance from the CISO.
- Timeline: QSA assessment must be scheduled and completed before Q3 annual audit. Lead time for QSA engagement initiation: 2 weeks from project approval.
- Security: All cardholder data environment (CDE) controls at the secondary site — network segmentation, encryption in transit and at rest, access logging, vulnerability management — must meet PCI DSS requirements and be within QSA assessment scope.

---

### Story 3.2 — AML/CFT Transaction Record Replication Audit

**As a** compliance team member,
**I want** an independent audit confirming that all AML/CFT-scope transaction records replicate to the secondary site within the 5-year statutory retention window,
**So that** the organisation closes the internal audit gap and demonstrates compliance with the Anti-Money Laundering and Countering Financing of Terrorism Act.

**Out of scope:** Remediation of records already missing from the secondary site that pre-date this project (a separate remediation workstream if gaps are found in historical records). AML compliance monitoring of ongoing transactions post-go-live (a BAU function). Retention compliance for services other than the payment authorisation service.

**Acceptance Criteria:**

AC1: Given the replication mechanism in place (Story 1.3), when a transaction record replication audit is conducted comparing primary and secondary site transaction record sets, then the audit covers: record count by date range, coverage of the full 5-year retention window, and spot-check reconciliation of AML-scope record fields (transaction ID, amount, parties, timestamp).

AC2: Given the audit is completed, when findings are reviewed, then any gap in replication coverage is quantified (records missing, date ranges affected) and a remediation plan with owner and target date is produced before go-live.

AC3: Given all replication gaps identified in the audit are remediated, when the audit is re-run or the auditor confirms remediation, then a written audit confirmation is produced stating that AML/CFT-scope transaction records replicate to the secondary site with full coverage across the 5-year retention window.

AC4: Given the audit confirmation (AC3), when the compliance team files the report, then the internal audit finding ("replication to secondary site within statutory retention window is unverified") is formally closed in the audit register, with the audit confirmation as the closing evidence.

**Architecture Constraints:**
- C3 (AML/CFT Act — regulated): 5-year transaction record retention is a statutory requirement. Records must be verifiably present at the secondary site. This story directly satisfies the statutory obligation. Any gap found in AC2 that is not remediated before go-live constitutes a statutory compliance risk.
- C5 (AML replication gap — unverified): This story directly addresses the internal audit gap flagged in the problem statement. The audit in AC1 is the mechanism for verifying or refuting the gap. If a gap is confirmed in AC2, remediation must be completed and confirmed (AC3) before go-live.

**NFR:**
- Compliance (C3 — AML/CFT Act — regulated): AML/CFT Act retention requirement is statutory. Any unresolved replication gap at go-live is a regulatory compliance failure.
- Audit trail: The audit report (AC3) and the closure of the internal audit finding (AC4) must be retained permanently as compliance records.
- Data classification: Restricted (transaction records subject to AML/CFT Act — 5-year retention).

---

## Scope Accumulator

**Discovery MVP scope items:** 5
1. Active-passive secondary site capability at Hamilton ✅ → Stories 1.1, 1.2
2. Replication to secondary site within RPO ✅ → Story 1.3
3. Manual failover procedure ✅ → Story 2.1
4. RTO-tested failover drills ✅ → Story 2.2
5. AML/CFT replication completeness confirmation ✅ → Story 3.2

**QSA assessment** appears as Story 3.1 — this was explicitly named in the discovery constraints (C2) but not as a separate MVP scope item. However, it is required before go-live (hard gate). Surfaced as a scope note: **⚠️ SCOPE NOTE: Story 3.1 was not explicitly listed as a discovery MVP scope item but is a hard regulatory gate (C2 — PCI DSS). It is necessary for go-live. Treating as required scope.**

**Stories written:** 7
**MVP items covered:** 5 of 5
**Scope additions (approved via scope note):** 1 (Story 3.1 — QSA assessment, required by C2)
**Scope ratio:** 7/5 = 1.4x — within normal range given the regulatory complexity

✅ **Scope check:** All 5 MVP items covered. 1 scope addition (Story 3.1) is justified by the C2 constraint stated in the discovery artefact.

---

## NFR Profile

**Feature:** 2026-05-14-payment-auth-dr-failover

| Category | Requirement |
|----------|------------|
| Performance | Replication lag ≤ 15 min at peak load (180,000 tx/day). Secondary site sustains 100% transaction volume in failover. |
| Availability | Board-approved RTO ≤ 2 hours; RPO ≤ 15 minutes (C1). Demonstrated in 2 pre-go-live drills. |
| Security | PCI DSS CDE controls at secondary site: network segmentation, encryption at rest/in transit, access logging (C2). |
| Data classification | Restricted — payment card transaction data (PCI DSS CDE scope). |
| Data residency | Auckland (primary) and Hamilton (secondary) — both within New Zealand. |
| Compliance frameworks | PCI DSS (C2 — QSA assessment required before go-live). AML/CFT Act (C3 — 5-year retention, secondary site replication verified). |
| Audit | Drill reports, QSA sign-off, and AML replication audit report retained as compliance records. |

**NFRs with named regulatory clauses requiring human sign-off before DoR:**
- C2 — PCI DSS (regulated): QSA assessment mandatory before go-live
- C3 — AML/CFT Act (regulated): 5-year record replication mandatory

<!-- eval-mode: true -->
