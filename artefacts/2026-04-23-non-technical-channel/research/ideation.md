# Ideation Artefact — Enterprise Discovery Governance Friction (Non-Technical Channel)

**Feature:** 2026-04-23-non-technical-channel
**Date:** 2026-04-23
**Artefact path:** `artefacts/2026-04-23-non-technical-channel/research/ideation.md`
**Lenses run:** E, A, B, D (abbreviated) — updated pass 4: full multi-stakeholder enterprise governance reframe
**Pipeline state signal:** proceed (REDESIGN signals maintained: governance model prerequisite, adoption strategy sequencing, surface architecture; new REDESIGN signal added on problem framing — the problem is enterprise discovery governance dysfunction, not access friction)
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

## Problem reframe — pass 4

Passes 1–3 framed the problem as **access friction for a non-technical persona** (the BA or PM who cannot get to VS Code + git) combined with a **BA-specific role identity threat**. That framing was too narrow. The real problem — as understood after deeper reflection — is an enterprise-wide cultural and governance dysfunction around who owns, participates in, and decides during discovery and scoping. The BA role identity threat is a specific instance of this broader pattern.

The accurate problem statement is:

> In enterprise delivery, everyone involved in discovery and scoping — business leads, SMEs, product managers, product owners, BAs — carries strong ownership and involvement expectations around that process. There is no agreed model for who decides, who is consulted, and who is informed. This ambiguity produces: (1) political friction about involvement rights that extends the time to reach discovery consensus; (2) scope drift and silent change downstream when assumptions and decisions evolve without a clear impact trail; and (3) resistance to adopting a structured pipeline because it creates accountability — attribution of decisions, visibility of what was and wasn't considered — that some stakeholders experience as threatening rather than enabling.

The pipeline's most valuable property in this framing is not the surface it runs on or the structure it enforces. It is the **traceable, attributed decision record** it produces. That record makes it harder to claim you weren't consulted when the artefact shows you were. It makes it harder to change scope silently when every assumption is named and any change can be traced back to a decision. It makes it harder to relitigate discovery when the artefact is governed, versioned, and signed off. For the people who bear the cost of ambiguity — engineers who build the wrong thing, PMs blamed for rework, delivery teams absorbing undisclosed scope changes — this is exactly what they want. For the people who benefit from ambiguity as protection, this is threatening.

This reframe shifts the adoption strategy significantly. The problem is not "give non-technical personas a lower-friction way to use the pipeline." The problem is "create a governance model for discovery that enterprise organisations will adopt and sustain, given that the most powerful stakeholders often benefit from the current ambiguity."

---

## Lens E — Jobs-to-be-Done

*Framework: Clayton Christensen, Bob Moesta — JTBD / Switch interview*

This lens is now applied across the full multi-stakeholder ecosystem involved in enterprise discovery. The jobs are different by role but share a root: each stakeholder needs to know that what they contributed to the discovery process actually shaped the outcome, is on record, and will hold when challenged.

---

### Job 1 — The person accountable for the outcome (Business Lead / Senior Sponsor)

> When **I have committed my organisation and budget to a direction based on a discovery process I participated in — and the delivery team produces something different, or someone challenges the original rationale months later —** I want to **be able to point to a clear record of what was agreed, who was consulted, and why the decision was made**, so I can **defend the investment, account for the deviation, and not be exposed as having authorised something based on an undocumented assumption**.

| Dimension | Description |
|-----------|-------------|
| Functional job | Reconstruct any governance-level decision in a discovery without relying on memory, meeting notes, or other people's recollections |
| Social job | Be seen as the executive who runs rigorous, transparent governance — not the one who approves informally and then claims ignorance when things go wrong |
| Emotional job | Feel protected rather than exposed; know that if anything is challenged by audit, regulation, or internal scrutiny, the artefact trail is there |

**Current hire:** Meeting minutes, email threads, Confluence approval comments, informal verbal sign-off. Strengths: fast, familiar, no setup. Friction: not linked to what's built; minutes are selectively written; approvals are not versioned; when scope changes, there is no clear line to what was originally decided.

**Switch threshold:** The governed artefact must be more defensible under scrutiny than the email chain it replaces — and it must be accessible to the business lead in a format they can read without a technical co-author.

---

### Job 2 — The person whose domain knowledge is essential (Subject Matter Expert / SME)

> When **I am brought into a discovery process to contribute specialist knowledge — regulatory context, customer domain, operational constraint — and I spend time in workshops and reviews providing that input —** I want to **see my contribution captured correctly, traceable to the final scope, and acknowledged in the record**, so I can **be confident my expertise actually shaped the outcome, not just appeared to be consulted**.

| Dimension | Description |
|-----------|-------------|
| Functional job | Verify that the specific constraints and insights I provided are reflected in the artefacts, not diluted, misrepresented, or overridden without explanation |
| Social job | Be recognised as the expert whose input was load-bearing, not one of twelve people who sat in a workshop |
| Emotional job | Feel that participating in the discovery process is worth the time investment — that my contribution makes a traceable difference |

**Current hire:** Workshop attendance, email review comments, verbal confirmation that "we considered that." Strengths: low overhead for the SME. Friction: no verification of whether the constraint was captured; no way to flag when an artefact misrepresents domain input; SME has no record of what they contributed, only of what they attended.

**Switch threshold:** The SME must be able to see their specific contribution attributed in the artefact — not just confirm general participation. A review step where the SME validates a draft artefact and their feedback is committed with attribution is the minimum.

---

### Job 3 — The person who runs the process (BA / Delivery Analyst)

> When **I am responsible for producing the discovery artefact — running the workshops, synthesising input, writing up the requirements — and a new framework automates or structures that work —** I want to **understand whether this amplifies my contribution or commoditises it**, so I can **either be the person who brings this skill to my organisation, or protect my standing before it is eroded without my awareness**.

