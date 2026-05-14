# Definition: Payment Authorisation Service — DR Failover

**Feature:** 2026-05-14-payment-auth-dr-failover
**Discovery status:** Approved (eval-mode)
**Benefit-metric:** NOT PRESENT — skipped for EXP-003 CPF measurement (experimental simplification). Stories reference the discovery artefact's Directional Success Indicators (RTO drills, RPO drills, PCI DSS DR assessment, AML/CFT replication completeness, unrecovered outage minutes) in lieu of a formal benefit-metric artefact.
**Model:** claude-opus-4-7 (Config B)
**Date:** 2026-05-14

---

## Step 0 — Entry condition check (eval-mode)

- Discovery artefact: ✅ present at `runs/config-B-run-1/discovery.md`, status: Approved (eval-mode)
- Benefit-metric artefact: ⚠️ NOT PRESENT — experimental simplification (see header note)
- Reference materials: none found at `artefacts/2026-05-14-payment-auth-dr-failover/reference/`

**Discovery constraint inventory carried forward (verbatim references — must propagate to story Architecture Constraints / NFR / Out-of-scope without paraphrase loss):**

- **C1** — Recovery Time Objective ≤ 2 hours, Recovery Point Objective ≤ 15 minutes (Board Risk Committee disaster recovery policy)
- **C2** — PCI DSS — any architectural change to the payment authorisation environment must be assessed by the Qualified Security Assessor (QSA) before go-live (Q3 audit)
- **C3** — AML/CFT Act — 5-year transaction record retention; replicated copies at the secondary site must satisfy the same retention obligation
- **C4** — Single primary data centre (Auckland); Hamilton co-location facility has rack space and fibre but is not active
- **C5** — Open internal audit finding: secondary-site replication completeness within the 5-year statutory retention window is unverified
- **C6** — 100% transaction volume at the secondary site on failover (no partial routing)

**Architecture constraints scan:** `.github/architecture-guardrails.md` was read. It governs the skills-platform repository conventions (SKILL.md authoring, capture-block patterns, etc.) and contains nothing directly applicable to a payment authorisation DR build. No platform-specific guardrail annotations are added to stories. The compliance-bearing constraints for this feature are the discovery constraints C1–C6 above; these are propagated explicitly in each story's Architecture Constraints and NFR sections.

**Slicing strategy:** **Risk-first (Strategy 4).** The PCI DSS QSA assessment lead time (C2) and the AML replication completeness gap (C5) are the two items most likely to expand scope, slip the Q3 audit window, or block go-live. Sequencing the QSA scoping conversation and the AML audit early — alongside the technical infrastructure work, not after it — is the only way to keep the Q3 deadline credible. Risk-first also matches the discovery framing: this is a resilience and compliance problem, not a product feature.

---

## Epic Structure

**Epic 1 — Secondary Site Foundation and Replication.** 3 stories. Establishes Hamilton as a viable active-passive site sized for full transaction volume (C4, C6) and proves continuous replication meets the 15-minute RPO (C1). Includes the AML-scope inclusion guarantee in the replication design (C3, C5).

**Epic 2 — Manual Failover Procedure and Drill Validation.** 2 stories. Documents the manual failover runbook and validates the 2-hour RTO (C1) on two timed pre-go-live drills, producing the Board evidence package.

**Epic 3 — Regulatory Assessment and Audit Closure.** 2 stories. Engages the QSA to assess the DR environment under PCI DSS (C2) before Q3, and runs the independent AML/CFT replication completeness audit that closes the open internal audit finding (C3, C5).

**Total:** 7 stories covering the 5 discovery MVP scope items. Two C2/C3-related stories (3.1, 3.2) and the C5 audit-closure work are sequenced to start in parallel with Epic 1 — they have long external lead times.

---

## Epic 1: Secondary Site Foundation and Replication

### Story 1.1 — Hamilton Capacity Validation for 100% Transaction Volume

