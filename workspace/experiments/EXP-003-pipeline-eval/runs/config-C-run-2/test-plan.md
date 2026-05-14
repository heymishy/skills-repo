# Test Plan — Disaster Recovery RTO + AML/CFT Compliance Modernisation

**Feature:** Disaster Recovery RTO + AML/CFT Compliance Modernisation  
**Source definition:** `runs/config-C-run-2/definition.md`  
**Source review:** `runs/config-C-run-2/review.md`  
**Review status:** FAIL (H1, H2, H3 unresolved) — proceeding in eval mode only  
**Test framework:** Jest (Node.js integration), Bash/shell for infrastructure assertions  
**Test data strategy:** Synthetic — generated in test setup; no real payment card data  
**Model:** claude-haiku-4-5  
**Eval mode:** true  

> **Eval note:** In production pipeline this test plan would be blocked by the FAIL verdict in review.md (H1, H2, H3). Proceeding in eval mode to complete CPF measurement across the full artefact chain.

---

## Story Coverage Matrix

| Story | ACs | Test count | Frameworks |
|---|---|---|---|
| S1.1 — Replication Strategy Assessment | 5 | 6 | bash/jest |
| S1.2 — Replication Implementation | 5 | 8 | jest/psql |
| S1.3 — Audit Trail & 5-Year Retention | 5 | 7 | jest/sql |
| S2.1 — Health Check & Failure Detection | 5 | 6 | jest/bash |
| S2.2 — Failover Decision Logic | 5 | 7 | jest/bash |
| S2.3 — Rollback & Recovery | 5 | 6 | jest/bash |
| S3.1 — Monitoring Dashboard | 4 | 5 | jest/http |
| S3.2 — Alert Configuration | 5 | 6 | jest/smtp |
| S3.3 — Operations Runbook | 5 | 5 | bash/manual |

**Total:** 45 acceptance criteria → 56 failing tests (TDD discipline: all tests written to fail before implementation)

---

## Test Data Strategy

**Principle:** All test data is synthetic and generated programmatically. Zero real payment data in any fixture.

**PCI DSS constraint (C2):** Test fixtures must use tokenised card data only. Pre-flight assertion: `assert no_real_pan_in_fixtures()`. Test range: `4111111111111111` (Luhn-valid dummy PAN).

**AML/CFT retention (C3):** Test fixtures include transaction records with timestamps spanning a simulated 5-year window. Configuration: `TIME_SCALE=365` compresses 1 real second = 1 simulated day for testing.

**Infrastructure:** Tests use Docker Compose with localstack-based PostgreSQL simulation. No tests run against production infrastructure.

---

## Output 1 — Technical Test Plan

### S1.1 — Replication Strategy Assessment

**T1.1.1 — Database object inventory script produces output**
```bash
# RED: Fails because inventory script doesn't exist
test "inventory-primary-db.sh returns JSON with table count" {
  run scripts/dr/inventory-primary-db.sh --host localhost --format json
  assert_success
  TABLES=$(echo "$output" | jq '.tables | length')
  assert [ "$TABLES" -gt 0 ]
}
```

**T1.1.2 — TPS measurement script outputs numeric value**
```bash
# RED: Fails; measurement script not implemented
test "measure-tps.sh returns numeric TPS value within expected range" {
  run scripts/dr/measure-tps.sh --duration 60s --host localhost
  assert_success
  assert_output --regexp '^[0-9]+(\.[0-9]+)?$'
}
```

**T1.1.3 — Replication strategy document exists with required sections**
```bash
# RED: Fails; document not created
test "replication strategy document has Rationale, Solution, Rejected sections" {
  run cat docs/dr/replication-strategy.md
  assert_success
  assert_output --partial "## Rationale"
  assert_output --partial "## Solution"
  assert_output --partial "## Rejected"
}
```

**T1.1.4 — RPO value is documented with numeric commitment**
```bash
# RED: Fails; RPO not committed
test "strategy document commits to specific RPO value" {
  run grep -E "RPO.*[0-9]+ (minutes|min)" docs/dr/replication-strategy.md
  assert_success
  RUN_OUTPUT="$output"
  assert [ ! -z "$RUN_OUTPUT" ]
}
```

**T1.1.5 — QSA engagement scheduled**
```bash
# RED: Fails; QSA scheduling not recorded
test "decisions.md records QSA engagement scheduled date" {
  run grep "QSA.*scheduled" decisions.md
  assert_success
}
```

