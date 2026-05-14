# Discovery: Payment Authorisation Service — Disaster Recovery Failover

**Status:** Approved (eval-mode — for scoring purposes; this artefact must not be committed to a production artefact path)
**Feature slug:** 2026-05-14-payment-auth-dr-failover
**Date:** 2026-05-14
**Skill version:** discovery (EXP-002b changes applied)

---

## Step 0 — Context check (eval-mode log)

**Product context:** `product/mission.md`, `product/constraints.md`, and `product/tech-stack.md` exist but describe the skills-platform product. The S1 corpus brief describes a payment operations service in a different organisational domain — no pre-population from product context files applied.

**Reference materials:** No `artefacts/2026-05-14-payment-auth-dr-failover/reference/` folder. None found — proceeding without reference pre-population.

**EA registry:** `architecture.ea_registry_authoritative: true` in `.github/context.yml`. Query attempted for system "payment-authorisation-service" — no EA registry entry found. Proceeding without blast-radius data; this does not block discovery.

**Reference corpus:** No reverse-engineering corpus or `discovery-seed.md` found for this system. Proceeding.

---

## Problem Statement

The payment operations team runs a real-time card payment authorisation service that processes approximately 180,000 transactions per day for retail and business customers. The service runs from a single on-premises data centre in Auckland with no automated failover to a secondary site. When the primary data centre is unavailable, payment authorisation stops.

Three outages in the last 12 months totalled 4.2 hours of downtime. Each hour costs approximately $420,000 ($340,000 in failed transactions, $80,000 in additional call centre volume) — implying roughly $1.76M of cumulative outage cost over the period.

The Board Risk Committee has approved a disaster recovery policy requiring critical payment systems to achieve a Recovery Time Objective (RTO) of 2 hours and a Recovery Point Objective (RPO) of 15 minutes. The service does not meet these targets today, and the Board is therefore receiving evidence of non-compliance with its own approved policy.

Two regulatory obligations sit on top of the resilience gap. Payment card data is in scope for PCI DSS — the annual Qualified Security Assessor (QSA) audit is in Q3, and any architectural change to the payment authorisation environment must be QSA-assessed before go-live. Transaction records must also be retained for 5 years under the Anti-Money Laundering and Countering Financing of Terrorism Act (AML/CFT Act). The most recent internal audit recorded an unresolved gap: it is not confirmed that the current replication process captures all transaction records at the secondary site within the 5-year statutory retention window.

This is a resilience and compliance problem, not a product feature. The solution space is bounded by a Board-mandated RTO/RPO target, a PCI DSS assessment dependency, and an open AML/CFT audit finding.

---

## Who It Affects

- **Payment operations engineers** — own and operate the authorisation service; accountable to the Board DR policy. Currently cannot demonstrate compliance with the 2-hour RTO / 15-minute RPO targets and have no tested failover procedure to invoke during an outage.
- **Security and compliance team** — manage the QSA relationship under PCI DSS and the AML/CFT Act obligation. Need to assess any DR architectural change before go-live and need to close the open AML replication audit finding.
- **Board Risk Committee** — approved the DR policy and currently holds an open finding that critical payment systems do not meet their own targets. Reputational and governance exposure escalates with each subsequent outage.
- **Internal audit function** — logged the AML replication gap; the finding will escalate at the next audit cycle if unremediated.
- **Retail and business merchants and their cardholders (~180,000 transactions/day)** — experience payment failures during any Auckland data centre outage, with no mechanism to reroute transactions to a secondary site.

---

## Why Now

Three converging triggers, none discretionary:

1. **Documented non-compliance with the Board's own DR policy.** Three outages in 12 months have produced concrete evidence that RTO/RPO targets are not being met. The Board cannot continue to receive this evidence without a remediation plan.
2. **Q3 PCI DSS QSA audit deadline.** Any architectural change to the payment authorisation environment must be assessed by the QSA before go-live. Starting work now is the minimum lead time to scope, build, assess, and certify a DR capability before the Q3 audit window.
3. **Open AML/CFT internal audit finding.** The replication completeness gap to the secondary site is logged and will escalate at the next audit cycle. Addressing it is part of the same workstream as the DR build — the secondary site that satisfies RTO/RPO is the same secondary site that must satisfy the 5-year retention obligation.

The financial signal — approximately $1.76M of cumulative outage cost across the last 12 months — quantifies the cost of inaction but is not, on its own, the trigger. The Board policy and the regulatory deadlines are.

---

## MVP Scope

The smallest deliverable that closes the Board RTO/RPO finding and the AML/CFT audit gap, scoped to one secondary site:

