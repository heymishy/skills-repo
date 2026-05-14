# Definition: Disaster Recovery RTO + AML/CFT Compliance

**Feature Slug:** 2026-05-14-dr-rto-compliance-modernisation  
**Feature Name:** Disaster Recovery RTO + AML/CFT Compliance Modernisation  
**Date Created:** 2026-05-14  
**Status:** Ready for Benefit-Metric  
**Author:** Copilot (structured definition from approved discovery)  

---

## Feature Overview

This feature closes two interconnected production gaps:
1. **RTO Violation:** Current DR failover exceeds board-approved 2-hour Recovery Time Objective, costing $420K/hour in lost transaction volume and regulatory penalties
2. **AML/CFT Compliance Gap:** Transaction replication to secondary site lacks auditable verification for 5-year retention window, exposing organisation to regulatory enforcement action

The solution modernises DR infrastructure, implements real-time replication with audit trails, automates failover to meet RTO targets, and introduces observability to enable operations team execution with confidence.

---

## Epic Definitions

### Epic 1: DR Infrastructure & Replication Strategy
**Slug:** `e1-dr-infra-replication`  
**Priority:** P1 (enables all downstream work)  
**Complexity:** 3 (architectural changes, new tooling integration, regulatory validation)  

**Objective:** Establish a robust, auditable replication mechanism that guarantees zero transaction loss and demonstrates 5-year AML/CFT compliance across primary and secondary sites.

**Success Criteria:**
- Transaction records replicate to secondary site within defined RPO (Recovery Point Objective)
- Audit trail records replication event for every transaction with timestamp and checksum
- Internal audit confirms closure of Q1 2026 compliance finding
- Zero transaction loss observed in simulated failover test

---

### Epic 2: Failover Automation & RTO Optimization
**Slug:** `e2-failover-automation-rto`  
**Priority:** P1 (directly addresses RTO SLA)  
**Complexity:** 3 (automation logic, split-brain prevention, failure mode handling)  

**Objective:** Automate or streamline the failover procedure from primary to secondary site to achieve the 2-hour RTO target, with documented decision points and rollback capability.

**Success Criteria:**
- RTO measured in controlled drill: < 2 hours from failure detection to transaction resumption
- Three consecutive successful DR drills with consistent sub-2-hour RTO
- Zero unintended transaction duplicates or losses during failover
- Rollback executed successfully without data loss in test scenario

---

### Epic 3: Observability, Monitoring & Operations Runbook
**Slug:** `e3-observability-runbook`  
**Priority:** P1 (operationalisation)  
**Complexity:** 2 (well-understood observability patterns, integration with existing monitoring)  

**Objective:** Enable operations team to detect failures, monitor replication health, execute failover, and track completion with real-time dashboards, alerts, and documented procedures.

**Success Criteria:**
- Dashboard displays all four metrics with < 1-minute data freshness
- Alerts fire correctly and are actionable by operations team
- Runbook executed successfully by operations team member with no escalation
- Replication lag data retained for post-incident analysis and compliance audits
- Zero missing data points in 30-day operational window

---

## Story Breakdown

### Story 1.1: Replication Strategy Assessment & Decision

**Epic:** E1 — DR Infrastructure & Replication Strategy  
**Slug:** `s1-1-replication-strategy`  
**Complexity:** 2  
**Effort:** M (3–5 days ops + decision)  

**Acceptance Criteria:**

1. **AC1:** Replication strategy options documented (synchronous, asynchronous, hybrid) with latency, RPO, and compliance tradeoffs for each
2. **AC2:** Current network latency between primary and secondary sites measured and recorded
3. **AC3:** Current transaction volume (TPS and daily count) measured and documented
4. **AC4:** Replication lag targets calculated for each option, aligned with 5-year AML/CFT retention requirement
5. **AC5:** Decision made and recorded in `decisions.md` with rationale: chosen strategy, why alternatives rejected, RISK-ACCEPTs for any regulatory/latency concerns

