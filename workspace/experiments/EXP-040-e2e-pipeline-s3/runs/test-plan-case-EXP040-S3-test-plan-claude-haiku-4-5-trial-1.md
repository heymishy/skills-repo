# Test Plan: ACK-001 — 10-Second Scheme Acknowledgement Generation & Return

## 1. Test Plan Overview

**Objective:** Verify that the enterprise generates and returns ISO 20022 pacs.002.003.08 acknowledgement messages within 10 seconds (P99) at 40,000 tph sustained load, with correct transaction status determination and comprehensive latency observability.

**Scope:**
- ACK message generation with scheme-mandated fields
- Transaction status determination (accepted/pending/rejected)
- End-to-end latency measurement (receipt → ACK sent)
- Latency breakdown logging per processing stage
- Operational alerting at 9.5s threshold
- Performance under 40,000 tph sustained peak load

**Out of Scope:**
- Internal fraud vendor API behavior
- Internal AML system behavior
- Core banking ledger logic

---

## 2. Test Categories & Test Cases

### 2.1 Functional Testing — ACK Message Generation (AC1)

| Test ID | Description | Inputs | Expected Output | Pass Criteria |
|---------|-------------|--------|-----------------|----------------|
| F-ACK-001 | Valid pacs.002.003.08 structure | ISO 20022 inbound message | pacs.002.003.08 XML envelope | Message conforms to ISO 20022 schema |
| F-ACK-002 | Unique transaction reference included | Inbound payment message | ACK with unique txn ref | Ref field populated and unique per message |
| F-ACK-003 | Debtor/creditor details mirrored | Inbound with debtor/creditor | ACK contains original debtor/creditor | Fields match inbound message |
| F-ACK-004 | Amount field populated | Inbound with amount=NZD 100.00 | ACK with amount=NZD 100.00 | Amount matches and formatted correctly |
| F-ACK-005 | Original message ID referenced | Inbound MsgId=ABC123 | ACK with OrigMsgId=ABC123 | Original message ID correctly linked |
| F-ACK-006 | All scheme-mandated fields present | Valid inbound message | Complete pacs.002 | All 6 mandatory fields (ref, debtor, creditor, amount, orig ID, status) present |

---

### 2.2 Functional Testing — Transaction Status Determination (AC2)

| Test ID | Description | Scenario | Expected Status | Pass Criteria |
|---------|-------------|----------|-----------------|----------------|
| F-STS-001 | Status = ACCEPTED | Fraud PASS + AML PASS + credit POST success | Accepted | ACK status = "ACCC" (AcceptedCustomerCredit) |
| F-STS-002 | Status = PENDING | Fraud or AML returns hold/review flag | Pending | ACK status = "ACWC" (AcceptedWithChange) or "PEND" |
| F-STS-003 | Status = REJECTED | Fraud FAIL or AML FAIL or credit FAIL | Rejected | ACK status = "RJCT" with ISO error code |
| F-STS-004 | ISO error code on rejection (fraud fail) | Fraud validation fails | Rejected + error code | Error code field populated (e.g., "AG01", "CUST", "NOAS") |
| F-STS-005 | ISO error code on rejection (AML fail) | AML validation fails | Rejected + error code | Error code field populated |
| F-STS-006 | ISO error code on rejection (credit fail) | Ledger posting fails | Rejected + error code | Error code field populated |
| F-STS-007 | Status consistency | Multiple messages processed | All statuses deterministic | Same input → same status output |

---

### 2.3 Functional Testing — ACK Queueing (AC3)

| Test ID | Description | Inputs | Expected Behavior | Pass Criteria |
|---------|-------------|--------|-------------------|----------------|
| F-QUEUE-001 | ACK queued within 500ms of credit post | Credit post completes at T=100ms | ACK in outbound queue by T=600ms | Latency credit-post → queue ≤ 500ms |
| F-QUEUE-002 | ACK queued for accepted transactions | Status = ACCEPTED | Message reaches outbound API queue | Queue entry visible in logs |
| F-QUEUE-003 | ACK queued for pending transactions | Status = PENDING | Message reaches outbound API queue | Queue entry visible in logs |
| F-QUEUE-004 | ACK queued for rejected transactions | Status = REJECTED | Message reaches outbound API queue | Queue entry visible in logs |
| F-QUEUE-005 | No duplicate ACKs | Single inbound message | Single ACK queued | Only one ACK per inbound message |
| F-QUEUE-006 | Outbound API reachability | Outbound API available | ACK successfully sent | HTTP 2xx response from Payments NZ API |

---

### 2.4 Performance Testing — End-to-End Latency (AC4, NFR-1)

