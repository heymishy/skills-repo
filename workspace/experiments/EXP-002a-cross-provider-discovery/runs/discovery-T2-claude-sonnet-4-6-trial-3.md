# Discovery Pipeline: Improve Onboarding Experience for New Business Customers

---

## ⚠️ Before We Go Further — Scoping Questions

The input is broad enough that running straight to solutions would be premature. Let me surface what I *don't* know yet, then work with what I *can* reasonably infer.

---

## Phase 1: Problem Framing

### What "onboarding" could mean here (disambiguation)

| Interpretation | Scope |
|---|---|
| **Technical onboarding** | API keys, integrations, sandbox setup, SSO |
| **Commercial onboarding** | Contracts, billing, provisioning access |
| **User adoption onboarding** | Getting the team to actually *use* the product |
| **Relationship onboarding** | CSM introductions, success planning, QBRs |
| **All of the above** | End-to-end journey from signed → productive |

> **Assumption I'll use:** End-to-end onboarding — from contract signed to "first meaningful value achieved." I'll flag where the answer changes by interpretation.

---

## Phase 2: Stakeholder Map

```
Who experiences the onboarding?

PRIMARY
├── Champion / buyer (exec or manager) ──→ wants ROI proof fast
├── Admin / IT contact ──────────────────→ wants clear technical specs
└── End users (the actual team) ─────────→ want to not be confused

SECONDARY
├── Your CSM / Onboarding team ──────────→ wants scalable, repeatable process
├── Sales (handoff quality) ─────────────→ wants smooth handoff, no blame
└── Product / Engineering ───────────────→ wants signal on friction points
```

---

## Phase 3: Jobs-to-Be-Done (What customers are hiring onboarding to do)

1. **"Get me to value before my boss asks if this was worth it"** — time pressure
2. **"Don't make me feel stupid"** — confidence & competence
3. **"Tell me exactly what to do next"** — decision fatigue reduction
4. **"Make sure my team actually uses this"** — internal adoption risk
5. **"Don't waste my time on things irrelevant to my use case"** — personalization

---

## Phase 4: Likely Pain Points (Hypothesis Map)

### 🔴 High-probability problems (almost universal)

```
HANDOFF GAP
Sales promises X → CSM inherits no context → customer repeats themselves
→ Symptom: "I already told your sales guy this"

TIME-TO-VALUE TOO LONG
Days or weeks before customer sees first win
→ Symptom: Churn in first 90 days; "we never really got started"

GENERIC EXPERIENCE
Same deck, same checklist for $10k and $500k customers
→ Symptom: Customers feel like a number

INTERNAL CHAMPION BURDEN
Your customer has to sell *your product* internally to their own team
→ Symptom: Low seat activation, shelfware
```

### 🟡 Medium-probability problems

```
UNCLEAR SUCCESS DEFINITION
Neither side has agreed what "done" looks like
→ Symptom: Endless onboarding, no graduation milestone

TECHNICAL FRICTION
Integrations, SSO, data migration are blockers nobody owns
→ Symptom: IT tickets stall momentum

CONTENT OVERLOAD
Too much documentation, not enough "just show me"
→ Symptom: Customers stop reading, go quiet
```

### 🟢 Context-dependent problems

```
TIMEZONE / LANGUAGE barriers (if global)
COMPLIANCE requirements slowing provisioning (fintech, healthcare)
MULTI-PRODUCT complexity (customer only needed one thing)
```

---

## Phase 5: Metrics That Would Tell You Where The Problem Is

| Signal | What It Diagnoses |
|---|---|
| **Time-to-first-login** | Technical friction |
| **Time-to-first-value** (TTv) | Overall onboarding effectiveness |
| **Seat activation rate at Day 30** | User adoption problem |
| **Onboarding completion rate** | Drop-off / disengagement |
| **CSM time per customer** | Scalability of current process |
| **NPS / CSAT at Day 30 vs Day 90** | Early sentiment vs. reality |
| **Support tickets in first 60 days** | Confusion / documentation gaps |
| **Expansion revenue in Month 3-6** | Whether onboarding built confidence |

