# /discovery Pipeline Analysis: Consent Management API

## Executive Summary

This is a **well-intentioned programme with genuine customer value**, but there are **material discovery gaps** that need resolution before you can confidently commit to the 6-month timeline and Day 1 enriched insights launch. The risks are not architectural—they're primarily regulatory, operational, and around third-party dependencies.

---

## Critical Discovery Issues

### 1. **Enriched Insights Classification & Regulatory Exposure** 🚩

**The core tension:** Your privacy team has validated the consent model, but enriched insights sit in regulatory grey zones that deserve explicit scoping.

**Key unknowns:**

- **Are enriched insights "personal information" or "inferred personal information"?**
  - Spending category breakdowns + estimated income + 90-day projections are *derived*, not raw. Under most Privacy Acts (AU/NZ), inferences about individuals are treated as personal information.
  - But *how* they're generated matters for consent adequacy. If your analytics engine makes unexplained predictions (e.g., "likely to default in 6 months"), does generic consent to "enriched insights" cover that?
  - **Action:** Get explicit confirmation from privacy counsel that the consent disclosure language is sufficient for *all current and planned* insight types. Include a worked example showing how "spending category breakdown" is explained to customers.

- **Do enriched insights trigger additional regulatory obligations?**
  - If these insights inform credit or lending decisions, they may fall under credit reporting legislation (e.g., *Privacy Act 1988* (Cth) Part IIIA in Australia, or equivalent in your jurisdiction).
  - Automated decision-making rules (e.g., "if projected balance < $X, flag as risk") may require transparency notices under emerging AI/algorithmic fairness regimes.
  - **Action:** Confirm with compliance whether insights are used by third parties for automated decision-making. If yes, scope obligations under credit reporting and algorithmic transparency frameworks.

- **Will you audit how third parties *use* enriched insights?**
  - Your consent grants access, but if a fintech uses your income estimates to deny a loan, and the estimate is wrong, liability questions arise.
  - You won't police this without audit rights in your third-party contracts.
  - **Action:** Define audit scope and third-party contractual obligations for enriched insights. Decide: is use auditing in scope for Day 1, or Phase 2?

---

### 2. **Third-Party Accreditation & Ongoing Compliance** 🚩

**You've identified a strong control (validate accreditation on every call), but the operational model is underspecified.**

**Key unknowns:**

