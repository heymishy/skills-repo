# Discovery Pipeline: Improve Onboarding Experience for New Business Customers

---

## PHASE 1 — REFRAMING THE PROBLEM

Before jumping to solutions, let's pressure-test what we actually know.

---

### 1.1 The Problem Statement, Interrogated

**As stated:** *"Improve the onboarding experience for new business customers."*

| Question | Why It Matters |
|---|---|
| Who defines "business customers"? | SMB ≠ Mid-market ≠ Enterprise. Each has radically different onboarding needs. |
| What does "onboarding" start and end with? | First login? Contract signing? First value moment? Full activation? |
| Who owns this problem internally? | Sales? CS? Product? Ops? Misaligned ownership = misdiagnosed problem. |
| What signals say it's broken? | Complaints? Churn? Low activation? Long time-to-value? Gut feeling? |
| "Improve" toward what outcome? | Speed? Satisfaction (NPS/CSAT)? Retention? Revenue expansion? |

**Initial reframes to hold in mind:**

- > *"The onboarding experience is broken"* → might actually be *"customers don't know what success looks like yet"*
- > *"Onboarding is too slow"* → might actually be *"we're asking for the wrong things at the wrong time"*
- > *"Customers are confused"* → might actually be *"we're onboarding for our process, not their goal"*

---

## PHASE 2 — HYPOTHESIS TREE

Mapping possible *root causes* before assuming solutions.

```
ONBOARDING UNDERPERFORMS because...
│
├── 🧠 CLARITY PROBLEMS
│   ├── Customers don't understand what they need to DO
│   ├── Customers don't understand the VALUE they'll get
│   └── Internal teams have inconsistent definitions of "done"
│
├── ⏱ TIME / FRICTION PROBLEMS
│   ├── Too many steps before first value moment
│   ├── Manual handoffs cause delays (sales → CS → product)
│   ├── Waiting on customer inputs (data, approvals, stakeholders)
│   └── Technical setup is complex or underdocumented
│
├── 👥 PEOPLE / RELATIONSHIP PROBLEMS
│   ├── Wrong stakeholders engaged at wrong stages
│   ├── Champion at customer side loses momentum or leaves
│   ├── No single owner on vendor side
│   └── Customers feel like a ticket, not a partner
│
├── 📐 PROCESS / DESIGN PROBLEMS
│   ├── One-size-fits-all flow doesn't match customer complexity
│   ├── Onboarding designed around internal ops, not customer jobs-to-be-done
│   ├── No clear milestone/progress signals for customer
│   └── Failure modes aren't caught early enough
│
└── 📊 MEASUREMENT PROBLEMS
    ├── No agreed definition of "successfully onboarded"
    ├── No leading indicators — only lagging signals (churn)
    └── Data exists but isn't acted on
```

---

## PHASE 3 — WHAT WE DON'T KNOW (The Assumption Map)

Ranking unknowns by **importance × uncertainty**

### 🔴 Critical Unknowns (Highest Priority to Resolve)

| Unknown | Why Critical |
|---|---|
| Where exactly do customers drop off, slow down, or express frustration? | Without this, all solutions are guesses |
| What does the customer consider their "first moment of real value"? | This is the north star for onboarding design |
| What do customers actually need vs. what we're currently asking them to do? | May reveal we're solving our problems, not theirs |
| What's the current time-to-value, and what would "good" look like? | Need a baseline before optimizing |

### 🟡 Important Unknowns

| Unknown | Why It Matters |
|---|---|
| How do different customer segments experience onboarding differently? | Segmentation may reveal the real problem is in one cohort |
| What do CS/onboarding reps say the real blockers are? | Frontline insight often beats data |
| What do churned customers say about onboarding retrospectively? | Brutally honest signal |
| What does a "great" onboarding look like in adjacent industries? | Benchmarking opportunity |

### 🟢 Lower Priority (Can Validate Later)

| Unknown | Note |
|---|---|
| What tools/tech are in the current stack? | Matters for solutions, not for diagnosis |
| How do competitors onboard? | Useful context, not decisive |

---

## PHASE 4 — RESEARCH AGENDA

Concrete methods to close the knowledge gaps.

---

### Method 1: Customer Journey Shadowing
**What:** Follow 3–5 new customers through their actual onboarding in real time.
**Goal:** See what they experience, not what we think they experience.
**Output:** Annotated journey map with emotion, effort, and confusion points marked.

---

### Method 2: Retrospective Interviews — Two Cohorts

**Cohort A — Successfully onboarded customers (3–6 months post)**
- What made it work?
- What was harder than expected?
- When did they first feel confident?

**Cohort B — Churned or stalled customers**
- At what point did momentum die?
- What would have changed the outcome?
- What were they comparing us to?

*Target: 6–10 interviews per cohort. 30–45 mins each.*

---

### Method 3: Internal Stakeholder Interviews
Talk to people who see the friction every day:
- [ ] Onboarding/CS team leads
- [ ] Sales (what promises get made pre-sale?)
- [ ] Support (what questions come in during onboarding?)
- [ ] Product (what does activation data show?)

**Key question for all:** *"If you could change one thing about how we onboard customers tomorrow, what would it be — and why haven't we?"*