**T1.1.6 — Current network latency measured**
```bash
# RED: Fails; latency measurement not performed
test "architecture docs record Auckland-Hamilton latency" {
  run grep -i "latency" docs/dr/network-assessment.md
  assert_success
  assert_output --regexp "[0-9]+ (ms|millisecond)"
}
```

### S1.2 — Replication Implementation

**T1.2.1 — Replication slot configured on primary**
```bash
# RED: Fails; replication not configured
test "PostgreSQL replication slot 'dr_slot' exists on primary" {
  run psql -h "$PRIMARY_HOST" -c "SELECT slot_name FROM pg_replication_slots WHERE slot_name='dr_slot';" -t
  assert_success
  assert_output "dr_slot"
}
```

**T1.2.2 — Insert on primary appears on secondary within RPO threshold**
```bash
# RED: Fails; replication not active
test "transaction inserted on primary appears on secondary within RPO" {
  TX_ID=$(psql -h "$PRIMARY_HOST" -c "INSERT INTO transactions(tx_id, amount) VALUES('test-'$(date +%s), 100.00) RETURNING tx_id;" -t)
  sleep 2
  RESULT=$(psql -h "$SECONDARY_HOST" -c "SELECT tx_id FROM transactions WHERE tx_id='$TX_ID';" -t)
  assert [ ! -z "$RESULT" ]
}
```

**T1.2.3 — Checksum verification confirms zero data loss in test dataset**
```bash
# RED: Fails; replication not implemented
test "checksum-verify script reports zero differences" {
  run npm test -- checksum-verify.test.js
  assert_success
  assert_output --partial "differences: 0"
}
```

**T1.2.4 — Replication lag monitored and exported to observability**
```bash
# RED: Fails; monitoring not implemented
test "replication lag metric is exported to observability platform" {
  run curl -s http://localhost:9090/metrics | grep replication_lag_seconds
  assert_success
  assert_output --regexp "replication_lag_seconds [0-9]"
}
```

**T1.2.5 — Replication process survives 4-hour continuous window**
```bash
# RED: Fails; endurance test not configured
test "replication lag remains below threshold over 4-hour operational window" {
  run npm test -- replication-endurance.test.js
  assert_success
  assert_output --partial "duration: 4 hours"
  assert_output --partial "errors: 0"
}
```

**T1.2.6 — No real card data in test fixtures**
```bash
# RED: Fails; PAN sanitisation not implemented
test "test fixtures contain only dummy card data, not real PANs" {
  run npm test -- pci-fixture-audit.test.js
  assert_success
  assert_output --partial "real_pans_found: 0"
}
```

**T1.2.7 — Replication lag alert fires on breach**
```bash
# RED: Fails; alert not configured
test "alert fires when replication lag exceeds RPO threshold" {
  run npm test -- replication-alert.test.js
  assert_success
  assert_output --partial "alert_fired: true"
}
```

**T1.2.8 — Audit trail records replication event**
```bash
# RED: Fails; audit trail not implemented
test "replication event audit trail includes timestamp and checksum" {
  run npm test -- audit-trail.test.js
  assert_success
  assert_output --partial "audit_records_created: [number > 0]"
}
```

### S1.3 — Audit Trail & 5-Year Retention

**T1.3.1 — Audit trail schema includes retention window tracking**
```bash
# RED: Fails; schema not created
test "audit_trail table has retention_window_end column" {
  run psql -h "$PRIMARY_HOST" -c "\\d audit_trail" 
  assert_success
  assert_output --partial "retention_window_end"
}
```

**T1.3.2 — Every replicated transaction generates audit trail record within 1 second**
```bash
# RED: Fails; audit trail recording not implemented
test "audit trail record created for each replicated transaction" {
  run npm test -- audit-trail-latency.test.js
  assert_success
  assert_output --partial "avg_latency_ms: [number <= 1000]"
}
```

**T1.3.3 — Retention policy preserves records for 5 years**
```bash
# RED: Fails; retention policy not configured
test "PostgreSQL retention policy configured for 5 years" {
  run psql -h "$PRIMARY_HOST" -c "SELECT * FROM pg_policies WHERE polname='audit_trail_5yr_retention';" -t
  assert_success
}
```

**T1.3.4 — Monthly gap report runs and detects zero gaps**
```bash
# RED: Fails; gap report not implemented
test "monthly gap verification report generates with zero gaps in first run" {
  run npm test -- monthly-gap-report.test.js
  assert_success
  assert_output --partial "gaps_detected: 0"
}
```

**T1.3.5 — Internal audit team confirms finding closure**
```bash
# RED: Fails; audit sign-off not recorded
test "audit closure document exists and is signed by Compliance team" {
  run test -f docs/compliance/audit-finding-q1-2026-closure.md
  assert_success
  run grep -i "signed\|approved" docs/compliance/audit-finding-q1-2026-closure.md
  assert_success
}
```

