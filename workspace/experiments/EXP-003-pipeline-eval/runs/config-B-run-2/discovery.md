# Discovery: Payment Authorisation Secondary-Site Failover Capability

**Status:** Draft — awaiting approval
**Created:** 2026-05-14
**Approved by:** Pending
**Author:** Copilot (eval mode — Config B run 2)

---

## Problem Statement

The real-time card payment authorisation service runs from a single Auckland data centre with no automated failover. Over the past 12 months, three outages have totalled 4.2 hours of downtime, costing an estimated $1.43M in failed transactions ($340k/hr × 4.2hr) and $336k in associated call centre volume ($80k/hr × 4.2hr). The Board Risk Committee has approved a Recovery Time Objective (RTO) of 2 hours and a Recovery Point Objective (RPO) of 15 minutes for critical payment systems. The service is not currently meeting these Board-approved targets, and the Board is receiving evidence of ongoing non-compliance with its own policy. A separate internal audit has flagged that transaction-record replication to the secondary site is not verified to meet the AML/CFT Act 5-year retention obligation — an unresolved compliance gap layered on top of the resilience gap.

The problem is therefore twofold: (a) the service breaches its own Board-approved disaster recovery policy, and (b) the disaster recovery story is not demonstrably compliant with statutory record-retention obligations. It is **not** "we need a secondary site" — that is one candidate solution to the underlying resilience-and-compliance gap.

## Who It Affects

- **Payment operations engineers** — own the RTO/RPO targets and run the service. Currently absorb the operational impact of each outage and report non-compliance to the Risk Committee.
- **Security and compliance team** — own the QSA (Qualified Security Assessor) relationship for PCI DSS and the AML/CFT obligations. Carry the audit risk of the unresolved retention-replication gap and must scope any architectural change for QSA assessment before go-live.
- **Board Risk Committee** — approved the RTO/RPO policy and is the consumer of the non-compliance evidence each outage generates. Has standing oversight of unresolved internal audit findings, including the AML replication gap.
- **Retail and business card-acquiring customers** (indirect) — experience declined or stalled authorisations during outages. ~180,000 transactions per day are exposed.

## Why Now

Three converging pressures:

1. **Standing policy breach.** Board-approved RTO/RPO is not being met. Each outage is reportable evidence of ongoing non-compliance with internal policy.
2. **Q3 PCI DSS QSA audit window.** The annual QSA assessment is in Q3. Any architectural change to the payment authorisation service must be QSA-assessed before go-live, so a credible delivery window exists if scoping starts now (preliminary QSA scoping conversations can occur within ~2 weeks).
3. **Open AML/CFT internal audit finding.** Replication of transaction records to a secondary site within the 5-year statutory retention window is logged as a gap and remains unremediated. Each new outage compounds the audit risk if records are lost in scope of the gap.

## MVP Scope

The smallest deliverable that validates the resilience-and-compliance gap can be closed:

- **Automated failover trigger** from the Auckland primary to the Hamilton co-location secondary site, meeting the 2-hour RTO target on a controlled failover test.
- **Active-passive replication** of payment authorisation state and transaction records to the Hamilton site, meeting the 15-minute RPO target.
- **Transaction-record replication that is verified to satisfy the AML/CFT 5-year retention obligation at the secondary site** (closes the open internal audit finding as part of MVP, not as a follow-on item).
- **PCI DSS QSA scoping engagement** completed before go-live — documented assessment of the architectural change and any cardholder-data-environment (CDE) boundary impact.
- **Two successful end-to-end failover tests** evidencing demonstrated recovery within 2 hours, signed off as the basis for declaring RTO/RPO compliance.

## Out of Scope

- **Active-active multi-region processing.** MVP is active-passive only; concurrent processing at both sites is deferred. Active-active introduces conflict-resolution complexity that is unnecessary to close the RTO/RPO and AML gaps.
- **Changes to fraud screening logic or risk-scoring rules.** Failover preserves existing fraud screening behaviour — no rule changes ride on this initiative.
- **Merchant-facing notification or settlement-timing changes.** Failover is transparent to merchants; settlement and reconciliation flows are unchanged.
- **Replacement of the existing payment authorisation application.** This is a resilience and replication initiative against the current application, not a re-platforming.
- **Expansion of the Hamilton facility beyond the payment authorisation workload.** Other workloads using Hamilton remain on existing arrangements.

## Assumptions and Risks

[ASSUMPTION] Current batch replication of transaction records from Auckland to Hamilton does not verifiably capture all transaction records within the AML/CFT 5-year retention window — the internal audit gap is real and replication-format changes are required as part of MVP. Unconfirmed, requires `/clarify` before scope is locked.

[ASSUMPTION] The Hamilton co-location facility can be configured for active workload processing within the project timeline (rack space available; direct fibre to Auckland exists; not currently configured for active workload). Unconfirmed, requires `/clarify` before scope is locked.

