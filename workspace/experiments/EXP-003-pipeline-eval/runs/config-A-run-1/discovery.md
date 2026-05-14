# Discovery: Payment Authorisation Service — Disaster Recovery Failover

**Status:** Approved (eval-mode — for scoring purposes; this artefact must not be committed to a production artefact path)
**Feature slug:** 2026-05-14-payment-auth-dr-failover
**Date:** 2026-05-14
**Skill version:** discovery (EXP-002b changes applied)

---

## Step 0 — Context check (eval-mode log)

**Product context:** Product files exist in `product/` but apply to the skills platform. The S1 corpus story describes a payment operations system — separate domain. No pre-population from product context files.

**Reference materials:** No reference folder for `artefacts/2026-05-14-payment-auth-dr-failover/reference/`. None found — proceeding without reference pre-population.

**EA registry:** `architecture.ea_registry_authoritative: true`. Query attempted for system "payment-authorisation-service" — no EA registry entry found. Proceeding without blast-radius data. This does not block discovery.

**Reference corpus:** No reverse-engineering corpus found for this system. Proceeding.

---

## Problem Statement

The payment operations team runs a real-time card payment authorisation service processing approximately 180,000 transactions per day for retail and business customers. The service runs from a single data centre in Auckland with no disaster recovery capability. Three outages over the past 12 months totalled 4.2 hours of unplanned downtime, at an estimated cost of approximately $420,000 per hour ($340,000 in failed transactions, $80,000 in call centre load).

The Board Risk Committee has approved a disaster recovery policy requiring that critical payment systems achieve RTO ≤ 2 hours and RPO ≤ 15 minutes. These targets are not currently met. There is no tested failover procedure, and if the primary Auckland data centre is unavailable, payments stop.

Two regulatory obligations compound the risk. Payment card data is in scope for PCI DSS — any architectural change to the payment authorisation environment must be assessed by a Qualified Security Assessor (QSA) before go-live. Transaction records must be retained for 5 years under the Anti-Money Laundering and Countering Financing of Terrorism Act (AML/CFT Act). The organisation's own internal audit has flagged an unresolved gap: it is not confirmed that current replication to any secondary site captures all transaction records within the statutory 5-year retention window.

This is a resilience and compliance problem, not a technology one. The solution space is bounded by the Board-approved RTO/RPO targets and two regulatory frameworks.

---

## Who It Affects

- **Payment operations engineers** — own and operate the service; responsible for meeting RTO/RPO targets under the Board DR policy. Currently unable to demonstrate compliance.
- **Security and compliance team** — manage the QSA relationship (PCI DSS) and AML/CFT Act obligations. An architectural change without QSA assessment is a compliance breach; an unverified AML replication gap is an unresolved audit finding.
- **Board Risk Committee** — approved the DR policy; currently holds a live finding that critical payment systems are not meeting their own Board-mandated targets. Reputational and governance exposure.
- **Retail and business customers (180,000 transactions/day)** — experience payment failures during any Auckland data centre outage. No mechanism exists to reroute transactions.

---

## Why Now

The trigger is the combination of three active gaps:
1. Three outages in 12 months have provided concrete evidence of non-compliance with the Board's own approved RTO/RPO policy.
2. The Q3 QSA audit is approaching. Any architectural changes must be QSA-assessed before go-live — starting the DR project now is the minimum lead time to complete assessment before Q3.
3. The internal audit has logged the AML replication gap as unresolved. This finding will escalate if it remains open at the next audit cycle.

This is not discretionary work. The Board has approved the targets, the audit has surfaced the gap, and the financial exposure (~$420K/hour) is documented.

---

## MVP Scope

The smallest deliverable that would close the Board's finding and satisfy the audit gap:

1. **Secondary site failover capability** — active-passive replication from the Auckland primary to the Hamilton co-location facility, with confirmed capacity for 100% transaction volume.
2. **Tested manual failover procedure** — operations team can switch payment authorisation processing to the secondary site within the 2-hour RTO. Measured by timed failover drills.
3. **RPO-compliant data replication** — transaction data replication lag verified at ≤ 15 minutes at point of failover.
4. **QSA assessment of DR environment** — the DR architecture is scoped, documented, and assessed by the QSA before go-live.
5. **AML/CFT replication completeness confirmation** — verified that all transaction records replicate to the secondary site within the 5-year statutory retention window, with an auditable evidence trail.

The MVP is manual failover at a defined secondary site with compliance confirmed. It is not active-active, not automated self-healing, and not a multi-region architecture.

---

## Out of Scope

1. **Automated/self-healing failover** — the MVP achieves RTO via a human-initiated failover procedure. Automated detection-and-switch is a subsequent phase and requires additional QSA scoping.
2. **Active-active multi-region architecture** — the MVP is active-passive (secondary site on standby). Active-active introduces latency, distributed transaction coordination complexity, and PCI DSS cardholder data routing questions that are out of scope here.
3. **DR capability for services other than payment authorisation** — the scope boundary is the payment authorisation service only. Upstream and downstream services (fraud screening, merchant notification, settlement) are excluded.
4. **Fraud screening or risk rules changes during failover** — no changes to fraud logic or card routing rules as part of this initiative.
5. **Merchant notification or chargeback workflow changes** — failover does not include any changes to how merchants or customers are informed during DR activation.

---

