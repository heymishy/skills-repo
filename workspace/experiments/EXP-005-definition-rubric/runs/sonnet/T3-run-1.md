# Definition Output — T3 (Implicit Regulated Constraint — FastPay Narrative Only)
**Case ID:** T3-implicit-regulated
**Model:** claude-sonnet-4-6
**Date:** 2026-05-15
**Eval mode:** true

---

## Entry condition check
✅ Discovery artefact found: "Cross-Border Payment Routing — NZD/PHP via FastPay" — Status: Approved
✅ Benefit-metric artefact found: "Cross-Border Payment Routing — NZD/PHP via FastPay"
✅ Metrics with targets: 2 (M1: NZD/PHP settlement latency p95 < 4 hours; M2: SME cross-border payment volume +10% in 90 days post-launch)

---

## Step 4a — Regulated constraint propagation check

**Scanning all discovery sections for regulated constraints — including Background narrative...**

**Constraints section review:**
- "Settlement latency SLA: NZD/PHP settlement path must achieve p95 < 4 hours from payment initiation to scheme confirmation" — technical NFR, not a process gate
- "Fallback activation: automatic fallback to existing correspondent banking path must activate within 30 seconds of FastPay path failure" — technical NFR, not a process gate

**Background narrative scan:**
The following passage appears in the Background narrative (not the Constraints section):

> "Our FX settlement agreement with the scheme requires scheme certification before we can route live volume through the new path — this is a contractual obligation, not a technical preference."

⚠️ **NARRATIVE-ONLY CONSTRAINT IDENTIFIED**

This passage describes a contractual process gate that is not reflected in the Constraints section. It is a regulated/contractual process gate, not a technical constraint:
- The phrase "scheme certification before we can route live volume" describes a hard activation dependency (cannot route live volume without certification)
- The phrase "contractual obligation, not a technical preference" explicitly confirms this is not optional
- "Scheme" refers to FastPay — the FX settlement agreement with FastPay requires scheme certification and sign-off from the FastPay technical assurance team before live routing

**Regulated constraint (extracted from narrative):**

