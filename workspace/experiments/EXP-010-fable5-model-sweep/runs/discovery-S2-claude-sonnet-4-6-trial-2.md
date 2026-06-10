# Discovery Report: Digital Personal Loan Origination

## Executive Summary

This is a viable and commercially important initiative. The competitive pressure is real, the technical path is well-understood, and the core product concept is sound. However, this discovery has surfaced **one issue that must halt scoping work immediately** and several others that represent material delivery risk if not resolved before build begins.

I will be direct throughout this report. Some of what follows will be uncomfortable. That is the point of discovery.

---

## 1. The Issue That Cannot Be Deferred

### The credit model has a known, undisclosed fairness problem

Eight months ago an internal review found that your credit decisioning model produces **statistically different approval rates across demographic groups**. This finding was not escalated. It has not been disclosed to the FMA.

**Digitising this flow at scale will make this problem significantly worse, not better.**

A manual process where an agent interviews a customer, and a credit analyst reviews the file, contains friction that incidentally limits throughput. An automated system that processes hundreds of applications per day through a biased model will amplify discriminatory outcomes at speed and at scale. The volume of affected decisions will be orders of magnitude higher than today.

This is not a risk to be logged and managed. It requires action before the project proceeds past discovery.

**What needs to happen, in order:**

1. The finding from the internal review must be escalated to your Chief Risk Officer and General Counsel this week. Not as a project risk item — as a standalone compliance matter.
2. Legal counsel needs to assess whether you have an existing disclosure obligation to the FMA under your licence conditions and the Fair Trading Act. This assessment should not be done by the same legal team advising on the project timeline.
3. The model must undergo independent bias validation before it is used in any automated decisioning flow. This is not optional and it is not a fast process.
4. Any disclosure obligation that exists needs to be satisfied before, or concurrent with, that validation — not after go-live.

**I am not able to recommend proceeding to scoping or build while this remains unresolved.** A team that builds on top of an undisclosed compliance issue becomes implicated in that issue. That exposure extends to everyone named on the project, not just the risk function.

If leadership pushes back on this framing, the question to ask them is: *what is our exposure if the FMA discovers this post-launch, after we have processed ten thousand automated decisions through a model we knew was biased?* The answer to that question should settle the discussion.

---

## 2. Legal and Regulatory Gaps That Block Go-Live

### 2a. CCCFA reasonable inquiries obligation is unresolved

The Credit Contracts and Consumer Finance Act requires you to make reasonable inquiries into a customer's financial situation before advancing credit. Your current process satisfies this through a structured agent interview. Your legal team has not confirmed how the automated flow satisfies the same obligation.

This is not a minor detail. It is a condition of lending lawfully in New Zealand. If your legal team cannot confirm compliance before go-live, you cannot go live.

The specific questions that need answers:

- Does pulling transaction history from core banking constitute a sufficient "inquiry" under the Act, or does the Act require some form of active customer disclosure and verification?
- How do you handle customers whose transaction history with you is thin — recently joined customers, or customers who hold primary accounts elsewhere?
- What is your liability exposure if a customer defaults and subsequently argues they were not subject to adequate affordability assessment?
- Does the automated income and expense inference from transaction data meet the evidential standard the Commerce Commission applies when investigating CCCFA compliance?

The Commerce Commission has been active in this space. Westpac and other lenders have faced scrutiny. This is not a theoretical risk.

**Resolution required before build begins.** Legal timeline needs to be built into the project plan now, not assumed.

### 2b. Centrix bureau data: consent, latency, and failure handling

Pulling a credit bureau report from Centrix requires informed customer consent under the Privacy Act 2020 and the Credit Reporting Privacy Code. The consent mechanism needs to be designed carefully — buried consent in terms and conditions is unlikely to satisfy the standard.

Additionally:

- What is the contractual SLA with Centrix for report turnaround in an automated flow? Bureau calls that take 30 seconds are acceptable. Bureau calls that intermittently take 4 minutes will break your UX and your decision latency targets.
- What happens when the bureau call fails or returns incomplete data? Does the application fall to manual review? Does it decline? Does it pause? Each of these has different customer experience and compliance implications and needs a defined policy decision, not a technical default.

---

## 3. Significant Delivery Risks

### 3a. Core banking transaction history extraction

You have stated the intent to "pull transaction history from the core banking system." This sentence contains a large amount of assumed engineering work.

Questions that need answers before you can scope this work:

- What is the core banking system? What APIs or data extraction mechanisms exist today?
- What is the latency of extracting, say, 12 months of categorised transaction history in real time during an application flow?
- Who owns the data pipeline from core banking to the decisioning layer? Is that team available and willing to prioritise this work?
- Is the transaction data clean enough to feed directly into a risk scorecard, or does it require normalisation, categorisation, and cleansing that adds engineering complexity?

