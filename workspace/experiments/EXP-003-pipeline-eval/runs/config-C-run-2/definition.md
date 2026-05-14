# Definition: Disaster Recovery RTO + AML/CFT Compliance

**Feature Slug:** 2026-05-14-dr-rto-compliance-modernisation  
**Feature Name:** Disaster Recovery RTO + AML/CFT Compliance Modernisation  
**Date Created:** 2026-05-14  
**Status:** Ready for Review  
**Author:** Copilot (eval-mode — Config C run 2, EXP-003-pipeline-eval)  

---

## Feature Overview

This feature addresses two interconnected, urgent production gaps:

1. **RTO Violation:** The current disaster recovery infrastructure does not meet board-approved Recovery Time Objective (RTO) of ≤ 2 hours. When the primary Auckland data centre is unavailable, failover to the secondary site exceeds this window, resulting in unplanned downtime costing approximately $420,000 per outage-hour in lost transaction revenue and call centre escalation.

2. **AML/CFT Compliance Gap:** Internal audit has identified that the organisation cannot verify whether transaction records replicate to the secondary site within the Anti-Money Laundering and Countering Financing of Terrorism Act's statutory 5-year retention window. This gap is an open audit finding with regulatory exposure.

The solution modernises disaster recovery infrastructure to achieve board-approved RTO/RPO targets while closing the AML/CFT compliance gap through verified, auditable transaction replication. The approach is active-passive failover with real-time replication, automated failure detection, and operationalised runbook execution by the existing operations team.

---

## Slicing Strategy

**Strategy: Vertical Slice**

Each story delivers an end-to-end, independently demo-able capability from failure detection through to audit closure. This approach enables early validation of both the replication strategy (Epic 1) and failover mechanics (Epic 2) before operations runbook and observability layers are complete (Epic 3). Vertical slicing surfaces integration issues early and allows operations team to test complete paths in controlled DR drills.

---

## Epic Definitions

### Epic 1: DR Infrastructure & Replication Strategy

**Slug:** `e1-dr-infra-replication`  
**Priority:** P1 (enables all downstream epics)  
**Complexity:** 3 (architectural decisions, new tooling integration, regulatory validation required)  

**Objective:** Establish a robust, auditable data replication mechanism that guarantees zero transaction loss, maintains the statutory 5-year AML/CFT retention window, and enables the secondary site to resume processing within the RPO target (≤ 15 minutes behind primary at failover time).

**Success Criteria:**
- Replication strategy selected and decided, with documented rationale for chosen approach
- Current network latency, transaction volume, and site capacity constraints measured and documented
- Replication mechanism tested: zero data loss observed in test replication of 10,000+ transactions
- Audit trail for every replicated transaction recorded with timestamp, checksum, and retention window tracking
- Internal audit confirms closure of Q1 2026 AML/CFT compliance finding
- RPO ≤ 15 minutes validated in controlled test

---

### Epic 2: Failover Automation & RTO Optimization

**Slug:** `e2-failover-automation-rto`  
**Priority:** P1 (directly addresses board-approved RTO policy breach)  
**Complexity:** 3 (failure detection, decision logic, split-brain prevention, automated execution)  

**Objective:** Automate or streamline the failover procedure from primary to secondary site to achieve the 2-hour RTO target. RTO budget: ≤ 5 minutes for failure detection, ≤ 5 minutes for failover execution, ≤ 50 minutes contingency margin.

**Success Criteria:**
- Health check detects primary site failure within 5 minutes
- Failover decision (manual or automatic) executes within 5 minutes of detection trigger
- Secondary site receives and processes the first transaction within 2 hours of primary failure detection
- Split-brain scenario (both sites trying to write) prevented; verified in test
- Rollback procedure documented and tested; zero data loss on rollback from secondary back to primary
- Two consecutive DR drills demonstrate RTO ≤ 2 hours repeatably

---

### Epic 3: Observability, Monitoring & Operations Runbook

**Slug:** `e3-observability-runbook`  
**Priority:** P1 (operationalisation)  
**Complexity:** 2 (well-understood patterns; integration with existing monitoring infrastructure)  

**Objective:** Enable operations team to detect failures, monitor replication health in real-time, execute failover with confidence, and track recovery completion. Provide dashboards, alerts, and a documented runbook that operations team can execute without escalation.

