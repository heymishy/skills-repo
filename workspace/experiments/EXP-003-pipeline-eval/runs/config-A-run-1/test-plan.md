# Test Plan: Payment Authorisation Service DR Failover

**Feature:** 2026-05-14-payment-auth-dr-failover
**Model:** claude-sonnet-4-6 (Config A)
**Date:** 2026-05-14
**Stories covered:** 1.3, 2.1, 2.2, 3.1, 3.2 (constraint-bearing stories; stories 1.1 and 1.2 produce assessment reports and are fully manual)

---

## Test Context (eval-mode)

**Test environment:** This feature involves infrastructure provisioning, compliance audits, and operational procedure testing — not application code. The "test framework" is:
- Manual verification scripts for runbook and operational procedures
- Infrastructure validation via timed drills and log analysis
- Compliance evidence collection (QSA sign-off, audit reports)
- Automated monitoring alerts (replication lag dashboard)

**Test data strategy:** De-identified synthetic transaction data for drill testing. Real transaction records for AML replication audit (by compliance team — within AML/CFT scope, restricted classification). No PCI DSS PANs or CVVs used in drill test data — synthetic card references only. PCI DSS constraints (C2) apply to all test data involving cardholder data environment (CDE) scope.

---

## Story 1.3 — Transaction Data Replication to RPO Target

### AC Coverage

| AC | Test type | Test name |
|----|----------|-----------|
| AC1 — Replication lag ≤ 15 min over 4-hour window | NFR (automated monitoring) | `NFR-1.3-1: replication_lag_does_not_exceed_15_minutes` |
| AC2 — Secondary complete to T-15min after simulated outage at T | Integration | `INT-1.3-1: secondary_data_complete_to_rpo_at_simulated_outage` |
| AC3 — Lag visible in real time via monitoring | Integration | `INT-1.3-2: replication_status_observable_in_realtime` |

### NFR Tests

**NFR-1.3-1 — C1 (RPO): Replication lag ≤ 15 minutes under peak load**
- Constraint source: C1 — Board-approved RPO ≤ 15 minutes
- Precondition: Replication mechanism running; transaction generator producing synthetic load equivalent to 180,000 tx/day (125 tx/min average)
- Action: Sample replication lag at 1-minute intervals over a 4-hour synthetic load window
- Expected result: Maximum observed lag in any sample ≤ 15 minutes; 95th percentile lag ≤ 10 minutes
- Pass/fail: FAIL if any single sample exceeds 15 minutes, or if 95th percentile exceeds 10 minutes

**NFR-1.3-2 — C3 (AML/CFT): AML-scope records included in replication stream**
- Constraint source: C3 — AML/CFT Act, 5-year transaction record retention; records must replicate to secondary site
- Precondition: Replication mechanism running; a set of synthetic transactions tagged as AML-scope (representing flagged transactions, suspicious activity records, and standard transaction records)
- Action: After replication lag stabilises, compare AML-scope record set on primary with secondary. Check record count, record types, and timestamp coverage
- Expected result: 100% of AML-scope records present at secondary site; no AML-scope record type excluded from the replication stream
- Pass/fail: FAIL if any AML-scope record type is absent from secondary, or if record count diverges

**NFR-1.3-3 — C5 (AML replication gap): Replication includes records at risk from the internal audit gap**
- Constraint source: C5 — Internal audit gap: replication to secondary site within statutory 5-year retention window unverified
- Precondition: Replication mechanism running; synthetic records spanning >5 years of backfill (for new installations: records from system inception date)
- Action: Query secondary site for transaction records in the oldest date bucket (records dated 4.5–5 years ago); compare count and completeness against primary
- Expected result: Records in the oldest date bucket are present at secondary; no systematic gap in coverage at the 5-year boundary
- Pass/fail: FAIL if any records in the 4.5–5-year bucket are absent from secondary site
- Note: This test directly validates the audit gap surfaced as C5 in the discovery artefact. A failing result here confirms the audit gap is real and triggers Story 3.2 remediation scope.

### Integration Tests

