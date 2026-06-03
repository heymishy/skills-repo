# Ideation: /ideate Web UX — Structured, Stateful, Multi-Panel Skill Interface

| Field | Value |
|-------|-------|
| Feature | 2026-05-21-ideate-web-ux |
| Date | 2026-05-21 |
| Artefact path | artefacts/2026-05-21-ideate-web-ux/research/ideation.md |
| Lenses run | Lens A — Opportunity mapping (Torres) [complete]; Lens D — Product strategy framing (Cagan) [complete]; Lens B — Assumption inventory (Torres) [complete]; Lens C — skipped (internal tool); Lens E — skipped (internal tool) |
| Pipeline state signal | proceed — run /discovery for 2026-05-21-ideate-web-ux; A1 architecture spike first |
| Completed | 2026-06-03 |

---

## Context loaded

| Source | Status | Notes |
|--------|--------|-------|
| Feature discovery.md | Not found — new initiative | No prior artefacts for 2026-05-21-ideate-web-ux |
| Feature benefit-metric.md | Not found — new initiative | — |
| Feature stories | None yet | — |
| artefacts/2026-05-20-cloud-platform/research/ideation.md | Read | Format reference + product context: this UX is a component of the cloud platform, not a standalone product. Lens D, C, E, B ran for cloud platform. |
| artefacts/2026-05-19-cli-deterministic-governance/research/ideation.md | Read | Second format reference. Lens A, B, D ran. |
| src/web-ui/ | Read — full architecture survey | See tech stack confirmation below. |
| .github/skills/ | Read — 40+ skills enumerated | Full skill set known; /ideate is one of ~40 skills. |

**Tech stack confirmed before any design proposal:**

| Layer | Reality |
|-------|---------|
| Runtime | Node.js built-in `http` module — no Express, no framework |
| Frontend | Server-rendered HTML via JS view functions (`renderShell`, `renderChat`, component helpers). No React, Vue, or Angular. |
| State management | Server-side in-memory sessions (Map) + injectable disk session writer. Journey store (`journey-store.js`) is **in-memory only** — not persisted across server restarts. |
| Streaming | Server-Sent Events (SSE) — `handlePostTurnStreamHtml` is implemented and in production use. |
| Split-panel pattern | Already exists — `chat-view.js` renders left: chat thread, right: live `draftSections[]` panel (title / body / state ∈ drafted \| pending \| empty). |
| Input model | Form POST for operator answers; SSE for model streaming back. No WebSocket. |
| Session recovery | **Not natively available across browser close.** Journey store is in-memory. Disk persistence is injectable but only covers session content, not full journey/lens state. Infrastructure change required for cross-session recovery. |
| Auth | GitHub OAuth — `req.session.accessToken`. |

*Design constraint: proposals in this ideation must be realisable within this stack or must explicitly name the infrastructure change required.*

*Session note: Operator context is fully specified. Lenses A → D → B run in that order per operator instruction, pausing after each for confirmation. Lens C and Lens E are skipped (internal tool, not a market product). All eight specific design questions listed in the operator brief must be addressed across the lenses.*

---

## Lens A — Opportunity mapping (Torres)

*Framework: Teresa Torres — Continuous Discovery Habits: opportunity solution tree.*

### Desired outcome

The /ideate session consistently produces a high-quality ideation artefact with the correct comparator frame, confirmed and explicitly rated assumptions, tracked pre-/discovery conditions, and zero session drift — in a single sitting, without requiring the operator to catch errors mid-session or rework assumptions in /benefit-metric or /discovery.

*In measurable terms: the artefact produced by the web UX requires zero operator corrections in /benefit-metric's first pass, and zero pre-/discovery conditions are missed at end-of-session.*

### Opportunity tree

