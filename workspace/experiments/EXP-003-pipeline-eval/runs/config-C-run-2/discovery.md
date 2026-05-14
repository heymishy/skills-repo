# Discovery: Payment Authorisation Service Secondary-Site Failover

**Status:** Draft — awaiting approval
**Created:** 2026-05-14
**Approved by:** [Pending]
**Author:** Copilot (eval-mode — Config C run 2, EXP-003-pipeline-eval)

---

> **Product context check:** The `product/` directory was found. The existing product context describes the SDLC skills platform — a different system from the payment authorisation service in this brief. No pre-populated personas, constraints, or tech-stack context from `product/` applies to this discovery. Proceeding without pre-population from product context files.

> **EA registry:** `architecture.ea_registry_authoritative: true` is set in `.github/context.yml`. The system named in this brief is a payment authorisation service hosted on-premises. No entry for this system is expected in the skills platform EA registry. Proceeding without blast-radius data — this does not block discovery.

> **Clarifying questions (eval mode — included as content, not interactive gates):** In a standard session, the following clarifying questions would be asked before writing the artefact: (1) What is the Hamilton site's current capacity and network specification? (2) Can QSA scoping be completed before the Q3 audit deadline? (3) What is the current replication mechanism from Auckland to Hamilton, and has it been validated against the 5-year AML/CFT window? (4) What is the Auckland–Hamilton fibre link latency? The follow-up context provided in the corpus brief answers questions 1–3 directly; latency is unconfirmed. These answers are incorporated below.

---

## Problem Statement

The payment operations team runs a real-time card payment authorisation service that processes approximately 180,000 transactions per day for retail and business customers. The service is hosted on-premises at a single data centre in Auckland with no automated failover to any secondary site.

The core problem is an **active breach of board-approved disaster recovery policy**: the Board Risk Committee has approved a policy requiring Recovery Time Objective (RTO) ≤ 2 hours and Recovery Point Objective (RPO) ≤ 15 minutes for critical payment systems. The current infrastructure cannot meet either target. Over the past 12 months the service experienced three outages totalling 4.2 hours of downtime — each event demonstrating directly that the board-approved RTO is not achievable with the current single-site architecture.

A second, compounding problem exists: an internal audit has identified that the organisation cannot confirm whether transaction records replicate to a secondary site within the Anti-Money Laundering and Countering Financing of Terrorism Act's statutory 5-year retention window. This replication gap is logged as an audit finding but remains unresolved. When the primary Auckland data centre is unavailable, operational continuity and statutory AML/CFT compliance obligations fail simultaneously from a single point of failure.

The direct financial cost is approximately $340,000 per hour in failed transaction revenue and $80,000 per hour in call centre escalation volume — approximately $420,000 per outage-hour. At 4.2 hours of documented downtime in the past 12 months, the estimated direct annual exposure is approximately $1.76 million in loss from downtime alone, excluding regulatory penalty risk.

The problem is not "we need a secondary site" — the problem is that the organisation is in breach of its own board-approved policy, carrying an unresolved AML/CFT audit finding, and absorbing quantifiable losses from a preventable single point of failure.

---

## Who It Affects

**Payment operations engineers** — responsible for incident response, failover execution, and service restoration. With no automated failover and no secondary processing site, they are unable to achieve the 2-hour RTO target. During outages they execute manual, unstructured recovery procedures with no defined escalation path to a secondary site.

**Security and compliance team** — holds the PCI DSS (Payment Card Industry Data Security Standard) relationship with the organisation's Qualified Security Assessor (QSA) and owns the AML/CFT Act compliance obligation. Any architectural change to the payment authorisation service must be assessed by the QSA before go-live. The team also holds accountability for closing the internal audit finding on AML/CFT transaction record replication.

**Board Risk Committee** — approved the current disaster recovery policy requiring RTO ≤ 2 hours and RPO ≤ 15 minutes. The committee currently receives evidence of active non-compliance against a policy it explicitly approved. Closing this gap is a governance obligation with board-level visibility.

---

## Why Now

**Board-approved policy is in active breach.** The RTO and RPO targets are not aspirational — they are Board Risk Committee-approved policy, and the past 12 months have produced three empirical demonstrations of non-compliance. Each additional outage compounds the governance exposure.

**Q3 QSA audit creates a hard deadline.** The annual PCI DSS audit by the Qualified Security Assessor is scheduled for Q3 of this year. Any architectural change to the payment authorisation service requires QSA assessment before go-live. Initiating now gives time for QSA scoping (the existing relationship enables preliminary conversations within approximately 2 weeks) and implementation ahead of the Q3 deadline. Delaying risks presenting incomplete work to the QSA.

**AML/CFT internal audit finding is open.** The replication gap to the secondary site is a documented, unresolved internal audit finding. External AML/CFT regulatory examinations require organisations to produce transaction records within the statutory period. An unverified gap is material regulatory exposure that grows over time if unaddressed.

