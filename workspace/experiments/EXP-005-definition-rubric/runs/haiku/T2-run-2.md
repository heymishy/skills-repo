# Definition Output — T2 (AML C2 + C3 Competing) — Trial 2
**Case ID:** T2-competing-regulated
**Model:** claude-haiku-4-5
**Date:** 2026-05-15
**Trial:** 2
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "AML Transaction Monitoring Module" — Status: Approved
✅ Benefit-metric artefact found: "AML Transaction Monitoring — Regulatory Compliance Readiness"
✅ Metrics with targets: 2 (M1: screening latency p99 < 60s; M2: FMA model risk sign-off)

---

## Step 4a — Regulated constraint propagation check

**Regulated constraints detected:**

1. **Constraint 1 (C2 — Process Gate):** "AML Compliance Officer sign-off required under FMA Model Risk Policy before activation of automated screening rules — model must pass independent validation by FMA-registered assessor before live screening"
   - Obligation: FMA Model Risk Policy
   - Approving authority: AML Compliance Officer + FMA-registered assessor
   - Gate condition: Independent validation completed before rule activation
   - Type: Hard activation gate

2. **Constraint 2 (C3 — Retention Rule):** "All transaction records and screening decisions retained at geographically separate location for minimum 5 years per AML/CFT Act s.24(1)"
   - Obligation: AML/CFT Act s.24(1)
   - Requirement type: Data retention and geographic replication
   - Type: Technical/regulatory retention requirement

**Constraint propagation plan:**
- C2 (FMA sign-off) → Story 5 (FMA Model Risk Validation & Sign-Off)
- C3 (5-year retention) → Story 4 (Transaction Record Retention)
- C2 and C3 in separate stories due to distinct concerns

---

## Step 2 — Slicing strategy

**Strategy chosen:** Risk-first
**Rationale:** FMA Model Risk sign-off is a hard go-live blocker; highest-risk item must be addressed first to validate compliance feasibility.

---

## Step 3 — Epic structure

**Epic: AML Transaction Monitoring — Real-Time Screening & Compliance**
- **Stories:** 5 stories
- **Rationale:** Real-time screening is cohesive across event streaming, rule engine, analyst workflow, data retention, and FMA validation; all stories converge at the FMA sign-off gate.

---

## Stories

### Story 1: Real-Time Transaction Event Stream

**Persona:** Payments Operations Engineer
**Connects to:** Metric M1 (< 60 second latency)

**As a** Payments Operations Engineer **I want** a real-time event stream delivering transactions to the screening engine within 60 seconds **so that** compliance analysts screen in real-time instead of 18+ hours later

**MVP Scope covered:** Real-time event stream

**Out of scope:** SAR automation, upstream origination changes, watchlist UI, historical re-screening

**Architecture Constraints:**
- End-to-end latency < 60s at p99
- Durable queue (no transaction loss)
- Support 2,000 TPS sustained

**Acceptance Criteria:**

1. Given a transaction completes, When emitted to the screening queue, Then delivery occurs within 60s at p99

2. Given peak load (2,000 TPS), When transactions arrive continuously, Then no indefinite backlog; p99 remains < 60s

3. Given the screening engine is offline, When transactions arrive, Then events are durably queued (1+ hour buffer); processing resumes on recovery

---

### Story 2: Configurable AML/CFT Screening Rule Engine

**Persona:** AML Compliance Analyst
**Connects to:** Metric M1 (screening decision latency)

**As a** AML Compliance Analyst **I want** a configurable rule set for detecting AML/CFT patterns (velocity, structuring, watchlist) without code changes **so that** I can adapt rules as typologies evolve

**MVP Scope covered:** Configurable rule set for screening

**Out of scope:** Watchlist UI, SAR automation, custom rule language, post-MVP extensibility

**Architecture Constraints:**
- Rule evaluation < 30 seconds (leaves 30s margin for alert processing)
- Version-controlled, immutable rule sets
- Audit trail records rule version applied per transaction

**Acceptance Criteria:**

1. Given a transaction arrives, When rule set is evaluated, Then all rules (velocity, structuring, watchlist) complete evaluation within 30 seconds

2. Given a rule version is deployed, When a transaction is screened, Then the applied rule version is recorded in the audit trail

3. Given a new rule version deploys, When transactions are screened with new rules, Then prior transactions' decisions are not retroactively altered

---

### Story 3: Alert Queue and Compliance Analyst Workflow

**Persona:** AML Compliance Analyst
**Connects to:** Metric M1 (real-time alerts enable timely SAR filing)

