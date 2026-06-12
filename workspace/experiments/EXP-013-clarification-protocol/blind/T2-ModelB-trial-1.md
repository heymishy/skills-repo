# Discovery Pipeline: Improve Onboarding Experience for New Business Customers

---

## ⚠️ Before We Dive In — A Honest Framing Check

This input is a **solution-adjacent assumption**, not a problem statement yet.

> "Improve onboarding" presupposes that onboarding *is* the problem, that it's a *fixable process issue*, and that it sits with *the business* to fix. All of that might be true — but we should earn those conclusions, not start with them.

Let's run the full pipeline.

---

## STAGE 1: Problem Decomposition

### 1.1 — Unpack the Language

| Term | Hidden Assumption | Questions to Challenge It |
|---|---|---|
| **"Improve"** | Current state is suboptimal in a known way | Compared to what benchmark? Who says it's broken? |
| **"Onboarding"** | There is a discrete, identifiable onboarding phase | Where does onboarding start and end? Who owns it? |
| **"Experience"** | The issue is experiential/perceptual, not structural | Is this about *feeling* welcomed or *actually succeeding*? |
| **"New"** | The problem is limited to early lifecycle | Do problems actually originate earlier (sales) or later (adoption)? |
| **"Business customers"** | B2B context, homogeneous group | Which segment? SMB? Enterprise? Regulated industries? |

---

### 1.2 — The 5 Whys (Hypothetical Chain)

```
Why improve onboarding?
→ Because new customers are struggling after signup.

Why are they struggling?
→ They can't get value from the product fast enough.

Why can't they get value fast enough?
→ Setup is complex and support is slow/insufficient.

Why is setup complex and support insufficient?
→ The product wasn't designed with their workflow in mind,
  and support is reactive rather than proactive.

Why wasn't it designed for their workflow?
→ We don't fully understand what "success" looks like 
  for different customer types.
```

**Root hypothesis emerging:** The issue may not be *onboarding mechanics* — it may be **insufficient understanding of what customer success actually requires**, which then manifests as a broken onboarding experience.

---

### 1.3 — Problem Reframes

Before accepting "improve onboarding," consider these alternative framings:

| Reframe | What It Changes |
|---|---|
| **"Reduce time-to-first-value"** | Focuses on outcome, not process — might implicate product design, not just onboarding |
| **"Reduce early churn"** | Makes success measurable; broadens scope to sales promises vs. delivery reality |
| **"Close the expectation gap"** | Suggests the problem lives partly in *sales/marketing*, not just post-sale |
| **"Build customer confidence faster"** | Emotional/relational frame — might implicate human touchpoints, not just UX |
| **"Scale onboarding without scaling cost"** | Business efficiency frame — completely different solution space |

**These aren't synonyms. Each leads to different solutions.**

---

## STAGE 2: Assumption Mapping

### 2.1 — Critical Assumptions to Surface

```
CERTAINTY
    │
    │  ██ "New customers exist and are being acquired"
    │  ██ "There is an onboarding process today"
    │
    │  ░░ "The current process is materially suboptimal"
    │  ░░ "Customers experience onboarding as a problem"
    │  ░░ "Improving it will affect retention/revenue"
    │
    │  ·· "We know what 'better' looks like"
    │  ·· "Customers want more onboarding, not less"
    │  ·· "Onboarding is the primary friction point"
    │
LOW ─────────────────────────────────────────────────
         LOW ←——— EVIDENCE ———→ HIGH
```

### 2.2 — The Riskiest Assumptions

These could invalidate the entire effort if wrong:

1. **Customers attribute their struggles to onboarding** *(vs. product gaps, pricing confusion, or internal adoption resistance)*
2. **Improving onboarding will measurably change retention or expansion** *(correlation vs. causation)*
3. **"Business customers" are similar enough to address with one solution** *(an enterprise and an SMB have radically different needs)*

---

## STAGE 3: Stakeholder & Perspective Mapping

### 3.1 — Who Has a Stake in This?

```
                    THE CUSTOMER ORG
                    ┌─────────────────────────┐
                    │ Economic Buyer          │ → Cares: ROI, risk, speed
                    │ Champion/Power User     │ → Cares: usability, capability
                    │ End Users               │ → Cares: ease, not disrupting workflow
                    │ IT/Security             │ → Cares: compliance, integration
                    └─────────────────────────┘

                    YOUR ORG
                    ┌─────────────────────────┐
                    │ Sales                   │ → May overpromise; handoff quality
                    │ Customer Success        │ → Owns onboarding; capacity constrained
                    │ Product                 │ → Setup UX; in-app guidance
                    │ Support                 │ → Fielding early tickets
                    │ Marketing               │ → Expectation-setting pre-sale
                    └─────────────────────────┘
```

**Critical insight:** Onboarding failure is almost always **a cross-functional problem** blamed on a single team. Any solution that lives only in Customer Success will be insufficient.

---

### 3.2 — Perspective Tensions to Explore

| Tension | Why It Matters |
|---|---|
| CS wants high-touch → Business wants scalable | These are structurally opposed; which wins shapes everything |
| Sales promises speed → CS knows complexity | The expectation gap is set before onboarding begins |
| Product wants self-serve → Customers want human guidance | Automation vs. relationship isn't neutral |
| "Success" means different things | Vendor: retention. Customer: business outcome. Not the same. |

