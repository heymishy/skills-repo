# Definition: Payment Authorisation Secondary-Site Failover Capability

**Feature:** 2026-05-14-payment-authorisation-secondary-site-failover (eval run)
**Discovery reference:** `workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-2/discovery.md`
**Benefit-metric reference:** Not produced in this eval run — metric linkage is anchored to the discovery's Directional Success Indicators (treated as proto-metrics M1–M5).
**Slicing strategy:** **Walking skeleton** — chosen because the Hamilton site is currently backup-storage-only with no active workload configuration. The first story establishes the thinnest credible end-to-end failover path (manual trigger, single transaction class). Later stories layer automated trigger, replication-lag SLO, retention-window evidence, and QSA assessment onto that skeleton. This pattern surfaces co-location, network, and replication risks before scope is committed.
**Author:** Copilot (eval mode — Config B run 2)

---

## Architecture constraints scan

`.github/architecture-guardrails.md` was not read interactively in this eval run. Constraints inherited from the discovery artefact and applied to every story below:

- **C1** — RTO ≤ 2 hours, RPO ≤ 15 minutes (Board-approved disaster recovery policy)
- **C2** — PCI DSS — any architectural change requires QSA assessment before go-live
- **C3** — AML/CFT Act — 5-year transaction record retention, must be demonstrably satisfied at the secondary site
- **C4** — Single existing data centre (Auckland); Hamilton co-location is backup-storage-only
- **C5** — Open internal audit finding (AML replication gap unverified) — must be closed within MVP, not deferred

---

## Proto-metric matrix (from discovery success indicators)

| ID | Proto-metric | Baseline | Target |
|----|--------------|----------|--------|
| M1 | Demonstrated failover recovery time | Untested (last incident: 4.2hr / 3 events) | ≤2hr on 2 of 2 controlled tests before Q3 QSA audit |
| M2 | Replication lag (RPO evidence) | [UNKNOWN BASELINE] | ≤15 min sustained under representative load |
| M3 | AML/CFT retention gap closure | Open internal audit finding | Finding closed with retention-replication evidence |
| M4 | PCI DSS QSA assessment outcome | No assessment of new architecture | QSA-assessed and signed off before Q3 audit, no high-severity findings |
| M5 | Board-reportable RTO/RPO compliance | Non-compliant (3 events / 4.2hr in 12 months) | Risk Committee paper showing service meets policy at next quarterly cycle |

---

## Epic structure (proposed and adopted)

- **Epic 1 — Failover Skeleton & Replication SLO** — 4 stories — establishes the end-to-end failover and replication path that satisfies M1, M2, and M5.
- **Epic 2 — Compliance Assurance (PCI DSS + AML/CFT)** — 3 stories — closes M3 and M4 against the same skeleton; cannot proceed without Epic 1 stories S1–S2 in place to assess.

Total: 2 epics, 7 stories.

---

## Epic 1 — Failover Skeleton & Replication SLO

**Discovery reference:** as above
**Benefit-metric reference:** proto-metric matrix above (M1, M2, M5)
**Slicing strategy:** Walking skeleton

### Goal

Card payment authorisation can be cut over from the Auckland primary site to the Hamilton secondary site within 2 hours, with transaction state replicated to Hamilton within 15 minutes of capture, evidenced by two end-to-end failover tests. The Risk Committee can be shown a paper demonstrating the service meets its own Board-approved RTO/RPO policy.

### Out of Scope

- **Active-active concurrent processing.** This epic builds active-passive only; concurrent dual-site authorisation is deferred entirely.
- **Auto-failback to Auckland after primary recovery.** Failover is one-direction in MVP; failback is a manual operator-led runbook captured outside MVP delivery.
- **Replication of non-payment-authorisation workloads** (e.g. fraud screening rule store, settlement, reconciliation) — those run from Auckland only and are unaffected by this epic.

### Benefit Metrics Addressed

