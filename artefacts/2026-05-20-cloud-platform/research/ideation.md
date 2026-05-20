# Ideation: Cloud Platform — Multi-Tenant Governed Delivery Application

| Field | Value |
|-------|-------|
| Feature | 2026-05-20-cloud-platform |
| Date | 2026-05-20 |
| Artefact path | artefacts/2026-05-20-cloud-platform/research/ideation.md |
| Lenses run | Lens D — Product strategy framing (Cagan); Lens C — Market and competitive scan; Lens E — Jobs-to-be-Done; Lens B — Assumption inventory + commercial analysis |
| Pipeline state signal | proceed (discovery recommended; three structural ACs required) |

---

## Context loaded

| Source | Status | Notes |
|--------|--------|-------|
| Feature discovery.md | Not found — new initiative | No artefacts exist yet for 2026-05-20-cloud-platform |
| Feature benefit-metric.md | Not found — new initiative | — |
| Feature stories | Not found — new initiative | — |
| artefacts/2026-05-19-cli-deterministic-governance/discovery.md | Read | Architecture principles: CLI validate-only Phase 1; Phase 2 state writes; Craig's mdpm convergent design; EXP-003 Config C CPF 0.675 as evidence |
| artefacts/2026-05-19-cli-deterministic-governance/research/ideation.md | Read | Format reference; Lens A/B/D ran for cdg initiative |
| workspace/experiments/eval-programme-roadmap.md | Read | EXP-001/002a/004–007 complete; Config A/B CPF ≥ 0.90 non-regulated; EXP-003 Config C in progress |
| workspace/experiments/rightmodel-integration-summary.md | Read | Model sweep capability built; corpus T1–T5; EVAL.md files for /discovery and /definition-of-ready |

*Session note: This is a brand-new initiative with no pipeline artefacts. Lens D is run first per the decision table (no artefacts → D → A). The operator pre-loaded extensive strategic context: three tenant types (solo / team / enterprise regulated), Craig's mdpm/outer-loop convergent peer work, comparators Loveable/Linear/Atlassian Rovo, and the cdg CLI initiative as a hard prerequisite. This ideation output feeds a formal /discovery pass — it is not a build decision.*

---

## Lens D — Product strategy framing (Cagan)

**10-question assessment:**

