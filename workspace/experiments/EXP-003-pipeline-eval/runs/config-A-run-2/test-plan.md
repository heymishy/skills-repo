# Test Plan: Payment Authorisation Service Secondary-Site Failover

**Feature:** Payment Authorisation Service Secondary-Site Failover
**Run:** config-A-run-2
**Date:** 2026-05-16
**Author:** Copilot (claude-sonnet-4-6, eval-mode Config A run 2, EXP-003-pipeline-eval)
**Review status:** PASS (Run 1, 2026-05-16) — 0 HIGH, 4 MEDIUM (acknowledged)
**Stories covered:** S1.1, S1.2, S1.3, S2.1, S2.2, S3.1, S3.2

---

## Entry Conditions

✅ Review PASS confirmed (review.md, 2026-05-16)
✅ 7 stories with ACs in Given/When/Then format
✅ 0 unresolved HIGH findings

---

## Test Context

**Test runner:** Eval mode — this is an infrastructure and compliance-focused feature. Tests are categorised as:
- **Unit tests:** Isolated logic verification (idempotency, alerting thresholds, log format)
- **Integration tests:** System-level behaviour verification (replication lag measurement, failover execution timing)
- **NFR tests:** Non-functional requirement verification (compliance, encryption, retention)
- **Human verification scenarios:** AC outcomes that require human/audit evidence (process gates, board approval, QSA assessment)

**TDD discipline:** All tests below are written to FAIL before implementation. Red state is the correct initial state for each test.

---

## Test Data Strategy

**Strategy:** Synthetic + mocked external services

All tests use synthetic transaction data — no real cardholder data, PANs, or account numbers in any test fixture.

**Rationale for payment card systems (PCI DSS):**
- Transaction records contain cardholder data (PANs) — real data in test environments would extend PCI DSS scope to the test environment itself
- Synthetic transactions (generated with UUID transaction IDs, masked card tokens, synthetic amounts) cover all replication and failover behaviour without expanding CDE scope
- Idempotency tests use synthetic transaction IDs generated in test setup
- Performance/load tests (replication lag, failover timing) use load generators with synthetic profiles

**Test data responsibility:** Self-contained — all tests generate their own synthetic data in setup/teardown. No dependency on a shared test data set or de-identified production extract.

---

## Output 1 — Technical Test Plan

### S1.1: Hamilton Secondary Site Provisioning

**Test ID: T1.1.1**
Type: Human verification / Inspection
AC: S1.1 AC1 (Capacity baseline report)
State: FAIL until capacity baseline report is produced and covers all required fields

```
GIVEN the Hamilton site assessment is complete
WHEN the capacity baseline report is reviewed
THEN the report MUST contain all of the following fields (fail if any absent):
  - available_compute_profile (CPU cores, RAM, storage IOPS)
  - power_cooling_headroom (rated capacity vs estimated load)
  - network_bandwidth_measured (bi-directional throughput, not estimated)
  - round_trip_latency_peak (ms, measured under production-equivalent load)
  - round_trip_latency_offpeak (ms)
  - go_nogo_recommendation (text: "GO" or "NO-GO" with rationale)
FAIL: any field absent, or go/no-go recommendation absent
```

---

**Test ID: T1.1.2**
Type: Human verification / Inspection
AC: S1.1 AC2 (PCI DSS scope document)
State: FAIL until PCI DSS scope document references specific PCI DSS Requirement numbers

```
GIVEN the PCI DSS scope impact document is produced
WHEN the document is reviewed by the security and compliance team
THEN the document MUST reference:
  - PCI DSS Requirement 1 (network controls) — explicitly named
  - PCI DSS Requirement 7 (restrict access to system components) — explicitly named
  - PCI DSS Requirement 10 (log and monitor all access) — explicitly named
  - A QSA scoping effort estimate (days or weeks)
  - Whether any pre-existing deficiencies are identified
FAIL: any named PCI DSS requirement absent; QSA estimate absent
```

---

**Test ID: T1.1.3**
Type: Human verification / Integration
AC: S1.1 AC3 (Provisioning runbook)
State: FAIL until provisioning completion report confirms network segmentation, access controls, and replication readiness