- **Who is the accreditation authority, and what's their SLA?**
  - You mention "a designated accreditation authority." Is this an external regulator (e.g., ACCC, FCA, CMA), a self-regulatory body, or internal?
  - If external, do they have published standards, or are you defining the bar yourself?
  - What's the timeline for accreditation decisions? If it's slow, your Day 1 launch will have fewer partners ready.
  - **Action:** Confirm the accreditation authority and published criteria. Map their timeline to your 6-month launch window. (If they don't exist yet, this is a blocker.)

- **What triggers loss of accreditation, and what's your revocation SLA?**
  - "Lose accreditation" is vague. Data breaches? Misuse of data? Failure to delete on revocation? Regulatory action?
  - Once accreditation is revoked, how quickly can a third party's API access be disabled? Seconds? Hours? 
  - What happens to data they already hold—do you have contractual right to demand deletion, or is it voluntary?
  - **Action:** Define accreditation revocation triggers and your SLA to block API access. Model a breach scenario: *"Fintech X loses accreditation on Monday morning. By what time are their API credentials revoked? How do you verify deletion of customer data they accessed on Friday?"*

- **How will you detect non-compliance?**
  - You can revoke accreditation, but only if you *know* it's lost. How do you stay informed about third-party regulatory actions or complaints?
  - Do you subscribe to regulatory alerts? Monitor news? Require third parties to self-report issues?
  - **Action:** Scope a compliance monitoring model for third parties (e.g., quarterly attestations, regulatory feed subscriptions, incident reporting obligations).

---

### 3. **Consent Revocation & Data Deletion** 🚩

**Your model is customer-friendly, but operationally complex. The devil is in the details.**

**Key unknowns:**

- **What does "delete all data received under that consent" mean in practice?**
  - Does it include backups, data warehouses, or ML models trained on that data?
  - If a fintech aggregator has already bundled your customer's transactions into a composite view shared with their users, can they retroactively un-bundle?
  - What's the third party's deletion deadline? Immediate? 30 days? And who audits compliance?
  - **Action:** Draft a "Data Deletion Policy" for third parties specifying what "delete" covers (production + backups; exclusions for aggregates/insights; deadline). Include audit mechanisms. Get privacy counsel sign-off.

- **How will you enforce revocation across your system and the third party's?**
  - Your API will stop serving data post-revocation. But the third party may have cached data in their own systems.
  - Do you have real-time notification of revocation, or do they find out on the next API call?
  - **Action:** Design a revocation notification architecture. At minimum: webhook notification to third party + blocking their API calls. Consider whether you need a revocation query endpoint (third party can ask, "Is consent for customer X still valid?").

---

### 4. **Enriched Insights: Freshness & Accuracy Liability** 🚩

**Enriched insights are generated by your analytics engine. If they're stale or wrong, who bears the risk?**

**Key unknowns:**

- **What's the SLA for enriched insights freshness?**
  - Are spending categories updated daily, weekly, monthly?
  - Is the 90-day balance projection recalculated every time the API is called, or cached?
  - If a fintech relies on stale insights to make a lending decision, and the customer's finances have materially changed, is there liability?
  - **Action:** Define SLAs for each insight type. Document in the API contract. Consider warranty disclaimers (e.g., "insights are indicative, not guaranteed").

- **How will third parties know they're getting the most recent insights?**
  - Add timestamp fields to every enriched insight in the API response. Make it a contractual requirement that third parties refresh before making decisions.
  - Consider adding a confidence score or data quality flag (e.g., `confidence: 0.87` for spending categories, to indicate if the analytics engine has sufficient transaction history).
  - **Action:** Specify API response schema for enriched insights. Include: generated timestamp, refresh timestamp, data freshness indicators, and confidence scores.

---

### 5. **Customer Consent UX & Legal Sufficiency** 🚩

**Granular consent is good, but "meaningful control" depends entirely on how you explain the data types.**

**Key unknowns:**

- **How will you describe enriched insights to customers in the consent flow?**
  - "Spending category breakdowns" is clear. But "estimated monthly income"—how is that calculated? What if it's wrong? Will customers understand they're granting consent to a *derived* figure, not verified fact?
  - Will you show worked examples (e.g., "We estimate your typical monthly groceries spend at $400 based on your last 12 months of transactions")?
  - **Action:** Design consent disclosure language for enriched insights. Get privacy and legal review. User-test with a cohort to ensure plain language and comprehension.

- **Will customers be able to granularly control enriched insights?**
  - Can they consent to "spending breakdowns" but not "projected balance"? Or is enriched insights an all-or-nothing tier?
  - Your brief says "granular," but if enriched insights is bundled, customers have less control.
  - **Action:** Clarify: Are enriched insights broken into sub-types (spending, income, projections) that customers can toggle individually? If all-or-nothing, revise messaging to be honest about granularity limits.

---

### 6. **Data Minimisation & Scope Creep** ⚠️

**Your API exposes four data categories. But enriched insights are at risk of mission creep.**

**Key unknowns:**

- **Will you add new insight types post-launch?**
  - What if your analytics team develops "credit risk score" or "fraud likelihood" insights? Are they in scope for existing consent, or do you need re-consent?
  - Define what falls under "enriched insights" at launch. Any new derived data types should require explicit customer re-consent.
  - **Action:** Lock the definition of enriched insights (spending, income, 90-day projection) for launch. Create a gating process for new insight types: they require privacy review + customer re-consent.

---

## Secondary Discovery Gaps

### 7. **Performance & Scalability of Consent Validation**

- **On every API call, you validate accreditation and consent.** For 10 partners × potentially 100k+ calls/day, this is non-trivial.
  - Do you have a cached consent lookup, or real-time queries to a consent store?
  - What's the acceptable latency for consent validation? Sub-100ms?
  - **Action:** Spec the consent lookup architecture. Define latency SLAs. Load-test with projected call volumes.

### 8. **Audit Trail & Regulatory Reporting**

- You must log every API call (third party, data types requested, customer consent status, data returned) for audit.
  - How long do you retain logs? (Typically, regulators want 7 years for financial data.)
  - Can you produce audit reports on-demand (e.g., "Show me all data accessed by partner X for customer Y")?
  - **Action:** Scope logging schema and retention. Define audit report formats regulators may request.

### 9. **Incident Response & Breach Notification**

- If an accredited partner's credentials are compromised, or they lose accreditation but don't delete data, how do you respond?
  - Do you notify affected customers? Regulators?
  - What's your RTO to block access post-incident?
  - **Action:** Draft an incident response playbook for consent management. Define breach notification SLAs.

---

## 6-Month Timeline Risk Assessment

**Your timeline is ambitious. Here's the gate:**

| Phase | Dependency | Risk |
|-------|-----------|------|
| **Now – Month 2** | Accreditation authority confirmed; Privacy Act review (enriched insights) complete | **HIGH RISK:** If accreditation authority doesn't exist or is slow, this is a blocker. |
| **Month 2 – Month 4** | API design, consent UX, third-party contract templates, deletion policy | **MEDIUM RISK:** Doable if privacy/legal is engaged early. Enriched insights consent wording is time-consuming. |
| **Month 4 – Month 6** | Integration with 10 partners; launch prep & testing | **MEDIUM RISK:** Partners need time to integrate. If accreditation is slow, you won't have 10 ready. |

**Recommendation on enriched insights for Day 1:** Technically feasible, but you're adding complexity when you could defer to Month 2. Consider a **phased launch:**
- **Day 1:** Transaction history, balances, credit card summaries (proven data types).
- **Month 2:** Enriched insights (after privacy review, consent UX polish, audit of analytics engine accuracy).

This buys you time to harden the enriched insights story without delaying the core API launch.

---

## Recommended Next Steps

1. **Confirm accreditation authority** (internal or external?) and their timeline. This is a critical path blocker.
2. **Commission a Privacy Act review** of enriched insights—specifically, whether existing consent language covers all insight types and any regulatory obligations around inferred data or algorithmic transparency.
3. **Define third-party contract terms**: accreditation criteria, data deletion obligations, audit rights, incident reporting.
4. **Draft consent disclosure language** for enriched insights. User-test for comprehension.
5. **Design revocation & consent validation architecture**—especially how you notify partners of revocation and block their access.
6. **Lock the definition of enriched insights** for launch. Plan a gating process for new insight types.
7. **Model a breach scenario** (e.g., partner loses accreditation on Monday; map response SLAs and outcomes).

---

**Bottom line:** The programme is sound in intent, but you need tighter scoping around enriched insights liability, accreditation governance, and revocation enforcement before you can confidently launch. Privacy and compliance review on enriched insights is the critical path item.