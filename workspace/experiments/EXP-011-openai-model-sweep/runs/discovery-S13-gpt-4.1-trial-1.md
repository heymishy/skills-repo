Thank you for the comprehensive overview! I’ll structure my response across key /discovery themes to help sharpen your business case and inform next steps for design, engineering, operations, compliance, and go-to-market.

---

## 1. **Problem & Customer Need**

You’ve defined the problem well:

- **Current State:** Enterprise NZ customers use costly, slow SWIFT-based payments (1–2 days, $18–$25 per tx) to send money to Australia.
- **Pain:** Inconvenient for customers, drives them to Wise/TransferWise and other alternatives.
- **Lost Revenue:** ~$4.2M NZD annually leaves for third-party remitters.
- **Customer Usage:** Your customers have flows to Australia for family/business. Likely need transparency, reliability, speed, and cost-effectiveness.
- **Competitive Gap:** Wise, etc., solve the customer pain much better than current bank solution.

---

## 2. **Proposed Solution**

You’re suggesting a **proprietary channel** using internal group infrastructure:

- **Mechanism:** NZ customer → enterprise NZ (process, screen AML/CTF, debit) → route through treasury → enterprise AU → credit AU recipient bank account.
- **FX/Settlement:** Treasury books manage the net AUD/NZD flows, settled EOD.
- **Speed:** 2-hour customer-facing delivery.
- **Cost:** <$5 per transaction for up to $10k.

---

## 3. **Key Value Propositions**

1. **Speed:** Real-time or 2-hour settlement matches/removes the Wise advantage.
2. **Cost:** $5 is competitive with (and undercuts) Wise/third party, dramatically cheaper than SWIFT.
3. **Trust:** Remain inside regulated bank ecosystem, extend established compliance processes.

---

## 4. **Risks and Considerations**

### **A. Regulatory & Compliance**
- **AML/CFT & Sanctions:** Confirm your transaction-level screening matches or exceeds Wise/Remitly standards. Regulators may expect even tighter ongoing monitoring due to alternate rails.
- **Reporting:** Ensure any new flow (vs. SWIFT) fits existing reporting triggers/RBNZ requirements.
- **APRA/RBA:** For AU end, ensure counterpart’s engagement with regulators is robust—reciprocal recognition of “internal” flows may require filings there, too.
- **Cross-border data/privacy:** Confirm customer data usage and transmission matches regulatory expectations in both countries.
- **Future Direction (AU → NZ):** Similar process applies, but prioritize proving NZ → AU works first.

### **B. Experience & Operations**
- **Customer Onboarding:** Any additional KYC/transactional limits?
- **Error Handling:** How will you handle exceptions—e.g. bounced credits at AU end, FX mismatches, etc.? Can you offer status tracking akin to what Wise offers?
- **Disclosure:** Be transparent about pricing, any spread, and supported use cases.
- **Support:** Dedicated support for high-value enterprise customers for failed/held payments.

### **C. Architecture and Scalability**
- **Flow Mapping:** Ensure mapping for origination, routing, posting, and reconciliation is robust and auditable.
- **Treasury Limits:** Are there caps/limits on netting you need to manage (e.g. end-of-day imbalances)?
- **FX Management:** Will you offer customer a guaranteed FX rate at time of payment, or float/settle at different rate?
- **Internal Controls:** Ensure dual control/segregation and other controls are met on both sides for regulatory attestation.

### **D. Commercialization/Pricing**
- **Uplift potential:** Will this recapture the $4.2M lost revenue, or could it expand the pie (e.g. new use cases open up)?
- **Wise users:** Map pricing and marketed speed vis-a-vis Wise; be very explicit in marketing.
- **Volume forecasting:** Model scenarios for different adoption/volume curves so you can plan operationally and commercially.

---

## 5. **Key Discovery Questions/Activities**

### **Product/UX**
- What are the precise customer jobs-to-be-done? (e.g. payroll, vendor payments, family support)
- Do customers need recurring payments, batch uploads, API access?
- What are the minimum viable payment types (single, bulk, scheduled)?

### **Legal/Compliance/Regulatory**
- Do you need any additional regulator “no objections” (or exemption) for using internal rails for customer-facing flows?
- Has compliance mapped the entire journey (including screening, retention, disclosure) for AU regulations as well?
- Any unique reporting for cross-border internal-to-third-party? (Some regulators scrutinize internal netting.)

### **Technical**
- Gaps between current internal treasury rails and what’s needed for retail/enterprise external payments?
- Can real-time status and notifications be surfaced to customer? Any changes to enterprise’s commercial internet banking UI/API?
- Is reconciliation of AU credit postings 100% automated and robust for scale?

### **Operations**
- Can support teams track and resolve failed/disputed transactions?
- Are there increased fraud risks to monitor (e.g. mule activity, new typologies)?

---

## 6. **Summary Next Steps**

1. **Deep-dive mapping of customer payment flows** (current vs. proposed) including all technical, compliance, and operations steps.
2. **Internal risk assessment**: Focus on regulatory, operational, and FX/treasury impacts.
3. **UX/Customer interviews**: Validate demand, refine pricing/language, discover unmet needs.
4. **Regulator pre-engagement**: Sound out RBNZ and APRA on the new mechanism, if not already done.
5. **Detailed commercial modelling**: Re-validate revenue opportunity + cost structures at different adoption scales.
6. **Pilot planning**: Define MVP feature set, target customer segment, and feedback/metrics loop.

---

## 7. **Potential Quick Wins**

- Early announcement to target customers for expression of interest—use this to help refine MVP.
- “Coming soon” messaging for AU → NZ, to reassure customers on both sides.
- Consider preferential pricing/early access for key existing enterprise clients as anchor users.

---

**Let me know if you want:**
- a draft product requirements outline;
- a discovery questionnaire template for customers/ops/compliance;
- a feature/flow map template tailored for engineering and operations handover.

Are there particular areas you want to hone in on first?