```
Outcome: Zero-drift /ideate sessions that produce artefacts requiring no rework downstream

├── Cluster 1: Context loading is invisible and unverified
│   ├── Pain: Agent reads context files implicitly — operator cannot see what
│   │   was loaded or verify that the correct files were read before the
│   │   session begins reasoning
│   ├── Pain: The wrong comparator is imported silently. In a recent session,
│   │   a named comparator (Loveable/speed-and-wow) contaminated the magic
│   │   moment framing rather than the operator's intended frame (rigour/trust).
│   │   The operator had no interception point before the analysis ran.
│   └── Unmet need: A confirmed context manifest — operator-visible and
│       operator-acknowledged — before the first model turn

├── Cluster 2: Critical assumptions propagate unconfirmed
│   ├── Pain: Cost and pricing assumptions buried in prose are hard to spot
│   │   and correct before they get embedded in downstream lens outputs and
│   │   eventually in /benefit-metric metrics
│   ├── Pain: The comparator frame anchors judgment (e.g. "since Loveable
│   │   charges per session…") without explicit operator confirmation that
│   │   this reference class is valid for this initiative
│   ├── Pain: No structured mechanism exists to extract, surface, and confirm
│   │   assumptions at the point they first appear in the session
│   └── Unmet need: Assumptions rendered as explicit cards with
│       confirm/edit/flag UI at the moment they are introduced

├── Cluster 3: Session has no continuity or recovery
│   ├── Pain: If a session is abandoned mid-lens (browser close, connectivity
│   │   loss, context window exhaustion), the entire session state is lost —
│   │   there is no recovery point
│   ├── Pain: Operator must reconstruct where they were by re-reading a
│   │   partial artefact or chat log on resume
│   └── Unmet need: Per-lens checkpoint that writes session state to disk,
│       enabling the session to be resumed from the last completed lens step

├── Cluster 4: The live artefact is invisible during the session
│   ├── Pain: The operator sees only the chat thread while the session runs.
│   │   The first view of the artefact structure is at commit time — after
│   │   all lenses have completed.
│   ├── Pain: Structural errors (wrong framing, missing sections, incorrect
│   │   opportunity labelling) are caught too late to correct without
│   │   rerunning the affected lens
│   └── Unmet need: A live artefact panel that updates section-by-section as
│       each lens step is confirmed, giving the operator real-time visibility
│       into what is being committed

├── Cluster 5: Input is entirely free-text — no structured operator modes
│   ├── Pain: Every operator action — confirming a lens output, rating an
│   │   assumption, flagging a wrong framing, choosing between lenses — is
│   │   expressed as chat prose. The model must infer the operator's intent.
│   ├── Pain: Agent inference fills ambiguous gaps rather than surfacing them
│   │   as decision points, producing implicit choices that the operator
│   │   never explicitly made
│   └── Unmet need: Structured input modes matched to the cognitive task:
│       confirm (binary), edit (inline text correction), choose (enumerated
│       options), add (append to a list), flag (mark a problem without
│       resolving it immediately)

└── Cluster 6: Pre-/discovery conditions are tracked only at session end
    ├── Pain: Conditions that should gate the session's handoff to /discovery
    │   surface reactively at the end of Lens B rather than being accumulated
    │   throughout the session
    ├── Pain: If the session ends without completing all lenses, the
    │   conditions list is never written — they are lost in the chat log
    └── Unmet need: A persistent conditions sidebar that accumulates
        pre-/discovery conditions throughout the session, with an
        acknowledgement requirement before the artefact can be committed
```

### Opportunity prioritisation

Importance = how much does this cost in downstream artefact quality or operator trust?
Current satisfaction = how well does the current chat experience serve this need?