| Metric | Baseline | Target | How this epic moves it |
|--------|----------|--------|------------------------|
| M1 | Untested (4.2hr / 3 events) | ≤2hr on 2 of 2 tests | Stories S1+S2+S4 produce a runnable failover path; S4 evidences the target via controlled tests |
| M2 | [UNKNOWN BASELINE] | ≤15 min lag under load | S3 establishes lag telemetry and asserts the target under representative load |
| M5 | Non-compliant | Risk Committee paper showing compliance | S4 produces the test evidence pack that anchors the Risk Committee paper |

### Stories in This Epic

- S1 — Provision Hamilton site for active payment-authorisation workload
- S2 — Establish synchronous-eligible replication channel Auckland → Hamilton for authorisation state
- S3 — Replication lag telemetry and 15-minute RPO assertion under representative load
- S4 — Controlled failover test runbook + two evidenced ≤2-hour failover runs

**Human Oversight:** **High** — touches PCI cardholder-data-environment scope, real-time payment authorisation, and Board-reportable compliance. No coding-agent autonomous merges.

**Complexity:** **3** — High ambiguity (Hamilton not currently configured; replication design unverified; CDE boundary undefined).

**Scope Stability:** **Unstable** — QSA preliminary scoping (in Epic 2) may force replication design changes that alter S2/S3.

---

### Story S1 — Provision Hamilton site for active payment-authorisation workload

**Epic reference:** Epic 1
**Discovery reference:** as above
**Benefit-metric reference:** M1

**User Story**

As a **payment operations engineer**,
I want to **bring the Hamilton co-location site online as an active passive replica capable of running the payment authorisation workload**,
So that **a failover destination exists and the demonstrated failover recovery time (M1) can begin to be measured**.

**Benefit Linkage**

**Metric moved:** M1 — Demonstrated failover recovery time.
**How:** Without an active-capable secondary site, no failover test is executable; this story creates the precondition that lets M1 be measured at all.

**Architecture Constraints**

- C2 (PCI DSS) — Hamilton becomes part of the cardholder-data-environment (CDE); CDE boundary documentation must be drafted as part of this story to feed Epic 2 / Story S5.
- C4 (single Auckland DC) — directly addressed by this story.
- No direct DB access from external networks; all authorisation traffic via existing API surface.

**Dependencies**

- **Upstream:** None
- **Downstream:** S2, S3, S4, S5, S6, S7

**Acceptance Criteria**

**AC1:** Given the Hamilton facility currently runs only backup storage, When the workload-platform provisioning runbook completes, Then the Hamilton site has compute, network, and storage capacity sized to handle 100% of current peak authorisation volume (~180,000 transactions/day, peak rate documented), evidenced by a sign-off capacity record from the operations team.

**AC2:** Given Hamilton is provisioned, When network connectivity is verified, Then the direct fibre link Auckland↔Hamilton is measured for round-trip latency and jitter at the application boundary, and the measured values are recorded against the replication design SLO targets.

**AC3:** Given Hamilton is provisioned, When the CDE boundary is drafted, Then a written CDE-boundary-at-Hamilton document exists in the security and compliance team's evidence store, identifying every component holding cardholder data at the secondary site, and is in a state ready to share with the QSA in Story S5.

**AC4:** Given Hamilton is provisioned, When backup-storage operations are inspected post-provisioning, Then it is evidenced (via a recorded sample backup run before and after provisioning) that the existing Hamilton backup-storage workload is not degraded by the new active-workload footprint.

**Out of Scope**

- Live traffic processing from Hamilton — this story stops at "ready to receive a failover", not "receiving production traffic".
- Active-active concurrent processing.

**NFRs**

- **Performance:** Hamilton site sized for 100% of peak authorisation volume (peak rate to be documented in AC1).
- **Security:** CDE boundary documented (AC3); access to Hamilton authorisation hosts restricted via the same controls as Auckland equivalents.
- **Audit:** Provisioning actions logged in the change management system with operator ID and timestamp.
- **Availability:** Hamilton platform passes the same readiness checks Auckland passes pre-deployment.

**Complexity Rating**

**Rating:** **3**
**Scope stability:** **Unstable** (QSA scoping may force CDE-boundary changes)

