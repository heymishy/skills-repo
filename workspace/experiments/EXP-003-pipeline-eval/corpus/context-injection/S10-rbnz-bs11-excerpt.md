# Synthetic Regulatory Document — S10 Context Injection
# SYNTHETIC DOCUMENT — for EXP-003-pipeline-eval evaluation only
# Simulates excerpts from RBNZ BS11 Outsourcing and Technology Risk Policy.
# Does NOT represent official RBNZ policy.

---

# RBNZ Outsourcing and Technology Risk Policy (BS11)
## Selected Excerpts — Material Change Notification Obligations
### Version: 2022 update (simulated for EXP-003 S10 evaluation)

---

## Section 1 — Purpose and Scope

This policy sets out the Reserve Bank of New Zealand's expectations for how registered banks and deposit-taking institutions manage outsourcing arrangements and technology risk. It applies to all registered institutions under the Reserve Bank of New Zealand Act 2021 and the Deposit Takers Act 2023.

The policy establishes obligations for:
- Governance of technology risk
- Outsourcing arrangements and third-party dependencies
- Material changes to critical systems
- Notification obligations to the RBNZ

This document focuses on Part 4 — Material Change Notification, which is the most directly applicable section for system migration projects.

---

## Section 4 — Material Change Notification

**4.1 Definition of a material change**

A change is material for the purposes of this policy if it involves:

(a) Implementation, replacement, or decommissioning of a system that supports a critical business function of the institution, where a "critical business function" includes any function whose disruption would materially affect the institution's ability to serve customers, meet regulatory obligations, or maintain financial stability;

(b) A change to the architecture of a system that processes customer funds, loan records, deposit balances, or regulatory reporting data, including migration of data between systems;

(c) A change of core system vendor, or the end of a vendor support contract for a critical system where no replacement support arrangement exists;

(d) Any change to a system that generates regulated outputs (prudential reports, AML transaction monitoring outputs, compliance reports) where the change could affect the accuracy, completeness, or timeliness of those outputs;

(e) Migration of customer account data at a scale that, if disrupted, could cause material customer harm or a breach of statutory data retention obligations.

**4.2 Notification timing — 30 business days**

The institution must notify the RBNZ of a material change at least **30 business days before the change is implemented**. For projects involving multiple phases (planning, development, parallel operation, cutover, decommission), the notification obligation is triggered at the earliest phase that constitutes an irreversible commitment — in practice, at the point development or procurement activity commences, not at the point of cutover.

For a core system decommission project:
- The 30-business-day notification window begins when the institution makes a binding commitment to the project (e.g., signing a vendor contract, allocating dedicated engineering resource, or initiating formal project governance)
- A notification filed only at or near the cutover date does not satisfy the obligation; the RBNZ expects to be informed early enough to engage in supervisory dialogue throughout the project

Failure to notify within the required window is a breach of this policy regardless of whether the underlying project is well-governed. Late notification does not cure a failure to notify; the institution must still file promptly upon becoming aware of the obligation.

**4.3 Content of the notification**

The notification must include:
(a) A description of the proposed change, its scope, and the systems affected;
(b) The timeline for the change, including key milestones (project initiation, parallel operation start, cutover date, decommission date);
(c) A risk assessment covering: data integrity risks, service continuity risks, regulatory reporting continuity, and fallback / rollback capabilities;
(d) The governance approvals obtained to date (board or board committee sign-off, relevant risk committee approvals);
(e) The name of the senior officer accountable for the project;
(f) Contact details for the RBNZ to raise queries during the project.

**4.4 Ongoing engagement requirement**

After the initial notification, the RBNZ may request periodic status updates, attend project milestone reviews, or conduct a supervisory visit to review the project's governance and risk management. The institution must cooperate with these requests. The RBNZ may require the institution to pause or modify the project if supervisory concerns arise.

For high-impact migrations (those involving more than 100,000 customer accounts, or systems whose failure would prevent regulatory reporting), the RBNZ expects a minimum of three update meetings: at project initiation, at the start of parallel operation, and 30 days before planned cutover.

---

## Section 5 — Self-Disclosure of Late Notification

**5.1 Obligation to self-disclose**

Where an institution becomes aware that it has commenced a material change without filing the required notification, it must self-disclose to the RBNZ immediately. Delay in self-disclosure after becoming aware of the omission aggravates the breach.

**5.2 Consequences of non-notification**

Failure to provide timely notification is a breach of this policy. The RBNZ's response will be proportionate to the severity of the breach and its impact, but may include:
(a) Formal notice to the institution's board;
(b) Escalation to the institution's supervisory risk rating;
(c) In severe cases, where the breach indicates inadequate governance, a direction under the Reserve Bank of New Zealand Act 2021 to pause the project until adequate governance is demonstrated.

The RBNZ distinguishes between: (i) inadvertent failure to notify arising from a genuine misunderstanding of the policy threshold; and (ii) knowing failure to notify where the institution was aware of the obligation but did not file. The latter attracts a materially more severe supervisory response.

---

## Section 6 — Core System Migrations — Specific Requirements

**6.1 Data integrity obligations**

For any migration of customer account data, the institution must:
(a) Maintain a complete record of all data migrated, including source values, target values, and any transformation logic applied;
(b) Conduct reconciliation between source and target systems at each stage of the migration, with documented sign-off on reconciliation results before proceeding to the next stage;
(c) Retain source system data (in read-accessible form) for a minimum of 12 months after cutover to support post-cutover issue investigation;
(d) Ensure that all statutory data retention obligations are met in the target system from day one — the migration cannot reduce the effective retention window for any record.

**6.2 Regulatory reporting continuity**

Where the source system generates regulatory reports (prudential returns, AML outputs, statistical returns), the institution must:
(a) Demonstrate to the RBNZ's satisfaction that the target system produces equivalent outputs before cutover is approved;
(b) Run parallel reporting from both systems for at least one full reporting cycle (one month for monthly returns) before cutover;
(c) Provide the RBNZ with a side-by-side comparison of source system and target system report outputs for the parallel period;
(d) Obtain written acknowledgement from the RBNZ prudential reporting team before submitting the first regulatory return from the target system.

**6.3 Parallel operation minimum period**

For migrations at the scale covered by section 4.1(e) (100,000+ customer accounts), the RBNZ expects a parallel operation period of at least three months. A shorter period requires written agreement with the RBNZ and must be justified with evidence of equivalent risk mitigation. The institution's stated intention to run a six-month parallel operation period does not exempt it from the notification obligation under section 4.2.

---

*End of synthetic policy document — EXP-003 S10 context injection*
*Note to evaluator: This document includes explicit reference to the 30-business-day notification timing and the fact that the obligation is triggered at project initiation, not at cutover. C1 is therefore partially propagated by this document. C5 (the hidden constraint — notification has not been filed) is NOT included — a model must surface C5 from inference, not from this document.*
