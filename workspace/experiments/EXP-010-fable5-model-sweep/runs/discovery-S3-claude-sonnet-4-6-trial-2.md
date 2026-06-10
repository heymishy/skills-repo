# Discovery Report: RTP Inbound Payments

## Payments NZ Real-Time Payments — Receiving Side Implementation

---

## 1. Executive Summary

The enterprise must participate in the Payments NZ RTP scheme by **2026-09-01** or face $50,000/day penalties and potential scheme suspension. This discovery covers the inbound receiving capability only: accepting ISO 20022 payment messages, crediting customer accounts in real time, and returning scheme acknowledgements within a 10-second window.

The scope is well-bounded and the business case is non-negotiable. However, discovery has identified **three critical blockers** that must be resolved before architecture can be finalised and delivery can be scoped with confidence:

1. The fraud system has no real-time API and its integration path is undefined
2. The AML system has P99 latency of 8 seconds under load — potentially consuming the entire acknowledgement window on its own
3. Neither system has been load-tested at RTP volumes (estimated 40,000 tph peak)

These are not risks to be monitored. They are unknowns that will determine whether the proposed processing architecture is viable. They must be resolved in the next sprint.

---

## 2. Scope

### In Scope
- Connectivity to Payments NZ central infrastructure
- Inbound ISO 20022 payment message receipt and parsing
- Real-time account crediting for enterprise customers
- Scheme-required acknowledgement messages within 10-second SLA
- Fraud screening on all inbound payments
- AML screening on inbound payments above $1,000
- Real-time processing layer with end-of-day reconciliation to batch core banking system
- Scheme membership compliance for the receiving side

### Out of Scope (This Phase)
- Outbound/sending RTP capability
- Retail or SME customer-facing features (notifications, disputes, etc.)
- Core banking system replacement or real-time uplift
- Outbound fraud or AML on customer-initiated payments
- Scheme rule changes arising after this discovery

### Assumptions
- Enterprise customer accounts are held in the existing core banking system
- Account lookup (resolve destination account from payment details) is possible in real time or near-real time from existing systems
- The enterprise has or will obtain the necessary Payments NZ scheme certification
- The 10-second acknowledgement window is measured from message receipt at our infrastructure boundary

---

## 3. Context and Constraints

### Scheme Requirements Summary

| Requirement | Detail |
|---|---|
| Go-live deadline | 2026-09-01 |
| Payment processing SLA | 60 seconds end-to-end |
| Acknowledgement SLA | 10 seconds from receipt |
| Operating hours | 24/7/365 |
| Fund availability | Immediate upon credit |
| Message format | ISO 20022 |
| Fraud screening | All inbound payments |
| AML screening | Inbound payments ≥ $1,000 |
| Penalty for missing deadline | $50,000/day + potential suspension |

### Current State Constraints

| System | Current Capability | Gap |
|---|---|---|
| Core banking | Batch processing, same-day settlement | Cannot credit in real time |
| Fraud system | Batch job only | No real-time API |
| AML system | Real-time API exists | P99 latency 8s under load; not load-tested at RTP volumes |
| Scheme connectivity | None | New integration required |

---

## 4. Critical Blockers

These items are flagged as blockers rather than risks because the architectural approach cannot be finalised until they are resolved. Work on dependent components should not proceed to detailed design until each blocker has a confirmed resolution path.

---

### BLOCKER 1 — Fraud System: No Real-Time API

**What we know:**
The fraud system runs as a batch job. There is no real-time API. The scheme requires fraud screening on all inbound payments. We have estimated a real-time fraud check would add 2–4 seconds to processing time, but this estimate is unvalidated and assumes a real-time capability that does not yet exist.

**What we do not know:**
- Whether the existing fraud system can be exposed as a real-time API, and at what cost and timeline
- Whether it can sustain 40,000 tph
- Whether it can return a synchronous response within a time budget compatible with the 10-second window
- Whether a third-party real-time fraud solution would be faster to integrate and operate
- Whether a rules-based interim fraud control (e.g. velocity limits, account-level blocks) could satisfy scheme obligations while a full solution is built

**Why this is a blocker:**
If the fraud system cannot be made real-time, or cannot be made real-time within the delivery timeline, the entire processing architecture changes. A rules-based interim approach may satisfy the scheme but requires legal and compliance sign-off. We cannot design the processing pipeline until the fraud integration path is confirmed.

**Required actions:**
- [ ] Engage fraud system vendor/team this sprint: can a synchronous API be exposed, and what is the effort estimate?
- [ ] Obtain the scheme rules text on fraud screening — does it specify technical implementation or just outcomes?
- [ ] Engage Compliance to assess whether a rules-based interim control satisfies scheme obligations
- [ ] If vendor API is not viable within timeline, initiate market scan for real-time fraud-as-a-service options

