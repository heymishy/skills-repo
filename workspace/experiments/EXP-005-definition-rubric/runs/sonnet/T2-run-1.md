# Definition Output — T2 (AML Competing Regulated Constraints)
**Case ID:** T2-competing-regulated
**Model:** claude-sonnet-4-6
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "AML Transaction Monitoring — Real-Time Screening" — Status: Approved
✅ Benefit-metric artefact found: "AML Transaction Monitoring — Real-Time Screening"
✅ Metrics with targets: 2 (M1: AML screening latency p99 < 60 seconds; M2: FMA model risk sign-off obtained before production activation)

---

## Step 4a — Regulated constraint propagation check

**Regulated constraints detected in discovery:**

1. **Constraint C2 — Process Gate (FMA Model Risk Validation):** "Regulatory sign-off from AML Compliance Officer required before activation — model must be validated per FMA Model Risk Policy."
   - Obligation: Financial Markets Authority (FMA) Model Risk Policy — internal validation requirement imposed by NZ regulatory framework
   - Approving authority: AML Compliance Officer, validated by FMA-registered model risk assessor
   - Gate condition: AML screening model validated per FMA Model Risk Policy AND AML Compliance Officer sign-off issued — production activation not permitted until both conditions met
   - Type: Process gate — hard activation dependency

2. **Constraint C3 — Retention Rule (AML/CFT Act):** "All transaction records must be retained at a geographically separate location for a minimum 5 years per AML/CFT Act s.24."
   - Obligation: AML/CFT Act (Anti-Money Laundering and Countering Financing of Terrorism Act), section 24
   - Approving authority: No external sign-off required — this is a technical compliance requirement, not a process gate
   - Gate condition: Geographic separation of retention store confirmed AND minimum 5-year retention enforced — must be implemented at delivery
   - Type: Technical retention requirement — must be implemented in the retention story; not a go-live gate

**Non-eclipsing assessment:** C2 (FMA validation gate) and C3 (AML/CFT retention rule) are distinct regulated constraints targeting different implementation concerns. C3 must NOT be subsumed into C2. Each must propagate to its own story with dedicated ACs. C2 triggers Story 5 (model validation gate). C3 triggers Story 4 (retention infrastructure).

**Constraint propagation plan:**
- C2 (FMA) → dedicated AC in Story 5, Architecture Constraints in Stories 1–4
- C3 (AML/CFT s.24) → dedicated AC in Story 4, Architecture Constraints in Stories 1–3
- Both constraints survive independently — no eclipsing

---

## Step 1.5 — Architecture constraints scan

`.github/architecture-guardrails.md` not present in corpus. Proceeding without guardrail check.

---

## Step 2 — Slicing strategy

**Strategy chosen:** Risk-first
**Rationale:** AML screening has significant regulatory risk — the FMA model validation gate (C2) and the retention constraint (C3) both have regulatory consequences if not implemented correctly. Risk-first ordering prioritises the rule engine foundation (highest implementation risk) and retention infrastructure (legal risk if deferred) before the alert workflow and the model validation gate. This allows regulatory compliance work to proceed on a stable technical foundation.

---

## Step 3 — Epic structure

**Single epic: AML Transaction Monitoring — Real-Time Screening Core**
- **Stories:** 5 stories
- **Rationale:** AML transaction monitoring is a single regulated feature with two independent compliance obligations (C2 and C3). A single epic keeps both regulated constraints visible across the full story set and avoids the compliance gate being treated as a separate project.

---

## Stories

### Story 1: Transaction Event Stream Integration

**Persona:** AML Platform Engineer
**Connects to:** Metric M1 (event stream is the data source for screening — must be established before latency can be measured)

**As an** AML Platform Engineer **I want** to consume transaction events from the payment event stream in real time and make them available to the AML screening rule engine **so that** all transaction events are screened at the source without requiring batch processing, establishing the latency baseline required to meet the p99 < 60s screening target

**MVP Scope items covered:** Transaction event stream integration (scope item 1)

**Out of scope:**
- Historical transaction replay or backfill
- Cross-channel event normalisation (non-payment events)
- Event deduplication logic (post-MVP hardening)
- Consumer failover and dead-letter handling

**Assumptions to test:**
- Transaction event stream has sufficient throughput headroom to support real-time screening without backpressure
- Event format is stable and documented — no schema negotiation required

