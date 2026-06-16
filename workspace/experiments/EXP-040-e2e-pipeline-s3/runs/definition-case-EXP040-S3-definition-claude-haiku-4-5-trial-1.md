# /definition Pipeline Output — Inbound RTP Payments Story Breakdown

## Story Dependency Map & Sequencing

```
REGULATORY GATES (blocking)
├─ BS11-001: RBNZ Notification Filing
└─ CPG-001: CRO Sign-off Gate (fraud model decision)
    ↓
INFRASTRUCTURE & CONNECTORS
├─ CONN-001: Payments NZ Scheme Connectivity
├─ ISO-001: ISO 20022 Message Ingestion & Parsing
└─ FRAUD-001: Real-Time Fraud API Integration (vendor/build decision)
    ↓
REAL-TIME PROCESSING LAYER
├─ RTPL-001: Thin Real-Time Account Crediting Engine
├─ AML-001: Real-Time AML Screening (≥ NZD $1,000)
├─ FRAUD-002: Real-Time Fraud Screening (all payments)
└─ ACK-001: 10-Second Acknowledgement Generation & Return
    ↓
DATA INTEGRITY & OPS
├─ RECON-001: End-of-Day Reconciliation
└─ OPS-001: 24/7/365 Operational Readiness
```

---

## Story Definitions

### **REGULATORY TIER**

#### **BS11-001: RBNZ BS11 Notification Filing**
- **Persona:** P5 (RBNZ Regulatory Affairs)
- **Constraint:** C3 — 30 business-day pre-notification required before irreversible infrastructure work
- **Acceptance Criteria:**
  - [ ] BS11 formal notification submitted to RBNZ detailing inbound RTP processing scope
  - [ ] 30 business-day waiting period observed before first infrastructure commit
  - [ ] RBNZ acknowledgement or no-objection received (or 30 days elapsed)
  - [ ] Filing date & RBNZ response logged for audit trail
- **Dependencies:** None (must precede all infrastructure stories)
- **Priority:** BLOCKER — delays this delay all downstream work
- **Story Points:** 8

---

#### **CPG-001: CRO Sign-off on Real-Time Fraud Model Architecture**
- **Persona:** P4 (Chief Risk Officer), P3 (Financial Crime/Compliance)
- **Constraint:** C5 — CPG 220 / BS2B model validation gate
- **Description:** CRO must approve the fraud screening architecture *before* go-live, determining whether:
  - Use third-party real-time fraud API (lower risk, vendor dependency)
  - Build in-house real-time wrapper over batch system (schedule risk, latency risk)
  - Other hybrid approach
- **Acceptance Criteria:**
  - [ ] Fraud architecture options documented (vendor vs. build vs. hybrid)
  - [ ] Risk assessment completed for each option (latency, coverage, regulatory)
  - [ ] CRO formally approves selected architecture via sign-off document
  - [ ] Approval gates FRAUD-001 story (vendor selection or build kickoff)
- **Dependencies:** None (can run in parallel with BS11-001)
- **Priority:** BLOCKER — go-live gate
- **Story Points:** 5

---

### **INFRASTRUCTURE & CONNECTORS TIER**

#### **CONN-001: Payments NZ Scheme Connectivity & Onboarding**
- **Persona:** P2 (Payments Operations)
- **Constraint:** C1 (2026-09-01 deadline)
- **Description:** Establish network, API credentials, and connectivity to Payments NZ central RTP switching infrastructure. Complete scheme onboarding checklist.
- **Acceptance Criteria:**
  - [ ] Network connectivity (dedicated or VPN) established to Payments NZ RTP hub
  - [ ] Scheme-issued API credentials (keys, certificates, entity ID) provisioned and rotated into secure vault
  - [ ] Connectivity health check passes (scheme test gateway)
  - [ ] Scheme onboarding checklist completed (participant agreement, technical appendix signed)
  - [ ] 24-hour connectivity monitoring & alerting in place
- **Dependencies:** BS11-001 (RBNZ notification complete)
- **Priority:** HIGH — critical path
- **Story Points:** 8

---

#### **ISO-001: ISO 20022 Inbound Message Ingestion, Parsing & Validation**
- **Persona:** P2 (Payments Operations)
- **Constraint:** C2 (10-second ACK window — parsing must be sub-second), C1 (deadline)
- **Description:** Accept inbound ISO 20022 `pacs.008.003.08` credit transfer messages (Payments NZ variant). Parse, validate schema, extract key fields (debtor, creditor, amount, reference). Reject malformed messages with appropriate ISO error codes.
- **Acceptance Criteria:**
  - [ ] Inbound message listener receives ISO 20022 XML over SFTP/API from Payments NZ
  - [ ] Schema validation against Payments NZ variant DTD/XSD passes
  - [ ] Mandatory fields extracted (debtor account, creditor account, amount, timestamp, unique message ID)
  - [ ] Malformed messages logged and ISO error response queued (e.g., `pacs.002.003.08` rejection)
  - [ ] P99 parsing latency ≤ 100ms measured at 40,000 tph sustained load test
  - [ ] 100% message coverage in audit log (immutable trace for reconciliation)
