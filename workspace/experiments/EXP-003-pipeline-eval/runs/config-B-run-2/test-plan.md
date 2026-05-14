# Test Plan — Payment Authorisation Secondary-Site Failover Capability

**Feature:** 2026-05-14-payment-authorisation-secondary-site-failover (eval run)
**Input artefacts:**
- Definition: `workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-2/definition.md`
- Review: `workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-2/review.md` — PASS Run 1
**Produced:** Copilot eval mode — Config B run 2
**Date:** 2026-05-14

> **Eval-mode note:** This is a consolidated test plan for all 7 stories (S1–S7). In a production run each story produces a separate test-plan file. The test runner is assumed to be the repo's standard Node/Jest suite (`npm test`) for infrastructure-as-code assertions; compliance checks are manual or scripted separately.

---

## Test data strategy

**Strategy:** Mixed — story-by-story breakdown below.

| Story | Strategy | Sensitivity |
|-------|----------|-------------|
| S1 — Hamilton provisioning | Synthetic Terraform plan outputs; mock Ansible inventory | None — no live data |
| S2 — Replication channel | Integration against a lab replication stream; synthetic transaction payloads for lag measurement | PCI DSS scope: synthetic PANs (test-card ranges only — 4111 111 111 111 111 etc.) |
| S3 — Lag telemetry / RPO assertion | Synthetic high-volume transaction batches; documented peak TPS profile (dependency — see gap table) | PCI DSS scope: same test-card range |
| S4 — Controlled failover test | Manual execution on isolated test environment; runbook steps are human-initiated | High sensitivity: test environment must not be production-connected |
| S5 — QSA preliminary scoping | Manual: interview notes, gap list document | Non-automated: PCI programme artefact |
| S6 — AML 5-yr retention evidence | Integration test against replication stream; verify record count / timestamps; audit report manual | AML/CFT Act Restricted — use synthetic account identifiers, not real |
| S7 — QSA formal assessment | Manual: QSA letter / attestation artefact | Non-automated: regulatory outcome document |

**PCI test data constraint:** No real PANs, CVVs, or cardholder names in any test fixture. Use only approved test-card ranges. CI must never persist PCI-scope data to logs.

**AML test data constraint:** Use synthetic NZ account identifiers (BSB+account format) with no connection to real persons. Retention window tests operate on synthetic transaction records with timestamps set to cover the 5-year span.

---

## AC coverage table

