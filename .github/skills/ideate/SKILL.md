---
name: ideate
description: >
  Structured product discovery and ideation. Reads existing pipeline artefacts
  (discovery.md, benefit-metric.md, stories, reference materials) and applies
  structured frameworks to explore the opportunity space before, during, or
  alongside the pipeline. Offers five lenses: opportunity mapping (Torres),
  assumption inventory (Torres), market and competitive scan, product
  strategy framing (Cagan), and jobs-to-be-done (Christensen / Moesta).
  Suggests which lens(es) to run based on current pipeline stage and artefacts
  found. Produces structured artefacts that feed /discovery, /benefit-metric,
  or /definition. Safe to run at any stage — does not replace /discovery,
  enriches and precedes it.
triggers:
  - "ideate"
  - "ideation"
  - "explore opportunities"
  - "what should we build"
  - "what should we build next"
  - "what do users need"
  - "opportunity mapping"
  - "opportunity tree"
  - "assumption mapping"
  - "what are we assuming"
  - "stress-test our assumptions"
  - "market research"
  - "competitive analysis"
  - "continuous discovery"
  - "product discovery"
  - "product strategy framing"
  - "torres"
  - "cagan"
  - "jobs-to-be-done"
  - "jtbd"
  - "job story"
  - "switch interview"
  - "what job are customers hiring"
  - "why do customers switch"
---

# Ideate Skill

## Entry condition

None. Safe to run at any point — on a blank slate, alongside an active
discovery, or before starting any formal pipeline stage.

---

## Step 1 — Load context

Before asking anything, check what artefacts exist for the current feature or
project. Look for:

- `.github/artefacts/[feature-slug]/reference/` — source documents
- `.github/artefacts/[feature-slug]/discovery.md`
- `.github/artefacts/[feature-slug]/benefit-metric.md`
- `.github/artefacts/[feature-slug]/stories/` — any stories already written
- `.github/pipeline-state.json` — current feature list and stages

State what you found:

> **Context loaded:**
> - Discovery: ✅ found ([status]) / ❌ not yet written
> - Benefit metrics: ✅ found ([n] metrics defined) / ❌ not yet written
> - Stories: [n] written / none yet
> - Reference materials: [list filenames] / none
>
> I'll use these to ground the ideation in what's already known.
> What is the focus for this session?
>
> 1. A new feature or initiative not yet in the pipeline
> 2. An existing feature — exploring whether the scope is right
> 3. What to build *next* after the current feature
> 4. A specific customer problem we want to investigate more deeply
>
> Reply: 1, 2, 3, or 4 — or describe in your own words

---

## Step 2 — Suggested lens(es) based on context

Apply this decision table to the artefacts loaded in Step 1, then present a
recommendation **before** showing the full lens menu.

**Decision table:**

| Signal (from Step 1) | Suggest | Rationale |
|---------------------|---------|----------|
| No artefacts at all | D → A | Confirm the strategic bet first (D), then map opportunities (A) |
| Reference materials only, no discovery | E → A | Understand the job the customer is hiring for (E), then map opportunities (A) |
| Discovery (any status), no benefit-metric | B → D | Surface baked-in assumptions before committing to metrics (B), then frame the strategy (D) |
| Discovery approved + benefit-metric, no stories | A → B | Verify opportunity scope is right (A), then surface assumptions before writing stories (B) |
| Stories exist, still in pipeline | B → C | Validate assumptions are still held (B), then competitive context check (C) |
| `ideationSignal: "redesign"` in pipeline-state | E → D | Reframe the job to find the real problem (E), then reassess strategy (D) |
| RISK-ACCEPT decisions present at any stage | B | Those accepted assumptions need to be explicit and tracked in the assumption map |
| Prior `ideation.md` exists, some lenses not run | [remaining lenses] | Continue from where the last session left off |

After applying the table, present:

