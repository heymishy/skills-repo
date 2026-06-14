# Discovery Artefact — Inbound RTP Payments (Payments NZ Scheme)

---

**Status:** Draft
**Feature slug:** `2025-07-15-inbound-rtp-payments-nz`
**Artefact path:** `artefacts/2025-07-15-inbound-rtp-payments-nz/discovery.md`
**Initiated:** 2025-07-15
**Skill:** `/discovery`

---

## Product context read

No `product/` directory detected. Constraints and personas will be derived entirely from the operator brief and injected regulatory context.

## EA registry

`architecture.ea_registry_authoritative` not set in `context.yml`. No blast-radius query attempted. Downstream skills should confirm blast-radius for the core banking system and AML/fraud systems before definition.

---

## Problem Statement

Payments NZ is launching a Real-Time Payments (RTP) scheme requiring registered scheme members to receive and send payments within 60 seconds, 24/7/365, with immediate fund availability. The enterprise is a mandatory scheme participant.

The current domestic payment infrastructure is batch-based with same-day settlement. It cannot satisfy the scheme's real-time processing requirements without material architectural change.

The immediate obligation is the **receiving side**: accepting inbound RTP payments to enterprise customer accounts, processing ISO 20022 payment messages, crediting customer accounts in real time, and returning scheme-required acknowledgement messages within a **10-second timeout window**.

Two specific processing constraints make this non-trivial:

1. **Fraud screening:** The current fraud system runs as a batch job with no real-time API. A real-time fraud check is estimated to add 2–4 seconds to processing time. It is unconfirmed whether this fits within the 10-second acknowledgement window alongside other processing steps.

2. **AML screening:** Required on inbound payments above NZD $1,000. The AML system has a real-time API but a **P99 latency of 8 seconds under load** — and has not been load-tested at RTP peak volumes (estimated 40,000 transactions per hour). An 8-second AML check alone leaves only 2 seconds for all other processing steps within the 10-second window.

The scheme participation agreement requires the enterprise to be **live by 2026-09-01**. Missing this date triggers a **$50,000/day financial penalty** and potential scheme suspension.

---

## Personas

### P1 — Enterprise Customer (Retail or Business Account Holder)
Expects to receive real-time payments into their account instantly — fund availability within seconds of the sender initiating the payment. Currently experiences same-day settlement. With RTP, they will expect the credited amount to be immediately available for spending, transfers, or further payments. Impact if unresolved: enterprise cannot receive RTP scheme payments on the customer's behalf; customers cannot participate in real-time payments ecosystem.

### P2 — Payments Operations Team
Responsible for scheme connectivity, message processing integrity, and end-of-day reconciliation between the real-time processing layer and the batch core banking system. Currently operates batch reconciliation windows. With RTP, must manage a continuous 24/7/365 processing obligation with reconciliation against a batch core. Impact if unresolved: manual reconciliation failures, unreconciled credit positions, scheme audit exposure.

### P3 — Financial Crime / Compliance Team
Owns AML/CFT screening obligations on inbound payments. Required to screen payments above NZD $1,000 in real time under AML/CFT Act 2009 obligations. Currently operates batch AML screening. With RTP, must approve or accept a real-time screening architecture that satisfies regulatory obligations within the 10-second window. Bears accountability if AML screening is bypassed, delayed, or incomplete. Impact if unresolved: regulatory breach, potential RBNZ enforcement action.

### P4 — Chief Risk Officer / Risk & Compliance Leadership
Bears board-level accountability for model risk (CPG 220 / RBNZ BS2B alignment) if a real-time fraud model is introduced or materially changed to support RTP. Must sign off on model validation before any real-time fraud screening model is activated in production. Impact if unresolved: hard go-live gate not satisfied; scheme participation deadline missed or production launch is a regulatory breach.

### P5 — RBNZ Relationship / Regulatory Affairs Team
Responsible for ensuring RBNZ BS11 notification is filed before any material step in the RTP infrastructure build. The RTP integration layer and real-time processing capability constitutes a material change to a core payment system under BS11. Impact if unresolved: notification clock not started; irreversible project activity may proceed without RBNZ notification — a regulatory breach independent of go-live date.

