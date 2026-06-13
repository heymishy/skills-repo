# /discovery Pipeline Assessment

I need to be direct: this project has **material compliance and ethical risks** that must be resolved before proceeding. You cannot ship this on the Q3 timeline without addressing them. Let me break down what needs to happen.

---

## 🚨 Critical Issues (Must Resolve)

### 1. **Undisclosed Model Bias – Regulatory Risk**
**The situation:**
- Internal review (8 months ago) found statistically different approval rates across demographic groups
- Not escalated to leadership or disclosed to FMA
- Credit decisioning model is unvalidated for bias

**Why this matters:**
- This is likely a breach of FMA expectations on algorithmic fairness (per their 2021 *Approach to AI*)
- Deploying a known-biased model at scale amplifies harm and regulatory exposure
- "We didn't know" is not a defense when you have internal documentation

**Required actions (before design):**
- Immediate disclosure conversation with Compliance/Legal about FMA notification
- Engage independent bias audit firm to validate the model (6–8 weeks, ~$40–60k)
- Document what the 8-month-old review actually said; identify why it wasn't escalated
- Establish bias monitoring KPIs before go-live
- Plan remediation if bias is confirmed (retraining, decision thresholds, manual review triggers)

**Timeline impact:** This delays launch. That's the right outcome.

---

### 2. **Responsible Lending Obligations – Legal Gap**
**The situation:**
- Current manual agent interviews satisfy *reasonable inquiries* requirement under CCCFA
- Digital flow hasn't been legally cleared for equivalence
- You're assuming automation can meet the same standard — your legal team hasn't confirmed

**Why this matters:**
- CCCFA §9 requires reasonable inquiries about *ability to repay* before credit advance
- Pulling transaction history alone is not the same as understanding hardship, dependents, other commitments, life changes
- If you approve someone who couldn't afford repayment, you're in breach regardless of the decision engine's accuracy

**Required actions:**
- Legal sign-off on what the digital flow must capture to satisfy §9
- Likely outcome: you'll need additional questions beyond {amount, term, purpose} + transaction history
- Design should include:
  - Hardship/vulnerability screening questions
  - Explicit affordability questions (dependents, other debts, income stability)
  - Deferral to manual review for edge cases (unemployment, recent life changes, etc.)
- Document the equivalence rationale for FMA audits

**Timeline impact:** 2–3 weeks if you start now; significant if legal hasn't thought this through.

---

### 3. **Centrix Data Quality & Consent**
**Secondary but material:**
- Do you have explicit customer consent for Centrix pulls at application stage?
- What happens if Centrix is unavailable? (Fallback to manual review? Auto-decline?)
- Centrix data may be incomplete for younger/newer customers — you need a strategy

**Required:**
- Consent flow clarity
- Error handling for data unavailability
- Testing with cohorts where Centrix coverage is weak

---

## ⚠️ High-Risk Decisions

### The $30k Auto-Approve Threshold
You've set a cutoff, but I'd challenge the logic:
- **Risk isn't linear with size.** A $30k loan to someone with $2k monthly income is riskier than a $50k loan to someone with $15k monthly income.
- Your internal risk scorecard should determine the threshold, not a round number.
- If the model is biased, a higher automation threshold amplifies the bias.

**Better approach:**
- Set the auto-approve threshold based on risk band (e.g., "auto-approve only for score 800+")
- Route everything else to manual review initially
- Narrow the auto band only after 3 months of clean performance data

---

## 🔄 Recommended Approach (Revised Timeline)

### **Phase 0: Compliance & Risk (Weeks 1–6)**
- [ ] Compliance + Legal + Risk working group (weekly)
- [ ] FMA disclosure conversation + legal advice
- [ ] Commission independent bias audit of credit model
- [ ] Document CCCFA §9 requirements → digital flow mapping
- [ ] Consent & data governance review (Centrix, core banking)

**Gate:** Legal and Compliance sign-off on risk appetite and design constraints

### **Phase 1: MVP Design (Weeks 7–12)**
- Digital form with:
  - Loan purpose, amount, term (required)
  - Hardship/vulnerability screening
  - Affordability questions (income, dependents, other debts)
  - Explicit consent for bureau pull + data use
- Pull transaction history + Centrix
- Apply risk scorecard
- **All decisions** route to manual review (no auto-approve yet)
- Manual reviewer has 24h SLA

**Why:** Validate the digital capture is equivalent to agent interviews. Collect performance data.

### **Phase 2: Automation (Weeks 13–16)**
- After 500+ manual reviews, analyze auto-approve criteria
- Narrow auto-approve band (if warranted by performance + bias audit results)
- Implement bias monitoring dashboards
- Go live with limited automation

**Timeline:** End of Q3 is unrealistic. Target Q4 (late October) for Phase 1 MVP; automation in Q1 2024.

---

## ✅ What You Need from Leadership

1. **Accept a later timeline** (Q4 for MVP, Q1 2024 for automation). Rushing past compliance risk is expensive.
2. **Fund the bias audit** (~$50k). It's cheaper than a regulatory enforcement action.
3. **Designate a Compliance owner** to drive FMA notification and ongoing monitoring.
4. **Align on responsible lending design.** You may need to collect more data than you want to.

---

## Bottom Line

You have a genuine customer problem (3–5 days vs. same-day decisions). But your current plan ships a **known-biased, legally untested system** to meet an arbitrary deadline.

**Do not proceed with discovery on the current timeline.** Start a parallel **Risk & Compliance sprint** immediately. The discovery pipeline should begin only after Phase 0 gates are cleared.

What's your team's appetite to reset expectations with leadership on this?