**T1.3.6 — Gap report identifies any transaction missing from secondary**
```bash
# RED: Fails; gap detection not implemented
test "gap report compares transaction count primary vs secondary" {
  run npm test -- gap-detection.test.js
  assert_success
  assert_output --partial "primary_count:[number]"
  assert_output --partial "secondary_count:[number]"
}
```

**T1.3.7 — AML/CFT retention window preserved across failover**
```bash
# RED: Fails; retention not validated across failover
test "retention window start dates are preserved on secondary" {
  run npm test -- retention-preservation.test.js
  assert_success
  assert_output --partial "retention_preserved: true"
}
```

### S2.1 — Health Check & Failure Detection

**T2.1.1 — Health check endpoint responds with HTTP 200 when operational**
```bash
# RED: Fails; health check not implemented
test "health check endpoint returns 200 when primary is healthy" {
  run curl -w "%{http_code}" -s -o /dev/null http://localhost:8080/health
  assert_output "200"
}
```

**T2.1.2 — Health check includes database connectivity test**
```bash
# RED: Fails; database test not in health check
test "health check verifies database connectivity" {
  run curl -s http://localhost:8080/health | jq '.checks.database'
  assert_success
  assert_output --partial "ok"
}
```

**T2.1.3 — Health check includes transaction processing capability**
```bash
# RED: Fails; transaction test not implemented
test "health check can process test transaction" {
  run curl -s http://localhost:8080/health | jq '.checks.transaction_processing'
  assert_success
  assert_output --partial "ok"
}
```

**T2.1.4 — Failure detection within 5 minutes**
```bash
# RED: Fails; failure detection not implemented
test "monitoring detects health check failure within 5 minutes" {
  run npm test -- failure-detection.test.js
  assert_success
  assert_output --regexp "detection_time_seconds: [0-9]+ [0-300]"
}
```

**T2.1.5 — Alert includes replication lag status**
```bash
# RED: Fails; lag status not in alert
test "failure alert includes current replication lag" {
  run npm test -- failure-alert-content.test.js
  assert_success
  assert_output --partial "replication_lag_seconds"
}
```

**T2.1.6 — False positive rate < 1% in 30-day window**
```bash
# RED: Fails; false positive tracking not implemented
test "health check false positive rate < 1% over 30-day simulation" {
  run npm test -- false-positive-rate.test.js
  assert_success
  assert_output --regexp "false_positive_rate: 0\\.[0-9]% [< 1%]"
}
```

### S2.2 — Failover Decision Logic

**T2.2.1 — Failover decision criteria documented**
```bash
# RED: Fails; decision criteria not documented
test "failover decision criteria exist in runbook" {
  run grep -A5 "failover decision" docs/runbook.md
  assert_success
}
```

**T2.2.2 — PCI DSS QSA gate: assessment evidence file exists**
```bash
# RED: Fails; QSA evidence not provided (H2 remediation test)
test "QSA architectural assessment documentation exists" {
  run test -f docs/compliance/qsa-assessment-dr-2026.md
  assert_success
  run grep -i "approved\|assessed" docs/compliance/qsa-assessment-dr-2026.md
  assert_success
}
```

**T2.2.3 — Split-brain prevention: distributed lock prevents dual-primary**
```bash
# RED: Fails; split-brain guard not implemented
test "split-brain check prevents both sites from having write lock" {
  run npm test -- split-brain-prevention.test.js
  assert_success
  assert_output --partial "primary_lock: true"
  assert_output --partial "secondary_lock: false"
}
```

**T2.2.4 — Failover executes within 5 minutes of trigger**
```bash
# RED: Fails; failover automation not implemented
test "failover completes within 5 minutes from trigger" {
  run npm test -- failover-timing.test.js
  assert_success
  assert_output --regexp "failover_duration_seconds: [0-9]+ [0-300]"
}
```

**T2.2.5 — Connection string updates route transactions to secondary**
```bash
# RED: Fails; connection routing not implemented
test "connection string points to secondary after failover" {
  run npm test -- connection-routing.test.js
  assert_success
  assert_output --partial "active_endpoint: secondary"
}
```

**T2.2.6 — Failover audit trail records decision and execution**
```bash
# RED: Fails; failover audit not implemented
test "failover event logged with timestamp and details" {
  run npm test -- failover-audit.test.js
  assert_success
  assert_output --partial "event_type: failover"
}
```

