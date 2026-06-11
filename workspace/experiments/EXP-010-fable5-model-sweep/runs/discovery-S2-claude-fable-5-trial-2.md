# Discovery Analysis: Digital Personal Loan Origination

## ⚠️ Executive Summary

This initiative has a sound commercial rationale but contains **two critical compliance blockers that must be resolved before any build commitment**, one of which (the undisclosed model bias finding) may constitute an existing regulatory exposure independent of this project. The Q3 target is not credible until these are addressed. Recommendation: proceed with discovery and design in parallel, but gate development funding on regulatory remediation milestones.

---

## 1. Problem Statement

**Current state:** Personal loan origination is fully manual — contact-centre intake into Dynamics, then analyst review combining Centrix bureau data and internal transaction history. End-to-end decision time is 3–5 days.

**Business problem:** Competitor banks (ASB, ANZ) offer same-day digital decisions up to $50,000. Customers are abandoning at the application stage. The cost is measurable in lost origination volume and contact-centre/analyst effort per application.

**Quantification gaps (needed before business case sign-off):**
- Application abandonment rate and volume attributable to decision latency
- Cost per application (agent + analyst time)
- Target conversion uplift and revenue per funded loan
- Volume split above/below the $30,000 auto-decision threshold (determines how much analyst workload actually disappears)

## 2. Proposed Solution (As Stated)

| Component | Description |
|---|---|
| Channels | Mobile app + web application flow |
| Customer inputs | Loan purpose, amount, term |
| Data enrichment | Core banking transaction history + Centrix bureau report |
| Decisioning | Internal risk scorecard → automated decision ≤ $30,000 |
| Manual path | > $30,000 routes to credit analyst queue |
| Scope constraint | Existing enterprise customers only |

## 3. Critical Risks & Blockers

### 🔴 BLOCKER 1 — Undisclosed model bias (severity: critical, pre-existing)

An internal review 8 months ago found **statistically different approval rates across demographic groups**, was not escalated beyond the reviewing team, and has not been disclosed to the FMA.

- This is a **live issue today**, not a future project risk. The model is presumably already in production use for manual decisioning.
- Scaling an unvalidated, potentially biased model into a high-volume automated channel **amplifies the exposure materially** — automated decisions remove the human moderation currently in the loop.
- Potential exposures: FMA fair dealing / conduct obligations (CoFI regime), Human Rights Act 1993 (prohibited grounds of discrimination), CCCFA lender responsibility principles, and governance/escalation failure questions for senior management and the board.
- **The non-escalation itself is a governance finding.** Legal and Risk need to assess whether there is a self-reporting obligation, and that assessment must happen regardless of whether this project proceeds.

**Gate:** No automated decisioning goes live until the model has independent bias validation, a remediation plan if disparity is confirmed, and a documented decision on regulator engagement — owned by CRO/Legal, not the project team.

### 🔴 BLOCKER 2 — CCCFA responsible lending compliance undefined

Reasonable inquiries into the customer's financial situation (affordability and suitability) are currently satisfied by the agent interview. The brief explicitly states **legal has not confirmed how the automated flow satisfies this obligation**.