**NFRs:** Regulatory alignment with AML/CFT, Performance (sub-2-hour RTO support), Auditability of all replication events

---

### Story 1.2: Replication Implementation (Synchronous/Asynchronous Selection)

**Epic:** E1 — DR Infrastructure & Replication Strategy  
**Slug:** `s1-2-replication-impl`  
**Complexity:** 3  
**Effort:** L (2–3 weeks)  

**Acceptance Criteria:**

1. **AC1:** Chosen replication technology installed and configured for transaction database
2. **AC2:** Replication lag monitored in real-time; metric exported to observability platform
3. **AC3:** Test dataset (10,000 transactions) replicated; checksum verification confirms zero data loss
4. **AC4:** Replication process survives 4-hour continuous operational window without errors
5. **AC5:** Audit trail records: timestamp, transaction ID, checksum, replication completion status

**NFRs:** Data durability (zero loss), Latency (≤30s sync or ≤5min async), Auditability of all replicated records

---

### Story 1.3: Audit Trail Implementation & 5-Year Retention Configuration

**Epic:** E1 — DR Infrastructure & Replication Strategy  
**Slug:** `s1-3-audit-trail`  
**Complexity:** 2  
**Effort:** M (1–2 weeks)  

**Acceptance Criteria:**

1. **AC1:** Audit trail table created with schema: transaction_id, replication_timestamp, checksum, retention_window_end, audit_status
2. **AC2:** Every replicated transaction generates audit trail record within 1 second of replication
3. **AC3:** Retention policy configured to preserve audit trail records for 5 years from transaction date
4. **AC4:** Automated monthly job: generates report of all transactions in current retention window, verifies presence on both sites, flags any gaps
5. **AC5:** Gap report reviewed and signed off by Compliance team; zero gaps detected in first three months

**NFRs:** Regulatory compliance, Performance (≤1% overhead), Immutability (append-only)

---

### Story 2.1: Health Check & Failure Detection

**Epic:** E2 — Failover Automation & RTO Optimization  
**Slug:** `s2-1-health-check`  
**Complexity:** 2  
**Effort:** M (1–2 weeks)  

**Acceptance Criteria:**

1. **AC1:** Health check endpoint implemented on primary site; responds with HTTP 200 if operational
2. **AC2:** Health check includes: database connectivity, transaction processing capability, replication lag status
3. **AC3:** Monitoring system polls health check every 10 seconds; failure detection (three consecutive failures) within ~30 seconds
4. **AC4:** Alert raised within 5 minutes of primary site failure; includes timestamp, reason, secondary site readiness status
5. **AC5:** Health check tested with artificial outages; false negatives and false positives logged

**NFRs:** Detection speed (within 5 min), False-positive minimisation, Auditability of all health check results

---

### Story 2.2: Failover Decision Logic & Automation

**Epic:** E2 — Failover Automation & RTO Optimization  
**Slug:** `s2-2-failover-logic`  
**Complexity:** 3  
**Effort:** L (2–3 weeks)  

**Acceptance Criteria:**

1. **AC1:** Failover decision logic documented: manual approval gate vs automatic trigger; if manual, decision window is < 5 minutes
2. **AC2:** If automated: failover triggers automatically after three consecutive health check failures; if manual: one-click failover button for ops
3. **AC3:** Before failover executes: split-brain check verifies secondary site is not already accepting write traffic
4. **AC4:** Failover executes: DNS/connection string updates route transactions to secondary site; primary connection attempts blocked or redirected
5. **AC5:** Failover completion recorded in audit log with timestamp; rollback procedure documented and tested

**NFRs:** RTO compliance (< 5 min execution + detection), Split-brain prevention, Auditability of all failover decisions and steps

---

### Story 2.3: Rollback & Recovery Procedure

**Epic:** E2 — Failover Automation & RTO Optimization  
**Slug:** `s2-3-rollback`  
**Complexity:** 2  
**Effort:** M (1–2 weeks)  

**Acceptance Criteria:**

