# Test Plan: ACK-001 — 10-Second Scheme Acknowledgement Generation & Return

## 1. Test Plan Overview

**Objective:** Verify that the enterprise generates and returns ISO 20022 pacs.002.003.08 acknowledgement messages within 10 seconds (P99) at 40,000 tph sustained load, in compliance with Payments NZ scheme requirements.

**Scope:** ACK generation logic, queuing to outbound API, end-to-end latency measurement, and operational alerting.

**Out of Scope:** Fraud vendor APIs, AML system internals, core banking ledger logic, pacs.001 validation logic.

---

## 2. Test Categories & Test Cases

### 2.1 Functional Tests — ACK Message Structure (AC1, AC2)

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| FT-001 | ACK generated for accepted transaction | ISO 20022 pacs.002.003.08 format; includes unique transaction ref, debtor/creditor, amount, original message ID, status=accepted | Message structure validates against ISO 20022 schema; all mandated fields present |
| FT-002 | ACK generated for pending transaction | Status = pending; ISO error code absent | Message generated without error code |
| FT-003 | ACK generated for rejected transaction | Status = rejected; ISO error code included | Appropriate ISO error code populated per rejection reason |
| FT-004 | Transaction reference uniqueness | Each ACK has unique transaction reference | No duplicate references in batch of 1,000 ACKs |
| FT-005 | Debtor/creditor fields populated | ACK contains correct debtor/creditor details from inbound message | Debtor/creditor match source pacs.001 |
| FT-006 | Amount field accuracy | ACK amount matches inbound transaction amount | Amount in ACK = original pacs.001 amount |
| FT-007 | Original message ID linkage | ACK references original pacs.001 message ID | OrigMsgId field correctly populated |
| FT-008 | Scheme-mandated fields completeness | All Payments NZ scheme-mandated fields present | Validation against scheme specification document passes |

---

### 2.2 Functional Tests — Status Determination Logic (AC2)

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| FT-009 | Status = accepted when fraud+AML+credit all passed | Transaction passes fraud check, AML check, and credit posting succeeds | ACK status field = "accepted" |
| FT-010 | Status = pending when held for manual review | Transaction flagged for manual review (e.g., high-risk profile, mid-processing review) | ACK status field = "pending" |
| FT-011 | Status = rejected with fraud block | Transaction blocked by fraud detection | ACK status = "rejected"; ISO error code = fraud-related code |
| FT-012 | Status = rejected with AML block | Transaction blocked by AML check | ACK status = "rejected"; ISO error code = AML-related code |
| FT-013 | Status = rejected with credit failure | Credit posting fails (insufficient funds, account blocked) | ACK status = "rejected"; ISO error code = credit-related code |
| FT-014 | Status = rejected with ISO validation error | Inbound message fails ISO schema validation | ACK status = "rejected"; ISO error code = validation error code |

---

### 2.3 Latency Tests — Queuing Deadline (AC3)

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| LT-001 | ACK queued within 500ms of credit posting | Time from credit posting confirmation → ACK queued to outbound API ≤ 500ms | P50, P95, P99 latencies ≤ 500ms; no outliers > 600ms |
| LT-002 | Latency measured for accepted transactions | Measure credit posting → queue time for accepted status | P99 ≤ 500ms |
| LT-003 | Latency measured for pending transactions | Measure decision → queue time for pending status | P99 ≤ 500ms |
| LT-004 | Latency measured for rejected transactions | Measure rejection decision → queue time for rejected status | P99 ≤ 500ms |
| LT-005 | Queuing latency under baseline load (1,000 tph) | Measure at low load | P99 ≤ 300ms (demonstrates headroom) |
| LT-006 | Queuing latency under sustained peak load (40,000 tph) | Measure under spec load | P99 ≤ 500ms |

---

