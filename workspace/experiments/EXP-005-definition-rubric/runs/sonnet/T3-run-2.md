# Definition Output — T3 (Implicit Regulated Constraint — FastPay Narrative Only) — Trial 2
**Case ID:** T3-implicit-regulated
**Model:** claude-sonnet-4-6
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Cross-Border Payment Routing — NZD/PHP via FastPay" — Status: Approved
✅ Benefit-metric artefact found: "Cross-Border Payment Routing — NZD/PHP via FastPay"
✅ Metrics with targets: 2 (M1: NZD/PHP settlement latency p95 < 4 hours; M2: SME cross-border payment volume +10% within 90 days post-launch)

---

## Step 4a — Regulated constraint propagation check

**Scanning all discovery sections — Constraints section and Background narrative...**

**Constraints section:**
- "Settlement latency SLA: NZD/PHP settlement path must achieve p95 < 4 hours from payment initiation to scheme confirmation" — technical performance SLA, not a process gate
- "Fallback activation: automatic fallback to existing correspondent banking path must activate within 30 seconds of FastPay path failure" — technical resilience requirement, not a process gate

Neither constraint in the Constraints section is a regulated, legal, or contractual process gate.

**Background narrative scan:**
Identified the following passage in the Background narrative:

> "Our FX settlement agreement with the scheme requires scheme certification before we can route live volume through the new path — this is a contractual obligation, not a technical preference."

⚠️ **NARRATIVE-ONLY CONSTRAINT IDENTIFIED**

Analysis of the passage:
- "scheme certification" → describes a formal approval process the scheme (FastPay) requires the bank to complete
- "before we can route live volume" → hard pre-condition on production activation
- "contractual obligation, not a technical preference" → the operator has explicitly labelled this as a contractual obligation, distinguishing it from an engineering choice
- Constraint source: Background narrative section only — not replicated in the Constraints section

This passage constitutes a contractual process gate that must be treated as a regulated constraint for CPF purposes. It is not a technical constraint and cannot be satisfied by any implementation alone.

**C2 constraint (extracted from Background narrative):**
- **Obligation:** FX settlement agreement with FastPay — scheme certification requirement (referenced in Background as clause 7.3 of the FX settlement agreement)
- **Approving authority:** FastPay technical assurance team (the scheme certification body)
- **Gate condition:** FastPay scheme certification test suite passed AND formal sign-off received from FastPay technical assurance team — live NZD/PHP routing through the FastPay path is not permitted until both are obtained
- **Type:** Contractual process gate (not a regulatory gate, but carries the same delivery constraint)
- **Source location:** Background narrative — absent from Constraints section (noted for traceability)

**Stories triggered by C2:**
Stories implementing the NZD/PHP routing path and FastPay settlement integration — specifically the routing engine and scheme settlement stories. Fallback path to correspondent banking is outside FastPay certification scope.

**Constraint propagation plan:**
- C2 → dedicated AC in Story 4 (certification gate story), Architecture Constraints in Stories 1 and 2
- Story 3 (fallback path) noted as outside certification scope

---

## Step 1.5 — Architecture constraints scan

`.github/architecture-guardrails.md` not present in corpus. No guardrails applicable.

---

## Step 2 — Slicing strategy

**Strategy chosen:** Walking skeleton
**Rationale:** FastPay is a new scheme integration with unknowns around scheme API stability, settlement message format, and FastPay sandbox availability. Walking skeleton establishes the routing engine and confirms a thin end-to-end path through the FastPay sandbox before adding fallback resilience and the scheme certification gate. This reveals integration risk early and ensures the certification story (Story 4) begins with a working implementation to certify.

---

## Step 3 — Epic structure

**Single epic: Cross-Border Payment Routing — NZD/PHP via FastPay**
- **Stories:** 4 stories
- **Rationale:** Three technical implementation stories plus one contractual gate story. Small, coherent feature set. Single epic keeps the FastPay certification dependency visible across all stories.

---

## Stories

### Story 1: NZD/PHP Programmatic Routing Engine

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M1 (routing engine determines which settlement path NZD/PHP payments follow — this is the mechanism by which latency improvement is achieved)

**As a** Payments Settlement Engineer **I want** a programmatic routing engine that evaluates incoming NZD/PHP payments against the configured routing policy and directs them to the FastPay scheme path **so that** routing is deterministic, fully automated, and capable of meeting the p95 < 4-hour settlement latency target without manual routing decisions

**MVP Scope items covered:** Programmatic routing engine (scope item 1)

**Out of scope:**
- Multi-currency routing beyond NZD/PHP
- Dynamic routing based on real-time availability scores
- Merchant-level routing overrides
- A/B routing for latency comparison testing

**Assumptions to test:**
- FastPay scheme sandbox is accessible for integration testing before Story 2
- Routing policy can be represented as a simple NZD/PHP → FastPay rule for MVP

**Architecture Constraints:**
- Every routing decision must produce an immutable routing record: payment ID, UTC timestamp, routing path, policy rule matched, outcome
- Routing policy must be configurable at runtime (without a code deployment) to support the manual override requirement
- **Regulated constraint C2 (FastPay Scheme Certification — contractual, source: Background narrative clause 7.3):** This story implements the FastPay routing path. FastPay technical assurance team sign-off (Story 4 AC3) is required before live NZD/PHP volume is routed through this path.

**Acceptance Criteria:**

1. Given an NZD/PHP payment is submitted, When the routing engine evaluates the routing policy, Then the payment is directed to the FastPay path, a routing decision record is created with all required fields, and the routing decision completes within 500ms

2. Given the routing policy is updated at runtime (no restart required), When the next NZD/PHP payment arrives, Then the updated policy is applied and the routing decision record reflects the new policy rule

3. Given a manual override is applied to redirect NZD/PHP to correspondent banking, When the next payment arrives, Then the override is applied, the routing record reflects "manual override" as the rationale, and no payment is attempted via FastPay until the override is removed

---

### Story 2: NZD/PHP Settlement via FastPay Scheme API

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M1 (settlement via FastPay is where the latency improvement occurs — p95 < 4 hours is measured from payment submission through this story)

**As a** Payments Settlement Engineer **I want** to submit NZD/PHP settlement messages to the FastPay scheme API following the scheme message specification and receive settlement confirmations within the p95 < 4-hour target **so that** SME customers experience materially faster cross-border payments and the volume growth target (M2) can be realised after scheme certification

**MVP Scope items covered:** NZD/PHP via FastPay (scope item 2)

**Out of scope:**
- Batch settlement
- Non-NZD/PHP currency pairs
- Settlement fee reconciliation
- Settlement dispute handling
- Scheme-level reporting

**Assumptions to test:**
- FastPay sandbox is representative of production message latency characteristics
- Message idempotency is achievable via FastPay's deduplication API

**Architecture Constraints:**
- Settlement messages must conform to FastPay scheme specification (version to be confirmed with scheme before story start)
- Settlement submissions must be idempotent — network retries must not create duplicate settlements
- **NFR:** Settlement confirmation received at p95 < 4 hours from payment initiation
- **Regulated constraint C2 (FastPay Scheme Certification — contractual, source: Background narrative clause 7.3):** This story is the core of the FastPay settlement path. FastPay technical assurance team certification (Story 4 AC3) must be completed before this story's implementation is used for live volume.

**Acceptance Criteria:**

1. Given an NZD/PHP payment is routed to FastPay, When the settlement message is submitted, Then FastPay acknowledges receipt within 30 seconds with a settlement reference ID, and the reference ID is stored in the payment record

2. Given a settlement message is submitted and a network timeout occurs before FastPay acknowledges, When the retry is issued, Then FastPay's deduplication mechanism confirms the original message is on record and no duplicate settlement is created

3. Given a 500-settlement load test against the FastPay sandbox, When p95 confirmation latency is measured, Then p95 is below 4 hours

---

### Story 3: Automatic Fallback to Correspondent Banking

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M1 (fallback prevents payment stranding during FastPay outages, protecting the p95 settlement latency SLA)

**As a** Payments Settlement Engineer **I want** the routing engine to detect FastPay path failures and automatically redirect NZD/PHP payments to the correspondent banking fallback path within 30 seconds **so that** payment continuity is maintained during FastPay outages without manual intervention

**MVP Scope items covered:** Automatic fallback (scope item 3)

**Out of scope:**
- Automatic failback (return to FastPay after recovery — manual confirmation required to avoid oscillation)
- Fallback for currency pairs other than NZD/PHP
- Customer-facing outage notification
- SLA calculation adjustments during fallback period

**Assumptions to test:**
- Correspondent banking path is confirmed available for NZD/PHP payments during fallback periods
- Failure detection (health check or circuit breaker threshold) can reliably trigger within 30 seconds

**Architecture Constraints:**
- Fallback activation is fully automated — no human intervention required
- Fallback activation must occur within 30 seconds of failure detection
- Every fallback event must be logged: FastPay failure type, activation timestamp, number of payments rerouted, recovery timestamp
- **Note on FastPay certification scope:** The fallback path (correspondent banking) is independent of FastPay scheme certification. The fallback path may be used before Story 4 certification is complete — the C2 gate applies only to the FastPay routing path.

**Acceptance Criteria:**

1. Given FastPay returns 3 consecutive settlement failures within 15 seconds, When the circuit breaker threshold is reached, Then automatic fallback activates within 30 seconds, subsequent NZD/PHP payments are routed to correspondent banking, and a fallback activation event is logged with timestamp and failure reason

2. Given fallback is active, When a payment arrives for routing, Then the payment is processed via correspondent banking with no attempt to route to FastPay

