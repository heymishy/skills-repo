## /discovery — RTP Receiving Side (ISO 20022, real-time crediting, fraud/AML, acknowledgements)

Below is a structured discovery output to clarify scope, dependencies, risks, and a recommended target approach—focused on **receiving inbound RTP payments** and meeting **scheme acknowledgement within the 10-second timeout**.

---

### 1) Objectives & non-functional requirements (what “done” means)
**Primary goal:** Accept inbound RTP payments to enterprise customer accounts using Payments NZ central infrastructure, process ISO 20022 messages, **credit accounts in real time**, and **send acknowledgements within 10 seconds** of receipt.

**Hard requirements (scheme/customer experience):**
- **Availability:** 24/7/365
- **Latency:** must receive + process + ack within **10 seconds**
- **Fund availability:** immediate (or scheme-defined “availability” point, but operationally “credit is visible” quickly)
- **ISO 20022 compliance:** correct parsing, validation, mapping, and response message creation
- **At-least-once / exactly-once handling:** handle retries, duplicates, and network failures robustly
- **Fraud/AML controls:** required for all inbound payments (fraud) and AML above $1,000

---

### 2) Current-state assessment (as described)
- **Core banking:** batch processing windows; no real-time credit.
- **Existing fraud system:** batch-only; no real-time API. Estimated real-time fraud check would add **2–4 seconds**.
- **Existing AML system:** has real-time API; **P99 latency ~8 seconds under load**. Not load-tested at peak RTP rate (**40,000 tx/hour**, peak).
- **Acknowledgement deadline:** 10 seconds from receipt.

Key implication: **AML alone (P99=8s) leaves ~2 seconds** for the rest of the pipeline, which likely includes ISO parsing, validation, posting orchestration, idempotency, and ack composition—meaning the naive “do AML then ack” approach may fail under peak.

---

### 3) Target-state conceptual architecture (recommended direction)
To meet 10 seconds reliably, the receiving side typically needs:

#### A) “Thin real-time receiving layer” (front door)
Responsibilities:
- Receive inbound message from Payments NZ central
- Validate message envelope/required fields
- Determine routing/customer/account mapping
- Perform **idempotency + correlation**
- Create and send **scheme-required acknowledgement** quickly
- Trigger asynchronous downstream processing (fraud/AML, posting, reconciliation)

**Design goal:** acknowledgement should not depend on slow screening steps.

#### B) Real-time “decisioning” strategy for fraud/AML
Because you must ack within 10 seconds:
- Consider **ack now + hold / later decision**, *only if scheme rules and operational/audit controls allow this behavior*.
- Alternatively: **pre-screening / streaming scoring** or **optimise screening path** so it completes within timeout.

Your discovery should confirm which of these is permitted by:
- Payments NZ RTP scheme rules (ack semantics: “accepted for processing” vs “finalised”)
- Your scheme participation agreement and audit requirements
- Your risk/compliance policies

#### C) Posting / ledger crediting mechanism
Because the core is batch:
- Implement a **real-time posting adapter**:
  - Create an internal “RTP credit” entry in a real-time ledger/GL staging area
  - Make funds available immediately via a **shadow ledger / immediate balance view / provisional credit**
  - Reconcile with core EOD batch later (with clear adjustment workflow)

This avoids waiting for core batch windows.

#### D) Reconciliation and end-of-day (EOD)
- Reconcile:
  - inbound message IDs vs posted credits
  - screening outcomes vs reversals/adjustments
  - duplicates and retries
- Ensure any “ack early / act later” model has:
  - reversal paths
  - customer comms / statement impacts policies
  - audit trails

---

### 4) Message flow (high level)
1. **Inbound ISO 20022 RTP message received**
2. Real-time layer:
   - schema validation + required field checks
   - extract identifiers (e.g., message ID, transaction ID, end-to-end ID)
   - determine receiving customer account and destination mapping
   - write an **idempotency record** (dedupe key)
3. Real-time layer sends **ack within 10 seconds**
4. In parallel / immediately after:
   - fraud screening (real-time or via new interface)
   - AML screening if amount > $1,000
   - if pass: post credit to real-time availability ledger
   - if fail: quarantine / reverse / follow scheme-compliant handling (requires rule confirmation)
5. Reconciliation with batch core at end of day

---

### 5) Latency budget analysis (critical discovery item)
You effectively have ~10 seconds for everything from receipt → ack.

Current estimates:
- Fraud screening added: **2–4s**
- AML P99 under load: **8s**
- This suggests:
  - If ack waits for AML: likely breach at P99 (8s AML + parsing + posting prep + network + persistence)
  - If ack waits for both fraud+AML: even worse

**Discovery actions:**
- Define a strict **latency budget** for:
  - inbound accept + network handling
  - ISO parsing/validation
  - persistence/idempotency write latency (DB / queue)
  - ack message build + send latency
  - any “decision wait” time if screening gates ack
- Confirm required **ack semantic**:
  - Is “ack” simply receipt/validation, or final acceptance after compliance checks?

---

### 6) Fraud & AML control approach options (to evaluate)
#### Option 1: “Ack immediately, screen asynchronously” (risk-managed)
- Ack within 10 seconds after lightweight checks + idempotency + syntactic validation.
- Run fraud/AML asynchronously.
- If screening fails after ack:
  - reverse/provisional-hold logic depending on scheme and policy.
- Pros: improves chance of meeting 10s.
- Cons: requires strong policy/risk acceptance; needs scheme rule confirmation.

#### Option 2: Build real-time fraud screening API (fast path)
- Convert fraud batch logic into a streaming/real-time scoring service.
- Pros: aligns controls with timing.
- Cons: may be a significant build effort; need to meet worst-case latency.

#### Option 3: Split AML into “fast triage” + “deep AML” (tiering)
- Use AML system tiering:
  - Immediate screening/negative/allow list results within <2s
  - Deeper review asynchronously
- Pros: may keep ack within 10s.
- Cons: requires AML vendor/system changes or new architecture patterns.

#### Option 4: Capacity/load test and tune AML path
- Prove AML P99 at RTP volumes and tune:
  - caching, model optimisation, concurrency, DB indexes, queueing model
- Pros: reduces “unknown unknowns”.
- Cons: may be insufficient if baseline P99 can’t be improved enough.

**Given AML P99=8s and 40k tx/hr, the likely reality is you need Option 1 and/or tiering.** But this must be validated against scheme ack semantics.

---

### 7) Throughput & capacity discovery (40,000 tx/hr peak)
- 40,000 tx/hour ≈ **11.1 tx/sec average** (peak may be higher burst)
- Need to size:
  - inbound listener instances
  - message parsing CPU
  - idempotency database throughput
  - queueing/backpressure
  - screening services (fraud/AML)
  - posting/ledger writes

**Discovery actions:**
- Obtain true RTP peak profile (bursts, not just average)
- Identify whether RTP inbound acknowledgements are per-message and whether multiple messages can be batched
- Define target system SLOs:
  - ack success rate
  - end-to-end screening SLA
  - backlog growth tolerance

---

### 8) Core integration approach for “immediate credit”
Because core is batch:
- Implement a **real-time credit ledger / balance impact layer**:
  - provisional credit visible to customer immediately
  - EOD reconciliation posts adjustments to core
- Required interfaces:
  - receive funds availability updates
  - ledger posting API
  - reversal/correction API for failed screenings
  - customer balance/statement integration rules

**Discovery actions:**
- Confirm how customer accounts are represented in core today (ledger, sub-ledger, balance cache)
- Determine what “immediate fund availability” means operationally (available balance vs actual ledger posting)
- Identify reconciliation boundaries and how EOD adjustments affect statements and disputes

---