### 2.4 End-to-End Latency Tests (AC4)

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| E2E-001 | E2E latency: message receipt → ACK sent at baseline load | 1,000 tph sustained | P99 E2E latency ≤ 5 seconds |
| E2E-002 | E2E latency at moderate load | 10,000 tph sustained | P99 E2E latency ≤ 8 seconds |
| E2E-003 | **E2E latency at peak load (CRITICAL)** | **40,000 tph sustained for ≥5 minutes** | **P99 E2E latency ≤ 10.0 seconds** |
| E2E-004 | E2E latency percentile distribution | 40,000 tph sustained | P50 ≤ 2s, P95 ≤ 7s, P99 ≤ 10s, P99.9 ≤ 11s |
| E2E-005 | E2E latency with mixed statuses | 40,000 tph mix of 70% accepted, 20% pending, 10% rejected | P99 E2E latency ≤ 10.0 seconds across all statuses |
| E2E-006 | Latency consistency over sustained duration | 40,000 tph for ≥10 minutes | P99 latency does not degrade over time; max variance ≤ 0.5s between 5min & 10min windows |
| E2E-007 | Latency under burst traffic (spike test) | Burst to 50,000 tph for 30 seconds, then return to 40,000 tph | P99 E2E latency ≤ 11 seconds during burst; recovers to ≤ 10 seconds within 2 minutes |

---

### 2.5 Latency Breakdown & Logging Tests (AC5)

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| LOG-001 | Parsing stage latency logged | Time from message receipt → parsing complete | Latency value recorded per transaction with correlation ID |
| LOG-002 | AML stage latency logged | Time from parsing complete → AML decision | Latency value recorded per transaction with correlation ID |
| LOG-003 | Fraud stage latency logged | Time from AML decision → fraud decision | Latency value recorded per transaction with correlation ID |
| LOG-004 | Credit posting stage latency logged | Time from fraud decision → credit posted | Latency value recorded per transaction with correlation ID |
| LOG-005 | ACK generation stage latency logged | Time from credit posted → ACK generated | Latency value recorded per transaction with correlation ID |
| LOG-006 | Queuing stage latency logged | Time from ACK generated → ACK queued to outbound API | Latency value recorded per transaction with correlation ID |
| LOG-007 | Correlation ID present in all logs | Every inbound message, ACK, and intermediate decision has correlation ID | Correlation ID matches across all stages; can reconstruct full transaction timeline |
| LOG-008 | Latency breakdown aggregation | Aggregate breakdown per stage over 1-minute window at 40,000 tph | P50/P95/P99 latencies per stage queryable; sum of stages ≤ E2E P99 |
| LOG-009 | Outlier transaction investigation | Enable drill-down on any transaction with E2E latency > 9 seconds | Stage-by-stage breakdown available via correlation ID |

---

### 2.6 Alerting Tests (AC6, NFR-2)

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| ALERT-001 | Alert triggered when P99 ACK latency ≥ 9.5s | Operational alert fired at 9.5s threshold | Alert fires within 60 seconds of P99 crossing 9.5s |
| ALERT-002 | Alert includes metric value and timestamp | Alert contains P99 latency value, measurement window, timestamp | Alert message readable; ops can identify root cause context |
| ALERT-003 | Alert does not trigger when P99 ≤ 9.5s | Baseline condition (compliant) | No false positives when latency is within limits |
| ALERT-004 | Alert clear/recovery notification | Alert clears when P99 drops back to ≤ 9.4s | Recovery notification sent; no stale alerts |
| ALERT-005 | Alert triggered before hard 10s limit breach | Alert at 9.5s provides 500ms buffer before scheme violation | Alert provides actionable lead time |
| ALERT-006 | Alert escalation if P99 exceeds 10.0s (CRITICAL) | Hard scheme limit breached | Critical alert + page on-call team; escalation confirmed received |

---

### 2.7 Load & Stress Tests (NFR-1, C1)

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| LOAD-001 | Sustained load: 40,000 tph for 10 minutes | Scheme peak sustained load requirement | P99 E2E latency ≤ 10.0s maintained throughout; zero dropped messages |
| LOAD-002 | Sustained load: 40,000 tph at mixed message sizes | Variable inbound message sizes (1KB–10KB) | P99 E2E latency ≤ 10.0s; no correlation with message size |
| LOAD-003 | Sustained load: 40,000 tph with queue depth monitoring | Monitor queue depth at each stage (parsing, AML, fraud, credit, ACK) | Max queue depth does not exceed system capacity; no backlog growth over time |
| LOAD-004 | Stress test: 50,000 tph (125% of spec load) | Exceed peak load by 25% | System handles gracefully; P99 E2E latency < 15 seconds; recovery ≤ 2 minutes to baseline |
| LOAD-005 | Stress test: 60,000 tph (150% of spec load) | 50% load overage | System does not crash; controlled degradation; errors logged; recovery confirmed |
| LOAD-006 | Concurrent transaction processing | Multiple transactions processed simultaneously at 40,000 tph | No cross-transaction contamination; isolation verified; no race conditions |
| LOAD-007 | Memory & CPU utilization at 40,000 tph | Monitor resource consumption at peak load | CPU ≤ 80%, Memory ≤ 85% of capacity; no memory leaks detected over 10-minute run |
| LOAD-008 | Garbage collection pause analysis | Monitor GC pauses during 40,000 tph load | Max GC pause < 500ms; full GC frequency ≤ once per 2 minutes |

