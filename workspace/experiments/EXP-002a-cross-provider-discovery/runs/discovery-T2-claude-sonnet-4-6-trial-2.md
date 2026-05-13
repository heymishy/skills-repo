# Discovery Pipeline: Improve Onboarding Experience for New Business Customers

---

## 🔍 PHASE 1: PROBLEM FRAMING

Before jumping to solutions, let's sharpen what we're actually dealing with.

---

### 1.1 Reframing the Problem Statement

The input is a **solution-adjacent goal**, not a root problem. Let's unpack it:

| Layer | Question | What We Don't Know Yet |
|---|---|---|
| **Symptom** | What signals tell us onboarding is broken? | Churn rate, support tickets, time-to-value, NPS dips? |
| **Who** | Which "new business customers"? | SMB vs. Enterprise vs. Mid-market? Self-serve vs. sales-assisted? |
| **When** | Where in onboarding does it break? | Day 1? Week 2? First renewal decision? |
| **Why** | What's causing the friction? | Product complexity? Poor guidance? Misaligned expectations set in sales? |
| **Stakes** | What happens if we don't fix it? | Revenue leakage, CAC wasted, LTV destroyed early |

> **Working hypothesis to pressure-test:**
> *"New business customers are not reaching their first meaningful value moment quickly enough, leading to early disengagement — and the root cause lives somewhere in the gap between what Sales promises and what the product delivers on Day 1."*

---

## 🗺️ PHASE 2: OPPORTUNITY LANDSCAPE

### 2.1 The Onboarding Journey — Where Value Gets Lost

```
SIGNED ──► KICKOFF ──► SETUP ──► FIRST USE ──► HABIT ──► RENEWAL
   │           │          │           │            │
   ▼           ▼          ▼           ▼            ▼
Handoff     Expectation  Config    Aha moment   Stickiness
gaps        mismatch     friction  never hit    never built
```

Each arrow is a **potential drop-off point**. We currently don't know which is the critical one.

---

### 2.2 Stakeholder Map

```
PRIMARY USERS of onboarding experience:
├── Economic Buyer (signed the contract — may disappear after)
├── Admin/Champion (configuring the product)
└── End Users (actually using it day-to-day)

INTERNAL ACTORS who shape onboarding:
├── Sales (sets expectations pre-close)
├── Customer Success / Implementation (owns the process)
├── Product (in-app experience)
└── Support (absorbs failure)
```

> ⚠️ **Critical insight:** These groups often have **conflicting definitions of "successful onboarding."** Sales wants speed-to-close. CS wants depth of adoption. The customer wants ROI fast.

---

### 2.3 Competing Forces

| Force | Pushes Toward | Tension With |
|---|---|---|
| Customer wants quick wins | Lightweight onboarding | Complex products need configuration time |
| Enterprise needs customization | High-touch, long onboarding | CS team capacity |
| Self-serve scalability | Automated/in-product | Customers feeling abandoned |
| Sales promising speed | Fast go-live | Reality of implementation |

---

## 🔬 PHASE 3: ASSUMPTION INVENTORY

These are the **beliefs we'd be acting on** if we started building solutions now. Each needs validation.

### High-Stakes Assumptions (Test First)

| # | Assumption | Risk if Wrong | How to Test |
|---|---|---|---|
| A1 | Customers are failing to reach value quickly | We fix the wrong thing entirely | Analyze time-to-first-key-action in product data |
| A2 | The problem is in the onboarding *process*, not the product itself | We paper over a product problem | Compare onboarding completion vs. retention curves |
| A3 | Customers know what "success" looks like for them | They do — but can't get there | Customer interviews, week 1-2 post-signup |
| A4 | CS/Implementation teams are the bottleneck | They aren't — it's product friction | Shadow CS team on 5 onboarding calls |
| A5 | Business segment is homogeneous enough for one solution | SMB and Enterprise need completely different approaches | Segment churn/engagement data by customer type |

---

## 🧪 PHASE 4: RESEARCH AGENDA

*Prioritized by speed + signal quality*

### Sprint 1: Quantitative Signals (Week 1)
**Goal:** Find where customers are *actually* dropping off

- [ ] **Product analytics audit** — where do new customers go first? Where do they stop?
- [ ] **Funnel analysis:** % completing each onboarding milestone (account setup → first core action → team invite → integration)
- [ ] **Cohort analysis:** Do customers who complete onboarding in X days retain at higher rates?
- [ ] **Support ticket tagging:** What are new customers (<30 days) asking for most?
- [ ] **Time-to-value metric:** Do we even have a defined "Aha moment"? What is it?

---

### Sprint 2: Qualitative Discovery (Weeks 1–2)
**Goal:** Understand the *why* behind the numbers

**Customer Interviews — Target 8–12 conversations:**
- 3–4 recently onboarded customers who are **active and successful**
- 3–4 recently onboarded customers who are **struggling or disengaged**
- 2–3 customers who **churned within 90 days**