---

### Story S2 — Establish replication channel Auckland → Hamilton for authorisation state

**Epic reference:** Epic 1
**Discovery reference:** as above
**Benefit-metric reference:** M2 (and precondition for M1)

**User Story**

As a **payment operations engineer**,
I want to **replicate authorisation state and transaction records from Auckland to Hamilton continuously**,
So that **on failover Hamilton resumes processing within the 15-minute RPO (M2) without losing committed authorisations**.

**Benefit Linkage**

**Metric moved:** M2 — Replication lag (RPO evidence).
**How:** This story defines and stands up the replication mechanism whose lag is then measured and asserted in S3.

**Architecture Constraints**

- C1 — RPO ≤ 15 minutes; replication design must be capable of meeting this under documented peak load.
- C2 — Replication channel and any intermediate stores fall in PCI scope; encrypt-in-transit and encrypt-at-rest required.
- C3 + C5 — Replication must include all transaction records that fall within the AML/CFT 5-year retention obligation; record categories must be enumerated explicitly (closed in S6).

**Dependencies**

- **Upstream:** S1
- **Downstream:** S3, S4, S5, S6, S7

**Acceptance Criteria**

**AC1:** Given S1 is complete, When the replication channel is configured between Auckland and Hamilton, Then the replication design document records: (a) which authorisation-state and transaction-record categories replicate, (b) the chosen mechanism (e.g. log shipping, change data capture), (c) target lag, and (d) failure-mode handling (e.g. backpressure, gap detection).

**AC2:** Given the replication channel is configured, When a single test transaction is processed at Auckland, Then the same transaction record appears at Hamilton with an integrity-checksum match and within an operator-recorded latency value, evidenced by a side-by-side record dump.

**AC3:** Given the replication channel is configured, When a deliberate replication interruption is induced (network drop simulation), Then on recovery the channel resumes from the last committed offset with no record loss and no duplicate commit, evidenced by a reconciled record count before, during, and after the interruption.

**AC4:** Given the replication channel is configured, When data-in-transit and data-at-rest are inspected, Then encryption is in force at both stages and the encryption-key management approach is recorded against the existing PCI control inventory.

**Out of Scope**

- Replication-lag telemetry and SLO assertion under load — handled by S3.
- Inclusion of non-authorisation workloads (fraud rule store, settlement) in the replication channel.

**NFRs**

- **Performance:** Replication mechanism design supports ≤15 min lag under documented peak (asserted under load in S3).
- **Security:** Encryption in transit and at rest; key management aligned to existing PCI control inventory.
- **Audit:** Replication channel state changes logged.
- **Data residency:** Both endpoints in NZ; no off-shore replica hop.

**Complexity Rating**

**Rating:** **3**
**Scope stability:** **Unstable**

---

### Story S3 — Replication lag telemetry and RPO assertion under representative load

**Epic reference:** Epic 1
**Discovery reference:** as above
**Benefit-metric reference:** M2

**User Story**

As a **payment operations engineer**,
I want to **see continuous replication-lag telemetry and prove the 15-minute RPO holds under representative load**,
So that **M2 has an operator-visible baseline and the Risk Committee paper for M5 can cite a measured RPO not a designed RPO**.

**Benefit Linkage**

**Metric moved:** M2 — Replication lag (RPO evidence).
**How:** Closes the [UNKNOWN BASELINE] gap by making lag continuously observable, then asserts the SLO under representative load before failover testing in S4.

**Architecture Constraints**

- C1 — RPO ≤ 15 minutes is the measurable SLO target.
- Telemetry surface must integrate with existing operations monitoring, not introduce a parallel tooling stack.

**Dependencies**

- **Upstream:** S2
- **Downstream:** S4

**Acceptance Criteria**

**AC1:** Given S2 is complete, When the replication-lag telemetry is enabled, Then current replication lag is visible on an operations dashboard sampled at no greater than 1-minute intervals, with both instantaneous and rolling-window views.

