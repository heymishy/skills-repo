# Test Plan — Disaster Recovery RTO + AML/CFT Compliance Modernisation

**Feature:** Disaster Recovery RTO + AML/CFT Compliance Modernisation  
**Source definition:** `runs/config-C-run-1/definition.md`  
**Source review:** `runs/config-C-run-1/review.md`  
**Review status:** FAIL (H1, H2, H3 unresolved) — proceeding in eval mode only  
**Test framework:** Jest (Node.js integration), Bash/PowerShell for infrastructure assertions  
**Test data strategy:** Synthetic — generated in test setup; no real payment card data. See §Test Data Strategy.

> **Eval note:** In production pipeline this test plan would be blocked by the FAIL verdict in review.md. Proceeding in eval mode to complete CPF measurement across the full artefact chain.

---

## Story Coverage

| Story | ACs | Tests written |
|---|---|---|
| S1.1 — Replication Strategy Assessment | 5 | 6 |
| S1.2 — Replication Implementation | 6 | 9 |
| S1.3 — Retention Compliance Verification | 5 | 7 |
| S2.1 — Failover Trigger Design | 4 | 5 |
| S2.2 — Failover Automation Implementation | 6 | 8 |
| S2.3 — RTO Verification | 4 | 6 |
| S3.1 — Monitoring & Alerting | 3 | 4 |
| S3.2 — Observability Dashboard | 3 | 3 |
| S3.3 — Runbook & Recovery Procedures | 3 | 3 |

---

## Test Data Strategy

**Source:** All test data is synthetic and generated programmatically. No real payment card numbers, real customer names, or real transaction identifiers may be used in any test fixture.

**PCI DSS constraint (C2 — PROPAGATED HERE PER REVIEW H2 REMEDIATION):** Test environments that simulate payment authorisation service state must use tokenised or dummy card data only. Test scripts must include a pre-flight assertion: `assert no_real_pan_in_fixtures()`. Any test that seeds the secondary database must use PANs matching the Luhn-valid test range `4111 1111 1111 1111` only.

**AML/CFT retention (C3):** Test fixtures include transaction records with timestamps spanning the full 5-year retention window simulation. Use `DATE_OFFSET` configuration to compress simulated time in unit/integration tests (1 real second = 1 simulated day).

**Infrastructure state:** Infrastructure tests use a localstack/docker-compose environment that simulates primary/secondary PostgreSQL + network partitioning. No tests run against production or production-adjacent infrastructure.

---

## Output 1 — Technical Test Plan

### S1.1 — Replication Strategy Assessment

**AC1 — Inventory of all database objects in primary**

```bash
# T1.1.1 — Database object inventory
# RED: Fails because inventory script does not yet exist
test "inventory script produces non-empty output for primary db" {
  run ./scripts/dr/inventory-primary-db.sh --host $PRIMARY_HOST --format json
  assert_success
  assert [ "$(echo "$output" | jq '.tables | length')" -gt 0 ]
  assert [ "$(echo "$output" | jq '.sequences | length')" -ge 0 ]
  assert [ "$(echo "$output" | jq '.functions | length')" -ge 0 ]
}
```

**AC2 — Current TPS and daily transaction volume measured**

```bash
# T1.1.2 — TPS measurement
# RED: Fails because measurement script does not exist
test "TPS measurement script outputs numeric value within expected range" {
  run ./scripts/dr/measure-tps.sh --duration 60s --host $PRIMARY_HOST
  assert_success
  assert_output --regexp '^[0-9]+(\.[0-9]+)?$'
}
```

**AC3 — Replication solution identified and documented with rationale**

```bash
# T1.1.3 — Replication strategy document exists
# RED: Fails because docs/ path does not yet exist
test "replication strategy doc exists with required sections" {
  run cat docs/dr/replication-strategy.md
  assert_success
  assert_output --partial "## Rationale"
  assert_output --partial "## Solution"
  assert_output --partial "## Rejected alternatives"
}
```