**INT-1.3-1 — C1 (RPO): Secondary data complete to T-15min after simulated outage**
- Given: Replication is running; transaction generator active
- When: Simulated outage signal is sent at known timestamp T (replication to secondary halted)
- Then: Query secondary at T+30s; all transactions committed before T-15min are present; no transactions in the T-15min to T window are required (within RPO tolerance)

**INT-1.3-2 — Replication status observable in real time**
- Given: Replication is running
- When: Monitoring endpoint is queried
- Then: Response contains current replication lag in minutes, last-synced timestamp, and an alert status field; lag value matches the actual measured lag within ±30 seconds

### Gap Table

| AC | Gap | Type | Handling |
|----|-----|------|---------|
| AC3 — Monitoring dashboard | Presupposes a specific dashboard — mechanism is implementation-specific | Implementation assumption in AC | Accepted as-is; test covers observable monitoring output, not dashboard UI |
| NFR-1.3-3 — Historical records | Pre-existing records from before system deployment cannot be retroactively verified in a new installation | Scope boundary | C5 gap test applies to records within the deployment window; historical gap is a separate remediation scope (Story 3.2) |

---

## Story 2.1 — Manual Failover Runbook

### AC Coverage

| AC | Test type | Test name |
|----|----------|-----------|
| AC1 — Runbook steps unambiguous | Manual verification | `MAN-2.1-1: runbook_step_clarity_review` |
| AC2 — All dependencies documented with fallbacks | Manual verification | `MAN-2.1-2: runbook_dependency_coverage_review` |
| AC3 — Estimated completion time ≤ 90 minutes | Manual calculation | `MAN-2.1-3: runbook_time_estimate_within_rto_contingency` |

### NFR Tests

**NFR-2.1-1 — C1 (RTO): Runbook total estimated duration ≤ 90 minutes (30-min RTO contingency)**
- Constraint source: C1 — Board-approved RTO ≤ 2 hours; runbook must complete within 90 minutes leaving 30-minute contingency
- Action: Sum the time estimates for all runbook steps
- Expected result: Total ≤ 90 minutes
- Pass/fail: FAIL if total estimated time exceeds 90 minutes

**NFR-2.1-2 — C2 (PCI DSS): No credentials stored in plaintext in the runbook**
- Constraint source: C2 — PCI DSS access control requirements; credentials must not be plaintext in a runbook
- Action: Review runbook for any plaintext credentials, passwords, API keys, or session tokens
- Expected result: No plaintext credentials found; all credential references point to approved secrets management system
- Pass/fail: FAIL if any plaintext credential found

**NFR-2.1-3 — Runbook available when primary DC unavailable**
- Action: Confirm runbook is accessible from a location independent of the primary Auckland DC
- Expected result: Runbook accessible from secondary site, engineer's device, and an off-site location

### Gap Table

No gaps. All ACs are procedurally verifiable.

---

## Story 2.2 — Failover Drill Testing and RTO Validation

### AC Coverage

| AC | Test type | Test name |
|----|----------|-----------|
| AC1 — Drill 1 completes within 120 minutes | Operational drill | `DRILL-2.2-1: failover_drill_1_rto_within_120_minutes` |
| AC2 — Runbook updated after Drill 1 | Manual verification | `MAN-2.2-1: runbook_updated_after_drill_1` |
| AC3 — Drill 2 completes within 120 minutes, drill report produced | Operational drill | `DRILL-2.2-2: failover_drill_2_rto_within_120_minutes` |
| AC4 — Evidence package includes timestamps, measured completion times, operations lead sign-off | Manual verification | `MAN-2.2-2: drill_evidence_package_completeness` |

### NFR Tests

**NFR-2.2-1 — C1 (RTO): Drill 1 — failover to secondary within 2 hours**
- Constraint source: C1 — Board-approved RTO ≤ 2 hours
- Action: Conduct timed Drill 1; record start timestamp (outage declaration) and end timestamp (payment authorisation confirmed at secondary)
- Expected result: Elapsed time ≤ 120 minutes
- Pass/fail: FAIL if elapsed time exceeds 120 minutes