| Opportunity | Importance | Current satisfaction | Priority | Downstream impact |
|-------------|-----------|---------------------|----------|-------------------|
| Verified context manifest + comparator guard | High | Low | 🟢 Top | Contaminated comparator frame propagates through all lenses, /benefit-metric, and /discovery. Most expensive to fix after the fact. |
| Confirmed assumption cards at point of introduction | High | Low | 🟢 Top | Unconfirmed cost/pricing assumptions become embedded in /benefit-metric metrics — re-work cost is high. |
| Live artefact panel | High | Low | 🟢 Top | Structural errors caught only at commit require partial lens rerun — high disruption per defect. |
| Per-lens session checkpoint (state recovery) | High | Low | 🟢 Top | A lost session mid-lens costs a full resession — the most expensive failure mode. |
| Structured input modes (confirm/edit/choose/add/flag) | Medium | Low | 🟡 Watch | Reduces implicit agent inference; improves operator control — but current sessions complete even with free text. |
| Pre-/discovery conditions sidebar | Medium | Low | 🟡 Watch | Conditions tracked in sidebar prevent end-of-session omissions. Important but discoverable via artefact review if missed. |

### Highest downstream-impact cluster analysis

**Cluster 1 (context visibility) and Cluster 2 (assumption confirmation) have the highest downstream impact.** Both feed directly into /benefit-metric and /discovery. A contaminated comparator or an unconfirmed cost assumption embedded in the artefact becomes a structural defect in the next pipeline stage — it cannot be corrected by /discovery alone without revisiting /ideate. The cost of fixing downstream is proportional to how many lenses and artefacts have been built on the bad assumption.

**Cluster 3 (session recovery) has the highest cost per event.** A lost session mid-lens requires a full re-session. It is lower probability per session but catastrophic when it occurs.

**Cluster 4 (live artefact panel) and Cluster 5 (structured inputs) are enabling conditions** for the above. The comparator guard and assumption cards only work if the operator can see and act on them in a structured interface — which requires both a live panel (Cluster 4) and structured input modes (Cluster 5).

### Top opportunities — seed solutions

**For "Verified context manifest + comparator guard":**
- A pre-session intake form that explicitly names every file to be loaded, with a checklist the operator confirms before turn 1. Files not found display as warnings.
- A comparator field in the intake form where the operator names comparators *and* the comparison dimension ("comparing on: pricing model / onboarding UX / enterprise compliance approach"). Agent receives comparator only after dimension is confirmed.
- A comparator frame review step between intake and Lens A: "You named [X]. The frame dimension you confirmed is [Y]. Should the agent use [X] as an anchor, as a contrast, or as a named example only?" — operator chooses before any analysis runs.

**For "Confirmed assumption cards at point of introduction":**
- Assumption cards rendered in the assumptions panel as the model generates them during lens turns. Each card shows: assumption text, type (desirability / viability / feasibility / ethical), and status (pending confirmation).
- Operator presses "Confirm", "Edit" (inline text), or "Flag" on each card before the session advances to the next lens step.
- P0 assumptions (flagged high-risk + marked as guess) are highlighted in the panel and block lens advancement until a test design is specified or explicitly RISK-ACCEPTED.

---

*Lens A complete. Operator confirmed. Proceeding to Lens D.*

---

## Lens D — Product strategy framing (Cagan)

*Framing question: Is the /ideate → /discovery web UX a coherent strategic investment, or are we solving the wrong layer of the problem?*

*Adapted for an internal/infrastructure tool: Cagan's commercial strategy questions are reframed around delivery quality, operator adoption, and the relationship to the cloud platform commercial path.*

### 10-question strategic assessment