---

## Why Now

Scheme participation is not discretionary. Payments NZ has set a mandatory participation date of **2026-09-01** for scheme members. The enterprise is contractually obligated as a scheme member. Failure to meet the date triggers a **$50,000/day penalty** and potential suspension from the scheme — creating a hard external deadline that cannot be deferred, renegotiated away, or treated as a backlog priority.

The build timeline is non-trivial: RBNZ BS11 notification alone requires 30 business days from filing before irreversible project activity can begin. With a 2026-09-01 go-live, the latest safe BS11 notification window opens now. Any delay in notification filing compresses the build and test window.

---

## MVP Scope

The MVP is the **inbound RTP receive capability** sufficient to satisfy Payments NZ scheme membership obligations by 2026-09-01.

**In scope for MVP:**
- Integration with Payments NZ central RTP infrastructure (scheme connectivity layer)
- ISO 20022 inbound payment message ingestion and parsing
- Real-time customer account crediting via a thin real-time processing layer
- Scheme-required acknowledgement messages returned within the 10-second timeout window
- AML screening on inbound payments ≥ NZD $1,000 (using existing AML real-time API, subject to latency resolution — see Constraints)
- Fraud screening on all inbound payments (solution architecture TBD — see Constraints)
- End-of-day reconciliation between real-time processing layer and batch core banking system
- 24/7/365 operational availability for inbound payment receipt
- Scheme audit logging and reporting obligations (inbound leg)

**Explicitly deferred from MVP (see Out of Scope):**
- Outbound RTP send capability
- Customer-facing real-time payment notifications or dashboards
- Replacement or upgrade of the batch core banking system

---

## Out of Scope

1. **Outbound RTP payments (send capability):** The operator brief explicitly stages the receiving side first. Outbound initiation is a subsequent phase. Scheme rules for outbound may introduce additional obligations (e.g. payment initiation authorisation, confirmation of payee) that require separate discovery.

2. **Core banking system replacement or real-time uplift:** The thin real-time processing layer is an overlay on the existing batch core — it does not replace it. Any decision to uplift or replace the core banking system is a separate programme with its own BS11 notification, business case, and discovery artefact.

3. **Customer-facing real-time notifications (push alerts, mobile app balance updates):** Immediate fund availability is in scope; the customer notification channel (push notification, SMS, in-app) is a downstream feature dependent on channel and notification platform decisions outside this discovery.

4. **AML/CFT screening for outbound or non-RTP payment channels:** AML changes introduced for RTP inbound must not be assumed to satisfy AML obligations for other payment channels. Scope of any AML system changes is limited to supporting RTP inbound processing.

5. **Fraud model development or ML model retraining:** The MVP does not include building a new fraud model. The question is whether the existing fraud logic can be exposed via a real-time API within latency constraints — not whether the fraud model itself is replaced or retrained. Any new model development triggers CPG 220 / model risk validation obligations independently and is out of scope for this discovery.

---

## Assumptions and Risks

### Unconfirmed assumptions (must be resolved before scope lock)