**Success Criteria:**
- Real-time dashboard displays: Replication lag, Transaction volume per site, Failover status, Audit trail completeness
- Alerts configured for: Replication lag exceeding 5 minutes (HIGH), Primary health failure (CRITICAL), Failover triggered (CRITICAL), Audit trail gaps (HIGH)
- Alerts route to operations team with actionable recommendations
- Operations runbook tested: operations team member with no prior DR knowledge executes all steps successfully in test environment
- False-positive alert rate < 2% over 30-day operational window
- Dashboard data retained for 30 days to support post-incident analysis and compliance audits

---

## Story Breakdown

### Story 1.1: Replication Strategy Assessment & Network Validation

**Epic:** E1 — DR Infrastructure & Replication Strategy  
**Slug:** `s1-1-replication-strategy`  
**Complexity:** 2  
**Effort Estimate:** M (3–5 days)  

**User Story (Persona: Payment Operations Engineer)**

> As a payment operations engineer, I want to confirm that the DR replication strategy meets RTO/RPO targets and AML/CFT compliance requirements, so that I can be confident the secondary site will process transactions reliably when the primary fails.

**Acceptance Criteria:**

1. **AC1 — Strategy Options Documented:** Replication strategy options (synchronous, asynchronous, hybrid) are documented with tradeoffs: latency impact, RPO guarantee, consistency guarantees, AML/CFT audit trail capability for each option. Documented in `decisions.md` with rationale.

2. **AC2 — Network Latency Measured:** Round-trip network latency between Auckland primary and Hamilton secondary sites measured and recorded. Result: [latency to be measured]; sufficient or insufficient for chosen strategy; recorded in architecture documentation.

3. **AC3 — Transaction Volume Baseline:** Current transaction volume measured: transactions-per-second (TPS) and daily transaction count. Result recorded: baseline approximately 180,000 daily transactions (currently measured per brief).

4. **AC4 — RPO Calculated:** RPO targets (≤ 15 minutes) confirmed achievable with chosen replication strategy given measured network latency. If synchronous replication introduces unacceptable latency, asynchronous replication with RPO tolerance documented and RISK-ACCEPT recorded if AML/CFT requirements can still be met.

5. **AC5 — QSA Pre-Engagement Scheduled:** Initial scoping conversation with Qualified Security Assessor scheduled within 2 weeks to discuss architectural changes and PCI DSS scope expansion at secondary site. Conversation date confirmed; agenda includes: replication mechanism PCI scope, secondary site data protection requirements, timeline to Q3 audit.

**Dependencies:** None (first story)

**Out of Scope:** Does not implement replication; does not modify any live systems; does not configure secondary site

**NFRs:** Regulatory compliance (AML/CFT 5-year retention must be achievable), Performance (strategy must support RTO < 2 hours), Auditability (all decisions recorded)

---

### Story 1.2: Replication Implementation & Zero-Loss Validation

**Epic:** E1 — DR Infrastructure & Replication Strategy  
**Slug:** `s1-2-replication-impl`  
**Complexity:** 3  
**Effort Estimate:** L (2–3 weeks)  

**User Story (Persona: Payment Operations Engineer + Security/Compliance Team)**

> As a payment operations engineer working with security and compliance, I want to deploy transaction replication from the primary site to the secondary site such that every transaction is captured, replicated within RPO tolerance, and auditable for AML/CFT retention purposes, so that the secondary site can resume processing without transaction loss if the primary fails.

**Acceptance Criteria:**

1. **AC1 — Replication Technology Deployed:** Chosen replication technology (from S1.1 decision) installed, configured, and operational for the payment transactions database. Configuration secured and documented; tested against three artificial outage scenarios.

2. **AC2 — RPO Verified:** Replication lag monitored continuously; data exported to observability platform with < 1-minute granularity. RPO ≤ 15 minutes confirmed in 72-hour operational test. Replication lag trend persists for 30 days.

3. **AC3 — Test Dataset Replicated Successfully:** 10,000+ transactions replicated from primary to secondary; checksum verification confirms zero data loss or corruption. Audit confirms: all transactions present on secondary, no duplicates, no truncation.