1. **AC1:** Rollback procedure documented: restore DNS/connection strings to primary, verify primary operational, confirm transaction consistency
2. **AC2:** Rollback tested in non-production DR environment: failover to secondary, simulate primary recovery, rollback to primary, verify zero data loss
3. **AC3:** Rollback executed successfully in test; transactions on secondary during failover reconciled with primary (no duplicates or losses)
4. **AC4:** Rollback decision criteria documented: when is rollback appropriate vs staying on secondary?
5. **AC5:** Runbook includes rollback steps; operations team executes with no escalation

**NFRs:** Data consistency (zero loss/duplication), Reversibility (can be executed and reversed)

---

### Story 3.1: Monitoring Dashboard & Real-Time Metrics

**Epic:** E3 — Observability, Monitoring & Operations Runbook  
**Slug:** `s3-1-dashboard`  
**Complexity:** 2  
**Effort:** M (1–2 weeks)  

**Acceptance Criteria:**

1. **AC1:** Dashboard displays four metrics with < 1-minute freshness: Replication lag, Transaction volume per site, Failover status, Audit trail completeness
2. **AC2:** Dashboard is read-only for operations team; drill-down available for individual transaction replication events
3. **AC3:** Dashboard persists data for 30 days; historical view shows replication lag trend
4. **AC4:** Dashboard tested by operations team; all four metrics accurate and updateable without manual refresh

**NFRs:** Accessibility (corporate SSO), Performance (≤3s page load, ≤1min metric latency)

---

### Story 3.2: Alert Configuration & Runbook Integration

**Epic:** E3 — Observability, Monitoring & Operations Runbook  
**Slug:** `s3-2-alerts`  
**Complexity:** 2  
**Effort:** M (1–2 weeks)  

**Acceptance Criteria:**

1. **AC1:** Alerts configured with thresholds: Replication lag exceeds 5 min (HIGH), Primary health fails (CRITICAL), Failover triggered (CRITICAL), Audit trail gap detected (HIGH)
2. **AC2:** Alerts route to operations team via existing incident channel (PagerDuty/Slack/email; mechanism TBD)
3. **AC3:** Alert payload includes metric value, threshold, timestamp, recommended next action from runbook
4. **AC4:** False-positive rate < 2% in 30-day operational window; all false positives logged and tuned
5. **AC5:** Each alert links to corresponding runbook section for ops team execution without escalation

**NFRs:** Alert reliability (100% accuracy for thresholds, ≤2min delivery latency), Auditability of all alert events

---

### Story 3.3: Operations Runbook & Team Training

**Epic:** E3 — Observability, Monitoring & Operations Runbook  
**Slug:** `s3-3-runbook`  
**Complexity:** 1  
**Effort:** S (3–5 days)  

**Acceptance Criteria:**

1. **AC1:** Runbook document completed with sections: Normal Operations, Failure Detection, Failover Decision, Failover Execution, Post-Failover, Rollback
2. **AC2:** Runbook includes decision trees for ambiguous scenarios
3. **AC3:** Runbook tested: operations team member with no prior DR experience executes in test environment; all steps clear, result in successful failover
4. **AC4:** Training session conducted: ops team walks through runbook, practices failover in test environment, zero gaps or errors
5. **AC5:** Runbook stored in operations wiki with version control; on-call ops team acknowledges reading and understanding

**NFRs:** Clarity (written at ops skill level), Completeness (covers 90%+ of expected failure scenarios)

---

## Story Dependencies & Sequencing

**Critical Path:** S1.1 (3–5 d) → S1.2 (2–3 w) → S1.3 (1–2 w) → S3.1 (1–2 w) → S3.2 (1–2 w) → S3.3 (3–5 d)  
**Total: ~10–12 weeks**

**Parallel Work:**
- S2.1 starts after S1.1, runs parallel with S1.2
- S2.2 starts after S2.1, partially blocked by S1.2
- S2.3 starts after S2.2, runs parallel with S3.1/S3.2

---

## Scope Accumulator: Mapping to Discovery MVP