---

### 2.8 Reliability & Error Handling Tests

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| REL-001 | ACK generation under AML system latency | AML system response time = 4 seconds (high latency) | E2E P99 latency still ≤ 10 seconds |
| REL-002 | ACK generation under fraud system latency | Fraud system response time = 3 seconds | E2E P99 latency still ≤ 10 seconds |
| REL-003 | ACK generation with credit posting delays | Credit posting latency = 2 seconds | E2E P99 latency still ≤ 10 seconds |
| REL-004 | Outbound API queue unavailable | Outbound API temporarily unreachable for 30 seconds | ACKs queued locally; no messages lost; resume sending when API available |
| REL-005 | Duplicate inbound message handling | Receive same pacs.001 twice (same message ID) | Only one ACK generated; idempotency confirmed |
| REL-006 | Malformed inbound message | Send ISO-invalid pacs.001 | Reject status ACK generated within 500ms; no cascade failures |
| REL-007 | Missing required fields in inbound | Omit mandatory pacs.001 field | Reject status ACK with appropriate ISO error code within 500ms |

---

### 2.9 Integration & Regression Tests

| Test ID | Test Case | Acceptance Criteria | Pass Criteria |
|---------|-----------|-------------------|---------------|
| INT-001 | ACK integration with Payments NZ outbound API | Send ACK to real/mock Payments NZ API endpoint | ACK received and acknowledged by API; no format errors |
| INT-002 | Correlation ID end-to-end traceability | Trace inbound pacs.001 → ACK generation → outbound ACK | Correlation ID maintained across all system boundaries |
| INT-003 | Latency metric ingestion to monitoring backend | Latency values exported to monitoring system | Metrics visible in dashboards; P99 calculation verified correct |
| INT-004 | Alert integration with incident management | Alert fires → incident system notified | Incident created in ticketing system; alert linked to incident |
| INT-005 | Regression: existing payment functionality unaffected | Run full payment processing suite alongside ACK generation | Existing tests pass; no degradation in other metrics |

---

## 3. Test Execution Strategy

### 3.1 Test Environment
- **Dev:** Unit & integration tests (FT, LOG tests)
- **Staging:** Load tests, latency measurement, alerting verification (LOAD, E2E, ALERT tests)
- **Production smoke test:** Post-deployment ACK verification (sample 1,000 transactions)

### 3.2 Test Data
- **Inbound pacs.001 messages:** 100 templates covering all debtor/creditor/amount combinations
- **Load generation:** Constant-rate traffic injector (40,000 tph ± variance <5%)
- **Message correlation IDs:** Unique UUID per test transaction

### 3.3 Success Criteria (All Tests)
- ✅ All functional tests (FT-001 to FT-014): **Pass**
- ✅ ACK queuing latency (LT-001 to LT-006): P99 ≤ 500ms
- ✅ **E2E latency at 40,000 tph (E2E-003): P99 ≤ 10.0 seconds — CRITICAL**
- ✅ Latency breakdown logging (LOG-001 to LOG-009): All stages logged with correlation IDs
- ✅ Alerting (ALERT-001 to ALERT-006): Alert fires at 9.5s; clears when P99 ≤ 9.4s
- ✅ Load tests (LOAD-001 to LOAD-008): Sustained 40,000 tph with zero dropped messages
- ✅ Reliability tests (REL-001 to REL-007): All error scenarios handled gracefully
- ✅ Integration tests (INT-001 to INT-005): ACK delivered to Payments NZ API; no regressions

### 3.4 Defect Thresholds
- **Blocker:** Any test failure in E2E-003 or ALERT-001 (scheme compliance/alerting)
- **Critical:** Load test failures, correlation ID missing, alert false positives
- **High:** Functional message structure issues, logging gaps, recovery failures
- **Medium:** Edge case status handling, latency variance > 15% between runs

---

## 4. Traceability Matrix

| Story AC / NFR | Test Case(s) | Risk Level |
|---|---|---|
| AC1 (pacs.002 structure) | FT-001, FT-005, FT-006, FT-007 | Medium |
| AC2 