**Owner:** [Architecture Lead + Compliance]
**Resolution required by:** End of Sprint 1

---

### BLOCKER 2 — AML System: Latency Risk Inside Acknowledgement Window

**What we know:**
The AML system has a real-time API. Under load, P99 latency is 8 seconds. The scheme acknowledgement window is 10 seconds. AML screening applies to payments ≥ $1,000. We have not load-tested the AML system at 40,000 tph.

**What we do not know:**
- What P99 latency looks like at 40,000 tph (current load-test baseline is unknown)
- Whether the AML system can be scaled horizontally to reduce latency under load
- How much of the 10-second window remains after accounting for: network transit to Payments NZ infrastructure, message parsing, account lookup, fraud check, AML check, ledger credit, and acknowledgement construction
- Whether the scheme permits a "provisional credit with post-processing AML" model (credit now, hold/reverse if AML match found within a defined window)
- What the AML hold/reversal rules are for real-time payments and whether reversal of an already-credited payment is permissible under scheme rules

**Why this is a blocker:**
8 seconds at P99 for AML alone is almost certainly incompatible with a 10-second acknowledgement window when other processing steps are included. The processing time budget for all steps combined is likely 7–8 seconds maximum to allow for network round-trips. If AML cannot be made faster under load, or if a provisional credit model is not permissible, the architecture cannot be finalised.

**Indicative time budget (illustrative — not validated):**

| Step | Estimated Time |
|---|---|
| Network receipt + parsing | ~0.5s |
| Account lookup | ~0.5s |
| Fraud check (estimated) | 2–4s |
| AML check (P99 under load) | up to 8s |
| Ledger credit + ack construction | ~0.5s |
| Network transmission of ack | ~0.5s |
| **Indicative total (worst case)** | **~14s** |

This is not a final budget. It is an illustration that the worst-case path likely breaches the 10-second window and that load-testing and time-budget analysis are urgent.

**Required actions:**
- [ ] Run AML system load test at simulated 40,000 tph immediately — this is the highest priority technical action in discovery
- [ ] Obtain AML system scaling documentation — can additional instances reduce P99?
- [ ] Engage Payments NZ / scheme rules review: is provisional credit with post-processing AML permitted?
- [ ] Engage Legal and Compliance: what are the obligations if a provisionally credited payment is subsequently flagged by AML?
- [ ] Construct a full end-to-end processing time budget once fraud integration path is known

**Owner:** [Architecture Lead + AML System Team + Compliance]
**Resolution required by:** End of Sprint 1 (load test); End of Sprint 2 (architectural decision)

---

### BLOCKER 3 — End-to-End Processing Time Budget: Not Validated

**What we know:**
The individual components have estimated or measured latencies. We have not assembled these into a validated end-to-end budget against the 10-second window.

**What we do not know:**
- Total processing time under peak load across all steps
- Whether the architecture can meet the 10-second SLA at P99, not just on average
- Where the binding constraint is (fraud, AML, or something else)

**Why this is a blocker:**
An architecture that meets the SLA at average load but fails at P99 under peak load will cause scheme violations in production. The SLA must be met at P99. This budget cannot be completed until Blockers 1 and 2 are resolved, but the work of assembling it should begin immediately in parallel.

**Required actions:**
- [ ] Define all processing steps in the inbound payment pipeline
- [ ] Obtain or estimate latency for each step at P99 under peak load
- [ ] Assemble into a processing time budget with explicit P99 target
- [ ] Identify which steps can be parallelised (e.g. can fraud and AML checks run concurrently?)
- [ ] Model the impact of concurrency on overall window

**Owner:** [Architecture Lead]
**Resolution required by:** End of Sprint 2

---

## 5. Architecture Options (Pending Blocker Resolution)

The following options are identified at a pattern level. They cannot be fully evaluated until the blockers above are resolved. They are documented here to frame the decisions that need to be made.

### Option A — Synchronous All-Checks Pipeline

All checks (fraud, AML) run synchronously within the acknowledgement window before the account is credited.

- **Advantage:** Simplest compliance posture — no credit is issued before all checks pass
- **Disadvantage:** Likely infeasible given current AML P99 and absent fraud real-time API; any check that exceeds its time budget causes a scheme violation
- **Viable if:** Fraud API can be built with <2s P99 and AML P99 can be reduced to <4s at peak load, leaving headroom for other steps

### Option B — Provisional Credit with Asynchronous Post-Processing

Account is credited immediately (or after a fast pre-screen). Fraud and/or AML checks complete asynchronously. Hold or reversal applied if checks fail within a defined post-credit window.

- **Advantage:** Decouples acknowledgement SLA from check latency; feasible even with current AML performance
- **Disadvantage:** Complex compliance and legal position — reversal of real-time payments may be constrained by scheme rules; requires clear hold/reversal logic; customer experience impact if funds are held post-credit
- **Viable if:** Scheme rules permit provisional credit; Legal/Compliance approve the reversal model; AML and fraud outcomes can be acted on within a defined post-credit window

