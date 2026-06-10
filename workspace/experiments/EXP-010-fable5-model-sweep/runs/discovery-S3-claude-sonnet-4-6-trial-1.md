# Discovery Report: Real-Time Payments — Inbound Receiving Capability

## Executive Summary

This discovery covers the build of inbound Real-Time Payment (RTP) receiving capability required for Payments NZ scheme participation by **2026-09-01**. The enterprise faces a hard regulatory deadline with material financial penalties for non-compliance.

The discovery has identified **four critical risks** that must be resolved before architecture and delivery commitments can be made with confidence. These are not implementation details — they are unknowns that could individually cause the programme to fail or breach scheme rules. Spikes are recommended on all four before detailed planning proceeds.

---

## Scope

### In Scope
- Integration with Payments NZ central infrastructure
- Inbound ISO 20022 payment message processing
- Real-time customer account crediting
- Scheme acknowledgement messages within the 10-second timeout window
- Fraud screening on all inbound payments
- AML screening on inbound payments above $1,000
- Reconciliation between the real-time processing layer and the batch core banking system

### Out of Scope (This Phase)
- Outbound RTP payments (sending side)
- Scheme onboarding, legal agreements, and certification processes *(assumed to be managed separately — confirm ownership)*
- Customer-facing features or notifications
- Changes to the batch core banking system beyond end-of-day reconciliation

---

## Current State

| Capability | Current State | Gap |
|---|---|---|
| Payment processing | Batch windows, same-day settlement | Cannot meet 60-second receipt-to-credit requirement |
| Core banking | Batch-only transaction posting | No real-time posting capability |
| Fraud screening | Batch job, no real-time API | No real-time fraud check exists |
| AML screening | Real-time API exists | P99 latency 8s; untested at RTP volumes |
| ISO 20022 messaging | Unknown — not confirmed in discovery | Needs confirmation |
| 24/7 operational capability | Unknown — not confirmed in discovery | Needs confirmation |

---

## Target State

An inbound RTP payment arriving at the scheme gateway must be:

1. Received and parsed from ISO 20022 format
2. Fraud-screened
3. AML-screened where value exceeds $1,000
4. Posted to the customer account in real time
5. Acknowledged to the scheme within **10 seconds** of receipt
6. Reconciled with the batch core at end of day

This must operate continuously, 24/7/365, at peak volumes of approximately 40,000 transactions per hour.

---

## Critical Risks

These four items represent the highest-priority uncertainties in the programme. Each one, unresolved, is sufficient to cause delivery failure or scheme non-compliance. They are not ranked — all four require action.

---

### Risk 1 — The 10-second acknowledgement window may not be achievable with current fraud and AML systems

**The problem**

The scheme requires an acknowledgement within 10 seconds of payment receipt. The current processing chain includes:

- Message receipt and parsing
- Fraud screening: estimated **+2–4 seconds** (real-time API does not yet exist)
- AML screening: P99 latency **8 seconds** under load
- Account posting
- Acknowledgement message construction and transmission

These steps have not been sequenced and timed together. At P99, AML alone consumes 8 of the available 10 seconds, leaving 2 seconds for every other step. This has not been validated.

**Why this matters**

Breaching the acknowledgement timeout is a scheme rules violation. Persistent violations risk suspension from the scheme. This is not a performance target — it is a compliance boundary.

**What we do not know**
- Whether fraud and AML screening can be run in parallel or must be sequential
- Whether the scheme permits a "acknowledge first, screen second" pattern with a downstream reversal or hold mechanism
- What the scheme's tolerance is for timeout breaches during an initial go-live period
- What the actual end-to-end latency budget looks like when all steps are sequenced

**Recommended action — Spike 1**

Map the full processing sequence and assign a latency budget to each step. Confirm with Payments NZ whether acknowledgement can precede screening completion, or whether a hold/pending state is permitted. This directly determines the architecture of the real-time processing layer and whether either screening system needs to be replaced or re-engineered before go-live.

*Spike owner: solution architect + scheme relationship manager*
*Target duration: 2 weeks*

---

### Risk 2 — The fraud system has no real-time API

**The problem**

The scheme rules require fraud screening on all inbound payments. The current fraud system runs as a batch job. A real-time API does not exist. The 2–4 second estimate for real-time fraud screening is an estimate only — it is not based on a built or tested capability.

