# Discovery Pipeline: Improve Onboarding Experience for New Business Customers

---

## ⚠️ Before We Go Further — Scoping Questions

The input is broad enough that I could run in 10 different directions and waste your time. Let me surface the key ambiguities first, then I'll proceed with *structured assumptions* so you get immediate value.

---

## 🔍 LAYER 1: Problem Clarification

### What I don't know (and why it matters)

| Ambiguity | Why It Changes Everything |
|---|---|
| **What kind of business?** SaaS, fintech, marketplace, professional services, bank? | Onboarding in a B2B SaaS product ≠ onboarding a business to a bank account |
| **Who is "the customer"?** The company signing up, or the humans inside that company? | Often these are different people with different needs |
| **What does "onboarding" span?** First signup only? Through first value? Through 90-day retention? | Scope defines what success looks like |
| **What's the current state?** Existing broken process or greenfield? | Fixing vs. building are very different problems |
| **What signals say it's broken?** Drop-off data, sales complaints, NPS, support tickets? | Symptoms reveal root cause |

---

## 🏗️ LAYER 2: Structured Problem Decomposition

*Working with assumption: B2B SaaS company, existing onboarding flow that underperforms*

### The Onboarding Experience is actually 3 distinct problems

```
┌─────────────────────────────────────────────────────┐
│  PROBLEM SPACE MAP                                  │
│                                                     │
│  1. ACQUISITION → ACTIVATION                        │
│     "Getting started" moment                        │
│     Pain: friction, confusion, abandonment          │
│                                                     │
│  2. ACTIVATION → VALUE REALIZATION                  │
│     "Aha moment" delivery                           │
│     Pain: too slow, too generic, no guidance        │
│                                                     │
│  3. VALUE → EXPANSION/RETENTION                     │
│     "Stickiness" formation                          │
│     Pain: handoff gaps, poor habit formation        │
└─────────────────────────────────────────────────────┘
```

---

## 👥 LAYER 3: Stakeholder Mapping

### Who is actually involved in business customer onboarding?

```
INTERNAL                          EXTERNAL
──────────────────────────────────────────────────
Sales                             Economic Buyer
  └─ Promises made during deal      └─ Signs the contract
                                      └─ Rarely uses product
Implementation/CS                 Champion/Admin
  └─ Hands-on setup                  └─ Does the actual setup
  └─ Often overwhelmed               └─ Has internal pressure
                                      └─ Technical ability varies
Product                           End Users
  └─ Builds the experience           └─ Plural, skeptical
  └─ Assumes more than reality       └─ Didn't choose this tool
                                      └─ Need quick wins

Support                           IT/Security
  └─ Absorbs failure                 └─ Gatekeepers
  └─ Sees patterns nobody else does  └─ Can stall for weeks
```

### 🔑 Key Insight
> Business customer onboarding almost always fails because it's designed for **one person** but executed by **many**, with **misaligned incentives** at every handoff.

---

## 🗺️ LAYER 4: Journey Mapping (Current State Hypothesis)

### The typical broken onboarding journey

```
STAGE          WHAT HAPPENS           EMOTIONAL STATE    FAILURE POINT?
─────────────────────────────────────────────────────────────────────
Contract       Sales celebrates       😊 Excited         Handoff gap begins
Signs          CS team notified                          here silently

Welcome        Generic email sent     😐 Uncertain       ★ HIGH RISK
Email          "Your account is                         Nobody knows what
               ready!"                                  to do next

First          Admin logs in          😰 Overwhelmed     ★★ CRITICAL
Login          Sees blank dashboard                     "Where do I start?"
               10-step checklist

Setup          Tries to configure     😤 Frustrated      Requires IT ticket
Begins         Hits permission wall                     Momentum dies

Data           Attempts import        😤 Frustrated      File format wrong
Migration      Gets error message                       No clear support path

Week 2-3       Silence from vendor    😶 Disengaged      ★★ CRITICAL
               No proactive contact                     Buyer regret starts

First          Manager asks for       😬 Anxious         Can't demonstrate
Check-in       results update                           progress internally

Day 60         Low adoption           😠 Regretful       Churn signal
               Support ticket         Blame begins       already set
```

---

## 🧪 LAYER 5: Root Cause Analysis

### The "5 Whys" on the most common failure mode

**Symptom:** Low product adoption 60 days after contract signed