## Assumptions and Risks

### Assumptions

[ASSUMPTION] The Hamilton co-location facility has sufficient compute, memory, and network throughput to process 100% of payment transaction volume (180,000 transactions/day at peak) — unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] The current AML/CFT replication process to the Hamilton site captures all transaction records within the 5-year statutory retention window — unconfirmed (noted as an internal audit gap in the problem statement); status and remediation effort are unknown and require investigation before scope is locked.

[ASSUMPTION] The QSA firm can be engaged and complete a DR environment assessment before the Q3 QSA audit deadline — unconfirmed, requires /clarify before scope is locked.

### Risks

- **QSA assessment timeline extension** — if the QSA cannot complete the DR environment assessment before Q3, the go-live date is blocked. Early engagement with the QSA firm is critical.
- **PCI DSS secondary-site network isolation requirements** — the DR environment must meet PCI DSS cardholder data environment (CDE) isolation requirements. If the Hamilton facility does not currently satisfy these, significant infrastructure changes may expand scope.
- **Actual failover time may exceed 2-hour RTO** — if the manual failover procedure involves data synchronisation steps that vary with replication lag at point of outage, the 2-hour window may not be consistently achievable. Testing under realistic conditions is required pre-go-live.
- **AML gap remediation effort unknown** — if the current replication process has genuine gaps in 5-year record completeness, remediating those gaps may require a separate workstream beyond the DR failover project.

---

## Directional Success Indicators

**1. RTO compliance in tested drills:**
- Baseline: Not met. No DR procedure exists — last three outages averaged 1.4 hours each for partial recovery; a full Auckland DC outage would have undefined recovery time (estimated: >4 hours with no procedure).
- Target: Manual failover completed within 2 hours of outage declaration on 2 of 2 pre-go-live failover drills.
- Measured via: Timed drill results, logged from incident declaration timestamp to payment authorisation service confirmed operational at secondary site.

**2. RPO compliance in tested drills:**
- Baseline: [UNKNOWN BASELINE] — a backup replication process exists to the Hamilton site, but data lag at the point of a simulated outage has never been measured. Replication currency is unverified.
- Target: No more than 15 minutes of transaction data unrecoverable at point of declared outage, confirmed on 2 of 2 pre-go-live drills.
- Measured via: Transaction log reconciliation between primary (at outage declaration point) and secondary (at switchover), comparing record counts and timestamps.

**3. PCI DSS DR assessment completed:**
- Baseline: DR environment does not exist — no QSA assessment has been performed on any secondary site.
- Target: QSA sign-off letter confirming the DR environment meets PCI DSS requirements, issued before first production failover.
- Measured via: QSA assessment completion certificate in the compliance record.

**4. AML/CFT replication completeness confirmed:**
- Baseline: [UNKNOWN BASELINE] — internal audit has flagged that replication completeness within the 5-year statutory retention window is unverified. No baseline measurement exists.
- Target: Audit-confirmable evidence that all transaction records replicate to the secondary site with no gaps in the 5-year retention window, verified by an independent replication audit.
- Measured via: Independent replication audit comparing primary and secondary transaction record sets (record count, date range, and spot-check reconciliation).

---

## Constraints

- **C1 — RTO/RPO (Board-approved internal policy):** Recovery Time Objective ≤ 2 hours; Recovery Point Objective ≤ 15 minutes. Source: Board Risk Committee DR policy.
- **C2 — PCI DSS (regulated):** Payment card data is in scope for PCI DSS. Any architectural change to the payment authorisation service environment must be assessed by a Qualified Security Assessor (QSA) before go-live. Annual QSA audit is in Q3.
- **C3 — AML/CFT Act (regulated):** Anti-Money Laundering and Countering Financing of Terrorism Act requires 5-year transaction record retention. Records must be replicated to and verifiable at the secondary site.
- **C4 — Single data centre (technical):** The service currently runs from a single Auckland data centre with no secondary site active workload capability. The Hamilton co-location facility provides available rack space and fibre connectivity but has not been configured for active processing.

---

## /clarify recommendation

This discovery contains 3 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] The Hamilton co-location facility has sufficient compute, memory, and network throughput to process 100% of payment transaction volume (180,000 transactions/day at peak) — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] The current AML/CFT replication process to the Hamilton site captures all transaction records within the 5-year statutory retention window — unconfirmed (noted as an internal audit gap in the problem statement); status and remediation effort are unknown and require investigation before scope is locked.
- [ASSUMPTION] The QSA firm can be engaged and complete a DR environment assessment before the Q3 QSA audit deadline — unconfirmed, requires /clarify before scope is locked.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

## Attribution

**Contributors:**
- Hamis — Experiment operator — 2026-05-14

**Reviewers:**
- (none — eval-mode run; not for production approval)

**Approved By:**
- Hamis — Experiment operator — 2026-05-14 (eval-mode approval for scoring purposes)

---

## Eval-mode result

```json
{
  "skill": "discovery",
  "caseId": "S1",
  "model": "claude-sonnet-4-6",
  "config": "A",
  "completedAt": "2026-05-14T17:45:00Z",
  "artefactPath": "workspace/experiments/EXP-003-pipeline-eval/runs/config-A-run-1/discovery.md",
  "dimensionsScored": null,
  "verdict": null
}
```

<!-- eval-mode: true -->