| Dimension | Description |
|-----------|-------------|
| Functional job | Assess whether the platform makes my existing work more durable and impactful — or replaces it with a process I don't control |
| Social job | Remain the recognised expert in the team for "what should be built and why" — not become the person who reviews what an AI and an engineer have already produced |
| Emotional job | Feel that ten years of domain expertise and stakeholder relationship knowledge is more valuable with this framework than without it |

**Note on why this job is now correctly scoped:** In pass 1–3, this was framed as a BA-specific threat. It is more accurately understood as the BA's version of a pattern that runs across all roles. The SME's version: "my domain input may be ignored." The business lead's version: "I may be bypassed on decisions I should own." The product owner's version: "my product vision may get overridden by whoever writes the story." The BA's version is particularly acute because the BA's core job — producing discovery artefacts — is the most directly overlapping with what the pipeline produces. But the underlying job (retain meaningful ownership of the discovery output) is shared across roles.

**The two failure modes for the BA job remain from pass 3 but are now understood as a specific instance of a broader governance failure:**

| Mode | What it looks like | Why it matters |
|---|---|---|
| Passive non-adoption | BA doesn't engage; engineers run the outer loop; the BA is bypassed and the pipeline confirms the threat | Pipeline delivers compliant output but the upstream thinking is engineer-biased; the governance claim is hollow |
| Active resistance | BA frames the platform as "engineers bypassing proper requirements" to other stakeholders, including business leads and SMEs who have their own ownership concerns | This narrative finds a receptive audience because it maps onto the pre-existing concern that their input will not be captured — the resistance becomes a coalition, not an individual position |

---

### Job 4 — The person who owns the product (Product Owner / Product Manager)

> When **I am accountable for the product roadmap and the decisions that flow from it — and a structured discovery framework is being introduced into my team's delivery process —** I want to **run the outer loop end-to-end, producing artefacts I own and can defend**, so that **I am not in the position of reviewing what others have decided and having my name attached to it as the product owner on record**.

| Dimension | Description |
|-----------|-------------|
| Functional job | Be the person who drives discovery, not the person who validates what a cross-functional group decided in a workshop I wasn't in |
| Social job | Be seen as the product leader who brings structure and rigour to discovery — not the person who delegates requirements to an AI tool and then approves them |
| Emotional job | Feel that the pipeline makes my ownership clearer and more defensible, not more diffuse and political |

**Current hire:** Roadmap sessions, sprint planning, backlog grooming, stakeholder presentations. The PO's current artefacts (Jira backlog, roadmap slide, sprint goal) are formats they own and recognise as theirs. A pipeline artefact (discovery.md, benefit-metric.md) is a new format that may feel like someone else's domain.

**Switch threshold:** The PO must be able to run the outer loop without depending on an engineer to produce or translate the artefact — otherwise the platform reinforces the dynamic where technical team members hold the actual product artefacts, not the PO.

---

### Job 5 — The team-level governance job (the negotiation that happens before any discovery starts)

> When **a cross-functional team begins a new feature or initiative — and there are multiple stakeholders who believe they should own, drive, or at minimum shape the discovery process —** I want to **reach a clear, agreed, and recorded model for who is responsible, who is consulted, and who makes the final call on the discovery artefact**, so that **the team can stop negotiating process and start doing discovery, without the resulting artefact being relitigated by the stakeholders who felt excluded**.

| Dimension | Description |
|-----------|-------------|
| Functional job | Establish an unambiguous, agreed decision rights model for discovery before discovery begins |
| Social job | All participating stakeholders feel heard and properly positioned relative to the artefact — not bypassed or relegated to a review comment |
| Emotional job | The team starts discovery in a state of productive alignment, not political tension |

**Why this is the meta-job:** Jobs 1–4 are each a specific stakeholder's version of the same underlying need: "my involvement and input was real, recorded, and shaped the outcome." Job 5 is the organisational condition that makes it possible for Jobs 1–4 to be simultaneously satisfied. Without an agreed governance model (RACI equivalent for the discovery artefact), each stakeholder presses their version of the job independently, creating the exact conflict that extends discovery timelines and produces the ownership arguments.

**This is the enterprise's most expensive undone job:** The cost is not in the artefact quality — it is in the time spent in meetings before any artefact is produced, the relitigating of scope after sign-off, and the silent scope changes downstream when someone who didn't feel properly consulted drives a change without surfacing it through the original discovery record.

**Current hire for this meta-job:** Nothing structured. Teams improvise — a kickoff meeting, a RACI spreadsheet, a Confluence page with "stakeholders and responsibilities". These are rarely shared, rarely enforced, and do not link to the artefact structure. The governance model is ambiguous by default and resolved by whoever asserts the most authority, not by whoever has the best process.

**Switch threshold:** The platform must offer a model for discovery ownership that is clear enough for stakeholders to accept before discovery starts — not after. A sign-off structure embedded in the pipeline artefact (who reviewed, who approved, when) is the minimum. An explicit RACI section in the discovery template makes it visible. A workflow that routes the draft artefact to named reviewers (not "whoever wants to comment") operationalises it.

---

### Cross-job synthesis — what the platform is actually competing with

The real competition across all five jobs is not VS Code + Confluence + Jira. It is the **political economy of informal governance**: the set of unwritten rules about who gets to be in what room, who gets the last word, and whose concerns are treated as blocking versus advisory. This informal governance system is stable, self-reinforcing, and maintained by the people who benefit most from its ambiguity. The pipeline is not competing with a tool — it is competing with a social system.

**What this means for adoption strategy:**

First: the people who bear the cost of informal governance are not the same as the people who maintain it. Engineers who absorb rework, PMs blamed for scope drift, delivery managers who manage change-the-change cycles — these are the people who want the pipeline's traceability most acutely. They are not the stakeholders driving discovery. An adoption strategy that starts with the people currently running discovery (business leads, BAs, POs) is asking the people who benefit most from the status quo to be the first movers. That is structurally backwards.

Second: the right first movers are the delivery teams and the stakeholders who carry the cost. A pilot framed as "teams that want better scope traceability" will find more genuine early adopters than a pilot framed as "non-technical personas who want to use the pipeline."

Third: the traceability chain is the primary value proposition, not the surface. The right positioning is not "a lower-friction way to run /discovery" — it is "a shared, signed, versioned record of what was agreed in discovery, who contributed, and why — so that when scope changes, the impact is visible and the appropriate people are notified." That proposition lands differently for different stakeholders, but it lands for all of them.

---

### Four Forces analysis (cross-stakeholder view)

| Force | Shared across all roles | Role-specific variants |
|-------|------------------------|----------------------|
| Push | "We keep re-doing discovery because someone who wasn't in the room says we got it wrong." "Scope changed three months in and nobody could point to what had changed in the original rationale." "The audit asked for the original requirements document and we sent a Confluence page with fifty unresolved comments." | BA: "I wrote a 50-page spec and the team built something different." Business lead: "I signed off on a direction and then found out scope had been changed without a formal decision." SME: "I told them about the regulatory constraint in the kickoff and it wasn't in the final spec." PO: "My backlog keeps getting re-shaped by stakeholders who were in one discovery meeting." |
| Pull | "One place to see what was agreed, who agreed it, and what has changed." "Traceable scope decisions I can point to when anyone asks why we built this way." "Being able to reconstruct the discovery rationale six months later without calling a meeting." | BA: artefacts that survive into delivery; name on the governance record. Business lead: a defensible paper trail for audit or exec challenge. SME: visible attribution for domain input. PO: a record that proves what was agreed at discovery, protecting the backlog from informal override. |
| Anxiety | "This creates a formal paper trail — if I get a decision wrong, it's attributed to me." "My involvement (or non-involvement) in the discovery process becomes visible — right now I can claim I was consulted without it being easy to verify." "If decisions are written down formally, I can't change direction without a process." | BA: see pass 3 — role commoditisation fear. Business lead: attribution accountability may surface decisions they'd rather not have in writing. PO: if the artefact is owned collaboratively, the PO's ownership authority becomes ambiguous. |
| Habit | "We've always decided this in a room and then one person writes it up." "Our stakeholders don't read formal documents — they ask questions in Teams." "I don't know what 'correct structure' looks like so I default to what I've always done." | All roles: the current informal governance model is stable precisely because it accommodates everyone's preference for flexibility. Formalising it removes that accommodation. |

---

---

## Lens A — Opportunity Mapping

*Framework: Teresa Torres — Continuous Discovery Habits*

### Desired outcome

Any non-technical stakeholder involved in enterprise delivery — business leads, SMEs, product managers, product owners, BAs — can participate in governed discovery on equal terms with engineering teams, producing a shared, signed, traceable artefact that all parties recognise as the authoritative record of what was agreed, in a time budget that competes favourably with the current Confluence + meetings + email approach.

### Opportunity tree

```
Outcome: Enterprise discovery produces a shared, signed, version-controlled record
         that all participating stakeholders accept as authoritative — and that
         traces directly to what gets built, with scope change impact visible

├── Cluster 1: Environment access is prohibitively expensive (GATE — blocks all others)
│   ├── Unmet need: "I cannot get admin rights to install VS Code without an IT ticket"
│   ├── Unmet need: "Proxy configuration and git credentials require someone technical"
│   ├── Pain point: "Every session starts with re-orienting to a foreign environment"
│   ├── Pain point: "The setup process requires decisions I don't have context to make"
│   └── Enterprise constraint: "Procurement/security approvals for extensions take weeks"
│
├── Cluster 2: The artefact structure is a barrier independent of the content
│   ├── Pain point: "I know what a user story is but not what AC format this pipeline requires"
│   ├── Pain point: "Section headers are engineering conventions — not how I think"
│   ├── Unmet need: "I need a guide to produce valid structure, but that guide assumes
│   │               I understand the pipeline"
│   └── Pain point: "When I produce the wrong structure, the rejection is technical"
│
├── Cluster 3: My work context doesn't include these tools
│   ├── Unmet need: "Stakeholders review work in Teams — I can't share a .md file
│   │               they can read without a new tool"
│   ├── Pain point: "Approvals happen in Teams threads or Jira, not GitHub PR reviews"
│   ├── Pain point: "The pipeline produces artefacts in a format my manager doesn't
│   │               recognise as a deliverable"
│   └── Desire: "Link discovery artefacts to a Teams meeting note or a Jira epic"
│
├── Cluster 4: The adoption narrative works against non-technical stakeholders
│   ├── Pain point: "This is perceived as a developer workflow"
│   ├── Pain point: "'You have to learn VS Code too' is not a value proposition"
│   ├── Unmet need: "There are no PMs or business leads using this today — no social proof"
│   └── Pain point: "My manager sees this as extra overhead, not a replacement"
│
├── Cluster 5: Enterprise discovery governance dysfunction (EXPANDED — core problem)
│   │
│   ├── 5a: Ownership and involvement ambiguity
│   │   ├── Root cause: No agreed model for who owns, drives, and decides discovery
│   │   ├── Pain: "We spent six weeks in discovery because three people thought they
│   │   │         were the decision-maker — no one was wrong, the process was undefined"
│   │   ├── Pain: "The business lead wasn't in the discovery sessions and came back
│   │   │         three months later saying the direction was wrong — the decision
│   │   │         was made but they weren't consulted on record"
│   │   ├── Pain: "The SME gave us detailed constraints in the workshop but they
│   │   │         never made it into the acceptance criteria — no attribution trail"
│   │   ├── Desire: "Know who is responsible for each part of the discovery artefact
│   │   │           before discovery starts, not after it produces a contested output"
│   │   └── Structural gap: Discovery governance is improvised per team, per feature —
│   │                       there is no shared model and the platform does not provide one
│   │
│   ├── 5b: The formal record creates accountability that feels threatening
│   │   ├── Fear: "If I sign off on a formal artefact, I am accountable for what it says"
│   │   ├── Fear: "If someone else owns the artefact, my input might not be represented
│   │   │         correctly — and I'll have no record of what I actually said"
│   │   ├── Fear: "Right now I can claim I was consulted without it being easy to verify;
│   │   │         a formal record removes that protection"
│   │   ├── Risk: "If my name is on a discovery decision that later goes wrong, I carry
│   │   │         the accountability in a way I don't when it's in a meeting minute"
│   │   └── Paradox: The traceability that protects delivery teams is the same
│   │                traceability that removes the ambiguity that protects senior
│   │                stakeholders who prefer to remain unattributed
│   │
│   ├── 5c: Role identity and contribution ownership (applies across all non-technical roles)
│   │   ├── Root cause: the outer loop can currently be run entirely by an engineer
│   │   ├── Pain (BA): "If an engineer can produce the discovery artefact, what is my role?"
│   │   ├── Pain (PO): "I'm accountable for the product direction but the discovery
│   │   │              artefact was produced by an engineer before I was involved"
│   │   ├── Pain (Business Lead): "My strategic intent was interpreted by someone
│   │   │                          technical — I have no way to verify it survived"
│   │   ├── Pain (SME): "I wasn't involved until the review stage — my expertise was
│   │   │               excluded from framing the problem, only applied to validating
│   │   │               a frame someone else set"
│   │   ├── Unmet need: Show each stakeholder how their specific expertise is
│   │   │               structurally necessary, not optional to include
│   │   └── Structural gap: the platform has no mechanism that makes any non-technical
│   │                       input authoritative rather than advisory
│   │
│   └── 5d: The adoption resistance coalition
│       ├── The resistance is not individual — it is a coalition of stakeholders with
│       │   overlapping but distinct reasons not to engage
│       ├── Each stakeholder type has a reason to resist that is rational from their
│       │   position (accountability fear, role erosion, exclusion from framing)
│       ├── When these concerns are expressed separately they look like tool friction;
│       │   when they are understood together they look like a governance problem
│       └── Coalition resistance cannot be solved by a better surface — it requires
│           a governance model that addresses each stakeholder's concern structurally
│
├── Cluster 6: Downstream cost of decision ambiguity (NEW — scope drift and change debt)
│   │
│   ├── 6a: The silent scope change
│   │   ├── Pain: "Assumptions in the original discovery evolved — nobody updated
│   │   │         the artefact — what got built was based on the evolved assumption,
│   │   │         not the original one, and nobody flagged the gap"
│   │   ├── Pain: "Scope was changed after story sign-off without a formal decision —
│   │   │         the change was absorbed by the delivery team without visibility"
│   │   ├── Pain: "Six months in, we can't tell which scope changes were formally
│   │   │         decided and which just drifted — the audit trail is broken"
│   │   └── Unmet need: When a decision in the discovery artefact changes, the people
│   │                   who were consulted on the original decision should know
│   │
│   ├── 6b: The discovery debt cycle
│   │   ├── Pain: "We re-do discovery every cycle because last cycle's artefact is
│   │   │         in Confluence and nobody trusts it anymore — the assumptions it
│   │   │         was based on changed but the artefact never did"
│   │   ├── Pain: "We spend the first two weeks of every project answering questions
│   │   │         that were answered in the last project — there's no durable record"
│   │   └── Desire: Discoveries that deprecate gracefully — linked to what was built,
│   │               versioned when assumptions change, and queryable by anyone who
│   │               needs to understand a past decision
│   │
│   └── 6c: The impact opacity problem
│       ├── Pain: "A dependency changed and we don't know which stories are affected
│       │         because the original assumptions aren't linked to the ACs"
│       ├── Pain: "A regulatory constraint was updated — we have no way to identify
│       │         which features were built on the old assumption"
│       └── Unmet need: Changes to discovery decisions propagate automatically to
│                       downstream artefacts, or at minimum trigger a review flag
│
└── Emerging (limited evidence, needs investigation)
    ├── "We use Azure DevOps, not GitHub — the pipeline assumes GitHub-native workflow"
    ├── "Entitlement management for repo access is handled by a separate team"
    └── "Our legal/compliance team wants to own artefact retention — they won't
        accept a git-hosted document as the governance record"
```

### Opportunity prioritisation

| Opportunity | Importance to enterprise | Currently served | Priority |
|---|---|---|---|
| Shared, attributed discovery artefact — all stakeholders see their contribution on record | Very high | Not at all | 🟢 Top (new — this is the core value proposition) |
| Explicit discovery governance model (who decides, who is consulted, who reviews) | Very high | Not at all | 🟢 Top (prerequisite for any adoption) |
| Traceable scope change — when a decision changes, the impact trail is visible | High | Not at all | 🟢 Top (the downstream cost driver) |
| Zero-install access to outer loop steps for non-technical stakeholders | High | Not at all | 🟢 Top (gate — blocks all Cluster 1 downstream benefit) |
| Guided content extraction — stakeholder never sees raw template structure | High | Not at all | 🟢 Top |
| Artefact shareable in Teams / readable by non-git stakeholders | High | Not at all | 🟢 Top |
| SME and business lead input structurally attributed and required | High | Not at all | 🟢 Top — prerequisite for the governance claim to hold |
| Accountability model for the governance artefact — who signed off, when, on what | High | Not at all | 🟢 Top |
| Decision rights model embedded in discovery template | Medium | Not at all | 🟡 Watch — design question: prescribe RACI or prompt for it? |
| Scope change notification routing | Medium | Not at all | 🟡 Watch |
| Enterprise constraint handling (proxy, ADO, entitlements) | High | Not at all | 🟢 Top — a prerequisite class, not a feature |
| Audit-legible artefact format (retention, non-git governance record) | Medium | Not at all | 🟡 Watch |

### Top opportunity — seed solution hypotheses

> **Primary opportunity:** A shared, attributed, governance-quality discovery record that all participating stakeholders accept as authoritative — not just a lower-friction way to produce a pipeline artefact.

| Solution hypothesis | Addresses opportunity via | Feasibility signal |
|---|---|---|
| Discovery template with explicit RACI section (who owns, who contributed, who approved) | Makes governance roles explicit before discovery starts; attribution is built in | Low cost — template change only; requires governance model design work |
| Stakeholder review workflow with attribution — named reviewers sign off on specific sections | Each stakeholder's contribution is committed with their name attached; creates the "I was heard" record | Requires persona-routing workflow extension; low-medium engineering cost |
| Traceability notifications — when a discovery decision changes, named reviewers are notified | Closes the silent scope change gap; the downstream cost driver | Requires change-detection logic on artefact fields; medium engineering cost |
| Facilitation-native web UI — collaborative canvas for live discovery sessions | BA/facilitator runs the session; artefact is produced during the session; all participant contributions are captured and attributed | Real-time collaboration infrastructure is significant investment; see pass 3 analysis |
| Hosted web UI (non-facilitation-native) — guided form in browser | Zero-install for non-technical stakeholders; removes Cluster 1 gate | Does not address governance model gaps; access without attribution is insufficient |
| Discovery governance primer — a short onboarding workflow that establishes the RACI before the first session begins | Creates the governance model as a first-class step, not an assumption | Low cost; may be a facilitation challenge if stakeholders resist making roles explicit |

---

## Lens B — Assumption Inventory

*Framework: Teresa Torres — assumption mapping*

### Assumptions extracted — updated pass 4 (multi-stakeholder governance framing)

| Assumption | Type | Risk if wrong | Known-ness | Priority |
|---|---|---|---|---|
| The primary adoption barrier is tool access friction, not governance or accountability fear | Desirability | High | Guess | 🔴 Test first — this assumption was implicit in passes 1–3 and is now under challenge |
| All non-technical stakeholders (business leads, SMEs, POs, PMs, BAs) experience the access barrier as the dominant friction | Desirability | High | Guess | 🔴 Test first — different roles may have very different barriers |
| Enterprise stakeholders who resist the platform are motivated primarily by tool unfamiliarity, not accountability avoidance | Desirability | High | Inference | 🔴 Test before any surface investment |
| Formalising discovery governance (explicit RACI, attributed sign-off) will be welcomed by enterprise stakeholders as clarity, not resisted as accountability exposure | Desirability | High | Inference against this | 🔴 Known risk — senior stakeholders may actively resist attribution if informal ambiguity currently protects them |
| The shared, attributed artefact is experienced as protective by all stakeholders (my contribution is on record) rather than threatening (my decisions are on record) | Desirability | High | Guess | 🔴 Test first — the same record is protective for some stakeholders and threatening for others; this split is not uniform |
| Different stakeholder types (BA, PO, business lead, SME) have the same adoption journey — lower friction for all means more engagement from all | Desirability | High | Inference against this | 🔴 Likely wrong — each role has a distinct concern; a single adoption journey serves none of them well |
| The people currently running discovery (business leads, BAs, POs) are the right first movers for adoption | Desirability | High | Inference | 🔴 Likely wrong — the people carrying the cost of ambiguous discovery (delivery teams, engineers) may be stronger first movers because they have the most to gain |
| Artefact parity via guided conversation is achievable — a conversation surface produces artefacts of equivalent structural and content quality | Feasibility | High | Guess | 🔴 Test first |
| The SKILL.md vocabulary can be translated into multi-stakeholder-native language without losing governance properties | Viability | High | Inference | 🔴 Test before building — the translation must work for each role, not just for PMs |
| The outer loop currently structurally requires any non-technical input — engineer-only execution produces visibly inferior artefacts | Viability | High | Evidence against this | 🔴 Known gap — this must be fixed before surface work |
| Enterprise stakeholders will accept a shared artefact as the authoritative record rather than their own format (Confluence, email, meeting minutes) | Desirability | High | Guess | 🔴 Test first — this is the governance adoption question, not the tool adoption question |
| Decision-rights ambiguity is resolvable at the artefact level (who signs off on what section) rather than requiring org-level governance redesign | Viability | High | Inference | 🔴 Must test — if the answer is "requires org governance redesign", the pipeline cannot resolve it alone |
| The coalition of resistant stakeholders can be reached through the delivery team channel (pilot seeded by teams who want scope traceability) | Desirability | Medium | Inference | 🟡 Test via pilot design |
| PMs will invest time learning a new framework if the access surface is lower friction | Desirability | High | Inference | 🟡 Test via pull, not push — access is necessary but not sufficient |
| Engineering teams will accept artefacts produced via a non-git surface as equivalent quality | Ethical/Social | Medium | Inference | 🟡 Test via pilot |
| Enterprise bot provisioning or web app deployment is manageable within a quarter | Feasibility | Medium | Guess | 🟡 Spike before committing to any surface |
| Azure DevOps environments can be supported at the channel adapter layer without pipeline changes | Feasibility | Low | Inference | 🟢 Accept for now — note as constraint |
| The facilitation-native web UI resolves the role identity threat structurally — BA as facilitator changes their relationship to the platform | Desirability | High | Inference | 🔴 Test with BA population — does the facilitator framing change the adoption response? |
| A Phase 1 single-facilitator web UI (no real-time collaboration) is sufficient to prove the artefact production loop | Feasibility | Medium | Inference | 🟡 Test via prototype |
| The GitHub Copilot SDK is an appropriate backend for the facilitation-native UX | Feasibility | Medium | Inference | 🟡 Spike before building |
| Facilitation method design can be derived from the pipeline's SKILL.md structure without deep facilitation expertise input | Design | High | Evidence against this | 🔴 Known risk — a SKILL.md-derived canvas may feel like a form, not a facilitation scaffold |
| Legal/compliance stakeholders will accept a git-hosted, version-controlled artefact as the enterprise governance record | Viability | Medium | Guess | 🟡 Spike required — some regulated sectors may have specific retention and format requirements |

---

### Test designs (for 🔴 assumptions — updated)

**Assumption:** The primary adoption barrier is tool access friction, not governance or accountability fear

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Segmented interview | Ask separately: a BA who hasn't engaged, a PO who uses the pipeline, a business lead who was in a discovery but didn't engage further. Question: "What would have to be true for you to want to be the named owner of a discovery artefact on your next feature?" | Answer focuses on tool/setup: "I need it without VS Code" | Answer focuses on governance or accountability: "I need to know what I'm signing off on" / "I don't want my name on something I didn't fully control" |
| Passive adoption observation | Give a BA full access and working setup — remove all Cluster 1 friction. Observe over 4 weeks. | BA uses the platform for at least one real story | BA still does not engage; defers to engineer to produce the first artefact |

**Decision:** If the interview finding is about governance/accountability, not tool — surface investment is premature. The required prior work is a governance model design and a template redesign that makes sign-off meaningful but bounded.

---

**Assumption:** Formalising discovery governance will be welcomed, not resisted, by enterprise stakeholders

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Governance model test | Present two discovery templates to three senior stakeholders: (a) current format — section headers with no attribution; (b) new format — sections with "Contributed by: [name]" and "Reviewed and approved by: [name, date]". Ask: "Which would you rather sign off on?" | Stakeholders prefer (b): "I know exactly what I'm agreeing to" | Stakeholders prefer (a): "This is too formal" / "I don't want my name on individual sections" / "This creates too much overhead for a simple feature" |

**Decision:** If the finding is "too formal" or accountability avoidance — explore bounded attribution (approve the whole artefact, not individual sections) and consider whether the sign-off model needs to be opt-in at the team level rather than mandatory.

---

**Assumption:** Different stakeholder types have the same adoption journey

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Role-segmented interview series | Run the same "what would have to be true" question with one person from each role (BA, PO, business lead, SME). Map their answers. | Consistent answer pattern across roles — one adoption journey serves all | Distinct answer patterns by role — BAs raise role identity concerns; business leads raise accountability concerns; SMEs raise contribution visibility concerns; POs raise ownership concerns |

**Decision:** If the finding is role-segmented (expected), the adoption strategy must be role-specific. A single onboarding journey is insufficient. Design separate entry points — or at minimum, a first session that helps each role identify their specific concern before presenting the platform.

---

**Assumption:** Enterprise stakeholders will accept a shared artefact as the authoritative record

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Artefact legitimacy test | Show a completed discovery artefact (pipeline format) to a business lead who did not produce it. Ask: "If a question comes up in six months about why we chose this direction, is this document the one you would point to?" | Business lead confirms the artefact as authoritative | Business lead says: "I'd also need the meeting notes" / "I'd need to see who was in the room" / "This is the technical record — the business record is the deck I took to the steering group" |

**Decision:** If the finding is "I'd also need..." — explore whether the artefact can be extended to include the types of evidence that make it a complete governance record (participant list, meeting link, supporting materials). The artefact is currently oriented toward engineering pipeline quality, not enterprise governance quality.

---

**Assumption:** The facilitation-native web UI resolves the role identity threat

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Framing interview | Present two descriptions to a BA: (a) "A lower-friction way to run /discovery without VS Code"; (b) "A facilitation canvas where you run discovery workshops and the pipeline artefact is produced as a byproduct of the session." Ask: "How would you describe your role in each scenario?" | In (a): "I'm a user of the tool"; in (b): "I'm the facilitator — the tool is supporting my session" | BA describes their role the same way in both |
| Live session observation | Run a BA through a simulated facilitation session. Observe whether the BA focuses on method and content (good) or tool navigation (bad). | BA focuses on facilitation; tool is invisible; artefact emerges | BA spends >30% of time on tool navigation; facilitation is disrupted |

**Decision:** The framing interview is a 30-minute test. Run before any design work on the facilitation-native surface. If the finding is "framing doesn't change the response", the identity resolution requires governance model change, not a different surface.

---

**Assumption:** The outer loop currently requires any non-technical input

| Test approach | Description | Would observe if true | Would observe if false |
|---|---|---|---|
| Quality audit | Take three discovery artefacts produced by engineers without BA/business lead involvement. Have two BAs and one business lead assess them against: (a) customer evidence quality, (b) stakeholder context accuracy, (c) business model implication coverage, (d) regulatory constraint capture. | Assessors identify significant gaps in all four dimensions; artefacts would fail an honest DoR check | Assessors find artefacts adequate; engineer-produced versions are not distinguishable in quality |

**Decision:** If the audit finds engineer-produced artefacts are adequate, the structural fix requires intentional skill redesign — adding required evidence fields that cannot be plausibly fabricated without genuine domain contact. This is a skills platform change, not a surface change.

---

## Lens D — Product Strategy Framing (abbreviated)

*Framework: Marty Cagan — SVPG product opportunity assessment*

### Opportunity assessment

| Question | Answer | Confidence |
|---|---|---|
| What problem will this solve? | Enterprise discovery governance dysfunction: multiple stakeholders compete for ownership, no agreed decision rights model exists, discovery cycles are extended by ownership debates, and when scope evolves downstream the impact trail is invisible — so rework cycles accumulate and nobody can be held accountable against a clear original record | Strong |
| For whom? | All non-technical stakeholders participating in enterprise delivery discovery: business leads, SMEs, product managers, product owners, BAs — across managed-device, AD-auth, Teams-and-Confluence-daily enterprise environments | Strong |
| How will we measure success? | (1) Discovery cycle time reduced — time from idea to DoR sign-off per feature; (2) Scope change attribution rate — % of scope changes traceable to a specific logged decision vs. undocumented drift; (3) Stakeholder sign-off completeness — % of discovery artefacts with attribution from all nominated reviewers | Uncertain — metrics not yet formally defined; these are candidate signals for /benefit-metric |
| What alternatives exist today? | Confluence + Jira + meetings + email — the informal governance system: zero setup, fully socially legitimate, maintained by the people who benefit from its ambiguity, and stable because it is not accountable to any standard | Strong |
| Why are we best suited? | The pipeline's governed artefact chain is the mechanism that makes decisions traceable, attributed, and versioned. We are not building a new governance system — we are providing the artefact layer that makes the existing delivery process auditable. No other tool in the Confluence + Teams ecosystem produces a versioned, linked, cross-phase decision trail | Moderate |
| Why now? | (1) Enterprise AI tool adoption is creating a moment where teams are actively re-evaluating how discovery is run — the "AI-assisted delivery" conversation is happening without a governance framework. (2) Organisations that have run any agile retrospective recently have data on scope drift and rework cost — the pain is measurable and fresh. (3) The formal accountability appetite in regulated industries (financial services, healthcare, public sector) is increasing, not decreasing — "we agreed this in a meeting" is no longer a sufficient governance record in an audit | Moderate |
| How will we reach customers? | First movers: delivery teams and PMs who carry the downstream cost of informal discovery governance (rework, unattributed scope changes, relitigated decisions). Not: the business leads and BAs who currently run discovery and benefit from the informal system. Seed adoption in teams with active scope debt, not in teams with a working governance process. | Uncertain — this requires a channel strategy test |
| What must the MVP demonstrate? | (1) A cross-functional discovery session produces a shared, attributed, versioned artefact that all participants — including at least one non-technical stakeholder — recognise as the authoritative record of what was agreed. (2) When a scope assumption changes after sign-off, the impacted downstream artefacts are identifiable within 10 minutes without a meeting. | Concrete — these are the two jobs with the highest enterprise cost |
| What are the critical risk factors? | (1) **Accountability avoidance** — senior stakeholders who benefit from ambiguity will resist any governance model that creates a clear attribution trail; this is not about the tool, it is about political economy. (2) **Coalition resistance** — adoption resistance is multi-stakeholder and mutually reinforcing; solving for one role's concern does not unblock the others. (3) **Access risk** — enterprise IT constraints affect all surface options; moving the dependency is not removing it. (4) **Governance model prerequisite not delivered first** — if the outer loop remains engineer-executable without non-technical input, the adoption narrative is incoherent. (5) **Quality risk** — guided-conversation artefacts may be structurally valid but domain-knowledge thin. | High |

### Recommendation

> **PROCEED** — with REDESIGN signals on problem framing, adoption strategy, governance model, and surface architecture.

**REDESIGN signal 1 — Problem framing.** The problem is not "access friction for a non-technical persona." It is "enterprise discovery governance dysfunction." Framing it as an access problem produces solutions (lower-friction surfaces) that do not address the adoption barriers most senior stakeholders actually have. The correct problem framing is: the enterprise has no durable, attributed, versioned discovery record — and the political economy of informal governance actively maintains that gap. Any solution that does not address the political economy as well as the tooling is incomplete.

**REDESIGN signal 2 — Adoption strategy sequencing.** Starting adoption with the people currently running discovery (business leads, BAs) means starting with the people who benefit most from the status quo. The correct first movers are the people who carry the cost — delivery teams, engineers absorbing rework, PMs blamed for undocumented scope drift. A pilot framed as "teams that want scope traceability" will find more genuine early adopters than a pilot framed as "non-technical personas who want to use the pipeline." Proof from a delivery team pilot creates the social evidence that then becomes usable with the business lead and BA population.

**REDESIGN signal 3 — Governance model prerequisite.** Before any non-technical surface is built, the outer loop must be redesigned so that engineer-only execution produces a visibly incomplete governance artefact. Specifically: discovery and benefit-metric skills should require named stakeholder attribution (who contributed domain expertise, who reviewed, who approved) as a required field — absence is a quality gap, not an optional section. This makes the governance model real, not rhetorical. Without this, the platform's claim to "make your work durable" is hollow — it just produces another Confluence page with a different structure.

**REDESIGN signal 4 — Surface architecture sequencing.** Surface investment (Teams bot, facilitation-native web UI, hosted form) is downstream of governance model design and adoption channel confirmation. The surface choice must follow from evidence of which access friction is actually blocking which stakeholder type — not from prior architectural decisions. The facilitation-native web UI remains the most architecturally distinct hypothesis because it resolves the role identity concern structurally (the BA is the facilitator, not the user), but this must be tested before any build investment.

**Revised first move — five parallel experiments, all half-day or less:**

| Experiment | Who to run with | What to ask / observe | Finding determines |
|---|---|---|---|
| Delivery team pain interview | 2–3 engineers or delivery managers on a team with recent scope drift | "Walk me through the last time scope changed after you'd already started. Could you trace it back to a specific decision?" | Whether the downstream cost of ambiguous discovery is acute enough to seed pilot adoption from the delivery side |
| Barrier segmentation interview | One each: BA, PO, business lead, SME | "What would have to be true for you to be the named owner of a discovery artefact on your next feature?" | Whether barriers are role-segmented (expected) and what each role's specific concern is |
| Accountability avoidance test | 2–3 senior stakeholders (business lead level) | Show template with explicit attribution sections; ask: "Would you sign off on a document with your name on specific sections?" | Whether senior stakeholders will resist attribution — if yes, governance model must offer bounded accountability options |
| Framing test | 2–3 BAs | Present "lower-friction pipeline tool" vs. "facilitation canvas" descriptions | Whether the facilitation-native framing changes the adoption response |
| Governance model quality audit | 3 engineer-produced outer loop artefacts reviewed by BAs + a business lead | Rate against: customer evidence quality, stakeholder context accuracy, business model coverage, regulatory constraint capture | Whether engineer-only outer loop is visibly insufficient today, or requires intentional skill redesign |

All five experiments are independent. Run in parallel. No surface investment until barrier segmentation and accountability avoidance results are available.

---

## How this feeds the pipeline

| Output | Feeds | Notes |
|---|---|---|
| Five job stories (cross-stakeholder) | `/discovery` (customer section) | Business lead, SME, BA, PO, and team-level governance jobs — each with distinct switch threshold and current hire |
| Opportunity tree (6 clusters) | `/discovery` (opportunity framing, MVP scope) | Cluster 5 (enterprise governance dysfunction) and Cluster 6 (scope drift / decision debt) are the new core; Cluster 1 (access) is a prerequisite gate, not the primary problem |
| Assumption inventory (21 assumptions) | `/discovery` (assumptions section) + `/decisions` (RISK-ACCEPT candidates) | Eight 🔴 assumptions; three known gaps (engineer-only outer loop, formal governance resistance, role-segmented barriers); none are RISK-ACCEPT at this stage |
| Strategy framing | `/discovery` (rationale section) | PROCEED; four REDESIGN signals: problem framing, adoption sequencing, governance model prerequisite, surface architecture |
| Multi-stakeholder governance dysfunction (Clusters 5a–5d) | `/discovery` (constraints section) + governance model redesign | Structural prerequisite: the outer loop must require non-technical input before surface investment is made |
| Downstream scope drift (Cluster 6) | `/discovery` (rationale section) + `/benefit-metric` (candidate metrics) | Scope change attribution rate and discovery cycle time are the measurable signals that correspond to this cluster |
| Lens D risk factors | `/definition` (NFRs) | Accountability avoidance risk, coalition resistance risk, governance model prerequisite — all must be reflected as NFRs or constraints in any story that touches the non-technical channel |

---

## Revised MVP threshold

The pass 1–3 MVP threshold was: "One PM completes discovery → DoR sign-off unassisted, on a managed device with no git setup, producing an artefact accepted as-is."

This was a correct functional outcome but the wrong starting condition. The revised MVP threshold, following the pass 4 reframe:

> **Precondition A:** The barrier segmentation interviews confirm which stakeholder type's adoption barrier is primarily access friction — OR the governance model has been redesigned to make non-technical input structurally required and attributed before any surface is built.

> **Precondition B:** The quality audit confirms that engineer-only outer loop execution produces artefacts with identifiable domain-knowledge gaps — establishing that the BA/SME's structural necessity is real, not rhetorical.

> **Precondition C:** The accountability avoidance test confirms that the discovery template with attribution sections is acceptable to senior stakeholders — OR the governance model is redesigned to offer bounded attribution options that senior stakeholders will accept.

> **Given preconditions A–C are satisfied:** A cross-functional discovery session involving at least one non-technical stakeholder from each of the following groups — (business lead or SME) AND (BA or PO) — produces a shared, attributed, versioned discovery artefact. All named contributors confirm it is an accurate record of what was agreed. A downstream engineer confirms the artefact is sufficient to begin definition without requesting changes.

The MVP is not a surface test. It is a governance model test. The surface is whatever makes the above possible for the specific stakeholder population in scope.

---

## Open questions

1. **Which stakeholder type's adoption barrier is primarily access friction vs. governance/accountability fear?** This is the most important unknown. The barrier segmentation interview is the quickest way to answer it. Do not assume the answer is uniform across roles.

2. **Will senior enterprise stakeholders accept formal attribution?** The accountability avoidance test is a direct probe. If the answer is "no to section-level attribution", explore: (a) whole-artefact sign-off (less granular), (b) opt-in attribution (teams that want it can use it), (c) role-based attribution (contributor vs. approver distinction). If all three fail, the governance model question is an organisational governance problem the platform cannot solve alone.

3. **Who are the correct first movers for pilot adoption?** The reframe in pass 4 suggests delivery teams and PMs carrying scope debt are stronger first movers than business leads and BAs. The delivery team pain interview tests whether this is true. If delivery teams don't have acute scope drift pain, the pilot must start elsewhere.

4. **What is the governance model prerequisite scope?** Specifically: which skills (discovery, benefit-metric, DoR) need to be changed, which fields need to become required, and what counts as "attributed non-technical input"? This requires a skill-by-skill audit — not a general answer.

5. **What makes non-technical input structurally non-optional?** Concretely: which fields in the discovery / benefit-metric / DoR artefacts can only be provided by someone with genuine domain access — customer interview data, stakeholder confirmation, regulatory constraint ownership, business model context? This is the design question for the governance model prerequisite.

6. **Does the facilitation-native framing change the BA adoption response?** The framing test is a 30-minute experiment. If "facilitator running a session" lands differently from "user filling in a pipeline form", the surface architecture choice becomes a first-class design decision, not a downstream implementation detail.

7. **Enterprise constraint scope:** How consistent are IT/admin/proxy/entitlement barriers across the target stakeholder population? Are these universal across all enterprise types or specific to certain orgs? This determines whether the constraint is a product design requirement or a deployment configuration concern.

8. **What does "accepted artefact" mean in practice?** Who judges this — a downstream engineer reviewing against DoR hard blocks, or automated gate validation? What is the minimum bar for a business lead or SME to confirm the artefact is accurate? Needs to be defined before the metric is actionable.

9. **Azure DevOps support timeline:** The pipeline assumes GitHub. If the target stakeholder population is on Azure DevOps, how early in the design phase does this need to be addressed? Is this a surface constraint or a pipeline architecture constraint?

10. **What is the minimum viable facilitation session?** To prove the facilitation-native loop (live session → governed pipeline artefact committed to repo), what is the smallest session design that produces a complete-enough discovery artefact? A 30-minute single-facilitator structured conversation? A 90-minute multi-participant workshop? The answer determines whether a Phase 1 prototype is a solo-use tool or requires real-time collaboration infrastructure from the start.

11. **Copilot SDK feasibility for this architecture:** The SDK handles the model and agentic layer. Does it fit a persistent, multi-turn facilitation session where the model is driving SKILL.md steps across a 60–90 minute live session, not just answering a single prompt? This is a spike question, not an assumption to carry forward.

12. **Legal/compliance artefact retention:** Will regulated-sector organisations accept a git-hosted, version-controlled markdown file as the enterprise governance record? Or do they require a separate export into a retention-managed system (SharePoint, Documentum, a legal DMS)? This determines whether the pipeline artefact is the governance record or a source that feeds one.