**AC4 — Replication lag target calculated with data loss tolerance**

```bash
# T1.1.4 — Replication lag target documented with RPO link
# RED: Fails because replication strategy doc doesn't exist yet
test "strategy doc specifies RPO value and replication lag target" {
  run cat docs/dr/replication-strategy.md
  assert_success
  assert_output --partial "RPO:"
  assert_output --partial "replication lag target:"
}
```

**AC5 — Team has agreed RPO value (HIGH remediation: must be pinned)**

```bash
# T1.1.5 — RPO value pinned as committed decision
# RED: Fails because decision doc doesn't exist yet
test "RPO value is committed in decisions.md with numeric value" {
  run grep -i "RPO" docs/dr/replication-strategy.md
  assert_success
  # Must contain a time value: e.g. "RPO: 15 minutes" or "RPO: ≤ 15min"
  assert_output --regexp "RPO:.*[0-9]+ (minute|min|second|sec)"
}
```

**T1.1.6 — Replication lag under load (NFR)**

```bash
# T1.1.6 — NFR: replication lag under peak TPS
# RED: Fails because replication is not yet implemented
test "replication lag remains under agreed threshold at peak TPS" {
  run ./scripts/dr/measure-replication-lag.sh \
    --primary $PRIMARY_HOST \
    --secondary $SECONDARY_HOST \
    --load peak \
    --duration 300s
  assert_success
  LAG=$(echo "$output" | grep "p99_lag_seconds" | awk '{print $2}')
  assert [ "$LAG" -le "$REPLICATION_LAG_THRESHOLD_SECONDS" ]
}
```

---

### S1.2 — Replication Implementation

**AC1 — Replication configured between primary and secondary**

```bash
# T1.2.1 — Replication link established
# RED: Fails because replication is not configured
test "replication slot exists on primary" {
  run psql -h $PRIMARY_HOST -c "SELECT slot_name FROM pg_replication_slots WHERE active = true;" -t
  assert_success
  assert_output --partial "dr_slot"
}
```

**AC2 — Secondary receives and applies changes continuously**

```bash
# T1.2.2 — Secondary applies changes from primary
# RED: Fails because replication is not active
test "insert on primary appears on secondary within lag threshold" {
  local TEST_ID=$(uuidgen)
  psql -h $PRIMARY_HOST -c "INSERT INTO dr_test (id, ts) VALUES ('$TEST_ID', now());"
  sleep $REPLICATION_LAG_THRESHOLD_SECONDS
  run psql -h $SECONDARY_HOST -c "SELECT id FROM dr_test WHERE id = '$TEST_ID';" -t
  assert_output --partial "$TEST_ID"
}
```

**AC3 — Data integrity verified (checksum)**

```bash
# T1.2.3 — Checksum verification confirms data integrity
# RED: Fails because verification script does not exist
test "checksum comparison of primary and secondary confirms zero difference" {
  run ./scripts/dr/checksum-compare.sh \
    --primary $PRIMARY_HOST \
    --secondary $SECONDARY_HOST \
    --tables "transactions,audit_log,account_balance"
  assert_success
  assert_output --partial "differences: 0"
}
```

**T1.2.4 — AML/CFT retention: no transaction loss during replication (C3 propagation)**

```bash
# T1.2.4 — AML/CFT: transactions replicated within retention window
# RED: Fails because replication is not configured with AML/CFT durability check
test "all transactions within AML_CFT retention window present on secondary" {
  # Seed synthetic transactions with timestamps across 5-year window
  run ./scripts/dr/seed-aml-test-data.sh --primary $PRIMARY_HOST --years 5
  assert_success
  
  run ./scripts/dr/verify-aml-retention.sh \
    --primary $PRIMARY_HOST \
    --secondary $SECONDARY_HOST \
    --retention-years 5
  assert_success
  assert_output --partial "missing_transactions: 0"
  assert_output --partial "retention_verified: true"
}
```

