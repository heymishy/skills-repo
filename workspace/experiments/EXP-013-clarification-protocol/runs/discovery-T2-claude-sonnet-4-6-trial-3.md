# Discovery Pipeline: Improve Onboarding Experience for New Business Customers

---

## What I'm doing and why

Before jumping to solutions, I need to map what we actually *know*, what we're *assuming*, and what we *don't know yet*. This pipeline will surface the real problem space so any eventual solution is aimed at something real.

---

## Stage 1 — Reframing the Input

"Improve onboarding" is a **solution-adjacent statement**, not a problem statement. It presupposes onboarding is the lever. Let me unpack what might actually be going on underneath it.

**Possible underlying tensions:**

| Surface Statement | Possible Real Problem |
|---|---|
| Onboarding needs improving | Customers are churning early and we don't know why |
| Onboarding needs improving | Time-to-value is too long, eroding trust before it builds |
| Onboarding needs improving | Support costs are too high in the first 90 days |
| Onboarding needs improving | Conversion from trial/contract to active use is low |
| Onboarding needs improving | Our team can't scale the current white-glove process |
| Onboarding needs improving | Customers don't understand what they bought |

> ⚠️ **Critical assumption flagged:** We're assuming the *onboarding process* is the problem. It's equally possible the problem is in sales handoff, product complexity, customer expectations set pre-sale, or something else entirely.

---

## Stage 2 — Stakeholder Map

Who is actually involved in or affected by this experience?

```
NEW BUSINESS CUSTOMER
├── Economic buyer (signed the contract — rarely in onboarding)
├── Technical implementer (integrates the product)
├── Day-to-day user / end user (uses it daily)
└── Internal champion (sold it internally, owns success)

YOUR ORGANIZATION
├── Sales (sets expectations, owns handoff)
├── Customer Success / Onboarding team (runs the process)
├── Product (what's actually being onboarded onto)
├── Support (absorbs confusion volume)
└── Finance / Revenue (feels churn and expansion impact)
```

**Key insight:** "New business customer" is not one person. The economic buyer who signed almost never does onboarding themselves. A frequent failure mode is onboarding the *wrong person* or failing to reach the *right person* at all.

---

## Stage 3 — The Experience Timeline

Let me map the likely journey to identify where friction lives:

```
PRE-SALE                    HANDOFF                     ONBOARDING                  ACTIVATION
─────────────────────────────────────────────────────────────────────────────────────────────
Expectations set  →  Contract signed  →  Intro call  →  Setup  →  Training  →  First value  →  Habit
by Sales               (often a gap      (who shows       (tech    (who       moment          formed
                        of days/weeks)    up?)             debt)    attends?)
```

**High-probability friction zones:**

1. **The Handoff Gap** — days or weeks of silence between signature and first CS contact. Buyer enthusiasm decays rapidly here.
2. **The Wrong Room Problem** — onboarding calls attended by people without context or decision-making power.
3. **The Generic Playbook** — one-size onboarding for customers with wildly different use cases, team sizes, and technical maturity.
4. **The First Value Delay** — customers can't point to a concrete win in the first session or first week.
5. **The Invisible Progress Problem** — customers don't know if they're "on track" or what done even looks like.

---

## Stage 4 — Hypotheses Worth Testing

These are testable, not assumed truths:

**H1 — Time-to-first-value is the primary predictor of retention**
*If a customer doesn't achieve a defined milestone within X days, churn probability rises sharply.*
→ Test: Analyze cohort data correlating activation milestones with 90-day retention

**H2 — The handoff moment destroys momentum more than the onboarding content does**
*Customers who experience >5 day gaps post-signature churn at higher rates regardless of onboarding quality.*
→ Test: Measure time-from-close to first CS contact vs. retention

**H3 — Customers don't know what success looks like**
*If asked "what does a successful first 30 days look like to you?" most customers cannot answer clearly.*
→ Test: Add this question to first onboarding call; track answer quality and correlate to outcomes

**H4 — Onboarding is actually fine; the product is the problem**
*Completion rates are high but activation is low, meaning customers finish onboarding but still can't use the product.*
→ Test: Separate onboarding completion metric from actual product adoption metric