**Why this matters**

There are two failure modes here. First, if a real-time fraud capability cannot be built or procured in time, the enterprise may not be able to comply with scheme rules at go-live. Second, if it is built but its latency is underestimated, the 10-second window risk in Risk 1 becomes worse.

**What we do not know**
- Whether the existing fraud system vendor supports a real-time API mode, and if so, at what cost and timeline
- Whether a third-party real-time fraud screening service could be used as an interim solution
- What the actual latency of a real-time fraud check would be under RTP volumes
- Whether the scheme defines specific fraud screening standards or approves specific vendors

**Recommended action — Spike 2**

Engage the fraud system vendor immediately to understand real-time API feasibility and timeline. In parallel, identify at least one alternative (third-party vendor or rules-based interim). The outcome of this spike gates architecture decisions on the real-time processing layer. If a real-time fraud capability cannot be confirmed within four weeks, this becomes a delivery schedule issue requiring escalation.

*Spike owner: fraud platform team + vendor relationship manager*
*Target duration: 3 weeks*

---

### Risk 3 — The AML system has not been load-tested at RTP volumes

**The problem**

The AML system has a real-time API, but its P99 latency is 8 seconds under current load conditions. RTP peak volumes are estimated at 40,000 transactions per hour. AML screening applies to all payments above $1,000. The proportion of payments that will exceed $1,000 is not known, but even a fraction of 40,000 per hour represents a materially higher throughput than the AML system is currently handling.

The AML system has not been load-tested at these volumes. The P99 of 8 seconds may degrade further under RTP load, which would make the 10-second window unachievable at scale — even before fraud screening time is added.

**Why this matters**

An AML system that cannot perform under production load does not become visible until production load arrives — which, given the 24/7 nature of RTP, could mean a compliance failure at 2am on a public holiday. Unlike batch processing, there is no catch-up window.

**What we do not know**
- Current transaction volumes through the AML system and the headroom available
- Whether the AML system scales horizontally and whether additional capacity can be provisioned
- What the AML system's latency looks like at 2x, 5x, and 10x current volume
- Whether the AML vendor has an SLA that covers RTP-grade performance
- What proportion of inbound RTP payments are expected to exceed $1,000

**Recommended action — Spike 3**

Commission a load test of the AML system at projected RTP volumes before any architecture decisions are finalised. Define pass/fail criteria in terms of P99 latency (suggested threshold: ≤4 seconds at peak load, to leave budget for other processing steps). If the system fails, options include horizontal scaling, AML vendor upgrade, or re-evaluation of the AML system. The result of this test is a hard input to the latency budget analysis in Spike 1.

*Spike owner: AML platform team + infrastructure*
*Target duration: 3 weeks (can run in parallel with Spike 2)*

---

### Risk 4 — The real-time processing layer and batch core reconciliation design is undefined

**The problem**

The current core banking system processes transactions in batch windows. To credit accounts in real time, a thin real-time processing layer is proposed — but it has not been designed. The reconciliation process between this layer and the batch core is also undefined.

This creates several unresolved questions with material delivery implications:

- Where does the authoritative account balance live during the period between real-time credit and batch reconciliation?
- What happens if a real-time credit is posted but the batch reconciliation fails?
- What is the rollback or remediation path if a fraudulent or AML-flagged payment is credited in real time and later identified as requiring reversal?
- Does the batch core need modification to accept real-time-originated transactions, and if so, is that within scope and within the delivery timeline?

**Why this matters**

If this architecture is not resolved early, the downstream delivery work — account crediting, reconciliation, and operational procedures — cannot be sized or planned. Discovering a constraint in the core banking system late in delivery is one of the most common causes of RTP programme delays in comparable implementations.

**What we do not know**
- Whether the core banking system vendor supports a real-time posting mode or an intraday feed mechanism
- Whether the core banking system needs to be involved in the 10-second acknowledgement path, or only in end-of-day reconciliation
- What the failure and reversal model looks like if screening identifies a problem after a payment has been credited
- Whether the enterprise's accounting and regulatory reporting requirements impose constraints on when a transaction is considered "posted"

**Recommended action — Spike 4**