**NFR-2.2-2 — C1 (RPO): Drill 1 — RPO compliance confirmed**
- Constraint source: C1 — Board-approved RPO ≤ 15 minutes
- Action: During Drill 1 failover, perform transaction log reconciliation (per Story 1.3 INT-1.3-1 procedure)
- Expected result: No more than 15 minutes of transactions unrecoverable at point of failover
- Pass/fail: FAIL if recovery gap exceeds 15 minutes

**NFR-2.2-3 — C1 (RTO): Drill 2 — failover to secondary within 2 hours (after runbook update)**
- Constraint source: C1 — Board-approved RTO ≤ 2 hours; second drill required for compliance evidence
- Action: Conduct timed Drill 2 (post-runbook update); record timestamps
- Expected result: Elapsed time ≤ 120 minutes; written drill report produced
- Pass/fail: FAIL if elapsed time exceeds 120 minutes or if drill report is not produced

**NFR-2.2-4 — C2 (PCI DSS): Drill conditions comply with CDE boundary requirements**
- Constraint source: C2 — PCI DSS; no production cardholder data used in test conditions without QSA approval
- Action: Confirm drill uses synthetic card references (non-PAN test data) unless QSA explicitly approved live data
- Expected result: No real PAN, CVV, or cardholder data used in drill test transactions
- Pass/fail: FAIL if real cardholder data used without QSA approval

### Gap Table

| AC | Gap | Type | Handling |
|----|-----|------|---------|
| AC4 — Board Risk Committee delivery | Board notification is an organisational process action, not a test assertion | Process boundary | Manual scenario covers evidence package completeness; Board delivery is outside test scope |

---

## Story 3.1 — PCI DSS QSA DR Environment Assessment

### AC Coverage

| AC | Test type | Test name |
|----|----------|-----------|
| AC1 — QSA engagement confirmed with assessment date before go-live | Manual verification | `MAN-3.1-1: qsa_engagement_confirmed` |
| AC2 — Critical/High findings remediated before go-live; Medium findings have plan | Manual verification | `MAN-3.1-2: qsa_findings_remediated` |
| AC3 — QSA sign-off letter obtained and filed | Manual verification | `MAN-3.1-3: qsa_signoff_letter_in_compliance_record` |

### NFR Tests

**NFR-3.1-1 — C2 (PCI DSS — regulated): QSA sign-off obtained before first production failover**
- Constraint source: C2 — PCI DSS compliance; any architectural change requires QSA assessment before go-live. This is a hard gate.
- Pre-condition: Stories 1.1, 1.2, 1.3 complete; DR environment provisioned and documented
- Action: Confirm QSA sign-off letter (AC3) is present in the compliance record before any production failover is authorised
- Expected result: QSA sign-off letter exists, is dated before the go-live authorisation date, confirms the DR environment meets PCI DSS requirements
- Pass/fail: FAIL if production failover proceeds without QSA sign-off letter on file
- Severity: CRITICAL — proceeding without QSA sign-off is a PCI DSS compliance violation

**NFR-3.1-2 — C2 (PCI DSS): No Critical or High QSA findings open at go-live**
- Action: Query QSA findings register; confirm all Critical and High findings have "Remediated" status
- Expected result: Zero Critical or High findings open at go-live
- Pass/fail: FAIL if any Critical or High finding is unresolved

### Gap Table

No gaps. All ACs are evidence-based manual verifications consistent with compliance story patterns.

---

## Story 3.2 — AML/CFT Transaction Record Replication Audit

### AC Coverage

| AC | Test type | Test name |
|----|----------|-----------|
| AC1 — Audit covers record count, 5-year window, AML field spot-check | Manual (compliance audit) | `AUD-3.2-1: aml_replication_audit_scope_confirmed` |
| AC2 — Gaps quantified and remediation plan produced | Manual (compliance audit) | `AUD-3.2-2: aml_replication_gaps_remediated` |
| AC3 — Written audit confirmation of full 5-year replication coverage | Manual (compliance audit) | `AUD-3.2-3: aml_audit_confirmation_produced` |
| AC4 — Internal audit finding formally closed | Manual (compliance audit) | `AUD-3.2-4: internal_audit_finding_closed` |

