# /discovery RTP Receiving Infrastructure

## Critical Path Issues

You have **three blocking dependencies** with different urgency profiles. Let me structure the discovery work:

---

## 1. **IMMEDIATE: Latency Envelope (Next 2 weeks)**

### The Hard Constraint
- **10-second acknowledgement window** is non-negotiable (scheme rules)
- Unknown: What's your current processing budget for this 10 seconds?

**Discovery tasks:**

| Task | Owner | Effort | Output |
|------|-------|--------|--------|
| Measure end-to-end latency of current payment flow (excluding fraud/AML) | Engineering | 3 days | Baseline processing time (P50, P95, P99) |
| Test fraud screening latency at 2–4 second estimate under load | Fraud team | 5 days | Confirm 2–4s is achievable or identify constraints |
| Load-test AML API at 40k tx/hr; measure P50/P95/P99 | AML team + Eng | 5 days | **Critical**: Does P99 stay <8s at RTP volume? |
| Model latency composition: receipt → fraud → AML → debit → ack | Engineering | 2 days | Identify if 10s window is achievable; flag if serial vs parallel |

**Risk flag:** If fraud (2–4s) + AML (8s at P99) + other processing runs **serially**, you're at ~10–12s before acknowledgement. This fails.

---

## 2. **HIGH: Real-Time Account Crediting (Weeks 2–4)**

Your proposed thin real-time layer is sound, but needs validation:

**Discovery tasks:**

| Task | Owner | Output |
|------|-------|--------|
| Map current core banking transaction flow (batch windows, posting rules) | Core Banking PM | Document: posting lag, reconciliation checkpoints, GL impact timing |
| Define "immediate crediting" requirements | Product/Ops | Spec: available balance update timing, customer visibility SLA |
| Design dual-ledger approach (real-time shadow vs end-of-day core) | Architecture | Diagram: data flow, reconciliation logic, failure scenarios |
| Identify core banking API gaps for real-time posting | Core Banking team | List of required APIs or workarounds; effort to build |
| Model end-of-day reconciliation edge cases | Finance/Ops | Scenarios: reversals, failed core posts, duplicate detection |

**Key question:** Can your core banking system accept a real-time debit request asynchronously, or must you pre-debit in a shadow ledger and reconcile nightly? This shapes your architecture.

---

## 3. **MEDIUM: Fraud & AML Constraints (Weeks 3–6)**

### Fraud System
- Current: batch job only
- Gap: real-time API doesn't exist or hasn't been proven

**Discovery:**

- [ ] Can you **bypass fraud screening** on inbound for participants you whitelist/pre-screen? (Check scheme rules—some RTP schemes allow tiered screening)
- [ ] Is a **lightweight real-time fraud rule engine** faster than adapting the batch system? (Faster than 2–4s for basic rules: amount threshold, velocity, blocklist match?)
- [ ] **Cost/benefit**: Is building a slim real-time fraud tier worth it, or should you absorb fraud risk up to a threshold and settle with scheme?

### AML System
- **P99 = 8 seconds is already marginal** against the 10-second window
- At 40k tx/hr peak, will this degrade further?

**Discovery:**

- [ ] **Load test immediately** (this is a show-stopper if P99 goes >10s)
- [ ] Can you **apply AML only to transactions >$1,000** in a **non-blocking path**? (Accept the payment, credit the account, run AML in background, flag for review if needed)
- [ ] Does Payments NZ scheme allow **post-settlement AML review** for lower-risk payments?

---

## 4. **COMPLIANCE & RISK: Scheme Agreement (Weeks 1–2)**

Before you architect, clarify:

| Question | Impact |
|----------|--------|
| What are the **minimum fraud/AML controls** required by scheme? Can you tier them? | Determines if you can accept trade-offs |
| What happens if you **reject a payment within the 10s window**? What's the rejection criteria? | Affects latency budget allocation |
| Can you **request a phased launch** or **pilot with a subset of corridors** first? | May buy you time vs Sept 2026 hard deadline |
| Are there **tier-1 bank participants** you can learn from on real-time fraud/AML approach? | Benchmark their solutions |

---

## 5. **TIMELINE & PENALTY MATH**

**2026-09-01 is ~18 months away**

- **Months 1–3 (by Q1 2025):** Latency & load testing complete; architecture decision locked
- **Months 4–9 (by Q2 2025):** Build thin real-time layer, integrate with Payments NZ infrastructure
- **Months 10–15 (by Q3 2025):** Testing, fraud/AML fine-tuning, go-live readiness
- **Months 16–18 (by Sept 2025):** Buffer for issues, scheme certification

**$50k/day penalty = $18.25M/year.** Missing go-live by 6 months costs ~$9M. **Speed of clarity is worth more than speed of coding right now.**

---

## Recommended Next Steps (This Week)

1. **Latency workshop** (2 hours): Map current processing + fraud/AML contribution; run scenarios (serial, parallel, tiered)
2. **Load test AML API** (start immediately; critical path)
3. **Scheme compliance review** (1 day): What can you defer or risk-tier?
4. **Architecture spike** (3 days): Prototype real-time shadow ledger + end-of-day reconciliation

---

## Key Decision Point

**Do you need to run fraud + AML in-line on every payment, or can you:**
- Fast-path low-risk payments (<$1k, known senders)?
- AML in background for higher amounts?
- Accept and reconcile post-settlement?

This could cut 6+ seconds from your processing time and change the entire feasibility picture.

What's your current stance on post-settlement controls vs. pre-settlement?