---

### Method 4: Data Audit
Pull existing signals:
- Time from contract signed → first login
- Time from first login → first meaningful action (define this)
- Drop-off points in onboarding flow (if tracked)
- CSAT/NPS scores segmented to onboarding period
- Support ticket volume and topics in first 30/60/90 days

---

### Method 5: Benchmarking
- Identify 2–3 companies known for excellent B2B onboarding (e.g., Slack, Stripe, HubSpot, Intercom)
- Document their patterns: what's the structure, pacing, and personalization approach?
- Not to copy — to provoke better questions about our own design

---

## PHASE 5 — OPPORTUNITY SPACES

Based on the hypothesis tree, here are the **design opportunity areas** worth exploring (to be validated, not assumed):

---

### Opportunity A: Redefine the "Done" State
> Most onboarding processes end when the vendor is satisfied. What if it ended when the customer achieved their first win?

Design around a **customer-defined success milestone**, not an internal checklist completion.

---

### Opportunity B: Segment the Journey
> A 5-person startup and a 500-person enterprise cannot have the same onboarding path.

Create **2–3 distinct onboarding tracks** based on customer size, complexity, or use case — with different pacing, touchpoints, and depth.

---

### Opportunity C: Compress Time-to-First-Value
> Every day between "signed contract" and "real value" is a churn risk being incubated.

Audit every step for: *Is this for us or for them?* Ruthlessly eliminate or defer steps that don't serve the customer's first value moment.

---

### Opportunity D: Make Progress Visible
> Customers often feel lost not because they are lost, but because they can't see how far they've come or what's left.

Introduce a **shared onboarding tracker/dashboard** — visible to both the customer and the vendor team — with clear milestones and owners.

---

### Opportunity E: Shift from Reactive to Proactive Intervention
> By the time a customer asks for help or goes quiet, momentum is already lost.

Build **early warning indicators** (e.g., no login in 5 days, setup incomplete after 2 weeks) that trigger proactive outreach — before the customer considers giving up.

---

### Opportunity F: Fix the Sales-to-CS Handoff
> Expectations set in the sales process frequently don't transfer. Customers feel misled; CS teams spend onboarding resetting expectations.

Create a **structured handoff artifact** (not just a CRM note) that captures: goals, constraints, stakeholders, promises made, and success definition — co-created during the sales process.

---

## PHASE 6 — WHAT GOOD LOOKS LIKE

### Success Metrics to Define *Before* Building Anything

| Metric | What It Measures |
|---|---|
| **Time-to-First-Value (TTFV)** | Speed to customer-defined win |
| **Onboarding Completion Rate** | % reaching all key milestones |
| **30/60/90-day retention by onboarding cohort** | Whether onboarding predicts retention |
| **Onboarding CSAT / effort score** | How hard customers feel it was |
| **CS time-per-customer-onboarded** | Efficiency signal |
| **Expansion revenue correlation** | Did good onboarding predict upsell? |

---

## PHASE 7 — RECOMMENDED NEXT STEPS

*Prioritized sequence to move from exploration to action:*

```
Week 1–2   │ Data audit + internal stakeholder interviews
           │ → Establish baseline; surface frontline knowledge
           │
Week 2–4   │ Customer interviews (both cohorts)
           │ + Live journey shadowing if possible
           │ → Validate or invalidate hypotheses
           │
Week 4–5   │ Synthesis workshop
           │ → Map the real journey; agree on root causes
           │ → Prioritize opportunity spaces by impact + feasibility
           │
Week 5–6   │ Design sprints on top 2 opportunities
           │ → Prototype, not full build
           │ → Test with real customers before committing
           │
Week 6+    │ Pilot with next cohort of new customers
           │ → Measure against agreed success metrics
           │ → Iterate based on signal, not assumption
```

---

## KEY TENSIONS TO HOLD

These are the productive conflicts worth debating, not resolving prematurely:

- **Speed vs. thoroughness** — Faster onboarding feels better, but rushing complex customers causes later failure
- **Standardization vs. personalization** — Scalable processes vs. customers feeling like individuals
- **Customer effort vs. customer ownership** — Removing all friction can create dependency, not capability
- **What customers ask for vs. what they actually need** — Satisfaction scores can mask shallow onboarding

---

## WHAT THIS PIPELINE HAS PRODUCED

| Output | Status |
|---|---|
| Reframed problem statement | ✅ Multiple framings surfaced |
| Root cause hypothesis tree | ✅ 5 categories, 15+ hypotheses |
| Assumption map with prioritization | ✅ Red/Yellow/Green tiers |
| Research agenda with specific methods | ✅ 5 methods defined |
| Opportunity spaces to explore | ✅ 6 named opportunities |
| Success metrics defined | ✅ Before any solution is built |
| Sequenced action plan | ✅ 6-week arc |

---

**The honest caveat:**
Everything above is a *structured set of hypotheses and research directions* — not answers. The discovery process exists precisely because we don't yet know which of these is the real problem. The value of this pipeline is that it prevents you from building solutions to the wrong thing.

**The most important next action:** Talk to 5 customers who onboarded in the last 90 days. Nothing in this document is worth more than what they'll tell you.