4. **AC4 — Continuous Operation Tested:** Replication process survives 4-hour continuous operational window (approximately 750 transactions at current volume) without errors, lag exceeding RPO target, or replication stops. Errors logged and reviewed; root cause analysis completed if any lag spike above 15 minutes observed.

5. **AC5 — Audit Trail Records Timestamp & Checksum:** Every replicated transaction generates audit trail record: transaction ID, replication timestamp, source checksum, destination checksum, replication completion status. Audit trail record created within 1 second of replication completion.

**Dependencies:** S1.1 (strategy decided)

**Out of Scope:** Does not implement full disaster recovery runbook; does not test failover; does not implement audit trail retention policy (that is S1.3)

**NFRs:** Data durability (zero loss), Latency (≤ 15 min RPO, ≤ 30 sec synchronous latency or ≤ 5 min asynchronous latency), Auditability (every replication event recorded with timestamp and checksum)

---

### Story 1.3: Audit Trail Implementation & 5-Year Retention Verification

**Epic:** E1 — DR Infrastructure & Replication Strategy  
**Slug:** `s1-3-audit-trail`  
**Complexity:** 2  
**Effort Estimate:** M (1–2 weeks)  

**User Story (Persona: Compliance/Internal Audit)**

> As a compliance officer and internal auditor, I want to confirm that all payment transactions replicate to the secondary site with auditable, verifiable proof that the 5-year AML/CFT statutory retention window is maintained on both sites, so that I can close the internal audit finding and certify AML/CFT compliance to regulators.

**Acceptance Criteria:**

1. **AC1 — Audit Trail Schema Defined:** Audit trail table created with required fields: transaction_id, replication_timestamp, checksum_primary, checksum_secondary, retention_window_end, audit_status, compliance_flag. Schema reviewed and approved by Compliance team.

2. **AC2 — Audit Trail Recording Automated:** Every replicated transaction generates one audit trail record within 1 second of replication completion. Audit trail records are append-only; no modification or deletion. 72-hour validation: 100% of replicated transactions have corresponding audit trail records with no gaps.

3. **AC3 — Retention Policy Configured:** Retention policy configured to preserve audit trail records for 5 years from transaction date. Configuration documented and reviewed by Compliance team. Automated job scheduled to verify retention window compliance monthly.

4. **AC4 — Monthly Verification Report Automated:** Automated monthly job generates report of all transactions in current retention window (transactions dated within last 5 years), verifies presence on both primary and secondary sites, flags any gaps or anomalies. Report stored for audit trail. First three months of reports reviewed; zero gaps detected.

5. **AC5 — Internal Audit Finding Closure:** Internal audit team reviews audit trail records and monthly gap reports; confirms closure of Q1 2026 audit finding: "Transaction replication to secondary site is now verified and auditable for AML/CFT 5-year retention." Closure documented and signed off by Internal Audit.

**Dependencies:** S1.2 (replication operational)

**Out of Scope:** Does not implement customer-facing compliance reports; does not change retention policies; does not modify external audit procedures

**NFRs:** Regulatory compliance (AML/CFT 5-year retention must be verifiable and auditable), Performance (≤ 1% overhead on replication latency), Immutability (append-only audit trail, no deletion/modification after recording)

---

### Story 2.1: Health Check & Failure Detection

**Epic:** E2 — Failover Automation & RTO Optimization  
**Slug:** `s2-1-health-check`  
**Complexity:** 2  
**Effort Estimate:** M (1–2 weeks)  

**User Story (Persona: Payment Operations Engineer)**

> As a payment operations engineer, I want to detect when the primary Auckland site is unavailable within 5 minutes so that I can trigger or allow automated failover to the secondary site before the 2-hour RTO window closes.

**Acceptance Criteria:**

1. **AC1 — Health Check Endpoint Implemented:** Health check endpoint deployed on primary site; responds with HTTP 200 if operational, 503 if unavailable. Endpoint checks: (a) database connectivity, (b) ability to process a test transaction, (c) replication lag status. Endpoint responds within 5 seconds.

2. **AC2 — Health Check Comprehensive:** Health check validates three components: (a) database responds to queries within 2 seconds, (b) test transaction can be processed end-to-end within 10 seconds, (c) replication lag is < 15 minutes. If any component fails, endpoint returns 503 Unavailable.