**Architecture Constraints:**
- Event stream consumer must be idempotent — duplicate events must not produce duplicate AML alerts
- **Regulated constraint C2 (FMA Model Risk):** This story establishes the data intake for the AML model. FMA model validation gate (Story 5 AC3) applies to the screening model's production activation.
- **Regulated constraint C3 (AML/CFT Act s.24):** Transaction records flowing through this consumer are subject to the 5-year retention obligation. Retention infrastructure (Story 4) must be in place before this consumer is activated in production.

**Acceptance Criteria:**

1. Given the event stream consumer is deployed to staging and transaction events are flowing, When 10,000 transaction events are emitted over a 60-minute window, Then all 10,000 events are consumed in order, made available to the rule engine within 5 seconds of emission, and no events are dropped

2. Given the event stream consumer receives a duplicate transaction event (same transaction ID), When the deduplication check runs, Then the duplicate event is discarded without creating a duplicate rule engine input, and the consumer processing count reflects the deduplicated count

3. Given the event stream consumer loses connectivity to the stream broker for 30 seconds and then reconnects, When the consumer resumes, Then it resumes from the last confirmed offset and no events from the outage window are missed

---

### Story 2: AML Screening Rule Engine

**Persona:** AML Platform Engineer
**Connects to:** Metric M1 (rule engine is the screening mechanism — latency p99 target is measured at rule evaluation completion)

**As an** AML Platform Engineer **I want** to evaluate each transaction event against the configured AML screening ruleset and produce a structured screening result (clear, review, block) within the latency budget **so that** every transaction is screened in real time before settlement, meeting the p99 < 60s target and producing a deterministic, auditable result for each transaction

**MVP Scope items covered:** AML screening rule engine (scope item 2)

**Out of scope:**
- Machine learning or probabilistic scoring models (post-MVP; require separate FMA model validation)
- Rules configuration UI
- Rules versioning and rollback
- Cross-transaction pattern detection (sequence-based typology — post-MVP)

**Assumptions to test:**
- Initial ruleset is defined and documented — rule engine implementation can proceed before FMA model validation
- p99 < 60s latency target is achievable with the initial ruleset complexity (to be validated in performance test)

**Architecture Constraints:**
- Rule engine must produce a deterministic result for a given input — no non-determinism permitted in the rule evaluation path
- Each screening result must include: transaction ID, timestamp, ruleset version, result (clear/review/block), matched rule IDs (if any)
- **Regulated constraint C2 (FMA Model Risk):** Rule engine and ruleset must be validated per FMA Model Risk Policy before production activation. FMA validation gate in Story 5 AC3 blocks production use.
- **Regulated constraint C3 (AML/CFT Act s.24):** Transaction screening records (inputs and outputs) are subject to 5-year retention. Retention infrastructure (Story 4) must be confirmed before production activation.

**Acceptance Criteria:**

1. Given the rule engine receives a transaction event, When the event is evaluated against the active ruleset, Then a screening result is returned within the latency budget (p99 < 60s from event arrival to result produced) and includes all required fields: transaction ID, timestamp, ruleset version, result, matched rule IDs

2. Given the same transaction input is evaluated twice against the same ruleset version, When both evaluations complete, Then both return identical results — confirming deterministic evaluation

3. Given 50,000 transactions are processed in a load test, When p99 latency is measured, Then latency is below 60 seconds for the 99th percentile

---

### Story 3: AML Alert Queue and Analyst Workflow

**Persona:** AML Analyst
**Connects to:** Metric M1 (alert workflow is the downstream consumer of screening results — a blocked or broken workflow creates backpressure that degrades effective latency)

**As an** AML Analyst **I want** to receive AML screening alerts (transactions flagged as review or block) in a prioritised queue with full transaction context and be able to record my investigation decision **so that** the AML team can act on real-time screening results without building a backlog that would defeat the purpose of real-time monitoring

**MVP Scope items covered:** Alert queue and analyst workflow (scope item 3)

**Out of scope:**
- Automated disposition or ML-assisted triage
- External watchlist integration
- Escalation workflow to financial intelligence unit
- Customer notification flow

**Assumptions to test:**
- Analyst workflow tools (case management or equivalent) are available for integration — no net-new tool build required