| Story | AC | Test type | Automated? | Test name |
|-------|-----|-----------|-----------|-----------|
| S1 | AC1 — Auckland DC resources freed | Manual (ops sign-off record) | No | Manual-01 |
| S1 | AC2 — Hamilton serving live traffic | Integration: health-check endpoint returns 200 and processes synthetic txn | Yes | INT-S1-01 |
| S1 | AC3 — Failover DNS update within 5 min | Integration: measure DNS TTL propagation after simulated failover trigger | Yes | INT-S1-02 |
| S1 | AC4 — Auckland recovery within 48 hr | Manual (runbook execution record) | No | Manual-02 |
| S2 | AC1 — Replication established before cutover | Integration: verify stream lag = 0 at T-1h in lab environment | Yes | INT-S2-01 |
| S2 | AC2 — Replication lag ≤ 15 min under normal load | Integration: inject 15-min synthetic backlog; measure lag recovery time | Yes | INT-S2-02 |
| S2 | AC3 — AML transaction records replicated with 5-yr retention flag | Integration: verify retention metadata on replicated records | Yes | INT-S2-03 |
| S2 | AC4 — PCI-scope data encrypted in transit | Unit: assert TLS config present on replication channel config object | Yes | UNIT-S2-01 |
| S3 | AC1 — Lag metric emitted to monitoring every 60 s | Integration: start replication stream; wait 65 s; assert metric present in monitoring sink | Yes | INT-S3-01 |
| S3 | AC2 — Lag ≤ 15 min under representative load | Integration: run synthetic peak-load profile; assert lag metric ≤ 15 min throughout (see gap table — load profile dependency) | Yes (blocked) | INT-S3-02 |
| S3 | AC3 — Alert fires when lag > 15 min | Integration: inject delay > 15 min; assert alert is raised in alerting system | Yes | INT-S3-03 |
| S3 | AC4 — Metrics dashboard shows real-time lag | Manual: smoke test — open dashboard; verify lag value updates within 60 s | No (UI) | Manual-03 |
| S4 | AC1 — Runbook documented and peer-reviewed | Manual: runbook document review checklist | No | Manual-04 |
| S4 | AC2 — Recovery ≤ 2 hr from trigger to first live auth at Hamilton (run 1) | Manual: timed execution of failover runbook in test environment; record timestamps | No | Manual-05 |
| S4 | AC3 — Recovery ≤ 2 hr (run 2 — independent execution) | Manual: second timed execution; verify ≤ 2 hr independently | No | Manual-06 |
| S4 | AC4 — Post-failover AML record integrity confirmed | Integration: after failover simulation, verify AML records in Hamilton match Auckland snapshot | Yes | INT-S4-01 |
| S5 | AC1 — PCI DSS scope for Hamilton documented | Manual: QSA scoping letter / workshop notes | No | Manual-07 |
| S5 | AC2 — QSA scoping call held and notes filed | Manual: meeting notes artefact present in artefacts/ | No | Manual-08 |
| S5 | AC3 — Gap list documented (or explicit no-gap record) | Manual: gap list artefact or no-gap declaration present | No | Manual-09 |
| S5 | AC4 — New stories created for any gaps, linked to S5 | Manual: backlog check; linked story IDs recorded | No | Manual-10 |
| S6 | AC1 — Hamilton replication includes transaction records with AML retention flag | Integration: verify retention flag on every replicated record | Yes | INT-S6-01 |
| S6 | AC2 — Retention flag holds value ≥ 5 years from transaction date | Unit: assert retention date = transaction date + 5 years for 50 synthetic records | Yes | UNIT-S6-01 |
| S6 | AC3 — Report to internal audit with evidence attached | Manual: audit report artefact present and internally reviewed | No | Manual-11 |
| S6 | AC4 — Internal audit response recorded (closure or follow-on) | Manual: response artefact or follow-on ticket logged | No | Manual-12 |
| S7 | AC1 — QSA formal assessment initiated | Manual: engagement letter or scope agreement signed | No | Manual-13 |
| S7 | AC2a — Each HIGH finding has closed remediation with evidence | Manual: remediation evidence document per finding | No | Manual-14 |
| S7 | AC2b — Each HIGH finding with no remediation has named RISK-ACCEPT | Manual: RISK-ACCEPT in decisions.md with named executive approver | No | Manual-15 |
| S7 | AC3 — QSA issues formal AoC or letter confirming compliant scope | Manual: QSA letter artefact present | No | Manual-16 |
| S7 | AC4 — Assessment outcome (pass/provisional/fail) and rationale recorded | Manual: outcome recorded in pipeline artefact | No | Manual-17 |

---

## Unit tests

### UNIT-S2-01 — TLS configuration present on replication channel
- **Covers:** S2 AC4
- **Precondition:** Replication channel configuration module exists
- **Action:** Instantiate configuration object; assert `tls: true` / `encryption: 'tls1.2+'` is present
- **Expected:** Configuration object contains required TLS fields; assertion passes
- **Edge case:** None — config-level assertion

### UNIT-S6-01 — AML retention date = transaction date + 5 years
- **Covers:** S6 AC2
- **Precondition:** `setRetentionMetadata(transaction)` function exists
- **Action:** Call with 50 synthetic transactions spanning 2019-01-01 to 2026-05-14; assert each retention date equals transaction date + exactly 5 years (leap-year boundary cases included)
- **Expected:** All 50 assertions pass; no off-by-one on leap years
- **Edge case:** Transactions on 2020-02-29 → retention date 2025-02-28 (non-leap year)

---

## Integration tests

### INT-S1-01 — Hamilton health-check returns 200 after provisioning
- **Covers:** S1 AC2
- **Precondition:** Terraform apply completed; Hamilton instance running
- **Action:** Issue HTTP GET to `https://hamilton.internal/health`; inject one synthetic payment authorisation request
- **Expected:** 200 response; authorisation processed and logged