| Discovery MVP Item | Stories | Coverage | Verification |
|---|---|---|---|
| RTO Verification (< 2 hours) | E2 (S2.1, S2.2, S2.3) | Full | Three consecutive DR drills with RTO measured and logged |
| AML/CFT Replication Verification (5-year retention) | E1 (S1.2, S1.3) | Full | Monthly automated gap report; zero gaps in first 3 months |
| Runbook & Automation | E2 (S2.2, S2.3), E3 (S3.3) | Full | Operations team executes runbook in test with no escalation |
| Observability (monitoring, alerting, dashboards) | E3 (S3.1, S3.2, S3.3) | Full | Dashboard tested; alerts accurate with <2% false-positive rate |

**Scope Stability:** Stable — All MVP items covered with clear ACs and no gaps.

---

## Constraint Propagation Analysis

| Constraint | Affected Stories | Propagation | Mitigation |
|---|---|---|---|
| **AML/CFT 5-year retention** | S1.2, S1.3 | Replication must preserve all records; audit trail must be comprehensive | Compliance team input on schema; monthly gap reports |
| **RTO < 2 hours** | S2.1, S2.2, S2.3 | Failure detection < 5 min, failover execution < 5 min | RTO budget allocated; DR drills test actual RTO |
| **Operations team skill level** | S3.3, S2.2, S3.1 | Runbook must be clear; decision logic unambiguous; dashboard intuitive | Runbook tested with inexperienced ops; training conducted |
| **Existing infrastructure** | S1.2, S2.1, S2.2 | Replication tool compatible; health check integrates existing monitoring; failover uses existing mechanisms | Architecture team approval; compatibility review |
| **Regulatory audit cycle** | All stories | Solution deployed and verified before next audit (~18 months) | Critical path ~10–12 weeks; leaves 12-month buffer |

---

## Timeline & Delivery Sequencing

**Phase 1 (Weeks 1–1.5):** S1.1, S2.1 in parallel — Replication strategy decided; health check implemented

**Phase 2 (Weeks 1.5–5):** S1.2, S2.2, S2.3 in sequence — Replication implementation; failover automation; rollback tested

**Phase 3 (Weeks 5–8.5):** S3.1 → S3.2 → S3.3 — Dashboard deployed; alerts configured; runbook and training completed

**Phase 4 (Weeks 8.5–10):** Production readiness — Three DR drills; compliance validation; board briefing

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Replication tool compatibility | Medium | High | Architecture review in S1.1; early PoC before full implementation |
| Higher-than-expected network latency | Low | High | Network latency measured in S1.1; RISK-ACCEPT in decision gate |
| Split-brain during failover | Low | Catastrophic | S2.2 design addresses this; DR drills test scenario |
| Operations team unable to execute runbook | Medium | High | Runbook tested with inexperienced ops; training conducted |
| Compliance requirements change | Low | Medium | Compliance input at S1.1, S1.3 gates; monthly gap reports |
| Audit timeline accelerates | Very Low | High | Assumption: ~18 months buffer; escalate if changed |

---

## Out-of-Scope (Phase 2 Candidates)

1. Customer-facing communications during DR events
2. Geo-distributed DR beyond primary/secondary pair
3. Active-active load balancing
4. Third-party integration failover
5. Executive dashboarding / role-specific views
6. Automated remediation (current: alert + manual action)
7. Data retention policies beyond AML/CFT

---

## Success Criteria Summary

Feature Success = All ACs Met + Operational Validation:

1. ✓ RTO Target Met: Three consecutive DR drills with failover < 2 hours
2. ✓ AML/CFT Compliance Closed: Internal audit confirms Q1 2026 finding resolved; 5-year retention audit trail verified
3. ✓ Operations Readiness: Operations team executes runbook end-to-end with no escalation
4. ✓ Zero Data Loss: Replication verified to have zero transaction loss in test failover
5. ✓ Observability: Real-time dashboard shows all metrics; alerts accurate with < 2% false-positive rate

---

<!-- eval-mode: true -->