**T2.2.7 — RTO ≤ 2 hours achieved in test scenario**
```bash
# RED: Fails; RTO not measured
test "end-to-end RTO from failure detection to transaction processing ≤ 2 hours" {
  run npm test -- rto-measurement.test.js
  assert_success
  assert_output --regexp "rto_seconds: [0-9]+ [0-7200]"
}
```

### S2.3 — Rollback & Recovery

**T2.3.1 — Rollback procedure documented with decision criteria**
```bash
# RED: Fails; rollback procedure not written
test "rollback procedure document exists with decision tree" {
  run grep -A3 "rollback decision" docs/runbook.md
  assert_success
}
```

**T2.3.2 — Rollback tested: primary recovery → rollback → zero loss**
```bash
# RED: Fails; rollback test not implemented
test "rollback execution produces zero data loss in test" {
  run npm test -- rollback-data-integrity.test.js
  assert_success
  assert_output --partial "data_loss: 0"
}
```

**T2.3.3 — Transactions processed on secondary during failover reconcile**
```bash
# RED: Fails; reconciliation not implemented
test "failover-period transactions verified on both sites" {
  run npm test -- transaction-reconciliation.test.js
  assert_success
  assert_output --partial "duplicates: 0"
  assert_output --partial "gaps: 0"
}
```

**T2.3.4 — Rollback can be executed multiple times without data loss**
```bash
# RED: Fails; multi-rollback not tested
test "rollback repeatable three times with zero loss" {
  run npm test -- rollback-repeatability.test.js
  assert_success
  assert_output --partial "rollback_attempts: 3"
  assert_output --partial "data_loss_cumulative: 0"
}
```

**T2.3.5 — Operations team executes rollback in test without escalation**
```bash
# RED: Fails; ops team training not verified
test "runbook steps are executable by ops team" {
  run npm test -- runbook-operability.test.js
  assert_success
  assert_output --partial "steps_clear: true"
}
```

**T2.3.6 — Primary reactivation verified healthy before rollback completes**
```bash
# RED: Fails; primary health check not in rollback flow
test "primary health confirmed before finalizing rollback" {
  run npm test -- primary-health-validation.test.js
  assert_success
  assert_output --partial "primary_healthy: true"
}
```

### S3.1 — Monitoring Dashboard

**T3.1.1 — Dashboard displays replication lag metric < 1-minute stale**
```bash
# RED: Fails; dashboard not implemented
test "dashboard replication lag metric is fresh < 1 minute" {
  run npm test -- dashboard-metric-freshness.test.js
  assert_success
  assert_output --regexp "lag_metric_age_seconds: [0-9]+ [0-60]"
}
```

**T3.1.2 — Dashboard displays transaction volume per site**
```bash
# RED: Fails; transaction metrics not in dashboard
test "dashboard shows transaction count for primary and secondary" {
  run npm test -- dashboard-transaction-display.test.js
  assert_success
  assert_output --partial "primary_txn_count"
  assert_output --partial "secondary_txn_count"
}
```

**T3.1.3 — Dashboard displays failover status**
```bash
# RED: Fails; failover status not displayed
test "dashboard shows current active site (Primary Active | Secondary Active)" {
  run npm test -- dashboard-failover-status.test.js
  assert_success
  assert_output --regexp "(Primary|Secondary) Active"
}
```

**T3.1.4 — Dashboard displays audit trail completeness**
```bash
# RED: Fails; audit completeness metric not implemented
test "dashboard shows audit trail completeness percentage" {
  run npm test -- dashboard-audit-completeness.test.js
  assert_success
  assert_output --regexp "audit_completeness: [0-9]+\\.[0-9]+%"
}
```

**T3.1.5 — Dashboard auto-refreshes every 30 seconds**
```bash
# RED: Fails; refresh not implemented
test "dashboard refreshes metrics every 30 seconds" {
  run npm test -- dashboard-refresh.test.js
  assert_success
  assert_output --regexp "refresh_interval_seconds: 30"
}
```

### S3.2 — Alert Configuration

**T3.2.1 — Replication lag alert fires at HIGH threshold (5 minutes)**
```bash
# RED: Fails; lag alert not configured
test "alert fires when replication lag exceeds 5 minutes" {
  run npm test -- alert-lag-high.test.js
  assert_success
  assert_output --partial "alert_triggered: true"
  assert_output --partial "severity: HIGH"
}
```

**T3.2.2 — Primary health failure alert fires at CRITICAL**
```bash
# RED: Fails; health alert not configured
test "alert fires at CRITICAL when primary health fails" {
  run npm test -- alert-health-critical.test.js
  assert_success
  assert_output --partial "severity: CRITICAL"
}
```

