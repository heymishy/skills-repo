# Definition Output — T2 (AML Competing Regulated Constraints) — Trial 2
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

**Scanning discovery for regulated constraints...**

**Constraints section — regulated constraints identified:**

**C2 — FMA Model Risk Validation (Process Gate):**
"Regulatory sign-off from AML Compliance Officer required before activation — model must be validated per FMA Model Risk Policy."
- Obligation: FMA (Financial Markets Authority) Model Risk Policy — regulatory requirement
- Approving authority: AML Compliance Officer + FMA-registered model risk assessor
- Gate condition: Model validation completed per FMA Model Risk Policy AND AML Compliance Officer sign-off issued — no production activation until both obtained
- Type: Process gate — hard activation dependency; regulatory in nature

**C3 — AML/CFT Act Retention (Technical Compliance):**
"All transaction records must be retained at a geographically separate location for a minimum 5 years per AML/CFT Act s.24."
- Obligation: Anti-Money Laundering and Countering Financing of Terrorism Act, section 24
- Approving authority: No external sign-off required — this is a mandatory technical implementation, not a process gate
- Gate condition: Geographically separate retention store with ≥5-year policy active at production activation
- Type: Technical retention requirement — mandatory implementation, not a sign-off gate

**Non-eclipsing assessment:** C2 and C3 address completely different compliance obligations. C2 is a process gate requiring active sign-off from an external assessor. C3 is a passive retention requirement implemented in infrastructure. They must propagate to separate stories and must not be merged into a single constraint entry. Both must survive into independent dedicated ACs.

**Constraint propagation plan:**
- C2 → Story 5 (FMA validation gate story) AC3, Architecture Constraints in Stories 1–4
- C3 → Story 4 (retention story) AC3, Architecture Constraints in Stories 1–3
- No story may carry one and omit the other in the Architecture Constraints field (where both apply)

---

## Step 1.5 — Architecture constraints scan

`.github/architecture-guardrails.md` not present in corpus. No guardrails applicable.

---

## Step 2 — Slicing strategy

**Strategy chosen:** Risk-first
**Rationale:** Two independent regulated constraints create regulatory risk across the story set. Prioritising the rule engine (highest technical implementation risk) and retention infrastructure (legal non-compliance risk if deferred) before the analyst workflow ensures that the regulatory foundation is established before the user-facing stories. The FMA validation gate is written last — it requires all prior stories to be complete and evidence-ready.

---

## Step 3 — Epic structure

**Single epic: AML Transaction Monitoring — Real-Time Screening**
- **Stories:** 5 stories
- **Rationale:** Single regulated feature with two independent compliance obligations. Single epic ensures both constraints are visible to reviewers, test-plan writers, and the coding agent across the full story set.

---

## Stories

### Story 1: Transaction Event Stream Consumer

**Persona:** AML Platform Engineer
**Connects to:** Metric M1 (event stream is the input pipeline — establishing it with confirmed latency headroom is the first step toward p99 < 60s)

**As an** AML Platform Engineer **I want** a reliable, idempotent transaction event stream consumer that makes all payment events available to the AML rule engine in real time **so that** every transaction is available for screening within 5 seconds of occurrence, establishing the data foundation for real-time AML monitoring

**MVP Scope items covered:** Transaction event stream integration (scope item 1)

**Out of scope:**
- Event stream schema versioning
- Dead-letter queue (post-MVP resilience)
- Historical event replay for bulk screening
- Cross-channel normalisation

**Assumptions to test:**
- Event stream partition count supports required throughput without consumer rebalancing under peak load
- Event schema is documented and stable before integration begins

**Architecture Constraints:**
- Consumer must be idempotent — reprocessing a duplicate event must not create duplicate rule engine inputs
- Consumer offset must be committed only after rule engine input is confirmed (at-least-once semantics)
- **Regulated constraint C2 (FMA Model Risk):** Events consumed here feed the screening model. FMA validation gate (Story 5 AC3) blocks production activation of this consumer.
- **Regulated constraint C3 (AML/CFT Act s.24):** Transaction events consumed here are subject to the 5-year retention obligation. Retention infrastructure (Story 4) must be operational before production activation.

