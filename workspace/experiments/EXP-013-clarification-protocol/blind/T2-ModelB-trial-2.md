# Discovery Pipeline: Improve Onboarding Experience for New Business Customers

---

## PHASE 1 — REFRAME THE PROBLEM

Before solving anything, let's interrogate what we actually know.

---

### 1.1 The Statement as Given

> *"Improve the onboarding experience for new business customers."*

This is a **solution-adjacent goal**, not a problem statement. "Improve" is undefined. "Onboarding" has boundaries we haven't set. "Business customers" could mean five different segments. Let's pull it apart.

---

### 1.2 Assumption Inventory

*Things buried inside this statement that we're treating as true without evidence:*

| Assumption | Risk if Wrong |
|---|---|
| Onboarding is the primary pain point | We fix onboarding while churn is actually caused by product gaps post-onboarding |
| "New" customers are the right focus | Expansion/upgrade customers may have worse experiences |
| The experience is the problem (not speed, not outcomes) | We redesign UX while the real issue is time-to-value taking 90 days |
| Customers notice or articulate the problem | Silent abandonment means we may have no signal yet |
| We own the onboarding process | Parts may live in sales, legal, IT — outside our control |

---

### 1.3 Reframes Worth Considering

**Reframe A — Outcome lens:**
> *"New business customers aren't reaching their first meaningful value moment quickly enough — or at all."*

**Reframe B — Relationship lens:**
> *"The handoff from 'sold' to 'successful' breaks trust before the relationship has formed."*

**Reframe C — Business lens:**
> *"We are losing recoverable revenue because customers who don't onboard well don't renew, expand, or refer."*

**Reframe D — Customer lens:**
> *"Business buyers were sold a promise. Onboarding is the first test of whether we'll keep it."*

> 🔑 **Recommended working frame:** Reframe C + D combined — it connects customer experience to business consequence, which drives organizational alignment and prioritization energy.

---

## PHASE 2 — STAKEHOLDER & CUSTOMER MAPPING

---

### 2.1 Who Is "New Business Customer"?

This needs segmentation before any research or solution work begins.

```
PRIMARY AXIS — Company size
├── SMB (1–50 seats/employees)
├── Mid-Market (50–500)
└── Enterprise (500+)

SECONDARY AXIS — Buyer vs. User
├── Economic Buyer (signed the deal — often absent post-sale)
├── Champion/Admin (owns internal rollout)
├── End Users (often don't know a change is coming)
└── IT/Security (has veto power, often a bottleneck)

TERTIARY AXIS — Onboarding model
├── Self-serve (no human touch)
├── Tech-touch (automated + occasional human)
└── High-touch (dedicated CSM or implementation team)
```

> ⚠️ A "good onboarding experience" means something completely different for each of these. Designing one solution across all of them is how onboarding programs fail.

---

### 2.2 Internal Stakeholders Who Shape Onboarding

| Stakeholder | Their Goal | Their Pain |
|---|---|---|
| Sales | Close the deal | "CS changes expectations I set" |
| Customer Success | Activate and retain | "We inherit poorly scoped deals" |
| Product | Drive feature adoption | "Nobody uses what we built" |
| Legal/Compliance | Protect the company | "We slow things down — we know" |
| IT/Ops | Provision accounts | "We're a bottleneck no one accounts for" |
| Finance | Invoice correctly | "Billing issues trigger customer escalations" |

---

## PHASE 3 — PROBLEM DECOMPOSITION

---

### 3.1 The Onboarding Journey (Typical Phases)

```
[Contract Signed]
       ↓
1. HANDOFF          Sales → CS/Onboarding team
       ↓
2. KICKOFF          Goals set, stakeholders aligned, timeline agreed
       ↓
3. SETUP            Technical configuration, SSO, integrations, data migration
       ↓
4. TRAINING         Admin training → end-user training
       ↓
5. FIRST USE        Customer does the thing they bought it to do
       ↓
6. FIRST VALUE      Customer achieves a measurable outcome
       ↓
7. HANDOFF          Onboarding → ongoing success/support
```

> **Common failure modes exist at every stage.** The problem statement doesn't tell us *where* the breakdown is happening.

---

### 3.2 Failure Mode Library

*These are hypotheses — not diagnoses. Each needs validation.*

**Stage 1 — Handoff failures:**
- Customer information doesn't transfer from CRM to CS team
- Customer's internal champion changes post-sale (no one notices)
- Expectations set in sales don't match what CS delivers
- Days or weeks pass before first CS contact ("dead zone")

**Stage 2 — Kickoff failures:**
- No agreed success criteria → nothing to measure
- Wrong people in the room (economic buyer never returns)
- Timeline is aspirational, not realistic
- Customer hasn't done internal prep work (didn't know they needed to)