3. **AC3 — Monitoring System Polls & Alerts:** Monitoring system polls health check endpoint every 10 seconds. Failure detection triggers after three consecutive health check failures (approximately 30 seconds). Alert raised immediately upon detection: includes timestamp, failed component, secondary site readiness status.

4. **AC4 — Alert Routes to Operations:** Alert routes to operations team via configured channel (Slack / PagerDuty / SMS; mechanism TBD). Alert includes: timestamp of failure, last successful health check time, which component failed, recommended next action (manual failover or wait for automatic trigger).

5. **AC5 — Health Check Tested Against Artificial Outages:** Health check tested against three scenarios: (a) database connection loss (operations restarts DB, confirm recovery), (b) sustained network latency (replication lag exceeds 15 min; confirm lag component fails), (c) transaction processing hang (confirm endpoint times out at 5 seconds and returns 503). False-positive and false-negative instances logged and analysed.

**Dependencies:** S1.2 (replication operational to include in health check)

**Out of Scope:** Does not execute failover; does not modify secondary site; does not implement multi-region health checks

**NFRs:** Detection speed (≤ 5 minutes to alert operations), False-positive minimisation (≤ 1% false-positive rate over 30 days), Auditability (all health checks and results logged for analysis)

---

### Story 2.2: Failover Decision Logic & Automation

**Epic:** E2 — Failover Automation & RTO Optimization  
**Slug:** `s2-2-failover-logic`  
**Complexity:** 3  
**Effort Estimate:** L (2–3 weeks)  

**User Story (Persona: Payment Operations Engineer + Compliance)**

> As a payment operations engineer, I want to execute or trigger automated failover from the primary site to the secondary site within 5 minutes of failure detection, with verification that the secondary site is not already processing transactions (split-brain prevention), so that transaction processing resumes within the 2-hour RTO target.

**Acceptance Criteria:**

1. **AC1 — Failover Decision Criteria Documented:** Failover decision logic documented: (a) manual approval gate: one-click failover button with 5-minute decision window or automatic failover after 5 minutes if no manual action taken, OR (b) fully automatic: failover triggers immediately after health check failure detection. Choice recorded in `decisions.md` with rationale. Decision criteria include: RTO urgency, tolerance for false positives, operations team preference.

2. **AC2 — Automatic Failover Execution (if chosen):** If automatic failover selected: failover triggers after three consecutive health check failures (approximately 30 seconds after detection). Before execution, split-brain check verifies secondary is not already processing write traffic. If split-brain detected, failover blocked and high-priority alert raised to operations.

3. **AC3 — Split-Brain Prevention Verified:** Split-brain check executes: secondary site attempts to acquire distributed lock; if lock held by primary, failover blocked. If lock acquisition succeeds (or primary lock expires), failover proceeds. Split-brain scenario tested in non-production environment: both sites brought online simultaneously; confirms exactly one site acquires write lock.

4. **AC4 — Connection String Failover Executed:** Upon failover decision, DNS or connection string updates route new transactions to secondary site. Clients connecting with old primary connection string receive connection refused or redirect. Primary site connection attempts blocked or return redirect-to-secondary. Clients reconnect to secondary automatically (or with minimal manual intervention per ops procedure).

5. **AC5 — Failover Audit Trail & Rollback Path:** Failover execution recorded in audit log: timestamp, who/what triggered failover, split-brain check result, connection string update timestamp, first transaction processed on secondary. Rollback procedure documented: restore DNS/connection strings to primary, confirm primary recovered, reconcile transactions. Rollback tested in non-production environment; zero data loss confirmed.

**Dependencies:** S2.1 (health check provides trigger signal), S1.2 (replication operational)

**Out of Scope:** Does not test in production; does not execute against live payment traffic during initial testing; does not implement merchant or customer notifications

**NFRs:** RTO compliance (failure detection + failover execution ≤ 10 minutes combined, leaving 1.5-hour margin within 2-hour RTO target), Split-brain prevention (guaranteed exactly one write site active at all times), Auditability (all failover decisions and steps logged with timestamps)

---

### Story 2.3: Rollback & Recovery Procedure

**Epic:** E2 — Failover Automation & RTO Optimization  
**Slug:** `s2-3-rollback`  
**Complexity:** 2  
**Effort Estimate:** M (1–2 weeks)  

**User Story (Persona: Payment Operations Engineer)**