> [ASSUMPTION] The 10-second acknowledgement window is measured from scheme message receipt at the enterprise's gateway — not from some upstream point in the Payments NZ infrastructure. If the clock starts earlier, the effective processing budget may be materially less than 10 seconds. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The existing AML real-time API can be modified, scaled, or supplemented to reduce P99 latency below a threshold that permits RTP processing within the 10-second window. Current P99 of 8 seconds leaves only 2 seconds for all other processing — this is almost certainly insufficient at peak volumes. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] A real-time fraud screening capability can be made available within the build timeline, either by exposing the existing batch fraud system via a synchronous API or by integrating a third-party real-time fraud service. The current fraud system has no real-time API — this is a material unsolved architectural dependency. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The combined processing latency budget (AML check + fraud check + account lookup + credit + acknowledgement generation) can fit within the 10-second window. No end-to-end latency modelling has been done. At current P99 AML latency alone (8 seconds), the window is already consumed before fraud screening, account crediting, or acknowledgement steps execute. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] RBNZ BS11 notification has not yet been filed. If correct, it must be filed immediately — the 30-business-day notification clock must start before any infrastructure provisioning, vendor selection, or data migration toolchain work begins. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The thin real-time processing layer constitutes a new or materially changed payment system under BS11, triggering notification obligations independently of any core banking system changes. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] DIA registration assessment has not been performed for the RTP inbound channel. A new real-time inbound payment service type may require DIA registration or confirmation of exemption before piloting with real customers. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The enterprise's SWIFT correspondent bank agreement does not directly constrain the RTP inbound channel (since RTP uses Payments NZ domestic infrastructure, not SWIFT). However, if the RTP reconciliation or settlement mechanism touches intra-group FX or correspondent arrangements, correspondent notification obligations may apply. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] CCCFA retention obligations (7-year retention from contract end) apply to any customer account records touched by RTP credits where those accounts are associated with consumer credit products. The real-time processing layer must not introduce a parallel ledger that creates retention gaps. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The scheme's fraud screening requirement and the enterprise's AML/CFT Act obligations are compatible in terms of what constitutes a "screen" — i.e. the scheme does not require a blocking synchronous fraud decision in a way that conflicts with the AML/CFT Act's requirement to complete screening before crediting. If the scheme permits asynchronous fraud review post-credit, the latency problem may be partially resolved. — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The RBNZ FX transaction reporting obligations do not apply to RTP inbound payments (on the basis that RTP is a domestic NZD scheme). If any RTP payments involve cross-currency conversion, FX reporting requirements are triggered. — unconfirmed, requires /clarify before scope is locked.

### Known risks

**R1 — Latency budget is already consumed before MVP is built.**
At current P99 AML latency (8 seconds) plus an estimated 2–4 seconds for real-time fraud screening, the processing budget exceeds 10 seconds before account crediting and acknowledgement generation are included. This is not a risk to be monitored — it is a blocking architectural constraint that must be resolved in design before build begins. If the AML or fraud latency cannot be reduced, the enterprise faces a choice: accept a scheme non-compliance risk (acknowledging before screening completes), apply for a scheme rule variance, or miss the deadline. None of these outcomes are acceptable without an explicit decision.

**R2 — BS11 notification window may already be compromised.**
If any infrastructure provisioning, vendor engagement, or toolchain work has begun without RBNZ BS11 notification being filed, the enterprise may already be in breach of notification obligations. This must be confirmed with the RBNZ relationship team as the first action following this discovery — before any further project activity.

**R3 — Fraud system has no real-time API — this is an unresolved build dependency, not a design preference.**
The current fraud system is a batch job. Making it available for real-time synchronous calls is either a significant engineering effort or requires a third-party real-time fraud integration. Neither path has been assessed. Without resolving this, the scheme's fraud screening requirement cannot be satisfied.

**R4 — AML/CFT screening architecture for RTP has not been load-tested.**
The AML system has not been tested at the estimated RTP peak volume of 40,000 transactions per hour. P99 latency under production load may be higher than 8 seconds. AML system performance at RTP volumes must be load-tested before architecture is finalised — not after build.

**R5 — CPG 220 model validation is a hard gate if a new real-time fraud model is introduced.**
If resolving the fraud screening latency problem requires deploying a new or materially changed fraud model, CPG 220 / RBNZ BS2B model validation must be completed before go-live. This validation cannot be delegated below CRO level and cannot be accelerated by compressing timelines. A new fraud model introduced late in the delivery timeline creates an unresolvable go-live gate.

**R6 — $50,000/day penalty and scheme suspension are the floor, not the ceiling, of non-compliance cost.**
The financial penalty for missing 2026-09-01 is quantifiable. The reputational and relationship cost of scheme suspension — and the impact on customers who cannot receive RTP payments — is not. Decisions to defer features or accept technical debt must be made in the context of the full non-compliance cost.