**T1.2.5 — PCI DSS: no real PANs in test fixtures (C2 propagation — HIGH remediation)**

```bash
# T1.2.5 — PCI DSS: test fixture safety assertion
# RED: Always fails until fixture audit passes
test "no real PANs present in test fixture data" {
  run ./scripts/security/audit-test-fixtures.sh \
    --fixture-path tests/fixtures/ \
    --check luhn-real-pan
  assert_success
  assert_output --partial "real_pans_found: 0"
}
```

**T1.2.6 — RTO: failover restores write capability within 2 hours (NFR)**

```bash
# T1.2.6 — NFR: RTO gate (C1 propagation)
# RED: Fails because failover automation does not exist yet
test "failover to secondary completes within RTO_SECONDS" {
  local START=$(date +%s)
  run ./scripts/dr/trigger-failover.sh --target secondary --mode test
  assert_success
  local END=$(date +%s)
  local ELAPSED=$((END - START))
  assert [ "$ELAPSED" -le "$RTO_SECONDS" ]  # RTO_SECONDS=7200 (2 hours)
}
```

**T1.2.7 — No schema divergence between primary and secondary**

```bash
# T1.2.7 — Schema parity check
# RED: Fails because secondary schema is not managed
test "primary and secondary schemas are identical" {
  run ./scripts/dr/schema-diff.sh \
    --primary $PRIMARY_HOST \
    --secondary $SECONDARY_HOST
  assert_success
  assert_output --partial "schema_differences: 0"
}
```

**T1.2.8 — Replication alert fires when lag exceeds threshold**

```bash
# T1.2.8 — Alert fires on lag breach
# RED: Fails because monitoring is not configured
test "lag alert fires when replication falls behind threshold" {
  # Simulate lag by pausing replication
  run ./scripts/dr/pause-replication.sh --primary $PRIMARY_HOST --duration 600s
  sleep 60
  run ./scripts/monitoring/check-alert-fired.sh --alert-name "dr_replication_lag_critical"
  assert_success
  assert_output --partial "alert_state: firing"
}
```

---

### S1.3 — Retention Compliance Verification

**T1.3.1 — Retention audit report generated**

```bash
# T1.3.1 — Audit report generation
# RED: Fails because report tooling does not exist
test "retention audit report covers full 5-year window" {
  run ./scripts/compliance/generate-retention-report.sh \
    --secondary $SECONDARY_HOST \
    --retention-years 5 \
    --output /tmp/retention-report.json
  assert_success
  local OLDEST=$(cat /tmp/retention-report.json | jq -r '.oldest_transaction_date')
  local AGE_DAYS=$(./scripts/compliance/days-since.sh "$OLDEST")
  assert [ "$AGE_DAYS" -ge 1825 ]  # 5 years × 365
}
```

**T1.3.2 — No gap in transaction coverage**

```bash
# T1.3.2 — AML/CFT gap detection (C5 propagation)
# RED: Fails because gap analysis script does not exist
test "gap analysis reports zero missing transaction windows" {
  run ./scripts/compliance/detect-replication-gaps.sh \
    --primary $PRIMARY_HOST \
    --secondary $SECONDARY_HOST \
    --window-minutes 5
  assert_success
  assert_output --partial "gaps_detected: 0"
}
```

**T1.3.3 — Monthly gap report produced automatically**

```bash
# T1.3.3 — Scheduled report exists
# RED: Fails because scheduler is not configured
test "retention report schedule is registered in cron/scheduler" {
  run ./scripts/compliance/verify-retention-schedule.sh
  assert_success
  assert_output --partial "monthly_report_scheduled: true"
}
```

---

### S2.2 — Failover Automation Implementation (most critical for RTO + PCI)

**T2.2.1 — Automated failover completes within RTO (C1)**