> **Recommended for your current stage:**
>
> Based on: [e.g. "discovery.md found (status: approved), no benefit-metric written,
> 2 RISK-ACCEPT decisions in decisions.md"]
>
> → **Start with Lens B** (Assumption inventory) — [one sentence why, referencing
>    what was actually found in the artefacts]
>
> → **Then Lens D** (Strategy framing) — [one sentence why]
>
> Ready to start with this? Reply: **yes**
>
> Or choose your own lenses:
> - **A** — Opportunity mapping *(Torres — unmet needs, pain points, desires → opportunity tree)*
> - **B** — Assumption inventory *(Torres — surface and prioritise every baked-in assumption)*
> - **C** — Market and competitive scan *(structured research questions → competitive positioning)*
> - **D** — Product strategy framing *(Cagan — 10-question opportunity assessment → PROCEED / REDESIGN / DEFER)*
> - **E** — Jobs-to-be-Done *(Christensen / Moesta — what progress is the customer hiring for, and why do they switch?)*
>
> Reply: A, B, C, D, E — any combination (e.g. `A B E`) — or **all**

---

## Lens A — Opportunity mapping

*Based on Teresa Torres, Continuous Discovery Habits: the opportunity solution tree.*

The tree has three layers:
1. **Desired outcome** — the business or product result we want to move
2. **Opportunities** — the unmet needs, pain points, and desires in the way of that outcome
3. **Solutions** — ideas that could address one opportunity

### A1 — Identify the desired outcome

If a benefit-metric artefact exists, use the defined metrics as the desired
outcome and confirm:

> **Desired outcome (from benefit-metric.md):**
> [metric name and target]
>
> Is this still the right outcome for this ideation session?
> Reply: yes — or describe a different outcome

If no benefit-metric exists, ask:

> **What outcome does this need to move?**
> Be specific — not "improve the product", but "reduce the time a facilitator
> spends setting up a session from 10 minutes to under 2 minutes".
>
> Reply: describe the outcome

### A2 — Map opportunities

Opportunities are **customer experiences to improve** — framed as unmet needs,
pain points, or desires. They are NOT solutions. They must be neutral enough
that multiple solutions could address each one.

Ask:

> **What observations, feedback, or evidence do you have about where customers
> struggle or what they want in this area?**
>
> Be as specific as possible. If you have quotes or described behaviours, include them.
> I'll help structure them into opportunities.
>
> Reply: describe what you know — or "I don't have direct evidence yet" and I'll
> help generate research questions to fill the gap

After the user answers, synthesise into opportunity clusters and present:

> **Opportunity map (draft):**
>
> Outcome: [outcome]
>
> ├── Opportunity cluster 1: [theme]
> │   ├── [specific opportunity — unmet need / pain point / desire]
> │   └── [specific opportunity]
> ├── Opportunity cluster 2: [theme]
> │   └── [specific opportunity]
> └── [emerging opportunity — worth investigating but not yet evidenced]
>
> How does this look? Missing anything?
> Reply: looks right — or correct / add [specific thing]

### A3 — Prioritise

Ask:

> **Which opportunities are most important and most underserved?**
>
> For each cluster, rate:
> - **Importance:** how much does your customer care about this? (High / Medium / Low)
> - **Current satisfaction:** how well is this served today by existing solutions? (High / Medium / Low)
>
> The best opportunities are high importance + low current satisfaction.
>
> Reply: rate each — or "I don't know, help me think through it"

Present a prioritised opportunity table:

> | Opportunity | Importance | Current satisfaction | Priority |
> |-------------|-----------|---------------------|----------|
> | [opportunity] | High | Low | 🟢 Top |
> | [opportunity] | Medium | Medium | 🟡 Watch |
> | [opportunity] | Low | High | ⚪ Pass |

### A4 — Seed solutions

For the top 1–2 opportunities only:

> **For [top opportunity], what solutions come to mind?**
>
> At this stage solutions are hypotheses, not commitments. Wide thinking is
> better than narrow. Include ideas that seem obvious and ideas that seem odd.
>
> Reply: list ideas — or "I have no ideas yet, prompt me with some directions"

Record solutions as hypotheses linked to their parent opportunity. These feed
directly into /discovery as potential scope options.

---

## Lens B — Assumption inventory

*Based on Teresa Torres — assumption mapping.*

Every product decision bakes in assumptions. Making them explicit and testing
the riskiest ones first prevents building a fully-working solution to the wrong
problem.

### B1 — Extract assumptions from artefacts

If artefacts exist, scan them and extract all baked-in assumptions. Categorise
each by type:

| Type | Question it answers |
|------|---------------------|
| **Desirability** | Do customers want this? Will they use it? |
| **Viability** | Will this work for the business? Can we sustain it? |
| **Feasibility** | Can we build this with the time, tech, and skills we have? |
| **Ethical** | Should we build this? What are the unintended consequences? |

Present the extracted assumptions:

> **Assumptions I found in the artefacts:**
>
> *Desirability:*
> - [assumption — e.g. "Facilitators want to reuse sessions across workshops"]
>
> *Viability:*
> - [assumption — e.g. "The workshop canvas can be offered as a free tool and funded by adjacent paid features"]
>
> *Feasibility:*
> - [assumption — e.g. "Client-side drag-and-drop can be implemented in two sprints"]
>
> *Ethical:*
> - [assumption — e.g. "Storing session data locally is acceptable to users"]
>
> What's missing? Any assumptions I haven't surfaced?
> Reply: add [specific assumption] — or looks complete

### B2 — Prioritise by risk

Ask for each assumption (or have the user rate them):

> **For each assumption, rate:**
> - **Risk if wrong:** how bad is it if this assumption turns out to be false? (High / Medium / Low)
> - **Known-ness:** how well evidenced is this assumption already? (Evidence / Inference / Guess)
>
> The riskiest assumptions to test first are: High risk + Guess.
>
> Reply: rate each — or "prompt me through them one at a time"

Present the prioritised assumption map:

> | Assumption | Type | Risk if wrong | Known-ness | Priority |
> |-----------|------|--------------|------------|----------|
> | [assumption] | Desirability | High | Guess | 🔴 Test first |
> | [assumption] | Feasibility | Medium | Inference | 🟡 Test before build |
> | [assumption] | Viability | Low | Evidence | 🟢 Accept |

### B3 — Suggest tests

For each 🔴 assumption:

> **To test "[assumption]", the smallest experiment might be:**
>
> - **Interview approach:** [specific question to ask in a customer conversation]
> - **Prototype test:** [what to show and what to observe]
> - **Data proxy:** [existing data that would give a signal without building anything]
>
> Which of these is feasible right now?
> Reply: [interview / prototype / data] — or "none, acknowledge as risk and proceed"

If "acknowledge as risk" — add to /decisions as RISK-ACCEPT with the assumption
stated explicitly. Flag it in the ideation artefact.

---

## Lens C — Market and competitive scan

This lens generates structured research questions. The user runs these against
external sources (web search, industry reports, user interviews, competitor
demos). Findings are returned and synthesised into the artefact.

### C1 — Frame the scan

> **To frame the scan, confirm:**
>
> 1. Who is the primary customer/user? (brief description)
> 2. What is the core job-to-be-done they are trying to accomplish?
> 3. What is the main category this product/feature sits in?
>
> Reply: answer each, or "use what's in the discovery artefact"

### C2 — Generate research questions

Produce a structured set of research prompts across six dimensions:

> **Research questions — take these to external sources:**
>
> **Dimension 1: Customer problem evidence**
> - How do [primary customers] currently solve [job-to-be-done] without this product?
> - What do they complain about with existing approaches? (search forums, reviews, social)
> - What language do they use to describe the problem? (important for messaging)
>
> **Dimension 2: Existing solutions**
> - What products/tools directly compete with this feature?
> - What does each solution do well? What do customers complain about?
> - Are any of these growing fast or losing ground — and why?
>
> **Dimension 3: Adjacent solutions**
> - What products solve a related problem for the same customer?
> - Could any adjacent solution expand to compete with this?
>
> **Dimension 4: Market signals**
> - Are there recent funding rounds, acquisitions, or launches in this space?
> - What does search trend data show for the core problem keywords?
> - Are there conferences, communities, or influencers focused on this problem?
>
> **Dimension 5: Differentiation**
> - On what dimension could we be meaningfully different or better?
>   (price, speed, simplicity, integration, audience fit, depth of feature)
> - Is there a segment that is underserved by current solutions?
>
> **Dimension 6: Timing**
> - Is there a reason this is more tractable now than it was 2 years ago?
>   (new technology, regulatory change, behaviour shift, ecosystem gap)
>
> Run these questions and bring back findings. I'll synthesise them.
> Reply: [paste findings] — or "I'll run these and come back"

### C3 — Synthesise findings

When findings are returned:
- Extract key signals per dimension
- Identify the most important insight (the one that most changes or confirms the plan)
- Flag any finding that contradicts an assumption from Lens B
- Output a competitive positioning summary: who are we for, what problem, versus whom

---

## Lens D — Product strategy framing

*Based on Marty Cagan (SVPG) — product discovery and opportunity assessment.*

This lens tests whether this is the right bet before investing in full discovery
and definition. It asks ten structured questions. Some can be answered from
artefacts; others require the user to think carefully.

> **Product opportunity assessment — ten questions:**

Walk through each question. If a discovery or benefit-metric artefact exists,
pre-fill answers where possible and ask for confirmation.

> **1. Exactly what problem will this solve?**
> (Value proposition — be specific about the pain or unmet need, not the solution)
>
> Reply: [describe problem]

> **2. For whom are we solving it?**
> (Target customer — be as specific as possible: role, context, frequency of need)
>
> Reply: [describe customer]

> **3. How will we measure success?**
> (Primary metric — what changes in the world if this works?)
>
> Reply: [describe metric — or "use benefit-metric.md"]

> **4. What alternatives exist today?**
> (How is the customer solving this now, without your product?)
>
> Reply: [describe alternatives]

> **5. Why are we best suited to solve this?**
> (What gives us an unfair advantage — data, distribution, expertise, trust?)
>
> Reply: [describe differentiator]

> **6. Why now?**
> (What's changed that makes this the right moment? Ignore this and you may
> either be too early or already too late.)
>
> Reply: [describe timing signal]

> **7. How will we reach customers?**
> (Go-to-market: existing channel, new channel, partnership, viral mechanic?)
>
> Reply: [describe channel]

> **8. What does the MVP need to do to earn trust?**
> (Not feature completeness — what is the minimum the product must do to prove
> the core value proposition to its first real user?)
>
> Reply: [describe MVP threshold]

> **9. What are the critical risk factors?**
> (Desirability / Viability / Feasibility / Ethical — the top 2–3 things that
> could make this fail even if well executed)
>
> Reply: [list risks]

> **10. Given the above — proceed, redesign, or defer?**
> (This is a human judgment call. I'll present the summary and you decide.)

Present a summary framing:

> **Opportunity assessment summary**
>
> | Question | Signal | Confidence |
> |----------|--------|-----------|
> | Problem | [summary] | Strong / Uncertain / Weak |
> | Customer | [summary] | Strong / Uncertain / Weak |
> | Metric | [summary] | Strong / Uncertain / Weak |
> | Alternatives | [summary] | Strong / Uncertain / Weak |
> | Differentiation | [summary] | Strong / Uncertain / Weak |
> | Timing | [summary] | Strong / Uncertain / Weak |
> | Channel | [summary] | Strong / Uncertain / Weak |
> | MVP threshold | [summary] | Strong / Uncertain / Weak |
> | Risk | [summary] | High / Medium / Low |
>
> **Recommendation:** [PROCEED / REDESIGN / DEFER]
> Rationale: [1–3 sentences]
>
> Do you agree with this read?
> Reply: proceed — or disagree, here's why

---

## Lens E — Jobs-to-be-Done (JTBD)

*Framework: Clayton Christensen, Bob Moesta — JTBD theory and Switch interview*

The core insight: customers don't buy products. They **hire** them to make
progress in a specific situation. Understanding what job they're trying to
accomplish — and what they're currently hiring to do it — reveals the real
competition and the true value threshold the new solution must clear.

### E1 — Identify the job

A job is stable, context-specific, and driven by a desire for progress.
It has three dimensions:

| Dimension | Question it answers | Example |
|-----------|--------------------|---------| 
| **Functional** | What task is being accomplished? | "Complete a workshop session debrief" |
| **Social** | How does the customer want to be seen by others while doing this? | "Be seen as a structured, credible facilitator" |
| **Emotional** | How does the customer want to feel while doing this? | "Feel confident the team reached a shared view" |

Ask:

> **In one sentence: what progress is your customer trying to make?**
>
> Frame it as: "I want to be able to [functional progress] so that [social / emotional outcome]."
>
> Reply: describe the job — or "not sure, help me find it"

If unsure, ask these one at a time:
1. "What does the customer feel *before* using your product? What's generating friction?"
2. "What does the customer feel *after* a successful use? What is now better?"
3. "In what specific situation does this need arise? Time of day, role, context, trigger?"

### E2 — Identify current hire and real competition

Ask:

> **What is the customer currently "hiring" to do this job?**
>
> The real competition is rarely the obvious alternative. It's often a
> spreadsheet, a series of meetings, a manual workaround, or simply doing nothing.
>
> - What existing product, process, or tool are they using right now?
> - What do they do when that fails, feels too slow, or frustrates them?
>
> Reply: describe current hire(s)

Present:

> **Current hire analysis:**
>
> | Current hire | What it does well | What creates friction / drives a switch |
> |-------------|------------------|----------------------------------------|
> | [current solution] | [strengths] | [pressure points] |

### E3 — Four Forces (Switch interview simulation)

Moesta's Four Forces explain why customers switch to a new solution — or don't:

| Force | Direction | What it captures |
|-------|-----------|-----------------|
| **Push** | Away from current | Dissatisfaction driving the search for something better |
| **Pull** | Toward new | What attracts them to the new solution |
| **Anxiety** | Resisting new | Fear of adopting or switching |
| **Habit / inertia** | Resisting new | Comfort with the current way of doing things |

Generate a structured set of interview questions for each force — these are
questions to take to real customers:

> **Push — surface dissatisfaction with the current hire:**
> - "When did you first start thinking the current approach wasn't good enough?"
> - "What was the moment you decided to look for something different?"
> - "What keeps going wrong with how you do this today?"
>
> **Pull — understand what the new solution must do:**
> - "What first made you think [product / feature] might solve this?"
> - "What would make you recommend this to a colleague without hesitation?"
> - "What does 'perfect' look like when this is working as it should?"
>
> **Anxiety — surface adoption blockers:**
> - "What worries you about changing how you do this?"
> - "What would make you hesitate to try a new tool here?"
> - "What could go wrong in the first week with something new?"
>
> **Habit — surface inertia:**
> - "What would you miss about the way you do this today?"
> - "What does your team expect when this kind of task is run?"
>
> Run these questions with real customers.
> Bring back findings and I'll synthesise the forces pattern.

### E4 — Compose the job story

After E1–E3, synthesise into a job story:

> **Job story:**
>
> When **[specific situation / context / trigger]**,
> I want to **[motivation — the progress the customer needs to make]**,
> so I can **[expected outcome — functional, social, or emotional]**.
>
> **Real competition:** [what they are currently hiring — the actual alternative, not the obvious one]
>
> **Switch threshold:** The new solution must outperform the current hire on
> [specific dimension] by enough to overcome [primary anxiety or habit barrier].
>
> Does this capture the job? Reply: yes — or correct [what needs changing]

The job story feeds directly into:
- Lens A — the `job` becomes the `desired outcome` at the root of the opportunity tree
- Lens D — answers Q2 ("for whom, in what situation") and Q4 ("what alternatives exist")
- `/discovery` — customer section (primary customer, context, current workaround)

---

## Output

Conforms to `.github/templates/ideation.md`.
Save to `.github/artefacts/[feature-slug]/research/ideation.md`.

One file per session. If this is the second ideation session for the same
feature, create `ideation-2.md` and note what changed from the first.

---

## How this feeds the pipeline

| Lens output | Feeds |
|-------------|-------|
| Opportunity map | `/discovery` — as the opportunity framing section; top opportunities become candidate scope |
| Assumption inventory | `/discovery` — assumptions section; 🔴 assumptions become open questions; `/decisions` — RISK-ACCEPTs |
| Market scan synthesis | `/discovery` — competitive context section; `/benefit-metric` — market sizing signals |
| Strategy framing summary | `/discovery` — rationale section; confirms or challenges the proposed MVP scope |
| Jobs-to-be-Done | `/discovery` — customer section (job, situation, real competition); Lens A root desired outcome; Lens D Q2 + Q4 |

If `/discovery` has not yet been run, the ideation artefact is the input
document for that step. If `/discovery` is already complete, the ideation
artefact can be used to revise scope before proceeding to `/definition`.

---

## What this skill does NOT do

- Does not conduct interviews — generates questions and synthesises answers you bring back
- Does not access the web — generates research prompts you take to external sources
- Does not replace /discovery — it feeds and precedes it
- Does not commit to a scope — all outputs are hypotheses until the formal pipeline validates them
- Does not run experiments — identifies assumptions to test; /spike can run a timeboxed investigation

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

Update `.github/pipeline-state.json` in the **project repository** when the ideation artefact is saved:

- Set `ideationPath: ".github/artefacts/[feature-slug]/research/ideation.md"` on the feature object
- If Lens D was run and recommendation is PROCEED: set `ideationSignal: "proceed"`
- If REDESIGN: set `ideationSignal: "redesign"`
- If DEFER: set `ideationSignal: "defer"`
- If only Lens A/B/C were run: set `ideationSignal: "in-progress"`
- Set `updatedAt: [now]` on the feature record