---

## Success Indicators

**S1 — Scheme go-live by 2026-09-01**
Baseline: Not live (current state — no RTP capability). Target: First inbound RTP payment received, credited, and acknowledged by 2026-09-01 00:00:00. Measured via: Payments NZ scheme member go-live confirmation and first successful end-to-end transaction log.

**S2 — Acknowledgement within 10-second window (P99)**
Baseline: Not applicable (no current real-time processing). Target: P99 acknowledgement latency ≤ 10 seconds at peak load (40,000 transactions/hour). Measured via: Processing layer transaction logs, acknowledgement timestamp vs. receipt timestamp, sampled at peak load in pre-production load test and confirmed in production.

**S3 — AML screening coverage on payments ≥ NZD $1,000**
Baseline: `[UNKNOWN BASELINE]` — current batch AML screening coverage rate for same-day payments above $1,000 not stated. Target: 100% of inbound RTP payments ≥ NZD $1,000 are AML-screened before or at the point of customer fund availability (subject to regulatory confirmation of timing requirements). Measured via: AML system processing logs cross-referenced against RTP inbound transaction log.

**S4 — Fraud screening coverage on all inbound RTP payments**
Baseline: `[UNKNOWN BASELINE]` — current batch fraud screening coverage rate not stated. Target: 100% of inbound RTP payments are fraud-screened (timing model — synchronous pre-credit or asynchronous post-credit — to be confirmed by compliance and scheme rules). Measured via: Fraud system processing logs cross-referenced against RTP transaction log.

**S5 — End-of-day reconciliation break rate**
Baseline: `[UNKNOWN BASELINE]` — current batch reconciliation break rate between payment processing and core banking system not stated. Target: ≤ 0.01% reconciliation breaks between real-time processing layer and batch core at end of each settlement day. Measured via: Reconciliation exception report, daily.

**S6 — Zero BS11 notification breaches**
Baseline: Notification not yet filed (assumed). Target: RBNZ BS11 notification filed and acknowledged before any irreversible project activity. Measured via: RBNZ acknowledgement letter on file; confirmed by regulatory affairs team before infrastructure provisioning begins.

---

## Constraints

**C1 — Scheme deadline: 2026-09-01 (hard external constraint)**
Payments NZ scheme participation agreement. Penalty: $50,000/day from 2026-09-01 if not live. Potential scheme suspension. Not negotiable.

**C2 — 10-second acknowledgement timeout (hard scheme rule)**
Scheme rules require acknowledgement within 10 seconds of payment message receipt. This is not a performance target — it is a scheme compliance requirement.

**C3 — RBNZ BS11 — 30 business-day notification requirement (regulatory)**
Building and deploying a real-time payment processing layer constitutes a material change to a core payment system. RBNZ BS11 requires notification at least 30 business days before any irreversible project activity. The notification clock must start immediately. Any infrastructure provisioning, vendor selection finalisation, or data migration toolchain work before notification acknowledgement is a regulatory breach.

**C4 — AML/CFT Act 2009 — real-time screening obligation (regulatory)**
All inbound payments ≥ NZD $1,000 must be AML-screened. The enterprise remains the reporting entity on the NZ leg regardless of processing architecture. The AML system's P99 latency of 8 seconds under load is currently incompatible with the 10-second acknowledgement window when combined with other required processing steps. This is a hard constraint — it cannot be resolved by deferring AML screening.

**C5 — CPG 220 / RBNZ BS2B model validation (regulatory)**
Any new or materially changed fraud or AML model used in real-time credit decisioning or screening requires independent model validation before production activation. Board-level (CRO) sign-off is required. This is a hard go-live gate.

**C6 — CCCFA 7-year retention (regulatory)**
Credit contract and account records touched by RTP credits must remain retainable for 7 years from contract end. The real-time processing layer must not create a parallel ledger that sits outside the retention policy.