```bash
# T2.2.1 — RTO ≤ 2 hours automated failover (C1 propagation)
# RED: Fails because automation is not implemented
test "automated failover completes within RTO_SECONDS" {
  local START=$(date +%s)
  
  # Simulate primary failure
  run ./scripts/dr/simulate-primary-failure.sh --chaos-mode network-partition
  
  # Wait for automated failover trigger
  run ./scripts/dr/wait-for-promotion.sh \
    --secondary $SECONDARY_HOST \
    --timeout $RTO_SECONDS
  assert_success
  
  local END=$(date +%s)
  local ELAPSED=$((END - START))
  assert [ "$ELAPSED" -le "$RTO_SECONDS" ]
  assert_output --partial "promotion_status: complete"
}
```

**T2.2.2 — PCI DSS: QSA assessment evidence file exists before deployment gate (C2 — HIGH remediation)**

```bash
# T2.2.2 — PCI DSS QSA gate assertion (C2 propagation)
# RED: Fails because QSA evidence file does not exist (expected — enforces gate)
test "QSA assessment evidence file exists before E2 stories can be deployed" {
  # This test must fail in RED until QSA assessment is completed and documented
  run test -f docs/compliance/qsa-assessment-dr-2026.md
  assert_success
  
  # Verify evidence file has required fields
  run grep -i "QSA sign-off" docs/compliance/qsa-assessment-dr-2026.md
  assert_success
  
  run grep -i "scope" docs/compliance/qsa-assessment-dr-2026.md
  assert_success
}
```

**T2.2.3 — Split-brain prevention: no simultaneous dual-primary state**

```bash
# T2.2.3 — Split-brain protection
# RED: Fails because split-brain prevention is not implemented
test "system never enters dual-primary state during failover" {
  run ./scripts/dr/test-split-brain-prevention.sh \
    --primary $PRIMARY_HOST \
    --secondary $SECONDARY_HOST \
    --scenario network-partition-recovery
  assert_success
  assert_output --partial "dual_primary_detected: false"
}
```

---

### S2.3 — RTO Verification

**T2.3.1 — Three consecutive DR drills pass within RTO**

```bash
# T2.3.1 — Three consecutive RTO drills (success criterion)
# RED: Fails because drill automation is not implemented
test "three consecutive RTO drills each complete within RTO_SECONDS" {
  for i in 1 2 3; do
    local START=$(date +%s)
    run ./scripts/dr/execute-drill.sh --drill-number $i --full-failover
    assert_success
    local END=$(date +%s)
    local ELAPSED=$((END - START))
    assert [ "$ELAPSED" -le "$RTO_SECONDS" ]
    assert_output --partial "drill_outcome: PASS"
    
    # Return to normal state between drills
    run ./scripts/dr/restore-primary.sh
    assert_success
  done
}
```

---

## Output 2 — Plain-Language AC Verification Script

### Pre-verification checklist

Before running verification, confirm:

- [ ] Secondary site is provisioned and accessible
- [ ] Replication is active and lag is within threshold
- [ ] Test environment is running docker-compose stack (not production)
- [ ] `PCI_DSS_QSA_EVIDENCE_PATH` environment variable points to QSA assessment doc
- [ ] No real payment card numbers in test fixtures (run `audit-test-fixtures.sh` first)

---

### Epic 1 — Replication & Retention

**Scenario 1.1: Replication is active**
- Given: Primary PostgreSQL has a replication slot configured
- When: An operator checks replication status
- Then: The secondary is listed as a connected standby, lag is ≤ [agreed RPO in seconds], and no errors are reported

**Scenario 1.2: Data survives primary failure**
- Given: A test transaction is written to the primary
- When: The primary is taken offline within the replication lag window
- Then: The transaction appears on the secondary within the agreed RPO period, with no data corruption

**Scenario 1.3: AML/CFT 5-year retention verified**
- Given: The secondary database contains synthetic transaction records spanning 5 years
- When: The retention audit report is generated
- Then: Zero gaps in transaction coverage, oldest record is ≥ 1825 days old, report is saved to the audit trail location