```
WHY #1: Users aren't logging in regularly
  ↓
WHY #2: They never formed a habit or understood value
  ↓
WHY #3: Their first sessions were confusing and unrewarding
  ↓
WHY #4: Onboarding assumed knowledge they didn't have
  ↓
WHY #5: Onboarding was built from the vendor's mental model,
        not the customer's job-to-be-done

ROOT CAUSE: Onboarding is product-centric, not outcome-centric
```

### Secondary root causes

| Root Cause | Manifestation |
|---|---|
| **Handoff failure** between Sales → CS | Promised features, context, customizations not transferred |
| **One-size-fits-all** content | Ignores company size, industry, technical sophistication |
| **Internal champion lack of support** | Champion can't sell adoption internally |
| **Time-to-value too long** | First meaningful result takes weeks, not hours |
| **No milestone celebration** | Progress invisible, discouragement sets in |

---

## 💡 LAYER 6: Opportunity Areas

### Ranked by impact × feasibility

```
OPPORTUNITY                          IMPACT    EFFORT    PRIORITY
─────────────────────────────────────────────────────────────────
1. Segment onboarding by role +         ●●●●●     ●●●       ★★★★★
   use case at signup
   "What's your main goal?"

2. Define + accelerate Time-to-         ●●●●●     ●●●●      ★★★★
   First-Value moment
   Make it measurable, make it fast

3. Structured Sales→CS handoff          ●●●●      ●●        ★★★★★
   protocol with context transfer
   Customer context card

4. Enable the internal champion         ●●●●      ●●        ★★★★★
   Give them tools to sell internally
   "Onboard your team" kit

5. Proactive milestone check-ins        ●●●●      ●●        ★★★★
   Day 1, 7, 30 — triggered, not
   reactive

6. Live "quick win" session             ●●●●      ●●●       ★★★
   30-min guided setup call for
   highest-friction moment

7. Progress visibility dashboard        ●●●       ●●●●      ★★★
   For admin AND economic buyer

8. In-app contextual guidance           ●●●●      ●●●●●     ★★
   (Pendo/Appcues style)
   High impact, high build cost
```

---

## 📐 LAYER 7: Problem Statements (HMW Format)

Ready to use in ideation or sprint planning:

> **HMW** help the internal champion demonstrate early wins to their leadership before skepticism sets in?

> **HMW** reduce time-to-first-value from weeks to a single session?

> **HMW** ensure every piece of context from the sales process survives the handoff to implementation?

> **HMW** make the onboarding journey feel like it was built specifically for *this* company, not all companies?

> **HMW** give end users a reason to log in on day 2, before a habit has formed?

---

## 🔬 LAYER 8: Research Agenda

*What to validate before building anything*

### Qualitative (do first)
- [ ] **Exit interviews** with churned accounts < 90 days — what broke?
- [ ] **Ride-along sessions** watching a new admin during their first login
- [ ] **Champion interviews** — what internal pressure did they face?
- [ ] **CS team interviews** — where do they spend most firefighting time?

### Quantitative (to confirm/size)
- [ ] Funnel drop-off analysis: where in onboarding do users abandon?
- [ ] Correlation: time-to-first-value vs. 90-day retention rate
- [ ] Support ticket tagging: what topics dominate weeks 1-4?
- [ ] Feature adoption sequence: what do retained customers do first?

### Competitive
- [ ] Benchmark 3 competitors' onboarding flows (create test accounts)
- [ ] Note: what's their implied time-to-value promise?

---

## 🚦 LAYER 9: Recommended Next Steps

### Immediate (this week)
1. **Align on scope** — which stage of onboarding are we prioritizing? (Use the 3-zone map above)
2. **Pull the data** — support tickets, drop-off rates, churn timing
3. **Book 5 customer interviews** — focus on recently churned AND recently successful

### Short-term (2-4 weeks)
4. **Map your actual current-state journey** with CS + Sales in the room
5. **Identify your time-to-first-value moment** — can you name it precisely?
6. **Quick win:** Fix the Sales→CS handoff with a simple context card

### Strategic (1-2 quarters)
7. Build segmented onboarding paths by persona/use case
8. Instrument everything so you can measure what "good onboarding" looks like

---

## ❓ The Single Most Important Question to Answer First

> **"What specific, observable action does a new business customer take that reliably predicts they will still be a customer in 90 days?"**

*Everything in onboarding design should point toward that moment.*

---

*Want me to go deeper on any layer — persona mapping, a specific opportunity area, research design, or a metrics framework?*