| # | Question | Signal | Confidence |
|---|----------|--------|------------|
| Q1 | What problem does this product solve? | The /ideate skill runs exclusively in chat. Six failure modes identified in Lens A produce downstream defects that propagate into /benefit-metric and /discovery: (1) invisible context loading allows a contaminated comparator frame to anchor all subsequent lens reasoning without the operator being able to intercept it; (2) unconfirmed assumptions become embedded in artefact prose and carry forward as facts; (3) session loss mid-lens costs a full re-session with no recovery; (4) the operator cannot see the artefact structure forming — structural errors surface only at commit; (5) every operator action is free-text chat inference rather than explicit structured confirmation; (6) pre-/discovery conditions accumulate only at Lens B end, meaning a partial session leaves no conditions list. The P0 failure modes (1, 2, 3, 4) each have a documented instance in the cloud-platform ideation session itself. | High |
| Q2 | For whom? | Two operator profiles: **Primary — outer loop initiator:** any operator starting a new feature who uses /ideate to structure discovery before committing scope. Currently that is one person (the platform operator), but the cloud platform's team-tier SaaS model requires that a tech lead with no prior skills-repo experience can run /ideate independently and produce a clean artefact. The web UX is what makes that possible. **Secondary — returning operator:** someone resuming a partially-complete /ideate session after a break or context loss. Currently unserved entirely — resume requires re-reading a partial artefact and reconstructing session state from the chat log. | High for primary; concrete gap for secondary |
| Q3 | How will we measure success? | Two primary metrics: (a) **Downstream rework rate** — proportion of /ideate artefacts requiring operator-driven corrections in /benefit-metric or /discovery before those stages can proceed. Baseline: all P0 failure modes in the cloud-platform session required corrections in subsequent pipeline stages. Target: zero P0 failures in the first 5 features run through the web UX. (b) **Session completion rate** — proportion of /ideate sessions that complete all intended lenses in a single sitting without session loss. Baseline: one documented mid-session loss in ideate-web-ux itself. Target: 100% of sessions produce a committed artefact within the sitting or a resumable checkpoint. Secondary: **time to first clean artefact** — how long does a non-expert operator take to produce an /ideate artefact that passes /benefit-metric without a rework cycle? This is the cloud platform's activation metric. | High — all metrics are directly derivable from existing pipeline artefacts and pipeline-state.json |
| Q4 | What alternatives exist today? | (a) **Chat-only /ideate** (current state): works for expert operators who know the methodology well enough to catch context contamination and unconfirmed assumptions mid-session. Fails for non-experts and partial sessions. (b) **Running /ideate entirely manually** with a text editor and the SKILL.md as a guide: high cognitive load, no structured prompts, no artefact panel, no session recovery. (c) **Skipping /ideate entirely** and going directly to /discovery: loses the structured opportunity mapping and assumption surfacing. (d) **Doing ideation in Miro/Figjam/Notion**: no pipeline integration, no artefact output, no connection to /benefit-metric or /discovery. | High |
| Q5 | Why is the skills platform best suited to build this? | (1) The web UI infrastructure exists: `chat-view.js`, SSE streaming, split-panel pattern, session management, form POST patterns — all built and in production. Building the /ideate UX is incremental, not foundational. (2) The methodology is already instrumented: each lens is defined, the session flow is specified, the artefact schema is known. The UX is not designing the process — it is revealing a process that already exists. (3) Downstream integration is native: the artefact lands in `artefacts/[feature-slug]/research/ideation.md` — the same git path /benefit-metric and /discovery read from. No competitor has this combination of methodology depth, enforcement infrastructure, and existing web UI foundation. | High |
| Q6 | Why now? | Three timing signals: (a) **The web UI layer is complete**: wuce (26 stories), dsq, ougl, owle, wsm, wucp all merged. The /ideate UX is the first outer-loop skill to get a structured web interface — the infrastructure investment is already sunk. (b) **The cloud platform path requires it**: the commercialisation ideation identified the team-tier SaaS magic moment as "a tech lead completes a full outer + inner loop run without advisory." That cannot happen if /ideate and /discovery are chat-only. (c) **The documented failure modes are live**: every feature that goes through /ideate in chat-only mode before the UX is built is a session that may fail in the same way as this one. | High |
| Q7 | How do operators discover and adopt this UX? | **Path 1 — existing pipeline operators**: operators already using the web UI encounter the /ideate UX naturally when they start a new feature from the web shell. **Path 2 — cloud platform onboarding**: a new team-tier user's first action after sign-up is starting a feature; onboarding routes them to /ideate as the entry point. This is the activation path the cloud platform depends on. **Path 3 — skills-repo open source upgrade**: a tech lead running skills-repo manually discovers the hosted version from the README; their first experience of the SaaS product is the /ideate UX. This is the acquisition funnel. | High — path 1 immediate; paths 2 and 3 are the commercial path |
| Q8 | What must the first-use experience do to earn trust? | The first-use experience must answer one question clearly within the first 30 seconds: **"I can see exactly what the agent is doing and I can correct it."** Specifically: (a) The context manifest must be visible and confirmed before the first model turn. (b) The first assumption card must appear during the first lens turn — not at session end. The operator must have a confirm/edit/flag action available before the agent has written analysis built on that assumption. (c) The artefact panel must show content after the first lens step is confirmed — not after all lenses complete. | High |
| Q9 | Central hypothesis and risks | **Central hypothesis**: a structured multi-panel /ideate UX eliminates the P0 failure modes (context contamination, unconfirmed assumptions, session loss, invisible artefact) and makes the outer loop usable by non-expert operators — the prerequisite for the cloud platform's team-tier activation story. **Three risks**: (a) **Scope creep into /discovery before /ideate is proven** — mitigation: ship /ideate UX first, measure on 3–5 features, then scope /discovery UX. (b) **The split-panel architecture may not directly support assumption cards and a conditions sidebar** — assumption cards require new session state fields and a new panel update mechanism beyond the existing draft-sections model; this needs explicit design, not assumption. (c) **The operator brief's 8 design questions were not captured in the artefact** — Lens B should flush these from the Lens A clusters as the assumption inventory. | Medium on (b); manageable on (a) and (c) |
| Q10 | Proceed / Redesign / Defer? | **PROCEED** on /discovery for `2026-05-21-ideate-web-ux`. The strategic case is strong: clear problem, clear metric, existing infrastructure, direct path to the cloud platform activation story. One open question for Lens B: **Which of the six Lens A opportunity clusters forms the MVP scope?** Recommendation: rank the clusters against the activation test (can a non-expert tech lead complete an /ideate session without advisory?) and scope the MVP to the clusters that block activation. Hypothesis: Clusters 1 (context manifest), 2 (assumption cards), and 4 (live artefact panel) are the activation-blocking P0s. Clusters 3 (session recovery), 5 (structured inputs), and 6 (conditions sidebar) are increment 2. | High |