**Key questions to explore:**
```
- "Walk me from the day you signed to today. What happened?"
- "When did you first feel like [product] was working for you?"
- "What almost made you give up?"
- "What did you expect Day 1 to look like? What was it actually like?"
- "Who else on your team needed to be involved? Were they?"
```

**Internal Interviews:**
- Shadow 3 CS/onboarding calls end-to-end
- Interview Sales reps: *"What do you promise customers about onboarding?"*
- Interview Support: *"What's the #1 thing new customers can't figure out?"*

---

### Sprint 3: Competitive + Analogous Research (Week 2)
- Sign up for 3 competitors — experience their onboarding as a new customer
- Review G2/Capterra/Trustpilot for onboarding-specific complaints and praise
- Look outside industry: What does **Stripe, Notion, Slack** do in B2B onboarding that's worth stealing?

---

## 💡 PHASE 5: OPPORTUNITY AREAS

*Hypotheses to explore — not solutions yet*

Based on common patterns in B2B onboarding failures, here are **5 opportunity spaces** worth investigating:

---

### Opportunity 1: The Handoff Gap
**Signal:** Customer re-explains their needs to CS that they already told Sales
**Hypothesis:** Value context gathered during sales is lost at contract signature
**If true, the lever is:** Structured handoff artifacts, shared CRM data, warm intro calls

---

### Opportunity 2: The Configuration Wall
**Signal:** Customers stall during setup before ever experiencing core value
**Hypothesis:** Required configuration effort exceeds customer patience/capacity
**If true, the lever is:** Smart defaults, guided setup wizard, "start simple" path

---

### Opportunity 3: The Missing Success Definition
**Signal:** Customers can't articulate what good looks like at 30/60/90 days
**Hypothesis:** No mutual success plan is established at the start
**If true, the lever is:** Structured kickoff with explicit milestone agreement

---

### Opportunity 4: The Wrong-Person Problem
**Signal:** Admin sets up the product but end users never adopt it
**Hypothesis:** Onboarding targets the buyer, not the actual users
**If true, the lever is:** Role-specific onboarding paths, end-user activation campaigns

---

### Opportunity 5: The Silence Drop-off
**Signal:** Customers go quiet after week 2 and CS doesn't catch it until month 2
**Hypothesis:** No early warning system exists for at-risk new accounts
**If true, the lever is:** Health scoring for new accounts, automated intervention triggers

---

## 📐 PHASE 6: SUCCESS METRICS FRAMEWORK

*Before building anything, define what "improved" means*

### Primary Metrics
| Metric | What It Measures | Baseline Needed |
|---|---|---|
| **Time-to-First-Value (TTFV)** | Days to complete Aha moment action | Pull from product data |
| **Onboarding Completion Rate** | % completing defined milestone set | Define milestones first |
| **30-day Retention Rate** | Early survival rate | Current cohort data |
| **90-day Expansion Rate** | Are they growing? | Revenue data |

### Guardrail Metrics (Don't break these)
- CS team hours per onboarding (don't just throw people at it)
- Customer-reported effort score (onboarding shouldn't feel hard)
- Sales cycle length (don't create a perception problem pre-close)

---

## ⚡ PHASE 7: RECOMMENDED NEXT ACTIONS

*Prioritized by learning speed*

```
WEEK 1                    WEEK 2                    WEEK 3+
─────────────────         ─────────────────         ─────────────────
□ Pull product            □ Run 8-10 customer        □ Synthesize findings
  analytics funnel          interviews               □ Map to opportunity
□ Audit support           □ Shadow 3 CS calls          areas
  tickets (new custs)     □ Interview Sales +        □ Prioritize 1-2
□ Define "Aha moment"       Support                    bets to prototype
  if not already done     □ Competitive signups      □ Run assumption
□ Align team on           □ Review churn             tests on top bets
  scope: SMB vs Ent?        interviews if exist
```

---

## ❓ CRITICAL OPEN QUESTIONS

Before this discovery can fully converge, these need answers from your team:

1. **Scope:** Are we solving for one customer segment or all? (SMB, Mid-Market, Enterprise have radically different onboarding needs)
2. **Ownership:** Is this a CS problem, Product problem, or both? Who has the mandate?
3. **Definition:** What does "onboarding" end? Day 7? First renewal? First expansion?
4. **Data access:** Do we have product analytics instrumented well enough to see new-customer behavior?
5. **Constraints:** Is the solution space open (process, product, people) or constrained (e.g., "no new CS headcount")?

---

## 🧭 SUMMARY: THE DISCOVERY THESIS

> We believe new business customers are **not reaching clear value quickly enough**, creating early churn risk and wasted acquisition spend. The root cause is likely a **combination of handoff failure, unclear success definition, and configuration friction** — but we don't yet know the relative weight of each.
>
> The next 2 weeks of research will tell us **where the real problem lives**, which opportunity area to attack first, and what a meaningful improvement in time-to-value actually looks like in measurable terms.
>
> **We are not ready to build solutions yet. We are ready to learn.**

---

*Pipeline complete. Ready to go deeper on any phase — research design, interview guides, metrics framework, or stakeholder alignment.*