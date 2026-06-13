# /discovery Pipeline Analysis: Trans-Tasman Payment Feature

## Executive Summary
This is a **high-value, moderate-risk opportunity** with significant revenue recovery potential (NZD $4.2M annually), but it requires deeper regulatory and operational discovery before proceeding to build. The core concept is sound, but your current confidence level on compliance appears to underestimate complexity.

---

## What's Working Well

✅ **Clear business case** — $4.2M revenue leakage to Wise/remittance services is quantifiable and compelling  
✅ **Existing infrastructure** — Reciprocal routing agreement and group treasury relationship reduce operational lift  
✅ **Competitive positioning** — 2-hour settlement + <$5 pricing directly addresses customer pain  
✅ **Phased approach** — Pilot-before-rollout is sensible risk management  
✅ **Reuse of AML/CFT controls** — Your existing SWIFT screening logic is a foundation

---

## Critical Discovery Gaps

### 🔴 **1. Regulatory Framework (Highest Priority)**

Your statement "regulatory team will manage standard notifications" may underestimate what's required. You need to clarify:

**Obligations to confirm:**
- **NZ side**: Is this a "money transmission" service under the Anti-Money Laundering and Countering Financing of Terrorism Act 2020 (AML/CFT Act)? Your enterprise may already be a Reporting Entity, but the *mechanism* matters.
- **AU side**: Does Australian recipient receive funds via your AU counterpart's own account (not a pass-through)? If so, what are *their* reporting obligations? (AUSTRAC has different thresholds and suspicious matter reporting requirements than RBNZ.)
- **Cross-border notification**: Does RBNZ need to be notified of this new channel *before* launch, or only if threshold events trigger? RBA/AUSTRAC similarly.
- **Correspondent banking**: You're not using a correspondent, but the treasury settlement mechanism may have implications if it looks like you're providing a de-facto settlement service.

**Action:** Schedule calls with RBNZ and AUSTRAC *before* detailed design. Don't assume "standard notifications" will suffice. Consider whether you need formal approval or just notification.

---

### 🔴 **2. AML/CFT Controls Adequacy**

Your compliance team's confidence that existing screening logic "covers requirements" needs to be pressure-tested:

**Specific questions:**
- **Transaction monitoring**: Your SWIFT flow screens at the point of payment instruction. Does your monitoring system flag *patterns* (e.g., multiple small payments to the same AU account, just under $10k threshold)? This is a known structuring risk.
- **Customer due diligence (CDD)**: Are enterprise retail customers already fully CDD'd? If the feature is *new*, do you need to refresh CDD for customers using this channel? (Regulatory risk if you don't.)
- **Third-party risk**: You're relying on your AU counterpart to credit the *actual* AU recipient. What KYC/monitoring does your AU counterpart do? If they're less rigorous, you may inherit their risk.
- **Beneficial ownership**: For payments originating from business customers, can you verify beneficial ownership adequately? (Common gap.)
- **Cross-border threshold reporting**: RBNZ threshold is NZD $3,000 (suspicious matter) or NZD $10,000+ (transaction reporting). Does your system automatically flag these?

**Action:** Commission a formal AML/CFT risk assessment (not internal sign-off). Include your AU counterpart's controls in scope.

---

### 🟡 **3. Payment System Regulation**

**Question to resolve:**
- Is this a "payment instrument" or a "payment service" under NZ's regulatory framework? If it's material enough, FSA/RBNZ may classify it as requiring a license or exemption notification.
- Your AU counterpart: Are they a licensed entity in Australia? If they're settling into customer accounts, AUSTRAC may require reporting.

**Action:** Clarify whether this triggers any payment system licensing obligations. Don't assume it's just "internal treasury flow."

---

### 🟡 **4. Operational & Control Risks**

- **Settlement mismatch**: What happens if a payment instruction fails on the NZ side but succeeds on AU side (or vice versa)? Who carries the risk? Is there a reconciliation SLA?
- **AU counterpart credit risk**: You're now exposed to your AU counterpart's liquidity. What if they can't credit the AU recipient by the 2-hour SLA? (Operational risk + reputational risk.)
- **Pricing $10k threshold**: Payments just below $10k will migrate to the cheap channel; above $10k stay on expensive SWIFT. This creates an incentive to split transactions (structuring risk again). Have you modeled this?
- **Fraud liability**: If a customer's credentials are compromised and fraudulent payments go through the fast channel, who bears the loss? Enterprise or customer? (Affects risk profile and customer messaging.)

**Action:** Map end-to-end failure scenarios. Define operational SLAs and settlement guarantees with AU counterpart in writing.

---

### 🟡 **5. Competitive & Market Validation**

- **Why this, not open API?** Wise's competitive advantage is partially network-based. Have you considered whether an open API to AU partner banks (future state) might be more scalable than a proprietary channel?
- **Customer segments**: Which of your enterprise retail customers actually send to Australia regularly? What's the addressable market size? (You've quantified revenue loss, but not customer count or transaction frequency.)
- **Pilot sizing**: "Small cohort" — how small? 50 customers? 5? Sample size affects what you'll learn about AML/CFT false-positive rates, settlement failures, etc.

---

## Revised Discovery Checklist

| Area | Current State | Required Before Build | Owner |
|------|---------------|----------------------|-------|
| **Regulatory** | "Compliance team comfortable" | Formal RBNZ + AUSTRAC pre-notification + legal memo | Compliance + Legal |
| **AML/CFT** | Existing SWIFT screening reused | Independent risk assessment + AU counterpart control review | Compliance + Audit |
| **Operations** | "2-hour SLA" assumed | Formal SLA agreement with AU counterpart + failure runbooks | Product + Ops |
| **Customer Risk** | Not yet scoped | Fraud liability policy + cardholder agreement updates | Legal + Product |
| **Pilot Design** | "Small cohort" | Sample size justified + success criteria defined | Product + Analytics |

---

## Recommendations

1. **Do NOT proceed to build in the next 2 weeks** until you've:
   - Completed at least an initial RBNZ/AUSTRAC pre-notification conversation
   - Commissioned a dedicated AML/CFT risk assessment
   - Formalized the operational SLA with your AU counterpart in writing

2. **Reframe the 6-month timeline**:
   - Months 1–2: Regulatory + compliance deep-dive
   - Months 2–3: Operational design + AU counterpart formalization
   - Months 3–5: Build + pilot setup
   - Month 6: Pilot + feedback

3. **Assign a regulatory lead** (not just "regulatory team will manage notifications"). This is complex enough to warrant a dedicated owner.

4. **De-risk the AU counterpart dependency**: Get a formal, signed agreement on settlement guarantees, SLAs, and their own AML/CFT controls before you build anything.

---

## Bottom Line

The business case is strong, and the mechanism is workable. But **"we're used to standard notifications" is underestimating the regulatory complexity** of a new international payment channel. You likely need pre-notification approval, not post-launch notification. Invest 4–6 weeks in discovery before committing to the build.