Engage the core banking system vendor and internal finance/accounting stakeholders to define the real-time posting architecture and the end-of-day reconciliation pattern. Produce a data flow diagram covering: payment receipt → real-time credit → intraday balance → batch reconciliation → final posting. Identify any core banking changes required and assess whether they fit within the delivery timeline.

*Spike owner: core banking platform team + finance operations*
*Target duration: 3 weeks (can begin in parallel with Spikes 2 and 3)*

---

## Additional Unknowns — Requiring Confirmation, Not Spikes

The following items are not at the same severity level as the four critical risks, but they are unconfirmed and must be resolved before detailed delivery planning can proceed.

| Item | Question | Owner |
|---|---|---|
| ISO 20022 capability | Does any existing system in the estate parse or generate ISO 20022 messages? Or is this a net-new capability to be built or procured? | Architecture |
| Scheme certification | What is the Payments NZ certification and testing process, and how long does it take? This needs to be inside the delivery timeline. | Scheme relationship manager |
| 24/7 operational model | Do current operational, support, and on-call arrangements support 24/7/365 incident response? RTP failures at 3am cannot wait for business hours. | Operations / Platform engineering |
| Penalties and holds | What is the scheme's defined mechanism when a payment cannot be processed within the window — is there a reject path, a hold state, or a mandatory credit regardless? | Scheme relationship manager |
| Volume estimate basis | The 40,000 transactions per hour peak estimate — what is it based on, and how confident is the business in it? Undersizing for AML and fraud load testing would invalidate Spikes 2 and 3. | Business / Finance |
| Data residency and privacy | Are there obligations around where ISO 20022 message data can be stored or processed? Relevant if cloud or third-party components are being considered. | Legal / Compliance |

---

## Delivery Timeline Assessment

The deadline is **2026-09-01**. Depending on the current date, this represents a fixed and non-negotiable constraint.

**The four spikes are on the critical path.** Architecture and delivery planning cannot be finalised until the latency budget, fraud capability, AML capacity, and real-time/batch architecture are resolved. These spikes should begin immediately and run in parallel where possible.

A realistic delivery sequence looks like:

```
Now          +3 weeks         +6 weeks         +N weeks          2026-09-01
|                |                |                |                |
[Spike 1: Latency budget + scheme rules confirmation]
[Spike 2: Fraud real-time capability]
[Spike 3: AML load test              ]
[Spike 4: Real-time/batch architecture        ]
                 |                |
          [Architecture          |
           decision gate]        |
                          [Delivery planning
                           and team formation]
                                           [Build → Test → Cert → Go-live]
```

**If the spikes are not started within the next two weeks, the schedule risk to the 2026-09-01 deadline increases materially.** The penalty of $50,000 per day for non-compliance makes the cost of delay concrete.

---

## Recommended Next Actions

| # | Action | Owner | When |
|---|---|---|---|
| 1 | Start Spike 1: Map processing sequence, assign latency budget, confirm scheme acknowledgement rules | Solution architect + scheme manager | This week |
| 2 | Start Spike 2: Engage fraud vendor on real-time API feasibility | Fraud platform team | This week |
| 3 | Start Spike 3: Commission AML load test at RTP volumes | AML platform team | This week |
| 4 | Start Spike 4: Engage core banking vendor on real-time layer architecture | Core banking team + finance ops | This week |
| 5 | Confirm ISO 20022 capability in current estate | Architecture | Within 1 week |
| 6 | Confirm scheme certification timeline with Payments NZ | Scheme relationship manager | Within 1 week |
| 7 | Confirm 24/7 operational coverage model | Operations | Within 2 weeks |
| 8 | Validate 40,000 tph volume estimate | Business | Within 1 week |
| 9 | Schedule architecture decision gate at end of spike period | Programme lead | This week |

---

## What This Discovery Has Not Resolved

This report documents what is known, what is unknown, and what the risks are. It does not contain a delivery plan, a team structure, a technology selection, or a cost estimate. Those outputs depend on the resolution of the critical risks above.

A delivery plan produced before the spikes complete would be built on assumptions that may be wrong. The spikes are the responsible path to a plan that can be committed to.

---

*Discovery conducted against the information provided. Assumptions, gaps, and risks reflect the state of knowledge at the time of this report. This document should be reviewed and updated as spike outcomes become available.*