```
GIVEN provisioning activities are executed at the Hamilton site
WHEN the provisioning completion report is reviewed
THEN the report MUST confirm:
  - network_segmentation_applied: true
  - access_controls_applied: true
  - audit_logging_configured: true
  - secondary_site_replication_ready: true (Hamilton ready to accept replication from Auckland)
FAIL: any field false or absent
```

---

### S1.2: Continuous Data Replication (RPO ≤ 15 Minutes)

**Test ID: T1.2.1**
Type: Integration / Performance
AC: S1.2 AC1 (Replication lag measurement — mean and P99)
State: FAIL until replication lag meets RPO targets under production-equivalent load

```
GIVEN continuous replication is operating under production-equivalent load (180,000 txn/day synthetic)
WHEN replication lag is sampled every 60 seconds over a 72-hour observation window
THEN:
  - mean_lag_minutes MUST be < 5
  - p99_lag_minutes MUST be < 15
  - max_lag_minutes in 72-hour window MUST be < 15
FAIL: any threshold exceeded
```

---

**Test ID: T1.2.2**
Type: Integration / DR simulation
AC: S1.2 AC2 (RPO validation via simulated primary failure)
State: FAIL until simulated failure delta consistently ≤ 15 min across 3 time slots

```
GIVEN continuous replication is operating
WHEN a simulated primary site failure is triggered (controlled test)
THEN for each of 3 simulated failures (peak, mid-day, off-peak):
  - t_failure: timestamp of last committed transaction on Auckland primary
  - t_hamilton: earliest available transaction state on Hamilton secondary
  - delta = t_failure - t_hamilton MUST be <= 15 minutes
FAIL: any delta > 15 minutes, OR fewer than 3 simulated failures executed
```

---

**Test ID: T1.2.3**
Type: Integration / Resilience
AC: S1.2 AC1 (Replication self-recovery after network interruption)
NFR: Replication must survive 10-minute network interruption and self-recover

```
GIVEN continuous replication is operating
WHEN network connectivity between Auckland and Hamilton is interrupted for exactly 10 minutes
THEN:
  - replication resumes automatically within 5 minutes of network restoration
  - no manual intervention required (no human trigger in execution log)
  - replication resumes from interruption point (no duplicate transactions; no transactions missed)
  - replication_recovery_type = "auto" in execution log (not "manual")
FAIL: any manual intervention logged; resumption delayed > 5 min; transactions duplicated or missed
```

---

**Test ID: T1.2.4**
Type: Integration / Audit
AC: S1.2 AC3 (Transaction record completeness)
State: FAIL until 30-day reconciliation shows ≤ 0.001% gap rate

```
GIVEN continuous replication has been operating for minimum 30 days
WHEN the transaction reconciliation audit runs (Auckland primary log vs Hamilton secondary log)
THEN:
  - gap_rate = (missing_at_secondary / total_primary) MUST be <= 0.001%
  - any gap is traceable to a specific time window with documented cause
  - reconciliation_methodology is documented in the audit report
FAIL: gap_rate > 0.001%; any unexplained gap; reconciliation methodology absent
```

---

**Test ID: T1.2.5**
Type: Unit / Alert
AC: S1.2 AC4 (Replication monitoring dashboard and alert)
State: FAIL until monitoring dashboard contains required fields and alert fires correctly

```
GIVEN the replication monitoring dashboard is deployed
WHEN current replication lag exceeds 10 minutes
THEN:
  - an automated alert fires within 60 seconds of the 10-minute threshold being crossed
  - alert payload contains: current_lag_minutes, threshold_minutes, timestamp
  - alert is delivered to the operations team monitoring channel (not discarded)
WHEN current lag is <= 10 minutes:
  - no alert fires

FAIL: alert does not fire when lag > 10 min; alert fires when lag <= 10 min (false positive); missing alert fields
```

---

**Test ID: T1.2.6**
Type: Unit / Dashboard
AC: S1.2 AC4 (Monitoring dashboard content)
State: FAIL until dashboard displays all 5 required data elements

