# Discovery: RTP Scheme — Inbound (Receiving) Payments Capability

**Status:** Draft for review
**Phase:** Discovery
**Hard deadline:** 2026-09-01 (scheme go-live; $50k/day penalty + suspension risk)

---

## 1. Problem Statement

Payments NZ is mandating participation in the new real-time payments (RTP) scheme. The enterprise must accept inbound RTP payments 24/7/365, credit customer accounts in real time, and acknowledge each payment within **10 seconds of receipt** — against a current estate built entirely around **batch processing with same-day settlement**.

This initiative builds the **receive side only**. Send side is explicitly deferred.

---

## 2. Goals & Success Criteria

| # | Success criterion | Measurable target |
|---|---|---|
| G1 | Scheme certification & go-live | Live by 2026-09-01 |
| G2 | Acknowledgement SLA | ACK/NACK sent ≤ 10s from message receipt (per current scheme rules — confirm if P99, P100, or absolute) |
| G3 | Fund availability | Funds available to beneficiary immediately on accept |
| G4 | Availability | 24/7/365 — no batch windows, no maintenance blackouts on receive path |
| G5 | Compliance | Fraud screening on 100% of inbound; AML screening on inbound > $1,000 |
| G6 | Integrity | Real-time ledger reconciles to batch core at EOD with zero unexplained breaks |
| G7 | Throughput | Sustained 40,000 tx/hour peak (≈11 tx/sec average; **peak burst rate unknown — see OQ-3**) |

---

## 3. Scope

**In scope**
- Integration with Payments NZ central infrastructure (inbound connectivity)
- ISO 20022 inbound message processing (pacs.008 and related — exact message set TBC)
- Scheme acknowledgement messaging within timeout window
- Real-time fraud screening on all inbound payments
- Real-time AML screening on inbound > $1,000
- Thin real-time crediting layer ("shadow ledger" pattern) over the batch core
- EOD reconciliation between real-time layer and core
- Returns/rejects handling for failed validation (assumed in scope — confirm, OQ-7)

**Out of scope**
- Outbound (send) RTP payments
- Core banking replacement or re-platforming
- Customer-facing channel changes (assumed — confirm whether real-time notifications are a scheme or business requirement, OQ-8)

---

## 4. Critical Finding: The Latency Budget Does Not Currently Close

This is the headline discovery risk and must be resolved before solution design.

**Worst-case stated component latencies:**

| Step | Latency | Source |
|---|---|---|
| Fraud check (real-time wrapper, estimated) | 2–4s | Unvalidated estimate |
| AML check (existing API) | 8s P99 | Measured, but **not at RTP volumes** |
| Message parsing, validation, account lookup, crediting, ACK construction, network | Unknown | Unmeasured |
| **Total known worst case** | **10–12s+** | **Exceeds 10s window before counting everything else** |

**Implications:**
- Fraud + AML alone can consume or exceed the entire window. There is **zero budget** for the rest of the pipeline at P99.
- AML at 8s P99 is **untested at 40k tx/hr** — latency under load is likely worse, not better.
- Possible mitigations to evaluate in design (not decisions yet):
  - Run fraud and AML checks **in parallel** rather than sequentially
  - Negotiate/confirm whether scheme permits **"accept then screen"** with post-credit recall, or pending/hold states
  - Re-architect fraud scoring as an in-path low-latency service vs. wrapping the batch engine
  - AML pre-screening / caching of party screening results
- **Discovery cannot declare this feasible.** A latency spike is mandatory (see §8).

---

## 5. Key Risks

| ID | Risk | Likelihood | Impact | Notes |
|---|---|---|---|---|
| R1 | Latency budget cannot be met with fraud + AML in-line | **High** | **Critical** | See §4. Existential to the design. |
| R2 | AML system degrades or fails under RTP load (untested at 40k/hr) | High | Critical | No load test data exists. |
| R3 | Fraud system has **no real-time API** — net-new build or vendor uplift needed | High | High | The 2–4s figure is an estimate for a capability that doesn't exist yet. Vendor roadmap/build effort unknown. |
| R4 | Batch core ↔ real-time layer reconciliation breaks (duplicates, missed credits, timing gaps around EOD cutover) | Medium | High | Classic failure mode of shadow-ledger patterns. Needs explicit design for in-flight transactions during batch windows. |
| R5 | 24/7/365 availability vs. core batch maintenance windows | High | High | Real-time layer must accept payments while the core is down/in batch. Defines the buffering & funds-availability model. |
| R6 | Missed deadline → $50k/day + scheme suspension | — | Critical | Drives need for early certification milestones and de-risking spikes now. |
| R7 | Scheme rules may change before go-live (timeout window is "currently" 10s) | Medium | Medium | Track Payments NZ rulebook versions; design with configurable timeouts. |
| R8 | ISO 20022 skills/tooling gap in current teams | Medium | Medium | Batch-rails teams may lack ISO 20022 and event-driven experience. |
| R9 | Liquidity/settlement model with scheme unclear (prefunding? settlement account monitoring 24/7?) | Medium | High | Not mentioned in brief — almost certainly a scheme requirement. |