**Recommendation: PROCEED on /discovery for 2026-05-21-ideate-web-ux**

The strategic logic is tight: the cloud platform's team-tier activation story requires a non-expert tech lead to run a full outer loop independently. The outer loop starts with /ideate. Chat-only /ideate fails for non-experts (documented). The web UX infrastructure is built. The cost of the /ideate UX is incremental. The benefit is the activation prerequisite for the commercial path.

Critical sequencing confirmed: **build /ideate UX before /discovery UX, and /discovery UX before cloud platform MVP.** These are dependencies, not parallel tracks. The cloud-platform pre-/discovery gate 2 (magic moment = one team completes a full outer + inner loop run) cannot be validated without both.

---

*Lens D complete. Operator confirmed. Proceeding to Lens B.*

---

## Lens B — Assumption inventory (Torres)

*Method: surface every structural assumption baked into the Lens A opportunity clusters and the Lens D strategy. Classify each by type (D = Desirability, Fe = Feasibility, Vi = Viability), score by dependency (how much the entire bet depends on it) and evidence (how much we actually know), rank by risk. Produce test designs for P0 and P1 assumptions before any /discovery artefact is written.*

### Full assumption inventory

| ID | Assumption | Type | Dependency | Evidence | Risk |
|----|-----------|------|------------|----------|------|
| **A1** | The existing split-panel + SSE architecture can support assumption cards and a conditions sidebar without a structural rewrite of the session/streaming model | Fe | Critical | Low — untested, inferred from draftSections pattern similarity | **P0** |
| **A2** | Operators will engage meaningfully with the context manifest before turn 1 — they will notice missing/wrong context and act on it, not dismiss or skip past it | D | Critical | Low — no observed behaviour, assumed by design intent | **P0** |
| **A3** | A non-expert tech lead (cloud platform team-tier) fails at /ideate for structurally different reasons than an expert operator — reasons that a structured UX can address, not just better documentation | D | Critical | Low — the entire cloud platform activation story depends on this; never validated with a non-expert | **P0** |
| **A4** | Downstream rework rate is measurable from existing artefacts — we can identify /benefit-metric or /discovery operator corrections that originated as /ideate artefact defects | Vi | Critical | Medium — cloud-platform session has 3 documented instances; general measurement methodology unverified | **P1** |
| **A5** | Assumption cards presented in real-time will be meaningfully reviewed — operators won't click through all confirmations in seconds, defeating the intent | D | Important | Low — interaction model undesigned; platform fatigue risk is real | **P1** |
| **A6** | /ideate session state can be serialised and resumed in a way that preserves the model's lens context, not just the artefact text on disk | Fe | Important | Low — artefact text is resumable from disk; conversation thread is not; re-brief feasibility untested | **P1** |
| **A7** | Structured input modes (comparator pickers, lens-step forms) produce more precise model outputs than skilled free-text — the imprecision problem is the input mode, not the operator's mental model | D+Fe | Important | Low — inferred from Cluster 5 analysis; no A/B data | **P1** |
| **A8** | "I can see what the agent is doing and correct it" is the correct trust frame — early visibility earns operator trust faster than output quality or speed alone | D | Important | Low — design hypothesis, untested | **P2** |
| **A9** | Seeing the artefact panel forming in real-time would cause operators to catch and correct structural errors mid-session rather than at commit | D | Important | Medium — plausible from existing draftSections panel behaviour in inner loop UX | **P2** |
| **A10** | The /ideate UX build cost is genuinely incremental given the existing infrastructure — extending `chat-view.js` and `draftSections` is sufficient; no new rendering architecture needed | Fe | Important | Medium — existing SSE + split-panel working in production; assumption is about scope extension, not groundwork | **P2** |
| **A11** | The sequencing is correct: /ideate UX must ship and be validated before /discovery UX is scoped; these are not safely parallel | Vi | Important | Medium — strategic logic is strong (dependency chain), but a simpler /discovery UX first is a viable alternative | **P3** |
| **A12** | Tracking pre-/discovery conditions throughout the session (conditions sidebar) produces a meaningfully more complete conditions list than surfacing them at Lens B end | D | Minor | Low — Lens B completion is already the last step; conditions sidebar adds friction for marginal gain | **P3** |