```
GIVEN the replication monitoring dashboard is rendered
WHEN an observer inspects the dashboard
THEN the following elements MUST all be present and non-null:
  - current_replication_lag (updated within last 60 seconds)
  - 24h_lag_trend (P50, P95, P99 values)
  - alert_history (last 7 days minimum)
  - replication_throughput_txns_per_second
  - last_full_consistency_timestamp
FAIL: any element absent; current_lag not updated within 60 seconds; last_consistency_timestamp older than RPO window
```

---

**Test ID: T1.2-C2**
Type: NFR / Compliance (PCI DSS)
AC: S1.2 Architecture Constraints — C2 (PCI DSS replication channel encryption)
State: FAIL until replication traffic encryption is verified

```
GIVEN the replication channel between Auckland and Hamilton is operational
WHEN replication traffic is captured via network inspection (test environment)
THEN:
  - all_traffic_encrypted = true (TLS 1.2 minimum)
  - plaintext_cardholder_data_in_transit = false
  - tls_version: "TLSv1.2" or "TLSv1.3" (not "TLSv1.0", "TLSv1.1", or unencrypted)
FAIL: any unencrypted replication traffic; TLS version below 1.2
```

---

**Test ID: T1.2-C3**
Type: NFR / Compliance (AML/CFT Act)
AC: S1.2 Architecture Constraints — C3 (AML/CFT retention window)
State: FAIL until retention mechanism confirms no expiry or deletion at secondary site within 5-year window

```
GIVEN the replication mechanism is operational
WHEN the secondary site data retention configuration is inspected
THEN:
  - retention_policy_at_hamilton MUST specify minimum 5 years (1825 days)
  - auto_deletion_before_5_years = false
  - any maintenance window data gap = false OR any gap period documented with recovery evidence
FAIL: retention policy < 5 years; auto-deletion configured; undocumented gap
```

---

**Test ID: T1.2-C5**
Type: NFR / Audit evidence (AML replication gap closure)
AC: S1.2 Architecture Constraints — C5 (AML replication gap verification)
State: FAIL until reconciliation methodology produces auditable output

```
GIVEN the 30-day transaction reconciliation has been run (T1.2.4)
WHEN the reconciliation output is reviewed for AML audit purposes
THEN:
  - reconciliation_log_format = "auditable" (timestamps, transaction IDs, gap descriptions)
  - reconciliation_log_retention_years >= 7 (AML/CFT audit record retention)
  - gap_evidence_traceable = true (any gap has a documented cause, not "unknown")
FAIL: reconciliation log not in auditable format; retention < 7 years; unexplained gaps
```

---

### S1.3: AML/CFT Replication Verification and Audit Closure

**Test ID: T1.3.1**
Type: Human verification / Inspection
AC: S1.3 AC1 (AML/CFT retention verification report)
State: FAIL until verification report meets all documented criteria

```
GIVEN the AML/CFT retention verification report is produced
WHEN the report is reviewed by the security and compliance team lead
THEN the report MUST contain:
  - gap_rate_confirmation (citing T1.2.4 reconciliation — <= 0.001%)
  - retention_window_statement ("transaction records are retained for minimum 5 years at Hamilton")
  - maintenance_window_documentation (any gap periods documented with recovery procedures)
  - compliance_team_lead_signoff (dated signature or electronic approval)
FAIL: any required element absent; gap_rate not cited from T1.2.4; signoff missing
```

---

**Test ID: T1.3.2**
Type: Human verification / Process
AC: S1.3 AC2 (Internal audit finding formally closed)
State: FAIL until audit finding is marked closed with complete evidence package

```
GIVEN the AML/CFT retention verification report is signed off
WHEN the internal audit team reviews the evidence package
THEN:
  - audit_finding_status = "closed" in internal audit register
  - evidence_package_complete = true (S1.2 monitoring data + reconciliation report + verification report + compliance signoff)
  - closure_confirmation_written = true (internal audit team provides written confirmation)
  - closure_confirmation_date < Q3_QSA_audit_date
FAIL: finding remains open; evidence package incomplete; closure after Q3 audit date
```

---

