# Definition Output — T2 (AML C2 + C3 Competing)
**Case ID:** T2-competing-regulated
**Model:** claude-haiku-4-5
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "AML Transaction Monitoring Module" — Status: Approved
✅ Benefit-metric artefact found: "AML Transaction Monitoring — Regulatory Compliance Readiness"
✅ Metrics with targets: 2 (M1: screening latency p99 < 60s; M2: FMA model risk sign-off)

---

## Step 4a — Regulated constraint propagation check

**Regulated constraints detected in discovery:**

1. **Constraint 1 (C2 — Process Gate):** "AML Compliance Officer sign-off required under FMA Model Risk Policy before activation of automated screening rules — the model must pass independent validation by an FMA-registered assessor before any live transaction screening occurs."
   - Obligation: FMA Model Risk Policy
   - Approving authority: AML Compliance Officer + FMA-registered assessor
   - Gate condition: Independent model validation completed before automated screening rules activated
   - Type: Process gate (hard activation dependency)
   - **Triggers stories:** Rule engine deployment, model validation, go-live stories

2. **Constraint 2 (C3 — Retention Rule):** "All transaction records and all screening decisions must be retained at a geographically separate location for a minimum of 5 years per AML/CFT Act s.24(1)."
   - Obligation: AML/CFT Act s.24(1)
   - Requirement type: Data retention and geographic replication (technical/regulatory)
   - **Triggers stories:** Data persistence, replication, audit trail stories

3. **Constraint 3 (Technical):** Screening must process each transaction within 60 seconds at 2,000 TPS sustained peak load

**Constraint propagation plan:**
- C2 (FMA sign-off gate) will be propagated to Story 5 (FMA Model Risk Validation & Sign-Off) as an explicit AC
- C3 (5-year retention) will be propagated to Story 4 (Transaction Record Retention & Geographic Replication) as an explicit AC
- C2 and C3 are in separate stories because they address different concerns (process gate vs. data engineering)

---

## Step 2 — Slicing strategy

**Strategy chosen:** Risk-first (highest-risk / highest-regulatory-dependency stories first)
**Rationale:** FMA Model Risk sign-off (C2) is a hard gate blocking go-live; it must be validated early. If the model fails validation, the entire feature is blocked. AML/CFT retention (C3) is a parallel data engineering constraint. Decomposing risk-first ensures compliance risks are surfaced before engineering effort is committed.

---

## Step 3 — Epic structure

**Single epic: AML Transaction Monitoring — Real-Time Screening & Compliance**
- **Stories:** 5 stories
- **Rationale:** Transaction monitoring is a cohesive feature spanning event streaming, rule engine, compliance workflow, and regulatory validation. All stories are tightly coupled through the event stream and shared audit trail.

---

## Stories

### Story 1: Real-Time Transaction Event Stream

**Persona:** Payments Operations Engineer
**Connects to:** Metric M1 (latency requirement: screening within 60s)

**As a** Payments Operations Engineer **I want** to establish a real-time event stream that captures transaction events from the payment gateway and delivers them to the screening engine with latency < 60 seconds **so that** compliance analysts can screen transactions in real-time rather than 18+ hours later

**MVP Scope items covered:** Scope item 1 (real-time event stream)

**Out of scope:**
- SAR filing automation
- Upstream payment origination changes
- Watchlist management UI
- Historical re-screening

**Assumptions to test:**
- Peak transaction volume 2,000 TPS; event stream must not become bottleneck

**Architecture Constraints:**
- Event delivery latency: < 60 seconds end-to-end (measurement point: transaction-to-screening-decision)
- Event stream must be durable (no transaction loss on outage)
- Must support at least 2,000 TPS sustained peak load without backlog accumulation

**Acceptance Criteria:**

1. Given a transaction is completed in the payment gateway, When the transaction event is emitted, Then the event is delivered to the screening engine queue within 60 seconds at p99

2. Given the event stream reaches sustained peak load (2,000 TPS), When new transactions are emitted, Then queued events are processed without indefinite backlog accumulation; p99 latency remains < 60s