[ASSUMPTION] The QSA firm can be engaged for scoping within ~2 weeks and complete assessment of the architectural change before the Q3 audit. Unconfirmed, requires `/clarify` before scope is locked.

[ASSUMPTION] Hamilton can absorb 100% of transaction volume (~180,000/day) on failover, with no partial-routing fallback design required at MVP. Unconfirmed, requires `/clarify` before scope is locked.

[ASSUMPTION] The PCI DSS cardholder-data-environment (CDE) boundary at the Hamilton site can be defined and assessed without expanding the existing CDE scope materially (which would extend QSA effort and timeline). Unconfirmed, requires `/clarify` before scope is locked.

**Risks** (separate from assumptions):
- **QSA assessment outcome may require rework.** If QSA flags the secondary-site CDE design as deficient, go-live slips past the Q3 audit window.
- **Failover test failure.** If the 2 of 2 controlled failover tests do not demonstrate ≤2-hour recovery, the Board policy breach is not closed by MVP delivery.
- **Replication backlog under load.** RPO of 15 minutes may not hold if replication lag spikes during peak transaction volume; needs validated under load.
- **Co-location capacity contention.** Hamilton is currently used for backup storage; activating workload processing may compete with backup operations.

## Directional Success Indicators

- **Demonstrated failover recovery time.** Baseline: untested (last incident: 4.2 hours total across 3 events). Target: ≤2 hours on 2 of 2 controlled failover tests before Q3 QSA audit. Measured via: end-to-end controlled failover test runbook with timestamped operator log and authorisation-service smoke checks.
- **Replication lag (RPO evidence).** Baseline: [UNKNOWN BASELINE] — current batch replication interval not measured against RPO. Target: ≤15 minutes lag sustained under representative load. Measured via: replication monitoring telemetry on the Hamilton replica, sampled at peak hour.
- **AML/CFT retention gap closure.** Baseline: open internal audit finding (replication of transaction records to secondary site within 5-year retention window unverified). Target: finding closed with evidence that all transaction records are replicated to Hamilton within retention scope. Measured via: signed-off internal audit evidence pack referencing replication design and sample reconciliation.
- **PCI DSS QSA assessment outcome.** Baseline: no assessment of the new architecture exists. Target: QSA-assessed and signed off before Q3 audit, with no high-severity findings outstanding at go-live. Measured via: QSA written assessment letter on file with the security and compliance team.
- **Board-reportable RTO/RPO compliance.** Baseline: non-compliant (3 events / 4.2hr total in last 12 months exceed 2-hour RTO; RPO unverified). Target: Risk Committee paper showing the service meets policy at next quarterly reporting cycle following go-live. Measured via: scheduled Risk Committee report.

## Constraints

- **C1 — RTO ≤ 2 hours, RPO ≤ 15 minutes (Board-approved disaster recovery policy).** Internal regulatory constraint; non-negotiable acceptance criterion for declaring compliance.
- **C2 — PCI DSS compliance.** Any architectural change to the payment authorisation service must be assessed by the QSA before go-live. Annual QSA audit is in Q3 — this is the binding compliance window.
- **C3 — AML/CFT Act 5-year transaction record retention.** Records must be retained for 5 years and the secondary-site replication must be demonstrably within scope of this obligation.
- **C4 — Single existing data centre (Auckland).** No existing secondary site is configured for active workload processing; the Hamilton co-location facility is currently backup-storage-only with available rack space and direct fibre to Auckland.
- **C5 — Open internal audit finding (AML replication gap).** Replication of transaction records to the secondary site within the 5-year retention window is logged as a gap and is not yet remediated; this constraint must be resolved as part of, not after, MVP. (Surfaced from "noted as a gap in our last internal audit" — flagged for `/clarify` to confirm scope.)
- **Timing constraint — Q3 QSA audit window.** Architectural assessment must complete before this window if MVP is to count toward closing the policy breach in this audit cycle.

## Contributors

- Copilot (eval mode, Config B run 2) — Drafting agent — 2026-05-14

## Reviewers

- Pending

## Approved By

Pending

---

## /clarify recommendation

This discovery contains 5 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] Current batch replication of transaction records from Auckland to Hamilton does not verifiably capture all transaction records within the AML/CFT 5-year retention window — the internal audit gap is real and replication-format changes are required as part of MVP.
- [ASSUMPTION] The Hamilton co-location facility can be configured for active workload processing within the project timeline (rack space available; direct fibre to Auckland exists; not currently configured for active workload).
- [ASSUMPTION] The QSA firm can be engaged for scoping within ~2 weeks and complete assessment of the architectural change before the Q3 audit.
- [ASSUMPTION] Hamilton can absorb 100% of transaction volume (~180,000/day) on failover, with no partial-routing fallback design required at MVP.
- [ASSUMPTION] The PCI DSS cardholder-data-environment (CDE) boundary at the Hamilton site can be defined and assessed without expanding the existing CDE scope materially.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

**Next step:** Human review and approval → /benefit-metric

<!-- eval-mode: true -->