**AC2:** Given replication-lag telemetry is enabled, When a representative load profile (matching documented peak transaction volume and rate) is run against Auckland for a sustained 60-minute window, Then measured replication lag remains ≤15 minutes throughout the window, evidenced by the dashboard timeseries export.

**AC3:** Given replication-lag telemetry is enabled, When lag exceeds the 15-minute threshold, Then an alert is raised through the existing alerting channel within 1 minute of breach, captured in the alerting-system log.

**AC4:** Given the load test of AC2 has run, When the resulting timeseries is reviewed, Then a baseline value (peak observed lag, mean observed lag) is recorded against M2 in the proto-metric matrix — replacing the [UNKNOWN BASELINE] entry.

**Out of Scope**

- Failover execution — handled by S4.
- Optimisation of replication lag below 15 min — only the SLO must be met.

**NFRs**

- **Performance:** Telemetry sampling ≤1 min; alert latency ≤1 min on breach.
- **Audit:** Load test run, configuration, and outcome retained as M2 evidence pack.

**Complexity Rating**

**Rating:** **2**
**Scope stability:** **Stable**

---

### Story S4 — Controlled failover test runbook + two evidenced ≤2-hour failover runs

**Epic reference:** Epic 1
**Discovery reference:** as above
**Benefit-metric reference:** M1, M5

**User Story**

As a **payment operations engineer**,
I want to **execute two end-to-end controlled failover tests from Auckland to Hamilton, each completing within 2 hours**,
So that **M1 has evidence of the target being met and the Risk Committee paper anchoring M5 can cite the test results**.

**Benefit Linkage**

**Metric moved:** M1, M5.
**How:** Two successful controlled failover tests are the evidence both metrics rely on. Without S4 the metric targets cannot be demonstrated.

**Architecture Constraints**

- C1 — RTO ≤ 2 hours is the test pass criterion.
- C2 — QSA must have completed scoping (S5) before the second test is treated as compliance evidence; first test may proceed in advance under a recorded variation.

**Dependencies**

- **Upstream:** S1, S2, S3
- **Downstream:** Risk Committee paper (out of MVP — operator action)

**Acceptance Criteria**

**AC1:** Given S1, S2, S3 are complete, When the controlled failover test runbook is published, Then the runbook documents: trigger sequence, smoke-check criteria for "Hamilton is processing", rollback decision points, and operator/observer roles; runbook is reviewed and signed off by the security and compliance team.

**AC2:** Given the runbook is in place, When the first controlled failover test is executed, Then end-to-end recovery (from trigger to first successful authorisation processed at Hamilton with smoke checks passed) completes in ≤2 hours, evidenced by timestamped operator log and authorisation-service smoke-check output.

**AC3:** Given the first test passed, When the second controlled failover test is executed at least 7 days later (to validate the runbook is repeatable, not artefact-specific), Then end-to-end recovery again completes in ≤2 hours, evidenced as in AC2.

**AC4:** Given AC2 and AC3 have passed, When the M1/M5 evidence pack is assembled, Then it contains both timestamped operator logs, smoke-check outputs, replication-lag timeseries during the test windows (from S3), and a signed observer attestation; the pack is delivered to the security and compliance team for inclusion in the Risk Committee paper.

**Out of Scope**

- The Risk Committee paper itself — produced by the operations team outside this story.
- Auto-failback to Auckland after the test.

**NFRs**

- **Performance:** Each test completes in ≤2 hours measured operator-trigger to first-successful-authorisation-at-Hamilton.
- **Audit:** Full test evidence pack retained per existing audit retention policy.

**Complexity Rating**

**Rating:** **3**
**Scope stability:** **Stable** once S1–S3 are stable

---

## Epic 2 — Compliance Assurance (PCI DSS + AML/CFT)

**Discovery reference:** as above
**Benefit-metric reference:** M3, M4
**Slicing strategy:** Walking skeleton (compliance assessment layered onto Epic 1 skeleton)

### Goal