### 9) Idempotency, duplicates, retries, and exactly-once behavior
Real-time payment networks can retry or resend messages.
You need:
- A **deduplication key** strategy:
  - likely based on message ID + end-to-end ID + transaction ID
- Idempotent processing:
  - if already processed, return consistent ack outcome (per scheme rules)
- Persistent state machine:
  - RECEIVED → ACKED → SCREENING_IN_PROGRESS → CREDITED / QUARANTINED → RECONCILED

**Discovery actions:**
- Identify all unique identifiers in the ISO 20022 inbound messages
- Confirm scheme duplicate handling requirements
- Decide state store technology and retention

---

### 10) Operational readiness & monitoring
24/7 requirements mean you need:
- end-to-end trace IDs across receiving, screening, posting, ack
- alerts on:
  - ack failures / timeouts
  - screening latency breaches
  - backlog depth growth
  - reconciliation mismatches
  - duplicate spikes
- audit logging:
  - compliance decision rationale
  - who/what triggered reversals
  - message payload retention policy (PII/security)

---

### 11) Project plan constraint: go-live by 2026-09-01
Given uncertainty around AML latency under load and fraud real-time readiness, the plan must front-load proof.

**Discovery milestone recommendations (immediate):**
1. **Confirm ack semantics** with Payments NZ + scheme member guidance  
2. **Define latency budget** and decision model (ack gating vs async screening)
3. **Create an end-to-end prototype**:
   - ISO parsing + ack composition
   - idempotency + state machine
   - credit to real-time layer (mocked screening outcomes)
4. **AML load test at RTP scale** (must be early)  
5. **Fraud real-time readiness assessment**:
   - estimate build timeline for real-time API or tiered approach
6. **Pilot / test environment integration** with Payments NZ infrastructure

---

### 12) Key risks (top items to investigate now)
1. **10-second acknowledgement window risk**
   - AML P99=8s suggests ack cannot wait for AML result.
2. **Fraud system real-time gap**
   - 2–4s estimate may still be incompatible with ack gating if AML also required.
3. **Ambiguity in ack semantics**
   - Without knowing whether ack can mean “accepted for processing” vs “finalised after screening”, architecture may be forced.
4. **Load/unpredictable bursts**
   - 40k/hr average ≠ peak; queues may grow and timeouts may increase.
5. **Reversal/quarantine complexity**
   - If you ack before compliance decision, you need safe reversal workflows.
6. **EOD reconciliation correctness**
   - Provisional credits must reconcile cleanly to avoid customer-visible inconsistencies.

---

## Discovery outputs required from you / SMEs (next step)
To proceed, I recommend collecting answers to these concrete questions:

1. **Ack semantics**
   - What does the scheme consider a valid acknowledgement? Does it require screening completion or just receipt/validation?
2. **ISO 20022 specifics**
   - Which message types exactly are used for inbound RTP in your integration (and which ack types are required)?
3. **Customer account mapping**
   - How do we map inbound creditor details → enterprise customer account?
4. **Real-time “available balance” definition**
   - What system/indicator do customers use, and can it be updated from the thin layer?
5. **AML/ Fraud decision requirements**
   - Are there hard rules requiring blocking before credit, or is provisional credit allowed with post-screen action?
6. **Operational constraints**
   - Any constraints on outbound message rate/throughput to Payments NZ?
7. **Existing environments**
   - Do you have access to Payments NZ test harness for RTP receiving and ack verification?
8. **AML load testing inputs**
   - Current AML SLA targets beyond P99=8s; concurrency limits; dependencies (datastores, caches).
9. **Fraud batch runtime and logic**
   - Could fraud results be computed from features available in the real-time layer, or is the batch job heavily dependent on batch-only data?

---

If you want, I can convert this into a **formal discovery deliverable** format (workstreams + detailed tasks + RACI + target architecture diagram in words + a milestone plan from now to 2026-09-01).