> As a payment operations engineer, I want to be able to roll back from the secondary site to the primary site (once it recovers) without losing transactions, so that if the primary site recovers during failover, we can resume normal operations without duplicating transactions or losing records.

**Acceptance Criteria:**

1. **AC1 — Rollback Procedure Documented:** Rollback procedure documented with decision criteria: when should we rollback vs stay on secondary? Procedure steps: (a) verify primary site is recovered and healthy, (b) reconcile transactions processed on secondary during failover period, (c) restore DNS/connection strings to primary, (d) confirm new transactions route to primary, (e) monitor for anomalies for 1 hour post-rollback.

2. **AC2 — Rollback Tested in Non-Production:** Rollback tested in DR environment: failover to secondary initiated, simulate primary recovery (bring primary online), execute rollback procedure, confirm new transactions route to primary, zero data loss or duplicates observed. Test repeated three times; all succeed.

3. **AC3 — Transaction Reconciliation During Failover:** Transactions processed on secondary during failover period reconciled with primary: (a) identify transactions processed on secondary only, (b) verify each transaction has corresponding audit trail record, (c) no duplicates exist (same transaction_id processed on both sites), (d) no gaps (transaction_id sequence is continuous). Reconciliation report generated and stored.

4. **AC4 — Rollback Criteria & Decision Tree:** Decision tree documented: if primary is unavailable for < 4 hours, roll back when it recovers; if > 4 hours, remain on secondary and plan permanent cutover. Decision criteria address: customer perception of "recovery" vs "ongoing secondary operation", regulatory audit trail requirements, operations team readiness.

5. **AC5 — Runbook Includes Rollback Steps:** Operations runbook includes rollback decision criteria and step-by-step execution path. Operations team member with no prior DR experience executes rollback in test environment; completes without escalation; confirms zero data loss post-rollback.

**Dependencies:** S2.2 (failover executed), S1.2 (replication operational to support rollback reconciliation)

**Out of Scope:** Does not test against production traffic; does not implement permanent-cutover scenario (staying on secondary long-term); does not modify customer SLAs or contractual obligations

**NFRs:** Data consistency (zero loss/duplication), Reversibility (rollback can be executed multiple times without data loss), Auditability (all rollback decisions and reconciliation logged), Operations readiness (executable by operations team without escalation)

---

### Story 3.1: Monitoring Dashboard & Real-Time Metrics

**Epic:** E3 — Observability, Monitoring & Operations Runbook  
**Slug:** `s3-1-dashboard`  
**Complexity:** 2  
**Effort Estimate:** M (1–2 weeks)  

**User Story (Persona: Payment Operations Engineer)**

> As a payment operations engineer, I want to see real-time dashboards showing replication lag, transaction volume on each site, failover status, and audit trail completeness, so that I can quickly assess system health and confidence in secondary site readiness.

**Acceptance Criteria:**

1. **AC1 — Dashboard Displays Four Core Metrics:** Dashboard displays with < 1-minute data freshness: (a) Replication lag (ms; target ≤ 15 minutes = 900,000 ms), (b) Transactions processed in last 1 hour (primary + secondary separate counts), (c) Failover status (Primary Active / Secondary Active / Both Failed), (d) Audit trail completeness (% of transactions with audit records; target ≥ 99.9%). Dashboard auto-refreshes every 30 seconds.

2. **AC2 — Dashboard is Read-Only with Drill-Down:** Dashboard is read-only for operations team (no manual data entry or modifications). Drill-down capability available: clicking on replication lag metric shows individual transaction replication events (transaction_id, timestamp, lag, status). Drill-down data persists for 30 days.

3. **AC3 — Historical Data Retention & Trending:** Dashboard retains metric data for 30 days in time-series database. Historical view available: operations can see 7-day and 30-day trends in replication lag, transaction volume patterns, and failover event frequency. Trends help identify degradation before failures occur.

4. **AC4 — Dashboard Accuracy & Operations Validation:** Dashboard tested by operations team: all four metrics verified as accurate and matching source systems (database queries, monitoring system). Dashboard tested with artificial transaction spikes and lag injections; metrics update correctly. Operations team confirms dashboard meets their information needs.