**C7 — DIA Payment Services Regulations 2021 — registration assessment required (regulatory)**
The RTP inbound channel may constitute a new payment service type. DIA registration or confirmed exemption must be in place before piloting with real customers.

**C8 — Batch core banking system is not being replaced in this initiative**
The core banking system operates in batch windows. The real-time processing layer must overlay and reconcile with it — not replace it. Any performance or availability constraints of the batch core that affect real-time crediting (e.g. end-of-day batch lock windows) must be characterised in design.

**C9 — Fraud system has no real-time API (technical constraint)**
The current fraud screening system is a batch job. It cannot be called synchronously within the 10-second processing window in its current form. A real-time fraud screening architecture must be designed and built as a pre-condition of scheme compliance — this is not optional under scheme rules.

**C10 — AML system load capacity at RTP volumes unconfirmed (technical constraint)**
The AML system has not been load-tested at 40,000 transactions/hour. Current P99 of 8 seconds is measured under current (presumably lower) load. Performance degradation at RTP peak volumes is uncharacterised and may be worse than the current P99 baseline.

---

## /clarify recommendation

This discovery contains 11 unconfirmed assumptions that affect scope, regulatory compliance posture, and the viability of the MVP within the scheme deadline. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] The 10-second acknowledgement window is measured from scheme message receipt at the enterprise's gateway — not from some upstream point in the Payments NZ infrastructure.
- [ASSUMPTION] The existing AML real-time API can be modified, scaled, or supplemented to reduce P99 latency below a threshold that permits RTP processing within the 10-second window.
- [ASSUMPTION] A real-time fraud screening capability can be made available within the build timeline.
- [ASSUMPTION] The combined processing latency budget (AML + fraud + account lookup + credit + acknowledgement) can fit within the 10-second window.
- [ASSUMPTION] RBNZ BS11 notification has not yet been filed and must be filed immediately.
- [ASSUMPTION] The thin real-time processing layer constitutes a material change under BS11.
- [ASSUMPTION] DIA registration assessment has not been performed for the RTP inbound channel.
- [ASSUMPTION] The SWIFT correspondent bank agreement does not constrain the RTP inbound channel.
- [ASSUMPTION] CCCFA 7-year retention obligations apply to customer account records touched by RTP credits.
- [ASSUMPTION] The scheme's fraud screening requirement and the AML/CFT Act obligations are compatible in timing model.
- [ASSUMPTION] RBNZ FX transaction reporting obligations do not apply to RTP inbound payments (domestic NZD).

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions — particularly C3 (BS11 notification), C4 (AML latency), and C9 (fraud real-time API) — produces metrics and delivery timelines that will require material revision after clarification.

**Priority clarification:** The BS11 notification assumption (C3) is the highest-urgency item. If notification has not been filed and infrastructure work has already begun, the enterprise is already in regulatory breach. This must be confirmed with the RBNZ relationship team before any further project activity.

---

## Attribution

**Contributors:**
- [Operator — Role not yet provided] — Date: 2025-07-15

**Reviewers:**
- Pending

**Approved By:**
- Pending

> ⚠️ **Attribution required before marking Approved.** Populate Contributors, Reviewers, and Approved By before the Definition of Ready gate. A non-engineering approver is expected for M3 measurement. Leaving Approved By empty will result in a H-GOV hard block at Definition of Ready.

---

## Approval gate

> **Discovery draft complete ✓**
>
> This discovery contains **11 unconfirmed assumptions** and **3 blocking technical constraints** (AML latency, fraud real-time API, BS11 notification status). Running `/benefit-metric` before resolving these will produce delivery timelines that require revision.
>
> **Strongly recommended:** Run `/clarify` before proceeding. The BS11 notification question is time-critical — if notification has not been filed, it must be initiated today.
>
> How do you want to proceed?
> 1. Run `/clarify` now (strongly recommended — blocking constraints present)
> 2. Review and approve without `/clarify` — skip to sign-off
>
> Reply: 1 or 2

---

*Pipeline state update pending operator approval and contributor details.*

<!-- eval-mode: true -->