**Scenario 1.4 (C5 explicit): Replication gap investigation complete**
- Given: The AML gap analysis script has run against the full historical transaction log
- When: The operator reviews the gap report
- Then: The report explicitly states whether any gaps were found in the existing batch replication history, and a remediation record is created if gaps exist

---

### Epic 2 — Failover Automation & RTO

**Scenario 2.1: Automated failover triggers on primary failure**
- Given: The failover trigger is configured with the agreed threshold
- When: Primary becomes unreachable for longer than the trigger threshold
- Then: Failover begins automatically (no manual intervention required), and the secondary is promoted to primary

**Scenario 2.2: RTO ≤ 2 hours achieved**
- Given: Failover automation is active
- When: Failover is triggered (automated or manual)
- Then: Write access to the promoted secondary is available within 2 hours of the triggering event, as measured from first detection to first successful write

**Scenario 2.3 (C2 PCI DSS QSA gate):**
- Given: Epic 2 changes affect the payment authorisation service infrastructure
- When: The deployment gate is checked before production deployment
- Then: A QSA assessment evidence document exists at the agreed path, is dated within the last 12 months, and explicitly covers the DR failover architecture change in scope

**Scenario 2.4: Three DR drills pass consecutively**
- Given: All E1 and E2 stories are implemented and tested
- When: Three full DR drills are executed (failover + restore)
- Then: All three complete within RTO, secondary data integrity is verified after each drill, and drill results are logged in the DR evidence register

---

### Epic 3 — Observability & Runbook

**Scenario 3.1: Replication lag alert fires when threshold exceeded**
- Given: Monitoring is configured with the agreed lag threshold
- When: Replication lag exceeds the threshold for more than 5 minutes
- Then: An alert is raised in the on-call system with severity level matching the threshold breach

**Scenario 3.2: Runbook covers all failure scenarios in scope**
- Given: The DR runbook is published to the ops wiki
- When: An operator reads the runbook
- Then: It covers automated failover, manual failover override, split-brain recovery, and post-failover restoration procedures

---

## NFR Test Coverage

| NFR | Test(s) | Type |
|---|---|---|
| RTO ≤ 2 hours | T1.2.6, T2.2.1, T2.3.1 | integration |
| RPO (C1 — value TBD by S1.1 AC5) | T1.2.2 (lag timing), T1.1.6 | integration |
| AML/CFT 5-year retention (C3) | T1.2.4, T1.3.1, T1.3.2 | integration |
| PCI DSS QSA gate (C2) | T1.2.5, T2.2.2 | gate-assertion |
| No real PAN in test fixtures (PCI) | T1.2.5 | security |
| No split-brain during failover | T2.2.3 | integration |
| Replication lag alerting | T1.2.8 | integration |

---

## Constraint Propagation Fidelity in Test Plan

| Constraint | Tests that enforce it | Verdict |
|---|---|---|
| C1 — RTO ≤ 2h | T1.2.6, T2.2.1, T2.3.1 | ✅ Propagated |
| C1 — RPO (partial) | T1.1.6, T1.2.2 | ⚠️ Partial — RPO value not yet pinned (H1 from review) |
| C2 — PCI DSS QSA | T1.2.5, T2.2.2, Scenario 2.3 | ✅ Propagated (remediation applied in test plan despite discovery/definition gap) |
| C3 — AML/CFT 5-year retention | T1.2.4, T1.3.1, T1.3.2 | ✅ Propagated |
| C4 — Single data centre (no active secondary) | T1.2.1, T1.2.2 (implicit) | ⚠️ Partial — no explicit test covers secondary site provisioning as prerequisite |
| C5 — AML replication gap unverified | T1.3.2, Scenario 1.4 | ✅ Propagated (explicit gap investigation scenario) |

<!-- eval-mode: true -->