**Test ID: T1.3.3**
Type: Human verification / Governance
AC: S1.3 AC3 (Board Risk Committee notification)
State: FAIL until Board agenda confirms AML/CFT finding closure

```
GIVEN the internal audit finding is closed
WHEN the Board Risk Committee receives the quarterly governance report
THEN:
  - brc_agenda_includes_amlcft_closure = true
  - agenda_item_references_finding_id = true
  - agenda_item_includes_closure_date = true
  - brc_minutes_record_acknowledgement = true
FAIL: BRC agenda does not include closure item; minutes do not record acknowledgement
```

---

### S2.1: Automated Failover Trigger and Execution

**Test ID: T2.1.1**
Type: Integration / Detection
AC: S2.1 AC1 (Automated failure detection within 5 minutes)
State: FAIL until automated detection verified without manual intervention

```
GIVEN the Auckland primary site monitoring is operational
WHEN a simulated failure condition is introduced (network failure, health check failure)
THEN:
  - detection_time_from_failure_onset MUST be <= 5 minutes
  - detection_trigger = "automated" (not "manual" or "operator-initiated")
  - detection_timestamp logged in execution log
  - failover_initiation_sequence triggered automatically
FAIL: detection > 5 min; manual trigger required; execution log missing detection entry
```

---

**Test ID: T2.1.2**
Type: Integration / Performance
AC: S2.1 AC2 (Failover execution within 90 minutes)
State: FAIL until end-to-end failover execution completes within RTO headroom

```
GIVEN failover initiation sequence has been triggered (automated or manual test trigger)
WHEN the automated execution sequence runs
THEN:
  - t_execution = timestamp from trigger to "Hamilton processing transactions" state
  - t_execution MUST be <= 90 minutes
  - execution_log contains timestamp + outcome for every step (no gaps in log)
  - operations_team_alert sent with current execution status before t = 30 min elapsed
FAIL: t_execution > 90 min; any step missing from execution log; alert not sent
```

---

**Test ID: T2.1.3**
Type: Unit / Idempotency
AC: S2.1 AC3 (Duplicate authorisation prevention during failover)
State: FAIL until duplicate request handling is verified

```
GIVEN Hamilton is processing transactions after failover
WHEN the same transaction_id is submitted twice within the same settlement window
THEN:
  - only one authorisation result is returned
  - the second request returns the same authorisation_reference as the first
  - no duplicate entries appear in the Hamilton transaction log for the same transaction_id
GIVEN a transaction was committed on Auckland primary within the RPO window
WHEN the same transaction arrives at Hamilton after failover
THEN:
  - the transaction is NOT reprocessed as a new transaction
  - the existing authorisation record is returned
FAIL: duplicate authorisation returned; second submission triggers new processing; RPO-window transactions reprocessed
```

---

**Test ID: T2.1.4**
Type: Unit / Security control
AC: S2.1 AC4 (Two-person authorisation for manual trigger)
State: FAIL until two-person requirement is enforced

```
GIVEN the manual failover trigger capability is configured
WHEN a single operator attempts to initiate a manual failover without a second authoriser
THEN:
  - manual trigger is rejected
  - rejection reason = "second_authorisation_required"
  - no failover sequence is initiated
WHEN two operators authorise a manual trigger
THEN:
  - trigger is accepted
  - both operator identities are logged in execution log with timestamp
FAIL: single-operator trigger accepted; operator identities not logged
```

---

**Test ID: T2.1.5**
Type: Unit / Audit trail
AC: S2.1 AC2 (Execution log completeness)
NFR: Failover execution logs retained 7 years (C2 PCI DSS audit trail)
State: FAIL until log retention and completeness are verified

```
GIVEN a failover execution has occurred (test trigger)
WHEN the execution log is inspected
THEN:
  - every execution step has: step_name, timestamp, outcome (success|failure), elapsed_time
  - no step is missing or null
GIVEN the execution log retention policy is inspected
THEN:
  - retention_policy_days >= 2555 (7 years = 2555 days)
FAIL: any step missing; outcome or elapsed_time null; retention policy < 7 years
```

---