- **Dependencies:** CONN-001 (scheme connectivity live)
- **Priority:** HIGH — critical path
- **Story Points:** 13

---

#### **FRAUD-001: Real-Time Fraud API Integration (Vendor/Build Decision & Delivery)**
- **Persona:** P3 (Financial Crime/Compliance), P2 (Payments Operations)
- **Constraint:** C9 (batch fraud system inadequate), C5 (CRO approval required), C2 (10-second window)
- **Description:** Integrate real-time fraud screening for all inbound payments. Delivery method determined by CPG-001 CRO sign-off.
- **Acceptance Criteria (Vendor Integration path):**
  - [ ] Third-party real-time fraud API vendor contract signed (SLA ≥99.5% uptime, P99 latency ≤2s)
  - [ ] API credentials provisioned; authentication (OAuth2/mTLS) tested
  - [ ] Payment attributes mapped to vendor's fraud scoring inputs
  - [ ] Fraud decision returned (risk score or flag) and logged
  - [ ] Fallback logic defined: if vendor API timeout/unavailable, decision path documented (accept/reject/queue)
  - [ ] P99 latency ≤ 2 seconds measured at 40,000 tph load test
  - [ ] Fraud decision audit trail immutable & timestamped
- **Acceptance Criteria (Build/Wrapper path):**
  - [ ] Real-time wrapper layer around batch fraud system designed (async queuing, priority lane)
  - [ ] Fallback: same-day batch fraud review with scheme-compliant ACK and settlement hold
  - [ ] P99 latency ≤ 3 seconds documented (or explicit schedule risk flagged)
  - [ ] CRO accepts risk of potential coverage gap vs. vendor solution
- **Dependencies:** CPG-001 (CRO architecture sign-off), ISO-001 (message parsing)
- **Priority:** CRITICAL — registered risk R3 on critical path
- **Story Points:** 21 (vendor) / 34 (build)

---

### **REAL-TIME PROCESSING LAYER TIER**

#### **AML-001: Real-Time AML/CFT Screening on Inbound Payments ≥ NZD $1,000**
- **Persona:** P3 (Financial Crime/Compliance), P2 (Payments Operations)
- **Constraint:** C4 (AML/CFT Act 2009 — 100% coverage on ≥$1,000), C2 (10-second ACK window), R1 (P99 latency risk)
- **Description:** For all inbound payments ≥ NZD $1,000, query AML screening system (existing real-time API) for sanctions, watchlist, and threshold alerts. Payments <$1,000 bypass AML screening.
- **Acceptance Criteria:**
  - [ ] Amount threshold logic implemented: ≥$1,000 → AML screening; <$1,000 → bypass
  - [ ] AML API call made with debtor & creditor account details + amount
  - [ ] Screening result (clear, alert, block) captured & logged immutably
  - [ ] P99 latency measured at RTP peak volumes (40,000 tph); if >8 seconds, escalate to R1 mitigation plan
  - [ ] Fallback defined: if AML API unavailable (timeout), decision path documented (accept with manual review flag, hold settlement, etc.)
  - [ ] 100% coverage audit: verify all ≥$1,000 payments screened; <$1,000 audit sample confirms bypass
  - [ ] Latency contribution to 10-second ACK window ≤ 3 seconds (P99)
- **Dependencies:** ISO-001 (message parsing), CPG-001 (if new AML model introduced)
- **Priority:** CRITICAL — regulatory requirement & latency risk
- **Story Points:** 13

---

#### **RTPL-001: Thin Real-Time Account Crediting Engine**
- **Persona:** P2 (Payments Operations), P3 (Financial Crime/Compliance)
- **Constraint:** C2 (10-second ACK window), C1 (deadline)
- **Description:** Receive parsed ISO 20022 message + fraud & AML screening results. Perform real-time account balance validation (available funds check on receiver side), then credit customer account. Log transaction in real-time ledger. Non-blocking on downstream reconciliation.
- **Acceptance Criteria:**
  - [ ] Account lookup (creditor account number → customer ledger) ≤ 500ms P99
  - [ ] Balance check (if required by risk rules) ≤ 200ms P99
  - [ ] Real-time credit posting to customer account ≤ 300ms P99
  - [ ] Transaction logged to real-time ledger with timestamp, amount, parties, screening results
  - [ ] Idempotency key (ISO message ID) prevents duplicate credits on retry
  - [ ] Total latency for RTPL-001 (account lookup + credit + logging) ≤ 1.5 seconds P99
  - [ ] 24/7 availability: no scheduled downtime; failover to backup instance < 30 seconds
- **Dependencies:** ISO-001 (parsed message), FRAUD-001 (fraud decision), AML-001 (AML decision)
- **Priority:** CRITICAL — core processing, 10-second window
- **Story Points:** 21

---