> 🚨 **If you don't have these metrics, that itself is a finding.**

---

## Phase 6: Opportunity Spaces (Where to Play)

```
OPPORTUNITY 1 — Faster Time-to-Value
"How might we get customers to their first win in <X days?"
Best bets: guided quick-start paths, pre-built templates, 
           milestone-driven onboarding flow

OPPORTUNITY 2 — Seamless Sales→CS Handoff
"How might we make customers feel like one team knows them?"
Best bets: shared CRM context, handoff interview template, 
           joint kickoff format

OPPORTUNITY 3 — Self-Serve Onboarding at Scale
"How might we onboard lower-tier customers without CSM hours?"
Best bets: in-app tooltips, video walkthroughs, automated 
           check-in emails tied to behavior

OPPORTUNITY 4 — Customer's Internal Champion Enablement
"How might we help our champion sell adoption internally?"
Best bets: internal launch kits, exec-ready ROI slides,
           team training materials they can run themselves

OPPORTUNITY 5 — Personalized Onboarding Tracks
"How might we make each customer feel the product was built for them?"
Best bets: use-case segmentation, role-based entry points,
           industry-specific quick wins
```

---

## Phase 7: Recommended Discovery Activities

### Do these *before* building anything:

**🎤 Customer interviews (5-8 recent customers)**
```
Questions to ask:
- Walk me through your first week. What did you expect vs. what happened?
- When did you first feel confident the tool was working for you?
- What almost made you give up?
- What did you have to figure out yourself that you wish someone had told you?
- What did you tell your team to get them on board?
```

**📊 Data audit**
```
Pull:
- Login timestamps vs. contract date (TTv proxy)
- Feature adoption curves (which features stick, which don't)
- Support ticket topics in days 1-60
- Churn cohort analysis: did churned customers share onboarding patterns?
```

**🪞 Internal interviews (CSMs, Sales, Support)**
```
Questions to ask:
- What do customers always get stuck on?
- What do you explain in every single kickoff call?
- What do you wish sales had told customers before they got to you?
- If you could remove one step from onboarding, what would it be?
```

**🗺️ Current-state journey mapping**
```
Map every step from "contract signed" → "first value"
Mark: who owns each step, how long it takes, where customers go quiet
```

---

## Phase 8: Prioritization Framework (for when you have findings)

Use **ICE scoring** against each opportunity:

| Criterion | Question |
|---|---|
| **Impact** | How much does fixing this move Time-to-Value or retention? |
| **Confidence** | How sure are we this is the real problem? |
| **Ease** | How fast/cheap can we test or fix it? |

> Start with **high confidence + high ease** — quick wins build credibility with leadership and customers simultaneously.

---

## What I'd Recommend As Your Next 3 Steps

```
WEEK 1
└── Pull your churn and activation data. 
    Identify which onboarding moments correlate with bad outcomes.

WEEK 2
└── Interview 5 customers: 2 who onboarded well, 2 who struggled, 
    1 who churned. The contrast is the insight.

WEEK 3
└── Run a 2-hour internal workshop with Sales, CS, and Support.
    Jointly map the current-state journey. You'll find the handoff 
    gaps and assumption mismatches immediately.
```

---

## Open Questions That Would Change This Analysis

> Answer any of these and I can go deeper in that direction:

1. **What segment?** (SMB self-serve vs. enterprise high-touch vs. mid-market?)
2. **What's your product category?** (SaaS platform, marketplace, hardware+software?)
3. **Do you have a CSM team or is onboarding automated?**
4. **What does your current onboarding flow actually look like?**
5. **Do you have a specific metric that's alarming you right now?** (e.g., "30-day churn is 18%")
6. **What have you already tried?**

---

*Tell me which thread to pull, and I'll go deeper — whether that's journey mapping, specific interview guides, solution concepts, or a prioritized roadmap.*