| Test ID | Description | Load | Measurement Point | Target | Pass Criteria |
|---------|-------------|------|-------------------|--------|----------------|
| P-E2E-001 | P99 latency at 40k tph | 40,000 tph sustained | Message receipt → ACK sent | ≤ 10s P99 | Measured P99 ≤ 10.00s |
| P-E2E-002 | P95 latency at 40k tph | 40,000 tph sustained | Message receipt → ACK sent | Baseline only | Recorded (no hard limit) |
| P-E2E-003 | P50 latency at 40k tph | 40,000 tph sustained | Message receipt → ACK sent | Baseline only | Recorded (no hard limit) |
| P-E2E-004 | Max latency at 40k tph | 40,000 tph sustained | Message receipt → ACK sent | < 10s | No single transaction exceeds 10s |
| P-E2E-005 | Latency stability over time | 40,000 tph for 30 min | P99 ACK latency per 5-min window | Consistent ≤ 10s | P99 remains stable, no degradation |
| P-E2E-006 | Latency under spike load | 50,000 tph for 2 min | P99 ACK latency during spike | ≤ 12s (degraded acceptable) | Recovers to ≤ 10s post-spike |

---

### 2.5 Performance Testing — Latency Breakdown Logging (AC5)

| Test ID | Description | Scenario | Expected Output | Pass Criteria |
|---------|-------------|----------|-----------------|----------------|
| P-LOG-001 | Parsing latency logged | Message receipt → validation complete | Latency value in ms | Parsing stage latency recorded |
| P-LOG-002 | AML latency logged | AML check start → completion | Latency value in ms | AML stage latency recorded |
| P-LOG-003 | Fraud latency logged | Fraud check start → completion | Latency value in ms | Fraud stage latency recorded |
| P-LOG-004 | Crediting latency logged | Credit post start → completion | Latency value in ms | Crediting stage latency recorded |
| P-LOG-005 | ACK generation latency logged | ACK build start → queue push | Latency value in ms | ACK generation stage latency recorded |
| P-LOG-006 | Correlation ID links all stages | All 5 stages for one message | Single correlation ID in all logs | Correlation ID matches across parsing, AML, fraud, credit, ACK logs |
| P-LOG-007 | Breakdown sums to total latency | 5 stage latencies + overhead | Sum ≈ total end-to-end latency | Breakdown accounts for ≥95% of total latency |
| P-LOG-008 | Latency logs queryable | Run test + query logs | Retrieve latency by correlation ID | Logs searchable by txn ID or correlation ID |

---

### 2.6 Alerting Testing (AC6, NFR-2)

| Test ID | Description | Scenario | Expected Alert | Pass Criteria |
|---------|-------------|----------|-----------------|----------------|
| A-ALERT-001 | Alert triggered at P99 ≥ 9.5s | Sustained 40k tph with P99 = 9.5s | Alert fired | Alert raised within 30s of threshold breach |
| A-ALERT-002 | Alert NOT triggered at P99 < 9.5s | Sustained 40k tph with P99 = 9.4s | No alert | Alert not raised |
| A-ALERT-003 | Alert content includes metric | P99 threshold breach | Alert message states "P99 ACK latency = Xs" | Alert message includes P99 value |
| A-ALERT-004 | Alert content includes context | P99 threshold breach | Alert message includes load/tph | Alert shows current throughput |
| A-ALERT-005 | Alert routable to ops team | Alert triggered | Message sent to configured channel | Alert visible in monitoring dashboard / Slack / PagerDuty |
| A-ALERT-006 | Alert recovers when latency drops below 9.5s | P99 drops to 9.0s | Alert cleared/resolved | Alert status changes to OK |

---

### 2.7 Integration Testing — End-to-End Workflow

| Test ID | Description | Scenario | Expected Flow | Pass Criteria |
|---------|-------------|----------|----------------|----------------|
| I-E2E-001 | Full workflow: inbound → ACK sent | Valid payment inbound | Parse → AML → Fraud → Credit → ACK → Queue → Send | All stages complete, ACK reaches Payments NZ |
| I-E2E-002 | Workflow with rejection | Fraud check fails | Parse → AML → Fraud (FAIL) → ACK (REJECTED) → Queue → Send | ACK with rejection status sent within 10s |
| I-E2E-003 | Workflow with pending | Manual review triggered | Parse → AML → Fraud → Credit (PENDING) → ACK (PENDING) → Queue → Send | ACK with pending status sent within 10s |
| I-E2E-004 | Multiple concurrent workflows | 100 messages in parallel | All 100 messages processed concurrently | All ACKs generated and queued; no blocking |

---

### 2.8 Load & Stress Testing