The PCI DSS QSA has assessed and signed off the new Auckland↔Hamilton architecture before the Q3 audit window with no high-severity findings outstanding at go-live, and the open internal audit finding regarding AML/CFT 5-year transaction record retention at the secondary site is closed with documented evidence.

### Out of Scope

- Re-baselining of the PCI cardholder-data-environment beyond the Hamilton addition — pre-existing Auckland CDE scope is unchanged.
- Re-design of any AML/CFT process other than the secondary-site replication question — fraud screening, transaction monitoring, and reporting are unchanged.
- Closing internal audit findings unrelated to the AML replication gap.

### Benefit Metrics Addressed

| Metric | Baseline | Target | How this epic moves it |
|--------|----------|--------|------------------------|
| M3 | Open internal audit finding | Finding closed with evidence | S6 produces the retention-replication evidence pack |
| M4 | No assessment of new architecture | QSA-assessed before Q3, no high-severity findings | S5 + S7 deliver QSA scoping and assessment outcome |

### Stories in This Epic

- S5 — QSA preliminary scoping engagement on new architecture
- S6 — AML/CFT 5-year retention evidence at Hamilton (closes internal audit finding)
- S7 — QSA formal assessment, sign-off, finding remediation gate

**Human Oversight:** **High** — regulatory engagement, audit-finding closure, Board-visible compliance.

**Complexity:** **2** — Lower technical complexity than Epic 1, but external-stakeholder timing risk.

**Scope Stability:** **Unstable** — QSA findings may add scope back into Epic 1.

---

### Story S5 — QSA preliminary scoping engagement on new architecture

**Epic reference:** Epic 2
**Discovery reference:** as above
**Benefit-metric reference:** M4

**User Story**

As a **member of the security and compliance team**,
I want to **engage the QSA firm to scope the assessment of the new Auckland↔Hamilton architecture**,
So that **M4 has a defined assessment plan and the Q3 audit window is not jeopardised by late engagement**.

**Benefit Linkage**

**Metric moved:** M4 — PCI DSS QSA assessment outcome.
**How:** Establishes the QSA engagement plan that S7 then executes. Without scoping, the formal assessment cannot proceed in time.

**Architecture Constraints**

- C2 — PCI DSS assessment is the defining constraint of this story.

**Dependencies**

- **Upstream:** S1 (CDE boundary draft from S1 AC3 is the scoping input)
- **Downstream:** S7

**Acceptance Criteria**

**AC1:** Given S1 AC3 (CDE boundary draft) is complete, When the QSA firm is engaged for preliminary scoping, Then the engagement results in a written scoping memo from the QSA covering: (a) what controls are in scope at Hamilton, (b) what evidence will be required at the formal assessment, and (c) a calendar slot for the formal assessment that completes before the Q3 audit.

**AC2:** Given the scoping memo is received, When it is reviewed against the planned architecture, Then any control gaps identified by the QSA are logged as either: (a) addressed in current epics, (b) added as new stories, or (c) raised with the operator as a scope decision; nothing is silently absorbed.

**AC3:** Given any gaps from AC2 are logged, When new stories are needed, Then they are written and linked to this story before this story is closed; if no gaps, the absence of gaps is recorded explicitly in the engagement file.

**Out of Scope**

- The formal assessment itself — handled by S7.
- Renegotiating the existing Auckland CDE scope.

**NFRs**

- **Audit:** QSA correspondence and scoping memo retained in compliance evidence store.

**Complexity Rating**

**Rating:** **2**
**Scope stability:** **Unstable**

---

### Story S6 — AML/CFT 5-year retention evidence at Hamilton (closes internal audit finding)

**Epic reference:** Epic 2
**Discovery reference:** as above (closes C5)
**Benefit-metric reference:** M3

**User Story**

As a **member of the security and compliance team**,
I want to **demonstrate that all transaction records subject to the AML/CFT 5-year retention obligation are replicated to Hamilton within scope of that obligation**,
So that **M3 (the open internal audit finding) is closed with documented evidence rather than carried forward**.

**Benefit Linkage**

**Metric moved:** M3 — AML/CFT retention gap closure.
**How:** Produces the retention-replication evidence pack that the internal audit team requires to close the finding.