**Test ID: T2.1-C2**
Type: NFR / Compliance (PCI DSS)
AC: S2.1 Architecture Constraints — C2 (failover logic within CDE scope)
State: FAIL until PCI DSS relevant controls are documented in execution log

```
GIVEN the failover execution sequence is complete
WHEN the QSA evidence package is assembled
THEN:
  - execution_log_includes_access_control_steps = true (documented: which access controls were transitioned during failover)
  - encryption_key_handling_documented = true (how encryption keys were managed at site switch)
  - no_cardholder_data_exposed_in_logs = true (execution logs contain no plain-text cardholder data)
FAIL: access control steps undocumented; encryption key handling undocumented; cardholder data in execution log
```

---

### S2.2: DR Drill Execution and RTO Validation

**Test ID: T2.2.1**
Type: Human verification / Integration
AC: S2.2 AC1 (First DR drill — T_RTO ≤ 2 hours)
State: FAIL until first drill passes with observer present

```
GIVEN the automated failover capability is deployed to a staging environment
WHEN the first DR drill is executed with an independent observer
THEN:
  - t_rto (simulated failure to Hamilton processing) MUST be <= 120 minutes
  - observer_present = true (security/compliance or internal audit team member)
  - any manual intervention logged as drill finding (acceptable in first drill)
  - drill_report_produced_within = 48 hours of drill completion
FAIL: t_rto > 120 min; no observer; drill report not produced within 48 hours
```

---

**Test ID: T2.2.2**
Type: Human verification
AC: S2.2 AC2 (Second drill — zero unplanned manual interventions)
State: FAIL until second drill passes with all first-drill findings resolved

```
GIVEN first drill findings have been addressed
WHEN the second DR drill is executed (minimum 4 weeks after first)
THEN:
  - t_rto MUST be <= 120 minutes
  - unplanned_manual_interventions = 0 (no steps outside the runbook required)
  - new_findings = 0
  - brc_summary_delivered = true (Board Risk Committee receives summary with: date, t_rto, observer, PASS/FAIL)
FAIL: t_rto > 120 min; any unplanned manual intervention; new findings identified; BRC summary not delivered
```

---

**Test ID: T2.2.3**
Type: Human verification / Inspection
AC: S2.2 AC3 (QSA-ready evidence package)
State: FAIL until evidence package contains all required items

```
GIVEN both drills have passed
WHEN the QSA evidence package is assembled
THEN the package MUST include ALL of:
  - drill_1_report (signed by observer, includes t_rto measurement)
  - drill_2_report (signed by observer, includes t_rto measurement)
  - runbook_version_reference (version used in each drill)
  - data_integrity_statement (confirms no data integrity issues observed)
FAIL: any element absent; drill report unsigned; data integrity statement absent
```

---

### S3.1: PCI DSS QSA Assessment Engagement and Clearance

**Test ID: T3.1.1**
Type: Human verification / Process timeline
AC: S3.1 AC1 (QSA scoping within 2 weeks of project approval)
State: FAIL until QSA scoping conversation date is within 2-week SLA

```
GIVEN project is approved to proceed
WHEN the 2-week SLA is measured from project approval date
THEN:
  - qsa_scoping_call_held = true
  - qsa_scoping_call_date <= project_approval_date + 14 days
  - preliminary_scope_document_agreed = true (QSA firm confirms scope and timeline)
  - assessment_timeline_confirms_completion_before_q3 = true
FAIL: scoping call held after day 14; no scope document agreed; timeline not confirmed before Q3
```

---

**Test ID: T3.1.2**
Type: Human verification / Audit
AC: S3.1 AC2 (QSA assessment — no unresolved HIGH findings)
State: FAIL until QSA assessment report issued with all HIGH findings resolved

```
GIVEN implementation stories S1.1, S1.2, S2.1 are complete
WHEN the QSA firm conducts and issues the assessment report
THEN:
  - assessment_report_issued = true
  - unresolved_high_findings = 0 (all HIGH findings remediated before go-live)
  - medium_finding_remediation_plans_accepted = true (QSA firm has accepted all plans)
  - report_provided_to_brc = true (Board Risk Committee receives report before go-live authorisation)
FAIL: unresolved HIGH findings at go-live; BRC does not receive report; assessment not complete before Q3 go-live
```