#### **ACK-001: 10-Second Scheme Acknowledgement Generation & Return**
- **Persona:** P2 (Payments Operations)
- **Constraint:** C2 (10-second hard compliance rule), C1 (deadline)
- **NFR:** Every story touching ACK path must deliver ≤ 8 seconds P99 latency to leave 2-second buffer
- **Description:** Generate ISO 20022 `pacs.002.003.08` payment status report (ACK) with transaction status (accepted, pending, or reject reason). Return to Payments NZ within 10 seconds of inbound message receipt.
- **Acceptance Criteria:**
  - [ ] ACK message generated (ISO 20022 `pacs.002.003.08` variant) with scheme-mandated fields
  - [ ] Transaction status: accepted (if passed fraud + AML + crediting), pending (if held for manual review), or rejected (with ISO error code)
  - [ ] ACK includes unique transaction reference, debtor/creditor, amount, original message ID
  - [ ] ACK queued to outbound API to Payments NZ within ≤ 500ms of credit posting
  - [ ] End-to-end measurement: message receipt → ACK sent ≤ 10 seconds P99 at 40,000 tph
  - [ ] Latency breakdown logged (parsing, AML, fraud, crediting, ACK generation) for tuning
  - [ ] Alerting: if P99 > 9.5 seconds, ops alert triggered
  - [ ] Message ID correlation (inbound → ACK) immutable & traceable for reconciliation
- **Dependencies:** ISO-001, FRAUD-001, AML-001, RTPL-001 (upstream in pipeline)
- **Priority:** CRITICAL — scheme compliance gate
- **Story Points:** 13

---

### **DATA INTEGRITY & OPERATIONS TIER**

#### **RECON-001: End-of-Day Reconciliation (Real-Time RTP Ledger ↔ Core Banking Batch)**
- **Persona:** P2 (Payments Operations)
- **Constraint:** C1 (deadline)
- **Description:** Each night (after 2359 NZT), reconcile real-time RTP transaction ledger against core banking batch settlement. Identify breaks, investigate root causes, produce reconciliation report.
- **Acceptance Criteria:**
  - [ ] EOD job scheduled 0100–0600 NZT (after RTP switch day boundary + settlement close)
  - [ ] All real-time RTP transactions matched to core banking (by message ID, amount, parties, timestamp tolerance ±5 minutes)
  - [ ] Break investigation report generated: unmatched transactions listed with reason (pending, reversed, corrected, timing gap)
  - [ ] Tolerance levels defined: acceptable variance (e.g., <0.01% value, zero transaction count breaks)
  - [ ] Reconciliation status reported to P2: green (100% matched), amber (breaks within tolerance), red (material unmatched)
  - [ ] Rollback procedure documented if material break discovered (e.g., reversal of incorrectly posted credits)
  - [ ] 24-hour break investigation SLA; escalation path to P3 if fraud/compliance issue suspected
- **Dependencies:** RTPL-001 (real-time ledger), ISO-001 (core message audit trail)
- **Priority:** HIGH — data integrity & audit
- **Story Points:** 13

---

#### **OPS-001: 24/7/365 Operational Readiness & Monitoring**
- **Persona:** P2 (Payments Operations)
- **Constraint:** C2 (10-second ACK window SLA), C1 (deadline), MVP scope (24/7/365 availability)
- **Description:** Establish operational runbooks, monitoring dashboards, alerting thresholds, and on-call escalation for the inbound RTP platform. Ensure end-to-end latency, throughput, and error handling are observable and actionable.
- **Acceptance Criteria:**
  - [ ] Real-time monitoring dashboard: message throughput (tph), P99 latency per stage (parsing, AML, fraud, crediting, ACK), error rates, queue depths
  - [ ] Alerting thresholds: P99 ACK latency > 9.5s, AML/fraud API unavailable, message queue > 500, inbound connectivity down, core banking ledger unreachable
  - [ ] On-call runbook: escalation path (L1 ops → L2 payments → P2 manager → P3 compliance if fraud flag), contact tree, war-room procedures
  - [ ] Fallback decision tree: if AML/fraud API unavailable, what is accept/hold/reject policy? CRO pre-approved
  - [ ] Logging & audit: all inbound/outbound messages, screening results, decisions, errors logged with timestamps & correlation IDs (immutable, ≥90-day retention)
  - [ ] Backup & DR: failover to secondary region ≤ 30 seconds; daily backup validation; 4-hour RTO
  - [ ] Training completed: L1 ops trained on dashboard, alert response, basic escalation; P2/P3 trained on investigation playbooks
  - [ ] Monthly health check: latency P99 trend analysis, error rate review, incident retrospectives, capacity planning check (headroom for 2026 volume growth)
- **Dependencies:** All upstream stories (CONN-001 through ACK-001)
- **Priority:** HIGH — operational excellence & continuity
- **Story Points:** 21

---

## Story Prioritisation & Timeline

| Story ID | Title | Priority | Points | Preconditions | Est. Finish (2026) |
|----------|-------|----------|--------|----------------|-----|
| **BS11-001** | RBNZ BS11 Notification | BLOCKER | 8 | None | 2026-05-15 |
| **CPG-001** | CRO Fraud Model Sign-off | BLOCKER | 5 | None | 2026-05