| Test ID | Description | Ramp Profile | Duration | Target Metric | Pass Criteria |
|---------|-------------|--------------|----------|----------------|----------------|
| L-LOAD-001 | Sustained load at 40k tph | Ramp to 40k over 2 min, hold 30 min | 30 minutes | P99 ACK ≤ 10s | Sustained P99 ≤ 10s throughout |
| L-LOAD-002 | Peak spike handling | Ramp to 50k over 1 min, hold 5 min, ramp down | 7 minutes | P99 during peak ≤ 12s, recovery to ≤ 10s | P99 recovers within 5 min post-spike |
| L-LOAD-003 | Message queue depth monitoring | 40k tph sustained | 30 minutes | Queue depth ≤ 5,000 messages | No unbounded queue growth |
| L-LOAD-004 | Error rate at peak load | 40k–50k tph | 10 minutes | Error rate < 0.1% | <0.1% of messages fail ACK generation |
| L-LOAD-005 | CPU/memory utilization | 40k tph sustained | 30 minutes | CPU < 80%, memory stable | No resource exhaustion |

---

### 2.9 Compliance & Audit Testing

| Test ID | Description | Audit Point | Expected Evidence | Pass Criteria |
|---------|-------------|-------------|-------------------|----------------|
| C-COMP-001 | ACK message conforms to Payments NZ scheme | ISO 20022 schema validation | pacs.002.003.08 passes XSD validation | Schema compliance confirmed |
| C-COMP-002 | All scheme-mandated fields present | Scheme specification reference | All 6 fields documented in logs | Field checklist passed |
| C-COMP-003 | Error codes conform to ISO standards | ISO 20022 codelist reference | Error codes match ISO 20022 list | All error codes valid per ISO |
| C-COMP-004 | Latency measurement methodology documented | Test plan / runbook | Measurement method described | Methodology peer-reviewed |
| C-COMP-005 | Latency measurement reproducible | Repeat test 3x | P99 variance < 5% across runs | Results consistent within tolerance |

---

## 3. Test Environment & Setup

### 3.1 Test Environment Specs
- **Load generation tool:** JMeter / Gatling / custom NZ RTP traffic simulator
- **Message format:** ISO 20022 XML (pacs.008 inbound, pacs.002 outbound)
- **Database:** Production-like NZ schema with test accounts
- **External APIs:** Mock Payments NZ outbound endpoint (or staging)
- **Monitoring:** Prometheus metrics, ELK stack for latency logging, correlation IDs

### 3.2 Test Data
- **Valid inbound messages:** 100 templates covering all debtor/creditor scenarios
- **Fraud/AML scenarios:** 20 test cases (pass, fail, hold)
- **Edge cases:** Maximum amounts, special characters, leap seconds
- **Load profiles:** Ramped, sustained, spike, plateau patterns

### 3.3 Observability Setup
- Correlation ID generation: UUIDv4 per inbound message
- Latency measurement: Microsecond precision (system clock or NTP-synced)
- Logging framework: Structured JSON logs with timestamp, correlation ID, latency fields
- Metrics export: Prometheus histogram for P50/P95/P99 percentiles

---

## 4. Test Execution & Acceptance

### 4.1 Phase 1: Functional Verification (Dev Environment)
- **Scope:** F-ACK-*, F-STS-*, F-QUEUE-*, P-LOG-*, I-E2E-*
- **Timeline:** 3 days
- **Success criteria:** 100% pass rate
- **Owner:** Dev team + QA

### 4.2 Phase 2: Performance Baseline (Staging Environment)
- **Scope:** P-E2E-*, L-LOAD-001–003
- **Timeline:** 5 days (including ramp-down, root cause for any issues)
- **Success criteria:** P99 ≤ 10s at 40k tph; latency breakdown logged
- **Owner:** Performance engineering + QA

### 4.3 Phase 3: Compliance & Alerting (Staging/Pre-prod)
- **Scope:** A-ALERT-*, C-COMP-*, P-E2E-005–006
- **Timeline:** 3 days
- **Success criteria:** 100% alert coverage; scheme compliance confirmed
- **Owner:** QA + Compliance + Ops

### 4.4 Phase 4: Production Readiness (Production Canary)
- **Scope:** Repeat P-E2E-001, 004–005 in production with 1% traffic
- **Timeline:** 2 days
- **Success criteria:** P99 ≤ 10s confirmed in production; no scheme violations
- **Owner:** Ops + Platform

---

## 5. Reporting & Metrics

### 5.1 Key Test Results to Report
- **P99/P95/P50 ACK latency** at 40,000 tph with 95% confidence interval
- **Latency breakdown** (parsing, AML, fraud, credit, ACK generation) as % of total
- **Alert threshold validation:** Confirm 9.5s threshold fires before 10s hard limit
- **Error rate & retry count** during load testing
- **System resource utilization** (CPU, memory, disk I/O) at peak

### 5.2 Test Summary Template
```
Test Run: ACK-001 Functional & Performance Suite
Date: [DATE]
Environment: Staging
Load: 40,000 tph
Duration: 30 minutes sustained

Results:
├─ Functional Tests: 24/24 PASS
├─ Performance Tests: 6/6 PASS
│   └─ P99 ACK Latency: 8.32s (target: ≤10s