---

**Test ID: T3.1.3**
Type: Human verification
AC: S3.1 AC3 (Q3 QSA audit — pre-assessment acknowledged)
State: FAIL if Q3 audit raises new findings not covered by pre-assessment (Note: outcome depends on audit timing — see review finding 1-M1 rephrasing recommendation)

**Note:** Per review finding 1-M1, this AC is framed as a future audit outcome and cannot be fully verified before the Q3 audit. The test below verifies the pre-audit deliverable (evidence package submitted and confirmed complete by QSA firm).

```
GIVEN the QSA assessment is complete (T3.1.2 passed)
WHEN the security and compliance team submits the evidence package to the QSA for Q3 preparation
THEN:
  - evidence_package_submitted_to_qsa = true
  - qsa_confirms_package_complete = true (QSA firm acknowledges receipt and completeness)
  - evidence_package_format_matches_qsa_requirements = true
FAIL: evidence package not submitted; QSA does not confirm completeness
```

---

### S3.2: Operational Runbook and Failover Procedures

**Test ID: T3.2.1**
Type: Review / Inspection
AC: S3.2 AC1 (Runbook completeness)
State: FAIL until runbook contains all required sections

```
GIVEN the operational runbook is authored
WHEN the runbook is inspected section by section
THEN the runbook MUST contain ALL of:
  - preconditions_checklist (steps to confirm before initiating failover)
  - automated_failover_procedure (how to initiate; expected outputs per step)
  - manual_failover_fallback (step-by-step; decision points; escalation criteria)
  - rollback_procedure (how to restore Auckland primary)
  - rto_checkpoint (progress gate with elapsed-time trigger for escalation)
  - two_person_auth_note (reference to two-person authorisation requirement)
  - pci_dss_audit_trail_note (reference to 7-year log retention requirement)
FAIL: any required section absent
```

---

**Test ID: T3.2.2**
Type: Human verification / DR drill
AC: S3.2 AC2 (Runbook validated by non-author)
State: FAIL until non-author successfully executes drill using only the runbook

```
GIVEN the runbook is complete (T3.2.1 passed)
WHEN a DR drill is executed by an operations engineer who did not author the runbook
THEN:
  - drill_completed_without_external_assistance = true
  - runbook_gaps_logged = (any step requiring information not in the runbook is documented)
  - all_gaps_resolved_in_runbook = true (before second DR drill)
FAIL: operator required assistance outside runbook; gaps not resolved before second drill
```

---

**Test ID: T3.2.3**
Type: Integration / Accessibility
AC: S3.2 AC3 (Runbook accessible during incidents)
State: FAIL until runbook accessibility in incident scenario is verified

```
GIVEN a production incident scenario where the Auckland primary site is unavailable
WHEN an on-call operations engineer needs to access the runbook
THEN:
  - runbook_accessible_from_incident_management_tooling = true (not stored only on Auckland systems)
  - runbook_accessible_when_auckland_unavailable = true (verified by simulating Auckland primary offline)
  - printed_copy_available_at_auckland_ops_site = true
FAIL: runbook stored only on Auckland systems; inaccessible during Auckland outage; no printed copy
```

---

## Test Summary