### NFR Tests

**NFR-3.2-1 — C3 (AML/CFT Act — regulated): All AML-scope records present at secondary site within 5-year window**
- Constraint source: C3 — AML/CFT Act, 5-year transaction record retention; records must replicate to and be verifiable at secondary site
- Action: Run replication audit (AUD-3.2-1): compare primary and secondary record counts by year for all 5 years; spot-check AML-scope field completeness on a statistically representative sample
- Expected result: Secondary site record count matches primary for each year of the 5-year window; no systematic gap in AML-scope field coverage
- Pass/fail: FAIL if record count diverges for any year, or if AML-scope fields are missing on spot-checked records
- Severity: CRITICAL — any gap is a potential statutory compliance failure under the AML/CFT Act

**NFR-3.2-2 — C5 (AML replication gap — internal audit finding): Gap from audit finding is verified or closed**
- Constraint source: C5 — Internal audit gap: replication to secondary site within statutory retention window is unverified
- Action: The replication audit (AUD-3.2-1) specifically checks whether the internal audit gap is confirmed or refuted. Outcome must be one of: (a) gap confirmed — quantified and remediation planned (AC2); (b) gap not confirmed — audit evidence shows full replication coverage
- Expected result: The audit produces a definitive finding (confirmed gap with remediation plan, or clean coverage evidence). "Unverified" is NOT an acceptable post-audit outcome.
- Pass/fail: FAIL if the audit does not produce a definitive finding on the C5 gap

**NFR-3.2-3 — C3 (AML/CFT Act): Audit confirmation retained as permanent compliance record**
- Constraint source: C3 — Statutory compliance record-keeping
- Action: Confirm audit confirmation (AC3) and internal audit closure evidence (AC4) are filed in the compliance record with permanent retention
- Expected result: Both documents present in compliance record; retention policy set to permanent
- Pass/fail: FAIL if documents are not filed or are subject to a non-permanent retention policy

### Gap Table

| AC | Gap | Type | Handling |
|----|-----|------|---------|
| AC1-3 — External auditor access to secondary site | Audit requires independent access to secondary site transaction records | Infrastructure dependency | Dependency: secondary site must be provisioned (Story 1.2) and replication active (Story 1.3) before audit can commence. Prerequisite gate at DoR. |

---

## NFR Summary (across all stories — constraint propagation trace)

| Constraint ID | Constraint | Stories where NFR test exists |
|--------------|-----------|------------------------------|
| C1 — RTO ≤ 2h, RPO ≤ 15min (Board-approved) | NFR tests | NFR-1.3-1 (RPO lag), NFR-2.1-1 (runbook duration), NFR-2.2-1, NFR-2.2-2, NFR-2.2-3 (drill RTO/RPO) |
| C2 — PCI DSS QSA assessment before go-live (regulated) | NFR tests | NFR-1.3-2 replication CDE, NFR-2.1-2 credentials, NFR-2.2-4 drill CDE, NFR-3.1-1 (CRITICAL gate), NFR-3.1-2 findings |
| C3 — AML/CFT Act 5-year retention at secondary (regulated) | NFR tests | NFR-1.3-2 (AML records in stream), NFR-3.2-1 (CRITICAL — 5-year coverage), NFR-3.2-3 (retention) |
| C4 — Single Auckland DC (technical baseline) | No NFR test needed | C4 is the problem statement; addressed by Stories 1.1/1.2 provisioning |
| C5 — AML replication gap unverified (hidden audit finding) | NFR tests | NFR-1.3-3 (oldest-bucket boundary test), NFR-3.2-2 (gap must produce definitive finding) |

**CPF preview:** All 5 constraints have test plan coverage. C2 and C3 have CRITICAL-severity NFR tests. C5 has explicit NFR tests in both Stories 1.3 and 3.2.

<!-- eval-mode: true -->