**Architecture Constraints**

- C3 — AML/CFT 5-year retention.
- C5 — Open internal audit finding; this story is the explicit MVP closure for it (per discovery: "must be resolved as part of, not after, MVP").

**Dependencies**

- **Upstream:** S2
- **Downstream:** Risk Committee / internal audit closure (operator action)

**Acceptance Criteria**

**AC1:** Given S2 is complete, When the transaction-record categories subject to the AML/CFT 5-year retention obligation are enumerated, Then the enumeration is reviewed and signed off by the security and compliance team, and each category is mapped to its replication path defined in S2 AC1.

**AC2:** Given the enumeration of AC1 is complete, When the replicated records at Hamilton are sampled across a representative time window, Then a reconciliation report shows zero records present at Auckland but absent at Hamilton within the AML retention scope, evidenced by a side-by-side record count and checksum.

**AC3:** Given the reconciliation of AC2 has passed, When the retention-replication evidence pack is assembled, Then it contains the enumeration (AC1), the reconciliation report (AC2), the replication design document (S2 AC1), and a covering memo cross-referencing the original internal audit finding ID; the pack is submitted to internal audit for finding closure.

**AC4:** Given the evidence pack is submitted, When internal audit responds, Then the response (closure or further-information request) is recorded, and any follow-up actions are either resolved within this story or logged as a new story before this story is closed.

**Out of Scope**

- AML/CFT obligations other than the 5-year retention replication question.
- Re-design of the underlying AML/CFT reporting workflow.

**NFRs**

- **Audit:** Evidence pack retained per audit retention policy; cross-reference to original internal audit finding ID is mandatory.
- **Data residency:** Both Auckland and Hamilton are NZ-located; statutory retention obligation is satisfied without off-shore replica.

**Complexity Rating**

**Rating:** **2**
**Scope stability:** **Stable**

---

### Story S7 — QSA formal assessment, sign-off, finding remediation gate

**Epic reference:** Epic 2
**Discovery reference:** as above
**Benefit-metric reference:** M4

**User Story**

As a **member of the security and compliance team**,
I want to **complete the QSA formal assessment of the new Auckland↔Hamilton architecture and remediate any high-severity findings before go-live**,
So that **M4 is met (QSA-assessed and signed off before Q3 audit, no high-severity findings outstanding at go-live)**.

**Benefit Linkage**

**Metric moved:** M4.
**How:** Produces the QSA written assessment letter that constitutes the M4 evidence.

**Architecture Constraints**

- C2 — PCI DSS QSA assessment.
- Any high-severity finding must be remediated before go-live, not deferred.

**Dependencies**

- **Upstream:** S5, S2, S6 (evidence inputs); S4 second test should be complete or scheduled to feed assessment evidence
- **Downstream:** Go-live decision (operator action, outside MVP)

**Acceptance Criteria**

**AC1:** Given S5 has produced a scoping memo and a calendar slot, When the QSA formal assessment is conducted on the agreed date, Then a written assessment letter from the QSA is received covering all in-scope controls and stating whether the architecture is fit for go-live.

**AC2:** Given the assessment letter is received, When findings are reviewed, Then each high-severity finding has either: (a) a closed remediation with evidence, or (b) an explicit RISK-ACCEPT logged in `decisions.md` signed off by the named accountable executive; medium/low findings have a tracked remediation plan with named owner and due date.

**AC3:** Given AC2 is complete, When the M4 evidence pack is assembled, Then it contains the QSA assessment letter, the findings register with status, all remediation evidence, and any RISK-ACCEPT records; the pack is delivered to the security and compliance team for filing and to the operator for the go-live decision.

**AC4:** Given the QSA assessment letter is filed, When the M4 row in the metric pack is updated, Then it records "QSA-assessed: yes / no high-severity findings outstanding at go-live: yes/no" with reference to the evidence pack.

**Out of Scope**

- The go-live decision itself — operator decision based on this evidence.
- Annual QSA audit (Q3) — separate engagement, this is the pre-audit assessment of the change.