**Cost is quantified and unambiguous.** At approximately $420,000 per downtime-hour, the ROI on any DR investment is straightforward. The organisation is not facing a business case question — it is facing a policy, compliance, and financial loss question with a known cost per delay.

---

## MVP Scope

The MVP delivers two connected capabilities: automated secondary-site failover within board-approved RTO/RPO targets, and confirmed AML/CFT statutory retention compliance at the secondary site.

**In scope:**

1. **Secondary site provisioning for active transaction processing** — configure the Hamilton co-location facility (currently used for backup storage; available rack space and direct fibre connection to Auckland are confirmed) to process 100% of payment authorisation transaction volume during a failover event. Active-passive configuration only (primary active, secondary on standby; secondary activates at failover). Partial transaction routing is not an option — the secondary site must handle full volume.

2. **Automated failover trigger and execution** — failure detection and automated or operator-initiated failover initiation capability that brings the secondary site to active processing status within the 2-hour RTO window from the point of primary site failure detection.

3. **Replication to RPO ≤ 15 minutes** — continuous data replication from primary to secondary site such that the secondary site can resume from a transaction state no more than 15 minutes stale at the point of primary failure.

4. **AML/CFT replication verification and gap closure** — verify and document that transaction records replicate to the Hamilton secondary site within the AML/CFT Act's statutory 5-year retention window. The current batch replication to Hamilton has not been validated against this requirement. If the existing replication mechanism does not satisfy the requirement, it must be upgraded. The internal audit finding must be formally closed with auditable evidence.

5. **QSA assessment engagement** — scope and complete the required PCI DSS architectural assessment with the existing QSA firm before the Q3 audit go-live deadline. The Hamilton site, once configured as an active cardholder data environment node, expands PCI DSS scope and must be assessed.

6. **Operational runbook and DR drill** — documented failover procedure executable by the operations team with existing skill levels. Tested in at least two controlled DR drills before Q3.

---

## Out of Scope

- **Active-active multi-site configuration** — the MVP is active-passive failover only. Active-active processing across Auckland and Hamilton introduces significant architectural complexity and expands PCI DSS scope substantially. Deferred beyond MVP.
- **Changes to fraud screening or AML transaction analysis logic** — the secondary site must run the same payment authorisation logic as the primary. No changes to fraud scoring models, AML screening rules, or risk thresholds are in scope.
- **Merchant and customer notification automation during failover events** — outage communication workflows are handled through existing incident management channels. Automated customer or merchant DR notifications are out of scope.
- **Tertiary site or geographic distribution beyond Auckland–Hamilton** — this initiative addresses the single-pair Auckland–Hamilton topology only.
- **Retention policy redesign** — the 5-year AML/CFT obligation is defined by statute and is not subject to change in this initiative. The scope is to verify and confirm compliance with the existing statutory obligation.
- **Payment card product changes** — no changes to card scheme rules, interchange logic, or customer-facing payment product features.

---

## Assumptions and Risks

**[ASSUMPTION] AML/CFT replication gap at the Hamilton site is unverified and may require a mechanism upgrade** — the internal audit finding states that the current replication process to Hamilton has not been confirmed to capture all transaction records within the 5-year statutory retention window. Per the follow-up context, this gap has been logged but not remediated and has not been verified. The batch replication process may or may not satisfy the AML/CFT requirement without modification. The design for closing this gap cannot be finalised until a verification exercise confirms the current replication mechanism's coverage. Requires /clarify before scope is locked.

**[ASSUMPTION] Hamilton co-location facility can sustain 100% payment authorisation transaction volume** — available rack space and a direct fibre connection are confirmed. However, the Hamilton site is currently configured for backup storage, not active transaction processing. Whether the site's power, cooling, network capacity, and available compute can sustain 180,000 transactions per day at the latency tolerances required for card authorisation must be confirmed before this topology is committed to. Requires /clarify before scope is locked.

**[ASSUMPTION] QSA assessment for the architectural changes can be completed before the Q3 go-live deadline** — the existing QSA relationship allows preliminary scoping conversations to begin within approximately 2 weeks. Whether a full architectural assessment for the proposed changes — including Hamilton site PCI DSS scope expansion — can be completed and cleared before the Q3 audit date depends on QSA availability and the complexity of findings. This is a schedule risk that must be confirmed early. Requires /clarify before scope is locked.

**[ASSUMPTION] Auckland–Hamilton fibre link latency is compatible with RPO ≤ 15 minutes** — a direct fibre connection exists but link latency is unconfirmed. RPO of 15 minutes using near-synchronous replication imposes upper bounds on acceptable round-trip latency. If latency is higher than expected, the replication architecture must accommodate this, potentially with asynchronous replication and explicit RPO testing. Requires /clarify before scope is locked.

**Risk — PCI DSS scope expansion to Hamilton site:** Bringing the Hamilton facility online as an active cardholder data environment node expands the PCI DSS audit scope to include the Hamilton site's physical security, network segmentation, access controls, and monitoring. If the QSA identifies deficiencies at the Hamilton site, additional PCI DSS remediation work may be required before go-live, extending delivery timeline.

