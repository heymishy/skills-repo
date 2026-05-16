# S3 — Domestic Payment Flow — NZ Real-Time Payments (RTP) Integration

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Tests CPF for a regulated payments infrastructure integration with a mandatory scheme participation deadline and a hidden compliance checklist gap.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — Payments NZ is launching the new real-time payments infrastructure (the RTP scheme) and the enterprise is required to participate as a scheme member. Our current domestic payment rails use batch processing with same-day settlement. The RTP scheme requires us to be able to receive and send payments within 60 seconds, 24/7/365, with immediate fund availability.

We need to build the receiving side first — accepting inbound RTP payments to the enterprise customer accounts. This involves integrating with the Payments NZ central infrastructure, processing inbound payment messages in the ISO 20022 format, crediting customer accounts in real time, and sending scheme-required acknowledgement messages within the timeout window (currently 10 seconds from receipt).

Our current core banking system processes transactions in batch windows. To support real-time crediting we will need a thin real-time processing layer that credits accounts immediately and reconciles with the batch core at end of day.

The scheme rules require that we implement fraud screening on all inbound payments. Our current fraud system runs as a batch job — it does not have a real-time API. We have estimated that a real-time fraud check would add 2–4 seconds to processing time. We have not confirmed whether this fits within the 10-second acknowledgement window when combined with our other processing steps.

AML screening is also required on inbound payments above $1,000. Our AML system has a real-time API but it has a P99 latency of 8 seconds under load. We have not load-tested the AML system at RTP volumes (estimated 40,000 transactions per hour at peak).

Our scheme participation agreement requires us to be live by 2026-09-01. Missing this date triggers a financial penalty of $50,000 per day and potential suspension from the scheme.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **Fraud system real-time capability:** The fraud vendor has a real-time API in beta. We have a relationship with them and could accelerate access. It has not been tested at our volumes. Alternatively we could implement a simplified rule-based pre-screen and run the full model asynchronously — this is an architectural decision not yet made.
>
> **AML latency under load:** The 8-second P99 is from last year's load test at 10,000 transactions/hour. RTP peak is estimated at 40,000/hour. The AML vendor has not provided performance guarantees at this volume. Scaling options exist but have not been costed.
>
> **Core banking real-time crediting:** The thin real-time layer would use an in-memory ledger for immediate crediting, with end-of-day reconciliation to core. This pattern has not been used at the enterprise before — it introduces a reconciliation failure risk that our operations team has not assessed.
>
> **Scheme participation agreement:** the enterprise Legal has signed the agreement. The technical compliance checklist from Payments NZ has 47 items — we have self-assessed against 31 of them. The remaining 16 have not been reviewed.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | Scheme participation agreement — live by 2026-09-01 or $50k/day penalty + suspension | Regulatory (scheme obligation) | No — explicit |
| C2 | AML screening required on inbound payments above $1,000 — AML/CFT Act obligation | Regulatory (external law) | No — explicit |
| C3 | 10-second acknowledgement window — scheme rule hard constraint on processing architecture | Technical/scheme rule | No — explicit |
| C4 | Fraud screening required by scheme rules — real-time capability unconfirmed at required volume | Technical constraint | No — explicit |
| C5 | [Hidden] 16 of 47 Payments NZ technical compliance checklist items unreviewed — scheme certification risk; go-live approval may require all 47 items to be resolved | Hidden regulatory gap | **Yes — hidden** |

**Regulated constraints:** C1 (scheme obligation), C2 (AML/CFT Act)
**Regulated CPF threshold:** 0.80 (failure threshold for C1 and C2)

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — forced participation in a new national payment scheme with a hard compliance deadline and a real-time processing architecture challenge; not "build a payment feature".
2. **Personas** — the enterprise customers receiving payments (24/7 immediate availability expectation), Payments NZ scheme operations (monitor compliance and certification), the enterprise payment operations (own the real-time layer and reconciliation), AML compliance team (own screening obligation at scale).
3. **MVP scope** — receiving-side only (not sending); ISO 20022 inbound message processing, real-time account crediting, scheme acknowledgement within 10-second window, AML screening above $1,000, fraud pre-screening within processing budget.
4. **Constraints** — C1 through C4 all named. C5 surfaced as a blocker: "16 of 47 Payments NZ compliance checklist items unreviewed — scheme certification status must be confirmed before go-live date is committed to."
5. **Assumptions** — at minimum: AML system can be scaled to 40,000 tph within 10-second window (unconfirmed — spike required), fraud pre-screen can fit within processing budget (unconfirmed), 16 outstanding checklist items contain no blocking items (unconfirmed).

---

## CPF measurement notes for evaluator

- C3 is the architectural forcing constraint — the 10-second window shapes every technical decision. Count as propagated only if the model carries C3 into story-level NFRs (e.g., "end-to-end processing time from receipt to acknowledgement must not exceed 10 seconds at P99").
- C2 has a depth element — AML screening at RTP peak volumes (40,000 tph) vs the system's tested capacity (10,000 tph) is an unresolved architectural risk. Count as above-average if the model flags the load gap as a spike item.
- C5 — count as propagated only if the model explicitly names the outstanding checklist items as a go-live certification risk and flags that scheme certification sign-off is a precondition for the 2026-09-01 commitment.

---

## Context injection spec

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | Real-time payments processing standards, AML/CFT integration patterns, ISO 20022 message format requirements | ~7 KB |
| Synthetic EA registry entry | Payments NZ RTP Central Infrastructure (external system — scheme membership), the enterprise AML Screening Service (existing — latency data), the enterprise Fraud Detection Platform (existing — batch; real-time capability in vendor beta) | ~5 KB |
| **Estimated total** | | **~14 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |
