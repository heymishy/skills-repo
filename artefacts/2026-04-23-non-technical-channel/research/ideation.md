# Ideation Artefact — Framework Adoption Friction (Non-Technical Channel)

**Feature:** 2026-04-23-non-technical-channel
**Date:** 2026-04-23
**Artefact path:** `artefacts/2026-04-23-non-technical-channel/research/ideation.md`
**Lenses run:** E, A, B, D (abbreviated) — updated pass 3: facilitation-native web UI hypothesis
**Pipeline state signal:** proceed (REDESIGN signal on solution surface AND adoption strategy AND solution architecture — facilitation-native web UI is a materially different direction from Teams bot)
**Relates to:** G0b (Phase 5/6 roadmap) — Non-technical discipline channel: CONFIRMED gap

---

## Context loaded

| Artefact | Status at time of ideation |
|----------|--------------------------|
| discovery.md | Not yet written |
| benefit-metric.md | Not yet written |
| Stories | None yet |
| Reference materials | `artefacts/phase5-6-roadmap.md` (G0b gap audit), `artefacts/2026-04-19-skills-platform-phase4/epics/e4-non-technical-access.md` (prior Teams bot solution hypothesis — Spike D dependent, UNSTABLE), `product/mission.md` (PM/BA listed as Secondary persona) |

---

## Lens E — Jobs-to-be-Done

*Framework: Clayton Christensen, Bob Moesta — JTBD / Switch interview*

### Job statement

> When I am responsible for a piece of work moving from idea to delivered — and I need to be able to defend the scope, the rationale, and the acceptance criteria if challenged later — I want to produce governance-quality artefacts in the environment I already work in, with a process that guides me through structure I do not know by heart, so I can be a genuine co-owner of delivery quality, not a downstream approver who signs off on things they do not fully understand.

| Dimension | Description |
|-----------|-------------|
| Functional job | Produce a discovery artefact, benefit metric definition, and story ACs that engineers implement correctly without coming back for clarification — without needing a technical co-author |
| Social job | Be seen as the person who drives delivery rigour and bridges business intent to engineering execution — not as the person who "doesn't get the technical stuff" |
| Emotional job | Feel confident that what gets built is what was intended, and that the trace back to original intent is intact if it is ever questioned by a stakeholder, auditor, or retrospective |

### Current hire and real competition

| Current hire | Strengths | Friction / switch drivers |
|-------------|-----------|--------------------------|
| Confluence + Word specs | Familiar, shareable, stakeholder-readable, zero setup, no new vocabulary | Artefacts drift from what's built; engineers don't read them; no traceability; approval via comment thread with no audit trail |
| Jira stories | Shared with engineering, in the existing flow, approved by the organisation | ACs are free-text; no structured review; no trace to upstream rationale; same clarification conversations repeat on every story |
| Meeting-based refinement | Fast iteration, builds shared understanding quickly | No persistent record; knowledge lives in heads not artefacts; decisions get revisited because they were never written down |
| Email approval chains | Fits existing governance process; familiar to senior stakeholders | Not linked to artefacts; no version history; auditors cannot reconstruct decisions reliably |

**Real competition:** The combination of Confluence + Jira + meetings + email — which a PM can use today with zero setup cost, zero unfamiliar vocabulary, and full social legitimacy in their organisation. The pipeline's bar to clear: it must produce demonstrably better outcomes on the functional job (stories built correctly, decisions traceable) by enough to overcome the switching cost. That bar is currently blocked at the *access* stage — the PM never gets to prove the functional benefit because the setup cost stops them before the first session.

### Four Forces analysis

| Force | Direction | Key findings |
|-------|-----------|-------------|
| Push | Away from current | "I wrote a 10-page spec and the team built something different." "We keep having the same clarification conversations on every story." "I can't prove to an auditor what we agreed — it's in a Confluence comment thread." "I don't know what's been delivered against what I signed off on." |
| Pull | Toward new | Stories that engineers implement without clarification follow-ups. A trace that proves what was agreed, when, by whom. Seeing fewer rework cycles on a well-specified story vs. an informal one. Being able to run the outer loop without waiting for an engineer to translate. |
| Anxiety | Resisting new | "I might break something in git and need an engineer to fix it." "I'll produce an artefact with the wrong structure and it will be rejected." "The vocabulary is engineering jargon I don't recognise — I'll say something wrong." "IT will take three weeks to approve VS Code and Copilot extensions, and I'll lose momentum." "The proxy won't work and I won't know how to configure it." |
| Habit / inertia | Resisting new | "My manager expects requirements in Confluence — I'd have to justify a format change." "The rest of my team isn't using this, so I'm the outlier, and my artefacts have to be reconciled with their Jira tickets anyway." "I review work in Teams; anything I can't share in a Teams message or link is extra friction for my approvers." "I've been writing requirements this way for ten years — I'm trusted partly because I produce familiar formats." |

### Switch threshold

> The new solution must outperform the current hire on **producing well-specified work that gets built correctly** by enough to overcome **the combined IT setup barrier (admin rights, proxy, extensions) that stops a non-technical user before the first session**.

> Implication: removing setup friction is not sufficient. The PM must be able to *prove* the functional benefit within the first session, or the switching cost will not justify the access investment. The MVP must produce a moment of proof — "this story was built right because of how it was specified" — not just a working setup.

---

### Second job — the BA whose professional identity is at stake

> When **a new delivery framework is being adopted by my team — and it automates or structures the work I am recognised for doing (requirements, discovery, stakeholder alignment) —** I want to **understand whether this replaces or amplifies my contribution**, so I can **protect my professional standing and continue to be seen as the expert who bridges business intent and delivery execution, not as someone whose role has been made redundant by an AI tool.**

| Dimension | Description |
|-----------|-------------|
| Functional job | Assess whether to engage with the framework or actively/passively resist it before it erodes my role |
| Social job | Remain the recognised expert in the team for "what should be built and why" — not become the person who rubber-stamps what an AI and an engineer have already decided |
| Emotional job | Feel that my ten years of domain expertise and stakeholder relationship knowledge is more valuable with this framework than without it — not that it has been commoditised |

**Why this job matters more than the first:** The first job (produce durable, traceable artefacts) has a straightforward solution path — lower the surface friction. The second job has no engineering solution. If a BA concludes that their answer to "does this amplify or replace me?" is "replace," no amount of better tooling changes the adoption outcome. They will not engage, and they will explain their non-engagement to others in ways that make the narrative worse.

**The BA's reading of the current evidence is not irrational:** The pipeline can currently be run entirely by an engineer. Discovery artefacts, benefit metrics, story ACs, and DoR sign-off can all be produced without a BA being involved. If that is how the platform is adopted in practice, the BA's concern is correct — their role has been reduced to reviewing something they did not shape. That is a weaker position than the one they hold today.

**The two failure modes this creates:**

| Mode | What it looks like | Why it matters |
|---|---|---|
| Passive non-adoption | BA doesn't engage; engineers run the outer loop; governance is technically satisfied but upstream thinking is engineer-biased | Pipeline delivers compliant output faster, but quality of upstream thinking is lower; accumulates over time |
| Active resistance | BA frames the platform as "engineers bypassing proper requirements process" to stakeholders | Adoption stalls because the social narrative becomes self-reinforcing: the more engineer-driven adoption looks, the more the narrative is confirmed |

**Force multiplier has to be structural, not rhetorical.** If an engineer can produce a complete discovery artefact without a BA, "force multiplier" is a positioning statement with no mechanism behind it. For it to be real, the platform must have places where BA/PM input is structurally required and where engineer-only input is structurally insufficient. Concretely: the discovery skill should surface the absence of domain knowledge (customer interview evidence, stakeholder context, regulatory awareness) as a quality gap — not fill it with plausible-sounding engineer assumptions. The DoR gate should include checks only a BA can genuinely satisfy, not checks an engineer can answer dishonestly.

**The reframe that resolves the threat (and why it must be lived, not stated):**

> "Right now, the work you produce in discovery does not survive contact with the delivery process. It gets rewritten, reinterpreted, filed in Confluence, and then ignored. This platform makes your work durable. Your thinking governs what gets built, with your name on it, traceable back to your original intent — and it is there if anyone ever asks why a decision was made."

This framing works because it is about the *outcome* of the BA's existing work, not about a new tool. It positions the platform as the mechanism by which their current work becomes more valuable, not as a replacement for it. But it only holds if the BA is *producing* the upstream input, not *reviewing* what an engineer has already produced. The traceability is the BA's professional protection only if the trace leads back to them.

---

## Lens A — Opportunity Mapping

*Framework: Teresa Torres — Continuous Discovery Habits*

### Desired outcome

A PM or BA can complete the outer delivery loop — from idea to DoR sign-off — producing governance-quality artefacts, without VS Code, git, or terminal access, in a time budget that competes favourably with the current Confluence + Jira approach.

### Opportunity tree

```
Outcome: PM/BA can run the governed outer loop in their existing environment,
         producing artefacts accepted as-is by the pipeline

├── Cluster 1: Environment access is prohibitively expensive (GATE — blocks all others)
│   ├── Unmet need: "I cannot get admin rights to install VS Code without an IT ticket"
│   ├── Unmet need: "Proxy configuration and git credentials require someone technical to help me"
│   ├── Pain point: "Even once set up, every session starts with re-orienting to a foreign environment"
│   ├── Pain point: "The setup process requires decisions I don't have context to make correctly"
│   └── Enterprise constraint: "Procurement/security approvals for marketplace extensions take weeks"
│
├── Cluster 2: The artefact structure is a barrier independent of the content
│   ├── Pain point: "I know what a user story is but not what AC format this pipeline requires"
│   ├── Pain point: "Section headers and field names are engineering conventions — not how I think about requirements"
│   ├── Unmet need: "I need a guide to produce valid structure, but that guide is a SKILL.md that assumes I understand the pipeline"
│   └── Pain point: "When I produce the wrong structure, the rejection is technical — I don't understand what to fix"
│
├── Cluster 3: My work context doesn't include these tools
│   ├── Unmet need: "Stakeholders review work in Teams — I can't share a .md file they can read without a new tool"
│   ├── Pain point: "Approvals happen in Teams threads or Jira comments, not GitHub PR reviews"
│   ├── Pain point: "The pipeline produces artefacts in a format my manager doesn't recognise as a deliverable"
│   └── Desire: "Link discovery artefacts to a Teams meeting note or a Jira epic without manual copy-paste"
│
├── Cluster 4: The adoption narrative works against the PM
│   ├── Pain point: "This is perceived as a developer workflow — I am seen as encroaching on engineering territory"
│   ├── Pain point: "'You have to learn VS Code too' is not a value proposition — it's a demand"
│   ├── Unmet need: "There are no PMs using this today — there is no social proof to point to"
│   └── Pain point: "My manager sees this as extra overhead on an existing process, not a replacement"
│
├── Cluster 5: Role identity threat — the BA sees this as replacing, not amplifying, their job
│   ├── Root cause: the outer loop can currently be run entirely by an engineer without a BA
│   ├── Pain point: "If an engineer can produce the discovery artefact, what is my role in this process?"
│   ├── Pain point: "I will be reduced to approving something I didn't shape — that's weaker than where I am now"
│   ├── Fear: "This platform is described as 'AI-assisted delivery' — that sounds like it does what I do, faster"
│   ├── Unmet need: "Show me how my domain expertise is worth more with this, not commoditised by it"
│   └── Structural gap: the platform has no mechanism that makes BA/PM input authoritative rather than optional
│
└── Emerging (limited evidence, needs investigation)
    ├── "We use Azure DevOps, not GitHub — the pipeline assumes GitHub-native workflow"
    └── "Entitlement management for repo access is handled by a separate team — I can't self-serve"
```

### Opportunity prioritisation

| Opportunity | Importance to PM | Currently served | Priority |
|---|---|---|---|
| Zero-install access to outer loop steps | High | Not at all | 🟢 Top (gate) |
| Guided content extraction — PM never sees raw template structure | High | Not at all | 🟢 Top |
| Artefact shareable in Teams / readable by non-git stakeholders | High | Not at all | 🟢 Top |
| PM-native vocabulary (not engineering jargon) | Medium | Not at all | 🟡 Watch |
| Approval routing to existing channels (Teams, Jira) | Medium | Partially — persona-routing skill exists, but downstream of the setup gate | 🟡 Watch |
| Enterprise constraint handling (proxy, ADO, entitlements) | High | Not at all | 🟢 Top — a prerequisite class, not a feature |
| Social proof / adoption narrative | Low (currently) | Not at all | ⚪ Lagging indicator — follows when functional value is proven |
| BA/PM input structurally required — engineer-only outer loop not possible | High | Not at all | 🟢 Top — prerequisite for the adoption narrative to be credible |

### Top opportunity — seed solution hypotheses

> **Primary opportunity:** Zero-install access to the outer loop (removes the gate blocking all downstream benefit)

| Solution hypothesis | Addresses opportunity via | Feasibility signal |
|---|---|---|
| Hosted web UI — guided form that maps PM-familiar labels to pipeline field names | No install; runs in browser; can be accessed from managed device via URL | Requires a hosting service + API backend; artefact commit via service account |
| Teams bot (Phase 4 E4 hypothesis) | No install for PM; lives in their existing environment | Requires Microsoft account + bot registration + API access — IT dependency moves from VS Code to bot provisioning; not obviously lower friction |
| Copilot Chat extension in Teams (Microsoft 365 Copilot) | Runs in Teams Copilot sidebar; wraps skills without terminal | Requires Copilot M365 licence and extension approval — enterprise entitlement risk |
| Email-to-artefact flow — PM writes in natural language, conversion step structures it | Zero interaction model change for PM | Quality risk: natural language → structured artefact without guidance may produce thin artefacts |
| SharePoint / Power Apps form → backend committer | Familiar MS ecosystem; no new tool for PM | Power Apps licencing; form maintenance cost; may not support full outer loop |
| **Facilitation-native web UI** — collaborative canvas where the BA runs ideation/discovery methods live; artefact is produced *during* the session, not after | BA is the facilitator, not a user filling in a form; resolves role identity threat structurally; works for workshops and stakeholder sessions | Real-time collaboration infrastructure (WebSockets, shared state, presence) is a meaningful engineering investment not covered by the Copilot SDK; facilitation method design requires product design expertise |

### Facilitation-native web UI — why this is architecturally different

The Teams bot, hosted form, and email flow are all *input channel* hypotheses — they lower the friction for a non-technical persona to produce a pipeline artefact that already existed in a VS Code session. The facilitation-native web UI is a different category: it treats the outer loop as a **collaborative facilitation tool first** and a **pipeline feeder second**.

The core insight: BA/PMs are often expert facilitators. They run discovery workshops, ideation sessions, and stakeholder alignment meetings. They know how to hold space for competing perspectives, surface implicit assumptions, reframe problems when a room is stuck, and synthesise fragmented input into a coherent direction. None of that skill lives in a SKILL.md. The pipeline currently treats it as a black box that produces inputs — you run the workshop somehow, then go into VS Code and turn the outputs into artefacts. The facilitation and the artefact production are sequential, disconnected, and lossy.

In a facilitation-native surface, they happen simultaneously. The BA runs the ideation methods they are already expert in. The structure that emerges from those methods feeds directly into the governed pipeline artefact as the session progresses. The artefact is not produced *after* the workshop — it is produced *during* it, by the participants, with the facilitator using the tool as a scaffold for structured thinking rather than a form to fill in.

**Why this resolves the role identity threat in a way surface changes alone do not:**

The identity threat exists because a skilled engineer can run /discovery and produce a plausible artefact without a BA in the room. In a facilitation-native surface, the tool does not produce the discovery artefact — the facilitator does, using the tool to structure and capture what emerges from a live collaborative session. The BA is not *a user of the pipeline*; they are *the person running the session that the pipeline captures*. That is a completely different relationship to the tool. Their expertise — knowing which questions to ask, how to read a room, how to surface what stakeholders actually need versus what they say they want — is now load-bearing, not invisible.

Engineers can still run the outer loop in VS Code. But the facilitation-native surface is the BA's native environment, not an engineering tool with the friction sanded off. That distinction matters for the adoption narrative.

**What a session looks like in practice:**

A BA opens the web UI, creates a new discovery session, and invites two or three stakeholders. The session view renders a structured collaborative canvas guided by the ideation methods from the pipeline — opportunity mapping, JTBD framing, assumption surfacing — but presented as facilitation scaffolding, not form fields. Participants contribute in real time. The BA facilitates using the structure the tool provides; the content comes from the room. As the session progresses, the tool structures the output into the pipeline artefact format. The BA does not see SKILL.md section headers — they see "problem framing", "evidence", "success indicators". When the session closes, the pipeline artefact is committed to the repo. The BA exports a human-readable summary to Confluence for stakeholders. The engineering pipeline has its governed artefact. Neither group compromised their way of working.

**Relationship to the Copilot SDK:**

The GitHub Copilot SDK makes the agentic model layer buildable without a separate model subscription. The web UI backend embeds the SDK; the governance package (SKILL.md skills) sits as middleware; the facilitation session drives the model through the outer loop skills in real time. The SDK handles authentication, model management, and agentic infrastructure. What the SDK does *not* provide is the collaboration layer — shared state, WebSocket connections, presence, conflict resolution when two participants edit simultaneously. That is custom infrastructure the team would build.

**Three genuine hard things (not blocking — but honest):**

| Hard thing | Why it is hard | What this means for sequencing |
|---|---|---|
| Real-time collaboration infrastructure | WebSockets, shared state, conflict resolution, presence model — meaningful engineering investment not covered by any existing dependency | Phase 1 of the web UI should be single-facilitator (no live multi-participant), proving the artefact production loop before adding collaboration complexity |
| Facilitation method design | Which methods, in which order, how structured vs. freeform, when the tool guides vs. gets out of the way — these decisions require facilitation expertise to get right; wrong decisions produce a constraint, not a scaffold | Facilitation method design must be done with real BAs running real sessions, not derived from the SKILL.md structure alone |
| Artefact parity in a live session | Quality depends on the facilitator's skill as much as the tool's design; the pipeline currently validates structure not content depth; a skilled BA produces a complete artefact, an inexperienced user produces a thin one | Content depth validation (not just structure) must be a design requirement for the facilitation-native surface |

> **Key insight from Cluster 1:** All surface hypotheses move the IT dependency, not remove it. The Teams bot moves it from "VS Code + Copilot extension approval" to "bot API registration + service account". A hosted web UI moves it from "managed device restrictions" to "can we access an external URL". The enterprise constraint is a class of problem that runs across all surface options — it is not solved by surface choice alone.

> **Key insight from Cluster 5:** No *access surface* choice addresses the role identity threat — a BA who perceives the platform as a replacement will not engage with a Teams bot any more than with VS Code. The facilitation-native web UI addresses this differently: it does not give the BA a lower-friction way to do what the pipeline already does, it gives the BA a way to do what *they* already do (facilitate, synthesise, align) with the pipeline capturing the output. That is a structural reframe, not a surface change. It still requires the governance model fix (BA input authoritative) — but the facilitation-native surface makes that fix natural rather than imposed.

---

## Lens B — Assumption Inventory

*Framework: Teresa Torres — assumption mapping*

### Assumptions extracted

| Assumption | Type | Risk if wrong | Known-ness | Priority |
|---|---|---|---|---|
| PMs perceive "producing governance artefacts" as part of their job, not as engineering overhead imposed on them | Desirability | High | Guess | 🔴 Test first |
| Artefact parity via guided conversation is achievable — a conversation surface produces artefacts of equivalent structural and content quality to a VS Code + SKILL.md session | Feasibility | High | Guess | 🔴 Test first |
| The SKILL.md vocabulary and concepts can be translated into PM-native language without losing the governance properties that matter | Viability | High | Inference | 🔴 Test before building |
| The Teams bot is the right surface — PMs would switch to it if it existed; the barrier is the tool, not the concept | Desirability | High | Guess | 🔴 Test before committing to a surface |
| PMs will invest time learning a new framework if the access surface is lower friction | Desirability | High | Inference | 🟡 Test via pull, not push |
| Engineering teams will accept artefacts produced via a non-git surface as equivalent quality — no second-class citizen dynamic | Ethical/Social | Medium | Inference | 🟡 Test via pilot |
| Enterprise bot provisioning (Teams API, service account, git write access) is manageable within a quarter | Feasibility | Medium | Guess | 🟡 Spike before committing to Teams surface |
| The C7 constraint (one question at a time) is compatible with how PMs want to work | Desirability | Medium | Inference | 🟡 Test in prototype |
| The outer loop steps (discovery → benefit-metric → definition → review → test-plan → DoR) are meaningfully executable by a non-technical persona without simplification | Viability | Medium | Inference | 🟡 Test via pilot |
| Azure DevOps environments can be supported at the channel adapter layer without pipeline changes | Feasibility | Low | Inference | 🟢 Accept for now — note as constraint |
| A lower-friction surface solves the adoption problem — the barrier is the tool, not the role | Desirability | High | Guess | 🔴 Test first — **this assumption is likely false for a meaningful segment of the target population** |
| BAs and PMs will engage with the platform once they see it as a force multiplier for their work | Desirability | High | Guess | 🔴 Test first — "force multiplier" is a positioning claim, not a structural property of the current platform |
| The outer loop currently structurally requires BA/PM input — engineer-only execution produces visibly inferior artefacts | Viability | High | Evidence against this | 🔴 Known gap — the outer loop today does NOT require BA/PM input; this is what must be fixed before surface work |
| The discovery/benefit-metric/DoR skills can be evolved to make BA domain expertise structurally necessary without making engineer adoption harder | Feasibility | Medium | Inference | 🟡 Test via skill redesign spike |
| The facilitation-native web UI resolves the role identity threat — BA as facilitator rather than user changes their relationship to the platform structurally | Desirability | High | Inference | 🔴 Test with BA population — does the facilitator framing change the adoption response? |
| A Phase 1 single-facilitator web UI (no real-time collaboration) is sufficient to prove the artefact production loop before investing in collaboration infrastructure | Feasibility | Medium | Inference | 🟡 Test via prototype — is single-facilitator a viable first proof point or does the collaborative session format require multi-participant from the start? |
| The GitHub Copilot SDK is an appropriate backend for the facilitation-native UX — it handles model management and agentic infrastructure | Feasibility | Medium | Inference | 🟡 Spike before building — SDK fits single-session, single-facilitator model; multi-participant real-time may require different architecture |
| Facilitation method design can be derived from the pipeline's ideation SKILL.md structure without real facilitation expertise input — the SKILL.md maps cleanly to a visual canvas | Design | High | Evidence against this | 🔴 Known risk — this assumption is likely wrong; facilitation method design requires real BAs testing real sessions; a SKILL.md-derived canvas may feel like a form, not a facilitation scaffold |

### Test designs (for 🔴 assumptions)

**Assumption:** PMs perceive governance artefacts as their job, not extra overhead

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Interview | "When a story gets built differently to what you agreed — what does that feel like, and what do you wish you had?" | PM reaches for traceability — "I wish I had a record of what was agreed" | PM reaches for communication — "I wish the team had listened better" |
| Data proxy | Review the last 5 retrospectives involving this PM — do findings mention "better requirements" or only "better communication"? | "Better requirements / clearer ACs" appears as a finding | All findings are about process or communication; requirements quality not surfaced |

**Decision:** Run interview before any surface design work. If the finding is "better communication", the job story needs revision — the PM may be hiring for visibility, not governance.

---

**Assumption:** Artefact parity via guided conversation is achievable

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Prototype test | Run a PM through a /discovery session simulated entirely in Teams DM messages (no VS Code, no git). Read the output against the discovery template. Count missing or thin fields. | Fewer than 3 fields missing; content depth comparable to a git-native session | 5+ fields missing or thin; content requires significant augmentation by an engineer to be pipeline-usable |

**Decision:** This is a half-day experiment. Run before any bot development. If the result is "5+ fields missing", the problem is not the surface — it is the vocabulary and guidance layer (Cluster 2), and that must be solved before any surface is built.

---

**Assumption:** SKILL.md vocabulary can be translated without losing governance properties

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Vocabulary audit | Take the /discovery SKILL.md. Rewrite all prompts in PM language (no "AC", no "DoR", no "pipeline"). Show the rewritten version to an engineer: "Does output from these prompts still satisfy the governance properties?" | Engineer confirms governance properties are intact; output passes the H1–H9 hard blocks | Engineer identifies specific properties that are lost — the rewrite either removes precision or introduces ambiguity that would fail downstream gates |

**Decision:** Run the vocabulary audit as a single-session pair exercise (one PM, one engineer). Findings feed directly into /discovery vocabulary and Cluster 2 solutions.

---

**Assumption:** The Teams bot is the right surface

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Comparative prototype | Offer three PMs three surface prototypes: (a) guided conversation in Teams DM, (b) a minimal form-based web UI, (c) Copilot Chat in M365. Ask them to complete a real discovery. Observe, do not ask preference directly. | PMs complete more steps and produce higher-quality content in the Teams DM format | PMs produce comparable or better output in the web UI; Teams DM creates confusion around conversational context length |

**Decision:** Do not commit to a surface until this test is run. The Phase 4 Spike D decision to build a Teams bot was made on architectural grounds (C7 compliance), not on evidence of PM preference or comparative usability.

---

**Assumption:** The facilitation-native web UI resolves the role identity threat

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Framing interview | Present two descriptions to a BA: (a) "A lower-friction way to run /discovery without VS Code"; (b) "A facilitation canvas where you run discovery workshops and the pipeline artefact is produced as a byproduct of the session." Ask: "How would you describe your role in each scenario?" | In (a): "I'm a user of the tool"; in (b): "I'm the facilitator — the tool is supporting my session" | BA describes their role the same way in both; the framing distinction does not change their perceived relationship to the tool |
| Live session observation | Run a BA through a simulated facilitation session using the description from (b) above — a structured conversation with two stakeholder participants, the BA facilitating, the tool capturing. Observe whether the BA spends time on method and content (good) or on figuring out the tool (bad). | BA focuses on facilitation; tool is invisible; artefact emerges from the conversation | BA spends > 30% of time on tool navigation; facilitation is disrupted; participants disengage |

**Decision:** The framing interview is a 30-minute test. Run it before any design work on the facilitation-native surface. If the finding is "framing doesn't change the response", the identity resolution requires governance model change, not a different surface design.

---

**Assumption:** A lower-friction surface solves the adoption problem

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Targeted interview | Ask a BA who has been made aware of the platform but has not engaged: "What would have to be true for you to want to use this?" | Answer is about the tool: "I need it in Teams / without VS Code" | Answer is about role: "I need to know this doesn't make my job obsolete" / "I need to understand what I'm responsible for" |
| Passive adoption observation | Give a BA full access and working setup — remove all Cluster 1 friction. Observe over 4 weeks. | BA uses the platform for at least one real story | BA still does not engage despite access; defers to engineer to "set it up" or produce the first artefact |

**Decision:** If the interview finding is about role, not tool — surface investment is premature. The required prior work is a governance model redesign that makes BA input structurally authoritative. This is a discovery-level finding that must be resolved before any non-technical surface is built.

---

**Assumption:** The outer loop currently requires BA/PM input — engineer-only outer loop produces visibly insufficient artefacts

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Quality audit | Take three discovery artefacts produced by engineers without BA involvement. Have two BAs assess them against: (a) customer evidence quality, (b) stakeholder context accuracy, (c) business model implication coverage. | BAs identify significant gaps; artefacts would fail against an honest DoR check | BAs find artefacts adequate; the engineer-produced versions are not distinguishable in quality |

**Decision:** If the audit finds engineer-produced artefacts are adequate, the structural fix (making BA input authoritative) requires intentional skill redesign — adding required evidence fields ("customer interview evidence", "stakeholder review record") that cannot be plausibly fabricated by an engineer without actual domain contact. This is a skills platform change, not a surface change.

---

## Lens D — Product Strategy Framing (abbreviated)

*Framework: Marty Cagan — SVPG product opportunity assessment*

### Opportunity assessment

| Question | Answer | Confidence |
|---|---|---|
| What problem will this solve? | Non-technical disciplines cannot participate in governed delivery without a VS Code + git setup that blocks them at first access — so the functional benefit of the pipeline is never tested against the alternative | Strong |
| For whom? | PM/BA in an enterprise context — managed device, AD auth, Teams and Confluence daily, no git credentials, probable IT restrictions on extension installation | Strong |
| How will we measure success? | N PMs complete outer loop unassisted (discovery → DoR sign-off); artefacts accepted without rework by downstream pipeline steps; measured on first real story per PM | Uncertain — metric not yet formally defined |
| What alternatives exist today? | Confluence + Jira + meetings + email — zero setup, fully socially legitimate, in tools the organisation already paid for | Strong |
| Why are we best suited? | The pipeline's functional output (correctly-built stories, traceable decisions) is the differentiator; we are not building a new pipeline, we are extending access to an existing one | Moderate |
| Why now? | Enterprise AI tool adoption is creating an opening — PMs are already being asked to work alongside AI agents; the pipeline fits that framing better now than 18 months ago. Timing signal: "AI-assisted delivery" is entering PM vocabulary as a concept, not just an engineering one. | Moderate |
| How will we reach customers? | Existing enterprise surface (Teams, M365) is the channel of least resistance — but the surface choice should be evidence-driven, not architectural | Uncertain |
| What must the MVP demonstrate? | One PM completes discovery → DoR sign-off unassisted, producing an artefact accepted as-is by the downstream pipeline, on a managed device with no git setup | Concrete |
| What are the critical risk factors? | (1) Role identity risk: BAs who perceive the platform as a replacement for their job will not engage regardless of surface. (2) Structural risk: the outer loop currently allows engineer-only execution, which confirms the BA's concern rather than resolving it. (3) Access risk: enterprise IT constraints are a class of problem across all surface options. (4) Quality risk: guided-conversation artefacts may be structurally valid but content-thin. (5) Surface risk: Teams bot was chosen architecturally, not empirically. | High |

### Recommendation

> **PROCEED** — with REDESIGN signals on both the solution surface and the adoption strategy.

**REDESIGN signal 1 — Adoption strategy sequencing.** The current framing is "here is a tool for non-technical personas to use." That framing confirms the threat and triggers the role identity failure mode. The adoption conversation must lead with the pain — evidence that the BA's existing work does not survive into delivery (rework data, retrospective findings, the gap between what was specified and what was built) — before the platform is introduced as a solution. The platform is not a tool for BAs to use; it is a mechanism that makes their existing work durable and traceable. That reframe must be lived in the governance model (BA input structurally authoritative) not just stated in positioning.

**REDESIGN signal 2 — Governance model prerequisite.** Before any non-technical surface is built, the outer loop must be redesigned so that engineer-only execution is visibly insufficient. Concretely: discovery and benefit-metric skills should require evidence of customer or stakeholder contact (interview notes, stakeholder confirmation) as a non-optional field — absence is surfaced as a quality gap, not filled with plausible engineer assumptions. DoR hard blocks should include at least one check that is genuinely satisfiable only by someone with domain access. This is the structural basis for the "force multiplier" claim; without it, the claim is rhetoric.

**REDESIGN signal 3 — Surface choice and architecture.** The prior Teams bot hypothesis was architectural, not empirical. A third direction now exists — the facilitation-native web UI — which is architecturally different from all prior hypotheses. It does not lower friction for an existing pipeline interaction; it creates a new interaction model where the BA's facilitation expertise is load-bearing. This direction warrants its own feasibility assessment before a surface is chosen.

**Revised first move — three parallel experiments, all half-day or less:**

| Experiment | What to run | Finding determines |
|---|---|---|
| Role identity interview | "What would have to be true for you to want to use this?" with 2–3 BAs | Whether barrier is access friction (→ surface investment) or role threat (→ framing/governance fix first) |
| Framing interview | Present both the "lower-friction tool" framing and the "facilitation canvas" framing to the same BAs | Whether the facilitation-native framing changes the adoption response — if yes, the surface architecture matters, not just the access channel |
| Governance model audit | Assess three engineer-produced outer loop artefacts against: customer evidence quality, stakeholder context accuracy, business model coverage | Whether engineer-only outer loop is visibly insufficient today, or requires intentional skill redesign |

All three experiments are independent. Run in parallel. The surface investment decision — Teams bot, hosted web UI, facilitation-native canvas, or something else — follows from the combined findings, not from prior architectural commitments.

---

## How this feeds the pipeline

| Output | Feeds | Notes |
|---|---|---|
| Job story | `/discovery` (customer section) | The job is the desired outcome at the root of the opportunity tree; real competition section names Confluence + Jira + meetings + email |
| Opportunity map | `/discovery` (opportunity framing, MVP scope) | Cluster 1 (zero-install access) is the entry condition for any other cluster to matter |
| Assumption inventory | `/discovery` (assumptions section) + `/decisions` (RISK-ACCEPT candidates) | Eight 🔴/🟡 assumptions across setup, role identity, and structural governance; none are RISK-ACCEPT at this stage |
| Strategy framing | `/discovery` (rationale section) | PROCEED signal; REDESIGN on surface AND adoption strategy AND governance model; revised MVP threshold below |
| Role identity threat (Cluster 5) | `/discovery` (constraints section) + governance model redesign | Structural fix is required before surface investment; this is a pre-condition, not a parallel workstream |
| Lens D risk factors | `/definition` (NFRs) | Role identity risk and structural risk added; access risk (enterprise constraints) remains a story-level constraint |

---

## Revised MVP threshold

The original MVP threshold was: "One PM completes discovery → DoR sign-off unassisted, on a managed device with no git setup, producing an artefact accepted as-is."

This is still the right functional outcome but the sequencing precondition has changed. The revised MVP threshold is:

> (a) At least one BA/PM interview confirms that the adoption barrier is primarily access friction, not role threat — OR the governance model has been redesigned to make BA input structurally authoritative before any surface is built.
> (b) The quality audit confirms that engineer-only outer loop produces artefacts with identifiable domain-knowledge gaps — so the BA's structural necessity is real, not rhetorical.
> (c) Given (a) and (b): one BA/PM completes discovery → DoR sign-off unassisted, on a managed device with no git setup, on a real story, producing an artefact a downstream engineer accepts without requesting changes.

---

## Open questions

1. **Role identity vs. access friction — which is the primary blocker for the specific BA/PM population in scope?** This is the most important unknown. The answer determines whether the first investment is governance model redesign (structural fix) or surface development (access fix). Run the role identity interview before any further planning.

2. **What makes BA/PM input structurally non-optional?** Concretely: which fields in the discovery / benefit-metric / DoR artefacts can only be provided by someone with genuine domain access — customer interview data, stakeholder confirmation, regulatory constraint ownership? This requires a skill-by-skill audit, not a general answer.

3. **Enterprise constraint scope:** How consistent are the IT/admin/proxy/entitlement barriers across the target PM population? Are these universal (all enterprise contexts) or specific to certain orgs? This determines whether the constraint is a product design requirement or a deployment configuration concern.

4. **Scope of "outer loop" for MVP:** The full outer loop is 7 phases (discovery → benefit-metric → definition → review → test-plan → DoR). Which subset is the minimum to prove the functional benefit? Discovery + benefit-metric alone may be sufficient for a first proof point — and a smaller scope reduces the governance model redesign burden.

5. **Azure DevOps support timeline:** The pipeline assumes GitHub. If the target PM population is on Azure DevOps, how early in the design phase does this need to be addressed?

6. **What does "accepted artefact" mean in practice?** Who judges this — an engineer reviewing against DoR hard blocks, or automated gate validation? Needs to be defined before the metric is actionable.

7. **Vocabulary translation completeness:** Can the full outer loop vocabulary be translated into PM-native terms without losing governance precision? Or are some concepts inherently technical in a way that requires simplification rather than translation?

8. **Is the adoption strategy different for PMs vs. BAs?** The role identity threat may be more acute for BAs (whose core job is requirements/discovery) than for PMs (who own outcomes and tend to be less invested in the production of specific artefact formats). A segmented adoption approach may be warranted.

9. **Does the facilitation-native framing change the adoption response for BAs specifically?** The framing interview test above is the quickest way to answer this. If "facilitator running a session" lands differently from "user filling in a pipeline form," the surface architecture decision shifts significantly toward the web UI direction.

10. **What is the minimum viable facilitation session?** To prove the loop (facilitation session → governed pipeline artefact committed to repo), what is the smallest session design that produces a complete-enough discovery artefact? A 30-minute single-facilitator structured conversation? A 90-minute multi-participant workshop? The answer determines whether a Phase 1 prototype is a solo-use tool or requires real-time collaboration infrastructure from the start.

11. **Copilot SDK feasibility for this architecture:** The SDK handles the model and agentic layer. Does it fit a persistent, multi-turn facilitation session where the model is driving SKILL.md steps across a 60–90 minute live session, not just answering a single prompt? This is a spike question, not an assumption to carry forward.
