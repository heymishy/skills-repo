# Discovery: Disaster Recovery RTO + AML/CFT Compliance

**Status:** Draft — awaiting approval  
**Created:** 2026-05-14  
**Approved by:** [Pending]  
**Author:** Copilot (structured from production incident briefing)  

---

## Problem Statement

The organisation faces two interconnected, urgent production issues:

**Primary Driver — RTO Violation:** The current disaster recovery (DR) infrastructure does not meet the board-approved Recovery Time Objective of 2 hours. When the primary production site experiences an outage, the failover to the secondary site exceeds this window, resulting in unplanned downtime costing **$420,000 per hour** in lost transaction volume, customer service degradation, and regulatory penalties. This RTO breach is a direct business loss and a contractual liability.

**Secondary Driver — AML/CFT Compliance Gap:** An internal audit has identified that the organisation cannot currently demonstrate whether transaction records replicate to the secondary site within the legally mandated 5-year retention window for Anti-Money Laundering and Combating Financing of Terrorism (AML/CFT) compliance. This gap is documented internally but unresolved. Failure to close this gap creates regulatory risk: if transaction audit trails are not verifiable as retained and replicated per policy, the organisation cannot defend its AML/CFT posture to regulators.

Both issues stem from the same root cause: the current failover and replication strategy does not meet the combined requirements of operational resilience (RTO) and regulatory compliance (data durability and auditability).

---

## Who It Affects

**Operations team** — responsible for incident response and failover execution. When an outage occurs, they cannot achieve the 2-hour RTO target with current tooling and procedures, triggering escalation and board-level post-mortems.

**Finance/Revenue team** — directly impacted by outage cost. Every hour beyond RTO is $420K in lost revenue, making this a top business metric.

**Compliance and Internal Audit** — responsible for AML/CFT attestation. They have flagged the transaction replication gap in audit findings and must certify closure before the next external audit cycle.

**Executive leadership and Board** — have approved the 2-hour RTO as a strategic commitment to customers and regulators. The current breach is a governance failure requiring immediate remediation.

---

## Why Now

1. **Board-approved SLA under active violation:** The 2-hour RTO is not aspirational — it is a published contractual commitment made to customers and a metric tracked by the board quarterly. The current infrastructure consistently exceeds this window.

2. **Audit finding with regulatory exposure:** The AML/CFT replication gap is documented in the most recent internal audit (Q1 2026). Regulatory examination cycles are 18–24 months; the audit finding must be closed and evidenced before the next external audit, or the organisation faces formal regulatory criticism and potential enforcement action.

3. **Cost-benefit is unambiguous:** $420K/hour loss during outage far exceeds any investment in DR infrastructure modernisation. The ROI calculation is straightforward.

4. **Compounded risk:** Operational failure (RTO breach) and compliance failure (AML/CFT gap) create a single failure mode — when the primary site goes down, both business continuity and regulatory compliance break simultaneously.

---

## MVP Scope

**What must be true:**

1. **RTO verification:** Failover from primary to secondary site can be executed (or automated) such that transaction processing resumes within 2 hours of primary site failure, measured from failure detection to first transaction processed on secondary site.

2. **AML/CFT replication verification:** Transaction records are demonstrably replicated to the secondary site in real-time (or within a defined, auditable synchronisation window), and the audit trail confirms that the 5-year retention window is maintained across both sites with no gaps.

3. **Runbook and automation:** Failover procedure is documented, tested, and (where feasible) automated to eliminate manual steps that extend the RTO window.

4. **Observability:** Monitoring, alerting, and dashboards allow the operations team to:
   - Detect primary site failure in < 5 minutes
   - Track replication lag in real-time
   - Execute failover with confidence and track failover completion

**What is explicitly out of scope at MVP:**

- Geo-distributed sites beyond the primary/secondary pair
- Load balancing or active-active configuration (failover-based recovery only, at this phase)
- Data retention policies beyond the 5-year AML/CFT requirement
- Customer-facing communication automation during DR events
- Third-party integration failover (focus on transaction core only)