### INT-S1-02 — DNS failover update propagates within 5 minutes
- **Covers:** S1 AC3
- **Precondition:** Lab DNS environment with configurable TTL
- **Action:** Simulate failover trigger; poll DNS every 30 s for 5 min; record first resolution to Hamilton IP
- **Expected:** DNS resolves to Hamilton within 300 s of trigger

### INT-S2-01 — Replication stream lag = 0 at T-1h
- **Covers:** S2 AC1
- **Precondition:** Replication channel configured in lab environment; synthetic backlog cleared
- **Action:** Run replication for 1 hr; assert lag = 0 at T-1h mark
- **Expected:** `replication_lag_seconds` metric = 0 (or < 5 s tolerance)

### INT-S2-02 — Replication lag recovers to ≤ 15 min after 15-min backlog injection
- **Covers:** S2 AC2
- **Precondition:** Replication channel running; monitoring sink accessible
- **Action:** Inject 15-min synthetic backlog (1000 records/min); measure time for lag metric to drop back to < 15 min
- **Expected:** Lag recovers to < 900 s within 15 min of backlog injection end

### INT-S2-03 — AML retention flag present on replicated records
- **Covers:** S2 AC3
- **Precondition:** Replication stream has produced ≥ 100 synthetic transaction records at Hamilton
- **Action:** Query Hamilton record store; assert each record has `aml_retention_years: 5` field set
- **Expected:** All records pass assertion; no missing retention flag

### INT-S3-01 — Lag metric emitted every 60 s
- **Covers:** S3 AC1
- **Precondition:** Replication channel running; telemetry agent configured; monitoring sink accessible
- **Action:** Start replication; wait 65 s; query monitoring sink for `payment.replication.lag` metric
- **Expected:** At least one metric data point present with timestamp within last 65 s

### INT-S3-02 — Lag ≤ 15 min under peak load [BLOCKED — see gap table]
- **Covers:** S3 AC2
- **Precondition:** Peak-load profile documented (DEPENDENCY — see gap table); load generator available
- **Action:** Run documented peak TPS for 30 min; assert `payment.replication.lag` ≤ 900 s throughout
- **Expected:** No lag breach during load run

### INT-S3-03 — Alert fires when lag > 15 min
- **Covers:** S3 AC3
- **Precondition:** Alerting system configured for `payment.replication.lag > 900`
- **Action:** Inject deliberate 20-min lag (pause replication consumer); assert alert fires within 2 min of breach
- **Expected:** Alert notification received in alerting system within 120 s of lag breach

### INT-S4-01 — AML records at Hamilton match Auckland snapshot post-failover
- **Covers:** S4 AC4
- **Precondition:** Failover simulation completed; Auckland snapshot taken at T=0
- **Action:** Query Hamilton AML record store; compare checksums of synthetic transaction IDs against Auckland snapshot
- **Expected:** Record counts match; checksums match; no missing records

### INT-S6-01 — Every replicated transaction has AML retention flag
- **Covers:** S6 AC1
- **Precondition:** Replication stream has produced synthetic records at Hamilton
- **Action:** Full scan of Hamilton record store; assert `aml_retention_years` field present and ≥ 5 on every record
- **Expected:** Zero records missing flag; zero records with value < 5

---

## NFR tests

### NFR-RTO — Failover recovery time ≤ 2 hr (C1)
- **Test:** Manual — two independent timed runbook executions (S4 Manual-05, Manual-06)
- **Expected:** Both executions complete within 7200 s from trigger to first authorisation

### NFR-RPO — Replication lag ≤ 15 min under load (C1)
- **Test:** INT-S2-02 + INT-S3-02 (blocked until load profile documented)
- **Expected:** No lag breach ≥ 900 s during normal or peak operation

### NFR-PCI — No real PCI-scope data in test fixtures
- **Test:** CI lint: grep test fixtures directory for known PAN patterns (`4[0-9]{15}` outside approved test-card ranges); fail build if found
- **Expected:** Zero matches

### NFR-AML — 5-yr retention flag on all replicated records (C3)
- **Test:** INT-S6-01 + UNIT-S6-01
- **Expected:** All assertions pass