**Acceptance Criteria:**

1. Given the event consumer is running and 20,000 transaction events are emitted over 2 hours, When consumption is complete, Then all 20,000 events are processed in emission order, made available to the rule engine within 5 seconds, and no events are missing from the rule engine input

2. Given the same transaction event is emitted twice to the stream (duplicate), When the consumer processes both, Then only one input is passed to the rule engine and the duplicate is silently discarded with a log entry

3. Given the event consumer loses its stream connection and reconnects after 90 seconds, When reconnection completes, Then all events emitted during the outage are consumed from the last confirmed offset with no gaps

---

### Story 2: AML Transaction Screening Rule Engine

**Persona:** AML Platform Engineer
**Connects to:** Metric M1 (rule engine performs the screening evaluation — latency is measured from event arrival to result produced)

**As an** AML Platform Engineer **I want** a deterministic, auditable AML rule engine that evaluates each transaction event against the active ruleset and produces a classified screening result within the latency budget **so that** every transaction is screened in real time with a consistent, repeatable result, satisfying the p99 < 60s screening latency target

**MVP Scope items covered:** AML screening rule engine (scope item 2)

**Out of scope:**
- Machine learning or behavioural scoring (out-of-scope for MVP — triggers separate FMA validation cycle)
- Rules authoring UI
- Ruleset versioning and rollback
- Cross-transaction temporal pattern detection

**Assumptions to test:**
- Initial ruleset complexity is within the latency budget — performance test to validate
- Deterministic evaluation is achievable with the MVP ruleset (no stochastic elements)

**Architecture Constraints:**
- Rule engine must produce identical outputs for identical inputs on every execution — non-determinism is a disqualifying defect
- Screening result record must include: transaction ID, UTC timestamp, ruleset version evaluated, result (clear/review/block), matched rule IDs
- **Regulated constraint C2 (FMA Model Risk):** The rule engine and ruleset are the subject of FMA model validation. FMA validation (Story 5 AC3) must be completed before this engine processes live transactions.
- **Regulated constraint C3 (AML/CFT Act s.24):** Screening result records are transaction records subject to 5-year retention (Story 4).

**Acceptance Criteria:**

1. Given a transaction event is received by the rule engine, When the ruleset is evaluated, Then a screening result is produced within the p99 latency budget (< 60s) and the result record contains all required fields: transaction ID, UTC timestamp, ruleset version, result, matched rule IDs

2. Given the same transaction event is evaluated twice with the same ruleset version, When both results are compared, Then they are byte-identical — confirming deterministic evaluation with no variance

3. Given a 100,000-event load test is executed, When p99 latency is measured end-to-end (event stream arrival to result produced), Then p99 is below 60 seconds

---

### Story 3: AML Alert Queue and Analyst Case Interface

**Persona:** AML Analyst
**Connects to:** Metric M1 (alert backlog is a latency amplifier — if analysts cannot keep pace with alert volume, the effective screening latency degrades operationally)

**As an** AML Analyst **I want** screening alerts (review and block results) to appear in a prioritised, ordered queue within 10 seconds of detection, with sufficient transaction context for me to make a disposition decision without additional queries **so that** the AML team can process alerts at the pace that real-time screening generates them, maintaining the operational latency benefit

**MVP Scope items covered:** Alert queue and analyst workflow (scope item 3)

**Out of scope:**
- ML-assisted alert triage
- Automated disposition
- External watchlist query
- SAR (Suspicious Activity Report) filing workflow
- Alert assignment to specific analysts

**Assumptions to test:**
- Analyst workflow tooling (case management system) can be connected to the alert queue without significant integration work
- Alert volume from the MVP ruleset is within analyst capacity

**Architecture Constraints:**
- Alert queue entries must be ordered by transaction timestamp — not alert creation time
- Disposition records must be append-only — no modification of existing records
- **Regulated constraint C2 (FMA Model Risk):** Alert queue processes outputs of the rule engine (Story 2). FMA validation (Story 5) gates production activation.
- **Regulated constraint C3 (AML/CFT Act s.24):** Alert records and analyst disposition decisions are transaction records for AML/CFT purposes. Retention (Story 4) applies.