---

## Constraints

**Regulatory:**
- AML/CFT 5-year transaction record retention is non-negotiable and must be auditable
- Failover must not result in transaction loss or audit trail gaps
- Compliance posture must survive external audit scrutiny (next cycle: ~18 months from now)

**Operational:**
- RTO target is 2 hours, board-approved and contractual
- RPO (Recovery Point Objective) must be specified and aligned with transaction completeness requirements
- Failover procedure must be executable by the operations team with existing skill levels (no new certifications or exotic tooling that the team cannot support)

**Business:**
- Investment in DR modernisation must be justifiable by $420K/hour business loss and audit risk
- Solution must not require wholesale replacement of existing infrastructure (cost constraint)
- Timeline for delivery must align with audit cycle (before next external audit, ~18 months)

**Technical:**
- Current tech stack includes [see product/tech-stack.md for specifics]; DR solution must integrate with existing systems
- No architectural changes to transaction core processing
- Secondary site infrastructure exists and is available for upgrade; solution works with current site topology

---

## Success Criteria (Acceptance Boundaries)

1. **Failover RTO:** Measured in a controlled DR test, failover from primary to secondary completes in < 2 hours from failure detection to transaction processing resumption. This must be repeatable across three consecutive DR drills.

2. **AML/CFT compliance:** Audit trail and replication logs demonstrate that all transactions recorded in the 5-year window are present on both primary and secondary sites, with no gaps, and with timestamped evidence of replication. Internal audit confirms closure of the Q1 2026 finding.

3. **Operations readiness:** The operations team can execute a full failover (or trigger automated failover) with documented runbook, with no undocumented manual workarounds.

4. **Monitoring and alerting:** Real-time dashboards show replication lag, failover status, and transaction flow on both sites. Alerts fire when replication lag exceeds SLA threshold or when failover is triggered.

5. **No production transaction loss:** During a simulated failover test, zero transactions are lost, and the audit trail on the secondary site is complete and reconcilable with the primary site.

---

## Known Constraints & Architecture Notes

- **Current DR tooling:** [existing solution specifics from product/tech-stack.md — to be populated after tech-stack review]
- **Site topology:** Primary active, secondary passive (standby), with asynchronous replication
- **Transaction volume:** [insert current TPS/daily transaction count; required for replication strategy assessment]
- **Network latency:** [primary to secondary; impacts RPO and replication strategy]
- **Existing audit trail mechanism:** [current audit logging and compliance tooling; must integrate with solution]

---

## Open Questions for Definition Phase

1. **Replication strategy:** Is the current asynchronous replication lag acceptable for the 5-year AML/CFT retention requirement, or must we move to synchronous replication (with latency implications)?

2. **Failover trigger:** Is failover manual (operator decision) or automated (heartbeat-based detection)? Automated failover reduces RTO but increases risk of split-brain scenarios.

3. **RPO specification:** What is the acceptable Recovery Point Objective (maximum data loss window)? This drives replication frequency and backup strategy.

4. **Runbook complexity:** Can failover be fully automated, or are there regulatory/manual verification steps that must occur before secondary site starts accepting transactions?

5. **Cost and timeline:** What is the budget envelope for DR modernisation, and what is the target delivery date relative to the next external audit cycle?

---

## Reference Materials

- Internal audit finding (Q1 2026, AML/CFT compliance gap) — to be linked
- Current DR procedure documentation — to be linked
- Recent RTO breach post-mortems — to be linked
- Product constraints and tech-stack — see `product/` directory

---

## Next Steps

**Immediate (this week):**
- Circulate this discovery artefact for approval from Finance, Compliance, Operations, and Executive Sponsor
- Confirm the regulatory audit cycle timeline and any interim reporting requirements
- Collect the open questions answers to unblock definition

**Upon approval:**
- Launch `/benefit-metric` to quantify the business value and compliance risk closure
- Proceed to `/definition` to break discovery into epic+stories for delivery

