

# Discovery Report: Digital Personal Loan Origination

## Programme Overview

**Initiative:** Digitise the personal loan application journey for existing customers
**Sponsor:** Personal Lending Team
**Discovery Date:** Current
**Target Go-Live:** End of Q3 (winter lending season)

---

## 1. Problem Statement

The current personal loan application process is entirely manual: customers call a contact centre, an agent enters details into Dynamics, and a credit analyst reviews each application using bureau data and internal transaction history. This process takes 3–5 days end to end.

Competitor banks (ASB, ANZ) offer same-day digital decisions, and we are losing customers at the application stage. The business wants a digital origination flow via mobile app and web that automates decisioning for loans up to $30,000 and routes larger applications to manual review.

---

## 2. Stakeholder Map

| Stakeholder | Role in Initiative | Key Concern |
|---|---|---|
| Personal Lending Team | Sponsor / business owner | Speed to market, conversion rates |
| Credit Risk | Scorecard owner, decisioning rules | Model integrity, risk appetite |
| Legal & Compliance | Regulatory sign-off | CCCFA obligations, FMA disclosure |
| Digital / Mobile Team | Channel delivery | UX, integration feasibility |
| Core Banking / Platform | Transaction history API | System availability, data latency |
| Centrix (external) | Credit bureau provider | API integration, SLA, data freshness |
| Contact Centre Operations | Current process owner | Transition plan, volume deflection |
| FMA (external regulator) | Regulatory oversight | Responsible lending, fair conduct |
| Customers | End users | Speed, transparency, fairness |

---

## 3. Current State Process

```
Customer calls contact centre
        │
        ▼
Agent manually captures details into Dynamics
        │
        ▼
Agent conducts verbal inquiry (income, expenses, purpose)
  [This satisfies CCCFA "reasonable inquiries" obligation]
        │
        ▼
Credit analyst retrieves Centrix bureau report
        │
        ▼
Credit analyst reviews transaction history from core banking
        │
        ▼
Credit analyst applies internal risk scorecard manually
        │
        ▼
Decision communicated to customer
        │
    [3–5 days end to end]
```

**Current strengths:** The manual agent interview provides a defensible basis for satisfying responsible lending obligations. Human review provides a natural check against model anomalies.

**Current weaknesses:** Slow, expensive, poor customer experience, uncompetitive.

---

## 4. Proposed Future State

```
Customer initiates application (mobile app / web)
        │
        ▼
Customer enters: loan purpose, amount, term
        │
        ▼
System retrieves internal transaction history (core banking API)
        │
        ��
System requests Centrix credit bureau report (API)
        │
        ▼
System executes internal risk scorecard
        │
        ├── Loan ≤ $30,000 AND scorecard approved
        │       → Automated approval → Loan documents generated
        │
        ├── Loan ≤ $30,000 AND scorecard declined
        │       → Automated decline → Reason provided to customer
        │
        └── Loan > $30,000
                → Routed to credit analyst for manual review
```

---

## 5. Key Assumptions Identified

| # | Assumption | Status | Risk if Wrong |
|---|---|---|---|
| A1 | Existing transaction history is sufficient to satisfy CCCFA "reasonable inquiries" without a verbal interview | **Unvalidated — Legal has not confirmed** | Regulatory breach; FMA enforcement action |
| A2 | The credit decisioning model is fit for automated use | **Unvalidated — known bias concerns** | Discrimination; regulatory breach; reputational damage |
| A3 | Centrix API integration can be delivered within Q3 timeline | Unknown | Delays or degraded decisioning |
| A4 | Core banking system can serve transaction history via API at acceptable latency and reliability | Unknown | Application flow failures or timeouts |
| A5 | Customers will trust and complete a fully digital flow | Unknown | Low conversion despite investment |
| A6 | $30,000 automated threshold aligns with risk appetite | Needs Credit Risk confirmation | Losses exceed appetite, or threshold is too conservative to be competitive |

---

## 6. Critical Risks and Blockers

### BLOCKER 1 — Credit Model Bias (Severity: Critical)

**What we know:** An internal review 8 months ago found that the credit decisioning model produces statistically different approval rates across demographic groups. This finding was not escalated beyond the reviewing team and has not been disclosed to the FMA.