**As a** payment operations engineer,
**I want** the Hamilton co-location facility validated as capable of supporting 100% of production payment authorisation transaction volume,
**So that** the team can confirm Hamilton is a viable active-passive secondary site before infrastructure investment, rather than discovering capacity shortfalls at the first failover drill.

**Out of scope:** Configuring active processing workloads at Hamilton (Story 1.2). Replication design and lag tuning (Story 1.3). PCI DSS CDE assessment of Hamilton (Story 3.1). Capacity validation for any service other than the payment authorisation service.

**Acceptance Criteria:**

- **AC1:** Given the Hamilton facility's compute, memory, storage, and network inventory (including the existing fibre to Auckland), when a capacity assessment is performed against the production payment authorisation workload (180,000 transactions/day with peak intra-day throughput measured from 90 days of primary-site telemetry), then a written capacity assessment report concludes pass / pass-with-remediation / fail for processing 100% of transaction volume at the secondary site (C6).
- **AC2:** Given the capacity assessment report, when any compute, memory, storage, or network shortfalls are identified, then each shortfall is recorded in a remediation backlog with owner, estimated effort, lead time, and a flag for whether remediation must be completed before the Story 1.2 provisioning starts.
- **AC3:** Given the capacity assessment report is approved by the operations lead, when the DR project proceeds, then Story 1.2 provisioning uses the assessed capacity (with any pass-with-remediation items completed) as its baseline specification, and the assessment is filed as evidence for the QSA scope brief (Story 3.1).

**Architecture Constraints:**
- **C4 (single data centre → dual site):** This story is the first step in eliminating C4. A "fail" outcome on AC1 invalidates the Hamilton-as-secondary-site assumption from the discovery and triggers a discovery revisit.
- **C6 (100% transaction volume at secondary, no partial routing):** Capacity must be validated against the full peak transaction volume — partial routing is not available, so under-provisioning at the secondary site directly translates to failed authorisations during a real failover.
- **C1 (RTO ≤ 2 hours):** Capacity gaps that require new hardware procurement could push the project past the Q3 QSA audit window, indirectly threatening C1 compliance evidence. Lead times on remediation must be quantified in AC2.

**NFR:**
- **Performance (C6):** Capacity assessment must use peak throughput from 90 days of primary-site telemetry, not daily averages.
- **Data classification:** Confidential (capacity, infrastructure topology, throughput data).
- **Compliance (C2 — PCI DSS):** The capacity assessment must record whether any cardholder data is processed during the assessment activity. If yes, the assessment activity itself is in PCI DSS CDE scope and must be conducted under the existing CDE controls.

---

### Story 1.2 — Hamilton Provisioning for Active-Passive Payment Authorisation

**As a** payment operations engineer,
**I want** the Hamilton secondary site provisioned and configured to host the payment authorisation service in active-passive standby mode,
**So that** the secondary site is start-ready for failover without requiring ad-hoc configuration during an outage.

**Out of scope:** Active traffic routing to Hamilton (Story 2.1, runbook). PCI DSS QSA assessment of the provisioned environment (Story 3.1). Provisioning any service at Hamilton other than the payment authorisation service. Failback from Hamilton to Auckland (post-MVP).

**Acceptance Criteria:**

- **AC1:** Given the validated Hamilton infrastructure (Story 1.1), when the payment authorisation service stack is installed and configured at Hamilton from a documented provisioning runbook, then a single test transaction can be processed end-to-end at Hamilton in isolation from the primary site, and the authorisation result and audit log entry both match the primary-site format and content.
- **AC2:** Given the provisioned Hamilton stack, when standby readiness is verified, then the stack can be brought from cold standby to receiving-traffic state in ≤ 30 minutes by following the documented procedure, with no step requiring out-of-band knowledge or vendor support.
- **AC3:** Given the provisioned environment, when a PCI DSS preliminary scoping exercise is performed, then the Hamilton environment is confirmed to be within Cardholder Data Environment (CDE) scope, and the PCI DSS controls applied at Hamilton (network segmentation, encryption at rest, encryption in transit, access logging, vulnerability management) are documented for the QSA scope brief in Story 3.1.
- **AC4:** Given the configured Hamilton environment, when standby state is examined, then the configuration is consistent with the primary-site golden image, with any deliberate divergence (e.g. site-specific networking, secondary credentials) explicitly listed and justified in a configuration-divergence register.