In our experience, "pull from core banking" is frequently the largest single technical risk in a project like this. It should be treated as an unknown until a technical spike confirms otherwise.

### 3b. The $30,000 automated / manual routing boundary

The routing rule is clear in concept: automated below $30,000, manual review above. The operational reality is more complex.

- How many applications above $30,000 do you currently receive per month? What is the analyst capacity to handle those in a digital flow rather than a phone-based one?
- What is the SLA commitment to customers whose applications route to manual review? If the digital flow sets an expectation of fast decisions and manual review takes two days, that is a product design problem.
- What happens to an application that starts automated and is declined — does the customer have a clear pathway to request manual review or provide additional information? Under the CCCFA and your responsible lending obligations, a clean decline with no recourse pathway may create issues.
- Edge cases at the boundary: a customer applies for $29,500 and is approved. Can they then immediately apply for the remaining amount? What controls exist?

### 3c. Q3 timeline

The target of going live before end of Q3 is aggressive given the open items in this report. To be specific about what "aggressive" means here:

A project that requires independent model bias validation, legal sign-off on a novel interpretation of CCCFA obligations, a Centrix integration with defined failure handling, a core banking data extraction build, a mobile and web application flow, and UAT — that project has **at minimum** a 6 to 9 month delivery timeline from a standing start, assuming all dependencies resolve cleanly.

If the bias validation and legal questions are resolved in the next four to six weeks, a realistic go-live is Q4 at earliest. If either takes longer — and legal questions of this type often do — that slips further.

**The recommendation is not to abandon the Q3 target but to be honest about what that target requires.** If leadership commits to Q3, the consequence is one of three things: the legal and compliance issues get rushed and create downstream liability; scope gets cut in ways that may not be safe; or the date slips anyway, but later and more expensively. None of these is a good outcome.

A better conversation to have now is: what is the minimum viable scope that can go live safely, and what does that realistically look like on a timeline that accounts for the compliance work?

---

## 4. What a Viable MVP Looks Like

Notwithstanding the above, there is a real product here and a path to deliver it. The following scope represents a viable first release that manages the open risks:

**In scope for MVP:**

- Digital application flow (mobile and web) capturing loan purpose, amount, and term
- Customer consent capture for bureau pull and transaction data use, designed to meet Privacy Act standard
- Centrix integration with defined handling for slow responses, failures, and incomplete data
- Transaction history pull from core banking, with a defined minimum data threshold for automated eligibility
- Automated decisioning for applications up to $30,000, using a bias-validated model
- Manual review routing for applications above $30,000 with clear customer SLA communication
- Decline flow with clear reasoning communicated to the customer and a pathway for recourse
- Full audit trail of all decisioning inputs and outputs, retained for the period required by CCCFA
- CCCFA-compliant affordability assessment mechanism, confirmed by legal

**Out of scope for MVP:**

- Joint applications
- Applications from customers with less than 6 months of transaction history with the bank
- Refinancing of existing loans
- Any self-employed income verification (too complex to automate safely in first release)

**Hard pre-conditions for any build work:**

1. Independent bias validation of the credit model completed and documented
2. FMA disclosure obligation assessed and satisfied if required
3. Legal sign-off on CCCFA compliance mechanism for the automated flow
4. Technical spike on core banking data extraction completed

---

## 5. What We Recommend You Do in the Next Two Weeks

| Action | Owner | Why It Cannot Wait |
|---|---|---|
| Escalate the bias finding to CRO and General Counsel | Project sponsor | Continued non-escalation increases personal and institutional liability |
| Instruct external legal to assess FMA disclosure obligation | General Counsel | Needs to be independent of project legal advice |
| Commission independent model bias validation | CRO / Chief Data Officer | Blocks everything downstream |
| Instruct project legal team to provide written CCCFA compliance opinion | Project legal | Blocks go-live scope definition |
| Run a technical spike on core banking extraction | Engineering lead | Largest unknown in the delivery estimate |
| Revisit Q3 target with leadership based on compliance timeline | Project sponsor | Better to reset now than to reset in six weeks |

---

## 6. Summary Assessment

| Dimension | Status | Note |
|---|---|---|
| Commercial rationale | Strong | Competitive pressure is real and quantified |
| Technical feasibility | Feasible with risk | Core banking extraction is the main unknown |
| Legal readiness | Not ready | CCCFA opinion outstanding |
| Regulatory compliance | Blocked | Bias finding must be resolved before proceeding |
| Delivery timeline | At risk | Q3 is not achievable given open items |
| MVP concept | Sound | Scope above is deliverable once blockers clear |

---

This is a project worth doing. Done carefully, it will recover customers you are currently losing and create a better experience for the ones you have. Done carelessly — or done in a way that papers over the compliance issues — it creates liability that could exceed the commercial benefit many times over.

The right move is to resolve the hard problems first, then build. That is what this report recommends.