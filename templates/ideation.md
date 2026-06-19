# Ideation Artefact

**Feature:** [feature-slug]
**Date:** [YYYY-MM-DD]
**Artefact path:** `artefacts/[feature-slug]/research/ideation.md`
**Lenses run:** [A / B / C / D / E — list those completed]
**Pipeline state signal:** [proceed / redesign / defer / in-progress]

---

## Context loaded

| Artefact | Status at time of ideation |
|----------|--------------------------|
| discovery.md | [found: [status]] / [not yet written] |
| benefit-metric.md | [found: [n] metrics] / [not yet written] |
| Stories | [[n] written] / [none yet] |
| Reference materials | [list filenames] / [none] |

---

## Lens A — Opportunity map

*Framework: Teresa Torres — Continuous Discovery Habits*

### Desired outcome

> [The business or product result this ideation is trying to move.
> Taken from benefit-metric.md if available, otherwise stated here.]

### Opportunity tree

```
Outcome: [desired outcome]

├── Cluster 1: [theme — e.g. "Session setup friction"]
│   ├── [Unmet need: ...]
│   ├── [Pain point: ...]
│   └── [Desire: ...]
│
├── Cluster 2: [theme]
│   ├── [...]
│   └── [...]
│
└── Emerging (limited evidence): [theme — worth monitoring]
    └── [...]
```

### Opportunity prioritisation

| Opportunity | Importance | Current satisfaction | Priority |
|------------|-----------|---------------------|----------|
| [opportunity] | High / Medium / Low | High / Medium / Low | 🟢 Top / 🟡 Watch / ⚪ Pass |

### Top opportunity — seed solutions

> **Opportunity:** [top opportunity]

| Solution hypothesis | Addresses opportunity via | Feasibility signal |
|--------------------|--------------------------|--------------------|
| [idea] | [mechanism] | [note] |

---

## Lens B — Assumption inventory

*Framework: Teresa Torres — assumption mapping*

### Assumptions extracted

| Assumption | Type | Risk if wrong | Known-ness | Priority |
|-----------|------|--------------|------------|----------|
| [assumption] | Desirability / Viability / Feasibility / Ethical | High / Medium / Low | Evidence / Inference / Guess | 🔴 Test first / 🟡 Test before build / 🟢 Accept |

### Test designs (for 🔴 assumptions)

**Assumption:** [assumption text]

| Test approach | Description | What we'd observe if true | What we'd observe if false |
|--------------|-------------|--------------------------|---------------------------|
| Interview | [question to ask] | [signal] | [signal] |
| Prototype test | [what to show and what to observe] | [signal] | [signal] |
| Data proxy | [existing data or metric to read] | [signal] | [signal] |

**Decision:** [run test / RISK-ACCEPT and log in /decisions]

---

## Lens C — Market and competitive scan

*Structured external research synthesis*

### Framing

- **Primary customer:** [description]
- **Core job-to-be-done:** [description]
- **Product category:** [description]

### Research findings

**Dimension 1: Customer problem evidence**

> [Findings from research — quotes, forum threads, review patterns, language customers use]

**Dimension 2: Existing solutions**

| Competitor / solution | Strengths | Customer complaints | Trajectory |
|----------------------|-----------|--------------------|-----------
| [solution] | [what it does well] | [what users complain about] | Growing / Flat / Declining |

**Dimension 3: Adjacent solutions**

> [Products solving a related problem for the same customer that could expand into this space]

**Dimension 4: Market signals**

> [Recent funding, acquisitions, launches, search trend data, conference signals]

**Dimension 5: Differentiation**

> [Dimension on which we could be meaningfully different or better]
> [Underserved segment, if identified]

**Dimension 6: Timing**

> [Why is this more tractable now than 2 years ago?]

### Key insight

> **The single most important finding:** [statement]
>
> **Why it matters:** [1–2 sentences on what it changes or confirms]

### Competitive positioning summary

> We are for **[customer segment]** who need to **[job-to-be-done]**.
> Unlike **[alternative]**, we **[key differentiator]**.

---

## Lens D — Product strategy framing

*Framework: Marty Cagan — SVPG product opportunity assessment*

### Opportunity assessment

| Question | Answer | Confidence |
|----------|--------|-----------|
| What problem will this solve? | [answer] | Strong / Uncertain / Weak |
| For whom? | [answer] | Strong / Uncertain / Weak |
| How will we measure success? | [answer] | Strong / Uncertain / Weak |
| What alternatives exist today? | [answer] | Strong / Uncertain / Weak |
| Why are we best suited? | [answer] | Strong / Uncertain / Weak |
| Why now? | [answer] | Strong / Uncertain / Weak |
| How will we reach customers? | [answer] | Strong / Uncertain / Weak |
| What must MVP demonstrate? | [answer] | Strong / Uncertain / Weak |
| What are the critical risk factors? | [answer] | High / Medium / Low |

### Recommendation

> **[PROCEED / REDESIGN / DEFER]**
>
> Rationale: [1–3 sentences]

---

## Lens E — Jobs-to-be-Done

*Framework: Clayton Christensen, Bob Moesta — JTBD / Switch interview*

### Job statement

> When **[specific situation / context / trigger]**,
> I want to **[motivation — the progress to be made]**,
> so I can **[expected outcome — functional, social, or emotional]**.

| Dimension | Description |
|-----------|-------------|
| Functional job | [what task is being accomplished] |
| Social job | [how the customer wants to be seen while doing this] |
| Emotional job | [how the customer wants to feel while doing this] |

### Current hire and real competition

| Current hire | Strengths | Friction / switch drivers |
|-------------|-----------|--------------------------|
| [current solution] | [what works] | [what creates pressure to switch] |

**Real competition:** [the actual alternative being hired today — often not the obvious competitor]

### Four Forces analysis

| Force | Direction | Key findings |
|-------|-----------|-------------|
| Push | Away from current | [dissatisfaction signals] |
| Pull | Toward new | [what the new solution must do to attract] |
| Anxiety | Resisting new | [adoption barriers to design around] |
| Habit / inertia | Resisting new | [comfort with current that must be overcome] |

### Switch threshold

> The new solution must outperform the current hire on **[specific dimension]**
> by enough to overcome **[primary anxiety or habit barrier]**.

---

## How this feeds the pipeline

| Output | Feeds | Notes |
|--------|-------|-------|
| Opportunity map | `/discovery` | [how it informs scope or framing] |
| Assumption inventory | `/discovery` + `/decisions` | [which assumptions are RISK-ACCEPT] |
| Market scan | `/discovery` + `/benefit-metric` | [key competitive context or sizing signal] |
| Strategy framing | `/discovery` | [confirms / challenges proposed MVP scope] |
| Jobs-to-be-Done | `/discovery` + Lens A | [job statement, real competition, switch threshold] |

---

## Open questions

> [Any questions that came up during ideation that are unresolved and need a decision
> or a /spike before the pipeline can proceed to /discovery or /definition]

| Question | Blocking? | Owner | How to resolve |
|----------|-----------|-------|---------------|
| [question] | Yes / No | [human / /spike] | [how] |