3. Given the screening engine is temporarily offline, When transactions continue to arrive, Then events are durably queued (at least 1 hour buffer) and are processed once the engine recovers (no transaction loss)

---

### Story 2: Configurable AML/CFT Screening Rule Engine

**Persona:** AML Compliance Analyst
**Connects to:** Metric M1 (screening decision latency)

**As a** AML Compliance Analyst **I want** to deploy a configurable rule set for detecting AML/CFT patterns (velocity anomalies, structuring, counterparty watchlist matching) without requiring code changes **so that** I can adapt screening rules as typologies evolve without waiting for engineering deployment cycles

**MVP Scope items covered:** Scope item 2 (configurable rule set)

**Out of scope:**
- Watchlist management UI (static watchlist loaded via admin process)
- SAR filing automation
- Custom rule language extensibility (post-MVP)

**Assumptions to test:**
- Screening rule library from vendor can be exported and imported; not yet tested

**Architecture Constraints:**
- Rule evaluation must complete within 60-second SLA per transaction
- Rule set must be version-controlled and immutable once deployed
- Rule audit trail: which rule version screened which transaction must be recorded

**Acceptance Criteria:**

1. Given a transaction event arrives in the screening engine, When the event is matched against the rule set, Then all configured rules (velocity, structuring, watchlist) are evaluated within 30 seconds (leaving 30s margin for alert queue processing)

2. Given a rule set is deployed to production, When a transaction is screened, Then the rule version that was applied is recorded in the audit trail (for FMA compliance evidence)

3. Given a new rule version is deployed, When transactions are screened, Then the new rule set is used; prior transactions' screening decisions are not retroactively altered

---

### Story 3: Alert Queue and Compliance Analyst Workflow

**Persona:** AML Compliance Analyst
**Connects to:** Metric M1 (real-time alerts enable timely SAR filing)

**As a** AML Compliance Analyst **I want** to receive alerts in a queue when transactions match screening rules, with the ability to quickly review, decide, and file a Suspicious Activity Report (SAR) if warranted **so that** I can file SARs within regulatory time windows (currently 18+ hours behind; target: real-time)

**MVP Scope items covered:** Scope item 3 (alert queue + compliance workflow)

**Out of scope:**
- SAR filing automation (compliance team owns filing)
- Watchlist UI (post-MVP)
- Upstream origination changes

**Assumptions to test:**
- Alert volume at 2,000 TPS: estimated 5–10 alerts/hour under normal conditions (if higher, analyst queue will overflow)

**Architecture Constraints:**
- Alert queue must preserve transaction event data and rule match evidence for analyst review
- Analyst actions (review, dismiss, escalate, file) must be logged immutably
- No PII (cardholder names, account numbers) should appear in alert metadata

**Acceptance Criteria:**

1. Given a transaction matches a screening rule, When the alert is generated, Then an analyst-facing alert record is created containing: transaction ID, rule matched, transaction amount, date, and a link to the full transaction event (without exposing raw account data)

2. Given an analyst reviews an alert, When the analyst confirms it is suspicious, Then the analyst can initiate a SAR filing workflow and capture the required narrative (the SAR filing system will accept this data)

3. Given an analyst dismisses an alert, When the action is recorded, Then an immutable audit entry is created: analyst ID, timestamp, alert ID, action (dismiss), and optional reason; the record is retained for regulatory review

---

### Story 4: Transaction Record Retention & Geographic Replication (5-Year AML/CFT Compliance)

**Persona:** Payments Compliance Manager
**Connects to:** Metric M2 (regulatory compliance) + C3 Constraint

**As a** Payments Compliance Manager **I want** all transaction records and all screening decisions to be retained at a geographically separate location for a minimum of 5 years per AML/CFT Act s.24(1) **so that** the institution meets regulatory obligations and can produce evidence of transaction screening upon regulatory request

**MVP Scope items covered:** Implicit — required by C3 constraint