**Architecture Constraints:**
- Alert queue must be ordered by transaction timestamp (not alert creation time) to preserve chronological case context
- Alert state transitions must be immutable (append-only) — no in-place modification of alert disposition records
- **Regulated constraint C2 (FMA Model Risk):** Alert queue ingests screening results from the rule engine (Story 2). FMA model validation (Story 5) gates production activation of alert queue processing.
- **Regulated constraint C3 (AML/CFT Act s.24):** Alert records and analyst disposition records are transaction records for the purposes of AML/CFT Act s.24. Retention infrastructure (Story 4) applies.

**Acceptance Criteria:**

1. Given the rule engine flags a transaction as "review", When the alert is created, Then it appears in the analyst queue within 10 seconds, includes full transaction context (amount, counterparties, timestamp, matched rule IDs), and can be opened by an analyst without additional API calls

2. Given an analyst records a disposition decision on an alert (clear, escalate, or block), When the decision is saved, Then an immutable audit record is created with: analyst ID, decision, timestamp, and rationale — and the original alert record is not modified

3. Given the alert queue contains 500 items and an analyst applies a filter by date range, When the filter is applied, Then results are returned in under 2 seconds and ordered by transaction timestamp

---

### Story 4: Transaction Record Retention — Geographic Separation (AML/CFT Act s.24)

**Persona:** AML Compliance Officer
**Connects to:** Metric M2 (retention infrastructure is a compliance prerequisite — FMA model sign-off is not achievable if retention obligations are unmet)

**As an** AML Compliance Officer **I want** transaction records (original events, screening results, and alert dispositions) to be replicated to a geographically separate retention store with a minimum 5-year retention policy **so that** the bank meets its obligations under AML/CFT Act s.24 and can produce complete transaction records for any AML investigation or FMA audit without relying on primary operational storage

**MVP Scope items covered:** AML/CFT Act transaction record retention (scope item 4)

**Out of scope:**
- GDPR right-to-erasure interaction with AML retention (legal conflict resolution — legal team dependency)
- Retention store access control review (post-MVP InfoSec review)
- Automated retention expiry enforcement
- Data sovereignty classification beyond geographic separation

**Assumptions to test:**
- A geographically separate data centre or cloud region is available and network-accessible from the AML platform
- "Geographically separate" is interpreted as a different physical data centre — legal team to confirm whether same-city DC qualifies

**Architecture Constraints:**
- Retention store must be hosted in a geographically separate location from primary operational storage (different data centre, not just different rack)
- Retention period: minimum 5 years from transaction timestamp, enforced by storage policy — not by application logic alone
- Replication must be synchronous or near-synchronous (RPO ≤1 minute) — no batch replication
- **Regulated constraint C3 (AML/CFT Act s.24 — mandatory compliance requirement):** This story directly implements the retention obligation. ACs below are the compliance verification conditions. This story is not a gate story — it is a mandatory implementation story that must be completed before production activation.

**Acceptance Criteria:**

1. Given a transaction event is processed by the AML platform, When the retention replication job runs, Then the transaction record (event, screening result, and any alert disposition) is present in the geographically separate retention store within 60 seconds, and the physical location of the retention store is confirmed to be in a different data centre from primary storage

2. Given a retention policy of 5 years is applied to the retention store, When a transaction record reaches its 5-year anniversary, Then the record is preserved (no automatic deletion before the 5-year mark), and the retention policy configuration is confirmed by the storage administrator

3. **Given** the retention store is inspected for compliance with AML/CFT Act s.24, **When** the AML Compliance Officer audits the store configuration, **Then** the audit confirms: (a) all transaction records from Stories 1–3 are replicated, (b) geographic separation is verified at the infrastructure level, (c) minimum 5-year retention policy is active and enforced by storage infrastructure (not application code), and (d) no transaction record can be deleted before the 5-year period expires without a logged exception approved by the AML Compliance Officer

---

### Story 5: FMA Model Risk Validation and Production Activation Gate

**Persona:** AML Compliance Officer
**Connects to:** Metric M2 (FMA model risk sign-off is the explicit metric target — M2 is satisfied when sign-off is obtained)

**As an** AML Compliance Officer **I want** to coordinate the FMA model risk validation of the AML screening rule engine, obtain formal sign-off from the AML Compliance Officer and a FMA-registered model risk assessor, and use this as the production activation gate **so that** the bank activates the AML screening system in full compliance with FMA Model Risk Policy and avoids regulatory sanctions for deploying a non-validated screening model