---

## 6. Open Questions

| ID | Question | Owner (suggested) | Blocks |
|---|---|---|---|
| OQ-1 | Is the 10s ACK window absolute per transaction, or a percentile SLA? What happens on timeout — auto-reject, retry, penalty? | Scheme liaison | Architecture, R1 |
| OQ-2 | Does the scheme permit accept-then-screen (post-credit fraud/AML with recall), or hold/pending states for screening? | Compliance + scheme liaison | R1, R2 |
| OQ-3 | What is the **peak burst rate** (tx/sec), not just hourly average? 40k/hr ≈ 11 tps average, but bursts could be 5–10×. | Payments NZ / analytics | Capacity design, load test targets |
| OQ-4 | Can the fraud vendor deliver a real-time API? Timeline, cost, actual latency SLA? Or is this an in-house build? | Fraud platform owner | R3, plan feasibility |
| OQ-5 | What is the actual AML system latency at 40k/hr+ load? Can the vendor commit to a P99 target? | AML platform owner | R2 |
| OQ-6 | How does the real-time layer behave while the core is in its batch window — what is the funds-availability and exposure model for credits posted then? | Core banking + finance | R4, R5 |
| OQ-7 | What return/recall/exception message flows does the scheme mandate (e.g., pacs.004, camt.056)? | Scheme liaison | Scope completeness |
| OQ-8 | Are real-time customer notifications required (scheme or business)? | Product | Scope |
| OQ-9 | What is the settlement/liquidity model — prefunded account, net settlement, real-time liquidity monitoring obligations? | Treasury | R9 |
| OQ-10 | What are the scheme certification milestones and test environment availability dates? How long is certification? | Scheme liaison | Backward-planned timeline, R6 |
| OQ-11 | What is the required availability target (e.g., 99.95%?) and are there scheme penalties for receive-side downtime? | Scheme liaison | NFRs, infra design |
| OQ-12 | Duplicate/idempotency rules — how does the scheme handle retransmissions, and what dedup obligations sit with us? | Scheme liaison | Real-time layer design |

---

## 7. Assumptions (to validate)

| ID | Assumption |
|---|---|
| A1 | Receive-only go-live satisfies the 2026-09-01 obligation (i.e., send side is not also mandated for the same date) — **must confirm; if send is also mandated, scope and risk change materially** |
| A2 | The thin real-time layer is the chosen pattern (vs. core vendor real-time module) — should be validated against core vendor roadmap |
| A3 | The $1,000 AML threshold and 100% fraud screening reflect current scheme rules and won't tighten before go-live |
| A4 | Payments NZ provides a non-production test/certification environment with sufficient lead time |

---

## 8. Recommended Next Steps (de-risking spikes before solution design)

1. **Spike: end-to-end latency budget (highest priority).** Measure or bound every pipeline step; prototype parallel fraud+AML invocation; produce a P99 budget table proving (or disproving) the 10s window closes. *This determines whether the current approach is viable at all.*
2. **Spike: AML load test** at projected peak + burst headroom (pending OQ-3) against a non-prod AML environment.
3. **Engage fraud vendor / fraud platform team** for a committed real-time option with latency SLA, cost, and delivery date.
4. **Scheme rulebook deep-dive** to resolve OQ-1, OQ-2, OQ-7, OQ-9, OQ-10, OQ-11, OQ-12.
5. **Reconciliation & batch-window design workshop** with core banking SMEs (R4, R5).
6. **Backward-plan from 2026-09-01**: certification window, scheme integration testing, vendor lead times. Given penalty exposure, establish go/no-go checkpoints with explicit feasibility gates — the first gate being the latency spike outcome.

---

## 9. Stakeholders & Dependencies

- **External:** Payments NZ (scheme rules, connectivity, certification), fraud vendor, AML vendor, core banking vendor
- **Internal:** Payments/scheme liaison, Compliance (fraud & AML), Core banking team, Treasury (settlement/liquidity), Risk, Operations (24/7 support model — new for a batch shop), Infrastructure/SRE

---

### Discovery verdict

**Proceed to solution design is NOT yet recommended.