### Test designs — P0 assumptions

**A1 — Architecture feasibility spike**

Question: Can assumption cards and a conditions sidebar be driven from SSE events using the existing `draftSections[]` pattern, or does this require a new streaming architecture?

Test design: Technical spike — timebox 2 days. Create a branch with a minimal proof-of-concept: extend `chat-view.js` to render a second panel type (`assumptionCards[]`) populated from SSE events distinct from `draftSections`. Done condition: (a) an assumption card can be pushed from server to client via SSE; (b) the operator can confirm/flag a card and the state persists in the server-side session; (c) the existing `draftSections` panel continues to work unaffected.

Exit outcomes: PROCEED if all three done conditions are met without modifying the core SSE handler; REDESIGN if a new SSE event type is needed (acceptable cost); DEFER the full multi-panel UX if the session model needs a schema rewrite (scope now exceeds incremental).

Risk if wrong: The Lens D "incremental" build case collapses. The /discovery artefact must be rescoped around a simpler UX — e.g., assumption cards shown as a markdown list at the end of each lens step rather than inline real-time cards.

**A2 — Context manifest engagement**

Question: Will operators actually read and act on the context manifest before turn 1, or will they proceed without reviewing it?

Test design: Low-fidelity simulation — before the next /ideate session (any feature), prepend the context manifest as a structured message: "Files loaded: [list]. Files missing: [list]. Confirm with 'ok' or correct before proceeding." Measure: does the operator engage with the list or type 'ok' without reading? Cost: zero infrastructure, observation only. Run on the very next /ideate session this pipeline runs.