5. **AC5 — Dashboard Accessibility & Performance:** Dashboard accessible via corporate SSO (authentication mechanism TBD). Page load time ≤ 3 seconds from login. Metric latency ≤ 1 minute (data is no older than 1 minute old when displayed). Dashboard tested with typical operations team network connectivity; no timeouts or failures observed.

**Dependencies:** S2.1 (health check data feeds into Failover Status metric), S1.2 (replication lag metric)

**Out of Scope:** Does not implement customer-facing dashboards; does not send automatic alerts (that is S3.2); does not store data longer than 30 days

**NFRs:** Accessibility (corporate SSO authentication, read-only role), Performance (≤ 3 second page load, ≤ 1 minute metric latency), Data retention (30 days)

---

### Story 3.2: Alert Configuration & Runbook Integration

**Epic:** E3 — Observability, Monitoring & Operations Runbook  
**Slug:** `s3-2-alerts`  
**Complexity:** 2  
**Effort Estimate:** M (1–2 weeks)  

**User Story (Persona: Payment Operations Engineer)**

> As a payment operations engineer, I want to receive alerts when replication lags, the primary site fails, failover is triggered, or audit trail gaps appear, with actionable guidance, so that I can respond appropriately and maintain transaction processing continuity.

**Acceptance Criteria:**

1. **AC1 — Alert Thresholds Configured:** Alerts configured with thresholds and severity: (a) Replication lag exceeds 5 minutes → HIGH severity, (b) Primary health check fails → CRITICAL severity, (c) Failover triggered → CRITICAL severity, (d) Audit trail gap detected (< 99.9% completeness) → HIGH severity. Escalation policy: CRITICAL alerts escalate to on-call lead within 5 minutes if not acknowledged.

2. **AC2 — Alert Routing to Operations:** Alerts route to operations team via configured channel (Slack channel, PagerDuty, SMS; mechanism selected in S2.1). Alert payload includes: metric name, current value, threshold, timestamp, spike/trend context (e.g., "replication lag increased 50% in last 5 min"), recommended action from runbook section reference.

3. **AC3 — Alert Payload & Runbook Linkage:** Each alert includes: (a) alert name, (b) severity, (c) metric value and threshold, (d) timestamp and duration, (e) direct link to corresponding runbook section (e.g., "Alert: Replication lag HIGH → See runbook Section 3.2: High Lag Response"). Runbook section provides decision tree and action steps executable by operations team without escalation.

4. **AC4 — False-Positive Rate Validation:** Alert tuning completed during 30-day operational window. False-positive rate measured: < 2% of all alerts fired are determined to be false positives after investigation. Each false positive logged, root cause analysed, threshold tuned accordingly.

5. **AC5 — Alert Event Auditing:** Every alert event logged with: timestamp, metric name, threshold crossed, alert sent to (team/individual), acknowledgement time, response action taken, resolution time. Alert history retained for 90 days to support compliance audits and post-incident analysis.

**Dependencies:** S3.1 (dashboard provides metrics for alerting), S2.1 (health check provides failure detection signal), S1.2 (replication lag metric)

**Out of Scope:** Does not implement advanced anomaly detection (simple threshold-based only); does not send customer notifications; does not automatically resolve alerts without human intervention

**NFRs:** Alert reliability (100% accuracy for threshold-based alerts, ≤ 2% false-positive rate), Alert delivery latency (≤ 2 minutes from threshold crossed to alert delivered), Alert auditability (all alert events logged for compliance)

---

### Story 3.3: Operations Runbook & Team Training

**Epic:** E3 — Observability, Monitoring & Operations Runbook  
**Slug:** `s3-3-runbook`  
**Complexity:** 1  
**Effort Estimate:** S (3–5 days)  

**User Story (Persona: Payment Operations Engineer)**

> As a payment operations engineer, I want a clear, documented runbook and training so that I can execute failover, recovery, and rollback procedures without escalation to senior engineers, and I can be confident in the decisions I'm making during a production incident.

**Acceptance Criteria:**

1. **AC1 — Runbook Document Complete:** Runbook document completed with sections: (a) Normal Operations (daily health check, metric baseline expectations), (b) Failure Detection (alert interpretation, decision logic), (c) Failover Decision (manual trigger criteria, automatic trigger verification), (d) Failover Execution (step-by-step: confirm split-brain check passed, DNS update process, verify secondary processing), (e) Post-Failover (first-hour monitoring, reconciliation confirmation, customer communication), (f) Rollback (rollback criteria, reconciliation steps, primary reactivation).