| ID | Story | Type | AC Coverage | Status |
|----|-------|------|-------------|--------|
| T1.1.1 | S1.1 | Human verification | AC1 | FAIL (pre-implementation) |
| T1.1.2 | S1.1 | Human verification | AC2 | FAIL (pre-implementation) |
| T1.1.3 | S1.1 | Human verification | AC3 | FAIL (pre-implementation) |
| T1.2.1 | S1.2 | Integration/NFR | AC1 (lag measurement) | FAIL (pre-implementation) |
| T1.2.2 | S1.2 | Integration/DR | AC2 (RPO validation) | FAIL (pre-implementation) |
| T1.2.3 | S1.2 | Integration/Resilience | AC1 (self-recovery) | FAIL (pre-implementation) |
| T1.2.4 | S1.2 | Integration/Audit | AC3 (record completeness) | FAIL (pre-implementation) |
| T1.2.5 | S1.2 | Unit/Alert | AC4 (alert threshold) | FAIL (pre-implementation) |
| T1.2.6 | S1.2 | Unit/Dashboard | AC4 (dashboard content) | FAIL (pre-implementation) |
| T1.2-C2 | S1.2 | NFR/Compliance | Architecture Constraint C2 | FAIL (pre-implementation) |
| T1.2-C3 | S1.2 | NFR/Compliance | Architecture Constraint C3 | FAIL (pre-implementation) |
| T1.2-C5 | S1.2 | NFR/Audit | Architecture Constraint C5 | FAIL (pre-implementation) |
| T1.3.1 | S1.3 | Human verification | AC1 | FAIL (pre-implementation) |
| T1.3.2 | S1.3 | Human verification | AC2 | FAIL (pre-implementation) |
| T1.3.3 | S1.3 | Human verification | AC3 | FAIL (pre-implementation) |
| T2.1.1 | S2.1 | Integration/Detection | AC1 | FAIL (pre-implementation) |
| T2.1.2 | S2.1 | Integration/Performance | AC2 | FAIL (pre-implementation) |
| T2.1.3 | S2.1 | Unit/Idempotency | AC3 | FAIL (pre-implementation) |
| T2.1.4 | S2.1 | Unit/Security | AC4 | FAIL (pre-implementation) |
| T2.1.5 | S2.1 | Unit/Audit trail | AC2 + NFR | FAIL (pre-implementation) |
| T2.1-C2 | S2.1 | NFR/Compliance | Architecture Constraint C2 | FAIL (pre-implementation) |
| T2.2.1 | S2.2 | Human/Integration | AC1 | FAIL (pre-implementation) |
| T2.2.2 | S2.2 | Human verification | AC2 | FAIL (pre-implementation) |
| T2.2.3 | S2.2 | Human/Inspection | AC3 | FAIL (pre-implementation) |
| T3.1.1 | S3.1 | Human/Process | AC1 | FAIL (pre-implementation) |
| T3.1.2 | S3.1 | Human/Audit | AC2 | FAIL (pre-implementation) |
| T3.1.3 | S3.1 | Human verification | AC3 | FAIL (pre-implementation) |
| T3.2.1 | S3.2 | Review/Inspection | AC1 | FAIL (pre-implementation) |
| T3.2.2 | S3.2 | Human/Drill | AC2 | FAIL (pre-implementation) |
| T3.2.3 | S3.2 | Integration | AC3 | FAIL (pre-implementation) |

**Total tests:** 30 (21 technical / integration / unit + 9 human verification)
**Regulated constraint NFR tests:** T1.2-C2 (PCI DSS encryption), T1.2-C3 (AML/CFT retention), T1.2-C5 (AML replication gap), T2.1-C2 (PCI DSS failover audit trail) = **4 NFR compliance tests**
**All tests in FAIL state** — TDD baseline confirmed.

---

## Output 2 — AC Verification Script (Plain Language)

This script is for human reviewers before coding begins and for smoke-test verification after merge.

### Pre-implementation review (human — before coding agent)

For each story, verify the following before coding begins:

**S1.1 — Hamilton provisioning:** Confirm that a capacity assessment has been scoped (who runs it, what measurements are required). The assessment must cover compute, power/cooling, and network latency — not just rack space. Confirm PCI DSS team is aware Hamilton will become a CDE node.

**S1.2 — Replication:** Confirm the existing batch replication mechanism has been identified and its current lag measured. Confirm TLS is available on the Auckland–Hamilton link. Confirm synthetic transaction load generator exists for testing. Confirm replication monitoring tooling choice is agreed.

**S2.1 — Failover automation:** Confirm failure detection mechanism is agreed (health check, network probe, or combination). Confirm two-person authorisation capability is available in the existing operations toolstack. Confirm execution log storage location is decided and retention policy is configurable.

**S3.1 — QSA assessment:** Confirm QSA firm name and primary contact are documented. Confirm project approval date (the 2-week clock starts from this date). Confirm Q3 audit date is known so assessment timeline can be validated.

---