1. **Active-passive secondary site failover capability** — replication from the Auckland primary data centre to the Hamilton co-location facility, with the secondary site sized to process 100% of authorisation transaction volume (cannot partially route).
2. **Documented and tested manual failover procedure** — payment operations engineers can switch authorisation processing to the Hamilton site within the 2-hour RTO window. Validated by timed failover drills run before go-live.
3. **Replication lag within 15-minute RPO** — replication to Hamilton is measured and confirmed at ≤ 15 minutes lag at the point of declared failover, on the same drills.
4. **QSA assessment of the DR environment** — Hamilton DR architecture is scoped, documented, and assessed by the QSA firm; a QSA sign-off letter is in hand before first production failover.
5. **AML/CFT replication completeness verification** — independent verification that all transaction records subject to the 5-year retention obligation are replicated to Hamilton with no gaps, with an auditable evidence trail.

The MVP is manual, single-secondary-site, active-passive failover with both compliance dependencies satisfied. It deliberately excludes automation and multi-region routing.

---

## Out of Scope

1. **Automated/self-healing failover** — the MVP achieves the RTO target via a human-initiated failover procedure. Fully automated detection and switch-over is a follow-on phase requiring additional QSA scoping and is not in this MVP.
2. **Active-active multi-region architecture** — the MVP is active-passive with Hamilton on standby. Active-active introduces latency, distributed transaction coordination, and PCI DSS cardholder data routing questions that are out of scope here.
3. **DR capability for adjacent services** — fraud screening, merchant notification, settlement, and reconciliation services are excluded. Scope boundary is the payment authorisation service only.
4. **Fraud screening or card-routing rule changes during failover** — no changes to fraud logic or routing rules as part of this initiative; failover preserves existing rule configurations.
5. **Merchant- or cardholder-facing notification changes** — no changes to how merchants or cardholders are informed during DR activation. Existing comms processes apply.
6. **A third site or multi-cloud DR posture** — only the Hamilton co-location facility is in scope as the secondary site. Cloud-based DR or a third on-premises site is excluded.

---

## Assumptions and Risks

### Assumptions

[ASSUMPTION] The Hamilton co-location facility has sufficient compute, memory, storage, and network capacity (including the existing fibre to Auckland) to process 100% of payment authorisation transaction volume at peak — confirmed only as having "available rack space and a direct fibre connection"; full capacity sizing is unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] The current replication process to the Hamilton site captures all transaction records within the 5-year AML/CFT statutory retention window — explicitly flagged in the brief as an unresolved internal audit gap; status and remediation effort are unknown and require investigation before scope is locked.

[ASSUMPTION] The QSA firm can scope, schedule, and complete a DR environment assessment before the Q3 audit window — preliminary scoping conversations are achievable within 2 weeks per the brief, but assessment lead time and capacity are unconfirmed; requires /clarify before scope is locked.

[ASSUMPTION] The Hamilton facility is (or can be made) a compliant PCI DSS cardholder data environment — currently used only for backup storage; whether it satisfies PCI DSS network segmentation, access control, and monitoring requirements as an active CDE is unconfirmed, requires /clarify before scope is locked.

[ASSUMPTION] Existing on-premises infrastructure tooling, monitoring, and operations procedures can be extended to the Hamilton site (or equivalent tooling provisioned there) within the project timeline — unconfirmed, requires /clarify before scope is locked.

### Risks

- **QSA assessment timeline overruns Q3 audit window.** If the QSA firm cannot complete the DR environment assessment before Q3, go-live is blocked or the assessment slips to the following audit cycle. Mitigation: engage QSA in scoping conversations within the first 2 weeks of the project.
- **PCI DSS CDE expansion at Hamilton requires significant infrastructure investment.** If the Hamilton site does not currently meet CDE requirements (segmentation, monitoring, access controls), making it compliant could materially expand scope and cost beyond the current MVP boundary.
- **AML/CFT replication gap is structural, not configurational.** If the existing replication process has genuine completeness gaps in the 5-year retention window (rather than verification gaps), remediation may need a separate workstream beyond the DR failover project. The MVP could close RTO/RPO without closing the AML finding.
- **Tested failover time exceeds 2-hour RTO under realistic conditions.** Replication lag at point of outage, residual data synchronisation steps, and operations team execution time may, in combination, push real failover beyond 2 hours. Drill-based validation before go-live is mandatory; the MVP cannot be declared complete on architecture alone.
- **100% transaction volume at the secondary site assumes no degraded-mode routing.** The brief is explicit that partial routing is not possible — the Hamilton site must be sized for full peak volume on day one. Capacity miscalibration carries direct customer impact.

---

## Directional Success Indicators

**1. RTO compliance in pre-go-live drills:**
- Baseline: Not met. No DR procedure exists. The three logged outages averaged ~1.4 hours of partial recovery each; a full Auckland data centre loss has no defined recovery path and would exceed the 2-hour RTO.
- Target: Manual failover completed in ≤ 2 hours of declared outage on 2 of 2 pre-go-live drills.
- Measured via: timed drill records — incident-declaration timestamp through to authorisation service confirmed operational at Hamilton; compared against 2-hour RTO threshold.