**C2 — Process Gate (FastPay Scheme Certification):**
- Obligation: FX settlement agreement with FastPay — clause 7.3 (scheme certification requirement)
- Approving authority: FastPay technical assurance team (scheme certification body)
- Gate condition: FastPay scheme certification obtained AND formal sign-off from FastPay technical assurance team received — live routing of NZD/PHP volume through the new path is not permitted before both conditions are met
- Type: Contractual process gate — "contractual obligation, not a technical preference" (operator's words in narrative)
- Source: Background narrative — NOT Constraints section (noted for traceability)

**Scope of trigger:** This gate applies to all stories that implement the NZD/PHP routing path through FastPay. Stories implementing the fallback path to existing correspondent banking are outside the FastPay certification scope.

**Constraint propagation plan:**
- C2 (FastPay certification gate) → dedicated AC in Story 4, Architecture Constraints in Stories 1 and 2
- Story 3 (fallback path) is outside FastPay certification scope — Architecture Constraint note only
- Technical NFRs (latency, fallback timing) propagate as NFR fields — not as C2 gates

---

## Step 1.5 — Architecture constraints scan

`.github/architecture-guardrails.md` not present in corpus. Proceeding without guardrail check.

---

## Step 2 — Slicing strategy

**Strategy chosen:** Walking skeleton
**Rationale:** Cross-border payment routing through a new scheme (FastPay) has significant integration unknowns — settlement message format, scheme API stability, certification test harness availability. A walking skeleton establishes the programmatic routing engine first, proves the end-to-end path to FastPay (including scheme sandbox), then adds the fallback path and the scheme certification gate. This surfaces FastPay integration risk before committing to the full story set.

---

## Step 3 — Epic structure

**Single epic: Cross-Border Payment Routing — NZD/PHP via FastPay**
- **Stories:** 4 stories
- **Rationale:** The NZD/PHP routing feature is a focused integration with three technical stories and one contractual gate story. A single epic keeps the FastPay certification dependency visible and avoids the certification gate being treated as a post-launch item.

---

## Stories

### Story 1: Programmatic Routing Engine — NZD/PHP via FastPay

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M1 (routing engine is the core mechanism — settlement latency is measured from payment initiation through this path)

**As a** Payments Settlement Engineer **I want** a programmatic routing engine that evaluates incoming NZD/PHP payments against routing policy and directs them to the FastPay scheme path **so that** routing decisions are made deterministically at payment submission time, eliminating manual routing and establishing the technical foundation for p95 < 4-hour settlement

**MVP Scope items covered:** Programmatic routing engine (scope item 1)

**Out of scope:**
- Routing for currency pairs other than NZD/PHP
- Merchant-level routing override
- Dynamic routing based on real-time scheme availability scores
- Routing policy UI

**Assumptions to test:**
- FastPay API specification is stable and the sandbox environment is accessible before Story 2
- Routing policy logic is simple enough to encode without a rules DSL — hardcoded routing table acceptable for MVP

**Architecture Constraints:**
- Routing decisions must be logged with: payment ID, timestamp, routing path chosen, rationale (policy rule matched), and outcome
- Routing engine must support policy override (manual failover to correspondent banking) without a code deployment
- **Regulated constraint C2 (FastPay Scheme Certification — contractual obligation, source: Background narrative clause 7.3):** This story implements the routing path to FastPay. FastPay technical assurance team certification and sign-off (Story 4 AC3) are required before live NZD/PHP volume is routed through this path.

**Acceptance Criteria:**

1. Given an NZD/PHP payment submission is received, When the routing engine evaluates the routing policy, Then the payment is directed to the FastPay scheme path, a routing decision record is created with full context (payment ID, timestamp, path, rule matched), and the routing decision is returned within 500ms

2. Given the routing policy is updated (e.g. a new routing rule added), When the next NZD/PHP payment arrives, Then the updated policy is applied without requiring a service restart

3. Given a manual override is applied to redirect all NZD/PHP payments to the correspondent banking fallback path, When the next payment arrives, Then the routing engine applies the override, logs the override as the routing rationale, and does not attempt to route to FastPay

---

### Story 2: NZD/PHP Settlement via FastPay Scheme

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M1 (settlement latency through FastPay is the primary metric — this story is where the p95 < 4-hour target is implemented and measurable)

**As a** Payments Settlement Engineer **I want** to submit NZD/PHP settlement messages to the FastPay scheme API and receive settlement confirmation within the p95 < 4-hour SLA **so that** SME customers receive faster, lower-cost cross-border payments than the existing correspondent banking path

**MVP Scope items covered:** NZD/PHP settlement via FastPay (scope item 2)

**Out of scope:**
- Bulk settlement batching
- Multi-currency extension beyond NZD/PHP
- Scheme fee reconciliation
- Settlement dispute handling

**Assumptions to test:**
- FastPay settlement API is accessible in sandbox for integration testing before scheme certification
- Settlement confirmation latency in sandbox is representative of production behaviour

**Architecture Constraints:**
- Settlement messages must conform to FastPay scheme message specification (version confirmed with FastPay before story start)
- All settlement API interactions must be idempotent — network retries must not produce duplicate settlements
- **NFR (Constraint: latency SLA):** Settlement confirmation received from FastPay at p95 < 4 hours from payment initiation
- **Regulated constraint C2 (FastPay Scheme Certification — contractual obligation, source: Background narrative clause 7.3):** This story's implementation is the core of the FastPay settlement path. FastPay technical assurance team certification (Story 4 AC3) gates production activation of this story's implementation.

**Acceptance Criteria:**

1. Given an NZD/PHP payment is routed to the FastPay path, When the settlement message is submitted to FastPay, Then FastPay acknowledges receipt within 30 seconds and returns a settlement reference ID

2. Given a settlement message is submitted and the network connection is interrupted before FastPay acknowledges, When the settlement service retries, Then the idempotent retry does not create a duplicate settlement entry in FastPay (confirmed by FastPay deduplication API)

3. Given 1,000 NZD/PHP settlement submissions are made in a load test against the FastPay sandbox, When p95 settlement confirmation latency is measured, Then p95 confirmation time is below 4 hours

---

### Story 3: Automatic Fallback to Correspondent Banking

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M1 (fallback prevents routing failures from creating settlement latency spikes — protects the p95 target under failure conditions)

**As a** Payments Settlement Engineer **I want** the routing engine to automatically detect FastPay path failure and fall back to the existing correspondent banking path within 30 seconds **so that** NZD/PHP payments are never stranded due to FastPay unavailability and SME customers are not impacted by scheme outages

**MVP Scope items covered:** Automatic fallback to correspondent banking (scope item 3)

**Out of scope:**
- Fallback for currency pairs other than NZD/PHP
- Automatic failback (returning to FastPay after recovery — post-MVP)
- Customer notification of fallback activation
- Correspondent banking path changes

**Assumptions to test:**
- Correspondent banking path is operational and accepts NZD/PHP payments during fallback periods
- FastPay failure detection mechanism (health check or error threshold) is sufficient for 30-second activation SLA

**Architecture Constraints:**
- Fallback activation must be triggered within 30 seconds of FastPay path failure detection
- Fallback must not require human intervention — fully automatic
- Fallback events must be logged with: activation timestamp, FastPay failure type, fallback duration, and recovery timestamp (when FastPay path is restored)
- **Note on FastPay certification scope:** The fallback path (correspondent banking) is outside FastPay scheme certification scope. However, if the fallback path is activated before Story 4 (certification gate), that is permitted — the certification gate applies only to the FastPay path, not the fallback path.

**Acceptance Criteria:**

1. Given the FastPay settlement API is returning errors (simulated in test environment), When the failure threshold is reached (3 consecutive failures within 10 seconds), Then the routing engine automatically activates the fallback path within 30 seconds and all subsequent NZD/PHP payments are routed to correspondent banking

2. Given the fallback path is active, When a new NZD/PHP payment arrives, Then it is processed through the correspondent banking path, a fallback routing record is created, and the payment is not attempted via FastPay

3. Given the fallback is active and the FastPay path recovery is confirmed (simulated), When the routing engine detects FastPay availability, Then an operator alert is raised indicating FastPay has recovered — manual confirmation required before automatic return to FastPay path (to prevent oscillation)

---

### Story 4: FastPay Scheme Certification and Live Routing Gate

**Persona:** Payments Settlement Engineer
**Connects to:** Metric M2 (volume growth target requires live routing to be activated — volume growth is only measurable after the certification gate is passed and live routing is enabled)

**As a** Payments Settlement Engineer **I want** to complete the FastPay scheme certification process, obtain formal sign-off from the FastPay technical assurance team, and use this as the explicit gate before routing live NZD/PHP payment volume through the new path **so that** the bank honours its contractual obligation under the FX settlement agreement with FastPay (clause 7.3) and avoids scheme suspension for routing live volume without certification

**MVP Scope items covered:** FastPay scheme certification gate (contractual compliance scope item)

**Out of scope:**
- Ongoing scheme compliance monitoring
- Scheme recertification cadence
- Card brand or correspondent bank notification of path change
- Volume reporting to FastPay post-go-live

**Assumptions to test:**
- FastPay provides a certification test harness and technical assurance team contacts before Story 4 begins
- Certification scope covers Stories 1 and 2 implementation only (routing engine + settlement API) — not Story 3 (fallback path is out of scheme scope)

**Architecture Constraints:**
- **Contractual process gate C2 (FastPay Scheme Certification — clause 7.3 of FX settlement agreement, source: Background narrative):** This story IS the contractual gate. Live routing of NZD/PHP payments through the FastPay path is explicitly blocked until AC3 is satisfied. This is a contractual obligation, not a technical preference (as stated in the Background narrative). No shadow-mode live routing, no pilot volume, before FastPay technical assurance team sign-off.
- Certification test results must be preserved as artefacts for audit trail purposes
- Certification scope must include Story 1 (routing engine) and Story 2 (settlement API) — FastPay technical assurance team to confirm scope

**Acceptance Criteria:**

1. Given Stories 1 and 2 implementations are deployed to the FastPay certification environment, When the FastPay technical assurance team begins certification testing, Then the certification scope is confirmed to include: programmatic routing engine, NZD/PHP settlement message format, idempotency handling, and settlement latency — and all Stories 1 and 2 ACs have corresponding test evidence artefacts

2. Given the certification process is in progress, When the FastPay technical assurance team identifies a finding (e.g. message format deviation, idempotency failure, latency breach), Then the finding is logged in the certification remediation tracker and the live routing gate (AC3) remains blocked until the finding is resolved and FastPay confirms resolution

3. **Given** the FastPay scheme certification process is complete, **When** the FastPay technical assurance team confirms that the NZD/PHP routing implementation meets scheme requirements under clause 7.3 of the FX settlement agreement, **Then** formal certification sign-off is issued to the Payments Settlement Engineer, live routing of NZD/PHP payment volume through the FastPay path is permitted, and the sign-off document is retained as a compliance artefact — **and live routing must not begin before this sign-off is received**

---

## Step 4a verification — constraint propagation complete

| Constraint | Source | Stories with Architecture Constraint note | Stories with AC |
|-----------|--------|------------------------------------------|-----------------|
| C2 — FastPay Scheme Certification (contractual gate, clause 7.3) | Background narrative | Stories 1, 2 | Story 4 AC3 ✅ |

✅ **Regulated constraint propagation check complete (Step 4a)**
Constraints checked: 1 | Stories updated: 4 | Trigger exclusions logged: 1 (Story 3 — fallback path is outside FastPay certification scope, noted in Architecture Constraints) | Narrative-only source documented: yes

---

## Step 5 — Benefit coverage matrix

| Metric | Stories that move it |
|--------|---------------------|
| M1: NZD/PHP settlement latency p95 < 4 hours | Story 1 (routing engine establishes path), Story 2 (settlement via FastPay — latency measured here), Story 3 (fallback prevents latency degradation under failure) |
| M2: SME cross-border volume +10% in 90 days | Story 4 (certification gate unlocks live routing — without this, M2 is unachievable) |

No metric gaps detected.

---

## Step 6 — Scope accumulator

**Discovery MVP scope items:** 3
1. Programmatic routing engine — Story 1 ✅
2. NZD/PHP via FastPay — Story 2 ✅
3. Automatic fallback to correspondent banking — Story 3 ✅

Plus: FastPay scheme certification gate (Story 4) — mandated by contractual obligation (clause 7.3, Background narrative). Not a scope addition; this is required before live routing can occur.

**Stories written:** 4
**Coverage:** 3/3 MVP items covered
**Scope additions:** 0 (Story 4 mandated by contractual C2 gate)
**Scope ratio:** 4/3 = 1.33 — acceptable; Story 4 is a contractual gate story, not a feature story

✅ **Scope check passed** — 4 stories covering 3 MVP items. C2 gate story (Story 4) mandated by contractual obligation in Background narrative.

---

## Definition complete ✅

Epics: 1
Stories: 4
Slicing strategy: Walking skeleton
Scope check: ✅ Clean (Story 4 mandated by contractual clause 7.3)
Regulated constraint check: ✅ C2 (FastPay Scheme Certification — narrative-only, clause 7.3) extracted from Background narrative, propagated to Story 4 AC3 and Architecture Constraints in Stories 1–2. Narrative-only source explicitly documented.