Exit outcomes: PROCEED (informed) if the operator references ≥1 specific file in the manifest. Invalidated if the operator confirms in under 5 seconds without referencing any file.

**A3 — Non-expert operator profile**

Question: Does a non-expert tech lead fail at /ideate for different, UX-addressable reasons — or would they fail at the methodology regardless of the interface?

Test design: Structured observation — recruit 1 non-expert tech lead with a real feature to discover. Have them run /ideate in the current chat-only mode with no coaching. Observe and record: (a) where do they stop and ask what to do next? (b) where do they submit an input the agent cannot parse? (c) where does the artefact diverge from what the operator intended?

This is cloud-platform pre-/discovery gate 3 (5-person outreach experiment) at minimum scope — can run at 1-person level immediately without waiting for the full gate.

Exit outcomes: PROCEED with UX investment if failure modes are UX-addressable (wrong input format, lost track of lens step, comparator frame not understood). REDESIGN to documentation/onboarding if failure modes are methodology-level. DEFER if no non-expert is accessible before cloud platform gate 3.

### Test designs — P1 assumptions

**A4 — Downstream rework rate measurability**

Test design: Retrospective query — for the cloud-platform and ideate-web-ux sessions, read the downstream /benefit-metric artefacts. Count: how many assumptions or comparator frames from /ideate were corrected before /benefit-metric could proceed? Record this count as the M1 baseline (chat-only /ideate). Takes 30 minutes, no infrastructure required.

**A5 — Assumption card engagement model**

Design decision required before scoping: will assumption card confirmation be (a) optional-with-reminder, (b) required-before-lens-advance, or (c) batch-shown at end of each lens step? Each has a different engagement profile and fatigue risk. Resolve this in the /discovery artefact's UX spec before writing stories — it determines whether assumption cards are a gate mechanism or an audit trail.

**A6 — Session resume model**

Define two modes explicitly and choose in /discovery: (a) Text resume — read ideation.md from disk, re-brief the model on lens progress, continue. The model re-infers context from the committed artefact. Buildable with the current session model. (b) Thread resume — persist the full conversation thread server-side and reload on session start. Requires server-side conversation persistence — non-trivial. Hypothesis: Mode (a) is acceptable for /ideate because each lens step produces a committed section; re-briefing on committed sections is sufficient to resume without inconsistency.

**A7 — Structured inputs vs free-text**

Design comparison — scope one lens step with a structured input (e.g., comparator picker for Lens A intake: "Name your comparator and select a dimension from [pricing / onboarding / enterprise fit / technical depth]") alongside the current free-text path. The structured comparator picker is already identified as a solution in Cluster 1. Observe whether it reduces the session-opening renegotiation that currently costs 2–3 turns.

### MVP scope recommendation

**Must spike before scoping /discovery:** A1 (architecture feasibility). The /discovery artefact cannot sensibly scope a multi-panel /ideate UX without knowing whether the SSE + session model can support the new panel types. Run the A1 spike as the first task before any story decomposition.

**Must resolve before /discovery is approved:** A3 (non-expert operator profile). Run the low-fidelity A3 test (1 observed session) before committing to a specific UX pattern. If A3 is invalidated, the cloud platform activation story recasts the problem as a methodology challenge, not a UX challenge — and the /discovery scope changes significantly.

**Clusters confirmed as MVP scope:** Cluster 1 (context manifest), Cluster 2 (assumption cards), Cluster 4 (live artefact panel). These address A1/A2 and the engagement model — the activation-blocking P0s.

**Clusters as increment 2:** Cluster 3 (session recovery — pending A6 resolution), Cluster 5 (structured inputs — pending A7 design test), Cluster 6 (conditions sidebar — A12 is P3, low evidence of value).

---

*Lens B complete. All three lenses complete (A, D, B). Lenses C and E skipped — internal tool, not a market product. Ideation session complete.*