**As a** AML Compliance Analyst **I want** alerts in a queue when transactions match rules, with ability to review, decide, and file a SAR if warranted **so that** SARs file within regulatory time windows (currently 18+ hours behind; target: real-time)

**MVP Scope covered:** Alert queue + compliance workflow

**Out of scope:** SAR filing automation, watchlist UI, upstream changes

**Architecture Constraints:**
- Alert queue preserves transaction event data and rule match evidence
- Analyst actions logged immutably
- No PII in alert metadata

**Acceptance Criteria:**

1. Given a transaction matches a screening rule, When alert is generated, Then analyst sees: transaction ID, rule matched, amount, date, link to full event (no raw account data)

2. Given an analyst confirms a transaction is suspicious, When initiating SAR filing, Then the SAR filing system receives required narrative and evidence

3. Given an analyst dismisses an alert, When the action is recorded, Then an immutable audit entry logs: analyst ID, timestamp, alert ID, action (dismiss), optional reason

---

### Story 4: Transaction Record Retention & Geographic Replication (AML/CFT Compliance)

**Persona:** Payments Compliance Manager
**Connects to:** Metric M2 (regulatory compliance)

**As a** Payments Compliance Manager **I want** all transaction records and screening decisions retained at a geographically separate location for 5 years per AML/CFT Act s.24(1) **so that** the institution meets regulatory obligations and can produce evidence upon request

**MVP Scope covered:** Implicit — required by C3 constraint

**Out of scope:** SAR filing, upstream data, historical re-screening

**Architecture Constraints:**
- Synchronous/near-synchronous replication to separate geographic location
- Retention: minimum 5 years per AML/CFT Act
- Records immutable after initial write

**Acceptance Criteria:**

1. Given a transaction is screened, When the record (including decision, rule matched, analyst action) is written, Then it is replicated to a separate geographic location within 24 hours

2. Given a compliance audit queries historical records, When retrieving records from any point in the past 5 years, Then all records are present and unaltered (integrity verified)

3. Given the primary region is unavailable, When a compliance request arrives, Then records are retrievable from the geographically separate backup without interruption

---

### Story 5: FMA Model Risk Validation & Sign-Off (Go-Live Gate)

**Persona:** Payments Compliance Manager
**Connects to:** Metric M2 (FMA model risk sign-off — binary milestone)

**As a** Payments Compliance Manager **I want** the automated screening model/rule set to pass independent validation by an FMA-registered assessor under FMA Model Risk Policy **so that** the AML Compliance Officer can authorize activation of real-time screening rules in production

**MVP Scope covered:** Implicit — required by C2 constraint

**Out of scope:** Post-go-live monitoring, model retraining

**Architecture Constraints:**
- Stories 1–4 complete and tested before validation begins
- Validation environment mirrors production (same rules, same transaction volume simulation)
- All audit trails and logging in place for FMA review

**Acceptance Criteria:**

1. Given stories 1–4 are verified, When a readiness checklist is compiled, Then it covers: rule logic, model/rule governance, alert procedures, retention compliance; signed off by engineering and compliance

2. **Given the readiness checklist is approved, When an FMA-registered independent assessor is engaged, Then the assessor conducts an assessment against FMA Model Risk Policy to verify the screening model meets regulatory expectations for governance, validation, and performance**

3. **Given the FMA assessment completes, When the FMA-registered assessor confirms model risk validation passed, Then the assessor issues a formal validation sign-off, the AML Compliance Officer authorizes activation of automated screening rules in production, and real-time screening is activated**

**Regulated Constraint (C2 — FMA Model Risk Sign-Off):**
- **This story contains the hard go-live gate: AC 3 must be satisfied (FMA sign-off document received) before production deployment of automated screening**
- **Approving authority:** FMA-registered independent assessor per FMA Model Risk Policy
- **Gate condition:** Model risk validation completed + formal sign-off document issued

---

## Scope accumulator

**MVP scope coverage:**
1. ✅ Real-time event stream → Story 1
2. ✅ Configurable rule set → Story 2
3. ✅ Alert queue + workflow → Story 3
4. ✅ Full audit trail (implicit) → Story 4

**Regulated constraints:**
- ✅ C2 (FMA Model Risk sign-off) → Story 5 AC3
- ✅ C3 (5-year retention at separate location) → Story 4 ACs

**Out-of-scope correctly excluded:**
- SAR automation ✅
- Upstream origination ✅
- Watchlist UI ✅
- Historical re-screening ✅

**Scope drift:** None