### Option C — Hybrid: Fast Pre-Screen + Async Deep Check

A lightweight, low-latency rules engine (velocity limits, blocklist, sanction pre-screen) runs synchronously. Full fraud and AML processing runs asynchronously post-credit.

- **Advantage:** Provides a meaningful real-time control layer without the latency of full checks; acknowledgement SLA is achievable
- **Disadvantage:** Residual risk window between credit and completion of full checks; requires investment in the pre-screen rules engine; deep check systems must still be capable of processing at RTP volumes even if not in the synchronous path
- **Viable if:** Compliance accepts the pre-screen as satisfying scheme fraud obligations; scheme rules permit post-credit AML within a defined window

**Recommendation on option selection:** Do not select an architecture option until Blockers 1 and 2 are resolved. Option B or Option C is the more likely viable path given current AML P99 and the absence of a fraud real-time API, but this must be confirmed with Compliance and validated against scheme rules before committing to a design.

---

## 6. High-Level Component Model

The following components are required regardless of which architecture option is selected. Their internal design will vary.

```
Payments NZ Central Infrastructure
            │
            ▼
  ┌─────────────────────┐
  │  Scheme Gateway     │  — Connectivity, TLS, certificate management,
  │                     │    message receipt, timeout management
  └─────────┬───────────┘
            │  ISO 20022 message
            ▼
  ┌─────────────────────┐
  │  Message Processor  │  — Parse, validate, enrich, route
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  Screening Layer    │  — Fraud check + AML check
  │  (design TBD)       │    (synchronous, async, or hybrid — TBD)
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │  Real-Time Ledger   │  — Immediate account credit,
  │                     │    balance update, hold management
  └─────────┬───────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
  Ack to       EOD Recon
  Scheme       to Core
  Gateway      Banking
```

**Key integration points requiring detailed design:**
- Payments NZ connectivity (certification, connectivity type, message format versions)
- Account lookup against core banking (read path must be real-time capable)
- Real-time ledger to core banking reconciliation (must handle intraday credits, failed reconciliations, and rollback scenarios)
- Fraud system integration (path TBD — see Blocker 1)
- AML system integration (confirmed API, latency mitigation TBD — see Blocker 2)
- Acknowledgement message construction and retry logic

---

## 7. Non-Functional Requirements

The following NFRs are derived from the scheme rules and operational context. They are indicative and must be confirmed with Payments NZ scheme documentation.

| Category | Requirement | Notes |
|---|---|---|
| Availability | 99.99%+ (implied by 24/7/365) | ~52 minutes downtime/year maximum |
| Acknowledgement latency | P99 ≤ 10s from message receipt | Hard scheme requirement |
| Payment processing | ≤ 60s end-to-end | Hard scheme requirement |
| Throughput | ≥ 40,000 tph peak | Must be load-tested |
| Recovery | Near-zero RPO, RTO < scheme timeout | Failover must not cause missed ack windows |
| Data residency | NZ data sovereignty requirements apply | Confirm with Legal |
| Audit | Full message audit trail retained | Confirm retention period with Compliance |
| Reconciliation | EOD reconciliation to core banking | Gaps and breaks must be detectable and alertable |

The 99.99% availability requirement has significant architectural implications — it implies active-active or fast-failover deployment, no single points of failure in the processing path, and a maintenance model that does not require downtime windows. This must be factored into infrastructure design.

---

## 8. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Fraud system cannot be made real-time within delivery timeline | High | High | Initiate vendor/team assessment immediately; identify interim rules-based alternative |
| R2 | AML P99 latency under RTP volumes breaches 10s window | High | High | Load test immediately; assess scaling options and provisional credit model |
| R3 | Scheme certification process takes longer than anticipated | Medium | High | Engage Payments NZ on certification timeline this sprint; understand test environment access |
| R4 | Core banking account lookup is not real-time capable | Medium | High | Assess read latency of account lookup immediately; may require caching layer |
| R5 | Real-time ledger to core reconciliation is more complex than estimated | Medium | Medium | Prototype reconciliation logic early; define break handling before go-live |
| R6 | 2026-09-01 deadline insufficient given blocker resolution timeline | Medium | High | Establish critical path once blockers resolved; escalate to programme leadership if timeline is at risk |
| R7 | Scheme rules change between now and go-live | Low | Medium | Maintain active engagement with Payments NZ; monitor scheme rule publications |

---

## 9. Dependencies

| Dependency | Owner | Status | Required By |
|---|---|---|---|
| Payments NZ scheme rules documentation (full text) | Payments NZ / Programme | Not confirmed | Sprint 1 |
| Payments NZ test environment access | Payments NZ | Not confirmed |