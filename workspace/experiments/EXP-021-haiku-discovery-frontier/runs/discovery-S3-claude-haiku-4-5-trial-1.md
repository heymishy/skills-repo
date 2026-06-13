# /discovery Pipeline Output: RTP Receiving Infrastructure

## Executive Summary
**Status**: HIGH RISK to launch deadline  
**Critical Path Blocker**: Real-time fraud & AML screening latency vs. 10-second acknowledgement SLA

You have a **hard constraint problem**, not a resource problem. The scheme timeout is immovable; your current screening systems cannot meet it under confirmed load conditions.

---

## Critical Risks

### 1. **Acknowledgement Timeout (P0 - Blocks Go-Live)**

| Step | Latency | Notes |
|------|---------|-------|
| Network transit (inbound) | ~200ms | Typical NZ domestic |
| Message parsing & validation | ~100ms | Reasonable |
| Fraud screening | 2–4s | **Unconfirmed fit; batch system** |
| AML screening (>$1k) | 8s P99 | **Measured at lower volumes** |
| Account credit & DB write | ~200ms | Assumes real-time layer built |
| Acknowledgement generation & send | ~100ms | Reasonable |
| **Total (AML path)** | **~10.8–12.4s** | **EXCEEDS 10s SLA** |

**The math fails before you add fraud screening.** The AML P99 alone consumes your window.

---

### 2. **AML System Unvalidated at RTP Scale**

- Current P99: 8 seconds
- Peak RTP volume: 40,000 tx/hr = **11.1 tx/second**
- **Unknown behavior**: Does AML latency degrade linearly, exponentially, or collapse under 3–5x current load?
- **No SLA defined** with AML vendor for RTP-scale throughput

Scenario: AML P99 could become 15+ seconds under RTP load, cascading all transactions into timeout failures.

---

### 3. **Fraud Screening Architecture Gap**

- Current system: batch job (unsuitable)
- Estimated real-time latency: 2–4 seconds
- **Status**: Estimate only; no proof-of-concept, no load testing
- **Requirement**: Scheme rules mandate fraud screening (cannot skip)
- **Decision point**: Build vs. buy vs. redesign

---

### 4. **Reconciliation Risk (Medium Risk)**

Real-time credit layer + batch core system = end-of-day reconciliation complexity.
- If real-time layer credits an account but batch core fails to settle, you have a ledger mismatch
- 24/7 operation means reconciliation runs across multiple batches
- No mention of compensating transaction logic for failed reconciliations

---

## Build vs. Buy Decision

### Option A: Optimize Real-Time Path (Recommended for 10s SLA)

**Assumption: Accept fraud screening latency hit, defer to post-credit controls**

1. **Split the fraud check**:
   - **Fast synchronous check** (200–400ms): Rules-based/heuristic screening
     - Amount thresholds, velocity checks, known-bad actor lists
     - Blocks ~85% of obvious fraud, fits within SLA
   
   - **Async deep check** (background post-credit):
     - Full ML model scoring, transaction graph analysis
     - Runs while funds held in suspense or post-credit
     - Can reject/recall within 24 hours if fraud detected
     - Scheme rules: Verify if post-credit fraud detection is compliant

2. **AML screening sequence**:
   - Run AML *only on transactions >$1k* (reduce volume hitting slow API)
   - Parallel process with account credit (don't serialize)
   - If AML times out, fail to schema acknowledgement (scheme will retry; you respond with rejection code)
   - Implement AML circuit breaker: if P95 > 6s, fallback to manual queue for >$5k

3. **Load test AML system now** (Q1/Q2 2025):
   - Simulate 50,000 tx/hr (20% headroom)
   - Establish actual P99/P999 latency curves
   - If P99 > 5.5s, negotiate SLA upgrade with vendor or replace

---

### Option B: Synchronous Path (Higher Risk, More Complex)

- Implement in-house fast fraud scoring (machine learning model)
- Queue AML calls asynchronously, credit account conditionally
- Adds engineering complexity; extends timeline 6–9 months
- Only viable if fraud system cannot be split

---

### Option C: Real-Time Hub/Switch (Enterprise Approach)

- Deploy dedicated RTP processing engine (separate from core banking)
- Handles screening, crediting, acknowledgement in isolation
- Core banking integrates via async settlement queue
- **Pros**: Clean separation, auditable, scales independently  
- **Cons**: New system, 12+ month build, higher cost
- **Timeline risk**: Likely misses 2026-09-01 unless started Q2 2024

---

## Recommended Immediate Actions

### Week 1–2: De-Risk the Baseline
1. **Fraud system RFP**:
   - Engage vendor for real-time API proof-of-concept
   - Confirm whether 2–4s estimate is measured or theoretical
   - Budget 4–6 weeks for PoC; assume worst case 4s

2. **AML load testing plan**:
   - Schedule 2-week load test campaign (Q1 2025)
   - Test at 50,000 tx/hr sustained
   - Document P50, P95, P99, P999 latency
   - Establish threshold for circuit breaker (e.g., P99 > 6s = fallback)

3. **Scheme clarification**:
   - Request written confirmation from Payments NZ on:
     - Whether post-credit fraud detection is compliant
     - Whether timeout applies to AML screening (or only to acknowledgement send)
     - Grace period or retry mechanisms if systems timeout
   - Confirm scheme will accept rejection codes if screening systems overloaded

### Week 3–4: Architecture Decision
- Map latency budget by scenario (with/without fraud, with/without AML)
- Choose Option A (async fraud split) or escalate to Option C (hub) if gaps remain
- Prepare timeline: Option A adds ~8–12 weeks; Option C adds 12+ months

### Timeline: Path to 2026-09-01

| Phase | Duration | Risk |
|-------|----------|------|
| Load test + architecture | 8 weeks | Medium |
| Fast fraud rules engine | 10 weeks | Low |
| Real-time layer + integration | 12 weeks | Medium |
| AML integration & fallback | 6 weeks | Low |
| End-to-end testing | 8 weeks | High |
| UAT + cutover | 4 weeks | Medium |
| **Total** | **~48 weeks** | **Path feasible if started Q2 2025** |

---

## Financial Risk Summary

- **Deadline miss penalty**: $50k/day = $1.5M over 30 days
- **Scheme suspension risk**: Existential (unable to participate in NZ real-time ecosystem)
- **Cost of Option A** (recommended): NZ$800k–1.2M (vendor fraud API + engineering)
- **Cost of Option C** (hub): NZ$3–5M + 12+ months
- **Delay cost**: Every week slipped = higher misalignment with scheme go-live coordination

**Recommendation**: Authorize Option A immediately; parallelize load testing and fraud vendor engagement to buy time.