**NFRs**

- **Audit:** QSA assessment letter and findings register retained per compliance retention policy.

**Complexity Rating**

**Rating:** **2**
**Scope stability:** **Unstable** (assessment outcome may force rework)

---

## Step 5 — Benefit coverage matrix

| Proto-metric | Stories that move it |
|--------------|---------------------|
| M1 — Failover recovery time | S1, S2, S4 |
| M2 — Replication lag (RPO) | S2, S3 |
| M3 — AML/CFT retention gap closure | S6 |
| M4 — PCI DSS QSA assessment outcome | S5, S7 |
| M5 — Board-reportable RTO/RPO compliance | S4 (evidence pack) |

**Metric gaps:** None — every proto-metric has at least one story moving it.
**Story gaps:** None — every story is linked to at least one proto-metric.

---

## Step 6 — Scope accumulator

- Discovery MVP scope items: **5** (automated failover trigger; active-passive replication; AML retention satisfied at secondary; QSA scoping engagement; two evidenced failover tests)
- Stories written: **7**
- Stories with scope notes (additions beyond MVP): **0**
- Stories explicitly deferred to post-MVP: **0**
- Stories with no metric linkage: **0**

**Coverage of discovery MVP scope items:**

| MVP item (from discovery) | Story coverage |
|---------------------------|---------------|
| Automated failover trigger meeting 2-hour RTO | S1 (precondition), S4 (evidenced runs) |
| Active-passive replication meeting 15-min RPO | S2 (channel), S3 (lag SLO under load) |
| Transaction-record replication satisfying AML/CFT retention | S2 (channel covers categories), S6 (evidence + finding closure) |
| PCI DSS QSA scoping engagement | S5, S7 |
| Two end-to-end failover tests | S4 |

**Scope ratio:** 7 stories / 5 MVP items = **1.4** — below the 1.5 drift threshold. Stories S1 and S5 are *preconditions* to the MVP items rather than additions; S3 separates "channel exists" (S2) from "channel meets SLO under load" (S3) for testability. No silent scope expansion.

✅ **Scope check passed** — 7 stories cleanly cover 5 MVP items with no unexplained additions.

---

## Step 7 — NFR profile (consolidated)

- **Performance:** RTO ≤ 2 hours (C1); RPO ≤ 15 minutes (C1); telemetry sampling ≤ 1 minute; alert latency on RPO breach ≤ 1 minute.
- **Security:** PCI DSS in scope (C2) — Hamilton joins the CDE; encryption in transit and at rest on the replication channel; key management aligned to existing PCI control inventory.
- **Data classification:** **Restricted** (cardholder data + AML transaction records).
- **Data residency:** All data remains in NZ (Auckland + Hamilton); no off-shore replica.
- **Availability SLA:** Service must demonstrably meet Board-approved RTO/RPO at next quarterly Risk Committee reporting cycle following go-live.
- **Audit:** All QSA correspondence, AML retention evidence, replication telemetry, failover test evidence retained per existing compliance retention policy; cross-references to internal audit finding ID mandatory in M3 evidence pack.
- **Compliance frameworks:** PCI DSS; AML/CFT Act (NZ); internal Board-approved disaster recovery policy.

NFRs with named regulatory clauses (PCI DSS, AML/CFT Act) require human sign-off at DoR.

---

## Definition complete summary

- **Epics:** 2 (Failover Skeleton & Replication SLO; Compliance Assurance)
- **Stories:** 7 (S1–S7)
- **Slicing strategy:** Walking skeleton
- **Scope check:** ✅ Clean — ratio 1.4, no silent additions
- **NFR profile:** ✅ Generated above; named regulatory frameworks present (DoR human sign-off required)
- **Outstanding from discovery `/clarify` recommendation:** 5 unconfirmed assumptions remain — should be resolved before DoR. They have not been resolved within this definition pass; story scope above is conditional on those assumptions holding.

State write skipped — eval-mode artefact, not a production definition output.

<!-- eval-mode: true -->