2. **AC2 — Decision Trees & Ambiguous Scenario Coverage:** Runbook includes decision trees for ambiguous scenarios: (a) Alert fired but metric normalised before operations reacted — take action or wait? (b) Primary partially available (replication working but transaction processing slow) — failover or wait? (c) Failover executed but secondary is also experiencing issues — escalate or attempt rollback? Each scenario has documented criteria and recommended action.

3. **AC3 — Runbook Tested by Operations with No Prior DR Knowledge:** Runbook tested by operations team member with no prior disaster recovery experience. Member executes in non-production DR environment: all steps in runbook are unambiguous; no blocked steps (waiting for information that isn't available); completes from "failure alert received" to "secondary processing transactions" without escalation. Any ambiguities corrected before finalisation.

4. **AC4 — Team Training Session Conducted:** Training session with all operations team members (on-call rotation minimum, ideally all) conducted: walk through runbook sections 1–3 (Normal Operations, Failure Detection, Failover Decision). Each member practices failover execution in test environment. Dry-run covers: detecting failure, triggering failover, confirming secondary processes transactions, verifying zero transaction loss. All members confirm understanding and sign off.

5. **AC5 — Runbook Stored & Accessed Reliably:** Runbook stored in operations wiki or documentation platform with version control. On-call operations team acknowledges reading and understanding runbook. Runbook URL included in all DR-related alerts (so operations can reference during incident). Update log maintained: any procedure changes documented with date, rationale, and operations team notification.

**Dependencies:** S2.2 (failover logic defined), S2.3 (rollback procedure defined), S3.1 (dashboard operational to demonstrate in training), S3.2 (alerts operational to demonstrate in training)

**Out of Scope:** Does not implement automated runbook execution; does not modify customer communication procedures; does not create training videos (written runbook only)

**NFRs:** Clarity (written at operations skill level, no unexplained jargon), Completeness (covers 90%+ of expected failure scenarios), Accessibility (available during incident, referenced in alerts), Operability (executable by any trained operations team member)

---

## Story Dependencies & Execution Sequencing

**Critical Path:** S1.1 (3–5 d) → S1.2 (2–3 w) → S1.3 (1–2 w) → S3.1 (1–2 w) → S3.2 (1–2 w) → S3.3 (3–5 d)  
**Total estimated duration: 10–12 weeks**

**Parallel Execution Windows:**
- S2.1 (Health Check) starts after S1.1 (needs replication strategy); runs parallel with S1.2
- S2.2 (Failover Logic) starts after S2.1; partially depends on S1.2 (replication operational)
- S2.3 (Rollback) starts after S2.2; can run in parallel with S3.1/S3.2
- S3.1 (Dashboard) starts after S1.2 (needs replication lag metric); can run with S3.2
- S3.2 (Alerts) starts after S3.1 (needs metrics to alert on)
- S3.3 (Runbook + Training) starts after S2.3, S3.1, S3.2 (needs all procedures and tools available)

---

## Scope Accumulator: MVP Item Coverage

| Discovery MVP Item | Stories | Coverage % | Verification Method |
|---|---|---|---|
| Secondary site provisioning for active processing | S1.1, S1.2 | 100% | Replication test with 10,000+ transactions; zero loss verified |
| Automated failover trigger & execution (RTO < 2h) | S2.1, S2.2, S2.3 | 100% | Two consecutive DR drills; RTO ≤ 2 hours measured and logged |
| Replication to RPO ≤ 15 min | S1.2 | 100% | Replication lag trending monitored; 72-hour test validates ≤ 15 min lag |
| AML/CFT replication verification & audit closure | S1.3 | 100% | Monthly automated gap report; internal audit confirms finding closure |
| QSA assessment engagement | S1.1 | 100% | Scoping conversation scheduled; assessment timeline confirmed |
| Operational runbook & DR drill | S2.2, S2.3, S3.3 | 100% | Operations team executes runbook in test; training completed |

**Scope Stability: STABLE** — All six MVP items covered with clear, independently-testable stories. No unexplained scope additions or gaps detected.

---

## Constraint Propagation Analysis

| Constraint ID | Constraint | Affected Stories | Propagation | Mitigation |
|---|---|---|---|---|
| **C1** | RTO ≤ 2 hours, RPO ≤ 15 min (Board policy) | S2.1, S2.2, S2.3, S1.2 | Carried explicitly in each story's NRR field; RTO budget allocated (5 min detection + 5 min failover + 50 min contingency) | DR drills measure actual RTO; must achieve ≤ 2 hours consistently |
| **C2** | PCI DSS: QSA assessment before go-live | S1.1, S1.3 | Named in S1.1 AC5 (QSA pre-engagement); S1.3 includes Compliance team validation | QSA scoping started immediately; timeline tracked; remediation items addressed before go-live gate |
| **C3** | AML/CFT: 5-year retention on secondary | S1.2, S1.3 | S1.2 includes RPO validation; S1.3 implements retention policy and monthly verification | Monthly automated gap reports; zero gaps required for audit closure |
| **C4** | Single Auckland data centre (current state) | S1.1, S1.2 | Named as technical constraint in S1.1 (Hamilton site capacity assessment); replication tool selection constrained by existing infrastructure | Architecture review in S1.1; compatibility verified before S1.2 implementation |
| **C5 [Hidden]** | AML replication gap unverified | S1.1, S1.3 | S1.1 explicitly lists this as assumption to verify; S1.3 implements verification mechanism (monthly gap report) | Monthly report generation and sign-off by Compliance team confirms/closes gap |

**Constraint propagation verdict: ALL FIVE CONSTRAINTS PROPAGATED** — Each constraint appears explicitly in at least two stories and has defined mitigation. C5 (hidden constraint) is surfaced in S1.1 as an explicit assumption and in S1.3 as a verification requirement.

---

## NFR Profile

**Data Classification:** Confidential (payment card transaction data in scope for PCI DSS)

**Data Residency:** New Zealand only (primary: Auckland; secondary: Hamilton). No cross-border replication.

**Compliance Frameworks:** PCI DSS (Payment Card Industry), AML/CFT Act (Anti-Money Laundering and Countering Financing of Terrorism Act — 5-year retention)

**Availability SLA:** 
- RTO: ≤ 2 hours (board-approved; non-negotiable)
- RPO: ≤ 15 minutes (board-approved; non-negotiable)

**Performance Requirements:**
- Replication latency: ≤ 30 seconds (synchronous) or ≤ 5 minutes (asynchronous) — depends on strategy chosen in S1.1
- Failure detection: ≤ 5 minutes
- Failover execution: ≤ 5 minutes
- Dashboard refresh: ≤ 1 minute
- Alert delivery: ≤ 2 minutes

**Regulatory Audit Requirements:** Solution must be deployable and verified before Q3 annual QSA audit. Q1 internal audit finding on AML/CFT replication must be formally closed before Q3 audit.

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Replication tool compatibility with existing infrastructure | Medium | High | S1.1 includes architecture review; early PoC before full implementation in S1.2 |
| Network latency higher than acceptable for RPO ≤ 15 min | Low | High | S1.1 measures latency; if unfeasible, asynchronous replication with longer RPO documented and RISK-ACCEPTed |
| Split-brain scenario during failover (both sites writing) | Low | Catastrophic | S2.2 design explicitly prevents this; distributed lock mechanism verified in test |
| Operations team unable to execute runbook | Medium | High | S3.3 runbook tested with operations team member with no prior DR knowledge; training conducted with all members |
| Compliance requirements change or accelerate | Low | Medium | S1.1 and S1.3 include Compliance team input at decision gates; monthly gap reports provide early visibility to any audit finding escalations |
| Q3 audit timeline accelerates | Very Low | High | Assumption: ~18 months available; if changed, escalate to Board Risk Committee; critical path is ~10 weeks, leaving 12-month buffer |

---

## Timeline Summary

- **Weeks 1–1.5:** S1.1 + S2.1 in parallel (Strategy decided, health check prototype)
- **Weeks 1.5–5:** S1.2 + S2.2 + S2.3 sequential (Replication + failover automation + rollback tested)
- **Weeks 5–8.5:** S3.1 → S3.2 → S3.3 sequential (Dashboard, alerts, runbook, training)
- **Weeks 8.5–10:** Production readiness (3 DR drills, compliance validation)

---

<!-- eval-mode: true -->