**Stage 3 — Setup failures:**
- IT provisioning takes weeks
- Integration complexity was undersold
- Data migration is messier than expected
- Security review becomes a blocker no one planned for

**Stage 4 — Training failures:**
- Generic training not relevant to customer's use case
- Training happens before the system is ready (knowledge evaporates)
- End users are never told *why* this change is happening
- No internal champion to reinforce learning

**Stage 5/6 — Value failures:**
- "First use" isn't meaningful — it's just clicking around
- No defined first success milestone
- Customer declares victory too early (surface engagement, not real value)
- Customer gets stuck and quietly disengages

**Stage 7 — Transition failures:**
- Customer feels dropped after onboarding ends
- New CSM knows nothing about the customer's history
- No clear "graduation" moment — just sudden silence

---

### 3.3 The Underlying Tensions

These structural tensions create onboarding problems that **process improvements alone won't fix:**

```
SPEED ←————————————————→ THOROUGHNESS
(Customer wants fast)      (Success requires depth)

STANDARDIZATION ←——————→ CUSTOMIZATION
(Scale requires templates)  (Customers want to feel unique)

CUSTOMER OWNERSHIP ←———→ VENDOR GUIDANCE
(Empowerment)               (Hand-holding)

SALES PROMISE ←————————→ DELIVERY REALITY
(What was sold)             (What can be delivered)
```

---

## PHASE 4 — RESEARCH AGENDA

*What we'd need to learn before designing solutions.*

---

### 4.1 Quantitative Signals to Find First

```
□ Time-to-first-login (by segment)
□ Time-to-first-value (if defined — if not, define it)
□ Onboarding completion rate (% who finish structured onboarding)
□ 90-day retention rate vs. onboarding completion correlation
□ CSAT/NPS at onboarding completion (vs. 6-month NPS)
□ Support ticket volume during onboarding period
□ Days from contract signed to kickoff call scheduled
□ % of customers who miss their own onboarding milestones
□ Churn analysis: do churned customers share onboarding patterns?
```

> These numbers often already exist and tell you exactly where to look. Pull these *before* doing interviews.

---

### 4.2 Qualitative Research Questions

**For recently onboarded customers (completed successfully):**
- Walk me through the first 30 days. What surprised you?
- What would you have wanted to know on day one that you didn't?
- What moment made you feel confident you'd made the right decision?
- What almost derailed things internally?

**For customers who churned or went silent during onboarding:**
- What was your expectation going in? How did reality differ?
- At what point did momentum stall? What caused it?
- What would have had to be different for you to continue?
- Who internally owned this implementation, and what happened to them?

**For internal CS/onboarding team:**
- Which customer types consistently struggle, and why?
- What information do you wish you had at the start that you don't get?
- Where do you spend time that customers never see value from?
- What do you do manually that should be automated?

**For sales:**
- What do you tell customers onboarding will look like?
- Where do you see CS set customers up differently than you expected?
- What objections come up in deals that relate to implementation complexity?

---

### 4.3 Research Methods Prioritized

| Method | What It Reveals | When |
|---|---|---|
| Data audit (existing metrics) | Where the drop-offs actually are | Week 1 |
| CS team interviews | Ground truth on failure patterns | Week 1–2 |
| Customer interviews (recent onboardees) | Lived experience, emotional journey | Week 2–3 |
| Churned customer outreach | The signal you're most avoiding | Week 2–3 |
| Shadow sessions (observe live onboarding) | What actually happens vs. what's documented | Week 3–4 |
| Support ticket analysis | Volume/theme/timing of friction | Week 1–2 |

---

## PHASE 5 — OPPORTUNITY SPACE MAPPING

*Before solutions: what categories of improvement exist?*

---

### 5.1 Opportunity Clusters

**Cluster A — Expectation Alignment**
Ensuring what's sold matches what's delivered, and customers know what *they* must bring to make it work.
- Better pre-onboarding "readiness" materials
- Sales-to-CS handoff protocol
- Explicit success criteria at kickoff

**Cluster B — Time Compression**
Reducing the time between contract and first value, eliminating dead zones and unnecessary delays.
- Automated provisioning
- Pre-kickoff self-setup flows
- Parallel rather than sequential onboarding steps

**Cluster C — Personalization at Scale**
Making standardized onboarding feel relevant to the customer's actual use case.
- Segmented onboarding tracks by industry/size/use case
- Configurable templates
- Use-case-specific "quick win" playbooks

**Cluster D — Customer Empowerment**
Building internal capability so customers don't depend on vendors to succeed.
- Champion enablement resources
- End-user communication toolkits
- Self-service knowledge and troubleshooting

**Cluster E — Visibility and Accountability**
Giving both sides a shared view of progress, blockers, and ownership.
- Shared onboarding project plan (customer-facing)
- Milestone tracking and automated nudges
- Escalation triggers when customers go quiet