### Post-merge smoke test (human — after each story ships)

**S1.1:** Review capacity baseline report. Confirm go/no-go recommendation is present and documented. Confirm PCI DSS scope impact document references Req 1, 7, 10.

**S1.2:** Check replication monitoring dashboard is accessible. Verify current lag is displayed and updating. Trigger test alert by raising a synthetic lag spike — confirm alert fires to operations channel within 60 seconds. Inspect TLS configuration on replication channel (check cipher suite, confirm TLS version ≥ 1.2).

**S1.3:** Confirm verification report is in document management system with compliance team lead signature. Confirm internal audit finding status is "closed" in audit register. Confirm BRC meeting minutes reference the finding ID.

**S2.1:** Trigger a test failover in staging. Confirm execution log is written. Confirm single-operator trigger is rejected. Confirm dual-operator trigger is accepted and both identities logged. Check execution log retention policy is set to 7+ years.

**S2.2:** Review drill report from both drills. Confirm T_RTO measurements are recorded in both reports. Confirm observer identities are named in both reports. Confirm BRC received summary after second drill.

**S3.1:** Confirm QSA assessment report is in the evidence repository. Check HIGH finding count is 0. Confirm BRC received the report before go-live authorisation.

**S3.2:** Open the runbook and verify all 5 sections (preconditions, automated procedure, manual fallback, rollback, RTO checkpoint) are present. Confirm the runbook is accessible from incident management tooling. Check a printed copy is filed at the Auckland operations site.

---

## CPF-TRACE

**Stage:** test-plan
**Run:** config-A-run-2
**Model:** claude-sonnet-4-6
**Date:** 2026-05-16

| Constraint | Test coverage? | Test IDs | Notes |
|-----------|---------------|----------|-------|
| C1 (RTO/RPO policy) | ✅ Yes | T1.2.1, T1.2.2, T2.1.2, T2.2.1, T2.2.2 | RPO tested in T1.2.1/T1.2.2; RTO tested in T2.1.2, T2.2.1, T2.2.2 |
| C2 (PCI DSS QSA) | ✅ Yes | T1.2-C2 (replication encryption), T2.1-C2 (failover CDE audit trail), T3.1.1, T3.1.2, T3.1.3 | Two dedicated NFR compliance tests (T1.2-C2, T2.1-C2) + 3 QSA process verification tests |
| C3 (AML/CFT retention) | ✅ Yes | T1.2-C3 (retention policy at Hamilton), T1.3.1, T1.3.2, T1.3.3 | Dedicated NFR test T1.2-C3 verifies retention policy ≥ 5 years; T1.3.x verify audit closure |
| C4 (single Auckland DC) | ✅ Yes | T2.1.1, T2.2.1 | Implicitly tested — all failover tests exercise the single-DC → dual-site transition |
| C5 (AML replication gap) | ✅ Yes | T1.2-C5 (reconciliation methodology auditable), T1.2.4, T1.3.2 | T1.2-C5 explicitly tests the audit evidence gap; T1.3.2 verifies audit finding closure |

**CPF score (test-plan stage):**
- C1: 1.0 (5 tests covering RTO and RPO dimensions)
- C2: 1.0 (2 NFR compliance tests + 3 QSA process tests)
- C3: 1.0 (1 NFR test + 3 audit closure tests)
- C4: 1.0 (implicit coverage in failover tests)
- C5: 1.0 (1 dedicated NFR audit evidence test + 2 supporting tests)

**Stage CPF:** 5/5 = **1.00**
**Regulated CPF (C2, C3, C5):** 3/3 = **1.00**

**Config A vs Config C comparison note at test-plan stage:**
Config A run 2 (Sonnet) produced 4 NFR compliance tests (T1.2-C2, T1.2-C3, T1.2-C5, T2.1-C2) compared to Config C run 3 (Haiku) which produced 7 NFR-compliance tests. Both achieve regulated CPF = 1.00 at test-plan stage — the coverage count difference reflects test granularity, not coverage completeness. The Sonnet test plan maps C2 to 2 targeted NFR tests plus QSA process tests; the Haiku test plan used more granular per-story compliance tests.