**H5 — Scalability is the real constraint, not quality**
*The current process works but cannot grow with the business.*
→ Test: Calculate CS capacity vs. projected new customer volume over next 12 months

---

## Stage 5 — What We Don't Know (The Critical Gaps)

These questions must be answered before any solution is designed:

### About the customer:
- [ ] What does the customer *expect* onboarding to deliver, and by when?
- [ ] What does their internal "selling" of this product to their own team look like?
- [ ] What does failure feel like to them? (Not churn the metric — the *felt experience*)
- [ ] What would make them recommend your onboarding to a peer?

### About your current state:
- [ ] What is the current average time-to-first-value? Is it measured?
- [ ] What % of customers complete onboarding? What % activate?
- [ ] Where do customers drop off, disengage, or go quiet?
- [ ] What does your support ticket data say about where confusion concentrates?
- [ ] What do churned customers say happened? (Exit interviews)

### About the business:
- [ ] Is this primarily a *quality* problem, a *scale* problem, or a *speed* problem?
- [ ] What resources (people, time, tooling) are available to change things?
- [ ] What does "improved" mean in measurable terms? (NPS? Time-to-value? Churn rate? Support volume?)

---

## Stage 6 — Research Methods I'd Recommend

Before building anything, pursue these in priority order:

### 🔴 High Priority — Do These First

**1. Customer interviews (churned + successful)**
Talk to 5 customers who churned in the first 90 days and 5 who became strong users. Ask the same questions. The *contrast* is where the signal lives.

Key questions:
- "Walk me through your first month with us."
- "Was there a moment you thought this might not work?"
- "Was there a moment you thought *yes, this is it*?"
- "What did you wish had happened differently?"

**2. Internal data audit**
Pull whatever exists: time-from-close-to-onboarding-start, onboarding completion rates, first login dates, feature adoption curves, support ticket volume/type in first 90 days, churn timing.

Even incomplete data will reveal patterns.

**3. Shadow an onboarding session**
Observe a live onboarding call without facilitating it. Watch for: confusion moments, questions asked, what gets written down, energy level, who's in the room.

### 🟡 Secondary — Do These Next

**4. Internal stakeholder interviews**
Talk to Sales, CS, and Support separately. Ask: "Where does onboarding break down?" They will give different answers. The gaps between their answers are important.

**5. Competitive scan**
How do 2-3 competitors or adjacent products handle onboarding? Not to copy — to calibrate what customers may be comparing you against.

---

## Stage 7 — Provocations

Questions designed to challenge assumptions and generate new angles:

> *"What if we didn't have an onboarding team at all? What would customers need to be true for them to onboard themselves successfully?"*

> *"What if the goal wasn't to complete onboarding — but to make the customer feel confident? Are those the same thing right now?"*

> *"If our best customer described their onboarding experience, what would they say? Do we know? Have we asked?"*

> *"What's the minimum onboarding that could produce a successful customer? Are we doing more than that because it helps them, or because it helps us feel useful?"*

> *"Is there a version of this problem where Sales is the actual constraint, not onboarding?"*

---

## Stage 8 — Output Summary

### What we know:
- Onboarding is perceived as a problem worth solving
- There are multiple distinct stakeholders with different needs in the "customer" bucket
- The journey has several well-documented failure modes (handoff gap, wrong room, no defined success, delayed value)

### What we're assuming and shouldn't be:
- That the process itself is the problem (vs. handoff, product, or expectation-setting)
- That all customer segments have the same onboarding needs
- That "improved" is understood and shared as a goal internally

### What we need before designing solutions:
- Quantitative baseline: time-to-value, completion rates, churn timing
- Qualitative signal: customer language around failure and success moments
- Internal alignment: what does "improved" mean in measurable terms?

### Recommended next move:
**Run 5 customer interviews (mix of churned and retained) in the next 2 weeks, alongside an internal data audit.** These two inputs together will define the actual problem — and likely reveal that "improve onboarding" needs to be replaced by a much more specific problem statement before any solution work begins.

---

*Want me to go deeper on any stage — generate an interview guide, define success metrics, map a specific part of the journey, or stress-test a particular hypothesis?*