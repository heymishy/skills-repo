Below is a structured delivery plan for the **receiving side** of Payments NZ RTP, focusing on meeting the **10-second acknowledgement SLA** and the **2026-09-01 go-live** requirement. I’ll assume your “thin real-time layer” will sit alongside (and call out to) existing core banking, fraud, and AML services, and will be responsible for ISO 20022 message handling and acknowledgements.

---

## 1) Confirm the critical timing model (must-do early)
Before solution design, you need a single, shared “time budget” for:

- **ISO 20022 receive → validate/parse**
- **fraud screening**
- **AML screening (if amount > 1,000)**
- **credit decision + posting**
- **ack message creation**
- **ISO 20022 acknowledgement send back to Payments NZ**
- **fail paths (timeouts, retries, negative acknowledgements)**

### Action (within 1–2 weeks)
Run a workshop with Payments NZ scheme requirements + your engineering teams to produce:

1. The exact acknowledgement requirement:
   - Message type(s) expected
   - “10 seconds from receipt” definition (network receive vs end of validation)
   - Allowed “ack now, decide later” patterns (if any)
   - Rules for reversals/recalls when you later decline/hold

2. A hard time budget, e.g.:
   - Pre-checks (parsing, schema, signature/transport checks): **< 0.5s**
   - Fraud screen: **2–4s** (target or worst-case)
   - AML (only > $1,000): **P99 8s** → this is the main risk
   - Real-time credit/post & staging: **< 2–3s**
   - Ack message + send: **< 1s**
   - This already suggests **you will not fit if AML must complete before ack**.

**Key point:** With AML P99 at 8s, you have almost no remaining time. So you likely need a design that either:
- can ack within 10s using **fast decisioning**, or
- can **temporarily accept** and then act if AML result later is adverse (subject to scheme rules), or
- can do **parallel processing** and use a **“provisional/hold”** scheme-compliant acknowledgement (again, depends on allowed scheme semantics).

---

## 2) Decide the scheme-compliant risk posture: “acknowledge vs final decision”
Because fraud + AML are not guaranteed to finish within the SLA, you need a compliant pattern.

### Recommended decision patterns to evaluate (choose one with scheme compliance)
1. **Provisional acceptance + later outcome**
   - Send a positive ack within 10s that indicates “accepted for processing”
   - If AML returns adverse, perform a **hold/reversal/recall** flow (requires scheme support and/or your internal settlement controls)
   - Pros: meets RTP latency
   - Cons: requires robust reversal/after-the-fact controls; must confirm with scheme rules

2. **Two-tier screening**
   - Implement a **real-time “fast AML”** subset (rule-based / risk scoring) that always completes in < X seconds
   - For outliers/unknowns, do deeper checks asynchronously and treat them as “provisional”
   - Pros: reduces AML latency impact
   - Cons: needs model/rules + governance

3. **Pre-screening / data enrichment**
   - Maintain near-real-time customer/entity risk profiles so that at inbound time you don’t wait on heavy AML workflows
   - Use streaming updates from your AML system
   - Pros: best for latency
   - Cons: more architectural change

**You should treat this as a compliance + architecture decision**, not a purely technical one.

---

## 3) Architecture: thin real-time processing layer
### Target components (receiving side)
1. **RTP ISO 20022 Message Ingress**
   - Transport adapter to Payments NZ central infra
   - ISO 20022 parsing, schema validation
   - Correlation IDs (end-to-end idempotency keys)

2. **Real-time Decision Engine (low latency)**
   - Determines message validity and which screening path to use
   - Creates a “processing record” (in-memory + durable store)

3. **Fraud Screening Integration**
   - Because fraud is currently batch-only, you need one of:
     - Real-time API wrapper around the fraud service (if rules allow)
     - A “shadow” decision service using the same fraud rules but optimized for RTP
     - Or provisional acceptance pattern if batch fraud can’t be real-time

4. **AML Screening Integration**
   - Either reduce P99 latency with performance tuning + load-tested infrastructure
   - Or split into fast/slow tiers with provisional ack

5. **Core Banking Posting Adapter**
   - A non-blocking posting/credit mechanism
   - Writes to a “real-time ledger” or “pending credits” store that core reconciles
   - Ensures idempotency (same payment can’t credit twice)

6. **Acknowledgement Composer**
   - Maps internal outcomes to scheme-required ISO 20022 acknowledgement format
   - Sends ack within 10 seconds (fast path, deterministic)

7. **Reconciliation + End-of-day Sync**
   - Reconcile real-time credits against batch core
   - Handle discrepancies, reversals, settlement adjustments

### Data flow (happy path)
1. Receive inbound ISO 20022 payment message
2. Validate format + required fields
3. Persist “inbound payment received” event (durable)
4. Run fraud + AML checks in parallel if possible (or use fast path)
5. Create internal credit instruction
6. Credit “real-time” account balance / pending ledger immediately
7. Send scheme ack within SLA
8. Later, finalize/confirm posting in batch core and reconcile

---

## 4) Idempotency, exactly-once effects, and retry strategy (critical for real-time)
You need to guarantee that duplicates, timeouts, or retries from the scheme do not cause double-credit.

### Must implement
- **Deterministic idempotency key** from ISO 20022 fields (e.g., message/payment ID)
- **Durable intake store**:
  - status: Received → Validated → Screening → Credited/Rejected → AckSent
- **Idempotent posting**:
  - “credit” operation must be safe to repeat (use ledger entries keyed by payment ID)
- **Ack send is idempotent**
  - if the ack send fails and is retried, you must not create multiple conflicting outcomes

---

## 5) Fraud in real time: practical options
Given fraud is batch today and adds 2–4 seconds if made real-time, you need to ensure it actually completes within budget.