---

## STAGE 4: Evidence & Signal Audit

### 4.1 — What Evidence Would We Actually Need?

*Ranked by diagnostic value:*

**🔴 Must Have (Without this, we're guessing)**
- [ ] Churn/expansion data segmented by onboarding cohort
- [ ] Time-to-first-value metrics (if defined — if not, that's the problem)
- [ ] Direct customer interviews: *what did struggle feel like and when?*
- [ ] Support ticket analysis: volume, category, and timing in customer lifecycle

**🟡 Should Have**
- [ ] NPS/CSAT broken down by lifecycle stage
- [ ] Product usage data in first 30/60/90 days
- [ ] Sales-to-CS handoff quality audit
- [ ] Onboarding completion rates by step

**🟢 Nice to Have**
- [ ] Competitive benchmarking
- [ ] Customer effort scores at key moments
- [ ] Employee interviews (CS, Sales) on where onboarding breaks

---

### 4.2 — Common Signal Traps

> Watch out for these misleading signals:

- **Satisfaction ≠ Success:** Customers who complete onboarding happily and still churn. You optimized the wrong thing.
- **Loudest complaints ≠ Most common problems:** Enterprise customers escalate; SMBs just leave.
- **Completion rate ≠ Value:** Finishing onboarding steps doesn't mean achieving business goals.

---

## STAGE 5: Solution Space (Held Loosely)

*We are NOT prescribing solutions yet. We're mapping the space so we know what we're choosing between.*

### 5.1 — Intervention Levels

```
UPSTREAM                                                    DOWNSTREAM
────────────────────────────────────────────────────────────────────
Pre-sale          Sign-up        Setup        Activation    Expansion
  │                  │             │              │             │
  ▼                  ▼             ▼              ▼             ▼
Fix expectation   Streamline    In-product     Proactive    Success
gap in sales      data          guidance       check-ins    planning
                  collection    & checklists
```

**The further upstream you intervene, the higher the leverage — and the harder the organizational change.**

### 5.2 — Design Dimensions to Consider

| Dimension | Option A | Option B |
|---|---|---|
| **Touch model** | High-touch human | Self-serve / automated |
| **Timing** | Fixed schedule | Triggered by behavior |
| **Ownership** | CS-led | Product-led |
| **Segmentation** | One-size | By customer type/size |
| **Definition of "done"** | Completed steps | Achieved outcome |

---

## STAGE 6: Discovery Roadmap

### 6.1 — Recommended Next Steps (Sequenced)

```
WEEK 1–2: Define Success First
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ What does a "successfully onboarded" customer look like?
□ Align stakeholders on the metric that matters most
  (retention at 90 days? expansion at 6 months? support tickets?)
□ Segment "business customers" into 2–3 meaningful groups

WEEK 2–4: Diagnosis Before Prescription
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Pull and analyze existing data (churn, usage, support)
□ Interview 8–12 customers: recent churns AND recent successes
□ Interview internal teams: CS, Sales, Support
□ Map the current onboarding journey — as it actually happens,
  not as documented

WEEK 4–5: Synthesize & Prioritize
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Identify top 3 friction points with evidence
□ Identify which are experience problems vs. product problems
  vs. expectation problems
□ Prioritize by: impact × solvability × organizational will

WEEK 5–6: Define Experiments
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Design 2–3 small, fast experiments targeting top friction points
□ Define what success looks like before running them
□ Build in measurement from the start
```

---

## STAGE 7: Key Questions to Drive Discovery

*These are the questions your discovery process should answer — not assumptions to skip past:*

### The Non-Negotiables
1. **What does a successful new customer look like at 30/60/90 days** — and how many customers are actually reaching that state?
2. **At what point in the onboarding journey do customers first experience friction** — and what does that friction feel like to them?
3. **Is this primarily an experience/process problem, a product problem, or an expectation problem** — and who set those expectations?
4. **Are "business customers" one problem or several** — and are you trying to solve for all of them at once?
5. **What happens at the Sales → CS handoff** — and how much of the onboarding problem is actually born there?

### The Productive Provocations
- What if the product itself is the onboarding problem, and no process change will fix it?
- What if customers don't actually want *more* onboarding — they want faster *results*?
- What if your best onboarding customers succeed despite the process, not because of it?
- What if the answer is to onboard *fewer* customers (better qualification) rather than *better*?

---

## Summary: What We Know vs. What We Need to Learn

| Category | Status |
|---|---|
| **The problem is real** | *Assumed — needs validation* |
| **Onboarding is the cause** | *Assumed — needs diagnosis* |
| **Who the customer is** | *Undefined — needs segmentation* |
| **What success looks like** | *Undefined — must define first* |
| **Where friction actually lives** | *Unknown — requires research* |
| **What solution space applies** | *Premature — depends on above* |

---

## The One Thing to Do Next

**Before designing any solution:**

> Run 6–8 customer interviews with a mix of recent churns and recently successful customers. Ask them to walk you through their first 90 days. Listen for the moment things felt uncertain, frustrating, or slow. That's where your real problem statement lives.

Everything else follows from that.

---

*Pipeline complete. This is a discovery map, not a solution. The value is in the questions it forces — not in skipping to answers.*