**Architecture Constraints:**
- **C4 (single data centre → dual site):** This story operationally eliminates C4 once Story 1.3 replication is in place — Hamilton becomes a usable active-passive secondary.
- **C2 (PCI DSS — QSA assessment required before go-live):** The provisioned environment must be in CDE scope and meet PCI DSS controls at the same standard as the primary. AC3 and AC4 produce the documentation pack the QSA needs (Story 3.1). No production failover is permitted until the QSA letter is in hand.
- **C1 (RTO ≤ 2 hours):** The 30-minute cold-to-receiving target in AC2 leaves headroom for replication catch-up and traffic switch within the 2-hour RTO budget.
- **C6 (100% transaction volume at secondary):** Provisioned capacity must match the validated specification from Story 1.1 — no scaling-down "for cost" without re-validating against peak volume.

**NFR:**
- **Security (C2 — PCI DSS):** Hamilton must implement the PCI DSS CDE control set at primary-site equivalence: network segmentation isolating the CDE, encryption at rest, encryption in transit, role-based access, access logging retained for QSA review, vulnerability scanning. Any control gap is a hard go-live blocker.
- **Availability:** Standby readiness must be maintainable without operator intervention between drill cycles — configuration drift must be detected and alerted.
- **Data residency:** Both Auckland (primary) and Hamilton (secondary) are within New Zealand. Data residency requirements are met.
- **Data classification:** Restricted (PCI DSS CDE).

---

### Story 1.3 — Continuous Replication to Hamilton at RPO ≤ 15 Minutes (with AML-Scope Inclusion Guarantee)

**As a** payment operations engineer,
**I want** continuous replication from Auckland to Hamilton that holds replication lag at ≤ 15 minutes under normal load and explicitly includes every AML/CFT-scope record type,
**So that** in a failover no more than 15 minutes of transaction data is unrecoverable (Board-approved RPO, C1) and AML/CFT-scope records are present at Hamilton to satisfy the 5-year retention obligation (C3) and the open internal audit finding (C5).

**Out of scope:** Independent audit of historical 5-year replication completeness at Hamilton — that audit is Story 3.2 and runs against this story's output. Active-active synchronous replication (the MVP is asynchronous with an RPO target). Replication for services other than the payment authorisation service. Backfilling records that pre-date this project.

**Acceptance Criteria:**

- **AC1:** Given the replication mechanism is running under representative production load, when replication lag is sampled at 1-minute intervals across a continuous 4-hour observation window, then the maximum observed lag does not exceed 15 minutes in any sample and the 95th-percentile lag does not exceed 10 minutes (C1 — RPO).
- **AC2:** Given a simulated primary-site outage at a known timestamp T (in a non-production drill harness), when the secondary site state is examined within 30 seconds of T, then transaction records at Hamilton are complete up to at least timestamp T − 15 minutes — verified by record-count and last-committed-timestamp reconciliation.
- **AC3:** Given the replication design, when the design is reviewed against the AML/CFT record-type inventory maintained by the compliance team, then every AML/CFT-scope record type is explicitly listed as included in the replication stream, with a written sign-off from the compliance lead that no AML/CFT-scope record type is excluded by design (C3, C5).
- **AC4:** Given replication is running, when the operations team views the replication-status dashboard, then current lag (in minutes), 95th-percentile lag over the last hour, and per-record-type replication health are visible in real time, with a paging alert when lag exceeds 10 minutes for more than 2 consecutive minutes.
- **AC5:** Given a replication outage, when the outage is detected, then a paging alert is raised within 60 seconds, and an incident ticket is created automatically that flags the RPO-at-risk status to the on-call payment operations engineer.