- This is not a UX detail to resolve later — it **defines the application flow itself**: what inquiries are made, what evidence is collected, how transaction-history analysis substitutes for verbal inquiry, what triggers referral to a human.
- Post-2021 CCCFA amendments and subsequent revisions set specific expectations around affordability assessment. Transaction-history-based income/expense verification can support this, but the methodology must be documented and defensible.
- Suitability inquiries (does the loan purpose/structure meet the customer's requirements and objectives?) also need a digital equivalent.

**Gate:** Legal sign-off on the inquiry/affordability design is a prerequisite for solution design, not a parallel workstream.

### 🟠 Significant risks

| Risk | Notes |
|---|---|
| **Privacy Act 2020 / Credit Reporting Privacy Code** | Customer consent and disclosure for Centrix pulls in a self-service flow; purpose limitation on reuse of transaction data for decisioning. |
| **Automated decision transparency** | Declined customers need adverse-action handling — reasons, bureau-report rights, recourse/appeal path. Design this in from the start. |
| **Timeline pressure vs. compliance gates** | "Go live before Q3 for winter season" is in direct tension with Blockers 1 and 2. Schedule pressure on compliance work is itself a conduct risk. |
| **Manual review queue capacity** | If >$30k applications surge via the easier digital channel, analyst capacity becomes the new bottleneck and the same-day promise fails for that segment. |
| **Core banking + Dynamics integration** | Real-time transaction history retrieval and writing applications back to Dynamics (or replacing it as system of record?) — integration architecture unscoped. |
| **Vulnerable customer pathways** | Manual interviews surface hardship/vulnerability signals; the digital flow needs equivalent detection and off-ramps (CCCFA and CoFI relevance). |

## 4. Stakeholders

| Role | Interest |
|---|---|
| Personal Lending (sponsor) | Conversion, speed to market |
| Credit Risk / CRO | Model validation, bias remediation, scorecard ownership |
| Legal & Compliance | CCCFA design sign-off, FMA disclosure decision, Privacy Act |
| Internal Audit / Board Risk Committee | Non-escalation of the bias finding |
| Credit Analysts | >$30k queue workload, changed role |
| Contact Centre | Channel shift, assisted-digital support |
| Technology | Core banking, Centrix, Dynamics integration; mobile/web delivery |
| Data Science / Model Risk | Independent validation, ongoing monitoring |

## 5. Scope

**In scope:** Digital application flow (mobile + web) for existing customers; data enrichment; automated decisioning ≤ $30k; analyst routing > $30k; adverse-action and consent handling.

**Out of scope / unconfirmed:** New-to-bank customers; loans > $50k; document collection for manual review; loan fulfilment/drawdown (digital or manual?); hardship and top-up journeys.

## 6. Key Open Questions

1. Has Risk/Legal assessed whether the 8-month-old bias finding triggers a self-reporting or breach-notification obligation **now**?
2. Is the existing scorecard certified for *automated* (no human-in-loop) use, or only as decision support?
3. What is legal's position on transaction-data-driven affordability assessment satisfying CCCFA reasonable inquiries?
4. What happens at decision boundaries — marginal scores, incomplete data, detected vulnerability? Auto-decline, refer, or request more information?
5. Centrix integration: existing API capability and contractual terms for real-time, customer-initiated pulls?
6. Does Dynamics remain the system of record, or is origination moving to a new platform?
7. What are the actual volumes and the above/below $30k split?

## 7. Recommended Next Steps (Sequenced)

1. **Immediately (independent of project):** Escalate the bias finding to CRO/Legal for assessment of regulatory disclosure obligations. This cannot wait for project cadence.
2. Commission **independent model validation** (bias + performance) — longest-lead compliance item; start now.
3. Legal workshop to define the **CCCFA-compliant digital inquiry design** — output becomes a hard input to UX/solution design.
4. Quantify the business case (abandonment, volumes, threshold split).
5. Technical discovery: core banking, Centrix, Dynamics integration spikes.
6. Re-baseline the timeline **after** steps 1–3. Present leadership with a compliance-gated plan; if Q3 is unachievable, consider a phased option (e.g., digital intake with 100% manual decisioning first, automation following validation).

## 8. Timeline Assessment

End-of-Q3 go-live with full automated decisioning is **high risk to unachievable** given independent model validation, possible remediation, and CCCFA legal sign-off are all on the critical path. A digital-intake-first phase (capture applications digitally, decide manually) could deliver part of the customer-experience benefit within the window while the decisioning gates are cleared — and would itself reduce the 3–5 day cycle by eliminating agent re-keying.

---

**Bottom line:** Good initiative, wrong sequencing. The bias finding and CCCFA design are not project risks to manage — they are gates to clear, and one of them is already an organisational exposure that exists whether or not this project ships.