**2. RPO compliance in pre-go-live drills:**
- Baseline: [UNKNOWN BASELINE] — backup replication to Hamilton exists but lag at the point of a simulated outage has never been measured. Replication currency is unverified.
- Target: ≤ 15 minutes of transaction data unrecoverable at point of declared outage, confirmed on 2 of 2 pre-go-live drills.
- Measured via: transaction log reconciliation between primary (at outage declaration timestamp) and secondary (at switchover), comparing record counts and the latest committed transaction timestamp.

**3. PCI DSS DR environment assessment completed:**
- Baseline: No QSA assessment of any DR environment exists — the DR environment itself does not exist.
- Target: QSA sign-off letter confirming the Hamilton DR environment meets PCI DSS requirements, issued before first production failover and before the Q3 audit window.
- Measured via: QSA sign-off letter logged in the compliance evidence record.

**4. AML/CFT replication completeness verified:**
- Baseline: [UNKNOWN BASELINE] — internal audit has flagged that 5-year retention completeness at the secondary site is unverified. No baseline measurement exists.
- Target: Independent verification that all transaction records replicate to Hamilton with no gaps in the 5-year retention window, with an auditable evidence trail (record-count reconciliation + spot-check + date-range coverage).
- Measured via: independent replication audit comparing primary and secondary transaction record sets; finding logged with internal audit and tracked to closure.

**5. Reduction in unrecovered outage minutes:**
- Baseline: 252 minutes (4.2 hours) of unrecovered downtime across 3 events in the prior 12 months.
- Target: 0 minutes of unrecovered downtime in the 12 months following go-live (any unplanned outage of the primary triggers failover within RTO).
- Measured via: incident management records for the 12 months post go-live, comparing total minutes of authorisation-service unavailability against baseline.

---

## Constraints

- **C1 — Recovery Time Objective ≤ 2 hours, Recovery Point Objective ≤ 15 minutes (Board-approved internal policy).** Source: Board Risk Committee disaster recovery policy. Applies to the payment authorisation service as a critical payment system. Non-compliance is a live Board finding.
- **C2 — PCI DSS QSA assessment dependency (regulated).** Payment card data processed by the service is in scope for PCI DSS. Any architectural change to the payment authorisation environment, including the introduction of a DR site, must be assessed by the Qualified Security Assessor before go-live. Annual QSA audit is in Q3.
- **C3 — AML/CFT Act 5-year transaction record retention (regulated).** Anti-Money Laundering and Countering Financing of Terrorism Act requires that transaction records are retained for 5 years. The replicated copies at the secondary site must satisfy the same retention obligation; replication completeness within the 5-year window must be verifiable.
- **C4 — Single primary data centre, secondary not yet active.** The service runs from a single Auckland data centre. The Hamilton co-location facility has rack space and a direct fibre connection but is not currently configured for active workload processing.
- **C5 — Open internal audit finding on AML replication completeness (regulated).** The most recent internal audit recorded that secondary-site replication completeness within the 5-year statutory retention window is unverified. This is not just an assumption — it is a logged audit finding, and closing it is part of the in-scope compliance dependency for this initiative.
- **C6 — 100% transaction volume at secondary on failover.** Partial transaction routing is not available; the secondary site must be sized to take 100% of authorisation volume at the moment of failover.

---

## /clarify recommendation

This discovery contains 5 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] The Hamilton co-location facility has sufficient compute, memory, storage, and network capacity (including the existing fibre to Auckland) to process 100% of payment authorisation transaction volume at peak — confirmed only as having "available rack space and a direct fibre connection"; full capacity sizing is unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] The current replication process to the Hamilton site captures all transaction records within the 5-year AML/CFT statutory retention window — explicitly flagged in the brief as an unresolved internal audit gap; status and remediation effort are unknown and require investigation before scope is locked.
- [ASSUMPTION] The QSA firm can scope, schedule, and complete a DR environment assessment before the Q3 audit window — preliminary scoping conversations are achievable within 2 weeks per the brief, but assessment lead time and capacity are unconfirmed; requires /clarify before scope is locked.
- [ASSUMPTION] The Hamilton facility is (or can be made) a compliant PCI DSS cardholder data environment — currently used only for backup storage; whether it satisfies PCI DSS network segmentation, access control, and monitoring requirements as an active CDE is unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] Existing on-premises infrastructure tooling, monitoring, and operations procedures can be extended to the Hamilton site (or equivalent tooling provisioned there) within the project timeline — unconfirmed, requires /clarify before scope is locked.

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
  "model": "claude-opus-4-7",
  "config": "B",
  "completedAt": "2026-05-14T00:00:00Z",
  "artefactPath": "workspace/experiments/EXP-003-pipeline-eval/runs/config-B-run-1/discovery.md",
  "dimensionsScored": null,
  "verdict": null
}
```

<!-- eval-mode: true -->