**Why this is a blocker, not just a risk:**

- **Automating a biased model at scale amplifies harm.** A manual process with human reviewers provides some natural friction against discriminatory outcomes. Embedding the same model into a straight-through automated flow removes that friction and will systematically produce discriminatory outcomes at higher volume and velocity.
- **The Financial Markets Authority expects fair conduct.** Under the incoming (and partly effective) Conduct of Financial Institutions regime and existing Fair Dealing provisions in the FMA Act, deploying a model with known differential demographic impact into an automated consumer lending flow without independent validation or remediation creates direct regulatory exposure.
- **Non-disclosure of a known issue compounds the risk.** The fact that differential impact was identified 8 months ago, was not escalated, and has not been disclosed to the FMA means this is not a "we didn't know" situation. Proceeding to automate the model without addressing this converts a governance gap into a potential conduct failure.
- **Reputational risk is severe.** If a customer, journalist, or regulator identifies discriminatory automated lending outcomes and then discovers the organisation had prior internal knowledge, the reputational consequence is materially worse than the underlying model issue.

**Required before proceeding:**
1. Independent validation of the credit model for demographic bias — by a qualified external party, not the team that built the model.
2. Escalation of the existing internal review findings to the Chief Risk Officer and General Counsel immediately, regardless of whether this programme proceeds.
3. Legal advice on whether the FMA needs to be proactively informed of the prior findings and remediation plan.
4. Defined model governance framework for ongoing monitoring of automated decisioning outcomes by demographic group post-launch.

**This blocker exists independently of this programme.** Even if the digital origination project is paused, the existing bias finding requires escalation and remediation. This discovery process has surfaced it as a dependency, but ownership sits with Credit Risk and the executive risk committee.

---

### BLOCKER 2 — CCCFA Responsible Lending Compliance (Severity: Critical)

**What we know:** Under the Credit Contracts and Consumer Finance Act 2003, lenders must make "reasonable inquiries" about a borrower's financial position before entering a credit contract. The current process satisfies this through a verbal agent interview. The automated flow eliminates the interview. Legal has not confirmed whether the proposed digital flow — relying on transaction history and bureau data without direct borrower inquiry — satisfies the statutory obligation.

**Why this is a blocker:**

- If the automated flow does not satisfy "reasonable inquiries," every loan originated through it is potentially non-compliant. The CCCFA provides for significant penalties and borrower remedies for breaches.
- The 2023 CCCFA amendments relaxed some prescriptive requirements but did not remove the core obligation. The question of whether data-driven assessment substitutes for direct inquiry is not settled and requires a formal legal opinion.
- Other banks that have implemented digital origination flows have typically included some form of customer self-declaration (income, expenses) within the digital journey, combined with verification against transaction data. We should not assume we can skip this.

**Required before proceeding:**
1. Formal legal opinion on the minimum requirements to satisfy CCCFA "reasonable inquiries" in a digital-only channel.
2. Design of the digital flow to incorporate whatever customer declarations or confirmations Legal advises are necessary.
3. Review by Compliance of the end-to-end automated flow before go-live, with sign-off documented.

---

### RISK 1 — Timeline Pressure Driving Corners (Severity: High)

The Q3 deadline is commercially motivated (winter lending season). Commercial urgency is legitimate, but the two blockers above are not compressible by timeline pressure. There is a significant risk that pressure to meet the Q3 date will lead to one of:
- Launching with an unvalidated model ("we'll fix it post-launch")
- Launching without a formal legal opinion on CCCFA compliance ("Legal is comfortable in principle")
- Reducing the scope of independent model validation to fit the timeline

**Recommendation:** The programme should define a "minimum viable compliance" gate that is non-negotiable regardless of timeline. If the blockers cannot be resolved by end of Q3, the launch date moves. The cost of a delayed launch is lost competitive positioning for one season. The cost of launching non-compliantly is regulatory enforcement, customer harm, and reputational damage that will take years to remediate.

---

### RISK 2 — Integration Complexity (Severity: Medium)