| # | Question | Signal | Confidence |
|---|----------|--------|------------|
| Q1 | What problem does this product solve? | Teams and platform operators have no turnkey, cloud-hosted, auditable AI delivery pipeline. The skills-repo framework exists as a clone-and-run repo — high DIY setup cost, no tenancy, no session persistence, and no compliance-grade audit trail. Enterprise operators in regulated environments need deterministic gate enforcement: "the model was instructed to check it" does not satisfy an auditor. Two concrete evidence points confirm this is live risk: EXP-003 Config C CPF 0.675 (model-controlled deterministic checks fail under context pressure) and the CI audit comment post-mortem (four bugs in "prose enforcement" merged undetected). | High |
| Q2 | For whom? | Three candidate segments. Enterprise regulated (high confidence): tech leads and delivery managers in regulated environments (financial services, healthcare, government) who need a traceable, auditable pipeline satisfying compliance review; a known regulated enterprise anchor confirms real demand. Team (medium confidence): tech leads in SMB/mid-market wanting consistent delivery standards without a compliance mandate; want the discipline, not the DIY overhead. Solo operator (uncertain): individuals wanting structure on personal projects; can clone the repo today; unclear whether they will pay for a cloud service. | Medium — enterprise is concrete; team/solo are hypotheses |
| Q3 | How will we measure success? | Primary: tenant-delivered governed features per month (output — are tenants using it?). Secondary: time from first sign-up to first DoR-signed story (activation — do they reach the magic moment?). Enterprise: audit trail export completeness and CPF ≥ 0.90 across tenant features — the same threshold as the platform's own M1, ensuring the product performs as well as the internal pipeline. The CPF measurement infrastructure already exists from the eval harness. | High — measurement framework inherits directly from the existing eval harness |
| Q4 | What alternatives do customers use today? | Loveable/v0/bolt.new: generates running code from prompts — zero delivery governance, no audit trail, no pipeline. Linear: issue tracking with good developer UX — no AI pipeline, no test plans, no gate enforcement. Atlassian Rovo + Jira: AI-assisted project management — mature tooling, no deterministic enforcement, no SKILL.md equivalent. GitHub Copilot Workspace: AI-assisted coding from issues — no delivery governance, no artefact chain. Manual + docs (what regulated enterprise teams do today): Confluence/Jira/manual review — high setup cost, inconsistent enforcement, no AI audit trail. DIY pipeline (what skills-repo is today): expert setup required, no tenancy, no persistence. | High — the governance gap is clear; no direct competitor in governed delivery |
| Q5 | Why are we best suited? | (1) We own the methodology: 30+ SKILL.md files covering the full delivery lifecycle, battle-tested across multiple real features. (2) We have the evaluation harness: corpus T1–T5, EVAL.md specs, EXP-001 through EXP-007 — we can measure whether the product works. (3) We are building the CLI enforcement layer (cdg): deterministic gate enforcement that a tamper-evident audit trail can be built on top of. (4) Craig's mdpm/outer-loop is a convergent peer implementation proving the architecture from a different starting point (Go binary, different methodology set). No competitor has all four. "Governed feature definitions, not running code" is a distinct market position. | High on uniqueness of combination; medium on long-term defensibility |
| Q6 | Why is now the right moment? | LLM threshold crossed: EXP-003 Config A/B CPF ≥ 0.90 for non-regulated stories — the pipeline produces measurable quality suitable for productisation. CLI enforcement in progress: cdg Phase 1 gives the audit trail foundation; without it a cloud product would still have model-controlled state, recreating the exact failure mode the platform is solving. Craig's convergent implementation reduces architecture risk from hypothesis to validated pattern. Loveable establishing market demand for AI-first development tools validates that "AI + delivery process" is credible to customers right now. | High on timing signals; medium on whether Loveable's customer profile is the right reference class |
| Q7 | How will we reach customers? | Enterprise: direct relationship with known regulated enterprise anchor (known, concrete); the enterprise version is treated as a goodwill fork that will diverge and evolve separately — the SaaS product and the enterprise fork are parallel tracks, not the same product. Team: GitHub community / skills-repo star growth → upgrade funnel (hypothesised). Solo: open source → self-serve signup (revenue uncertain). | Medium — enterprise channel is concrete; team/solo GTM is early thinking only |
| Q8 | What must MVP do to earn trust? | A new tenant creates their first governed feature — from rough idea to DoR-signed story with a clean, exportable audit trail — using only the cloud UI, in under one hour, with no local tooling required. This is the magic moment. Three sub-questions the MVP must answer: (a) Can the full outer loop (discovery → DoR) run as a cloud conversation with no local setup? (b) Can gate enforcement be deterministic in a multi-tenant cloud context (i.e. cdg integrated with cloud backend)? (c) Can the audit trail be exported for compliance review? | High on MVP definition; medium on delivery feasibility — requires cdg Phase 1 complete + cloud infrastructure |
| Q9 | Central hypothesis and risks | (a) Methodology versioning: simplified — stable + dev/experimental, feature-toggled. Design task, not a risk. (b) SaaS vs consultancy+framework model: this is the central hypothesis this ideation is testing, not a blocker to it. The consultancy motion is already working (enterprise anchor). The question is whether a self-serve SaaS motion is also viable for team/solo segments, or whether the value model is purely expertise-led. Lenses C, E, and B are oriented toward answering this. (c) Craig's relationship: resolved — informed independent peer, no formal arrangement needed. (d) Solo/team tier viability: if the paying market is enterprise-only, the SaaS motion may not be the right model and consultancy+framework may be the answer to (b). This is the key dependency between (b) and (d). (e) cdg is a hard prerequisite: a cloud product without deterministic gate enforcement would recreate the exact failure mode this platform is solving; cdg Phase 1 must complete first regardless of which model wins. | High on (e); (b)/(d) are the central hypothesis being explored; (a)/(c) resolved |
| Q10 | Proceed / Redesign / Defer? | PROCEED — on /discovery, not on build. The opportunity is real, differentiation is genuine, timing is right, and there is a known enterprise anchor customer. The three structural questions (internal vs commercial, Craig's role, tenancy/versioning model) are not blockers to ideation, but they must appear as explicit scope items in the /discovery artefact. Without those answers, any architecture designed in /discovery will be built on unvalidated structural assumptions. | High |

**Recommendation: PROCEED on /discovery — central hypothesis is SaaS vs consultancy+framework**

The core opportunity is well-founded: a real problem, a defensible position, a known anchor customer, and convergent architectural validation. The recommendation is to proceed to /discovery immediately after this ideation session.

This ideation is exploring whether a commercial SaaS track is viable alongside — or instead of — the consultancy+framework model that is already working with the enterprise anchor. The remaining lenses (C, E, B) are the mechanism for answering that question, not a prerequisite to it. All structural questions are resolved or simplified:

1. **SaaS vs consultancy+framework** *(the central hypothesis)*: The consultancy motion is already proven — the enterprise anchor demonstrates that expert-led delivery with the framework as IP is a working model. The open question is whether a self-serve SaaS motion is also viable for team and/or solo segments, or whether the product is purely an expert-led consultancy play. Lenses C, E, and B explore this directly.

2. **Craig's relationship** *(resolved)*: Informed independent peer; framework inspired his fork; he is welcome to evolve independently. No formal arrangement needed. His work is architectural validation evidence.

3. **Tenancy and methodology versioning** *(simplified)*: Stable + dev/experimental versions, feature-toggled. Design task in /discovery, not a blocking unknown.

---

*Remaining lenses to run (pending operator confirmation after each):*
- *Lens E — Jobs-to-be-Done (validate whether solo, team, and enterprise are each distinct "hiring" jobs; which tier switches, from what, and why)*
- *Lens B — Assumption inventory (map and rank the structural assumptions; test designs for highest-risk ones)*

---

## Lens C — Market and competitive scan

**Framing question: Is there evidence of a paying self-serve market for AI-governed delivery methodology, or does the evidence point toward consultancy+framework as the dominant model?**

### Competitive landscape map

| Category | Players | What they do | Governance gap |
|----------|---------|--------------|----------------|
| AI code generation | Loveable, v0, bolt.new, Cursor | Generate running code from prompts; no delivery process | No methodology, no gate enforcement, no audit trail |
| AI coding assistants | GitHub Copilot, Codeium, Tabnine | In-editor AI pair programming | No pipeline, no artefact chain, no governance |
| Project / delivery management | Linear, Jira, Shortcut, Height | Track work, manage sprints | No methodology enforcement; Jira has custom workflows but no deterministic gate logic |
| AI-augmented project management | Atlassian Rovo + Jira, ClickUp AI | AI inside project management tools | Rovo can summarise and suggest; no deterministic enforcement, no SKILL.md equivalent |
| Platform engineering / developer portals | Backstage (Spotify), OpsLevel, Cortex | Service catalogues, scorecards, tech health | Governance over services/components, not delivery process |
| Compliance automation | Vanta, Drata, SecureFrame | SOC 2 / ISO 27001 evidence collection | Compliance posture, not delivery methodology; complementary, not competitive |
| Methodology frameworks | SAFe, PRINCE2, DSDM, ITIL | Structured delivery methodologies | Human-executed, not AI-enforced; monetised as training + certification + consulting, not SaaS |
| AI agents for dev workflow | GitHub Copilot Workspace, Devin, SWE-agent | Autonomous coding agents from issues | No delivery governance layer; issue → code, no artefact chain |

**Key finding: the governed delivery SaaS category does not yet exist.** Every player either governs code (correctness, style, security) or governs projects (status, velocity, resource), but no player governs delivery methodology — the structured chain from raw idea through discovery, definition, test planning, and gate-checked implementation to a tamper-evident audit trail.

---

### Market model signals — SaaS vs consultancy

| Signal | Evidence | Model implication |
|--------|----------|-------------------|
| Methodology IP monetises as expertise | SAFe: $400M+ business; revenue from training, certification, consulting — not SaaS seats. PRINCE2, ITIL follow the same model. McKinsey Digital, Accenture: deliver methodology through engagements. | Consultancy+framework is the proven model for methodology IP at scale. |
| AI-first developer tools prove SaaS works | Loveable: ~$50M ARR in first year (2025). Cursor: ~$200M ARR. Replit: $100M+ ARR. All self-serve, subscription. | SaaS motion works when the AI output is immediately demonstrable (running code appears on screen). |
| Governance tools rarely self-serve | Vanta, Drata, SecureFrame all have a sales-assisted enterprise motion even at team scale. Compliance is high-trust, low-tolerance-for-misconfiguration — buyers want human onboarding. | Governed delivery may share this pattern: the stakes of a wrong gate pass are high enough that buyers want advisory alongside the tool. |
| Enterprise anchor already working as consultancy | The known enterprise anchor is receiving a goodwill fork + expert implementation — the consultancy motion is active and producing real value. | The consultancy model is validated by evidence. The SaaS model is not yet tested. |
| GitHub community → SaaS upgrade is a proven funnel | GitHub Stars → paid product is how Vercel, Railway, Supabase, PlanetScale all grew. skills-repo already has GitHub presence. | Team segment SaaS could ride this funnel if the self-serve activation experience is strong enough. |
| No existing SaaS winner in delivery governance | The category does not have a dominant player. | Greenfield opportunity — but also signals the category may be hard to self-serve (see: Vanta took years to prove it). |

---

### Adjacent entrant risk

| Entrant | Risk vector | Likelihood | Timeline |
|---------|-------------|-----------|----------|
| GitHub (Microsoft) | Copilot Workspace + Actions could extend into structured delivery pipelines with gate enforcement. Already has the distribution (100M+ users). | Medium | 18–36 months |
| Atlassian | Rovo + Jira already positioned as AI delivery assistant. Adding deterministic gate logic to Jira workflows is technically feasible. Has enterprise distribution. | Medium | 12–24 months |
| Linear | Strong developer brand, excellent DX. Could add AI-generated story structures and gate checks. Less likely to pursue compliance/audit angle. | Low | 24–36 months |
| SAFe / methodology incumbents | Could add an AI-enforced digital delivery layer on top of their framework IP. Have the methodology; lack the AI execution layer. | Low-medium | 36+ months |
| New entrant (YC/a16z funded) | Most likely threat: a well-funded startup specifically targeting "AI-governed delivery" after seeing Loveable's trajectory. No known player today. | Unknown | Could be 0–12 months |

**Key insight:** The largest adjacent entrant risk is GitHub/Microsoft, not a startup. If GitHub Copilot adds structured delivery pipeline governance to Copilot Workspace, the distribution moat is insurmountable. The strategic response is to be the open-source methodology standard before that happens — making skills-repo the "framework that GitHub builds on top of," not a competitor to it.

---

### Barriers to entry, lock-in, and moats

#### Barriers we face entering the market

| Barrier | Nature | Severity | Mitigation |
|---------|--------|----------|------------|
| Jira/Confluence workflow entrenchment | Teams already have story management in Jira. A new tool that generates story artefacts must answer: "Does this replace Jira or sit alongside it?" No clear answer = adoption stalls. | High | Product must have an explicit and immediate answer: companion tool, not replacement. The artefact chain lives in git/cloud storage; Jira stays as the sprint board if teams want it. |
| Methodology adoption is the switching cost | Unlike switching from Jira to Linear (data migration), adopting the pipeline means changing HOW people work. The barrier is behavioural change, not data portability. | High | The skills-repo community tier is the rehearsal space. Teams who have already adopted the methodology DIY are pre-qualified; they've already cleared the behavioural barrier. |
| Enterprise procurement cycles | Security review, legal/IP vetting, procurement approval. 6–12 month timeline for a new vendor in a regulated org. Being second-to-land in a regulated account is significantly harder than being first. | High for enterprise | Not a SaaS problem — the consultancy model handles this through the existing relationship. For SaaS team tier: procurement cycles are shorter at SMB/mid-market and GitHub-based tools have prior approval patterns that ease review. |
| GitHub/Microsoft distribution asymmetry | If GitHub Copilot adds delivery governance to Copilot Workspace, they have 100M+ users and distribution that cannot be matched. This is not a feature competition — it's a distribution moat. | Very high if triggered | Be the open methodology standard BEFORE GitHub builds on top of it. The strategic objective is: skills-repo becomes the framework GitHub integrates, not a competitor to Copilot. |
| "Second AI tool" fatigue | Teams are already managing GitHub Copilot, Cursor, ChatGPT, and internal AI policies. A cloud platform for delivery governance is another AI tool requiring a trust and security review. | Medium | Position as the governance layer that makes other AI tools auditable, not another AI assistant. Framing: "We make your Copilot usage provable to an auditor." |

#### Lock-in advantages we could build (our moats)

| Moat | Mechanism | Durability |
|------|-----------|------------|
| Methodology depth | 30+ SKILL.md files, battle-tested across real features, continuously improved by the improvement cycle. A competitor starting today is 18–24 months behind on methodology coverage alone. | Medium — only durable if the methodology keeps evolving faster than competitors can replicate it. Open core model means methodology is public; the moat is quality and iteration velocity, not secrecy. |
| CPF measurement infrastructure | The evaluation harness (T1–T5 corpus, EVAL.md, CPF threshold) means we can make a quantifiable claim — "CPF ≥ 0.90" — that competitors cannot match without having built and run the harness against real delivery data. Buyers can verify our performance claim; they cannot verify a competitor's. | High — empirical claims backed by a verifiable harness are genuinely defensible. The measurement system is itself a product feature. |
| CLI enforcement layer (cdg) | Deterministic exit codes, tamper-evident trace — not "the AI was instructed to check it." Once built, this is a fundamental architecture differentiator. Competitors would have to rebuild this from scratch, and any competitor without it cannot satisfy a serious compliance audit. | High if shipped before competitors enter the category |
| Audit trail history | After 12+ months of a regulated team's delivery history living in the platform, switching means losing the compliance audit trail. This is the strongest enterprise lock-in. | Very high — but only applies once tenants have been live for a full audit cycle (typically 12 months) |
| Open source community and contributor network | skills-repo as the methodology standard creates a community of practice. Contributors, forks, and methodology discussions build brand credibility and distribution in the developer community. | Medium — dependent on sustained community investment and responding to contributor contributions |
| Convergent peer validation (Craig) | An independent implementation (mdpm/outer-loop) arriving at the same architectural conclusions from a different starting point is credible validation that the pattern is correct, not just a single-team preference. This is unusual and compelling to technically rigorous buyers. | Medium — Craig's independence is the value; any formal arrangement would reduce its credibility |

#### Lock-in disadvantages we face from incumbents

| Incumbent | Lock-in mechanism | Our counter |
|-----------|------------------|-------------|
| Atlassian (Jira + Rovo) | Deep enterprise procurement relationships; Jira already has compliance-oriented audit logs; Atlassian Marketplace has thousands of integrations. Switching away from Jira is a large project involving data migration and workflow redesign. | Don't compete with Jira. Sit alongside it. Export artefacts to Jira if teams want that. The platform governs the methodology; Jira governs the sprint board. These are not the same job. |
| Linear | Strong developer brand loyalty; excellent UX; vocal champions in the tech lead community. Teams on Linear are advocates — they will resist adding another tool. | Linear does not do methodology governance. A team on Linear still needs a story-writing process. The platform can generate Linear-compatible issue content from governed artefacts. |
| SAFe / methodology incumbents | Organisations that have invested in SAFe certification and training have a sunk cost and social capital tied up in that methodology. Proposing a replacement is a political risk, not just a product decision. | Position as complementary: the platform enforces whatever methodology the team adopts. A team running SAFe can define their gate checks as SAFe story readiness criteria. This is a config difference, not a methodology replacement. |
| GitHub Copilot (Microsoft) | GitHub is where code already lives. Any delivery tool that is not native to GitHub requires leaving the GitHub context. Teams on GitHub Copilot Enterprise have an approved AI tool; adding a second tool requires a new approval cycle. | Build as a GitHub-native experience where possible: artefacts in git, pipeline triggered by GitHub Actions, audit trail linked to PRs. This positions the platform as a GitHub companion, not a GitHub alternative. |

---

### SaaS vs consultancy — model verdict from Lens C

**The market evidence points toward a hybrid model, not a binary choice:**

The consultancy+framework model is the proven path for methodology IP — SAFe, PRINCE2, and the enterprise anchor all confirm it. The SaaS motion is unproven for governed delivery specifically but is strongly validated as a model for adjacent AI developer tools (Loveable, Cursor). The self-serve case is strongest for the team segment where delivery discipline is wanted but expert advisory may not be affordable or necessary.

A viable model emerges: **open core with expertise-led enterprise tier.**
- **Community tier (free):** skills-repo as open source, clone-and-run. Drives awareness and GitHub credibility.
- **Team SaaS tier (paid, self-serve):** cloud-hosted pipeline with AI assistance, audit trail, feature-toggled skill versions. Targets teams who want the discipline without DIY setup. This is the SaaS hypothesis to validate.
- **Enterprise tier (consultancy-led):** expert-led implementation, enterprise fork, custom methodology adaptation. This is the model already working. Revenue is engagement-based, not seat-based.

The SaaS motion (team tier) lives or dies on one question: **is there a team segment that will self-activate without advisory?** Lens E (JTBD) will probe this directly.

---

*Remaining lenses to run (pending operator confirmation after each):*
- *Lens B — Assumption inventory (rank and test-design the highest-risk assumptions from Lens C, D, and E)*

---

## Lens E — Jobs-to-be-Done

**Framing question: For each tenant type, is the job strong enough and the trigger acute enough to drive self-activation — or does it require selling?**

*Resolved context carried forward: SaaS is a separate commercial track from the enterprise fork (goodwill gift, independently evolving). Enterprise tier is consultancy-led, not SaaS. Craig is informed independent. Versioning is stable + experimental, feature-toggled.*

---

### Tier 1 — Solo operator

**1. The job (functional / emotional / social)**

Functional: "Keep my personal project deliverable across context switches — so when I pick it up after three weeks away I know exactly what I was building, why I made the decisions I made, and what done looks like for the next increment."

Emotional: "Feel like a competent, disciplined engineer even when working alone with no team to hold me accountable. Stop shipping features that silently break the thing I built two months ago."

Social: "Be able to show this project to a collaborator, a recruiter, or a potential co-founder and have it look like a serious, structured piece of work — not a graveyard of half-finished branches."

**2. What are they firing to hire this?**

- Notion/Obsidian docs that get stale and never get read again
- Ad-hoc GitHub issues with no structure or acceptance criteria
- Mental state — "I know what I meant at the time" — as the primary artefact store
- The clone-and-run skills-repo — too much setup overhead for solo use on a side project

**3. Is the job strong enough to drive self-activation?**

Conditional. Solo operators DO actively seek tools (Notion, Obsidian, Linear adoption patterns confirm this). But the activation barrier is high: the skills pipeline requires understanding the outer loop, setting up artefact paths, and committing to a process. If the cloud product requires more than 10 minutes to produce something tangible, solo users abandon. The free tier (clone skills-repo) already handles this job adequately for technical operators willing to invest setup time. **Self-activation is plausible but fragile — marginal motivation, high abandonment risk.**

**4. The moment of struggle that triggers the hire**

"I resumed a side project today. I have 14 uncommitted files, a vague README, and I genuinely cannot remember whether the authentication feature is done or just started. I'm going to spend the next two hours reconstructing context instead of building."

Second trigger: "I want to show this project to someone I respect and it looks like chaos."

The trigger is real but **low urgency** — solo projects can tolerate indefinite chaos. There is no external deadline, no stakeholder, no audit, no postmortem forcing a change.

**5. What does progress look like?**

"I can resume any project from any point with a single read of the latest artefact. My decisions are recorded. My acceptance criteria are written before I code. My project looks structured to anyone who reads it."

**Hiring strength verdict: WEAK HIRE**

The job is real but diffuse. The trigger is low-urgency. The free tier already serves a large fraction of this job for technical operators. A paid SaaS product for solo operators would need to be dramatically simpler than the current pipeline — closer to a personal journaling/accountability layer than a governed delivery platform. This is a different product, not a scaled-down version of the team product. **Recommendation: serve solo operators through the free open-source tier. Do not invest in a paid solo SaaS tier.**

---

### Tier 2 — Team

**1. The job (functional / emotional / social)**

Functional: "Enforce delivery standards consistently across a team with varying experience levels — so that artefact quality is gate-checked by the system, not by me personally reviewing every story before it goes to a developer."

Emotional: "Stop being the bottleneck. Stop being the only person on the team who knows what a good story looks like. Offload the mechanical quality checks so I can focus on the decisions that actually require judgment."

Social: "Be able to show any stakeholder — a new engineer, a product manager, a CTO, an auditor — a structured, traceable pipeline that demonstrates the team operates with rigour. Not 'we use Jira and try our best.'"

There is a second social dimension specific to tech leads: "Justify the process investment to engineers who are skeptical of 'more ceremony' — by showing that the machine does the checking, not them."

**2. What are they firing to hire this?**

- The tech lead's personal review cycle as the primary artefact quality gate ("every story comes through me")
- Inconsistent story formats across engineers — "we all have slightly different ideas of what a story should include"
- Jira as a flexible but unenforced dumping ground: tickets exist, structure does not
- The manual skills-repo workflow: correct methodology, but DIY maintenance, no persistence, no team access layer
- Post-hoc quality recovery: finding in the sprint retrospective that the acceptance criteria were ambiguous, after the code was already written

**3. Is the job strong enough to drive self-activation?**

**Yes — for tech leads who have experienced the trigger.** Tech leads actively seek process improvement tools after a painful delivery failure. The Linear adoption pattern is the reference: a tech lead decides the current tool is failing, researches alternatives, proposes the switch. skills-repo already has a GitHub presence; a tech lead who found it and tried the DIY path is the highest-probability self-activating customer for a SaaS upgrade. The upgrade motion is: "I know what this pipeline does, I've been running it manually, I want a hosted version so I don't have to maintain it." **This is a pull motion, not a push motion — the customer has already validated the value, they're buying convenience and reliability.**

For teams who have not yet discovered skills-repo: self-activation is lower. They would need to encounter the product through a different channel (GitHub ecosystem, community word-of-mouth).

**4. The moment of struggle that triggers the hire**

Primary: "We just had a sprint retrospective where we spent 45 minutes on a feature that failed QA because the acceptance criteria were never written down properly. I reviewed the story before development started. I missed it. This is the fourth time this has happened."

Secondary: "I'm spending 6–8 hours per sprint reviewing artefacts that should be structurally correct before they reach me. I am the only quality gate and it's not scaling."

Tertiary: "We onboarded a new engineer three months ago. Their stories are still inconsistent. I don't have a systematic way to teach 'what good looks like' — I just give feedback on individual stories."

Fourth trigger (high intent): "The product manager or a stakeholder asked to see our delivery process documented. I don't have an answer that I'm proud of."

**5. What does progress look like?**

- "I reviewed 8 stories this sprint. The machine caught all structural issues before they reached me. My review time is now focused on substance, not format." (Measured: review time per story drops from 45 min to 10 min.)
- "A new engineer produced a DoR-ready story in their first sprint without my intervention." (Measured: time-to-first-clean-story for new hires.)
- "I can answer any stakeholder question about our delivery process by sending them an artefact link with the audit trail." (Measured: zero 'where is the documentation?' questions.)
- CPF ≥ 0.90 on team features — the same measurement standard as the platform itself.

**Hiring strength verdict: STRONG HIRE**

The job is concrete and economically quantifiable (tech lead time saved per sprint × hourly rate > subscription cost by a comfortable margin). The trigger is acute, identifiable, and recurs regularly. Self-activation is high for the tech lead who already knows the methodology. The upgrade funnel from open source to SaaS is the most natural acquisition path. **This is the tier the SaaS product is built for.** The hypothesis from Lens C is validated: there is a self-activating team segment.

**Critical acquisition insight:** The most qualified SaaS customer is a tech lead who has already run skills-repo manually. The open source community is the primary acquisition channel. The SaaS product must be prominently linked from skills-repo's README as "the hosted version."

---

### Tier 3 — Enterprise (regulated)

**1. The job (functional / emotional / social)**

Functional: "Produce a tamper-evident, deterministic audit trail for every feature delivered with AI assistance — so that when a regulator, an internal audit committee, or a risk review asks 'how was this gate checked?', the answer is 'by code, with a signed record', not 'the AI was instructed to check it'."

Emotional: "Stop feeling personally liable for delivery failures that a systematic check would have caught. The current pipeline puts my name on features where a model-controlled gate might have silently passed something it should not have."

Social: "Be able to tell the board, the risk committee, or the regulator that AI-assisted delivery in this organisation is governed, traceable, and independently verifiable — not a black box."

**2. What are they firing to hire this?**

- Manual compliance checklists in Confluence with no enforcement — human-checked, not machine-checked
- The "prompt the AI and record its assertion" approach to gate verification — not independently auditable
- Expensive post-hoc consultant reviews that catch problems after code is written, not before
- The DIY skills-repo workflow — correct methodology, but model-controlled checks with no exit codes and no tamper-evident chain

**3. Is the job strong enough to drive self-activation?**

**No.** Regulated enterprise customers do not self-activate for compliance-grade tooling. The buying process requires: trusted introduction, security review, legal/IP vetting of the tool and its AI components, procurement, and piloting with ongoing support. The consultancy relationship is the delivery channel — not a GitHub README. **This is a sold-to motion, not a self-serve motion.** The goodwill fork model already delivers this correctly.

**4. The moment of struggle that triggers the hire**

"The internal audit found that our AI-assisted delivery pipeline does not have deterministic gate enforcement. The finding gives us 90 days to remediate or cease using AI tools in our delivery process."

"A regulator asked us to demonstrate, with evidence, that the AI model cannot self-authorise pipeline advancement. We could not provide that evidence."

"We had a production incident that would have been caught by a mandatory gate check. The gate check was in the process, but there is no record of whether it actually ran."

The trigger is **external and acute** — a regulatory finding, an audit, or an incident. Low-frequency but very high-urgency when it occurs.

**5. What does progress look like?**

- "Every feature in our audit period has a complete, exportable, tamper-evident trace. Gate checks show exit codes, not model assertions."
- "Audit findings related to AI delivery governance: zero at next review cycle."
- "Time to answer a regulator's question about delivery governance: 15 minutes (export the trace), not 3 days (reconstruct from emails and git logs)."

**Hiring strength verdict: STRONG HIRE — but consultancy-led, not SaaS**

The job is the clearest and highest-stakes of the three tiers. Willingness to pay is highest. But the acquisition motion is fundamentally incompatible with self-serve SaaS: these customers want a trusted expert, a custom implementation, and an ongoing relationship — not a sign-up form. The goodwill fork + expert-led consultancy model is already working and is the correct delivery model for this tier. **The SaaS product does not target this tier. Attempting to serve enterprise regulated customers through a self-serve SaaS product would compromise the product for the team tier and would not satisfy the enterprise customer's actual requirements.**

---

### Hiring strength summary

| Tier | Job | Trigger | Self-activates? | Hiring verdict | Revenue model |
|------|-----|---------|-----------------|----------------|---------------|
| Solo operator | Diffuse — structure and continuity on personal projects | Low-urgency — context loss, project chaos | Fragile — high abandonment, free tier suffices | WEAK HIRE | Free (open source) |
| Team | Concrete — remove tech lead as enforcement bottleneck; machine-checked gates at scale | Acute — postmortem, review overload, onboarding failure | Yes — tech lead pull motion after discovering open source | STRONG HIRE | Paid SaaS |
| Enterprise (regulated) | Very clear — tamper-evident deterministic audit trail for regulatory compliance | Acute but low-frequency — audit finding, regulatory gap, incident | No — sold-to, consultancy motion | STRONG HIRE (different model) | Consultancy + fork |

---

### Lens E verdict on the SaaS hypothesis

**Validated: the team tier is a genuine self-activating SaaS job.** The job is economically concrete (tech lead time saved), the trigger is identifiable and recurrent, and the upgrade path from open source to hosted SaaS is the most natural acquisition motion available.

**Killed: the solo paid tier.** The job is real but not SaaS-monetisable at this complexity level. Serve solo operators through the free open-source tier. A stripped-down personal journaling product is a different product — do not build it alongside the team SaaS.

**Confirmed: the enterprise tier belongs to the consultancy model.** The job is the highest-stakes of the three, but it requires expert-led onboarding, legal vetting, and an ongoing relationship. The goodwill fork model is the right delivery vehicle.

**The SaaS product is a team product.** One tier, one motion: tech leads who have been running skills-repo manually and want a hosted, persistent, team-accessible version. The open source community is the primary acquisition channel. The README is the sales page.

---

---

## Lens B — Assumption inventory + commercial analysis

**Framing question: Which assumptions, if wrong, kill this initiative — and what does the unit economics model look like if the right ones hold?**

*Lens B surfaces the assumptions baked into Lenses C, D, and E, ranks them by risk × impact, provides test designs for the highest-risk ones, and includes a commercial analysis section since market size and unit economics are themselves core assumptions under this initiative.*

---

### Assumption register

| # | Assumption | Category | Risk if wrong | Probability wrong | Impact if wrong | Priority |
|---|-----------|----------|--------------|-------------------|-----------------|----------|
| A1 | A meaningful cohort of tech leads will discover skills-repo, attempt DIY, and self-activate to a paid hosted product without advisory | Acquisition | SaaS revenue model fails entirely; fallback is consultancy-only | Medium | Critical | **P0** |
| A2 | Teams will adopt the pipeline alongside existing tools (Jira/Linear) — no replacement required | Adoption | Integration becomes a hard prerequisite feature before launch | Medium | High | **P0** |
| A3 | cdg Phase 1 ships deterministic gate enforcement before the cloud MVP needs to make its enforcement claim | Dependency | Cloud product launches without enforcement — recreates the exact failure mode it is solving; marketing liability | Low-medium | Critical | **P0** |
| A4 | Microsoft/GitHub has not already decided to add delivery governance to Copilot Workspace in the next 12–18 months | Competitive | Primary distribution moat collapses; fallback is open standard positioning | Unknown | Critical | **P0** |
| A5 | Unit economics at the team tier SaaS price point are viable — margin exceeds operational cost per tenant | Commercial | Correct JTBD, correct product, financially unviable | Low | Critical | **P1** |
| A6 | Tech leads can evaluate the methodology quality within a single session and reach a clear "this is worth adopting" judgment | Onboarding | High-quality methodology, low discoverability — zero acquisition despite good product | Medium | High | **P1** |
| A7 | Regulated enterprises will face scrutiny for AI-assisted delivery within 24 months, creating formal demand for deterministic enforcement | Market timing | Enterprise consultancy demand stays latent; slower pipeline | Medium | Medium | **P1** |
| A8 | The GitHub star → DIY attempt → hosted upgrade funnel operates at a conversion rate sufficient to build a sustainable customer base | Growth model | Primary acquisition channel underperforms; requires paid acquisition (CAC model breaks) | Unknown | High | **P1** |
| A9 | Craig's convergent implementation (mdpm/outer-loop) remains independent, credible, and architecturally compatible enough to serve as validation evidence | Architecture | Lose the "independent convergent validation" signal; weaker Q5 (Cagan) answer | Low | Medium | **P2** |
| A10 | CPF ≥ 0.90 is reproducible across diverse tenant workloads, not just internal features | Quality | The platform's core quality claim fails under real tenant diversity; enterprise anchor trust damaged | Low-medium | High | **P2** |

---

### Deep-dive test designs — P0 assumptions

#### A1 — Team tier self-activation

**The assumption:** A tech lead who finds skills-repo on GitHub, tries the DIY workflow for a feature or two, experiences the friction of manual maintenance (no persistence, no team access, SKILL.md updates), and self-activates to "I want a hosted version of this."

**Why it might be wrong:** The DIY friction may never reach the threshold for action. The tech lead uses skills-repo once, gets the artefact, and never returns. No habit forms. No upgrade motivation.

**Test design:**
- Phase 1 (pre-product): Instrument skills-repo README with a "want a hosted version?" interest link (simple email capture). Measure: how many DIY users express interest without being asked explicitly?
- Phase 2 (beta): Offer 10 early access slots to self-nominated tech leads from the GitHub community. Measure: time from first login to first DoR-signed story (activation metric). If median > 90 minutes, onboarding is broken.
- Invalidation threshold: If < 2% of README visitors click the interest link after 3 months, or if 0 of 10 beta users complete a feature in the first session, A1 is invalidated.
- Fallback: Consultancy-only model. The SaaS product becomes a private tool for consultancy engagements, not a self-serve product.

#### A2 — "Companion not replacement" acceptance

**The assumption:** Teams will run the pipeline for story artefact generation without demanding that it replace Jira as the source of truth for sprint planning.

**Why it might be wrong:** The artefact chain (discovery.md, story.md, test-plan.md, DoR) creates a second structured record of work. Jira already has that role. Teams either demand integration (export to Jira) or abandon one system.

**Test design:**
- Beta observation: After 3 sprints, are beta teams maintaining both the platform artefacts and Jira, or have they abandoned one?
- Direct interview: "Where does your sprint board live when you're using this platform?" — listen for friction signals.
- Invalidation threshold: If > 60% of beta teams report friction from dual-system maintenance within 3 sprints, Jira export becomes a launch prerequisite, not a roadmap item.
- Mitigation already available: Artefacts live in git (GitHub-native). Teams can link Jira tickets to git commits containing artefacts. This may be sufficient for the team tier — enterprise would need more.

#### A3 — cdg delivery dependency

**The assumption:** cdg Phase 1 (validate-only, exit codes 0–8, no state writes) is complete before the cloud platform makes any public claim about deterministic gate enforcement.

**Why it might be wrong:** cdg stories cdg.1 and cdg.2 are DoR-signed, but no committed ship date exists. If the cloud product MVP launches before cdg is integrated, the enforcement story is "we instruct the model to check" — identical to the failure mode the platform is positioned to solve.

**Test design:** This is not a market test — it is a sequencing gate. The cloud MVP must not ship without a passing `cdg validate` integration test that exercises at least one gate check with a verifiable non-zero exit code on failure.
- Gate: CI check — `cdg validate --dry-run` returns exit code 0 on a known-good artefact and a non-zero code on a known-bad artefact. Both must pass in the cloud MVP's integration test suite before any public launch.
- If cdg slips: cloud MVP scopes down to "artefact generation only" (outer loop, no enforcement claims) until cdg is ready.

#### A4 — GitHub/Microsoft competitive timing

**The assumption:** GitHub does not announce a structured delivery governance feature for Copilot Workspace within the planning horizon.

**Why it might be wrong:** GitHub is actively expanding Copilot Workspace. "Issue → governed feature artefacts → coding agent dispatch" is architecturally adjacent to what Copilot Workspace already does. Microsoft has the resources to ship this in a single quarter if they choose to.

**Test design:** This assumption cannot be directly tested — only monitored.
- Monitor: GitHub Next, GitHub Changelog, Microsoft Build keynotes, Copilot Workspace release notes. Any mention of "delivery pipeline," "gate enforcement," "structured artefact chain," or "definition of ready" is an early warning signal.
- Response playbook if triggered:
  - Immediately assess: is the announced feature complementary (builds on skills-repo) or substitutive (replaces it)?
  - If complementary: accelerate open standard positioning — publish the SKILL.md schema, CPF benchmark, and cdg CLI specification as community standards before their feature ships.
  - If substitutive: pivot to the consultancy+framework model exclusively; the SaaS motion is no longer viable.
- Current window assessment: No public signal detected. 12–18 month window estimated (from Lens C). The cdg CLI and CPF benchmark must be publicly established within 6–9 months to have any community standard claim before Microsoft could ship.

---

### Commercial analysis

#### Market sizing

**Top-down:**

| Scope | Estimate | Basis |
|-------|----------|-------|
| Global software engineers | ~27M | Stack Overflow Developer Survey 2024 |
| Tech leads / senior engineers with delivery process ownership | ~4M (15%) | Rough role ratio |
| Teams of 5–20 engineers with a tech lead who actively seeks delivery quality tooling | ~500K teams | 1 tech lead per 8-person team; half are passive |
| SMB/mid-market teams who would consider a SaaS methodology tool | ~50K teams (10% of TAM) | Adjusted for SaaS-openness; excludes enterprise-locked orgs |
| Realistic serviceable addressable market — year 1–3, early-stage product | ~500–2,500 teams (1–5% of SAM) | Typical early-stage developer tool penetration |

**Bottom-up via GitHub funnel:**

| Funnel stage | Number | Assumption |
|-------------|--------|------------|
| skills-repo GitHub stars at product launch | 500–2,000 | Growth from current base via community activity |
| Stars → DIY attempt | ~20% = 100–400 | Stars that represent genuine evaluation, not passive bookmarks |
| DIY attempt → "want hosted version" intent | ~30% = 30–120 | Users who hit meaningful DIY friction |
| Intent → paid conversion | ~40% = 12–50 | Users who find the product and sign up |
| **Launch cohort estimate** | **12–50 paying teams** | Conservative; bottom-up |

The bottom-up model is the credible one for year 1. Top-down TAM is useful for investor narrative; it does not predict early traction.

---

#### Pricing model

**Reference comparators:**

| Tool | Price | Model | Relevance |
|------|-------|-------|-----------|
| Linear (team) | $8/user/month | Per seat | Closest UX comparator; lower stakes |
| Vercel (team) | $20/user/month | Per seat | Developer infra SaaS |
| Vanta (team) | ~$800/month flat | Per workspace | Compliance tool — closer job to be done |
| Railway | $5/user/month + usage | Seat + usage | Developer infra with usage component |
| Cortex (platform eng) | $500–1,500/user/year | Per seat, enterprise | Governance-adjacent |

**Recommended pricing structure — team tier:**

Per-seat pricing is unnatural for this product: not every team member interacts with the pipeline equally. Per-workspace (flat team plan) is better aligned with the job — the tech lead pays once, the whole team benefits.

| Tier | Price | Seats included | Overage |
|------|-------|---------------|---------|
| Team Starter | $99/month | Up to 5 engineers | n/a |
| Team | $179/month | Up to 15 engineers | $12/seat/month beyond 15 |
| Team Plus | $299/month | Up to 40 engineers | $10/seat/month beyond 40 |

Annual pricing: 2 months free (effectively ~17% discount). This is the Vercel/Linear/Supabase pattern — incentivises annual commits, improves cash flow.

LLM usage is included in the flat fee at reasonable volumes. Tenants exceeding ~20 features/month incur a small overage. This prevents abuse without charging by the token (which creates anxiety and suppresses usage).

---

#### Unit economics

**Per-tenant cost model (Team tier at $179/month):**

| Cost component | Monthly estimate | Basis |
|---------------|-----------------|-------|
| LLM API cost per tenant | $1–3 | ~4 features/month × ~50K tokens/feature × $3/M tokens (Sonnet-class) |
| Infrastructure (compute, auth, storage) | $5–12 | Cloud hosting at scale; higher per-tenant until ~100 tenants |
| Support time (async, early stage) | $8–15 | ~30 min/month per active tenant at $30/hour fully-loaded |
| Payment processing | $5–6 | Stripe ~2.9% + $0.30 |
| **Total marginal cost** | **~$19–36/month** | |
| **Gross margin at $179/month** | **~$143–160/month (~80–85%)** | |

80–85% gross margin is SaaS-standard and healthy. The model works at any scale above ~10 active tenants.

**Break-even and growth targets:**

| Teams | MRR | ARR | Monthly infra + fixed costs | Operating status |
|-------|-----|-----|-----------------------------|------------------|
| 7 | $1.25K | $15K | ~$1K | Break-even |
| 25 | $4.5K | $54K | ~$1.5K | Cash-flow positive |
| 50 | $9K | $108K | ~$2K | Sustainable solo business |
| 150 | $27K | $324K | ~$4K | Meaningful ARR; consider hiring |
| 500 | $90K | $1.1M | ~$10K | Venture-scale signal |

Fixed costs assumed: $500–1,000/month base infrastructure, minimal tooling. A solo operator building this on their own time has no salary cost at early stage. First meaningful fixed cost addition: a part-time engineer or contractor at ~50 paying teams.

**Consultancy revenue alongside SaaS:**

| Engagement type | Price | Volume (year 1) | Annual revenue |
|----------------|-------|-----------------|----------------|
| Expert-led implementation (regulated enterprise) | $15–40K | 2–3 engagements | $30–120K |
| Team onboarding advisory (optional add-on for SaaS teams) | $2–5K | 5–10 engagements | $10–50K |

In year 1, consultancy revenue is likely to exceed SaaS ARR by 3–5x. This is normal for an early-stage product with an established services offering. The risk is that consultancy demand suppresses product investment — the two must be kept structurally separate (different delivery model, different pricing, different delivery time commitments).

**Year 1–3 revenue model (base case):**

| Year | SaaS teams | SaaS ARR | Consultancy | Total revenue |
|------|-----------|----------|------------|---------------|
| Y1 | 10–30 | $18–54K | $50–120K | $68–174K |
| Y2 | 50–150 | $108–324K | $60–150K | $168–474K |
| Y3 | 150–500 | $324K–1.1M | $80–200K | $400K–1.3M |

*Base case assumes: no paid acquisition, community-only growth, 1 solo operator, no external investment.*

**Upside case** (GitHub feature goes viral, Y1 stars → 5,000+): 100–300 teams in Y1, $180–540K SaaS ARR. Still no paid acquisition needed.

**Downside case** (A1 fails — self-activation doesn't materialise): SaaS at <10 teams. Consultancy carries the business. Strategic decision point: invest in onboarding improvement, or accept consultancy-only model.

---

### Lens B synthesis

**Three P0 assumptions determine the shape of the business:**

1. **A1 (self-activation)** is the SaaS/consultancy branch point. If it holds, build the SaaS product aggressively. If it fails, accept consultancy-only and stop investing in self-serve onboarding.
2. **A3 (cdg dependency)** is not optional — it is a launch gate. No enforcement claim without a passing exit code. This is already in the pipeline.
3. **A4 (GitHub/Microsoft)** cannot be controlled — only monitored and responded to. The strategic response (be the open standard) must be executed in parallel, not deferred.

**Unit economics are not the problem.** At $179/month with ~85% gross margin, the model is financially sound at 25+ paying teams. The challenge is getting to 25 — which is entirely an A1/A6 onboarding problem, not a pricing or margin problem.

**The commercial analysis identifies one important pricing risk:** the team tier must feel like "infra pricing" (flat, predictable, no anxiety about LLM token spend) rather than "AI tool pricing" (per-query, unpredictable). Bundled LLM usage with a clear overage cliff is the correct pattern.

**Key number to carry into /discovery:** 25 paying teams at $179/month = break-even on a cash-flow basis. This is achievable from a 1,000-star GitHub community. The pilot validation question for /discovery is: can 10 beta users reach DoR-signed story in under 90 minutes? If yes, A1 and A6 are provisionally validated and the SaaS motion is worth building.

---

*Remaining lenses to run: none. All planned lenses (D, C, E, B) are complete. Proceed to "How this feeds the pipeline" and "Open questions" sections, then /discovery.*

---

## How this feeds the pipeline

This ideation is the input to `/discovery` for the `2026-05-20-cloud-platform` feature. The following signals are ready to carry forward:

**Architecture decisions locked by ideation:**
- Open-core model: community (free OSS) + team SaaS + enterprise consultancy. These are structurally separate tracks.
- SaaS product targets the team tier only. Solo = free tier. Enterprise = consultancy.
- cdg Phase 1 is a hard prerequisite for any enforcement claim in the cloud product.
- GitHub-native artefact storage (git) is the correct architecture — avoids the "second source of truth" problem with Jira.

**Explicit /discovery inputs:**
- Central question: what is the MVP that validates A1 (self-activation) with 10 beta users in under 90 minutes to first DoR-signed story?
- Scope constraint: MVP does not require full multi-tenancy, billing, or enterprise features. It requires: (a) cloud-hosted outer loop UI, (b) cdg integration with verifiable exit codes, (c) exportable audit trail.
- Success metric for /discovery phase: 10 beta users, 90-minute time-to-activation benchmark, CPF ≥ 0.90 on beta features.
- cdg as a prerequisite must be reflected in the /discovery scope dependency section.

**What /discovery does NOT need to re-open:**
- SaaS vs consultancy — answered (hybrid open-core, each tier separate)
- Craig's role — answered (informed independent peer)
- Methodology versioning — answered (stable + experimental, feature-toggled)
- Pricing structure — answered ($179/month team plan as working hypothesis; can refine in /benefit-metric)
- Market size — addressed (25 paying teams = break-even; realistic from a 1,000-star GitHub community)

---

## Open questions

These remain open after all lenses and must be addressed in /discovery or flagged as explicit scope decisions:

1. **Onboarding experience design** — What does the first-session experience look like for a tech lead who has never seen skills-repo? What is the minimum viable onboarding to reach "first governed feature" in under 90 minutes? This is the UX question that determines whether A1 and A6 hold.

2. **Jira/Linear integration depth** — Is a git-based artefact chain sufficient for the team tier, or is a Jira ticket sync required at launch? This gates the scope of the MVP significantly. Lens B suggests it may not be required for early adopters (they are GitHub-native), but it will become a barrier for non-GitHub-native teams.

3. **LLM model dependency** — The platform's CPF ≥ 0.90 claim is based on Sonnet-class models. If a tenant uses a different model (GPT-4o, Gemini), does CPF hold? This is a quality assurance question for multi-tenant deployment.

4. **cdg CLI distribution** — How does a cloud platform invoke cdg in a multi-tenant context? As a sidecar container? A serverless function? The architecture decision affects cost model and isolation guarantees. Must be resolved in /discovery technical design.

5. **Open source licence** — skills-repo is currently unlicenced in the repo. For an open-core model, the licence choice matters: MIT/Apache-2 maximises community adoption; BSL (Business Source Licence) or AGPL can protect SaaS hosting exclusivity. This is a /discovery-phase decision with legal implications.

---

*Session reference: /ideate run 2026-05-20. Operator context: cdg as prerequisite; Craig as convergent peer (informed independent); known regulated enterprise anchor (unnamed). Lenses run this session: D, C, E, B. All planned lenses complete. Ideation signal: PROCEED to /discovery.*