### NFR-ENCRYPT — TLS on replication channel (C2 supporting control)
- **Test:** UNIT-S2-01
- **Expected:** Config assertion passes

### NFR-RESIDENCY — All data remains in New Zealand data centres
- **Test:** Manual: Terraform plan review; assert no replication endpoint outside NZ regions
- **Expected:** No non-NZ endpoints in Terraform plan output

---

## Gap table

| AC | Story | Gap type | Handling | Risk-accept required? |
|----|-------|----------|---------|----------------------|
| S3 AC2 | S3 | Test data dependency — peak TPS profile not yet documented (finding 1-L1) | Blocked pending load profile documentation; assign to infrastructure team with deadline before story start | Yes — if proceeding without profile, log in /decisions |
| S5 AC1–AC4 | S5 | Manual-only — QSA process artefacts not automatable | Manual scenarios in verification script; mark manual in DoR | No — inherent to regulatory process |
| S7 AC1–AC4 | S7 | Manual-only — QSA formal assessment artefacts | Manual scenarios in verification script | No — inherent to regulatory process |
| S3 AC4 | S3 | UI / dashboard — smoke test only, no automated DOM assertion for live-updating lag value | Manual scenario; dashboard render cannot be asserted in jsdom | No — low risk; lag metric itself is tested |
| S6 AC3–AC4 | S6 | Manual-only — internal audit response is a human process | Manual scenarios | No — inherent to audit process |

---

## Verification script — AC verification (human-readable)

> This script is for: (1) pre-code sign-off by a domain expert; (2) post-merge smoke test; (3) delivery review walkthrough.

### Setup

- Requires: test environment with Hamilton lab instance provisioned; replication stream configured in lab mode; monitoring dashboard accessible; no production connections active.
- Reset between scenarios: clear synthetic transaction records from Hamilton record store; reset lag metric in monitoring sink.

---

### Epic 1 — Failover Skeleton & Replication SLO

**Scenario 1 (S1 AC2/AC3): Hamilton processes live traffic after provisioning**

1. Confirm the Hamilton infrastructure has been provisioned (Terraform apply completed, no errors).
2. Open a terminal and run: `curl https://hamilton.internal/health` — expect HTTP 200.
3. Send one synthetic payment authorisation request through the test harness.
4. Confirm the request appears in the Hamilton transaction log within 30 seconds.
5. Simulate a failover trigger (use the runbook trigger command).
6. Start a timer. Poll `nslookup payments.internal` every 30 seconds.
7. Record when the DNS response first returns the Hamilton IP address.
8. Confirm the time elapsed is under 5 minutes.
9. **PASS** if both the health check and the DNS update complete successfully. **FAIL** if DNS takes > 5 minutes or health check returns non-200.

**Scenario 2 (S1 AC1/AC4): Auckland resources freed and recoverable**

1. After the failover simulation above, verify with the operations team that Auckland DC resources have been freed (ops sign-off record filed).
2. Check that a documented recovery plan exists for bringing Auckland back within 48 hours.
3. **PASS** if ops sign-off record is present and the 48-hr recovery plan is documented. **FAIL** if either is absent.

**Scenario 3 (S2 AC1/AC2): Replication lag under normal load**

1. Ensure the replication stream is running in lab mode.
2. Inject no additional load. After 60 minutes, check the `payment.replication.lag` metric in the monitoring dashboard.
3. Confirm lag = 0 (or < 5 seconds tolerance).
4. Inject a synthetic 15-minute transaction backlog (1000 records/minute) using the load generator.
5. Monitor the lag metric. Confirm it recovers to under 15 minutes within 15 minutes of the backlog injection ending.
6. **PASS** if both conditions met. **FAIL** if lag stays above 15 minutes after recovery window.

**Scenario 4 (S2 AC3/S6 AC1): AML retention flag on all replicated records**

1. After replication has been running for at least 10 minutes, query the Hamilton record store for all synthetic transaction records.
2. For each record, confirm the `aml_retention_years` field is present and set to 5 (or greater).
3. Pick 3 records at random and confirm the `aml_retention_end_date` = transaction date + exactly 5 years (check a leap-year case if available).
4. **PASS** if all records have the correct retention flag. **FAIL** if any record is missing it or has an incorrect date.