### Actions
1. Identify whether fraud screening rules can be evaluated statelessly in < 2–4 seconds.
2. Implement one of:
   - **Real-time fraud decision service** (replicate rules or call batch engine via low-latency API)
   - **Precomputed features / caches** so real-time path avoids DB-heavy operations
3. Load test fraud service at RTP peak conditions (even if only to validate worst-case response time).

### If fraud cannot be made real-time safely:
- Use **provisional acceptance** pattern + post-ack hold/reversal workflow (subject to scheme compliance).

---

## 6) AML P99=8s is a major risk: you must de-risk before design freeze
At estimated **40,000 txn/hour peak**, you should assume substantial burstiness and concurrency.

### Required actions (must before build-lock)
1. **Load test AML** at *RTP-like* concurrency and message size.
2. Measure:
   - total latency distribution (p50/p90/p99)
   - queueing time vs compute time
   - downstream dependencies (DB, KYC data services, sanctions provider)
3. Identify what can be improved:
   - caching of customer/entity profile data
   - async vs sync refactor
   - horizontal scaling and autoscaling thresholds
   - DB/index tuning
   - avoiding external calls in the synchronous path when possible

### If you cannot get AML P99 comfortably below the remaining time budget:
- Implement **tiered AML**:
  - fast rules first (always)
  - heavy/slow screening later (provisional)
- Or obtain scheme approval for acknowledgement semantics that allow provisional acceptance.

---

## 7) Core banking integration: “pending credits” + reconciliation
Since core banking is batch-window based, your real-time layer should **not** wait for full core posting to meet 10-second ack.

### Common pattern
- Maintain a **real-time ledger / sub-ledger** for RTP credits:
  - “credited available balance” OR “pending credit” that becomes available based on policy
- At end of day:
  - reconcile ledger vs core
  - post settlement adjustments into core

### Decisions you need
- Are funds “immediately available” upon ack, or only after deeper risk checks?
- If provisional, what does “available” mean (some schemes treat this differently; you must align with scheme and your regulatory stance)?

---

## 8) Operating model: 24/7/365 + runbooks
You must be able to survive outages without missing the acknowledgement window.

### Required operational capabilities
- 24/7 on-call for RTP ingress, messaging, decision services, and acknowledgements
- Dead-letter queues + replay tooling
- Monitoring:
  - ack latency (p95/p99)
  - screening latency (fraud/AML separately)
  - queue depth, error rates
  - reconciliation mismatch rates
- Backpressure strategy:
  - If AML is degraded, how do you still send ack? (choose provisional stance)
- Disaster recovery:
  - ensure ingress and ledger state are durable and recoverable

---

## 9) Delivery plan to meet 2026-09-01 (high-level milestones)
You should run this as phases with “compliance checkpoints”.

### Phase 0 — Discovery + scheme compliance confirmation (Now → ~4–6 weeks)
- Time budget + acknowledgement semantics decision
- Confirm ISO 20022 message mapping and ack message types
- Idempotency strategy
- Fraud/AML strategy decision (provisional vs must-complete)

### Phase 1 — Prototype real-time pipeline (6–10 weeks)
- ISO 20022 ingress + validation
- Durable intake store + idempotency
- Ack composer + simulated screening outcomes
- Real-time posting to sub-ledger/pending ledger

### Phase 2 — Integrate fraud + real AML/fast AML (8–12 weeks)
- Fraud real-time path or provisional pattern
- AML integration + load testing + tuning
- If tiered AML/provisional, build the policy engine + reversal/hold flows

### Phase 3 — Core reconciliation + end-to-end tests (8–12 weeks)
- Reconciliation jobs, reconciliation reports
- D+0 settlement alignment
- Replay testing, duplicate testing

### Phase 4 — UAT with Payments NZ + security/controls (8–12 weeks)
- Security testing, pen test, threat modeling
- ISO 20022 conformance testing with scheme
- Performance test to demonstrate ack latency under RTP peak

### Phase 5 — Cutover + go-live readiness (last 4–8 weeks)
- DR drills
- Runbooks, monitoring dashboards
- Final sign-off

**Note:** Dates depend on your internal constraints, but you should assume you need to finish load testing and acknowledgement semantics decisions well before late 2025/early 2026 to avoid penalties.

---

## 10) Key risks and what to do immediately
1. **AML P99 8s makes synchronous screening before ack likely impossible**
   - Immediate: load test + latency breakdown + redesign decision (fast/provisional/tiered)

2. **Acknowledgement SLA 10 seconds + all other steps**
   - Immediate: formal time budget + prove p99 latency with load testing

3. **Fraud batch-only integration**
   - Immediate: implement real-time fraud or adopt provisional acceptance

4. **Duplicate messages and exactly-once effects**
   - Immediate: implement durable idempotency and ledger semantics early

5. **“Immediate availability” requirement vs screening completion**
   - Immediate: confirm with regulators/scheme what “available” means during provisional outcomes

---

## What I need from you to tailor this into a concrete solution plan
Reply with:
1. The **exact scheme acknowledgement requirement** (which message type(s), and whether provisional acceptance is allowed).
2. Your current **fraud** and **AML** API characteristics (timeouts, payload sizes, whether you can cache inputs).
3. How core banking can integrate: do you have a **sub-ledger** or can you create one?
4. Target system stack constraints (cloud/on-prem, languages, preferred messaging platform).
5. Regulatory stance on **provisional credits** / reversal workflows.

If you provide those, I can produce:
- a recommended acknowledgement strategy that is realistically compatible with the 10-second SLA,
- a concrete component diagram + sequence flows (happy path + failure paths),
- and an RTP receiving acceptance test checklist aligned to the scheme.