**T3.2.3 — Failover trigger alert fires at CRITICAL with RTO context**
```bash
# RED: Fails; failover alert not configured
test "failover alert includes RTO and time remaining" {
  run npm test -- alert-failover-context.test.js
  assert_success
  assert_output --partial "rto_minutes: 120"
}
```

**T3.2.4 — Audit trail gap alert fires at HIGH**
```bash
# RED: Fails; gap alert not configured
test "alert fires at HIGH when audit completeness falls below 99.9%" {
  run npm test -- alert-gap-high.test.js
  assert_success
  assert_output --partial "severity: HIGH"
}
```

**T3.2.5 — Alerts route to operations via configured channel**
```bash
# RED: Fails; alert routing not implemented
test "alert is delivered to operations Slack/PagerDuty channel" {
  run npm test -- alert-delivery.test.js
  assert_success
  assert_output --partial "delivered: true"
}
```

**T3.2.6 — Alert includes runbook section reference**
```bash
# RED: Fails; runbook link not in alerts
test "alert payload includes link to relevant runbook section" {
  run npm test -- alert-runbook-link.test.js
  assert_success
  assert_output --partial "runbook_section"
}
```

### S3.3 — Operations Runbook

**T3.3.1 — Runbook document exists with all six sections**
```bash
# RED: Fails; runbook not created
test "runbook.md includes Normal Ops, Failure, Failover, Post-Failover, Rollback sections" {
  run test -f docs/runbook.md
  assert_success
  run grep -E "## (Normal|Failure|Failover|Post|Rollback)" docs/runbook.md
  assert_success
  SECTIONS=$(grep -E "^##" docs/runbook.md | wc -l)
  assert [ "$SECTIONS" -ge 6 ]
}
```

**T3.3.2 — Runbook includes decision trees for ambiguous scenarios**
```bash
# RED: Fails; decision trees not written
test "runbook includes decision tree for partial primary failure scenario" {
  run grep -A5 "decision tree\|partially available" docs/runbook.md
  assert_success
}
```

**T3.3.3 — Runbook is executable by ops team member with no prior DR experience**
```bash
# RED: Fails; operability test not implemented
test "runbook steps are unambiguous and actionable" {
  run npm test -- runbook-operability.test.js
  assert_success
  assert_output --partial "ambiguous_steps: 0"
}
```

**T3.3.4 — Team training session is completed and logged**
```bash
# RED: Fails; training log not created
test "training session attendance log exists with sign-off" {
  run test -f docs/training-attendees.md
  assert_success
  ATTENDEES=$(grep -c "✅ Completed" docs/training-attendees.md)
  assert [ "$ATTENDEES" -ge 1 ]
}
```

**T3.3.5 — Runbook URL is included in all critical alerts**
```bash
# RED: Fails; alert templates don't include runbook URL
test "all CRITICAL alerts reference runbook" {
  run grep -l "docs/runbook.md" config/alerts/*.json
  assert_success
}
```

---

## Output 2 — Acceptance Verification Script

### S1.1 Verification

**Scenario 1.1.1 — Replication Strategy Review Meeting**
- [ ] Attend meeting with Ops/Security teams
- [ ] Review three replication options: sync, async, hybrid
- [ ] Confirm latency measurements: Auckland-Hamilton link
- [ ] Confirm TPS baseline: approximately 180,000 daily transactions (~2 TPS average)
- [ ] Commit to RPO value (S1.1 AC5 must output: "RPO: [N] minutes, decided [date]")
- [ ] Schedule QSA pre-scoping call (within 2 weeks)

---

### S1.2 Verification

**Scenario 1.2.1 — Replication Configuration Smoke Test**
- [ ] Apply replication configuration to PostgreSQL primary
- [ ] Verify replication slot appears in `pg_replication_slots`
- [ ] Insert test transaction on primary; confirm on secondary within 30 seconds
- [ ] Run checksum verification: zero differences reported
- [ ] Insert 10,000 test transactions over 5 minutes; zero loss detected

---

### S2.2 Verification

**Scenario 2.2.1 — Failover Test in Non-Production**
- [ ] Confirm QSA engagement (T2.2.2 gate check: assessment document signed)
- [ ] Trigger failover on primary
- [ ] Verify split-brain check passes (secondary acquires lock)
- [ ] Measure time from trigger to first transaction on secondary (must be < 5 min)
- [ ] Confirm connection string points to secondary
- [ ] Record failover audit trail entry

---

<!-- eval-mode: true -->