**Architecture Constraints:**
- **C1 (RPO ≤ 15 minutes):** This story is the primary mechanism for satisfying the RPO half of the Board policy. A replication design that cannot guarantee ≤ 15-minute lag under normal load violates C1 and must be redesigned, not waived.
- **C3 (AML/CFT Act 5-year retention — replication to secondary):** Every AML/CFT-scope record type must be in the replication stream. Per-record-type inclusion is a sign-off gate (AC3), not an after-the-fact reconciliation.
- **C5 (open internal audit finding on AML replication completeness):** This story does not by itself close the audit finding (closure is Story 3.2's audit). It does establish the by-design guarantee that the replication stream includes all AML-scope record types — without which Story 3.2's audit cannot pass.
- **C2 (PCI DSS):** Replication of cardholder data is in PCI DSS CDE scope. Channel encryption in transit and storage encryption at rest at the secondary site are mandatory and assessed in Story 3.1.
- **C6 (100% transaction volume at secondary):** Replication must sustain ≤ 15-minute lag under peak transaction load (180,000 transactions/day), not just average load.

**NFR:**
- **Performance (C1, C6):** Replication must sustain the lag target under peak load. Performance verification at peak is a release gate.
- **Reliability (C1):** Replication-mechanism failure must trigger paging within 60 seconds. Sustained failure must be treated as an RPO-at-risk incident, not a routine maintenance event.
- **Security (C2 — PCI DSS):** Replication channel encrypted in transit (TLS 1.2+ or IPsec equivalent); replicated data encrypted at rest at Hamilton; key management aligned with PCI DSS Requirement 3 controls. All within QSA scope (Story 3.1).
- **Compliance (C3 — AML/CFT Act):** Exclusion of any AML/CFT-scope record type from the replication stream is a statutory compliance defect, not a feature gap. The compliance-lead sign-off (AC3) is the control.
- **Data classification:** Restricted (PCI DSS CDE + AML/CFT-scope transaction records).
- **Observability:** Per-record-type replication health visible on the operations dashboard (AC4).

---

## Epic 2: Manual Failover Procedure and Drill Validation

### Story 2.1 — Manual Failover Runbook Authored and Reviewed

**As a** payment operations engineer,
**I want** a documented step-by-step manual failover runbook that any on-call engineer can execute,
**So that** the team can switch payment authorisation to Hamilton within the 2-hour RTO without requiring specialist knowledge or vendor support during the outage.

**Out of scope:** Automated failover detection and switch (post-MVP, deferred per discovery Out of Scope item 1). Failback from Hamilton to Auckland (post-MVP). Merchant or cardholder notification workflows during failover (deferred per discovery Out of Scope item 5). Network routing automation.

**Acceptance Criteria:**

- **AC1:** Given an on-call payment operations engineer with standard credentials and the published runbook, when they perform a runbook walk-through (no real failover triggered), then every step is unambiguous — no step requires knowledge not provided in the runbook itself, and no step requires access not pre-provisioned to the on-call role.
- **AC2:** Given the runbook, when an SME review is conducted, then every operational dependency — credentials location, runbook hosting location, secondary-site login procedure, replication health check, transaction-recovery confirmation procedure — is documented with a fallback path that does not depend on primary-site availability (the runbook itself must not be stored only on a primary-site system).
- **AC3:** Given the runbook, when each step is time-estimated by the SME reviewer, then the sum of estimated step durations does not exceed 90 minutes, leaving ≥ 30 minutes contingency within the 2-hour RTO budget (C1).
- **AC4:** Given the runbook, when credential management is reviewed, then no plaintext credentials are stored in the runbook itself, all credential-fetch steps reference an approved secrets-management mechanism, and the procedure is consistent with PCI DSS access-control requirements (C2 — for QSA review in Story 3.1).

**Architecture Constraints:**
- **C1 (RTO ≤ 2 hours):** The runbook is the operational mechanism for achieving RTO. Total estimated runbook duration ≤ 90 minutes is a hard gate (AC3); any step that cannot be reduced to fit must be redesigned, not waived.
- **C2 (PCI DSS):** Credential handling and access procedures in the runbook must comply with PCI DSS access-control requirements (Requirement 7/8 family). AC4 produces evidence for QSA review in Story 3.1.

**NFR:**
- **Availability:** The runbook must be reachable when the primary data centre is unavailable — i.e. not hosted only on primary-site systems. AC2 covers this.
- **Security (C2 — PCI DSS):** No plaintext credentials in the runbook; credentials fetched from an approved secrets store at execution time only.
- **Audit trail:** Runbook version is recorded; every drill and every real failover references the runbook version used.

---

### Story 2.2 — Two Pre-Go-Live Failover Drills with RTO/RPO Evidence Package

**As a** payment operations engineer,
**I want** two timed pre-go-live failover drills that confirm RTO ≤ 2 hours and RPO ≤ 15 minutes,
**So that** the Board Risk Committee has objective evidence that the payment authorisation service meets its own approved DR policy targets and the open Board finding can be closed.

**Out of scope:** Production traffic cutover during drills (drills use a controlled drill harness, not live merchant traffic). Merchant or cardholder communication during drills. Automated failover detection. Drilling DR for any service other than the payment authorisation service.

**Acceptance Criteria:**

- **AC1:** Given the runbook from Story 2.1 and the provisioned secondary site (Stories 1.1, 1.2, 1.3), when Drill 1 is conducted with an explicitly logged start timestamp (outage declaration) and end timestamp (payment authorisation confirmed operational at Hamilton), then total elapsed time is ≤ 120 minutes (C1 — RTO ≤ 2 hours).
- **AC2:** Given Drill 1, when transaction-record reconciliation is performed between primary state (at outage-declaration timestamp) and secondary state (at switchover), then the unrecoverable data window is ≤ 15 minutes (C1 — RPO ≤ 15 minutes), measured by record count and last-committed-transaction timestamp.
- **AC3:** Given the Drill 1 results, when steps that exceeded their estimated duration are identified, then the runbook is updated with revised timings and any procedural fixes before Drill 2 is conducted; revisions are recorded in the runbook version history.
- **AC4:** Given the updated runbook, when Drill 2 is conducted, then RTO ≤ 120 minutes and RPO ≤ 15 minutes are again achieved, and the Drill 2 report records both measurements with timestamps and reconciliation evidence.
- **AC5:** Given the Drill 1 and Drill 2 reports, when the DR compliance evidence package is assembled, then it includes: drill date, start/end timestamps, measured RTO, measured RPO, runbook version used, operations lead sign-off, and a cross-reference to the QSA letter (Story 3.1) and the AML audit confirmation (Story 3.2) — and is filed for Board Risk Committee review.

**Architecture Constraints:**
- **C1 (RTO ≤ 2 hours and RPO ≤ 15 minutes):** This story is the primary validation of C1 for both halves of the policy. Both drills must pass; a single-pass result is insufficient evidence of repeatability.
- **C2 (PCI DSS):** Drill conditions must not breach the CDE boundary. Production cardholder data is not used in drill harness data unless QSA-approved (link to Story 3.1).
- **C6 (100% transaction volume at secondary):** Drill harness load must approximate 100% of peak transaction volume — drills run against trivially small load sets do not validate C6.

**NFR:**
- **Compliance (C1 — Board policy):** Drill reports are the primary evidence the Board uses to close the live finding. Both drills must produce written, signed-off reports.
- **Audit trail:** Drill reports retained as compliance records — date, timestamps, measured RTO/RPO, runbook version, operations lead sign-off.
- **Data classification:** Internal (drill reports); Restricted (any embedded transaction-record samples).

---

## Epic 3: Regulatory Assessment and Audit Closure

### Story 3.1 — PCI DSS QSA Assessment of the DR Environment Before Q3

**As a** security and compliance team member,
**I want** the QSA firm to assess the Hamilton DR environment under PCI DSS and issue a written sign-off before go-live and before the Q3 annual audit window,
**So that** the architectural change to the payment authorisation service is PCI DSS-compliant per the C2 obligation, and the Q3 audit does not surface an unassessed DR environment as a finding.

**Out of scope:** The Q3 annual QSA audit of the primary site itself (separate engagement, separate scope). PCI DSS remediation work at the primary site. PCI DSS assessment of any service other than the payment authorisation DR environment. Renegotiation of the QSA contract.

**Acceptance Criteria:**

- **AC1:** Given the DR architecture documentation pack (Stories 1.1, 1.2 AC3/AC4, 1.3 NFR security, 2.1 AC4) and a preliminary scoping conversation with the QSA firm initiated within 2 weeks of project approval, when the QSA scope brief is submitted, then a QSA assessment date is confirmed in writing and the assessment date is at least 4 weeks before the planned go-live date and before the Q3 annual audit window.
- **AC2:** Given the QSA assessment is performed, when findings are issued, then every Critical and every High finding is remediated and the remediation is verified by the QSA before the QSA sign-off letter is issued (no go-live with open Critical/High findings); every Medium finding has a documented remediation plan with named owner and target date.
- **AC3:** Given Critical and High findings are remediated, when the QSA issues the written sign-off letter confirming the DR environment is assessed within PCI DSS requirements, then the letter is filed in the compliance record, referenced in the DR go-live approval, and cross-linked from the Drill 2 evidence package (Story 2.2 AC5).
- **AC4:** Given the QSA sign-off letter is in hand, when DR go-live is requested, then the change-approval process verifies the letter exists and is current; absence of a current letter is a hard go-live block.

**Architecture Constraints:**
- **C2 (PCI DSS — regulated; QSA assessment required before go-live):** This story directly satisfies C2. A go-live without the QSA sign-off letter (AC3) is a statutory non-compliance event. AC4 makes the gate enforceable in the change process.
- **C1 (RTO timing):** The QSA assessment scheduling and any remediation work must complete in time for the planned go-live; slippage here is a direct risk to the Q3 audit and to the Board RTO/RPO compliance evidence.

**NFR:**
- **Compliance (C2 — PCI DSS — regulated):** QSA assessment of the DR environment before go-live is mandatory. Any deviation requires explicit written risk acceptance from the CISO; this is escalation, not routine.
- **Timeline:** Preliminary scoping conversation within 2 weeks of project approval; assessment scheduled at least 4 weeks before go-live and before Q3 audit.
- **Security:** Cardholder Data Environment controls at Hamilton — network segmentation, encryption at rest and in transit, access logging, vulnerability management — must meet PCI DSS requirements at primary-site equivalence (linked to Story 1.2 AC3).
- **Audit trail:** QSA letter and any Medium-finding remediation plans retained permanently in the compliance record.

---

### Story 3.2 — Independent AML/CFT Replication Completeness Audit (Closes Internal Audit Finding)

**As a** compliance team member,
**I want** an independent audit confirming that all AML/CFT-scope transaction records replicate from Auckland to Hamilton across the full 5-year statutory retention window,
**So that** the open internal audit finding ("replication to secondary site within statutory retention window is unverified" — C5) is formally closed and the AML/CFT Act 5-year retention obligation (C3) is demonstrably satisfied at the secondary site before go-live.

**Out of scope:** Backfilling records that pre-date this project (a separate remediation workstream if historical gaps are found). AML compliance monitoring of ongoing transactions post-go-live (BAU function). Retention compliance for services other than the payment authorisation service. Re-running the audit on a periodic schedule (a separate ongoing-assurance workstream).

**Acceptance Criteria:**

- **AC1:** Given the replication mechanism in place from Story 1.3 (with the AML-scope inclusion guarantee from AC3 of that story), when an independent transaction-record replication audit is performed comparing Auckland and Hamilton record sets, then the audit covers: total record count by date range across the full 5-year retention window, completeness per AML/CFT-scope record type, and a documented spot-check sample reconciling AML-scope record fields (transaction ID, amount, parties, timestamp) between primary and secondary.
- **AC2:** Given the audit is performed, when findings are issued, then every gap (records missing, date ranges affected, record types affected) is quantified with date-range and record-count detail, and a remediation plan with named owner and target date is produced before go-live; un-remediated gaps are an explicit go-live blocker.
- **AC3:** Given all replication gaps identified in AC2 are remediated, when the audit is re-run (or the auditor confirms remediation in writing), then a written audit confirmation is issued stating that AML/CFT-scope transaction records replicate to Hamilton with full coverage across the 5-year retention window, with no outstanding gaps.
- **AC4:** Given the audit confirmation from AC3, when the compliance team files the report, then the open internal audit finding ("replication to secondary site within statutory retention window is unverified") is formally closed in the audit register, with the audit confirmation as the closing evidence and the audit confirmation cross-linked from the Drill 2 evidence package (Story 2.2 AC5) and the DR go-live approval.

**Architecture Constraints:**
- **C3 (AML/CFT Act — regulated; 5-year retention with replication to secondary):** This story directly satisfies C3 at the secondary site. A go-live with un-remediated AML/CFT replication gaps is a statutory compliance failure.
- **C5 (open internal audit finding — regulated):** This story is the explicit closure mechanism for C5. AC4 is the audit-register closure; until AC4 is signed off, the C5 finding remains open and is an active audit issue regardless of any other DR progress.
- **C1 (Q3 timing):** Audit scheduling, gap remediation, and audit re-confirmation must all complete before go-live and before the Q3 audit cycle to avoid the C5 finding remaining open at audit time.

**NFR:**
- **Compliance (C3 — AML/CFT Act — regulated):** Statutory 5-year retention obligation. Any unresolved replication gap at go-live is a regulatory compliance event.
- **Compliance (C5 — open audit finding):** AC4 closure of the audit register entry is mandatory; closure without remediation evidence is not permitted.
- **Audit trail:** Audit report (AC3) and the audit-register closure entry (AC4) retained permanently.
- **Data classification:** Restricted (AML/CFT-scope transaction records).
- **Independence:** The audit must be performed by a function independent of the team that built or operates the replication mechanism (separation of duties) to satisfy the "independent" qualifier and the internal audit standard.

---

## Scope Accumulator

**Discovery MVP scope items (from `runs/config-B-run-1/discovery.md`):** 5

| MVP item | Covered by |
|---|---|
| 1. Active-passive secondary site failover capability (Auckland → Hamilton, 100% volume) | Stories 1.1, 1.2 |
| 2. Documented and tested manual failover procedure | Stories 2.1, 2.2 |
| 3. Replication lag within 15-minute RPO, validated in drills | Stories 1.3, 2.2 |
| 4. QSA assessment of the DR environment with sign-off before go-live | Story 3.1 |
| 5. AML/CFT replication completeness verification | Story 3.2 |

**Stories written:** 7
**MVP items covered:** 5 of 5
**Scope additions beyond discovery MVP:** 0
**Scope notes raised:** 0
**Scope ratio:** 7/5 = 1.4 — driven by splitting MVP item 1 (capacity validation, provisioning) and MVP item 2 (runbook, drills) into separately verifiable stories. No discovery item is unmet; no story is unlinked from a discovery MVP item or constraint.

✅ **Scope check passed** — full discovery coverage with no unauthorised additions. The split of MVP items 1 and 2 into 2-story sequences each is a slicing decision, not a scope expansion (each pair represents the same MVP item's lifecycle).

**Constraint coverage matrix (CPF readiness):**

| Constraint | Stories that explicitly carry this constraint in Architecture Constraints / NFR / ACs |
|---|---|
| C1 — RTO ≤ 2h, RPO ≤ 15 min (Board policy) | 1.1 (RTO timing), 1.2 (RTO budget), 1.3 (RPO mechanism, AC1/AC2/AC4), 2.1 (RTO budget, AC3), 2.2 (RTO + RPO evidence, AC1/AC2/AC4), 3.1 (timing risk to RTO compliance evidence) |
| C2 — PCI DSS QSA assessment before go-live (regulated) | 1.1 (NFR), 1.2 (AC3, AC4, NFR), 1.3 (NFR security), 2.1 (AC4, NFR), 2.2 (drill harness data), 3.1 (entire story, AC1–AC4) |
| C3 — AML/CFT Act 5-year retention; replication to secondary (regulated) | 1.3 (AC3, NFR compliance), 3.2 (entire story, AC1–AC4) |
| C4 — Single primary DC; Hamilton not active | 1.1 (eliminates), 1.2 (operationally eliminates with 1.3) |
| C5 — Open internal audit finding on AML replication completeness (regulated) | 1.3 (by-design inclusion guarantee, AC3), 3.2 (audit closure, AC1–AC4) |
| C6 — 100% transaction volume at secondary; no partial routing | 1.1 (AC1, NFR performance), 1.2 (AC capacity match), 1.3 (peak load), 2.2 (drill harness load) |

Every discovery constraint is propagated to at least one story's Architecture Constraints with the regulated framing preserved (PCI DSS named, AML/CFT Act named, retention period named, secondary-site replication named). No constraint is paraphrased into a generic "store data securely" form.

---

## NFR Profile

**Feature:** 2026-05-14-payment-auth-dr-failover

| Category | Requirement | Source constraint |
|---|---|---|
| Availability | Recovery Time Objective ≤ 2 hours; Recovery Point Objective ≤ 15 minutes; demonstrated on 2 of 2 pre-go-live drills | C1 (Board Risk Committee DR policy) |
| Performance | Replication lag ≤ 15 minutes (max), ≤ 10 minutes (95th percentile) under peak load (180,000 transactions/day); secondary site sized for 100% transaction volume | C1, C6 |
| Security | PCI DSS Cardholder Data Environment controls at Hamilton at primary-site equivalence: network segmentation, encryption at rest, encryption in transit, access logging, vulnerability management | C2 (PCI DSS — regulated) |
| Compliance — PCI DSS | QSA assessment of DR environment with written sign-off letter before go-live and before Q3 annual audit; no go-live with open Critical/High findings | C2 (regulated) |
| Compliance — AML/CFT | All AML/CFT-scope record types replicated to Hamilton; full coverage across 5-year statutory retention window verified by independent audit; open internal audit finding formally closed before go-live | C3, C5 (regulated) |
| Data classification | Restricted (PCI DSS CDE + AML/CFT-scope transaction records) | C2, C3 |
| Data residency | Auckland (primary) and Hamilton (secondary) — both within New Zealand | — |
| Audit trail | Drill reports, QSA sign-off letter, AML replication audit report, and audit-register closure entry retained as compliance records | C1, C2, C3, C5 |
| Observability | Replication lag (current and 95p) and per-record-type replication health visible on operations dashboard; paging alert on lag > 10 minutes for > 2 minutes; paging alert on replication outage within 60 seconds | C1, C3 |
| Independence | AML/CFT replication audit performed by a function independent of the replication build/operations team | C5 |

**NFRs with named regulatory clauses requiring human sign-off before DoR:**
- **C2 — PCI DSS (regulated)** — QSA assessment mandatory before go-live; CISO sign-off required for any deviation
- **C3 — AML/CFT Act (regulated)** — 5-year record replication mandatory; statutory obligation
- **C5 — Open internal audit finding (regulated)** — formal audit-register closure required before go-live

---

## Eval-mode result

```json
{
  "skill": "definition",
  "caseId": "S1",
  "model": "claude-opus-4-7",
  "config": "B",
  "completedAt": "2026-05-14T00:00:00Z",
  "artefactPath": "workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-1/definition.md",
  "epicsCount": 3,
  "storiesCount": 7,
  "slicingStrategy": "risk-first",
  "constraintsPropagated": ["C1", "C2", "C3", "C4", "C5", "C6"],
  "scopeAdditions": 0,
  "dimensionsScored": null,
  "verdict": null
}
```

<!-- eval-mode: true -->
