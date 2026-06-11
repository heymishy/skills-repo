Thank you for the detailed context and strategic intent. Here is a structured /discovery pipeline response, including clarification questions, competitor scan, and risks/opportunities to validate further. This is designed to align with enterprise product discovery best practices.

---

### 1. **Clarifications & Assumptions**

To ensure shared understanding, are these points correct?

- **Target Users:** Enterprise retail customers sending regular NZD → AUD payments (businesses, or family remittances).
- **Initial Channel Scope:** NZ → AU only, up to $10,000 per transaction. Larger amounts revert to SWIFT.
- **Settlement Method:** Leverage internal treasury/net settlement between group entities, not processed via external rails until final net settlement.
- **Funds Credit Speed:** Target UX: settlement completed and receivable in recipient’s AU account within 2 hours.
- **Pricing:** Sub-$5/transaction on the new rail, competing with Wise and others.
- **Risk & Compliance:** Reuse current AML/CFT workflows; compliance and regulatory notifications are not blockers.
- **Pilot Plan:** 6-month build + limited rollout.

*Are there any additional constraints or goals? E.g.,*
- Specific AU banks/types of accounts supported, or any exceptions?
- MVP or feature set (recurring payments, payment tracking, rich payment data, etc.)
- Planned distribution/promotion strategies (e.g. positioned as a new product or part of existing payment suite)?

---

### 2. **Market & Competitor Scan**

#### **Competitive Landscape**
- **Wise:** Transfers < $10k usually settle instantly or within hours; typical cost NZD $4-8.
- **Revolut, PayPal Xoom, OFX, Western Union:** Varied speed (instant to 48h), cost can range $3–$15+; wholesale FX rates but often higher markups than Wise.
- **Main Banks:** ANZ, Westpac NZ/AU, Commonwealth Bank—existing transfer times are 1-2 days, with pricing $15-25 via SWIFT; some “fast pay” but often not cross-bank, or limited to select account types.

#### **Customer Problems and Needs**
- **Speed**: Wise and fintechs have materially raised customer expectations; “business days” now seen as unacceptable for routine business/family flows.
- **Cost**: High fees cited as barrier to using banks; customers often route bulk or recurring flows around banks.
- **Trust & UX**: Banks still have a “trusted” edge for high value/bulk payments, but are losing relevance for everyday cross-border.

#### **Key Gaps You Can Fill:**
- Sub-$5, **near-instant settlement** direct to any major AU bank, with **enterprise-grade trust/compliance**.
- Eliminating awkward cut-off times/MT103 tracking headaches associated with SWIFT.
- “One-stop” for payments under $10k: native FX, bank UX, and faster-than-SWIFT execution.

---

### 3. **Value Proposition (Proposed Messaging)**

**For B2B retail/enterprise customers:**
- **Faster, Cheaper Business Payments to Australia**
- Transfer NZD to any Australian bank within 2 hours for less than $5.
- Simpler, more predictable reconciliation (no international SWIFT cut-off windows).
- Backed by your trusted banking provider’s security/compliance.
- No need to use third-party remittance services (“Stop using Wise – get the same speed, lower risk!”).

---

### 4. **Risks & Validation Areas**

#### **Key Risks/Unknowns**
- **Operational Complexity:**
    - Real-time execution on both NZ and AU sides (what happens if the internal netting is out of balance?).
    - Exception handling (failed transactions, bounced credits, etc).
    - Liquidity management in treasury accounts.
- **Payment Routing:**
    - Is “any Australian bank” truly supported on day 1, or only those the group can directly credit?
- **AML/CFT Reporting:**
    - Are all cross-border reporting/thresholds and sanction checks up to “real-time” requirements?
- **FX Handling:**
    - Spot FX rates, margin or markup, and customer visibility to FX rate offered (critical for Wise/OFX comparisons).
- **Customer Experience:**
    - How is this surfaced in online banking/portals? (existing UI patterns, new “Express Transfer” CTA, etc.)
    - How will customer service/support for these flows be handled differently (if at all)?
- **Regulatory/Notification:**
    - Any RBNZ/ASIC hurdles or Australian APRA requirements for the new flow?
    - What notification/approval lead times need to be built in?

#### **Validation Actions Suggested**
- Confirm treasury and IT capability to credit all AU banks in 2 hours (tech + operations walkthrough).
- Prototype user journey and test with target enterprise customers: what would persuade you to shift flows from Wise?
- Map out failure handling scenarios (e.g. bounced AU credits, FX errors).
- Run detailed pricing/volume model: cannibalization risk to SWIFT product, vs. new volume attracted back from Wise, etc.
- Legal/compliance: Confirm that planned “internal channel” model is robust for ongoing regulatory expectation (i.e. not just MVP exemption).

---

### 5. **Opportunities/Future Phases**

- **AU→NZ** reverse flow after successful NZ→AU pilot.
- Incorporate recurring payment templates, batch payments, or API access for B2B integration.
- “Track and Trace” features for payments: confirmation of credit, e-receipts, etc.
- Extend to other group-related corridors (e.g. Singapore, UK).
- Offer “mid-market” FX rates for bulk/loyalty customers → disrupt Wise on price.

---

### Summary (for next step validation):
- **This feature can fill a proven competitive gap and should stop payment volume leak to Wise/fintechs**, provided that (1) the 2-hour credit promise and (2) sub-$5 price point are reliably delivered, and (3) the new flow is robust to compliance, operations, and regulatory review.
- **Key risks:** operational readiness to fulfil at scale (tech and treasury), end-to-end credit to “any” AU bank within the SLA, and iron-clad compliance/bounce/failure monitoring.
- **Discovery Next Steps:** Validate/clarify operation and compliance flows, prototype UX, and test with targeted customers and relationship managers. Build competitive messaging for pilot marketing.
- **Pilot metrics:** Churn reduction (shift from Wise), new volume/returning revenue, failure rate, SLA achievement, regulatory feedback.

Would you like a prioritised list of discovery actions, or a deep dive into pricing and FX margin modelling for the pilot?