**Cluster F — Human Connection**
The relationship layer that makes customers feel cared for, not processed.
- Proactive check-ins at predicted friction points
- Named CSM from day one
- Executive sponsor touchpoints for enterprise

---

### 5.2 Opportunity Prioritization Matrix

*Hypothetical — requires validation data to make real*

```
HIGH IMPACT │ B (Time Compression)    │ E (Visibility)         │
            │ A (Expectation align.)  │ C (Personalization)    │
────────────┼─────────────────────────┼────────────────────────┤
LOW IMPACT  │ D (Empowerment)         │ F (Human Connection)   │
            │                         │                         │
            └─────────────────────────┴────────────────────────┘
               LOW EFFORT                  HIGH EFFORT
```

> ⚠️ This matrix is illustrative. **Don't trust any prioritization that happens before customer research.** The point is to have a structure ready to populate with real findings.

---

## PHASE 6 — SOLUTION DIRECTIONS

*Not recommendations — directions worth prototyping/testing*

---

### Direction 1 — The "Day Zero" Package
*Address the dead zone between contract signing and kickoff*

A structured, self-guided experience delivered immediately after contract signature — before the CSM is even assigned — that helps customers:
- Understand what they need to prepare
- Gather the right internal stakeholders
- Complete pre-work so kickoff is productive

**Why it might work:** Customers are most motivated immediately after buying. Momentum dies in silence.
**Risk:** If generic, customers ignore it. Requires segmentation.

---

### Direction 2 — The Shared Success Plan
*A single artifact both sides own*

A lightweight, visible project plan co-created at kickoff that defines:
- What success looks like (in customer's terms)
- Who owns what (customer-side and vendor-side)
- Key milestones and decision points
- What happens when things slip

**Why it might work:** Accountability without a shared plan is theater. Most onboarding failures are about unclear ownership.
**Risk:** Requires discipline to maintain; can become shelfware.

---

### Direction 3 — The "Quick Win" Track
*Engineer an early, meaningful success in the first 2 weeks*

Regardless of full onboarding scope, define a specific, achievable outcome that customers can reach fast — and build a dedicated path to it.

**Why it might work:** Early wins build internal advocacy and reset customer confidence.
**Risk:** Quick wins must be real, not cosmetic. "You logged in!" is not a win.

---

### Direction 4 — Champion Enablement Kit
*Help your customer's internal champion succeed internally*

Give the admin/champion tools to communicate change, train their team, and demonstrate value to their own executives.

**Why it might work:** Onboarding often fails not because of your product but because the customer's internal rollout fails.
**Risk:** Requires deep enough relationship to hand this over; champion must actually use it.

---

### Direction 5 — Friction Signal System
*Build an early-warning layer*

Automated detection of customers who are going quiet, missing milestones, or showing low engagement — triggering proactive outreach before they disengage.

**Why it might work:** Most onboarding failures are predictable. Intervention works when it's early.
**Risk:** Requires data infrastructure; CSMs need to actually respond to signals.

---

## PHASE 7 — WHAT TO DO NEXT

---

### Immediate Actions (This Week)

```
□ 1. Pull the data audit — find your existing metrics
      (time-to-kickoff, time-to-first-login, 90-day retention
       by onboarding completion, support ticket timing)

□ 2. Interview 3–5 people on your CS/onboarding team
      Ask: "Where does onboarding consistently break down?"
      Ask: "What would you change if you could change one thing?"

□ 3. Define what "successful onboarding" means for your company
      If you don't have a definition, that's your first problem.
```

### Short-Term (Next 2–4 Weeks)

```
□ 4. Customer interviews — 6–8 recently onboarded customers
      (mix of "it went well" and "it was rocky")

□ 5. Attempt to reach 2–3 churned customers or those who went
      silent during onboarding

□ 6. Shadow at least 2 live onboarding sessions — observe, don't help
```

### Synthesis Milestone

After the above: **run a half-day synthesis session** to:
- Map findings to the failure mode library
- Identify the top 3 validated friction points
- Prioritize the solution directions with evidence
- Define a 90-day improvement roadmap

---

## KEY QUESTIONS TO KEEP VISIBLE

*These should stay on the wall throughout this work:*

1. **Where in the journey does momentum most commonly stall — and why?**
2. **What does "successfully onboarded" actually mean in measurable terms?**
3. **Who inside the customer's organization is responsible for making this work — and are we supporting them?**
4. **What did we promise during the sale that we're not consistently delivering?**
5. **What does a customer who churned at month 6 have in common with their onboarding experience?**

---

*This pipeline has surfaced the territory. The next move is empirical — get into the data and into conversations before committing to solutions.*