**Acceptance Criteria:**

1. Given the rule engine produces a "review" result for a transaction, When the alert is created, Then it appears in the analyst queue within 10 seconds, with transaction context: amount, counterparties, timestamp, screening result, and matched rule IDs — without requiring the analyst to open additional views

2. Given an analyst records a disposition (clear/escalate/block) on an alert, When the decision is saved, Then an immutable disposition record is created with: analyst ID, decision, timestamp, and free-text rationale — and the original alert entry is not modified

3. Given the analyst queue contains 1,000 unresolved alerts and the analyst filters by severity "block", When the filter is applied, Then results are returned within 2 seconds, ordered by transaction timestamp ascending

---

### Story 4: Transaction Record Retention at Geographically Separate Location

**Persona:** AML Compliance Officer
**Connects to:** Metric M2 (retention infrastructure is a prerequisite for FMA model sign-off — AML Compliance Officer cannot certify compliance without confirmed retention)

**As an** AML Compliance Officer **I want** all transaction records (events, screening results, and analyst dispositions) to be asynchronously replicated to a geographically separate retention store with a minimum 5-year retention policy enforced at the storage layer **so that** the bank meets its obligations under AML/CFT Act s.24 and can produce a complete transaction record for any regulatory investigation or FMA audit

**MVP Scope items covered:** AML/CFT Act transaction record retention (scope item 4)

**Out of scope:**
- GDPR right-to-erasure conflict resolution (requires legal team input — separate workstream)
- Automated retention expiry enforcement (manual review at 5 years)
- Access control audit of retention store (post-MVP InfoSec story)
- Cross-border data sovereignty analysis

**Assumptions to test:**
- A geographically separate data centre or cloud region is available and on-boarded
- Legal team has confirmed that "geographically separate" means a different physical data centre (not same city with separate racks)

**Architecture Constraints:**
- Retention store must be physically separate (different data centre, not same building) from primary operational storage — infrastructure team to confirm before Story 4 is marked complete
- Replication must be near-synchronous (RPO ≤1 minute)
- Retention period of 5 years must be enforced by storage infrastructure policy, not by application deletion logic
- **Regulated constraint C3 (AML/CFT Act s.24 — mandatory compliance):** This story directly implements the statutory retention obligation. Production activation of the AML screening system is blocked until this story's ACs are satisfied.

**Acceptance Criteria:**

1. Given a transaction is processed by the AML platform, When the replication job completes, Then the transaction record (event, screening result, and any disposition) is present in the geographically separate retention store within 60 seconds, and the storage location is confirmed to be in a physically separate data centre from primary storage

2. Given the 5-year retention policy is applied to the retention store, When the policy is audited, Then the policy prevents deletion of any record before the 5-year period from transaction timestamp expires, and the policy is enforced by infrastructure configuration (not application code)

3. **Given** the retention store is audited by the AML Compliance Officer against AML/CFT Act s.24, **When** the audit is conducted, **Then** the audit confirms: (a) all AML transaction records from Stories 1–3 (events, results, and dispositions) are present in the retention store, (b) the retention store is at a geographically separate physical location, (c) the 5-year minimum retention policy is active and storage-enforced, and (d) no transaction record can be deleted before expiry without an exception logged by the AML Compliance Officer — satisfying AML/CFT Act section 24

---

### Story 5: FMA Model Risk Validation and Production Activation Gate

**Persona:** AML Compliance Officer
**Connects to:** Metric M2 (M2 is the FMA sign-off metric — this story directly satisfies M2)

**As an** AML Compliance Officer **I want** the AML rule engine to be formally validated per FMA Model Risk Policy by an FMA-registered assessor, and for formal sign-off to serve as the production activation gate **so that** the bank activates the AML screening system in compliance with FMA requirements and avoids regulatory sanction for deploying a non-validated AML model

**MVP Scope items covered:** FMA model validation gate