The solution requires real-time API integration with:
- Core banking system (transaction history)
- Centrix (credit bureau)
- Risk scorecard engine
- Dynamics (existing CRM — unclear if retained)
- Mobile app and web front-end

Each integration carries delivery risk. Core banking systems in particular often lack real-time API capability and may require middleware or batch workarounds. A technical spike should be conducted early to validate integration feasibility and latency.

---

### RISK 3 — Automated Decline Experience (Severity: Medium)

Automated declines at scale create customer experience and conduct risk. Customers who are declined need:
- Clear reasons for the decline (required under CCCFA)
- A pathway to speak to a human if they believe the decision is wrong
- Assurance that the decision was not discriminatory (links back to Blocker 1)

The decline journey needs as much design attention as the approval journey.

---

## 7. Open Questions

| # | Question | Owner | Needed By |
|---|---|---|---|
| Q1 | Does the proposed digital flow satisfy CCCFA "reasonable inquiries"? | Legal | Before design is finalised |
| Q2 | What is the FMA disclosure obligation regarding the known model bias findings? | Legal / Compliance | Immediately |
| Q3 | Can the core banking system serve transaction history via a real-time API? What is the latency and availability SLA? | Platform / Engineering | Before technical design |
| Q4 | What is Centrix's API SLA for credit bureau requests? What is the fallback if Centrix is unavailable? | Centrix / Vendor Management | Before technical design |
| Q5 | Has the $30,000 automated threshold been validated against risk appetite and loss modelling? | Credit Risk | Before decisioning rules are implemented |
| Q6 | What ongoing model monitoring will be in place post-launch to detect drift or emerging bias? | Credit Risk / Data Science | Before go-live |
| Q7 | What is the plan for the contact centre? Will manual applications continue in parallel? | Contact Centre Operations / Business | Before go-live |
| Q8 | What customer data is captured in the digital flow, and what are the Privacy Act and information disclosure obligations? | Legal / Privacy | Before design is finalised |

---

## 8. Recommended Next Steps

### Immediate (this week)

1. **Escalate the model bias finding.** The internal review from 8 months ago must be escalated to the CRO and General Counsel immediately. This is not a programme decision — it is an organisational risk and governance obligation. Document the escalation.

2. **Commission a formal legal opinion on CCCFA compliance** for the proposed digital flow. Provide Legal with a clear description of the proposed journey (what data is collected from the customer, what is retrieved from systems, what is verified) so the opinion is grounded in specifics.

3. **Engage an independent party for credit model validation.** Scope the work, get it commissioned, and understand the timeline. If this cannot complete before end of Q3, the programme leadership needs to know now.

### Next 2–4 weeks

4. **Run a technical spike** on core banking API and Centrix integration to validate feasibility and identify constraints.

5. **Define the "minimum viable compliance" gate** — the set of conditions that must be met before go-live, regardless of timeline. Get executive sign-off on this gate.

6. **Map the decline journey** with as much rigour as the approval journey. Include reason codes, human escalation paths, and complaint handling.

7. **Confirm the $30,000 threshold** with Credit Risk, including stress-tested loss modelling for automated decisions.

### Before committing to build

8. **Receive and act on the legal opinion** (CCCFA compliance).
9. **Receive and act on the model validation results** (bias and fitness for automated use).
10. **Confirm the FMA disclosure position** with Legal and Compliance.

---

## 9. Discovery Summary

This is a commercially sound initiative solving a real competitive problem. The current process is slow, expensive, and losing customers. Digital origination is table stakes for retail lending and the organisation needs to move.

However, this discovery has surfaced two issues that are genuinely blocking: a credit model with known, unescalated bias concerns, and an unconfirmed legal basis for the automated flow's compliance with responsible lending obligations. These are not items that can be risk-accepted and remediated post-launch. They are preconditions.

The Q3 timeline is achievable **if** the blockers are addressed with urgency starting now. If they are deferred or minimised to protect the timeline, the programme carries regulatory, legal, and reputational risk that materially outweighs the commercial benefit of launching one season earlier.

**The strongest commercial move is to launch correctly, not just quickly.**

---

*This discovery report should be reviewed with the programme sponsor, CRO, General Counsel, and Head of Compliance before proceeding to solution design.*