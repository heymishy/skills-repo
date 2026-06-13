# /discovery Pipeline Assessment – Personal Loan Digitisation

## ⚠️ CRITICAL ISSUES – PROCEED WITH CAUTION

I'm identifying three material risks that require resolution **before** design or build work begins. These aren't process improvements—they're potential compliance breaches.

---

## 1. **UNDISCLOSED MODEL BIAS (Highest Risk)**

**The situation:**
- Your credit decisioning model shows statistically different approval rates across demographic groups
- This was identified 8 months ago but not escalated to FMA
- You're now planning to *automate* this model at scale via a digital channel

**Why this matters:**
- **Credit Contracts and Consumer Finance Act (CCCFA) s16(1)**: You must not engage in unfair contract terms or discrimination
- **FMA expectations** (Credit Risk Management Principles): Models must be regularly validated for bias; known issues must be disclosed
- **Reputational/legal exposure**: If approval disparities are later attributed to demographic factors (race, ethnicity, national origin), this creates liability even if unintentional
- **Amplification**: A manual process catches edge cases; automation scales bias uniformly

**What you need to do immediately (not later):**

1. **Engage compliance/FMA**: Disclose the 8-month-old finding. Non-disclosure is itself a breach.
2. **Commission independent bias audit**: Have a third party validate whether disparities reflect:
   - Legitimate risk factors (income, existing debt ratios)
   - Demographic proxies (postcode, employment type used as proxy for ethnicity)
3. **Pause automation of that model** until audit is complete
4. **Document your inquiry**: If disparities are *not* explained by legitimate risk factors, you cannot ethically automate this

**Timeline impact:** This will slip your Q3 go-live. That's the correct outcome.

---

## 2. **RESPONSIBLE LENDING OBLIGATIONS – UNDEFINED FOR DIGITAL**

**The situation:**
- Manual process satisfies CCCFA s60 (reasonable inquiries) via agent interview
- Digital flow will require less human interaction
- Legal team hasn't confirmed how automated flow meets this requirement

**Why this matters:**
- CCCFA s60 is **mandatory**, not discretionary. Breaches can result in:
  - Loan being unenforceable (customer keeps money, no repayment obligation)
  - FMA enforcement action
  - Consumer Finance complaint upheld
- "Pulling transaction history" ≠ reasonable inquiry about customer's *actual* financial situation

**What responsible inquiry requires:**
- Understanding customer's regular income and expenses
- Identifying existing commitments (other loans, child support, etc.)
- Determining realistic repayment capacity
- Documenting that you made inquiries *before* lending decision

**Red flags in your proposal:**
- Relying only on bureau data + transaction history misses non-financial stress (redundancy, health, caring responsibilities)
- No mention of how you'll assess expenses or existing commitments
- Automated decision for <$30k may feel like low-risk but CCCFA applies equally

**What you need to do:**

1. **Work with legal to define minimum inquiries** for digital channel:
   - What questions *must* the customer answer? (e.g., employment status, existing debts, dependents)
   - What data sources are acceptable evidence? (transaction history alone is unlikely sufficient)
   - How will you document that inquiry occurred?

2. **Design conversation flow, not just data pull**:
   - Simple directed questions during application that capture key facts
   - Flag inconsistencies (e.g., "You said no other loans, but we see $X monthly payments")
   - Route edge cases to analyst

3. **Get legal sign-off on your inquiry framework** before build

---

## 3. **DECISIONING THRESHOLD CREATES LEGAL GAP**

**The situation:**
- Automated decision for up to $30k
- Manual review above $30k
- No mention of what analyst actually reviews, or how long manual review takes

**Issues:**
- If automation is sound, why not scale to $50k (your competitor threshold)?
- If automation is risky, why deploy at all at <$30k?
- Manual review bottleneck: If it takes analysts 2–3 days, you won't beat same-day competitors anyway

**Questions for your team:**

- What % of applications will hit the $30k threshold vs. fall below?
- What's the SLA for manual analyst review?
- Does the manual review re-run the same decisioning model, or apply different criteria?
- If the model is biased, does manual review catch this or repeat it?

---

## Revised Approach

### **Phase 0 (6–8 weeks): Compliance & Design**
- [ ] FMA disclosure of known model bias
- [ ] Independent bias audit of credit model
- [ ] Legal sign-off on CCCFA s60 compliance for digital channel
- [ ] Define minimum inquiry questions for application
- [ ] Confirm analyst SLA for >$30k applications

### **Phase 1 (conditional on Phase 0)**: 
- Build digital application with embedded inquiry flow
- Route to analyst based on decision model + residual risk factors
- Implement audit logging (every application decision traced to data + rules)

### **Phase 2**: 
- Pilot with segment of customer base
- Monitor approval rates by demographic group
- QA analyst decisions vs. model decisions

### **Go-live criteria**:
- ✅ FMA acknowledged bias findings
- ✅ Audit confirms model is fair or you've remediated disparities
- ✅ Legal confirms inquiry framework meets CCCFA s60
- ✅ Analyst review SLA demonstrated in pilot
- ✅ Approval rates comparable across demographic groups in pilot data

---

## On the Timeline

**Q3 is not realistic.** You have:
- 8 months of unresolved compliance findings
- Undefined legal obligations for the digital channel
- No independent validation of a material risk model

Launching before resolving these creates **greater liability** than slower competitors. The reputational/regulatory cost of a CCCFA breach or FMA enforcement action far exceeds the cost of a Q4 launch.

**Your competitive advantage isn't speed—it's trustworthiness.** Digital + compliant beats digital + broken.

---

**What would help me help you further:**
- Has FMA contacted you about this model, or is it entirely internal?
- What specifically does the bias audit report say (approval rate differences: 5 percentage points? 20+?)
- What data fields does the model use for decisioning?
- Do you have in-house legal or are you relying on external counsel?