**Out of scope:**
- External FMA on-site audit
- Model performance monitoring and revalidation schedule
- Model change management process
- Card scheme or correspondent bank notification

**Assumptions to test:**
- An FMA-registered model risk assessor is identified and available before Story 5 begins
- FMA Model Risk Policy requirements for a deterministic rule-based model are confirmed with Compliance — not a probabilistic ML model
- Retention infrastructure (Story 4) must be complete and confirmed before validation begins

**Architecture Constraints:**
- **Regulated constraint C2 (FMA Model Risk Policy — HARD PRODUCTION GATE):** This story IS the FMA validation gate. Production activation of the real-time AML screening system is blocked until AC3 is satisfied. No live transaction screening — including shadow mode using production data — before formal sign-off is received.
- Validation scope must include: rule engine (Story 2), ruleset documentation, event stream integration (Story 1), alert workflow (Story 3), and retention infrastructure (Story 4 — retention is a validation prerequisite)

**Acceptance Criteria:**

1. Given Stories 1–4 are deployed to the validation environment, When the FMA-registered model risk assessor begins the assessment, Then the assessment scope is confirmed to include: rule engine, full ruleset documentation, event stream input pipeline, alert generation, and retention infrastructure — with evidence artefacts for all Stories 1–4 ACs

2. Given the model risk assessment is in progress, When the assessor raises a finding (e.g. non-deterministic rule output, missing audit trail, unconfirmed retention compliance), Then the finding is entered in the remediation register, the production activation gate (AC3) remains blocked, and the assessor confirms finding resolution before validation can conclude

3. **Given** the FMA model risk validation is complete, **When** the AML Compliance Officer and an FMA-registered model risk assessor confirm that the AML screening rule engine has been validated per FMA Model Risk Policy, **Then** a formal sign-off document is issued to the AML Compliance Officer, production activation of the real-time AML screening system is permitted, and the sign-off document is recorded in the compliance register — **and production activation must not occur before this sign-off is received**

---

## Step 4a verification — non-eclipsing propagation confirmed

| Constraint | Stories with Architecture Constraint | Stories with explicit AC |
|-----------|-------------------------------------|--------------------------|
| C2 — FMA Model Risk (process gate) | Stories 1, 2, 3, 4 | Story 5 AC3 ✅ |
| C3 — AML/CFT Act s.24 (retention) | Stories 1, 2, 3 | Story 4 AC3 ✅ |

C2 and C3 are distinct entries in every Architecture Constraints field where both apply. Neither eclipses the other. Both have independent dedicated ACs.

✅ **Regulated constraint propagation check complete (Step 4a)**
Constraints checked: 2 | Stories updated: 5 | Non-eclipsing: confirmed (C2 → Story 5, C3 → Story 4)

---

## Step 5 — Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: AML screening latency p99 < 60s | Story 1 (event intake), Story 2 (rule engine — latency target), Story 3 (alert workflow — backpressure prevention) |
| M2: FMA model risk sign-off before activation | Story 4 (retention — C3 prerequisite for sign-off), Story 5 (FMA validation gate — direct M2 satisfaction) |

---

## Step 6 — Scope accumulator

**Discovery MVP scope items:** 4
1. Transaction event stream — Story 1 ✅
2. AML rule engine — Story 2 ✅
3. Alert queue and analyst workflow — Story 3 ✅
4. AML/CFT retention (AML/CFT Act s.24) — Story 4 ✅

**Stories written:** 5
**Coverage:** 4/4 MVP items
**Scope additions:** 0 (Story 5 mandated by C2 FMA regulated gate)
**Scope ratio:** 5/4 = 1.25 — acceptable

✅ **Scope check passed** — C2 and C3 both propagated to independent stories. Non-eclipsing confirmed.

---

## Definition complete ✅

Epics: 1
Stories: 5
Slicing strategy: Risk-first
Scope check: ✅ Clean
Regulated constraint check: ✅ C2 (FMA Model Risk) → Story 5 AC3; C3 (AML/CFT Act s.24) → Story 4 AC3; independent propagation, no eclipsing