**Scenario 5 (S2 AC4): Replication channel uses TLS**

1. Review the replication channel configuration file (ask the developer to point you to it).
2. Confirm `tls: true` (or equivalent encryption setting) is present.
3. If available, run a network capture on the lab replication stream and confirm traffic is encrypted.
4. **PASS** if TLS is configured. **FAIL** if plaintext replication is used.

**Scenario 6 (S3 AC1/AC3): Lag metric emits every 60 s; alert fires on breach**

1. Open the monitoring dashboard. Confirm the `payment.replication.lag` metric is displayed and updates at least once per minute.
2. Deliberately pause the replication consumer (use the test-harness pause command) for 16 minutes.
3. Confirm an alert notification appears in the alerting system within 2 minutes of the 15-minute breach.
4. Resume the consumer. Confirm the alert clears once lag returns to < 15 minutes.
5. **PASS** if metric updates correctly and alert fires and clears as described. **FAIL** otherwise.

🔴 **Scenario 7 (S3 AC4) — Manual, no automated equivalent**: Dashboard displays real-time lag

1. Open the monitoring dashboard in a browser.
2. In a separate window, inject a 5-minute synthetic backlog.
3. Within 60 seconds, confirm the lag value shown on the dashboard reflects the current lag (not a stale cached value).
4. **PASS** if the dashboard value matches the actual lag within 60 seconds. **FAIL** if the dashboard shows zero or a stale value while lag is elevated.

**Scenario 8 (S4 AC1/AC2/AC3): Controlled failover — recovery ≤ 2 hours (two runs)**

1. Obtain the peer-reviewed failover runbook (confirm it has been reviewed by at least one other engineer — name in the document).
2. **Run 1:** Start a timer. Execute the runbook from step 1 to completion. Record the time when the first synthetic payment authorisation processes successfully at Hamilton. Confirm elapsed time ≤ 2 hours.
3. **Run 2 (separate session, different executor):** Repeat run 1 with a different person executing. Confirm elapsed time ≤ 2 hours independently.
4. **PASS** if both runs complete ≤ 2 hours. **FAIL** if either run exceeds 2 hours.

---

### Epic 2 — Compliance Assurance

**Scenario 9 (S5 AC1–AC4): QSA preliminary scoping**

1. Confirm a QSA scoping workshop or call has been held (meeting notes filed in `artefacts/`).
2. Review the Hamilton scope document — confirm it lists the PCI DSS cardholder data environment (CDE) components that will be affected.
3. Review the gap list: confirm either (a) an explicit no-gap declaration exists, or (b) each gap has a corresponding story in the backlog with a recorded story ID linked to S5.
4. **PASS** if scoping document, workshop notes, and gap list/no-gap declaration all exist. **FAIL** if any are missing.

**Scenario 10 (S6 AC3/AC4): AML evidence report to internal audit**

1. Confirm the AML evidence report has been produced and filed in `artefacts/`.
2. Check the report includes: list of replicated record counts per month over the 5-year window, retention flag verification results, and the test results from Scenario 4 as evidence.
3. Confirm an internal audit response has been recorded (either a closure letter or a follow-on action ticket logged with a ticket ID).
4. **PASS** if report and response record both exist. **FAIL** if either is absent.

**Scenario 11 (S7 AC1–AC4): QSA formal assessment**

1. Confirm the formal QSA engagement has been initiated (engagement letter or scope agreement signed).
2. Review the QSA findings list. For each HIGH finding: confirm either (a) remediation evidence is attached and the finding is marked closed, or (b) a RISK-ACCEPT entry exists in `decisions.md` with a named executive approver.
3. Confirm the QSA has issued a formal Attestation of Compliance (AoC) or equivalent letter.
4. Confirm the overall assessment outcome (pass / provisional / conditional) is recorded in the pipeline artefact.
5. **PASS** if all four conditions met. **FAIL** if any finding lacks remediation or risk-accept, or if no AoC is issued.

---

<!-- eval-mode: true -->