**MVP Scope items covered:** FMA model validation gate (regulatory compliance scope item)

**Out of scope:**
- FMA external audit or on-site inspection (not triggered by rule-based model — confirm with Compliance)
- Ongoing model performance monitoring cadence (post-activation operational story)
- Model revalidation trigger conditions
- Card brand or scheme notification

**Assumptions to test:**
- FMA Model Risk Policy requirements for a rule-based (non-ML) screening model are documented and agreed with Compliance before Story 5 starts
- An FMA-registered model risk assessor is available and engaged before this story begins

**Architecture Constraints:**
- **Regulated constraint C2 (FMA Model Risk Policy — HARD GATE):** This story IS the FMA model validation gate. Production activation of the AML screening system is explicitly blocked until AC3 is satisfied. No production traffic, no shadow mode screening of live transactions, until sign-off document is received.
- Model validation scope must include rule engine (Story 2), the full ruleset, and the data pipeline from event stream (Story 1) through to alert generation (Story 3)
- Retention infrastructure (Story 4) must be confirmed complete before validation begins — C3 compliance is a prerequisite for C2 sign-off

**Acceptance Criteria:**

1. Given Stories 1–4 implementations are deployed to a validation environment, When the FMA-registered model risk assessor begins validation, Then the assessor confirms the validation scope includes: rule engine, ruleset documentation, event stream integration, alert workflow, and retention infrastructure — and all Stories 1–4 ACs have corresponding evidence artefacts

2. Given the model risk assessment is in progress, When the assessor identifies any finding that would prevent compliance with FMA Model Risk Policy (e.g. non-deterministic rule evaluation, missing audit trail, retention gap), Then the finding is logged in the remediation tracker and the production activation gate (AC3) remains blocked until the finding is resolved and the assessor confirms resolution

3. **Given** the FMA model risk validation is complete, **When** the AML Compliance Officer and an FMA-registered model risk assessor confirm that the AML screening rule engine complies with FMA Model Risk Policy, **Then** a formal sign-off document is issued to the AML Compliance Officer, production activation of real-time AML screening is permitted, and the sign-off document is recorded in the compliance register — **and production activation must not occur before this sign-off is received**

---

## Step 4a verification — constraint propagation complete (non-eclipsing)

| Constraint | Stories with Architecture Constraint note | Stories with AC |
|-----------|------------------------------------------|-----------------|
| C2 — FMA Model Risk (process gate) | Stories 1, 2, 3, 4 | Story 5 AC3 ✅ |
| C3 — AML/CFT Act s.24 (retention rule) | Stories 1, 2, 3 | Story 4 AC3 ✅ |

✅ **Regulated constraint propagation check complete (Step 4a)**
Constraints checked: 2 | Stories updated: 5 | Trigger exclusions logged: 0 | Non-eclipsing: confirmed (C2 → Story 5, C3 → Story 4, independent propagation)

---

## Step 5 — Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: AML screening latency p99 < 60s | Story 1 (event stream baseline), Story 2 (rule engine — latency measured here), Story 3 (alert workflow — prevents backpressure) |
| M2: FMA model risk sign-off before production | Story 4 (retention — prerequisite for sign-off), Story 5 (FMA validation gate — direct metric) |

No metric gaps detected.

---

## Step 6 — Scope accumulator

**Discovery MVP scope items:** 4
1. Transaction event stream — Story 1 ✅
2. AML screening rule engine — Story 2 ✅
3. Alert queue and analyst workflow — Story 3 ✅
4. Transaction record retention (AML/CFT Act s.24) — Story 4 ✅

Plus: FMA model validation gate (Story 5) — mandated by C2 regulated process gate; not a scope addition.

**Stories written:** 5
**Coverage:** 4/4 MVP items covered
**Scope additions:** 0 (Story 5 mandated by C2)
**Scope ratio:** 5/4 = 1.25 — within acceptable range

✅ **Scope check passed** — 5 stories covering 4 MVP items. No unexplained scope additions. Both C2 and C3 propagated to independent dedicated stories without eclipsing.

---

## Definition complete ✅

Epics: 1
Stories: 5
Slicing strategy: Risk-first
Scope check: ✅ Clean
Regulated constraint check: ✅ C2 (FMA Model Risk) → Story 5 AC3; C3 (AML/CFT Act s.24) → Story 4 AC3; non-eclipsing confirmed