3. Given the fallback has been active for 10 minutes and the FastPay health check confirms recovery, When recovery is detected, Then an operator alert is raised indicating FastPay is available for re-routing — no automatic failback without operator confirmation

---

### Story 4: FastPay Scheme Certification and Live Routing Gate

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M2 (live routing cannot begin without certification; M2 volume growth target is only achievable post-certification)

**As a** Payments Settlement Engineer **I want** to complete the FastPay scheme certification process, receive formal sign-off from the FastPay technical assurance team, and use this as the explicit gate before routing live NZD/PHP payment volume through the FastPay path **so that** the bank honours its contractual obligation under clause 7.3 of the FX settlement agreement with FastPay and avoids scheme suspension for routing live volume without certification

**MVP Scope items covered:** FastPay scheme certification gate (contractual compliance)

**Out of scope:**
- Ongoing scheme compliance cadence
- Scheme recertification trigger conditions
- Customer communication of routing change
- Reporting of live volume to FastPay post-certification

**Assumptions to test:**
- FastPay provides a certification test harness and assigns a technical assurance team contact before this story begins
- Certification scope is confirmed to cover Stories 1 and 2 only (fallback path is out of scope)

**Architecture Constraints:**
- **Contractual process gate C2 (FastPay Scheme Certification — clause 7.3, source: Background narrative):** This story is the certification gate. Live routing of NZD/PHP payments through the FastPay path is blocked until AC3 is satisfied. This is explicitly a contractual obligation — not an engineering option. No volume routing to FastPay (including pilot batches or shadow-mode live routing) before sign-off is received.
- Certification evidence artefacts (test results, conformance records) must be retained
- Certification scope must be formally agreed with FastPay technical assurance team before testing begins

**Acceptance Criteria:**

1. Given Stories 1 and 2 are deployed to the FastPay certification environment, When the FastPay technical assurance team begins certification, Then the certification scope is agreed and documented as covering: programmatic routing engine, NZD/PHP settlement message format, idempotency handling, and settlement latency — with all Stories 1 and 2 ACs having corresponding test evidence

2. Given a finding is raised during certification (e.g. message format deviation, idempotency failure, latency breach in certification environment), When the finding is communicated by the FastPay team, Then the finding is logged in the remediation tracker, the live routing gate (AC3) remains blocked until the finding is resolved and FastPay confirms resolution

3. **Given** the FastPay scheme certification is completed, **When** the FastPay technical assurance team confirms the NZD/PHP routing implementation satisfies scheme requirements under clause 7.3 of the FX settlement agreement, **Then** a formal certification sign-off document is issued and received by the Payments Settlement Engineer, live routing of NZD/PHP payment volume through the FastPay path is permitted, and the sign-off document is stored as a compliance artefact — **live routing must not begin before this sign-off is received**

---

## Step 4a verification — narrative-only constraint propagated

| Constraint | Source | Stories with Architecture Constraint | Stories with explicit AC |
|-----------|--------|--------------------------------------|--------------------------|
| C2 — FastPay Scheme Certification (contractual, clause 7.3) | Background narrative | Stories 1, 2 | Story 4 AC3 ✅ |

✅ **Regulated constraint propagation check complete (Step 4a)**
Constraints checked: 1 | Stories updated: 4 | Trigger exclusions logged: 1 (Story 3 — fallback path outside FastPay scope, noted in Architecture Constraints) | Narrative-only source: explicitly documented in constraint record and Story 4 Architecture Constraints

---

## Step 5 — Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: NZD/PHP settlement latency p95 < 4 hours | Story 1 (routing path established), Story 2 (FastPay settlement — latency measured here), Story 3 (fallback prevents latency spikes) |
| M2: SME cross-border volume +10% in 90d | Story 4 (certification gate — live routing impossible without this) |

---

## Step 6 — Scope accumulator

**Discovery MVP scope items:** 3
1. Programmatic routing engine — Story 1 ✅
2. NZD/PHP via FastPay — Story 2 ✅
3. Automatic fallback — Story 3 ✅

**Stories written:** 4
**Coverage:** 3/3 items covered
**Scope additions:** 0 (Story 4 is the contractual gate mandated by clause 7.3)
**Scope ratio:** 4/3 = 1.33 — acceptable; gate story is a contractual requirement

✅ **Scope check passed** — 4 stories covering 3 MVP items. C2 gate (Story 4) mandated by clause 7.3 of the FX settlement agreement, identified from Background narrative.

---

## Definition complete ✅

Epics: 1
Stories: 4
Slicing strategy: Walking skeleton
Scope check: ✅ Clean
Regulated constraint check: ✅ C2 (FastPay Scheme Certification — contractual, clause 7.3) identified from Background narrative (narrative-only source documented), propagated to Story 4 AC3 with explicit gate language and Architecture Constraints in Stories 1–2