**Out of scope:**
- SAR filing system
- Upstream payment data
- Historical re-screening

**Assumptions to test:**
- Storage cost and operational overhead of 5-year retention at separate location not yet quantified

**Architecture Constraints:**
- Transaction records must be replicated to a geographically separate location (different region/jurisdiction if possible)
- Replication must be synchronous or near-synchronous (no > 24-hour replication lag)
- Retention period: minimum 5 years per AML/CFT Act s.24(1)
- Records must be immutable (no alteration after initial write)

**Acceptance Criteria:**

1. Given a transaction is screened by the monitoring engine, When the transaction record (including screening decision, rule matched, analyst action) is written, Then the record is replicated to a separate geographic location within 24 hours

2. Given a compliance audit queries historical transaction records, When records from any point in the past 5 years are retrieved, Then all records are present and unaltered (integrity verified via cryptographic hash or equivalent)

3. Given the primary region is unavailable, When a compliance request arrives, Then transaction records can be retrieved from the geographically separate backup location without service interruption

---

### Story 5: FMA Model Risk Validation & Sign-Off (Go-Live Gate)

**Persona:** Payments Compliance Manager
**Connects to:** Metric M2 (FMA model risk sign-off — binary milestone)

**As a** Payments Compliance Manager **I want** the automated screening model/rule set to pass independent validation by an FMA-registered assessor under the FMA Model Risk Policy **so that** the AML Compliance Officer can authorize activation of real-time screening rules in production

**MVP Scope items covered:** Implicit — required by C2 constraint

**Out of scope:**
- Post-go-live monitoring
- Model retraining or tuning

**Assumptions to test:**
- FMA assessment timeline: 3–5 months from submission; if longer, go-live is delayed

**Architecture Constraints:**
- Rule engine, alert queue, and retention infrastructure must be complete and tested before validation begins
- Validation environment must mirror production (same rule set, same transaction volume simulation)
- All audit trails and logging must be in place for FMA review

**Acceptance Criteria:**

1. Given the screening rule engine, alert queue, and retention systems are complete and tested, When stories 1–4 are verified, Then a validation readiness checklist is compiled covering: rule logic, model/rule governance, alert procedures, and retention compliance; signed off by engineering and compliance teams

2. **Given the validation readiness checklist is signed off, When an FMA-registered independent assessor is engaged, Then the assessor conducts an assessment against the FMA Model Risk Policy to verify the screening model/rule set meets regulatory expectations for model governance, validation, and performance**

3. **Given the FMA assessment is complete, When the FMA-registered assessor confirms model risk validation passed, Then the assessor issues a formal validation sign-off, the AML Compliance Officer authorizes activation of automated screening rules in production, and real-time screening is activated**

**Architecture Constraints (Regulated — C2):**
- **Regulated constraint C2 (FMA Model Risk sign-off) is an explicit gate in this story's Acceptance Criterion 3** — production activation of automated screening rules is not permitted until this AC is satisfied
- **Approving authority:** FMA-registered independent assessor (per FMA Model Risk Policy)
- **Gate condition:** Model risk validation completed + formal sign-off document received
- **This story is a hard go-live blocker** — stories 1–4 can be implemented in parallel, but story 5 AC3 must be satisfied before production deployment of automated screening

---

## Scope accumulator

**Discovery MVP scope items:**
1. ✅ Real-time transaction event stream — covered by Story 1
2. ✅ Configurable screening rule set — covered by Story 2
3. ✅ Alert queue + compliance workflow — covered by Story 3
4. ✅ Full audit trail — covered by Story 4

**Regulated constraints:**
- ✅ C2 (FMA Model Risk sign-off) — covered by Story 5 AC3
- ✅ C3 (5-year retention at separate location) — covered by Story 4 ACs

**Out-of-scope items correctly excluded:**
- SAR filing automation ✅
- Upstream payment origination changes ✅
- Watchlist management UI ✅
- Historical re-screening ✅

**Scope drift:** None — all stories map directly to discovery MVP scope or regulated constraints