**Risk — Q3 audit deadline leaves limited implementation margin:** If QSA scoping, Hamilton site provisioning, replication configuration, AML/CFT verification, and DR testing cannot all be sequenced before the Q3 audit date, the organisation may enter the QSA audit with incomplete work. This is a delivery timeline risk requiring early scheduling confirmation.

---

## Directional Success Indicators

**Failover RTO compliance:**
- Baseline: No secondary site processing capability exists. Last demonstrated recovery time: 3 outages totalling 4.2 hours in 12 months — no recovery completed within the 2-hour RTO target.
- Target: Failover from primary site failure detection to payment authorisation processing resuming on the secondary site completes in ≤ 2 hours, demonstrated on 2 of 2 controlled DR drills before the Q3 QSA audit.
- Measured via: Timed DR drill test logs captured by operations team; independent verification by internal audit or QSA observer.

**RPO compliance:**
- Baseline: [UNKNOWN BASELINE] — RPO in a failover scenario has never been measured. No secondary processing site exists to measure against.
- Target: At the point of simulated primary site failure, the secondary site's transaction state is no more than 15 minutes stale. Confirmed in DR drill by reconciling the last committed transaction on the primary at the point of failure with the first available state on the secondary.
- Measured via: Replication lag monitoring dashboard; reconciliation report from DR drill post-mortem.

**AML/CFT internal audit finding closed:**
- Baseline: Internal audit finding open — replication of transaction records to Hamilton within the 5-year statutory AML/CFT retention window is unverified.
- Target: Audit finding formally closed. Auditable evidence demonstrates that all transaction records are replicated to the Hamilton secondary site with no gaps within the AML/CFT Act's 5-year retention window. Evidence reviewed and signed off by internal audit before Q3 QSA audit.
- Measured via: Replication log reconciliation over a representative sample period; internal audit sign-off letter.

**Operational readiness without unplanned escalation:**
- Baseline: Current failover relies on manual, undocumented escalation procedures. Mean time to first action during the three recorded outages is not documented.
- Target: Operations team can execute a full failover using the documented runbook — no undocumented workarounds, no unplanned escalations — within the 2-hour RTO window in a DR drill.
- Measured via: DR drill post-mortem; runbook completeness checklist; operations team sign-off.

---

## Constraints

**C1 — RTO ≤ 2 hours, RPO ≤ 15 minutes (Board Risk Committee-approved disaster recovery policy):** Both targets are non-negotiable. They are set by board-approved policy, not by project preference. Any technical design that cannot demonstrably achieve both targets is not a valid solution for this initiative.

**C2 — PCI DSS compliance: QSA assessment required before any architectural change goes to production:** The payment card data processed by this service is in scope for PCI DSS. Any architectural change to the payment authorisation service — including secondary site activation, replication mechanism changes, and failover tooling — must be assessed by the Qualified Security Assessor before go-live. The Q3 annual QSA audit is the governing hard deadline.

**C3 — AML/CFT Act: 5-year transaction record retention, replication to secondary site must be verified:** The Anti-Money Laundering and Countering Financing of Terrorism Act mandates that transaction records are retained for 5 years. The current disaster recovery plan does not address whether records replicate to the secondary site within this window. This gap is an open internal audit finding. The implementation must close this gap and produce auditable evidence suitable for regulatory examination.

**C4 — Single active data centre (Auckland); no secondary processing capability currently exists:** The payment authorisation service runs from a single Auckland data centre. There is no automated failover infrastructure and no secondary site capable of active processing. The Hamilton co-location facility is the candidate secondary site but is currently configured for backup storage only.

---

## /clarify recommendation

This discovery contains 4 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] AML/CFT replication gap at the Hamilton site is unverified and may require a mechanism upgrade — the internal audit finding states that the current replication process to Hamilton has not been confirmed to capture all transaction records within the 5-year statutory retention window. The batch replication process may or may not satisfy the AML/CFT requirement without modification. Requires /clarify before scope is locked.
- [ASSUMPTION] Hamilton co-location facility can sustain 100% payment authorisation transaction volume — the site is currently configured for backup storage, not active transaction processing. Whether it can sustain 180,000 transactions per day at card authorisation latency tolerances must be confirmed before committing to this topology. Requires /clarify before scope is locked.
- [ASSUMPTION] QSA assessment for the architectural changes can be completed before the Q3 go-live deadline — preliminary scoping can begin within 2 weeks, but whether full assessment clears before the Q3 date depends on QSA availability and finding complexity. Requires /clarify before scope is locked.
- [ASSUMPTION] Auckland–Hamilton fibre link latency is compatible with RPO ≤ 15 minutes — link latency is unconfirmed. If latency is higher than acceptable for near-synchronous replication, the replication architecture must accommodate this. Requires /clarify before scope is locked.

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

## Attribution

**Contributors:**
- Copilot — discovery skill, eval mode (Config C run 2, EXP-003-pipeline-eval) — 2026-05-14

**Reviewers:**
- [Pending]

**Approved By:**
- Pending

<!-- eval-mode: true -->
