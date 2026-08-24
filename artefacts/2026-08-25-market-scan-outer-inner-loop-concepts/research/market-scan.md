# Market Scan: Outer-Loop / Inner-Loop Concepts for wuce (the SaaS Product)

**Date:** 2026-08-25
**Prepared by:** Claude (agent), on operator request
**Scope:** Comprehensive scan of the web-UI and skills-framework space for concepts worth learning from or borrowing for `wuce` (the hosted, commercial delivery surface of this platform — see `product/roadmap.md`'s "Commercialisation track — wuce SaaS beta path"), with particular focus on outer-loop and inner-loop skill concepts.
**Context:** This redoes research from a session roughly 3-4 days prior (around 2026-08-21/22) that covered the same ground — including Port.io — but was never saved to disk and could not be recovered (see `workspace/capture-log.md`, 2026-08-25 entry, and `artefacts/2026-08-24-skill-tool-invocability-pilot/discovery.md`'s unrelated but concurrently-discovered gap). This document supersedes that lost research. It also builds on and updates `artefacts/archived/phase5-6-roadmap.md` (2026-04-21), which did an earlier competitive-landscape pass covering GitHub Spec Kit, Vistaly/Torres, GitLab Duo, Harness.io, and Qodo — that document's Appendix B remains a valid reference for the Layer 1/2/3 market framing this document assumes.

---

## 1. Executive summary

Four months after the April roadmap's competitive scan, the market has moved substantially in three directions relevant to `wuce`:

0. **The single strongest finding in this scan (added after operator review, Section 3d): none of the scanned spec-driven-development tools do structured, gated discovery-to-spec, and none show any cross-story/epic traceability mechanism.** Kiro's "Requirements" phase elaborates a request into structured requirements (EARS notation) — it does not validate whether the request represents a genuine, worth-solving problem. OpenSpec, Spec Kit, and Tessl are effectively spec-first with no upstream discovery step at all. BMAD-METHOD is the real exception — genuine named elicitation techniques and a "Brief Phase" — but even it is explicitly lighter-touch than a hard gate ("the agent asks once, briefly, not as a confirmation ritual"), unlike this platform's `/discovery` clarification gate, which outright refuses to produce spec sections until ambiguity is resolved. Independent industry criticism directly validates the "doesn't work for larger concepts, no traceability" concern that prompted this deeper look: published critiques of SDD tools at scale describe "cognitive overload... often resulting in the specifier giving up and blindly approving documents" and note these tools were "not designed for" enterprise stakeholder involvement or multi-team coordination. This platform's outer loop (discovery → benefit-metric → definition → review → test-plan → DoR) plus its hash-verified, git-native trace chain is not something to borrow *from* this category — it is a genuine, evidenced differentiator *against* it.
1. **"Loop Engineering" has become a named, widely-recognised 2026 industry concept** — coined and popularised by Boris Cherny (Claude Code's own creator), Peter Steinberger, and amplified by Andrew Ng and Addy Osmani. This directly validates skills-repo's own outer-loop/inner-loop framing as directionally correct and industry-relevant — but Cherny's precise definition of the terms differs from this repo's usage in a way worth reconciling (Section 2).
2. **The spec-driven-development tooling category has exploded** from roughly 3 named tools (Spec Kit, Kiro, this platform's own approach) in April to 30+ named frameworks today, with real performance and quality differentiation between them. Several of these frameworks solve — or attempt to solve — problems this platform has explicitly deferred (spec-drift detection, multi-persona discipline simulation) (Section 3).
3. **A previously-unscanned competitive category — Internal Developer Portals (Port.io, Backstage, Cortex)** — turns out to be the closest commercial analogue to `wuce`'s actual product shape (a hosted web UI surfacing catalog, standards/scorecards, self-service actions, and governance across a team), closer than the April doc's Layer 3 comparison set (GitLab Duo, Harness.io, Qodo), which focused on CI/CD-embedded governance rather than a standalone web portal (Section 4).
4. **AI agent audit-trail and compliance-dashboard practices have matured into a recognisable pattern** (OTel-based tracing, compliance-framework mapping, filterable dashboards) that this platform's own trace design substantially anticipates architecturally, but does not yet surface via a comparable UI or framework-mapping layer (Section 5).

Section 7 translates all of this into concrete "concepts to borrow" mapped against `wuce`'s actual current feature surface, and Section 8 proposes candidate next features ranked by how directly they close a gap this scan found.

---

## 2. Loop Engineering — naming validation and a definitional gap

**What it is:** "Loop engineering" crystallised as a named concept in mid-2026, credited to Boris Cherny (who runs Claude Code at Anthropic) and Peter Steinberger, then amplified widely by Andrew Ng and Addy Osmani. The core idea: stop prompting coding agents turn-by-turn; instead design a small autonomous control system — a "loop" — that runs the model in a sense-decide-act-check cycle, feeds it work, checks results, and decides what happens next, without a human typing each prompt.

**Cherny's inner loop vs. outer loop (as popularised):**
- **Inner loop** — scoped to a single task; the sense-decide-act-check cycle that improves reliability of one unit of work.
- **Outer loop** — the cross-session system that runs the inner loop on a schedule, feeds it work, checks the result, decides the next thing, and maintains state in persistent files.

**How this compares to skills-repo's own usage:** This platform's "outer loop" (`CLAUDE.md`'s discovery → benefit-metric → definition → review → test-plan → definition-of-ready) and "inner loop" (`branch-setup → implementation-plan → subagent-execution → verify-completion → branch-complete`) split on a **different axis** than Cherny's: this platform's split is *governance-stage* (human-gated planning vs. agent-executed building), while Cherny's split is *execution-scope* (single-task reliability vs. cross-session orchestration). Both are legitimate, non-conflicting uses of the same two words — but the terms are now widely recognised with Cherny's specific meaning, so a `wuce` user or evaluator familiar with 2026 industry usage may initially misread this platform's outer/inner loop documentation through Cherny's lens rather than this platform's own.

**Concept to borrow:** Cherny's outer loop explicitly "maintains state in persistent files" as a first-class design property — this platform already does exactly this (`pipeline-state.json`, `workspace/state.json`, the traces branch), but has never framed it as a deliberate implementation of the now-industry-recognised "outer loop maintains persistent state" pattern. Worth citing this alignment explicitly in `wuce`'s own marketing/positioning copy and in `product/mission.md` — it is now a differentiator that lands with an audience that already knows the term, rather than something to explain from scratch.

**Gap to consider closing:** a short glossary note (in `CLAUDE.md` or a `wuce`-facing doc) explicitly distinguishing this platform's outer/inner loop terminology from Cherny's popularised usage, so the two don't get conflated by a reader who has seen the "loop engineering" concept elsewhere first.

---

## 3. Spec-driven development landscape — 30+ frameworks now, real differentiation

By 2026, GitHub Spec Kit, AWS Kiro, Claude Code, Cursor, OpenSpec, BMAD, Tessl, and Google Antigravity have all shipped their own flavour of spec-driven development (SDD). A tiering has emerged: Kiro and Spec Kit (Tier 1, vendor-backed), BMAD-METHOD, GSD, and Cursor Plan Mode (Tier 2, community-led), OpenSpec and Tessl (Tier 3, niche-optimised).

### 3a. OpenSpec — delta-tracking, and an admitted unsolved problem this platform shares

OpenSpec's defining mechanism: every change to a spec is captured as a scoped diff (`ADDED`/`MODIFIED`/`REMOVED` sections) against a source-of-truth spec, rather than rewriting the whole spec each time — making it well-suited to brownfield/evolving codebases rather than greenfield-only.

**Its known, publicly-documented limitation is directly relevant:** "specs don't self-update during implementation... when the agent diverges from the spec, and it will, you have to resync manually. It works best for people willing to actively engage with and maintain their specs, because the tool will not maintain them for you." This is functionally identical to this platform's own **G18 gap** (`artefacts/archived/phase5-6-roadmap.md`: "session delta vs persistent knowledge split... implementation decisions do not update the governing spec artefacts"), which was deliberately deferred as a Phase 6 candidate conditioned on WS5.2 (delivery-to-assumption feedback) proving the assumption-card pattern at scale.

**Concept to borrow — and a genuine differentiation opportunity:** OpenSpec's finding confirms this is an *industry-wide unsolved problem*, not a shortfall specific to this platform. No competitor has solved it well as of this scan. This platform's own G18 mitigation plan (WS5.2's assumption-card delivery-feedback loop) is a more structured attempt than OpenSpec's "resync manually" approach — worth accelerating rather than deferring to Phase 6, since it is a concrete, provable differentiator against every SDD tool in this category, not just an internal governance nicety.

### 3b. BMAD-METHOD — full-team persona simulation and "Party Mode"

BMAD-METHOD (Breakthrough Method for Agile AI-Driven Development) simulates an entire agile team as 12+ specialised agent personas: Analyst, Product Manager, Architect, Scrum Master, Developer, QA/Test Architect, UX Specialist — each producing the artefact a real team member in that role would produce (the Analyst produces a brief; the PM turns it into a PRD with FRs/NFRs; the Architect produces a component map and integration strategy).

This is structurally close to this platform's own discipline-persona model (`product/mission.md`'s Developer/Tech Lead/Platform Maintainer/UX Designer/UX Researcher/Product Manager personas, each with named skill-file touchpoints) — but BMAD's are literal, separately-invoked AI agent personas producing artefacts in sequence, whereas this platform's personas are documentation of *who* uses which skill, not separate agent invocations per role.

**BMAD's "Party Mode"** — bringing multiple agent personas into a single session for live collaborative discussion (e.g. the Architect and PM debating a tradeoff, or the Developer and QA aligning on test strategy before implementation) — is a genuinely novel UI/UX concept not present in this platform's own design. Currently, this platform's discipline-crossing happens sequentially and asynchronously (one skill's output becomes the next skill's input); there is no synchronous multi-persona "debate" surface.

**Known cost tradeoff, worth heeding:** in one published real-world comparison (a CRM dashboard build), the same task took 12 minutes with OpenSpec, 90 minutes with Spec Kit, and 5.5 hours with BMAD. BMAD's heavier multi-persona ceremony has a real, measured overhead cost — directly resonant with this session's own item #6 finding (`artefacts/2026-08-23-inner-loop-ceremony-optimisation/loop-design.md`) that heavy per-task ceremony has diminishing returns on a mature, convention-rich codebase. BMAD's own tradeoff is external validation that this platform's decision not to over-multiply persona/review passes without evidence (Section 3c of the loop-design audit) is directionally sound, not overly conservative.

**Concept to borrow for `wuce` specifically (UI, not process):** a lightweight, optional "party mode"-style view — surfacing which discipline/persona a given pipeline stage's output is *for* (not necessarily a separate agent invocation, just a UI affordance naming the audience), and potentially a synchronous multi-stakeholder comment/discussion thread on a single artefact before approval — would visually differentiate `wuce` from a purely sequential pipeline view without adopting BMAD's much higher ceremony cost.

### 3c. Kiro, Spec Kit, Tessl, Google Antigravity — brief notes

- **AWS Kiro**: integrated, spec-first IDE where spec/model/billing live inside the AWS perimeter. Optimises for a guided, opinionated experience at the cost of portability.
- **GitHub Spec Kit**: open, MIT-licensed CLI toolkit, 93,000+ stars, supports 30+ AI coding agents. The reference tool for agent-agnostic structure.
- **Tessl**: positioned as an aspirational "spec-as-source" compiler, but the actual shipped product today is a registry of agent skills (not a working spec compiler) — the regeneration engine is in closed beta, JavaScript-only, and was observed producing non-deterministic output from identical specs. Not yet a credible reference implementation for anything.
- **Google Antigravity AgentKit**: thin public coverage; not evaluable from available sources at this time.

None of these three introduce a concept not already covered by the Kiro/Spec Kit/OpenSpec/BMAD analysis above.

### 3d. The real gap in this whole category: no structured discovery-to-spec, no cross-story traceability (added after operator review)

The operator's own read on this research, checked directly against the sources above, surfaces the single strongest finding in this scan — strong enough to promote to the top of the executive summary (Section 1, item 0).

**None of the five SDD tools scanned do genuine, gated problem-discovery before spec production:**

- **Kiro** has a real "Requirements" phase that transforms a request into structured requirements using EARS notation, producing `requirements.md` → `design.md` → `tasks.md`. But this is *spec elaboration* — turning a stated request into a well-formed spec — not *problem validation*. Nothing in Kiro's documented workflow challenges whether the request represents a genuine, worth-solving problem, names who is affected, or surfaces unconfirmed assumptions as a blocking condition before proceeding.
- **GitHub Spec Kit, OpenSpec, Tessl** are effectively spec-first with no upstream discovery step described anywhere in their documentation or independent coverage — you arrive with a spec (or a delta against one), and the tool's value starts there.
- **BMAD-METHOD is the genuine exception** among the five: a collaborative "Analyst" agent with named elicitation techniques (Pre-mortem Analysis, First Principles Thinking, Inversion, Red Team vs. Blue Team, Socratic Questioning) and a "Brief Phase" producing a 1-2 page executive summary of vision, audience, value proposition, and scope. This is real, more sophisticated discovery than the other four tools combined. **But it is still explicitly lighter-touch than a hard gate**: BMAD's own documentation states "if you say something ambiguous, the agent asks once, briefly, not as a confirmation ritual" — a single clarifying pass, not this platform's `/discovery` mechanism, which has an explicit **Clarification gate** that refuses to produce *any* spec section (no `## Problem`, `## Personas`, `## MVP`, etc.) until specific trigger conditions (no named problem, no named persona, no measurable baseline) are resolved, and which tags every unconfirmed constraint with an explicit `[ASSUMPTION]` marker that mandatorily routes to `/clarify` before scope can lock.

**Independent industry criticism validates the "doesn't work for larger concepts, no traceability" concern directly, not just as inference from the tool descriptions:**

- On scale: *"While spec-driven development tools work well for greenfield projects, prototypes, and small teams, enterprise software development requires working with existing systems, respecting established architectures, involving business stakeholders, and planning for long-term maintainability — areas these popular SDD tools were not designed for."*
- On cognitive load at scale: *"When using SDD to develop an entire product or large feature, the scope is large and artifacts generated are enormous; if the entire project is specified in one go it is impossible for a human to process so much cognitive load in one shot, often resulting in the specifier giving up and blindly approving documents in the agentic loop."*
- On multi-team/traceability: *"Coupling and dependencies should be considered; if work touches many parts of the system, it should be broken down, which becomes particularly challenging when coordinating across multiple teams."*

None of the published coverage of any of these five tools — including the more favourable comparisons — describes anything resembling a structural, cross-story or cross-epic traceability mechanism (a hash-verified instruction chain, a git-native audit trail linking a specific delivered AC back to the specific spec section and specific human approval that authorised it). This platform's own trace design (`workspace/traces/`, `validate-trace.sh`/`.ps1`, `pipeline-state.json`'s story-to-epic-to-feature structure) is not matched by anything found in this category.

**Strategic implication:** this is not a "concept to borrow" finding — it inverts the framing. This platform's own outer loop (the `/discovery` clarification gate specifically, plus `/clarify`'s structured 4-category gap analysis, plus the assumption-tagging-and-mandatory-resolution pattern) and its cross-story trace chain are *already* doing something none of the five most-discussed 2026 SDD tools do well, validated by both the tools' own documented behaviour and independent industry criticism of the category as a whole. The risk is not "we're behind" — it's "we might not realise what we have, and could erode it by treating spec-driven-development feature parity with these tools as the goal," when the actual differentiator is the discovery-gate and traceability discipline these tools lack. Worth stating plainly in `wuce` positioning copy: not "we also do spec-driven development" but "we solve the two problems spec-driven development tools don't: getting to a *validated* spec from a vague problem, and proving, after the fact, that what shipped traces back to it."

---

## 4. Internal Developer Portals — Port.io, Backstage, Cortex — the closest product-shape analogue to `wuce`

This category was **not** covered in the April roadmap's Appendix B (which scanned Layer 3 as GitLab Duo / Harness.io / Qodo — all CI/CD-embedded governance, not standalone web portals). It is a materially closer match to `wuce`'s actual shape: a hosted web UI surfacing a catalog, standards/scorecards, self-service actions, and team-level governance.

### 4a. Port.io

SaaS internal developer platform: software catalog with maturity/quality **scorecards**, **self-service actions** (developer- or agent-triggered operations like scaffolding a service or provisioning a resource), and a three-layer governance model:
1. **RBAC** — user permissions
2. **Approval workflows** — human oversight, with an explicit action state machine (`WAITING_FOR_APPROVAL` → `IN_PROGRESS`/`DECLINED`)
3. **Dynamic, context-aware permissions** — access rules that adjust automatically based on real-time conditions (e.g. staging deploys are instant, production requires approval; permissions can vary by time-of-day)

Positioned for teams of 20-150 engineers, deployable in days without a dedicated platform engineering team.

**Concept to borrow — dynamic, context-aware oversight:** this platform's `oversightLevel` (Low/Medium/High) is currently a static value set once at epic level (per `artefacts/archived/phase5-6-roadmap.md`'s G6, still informal in the JSON schema and not wired to any actual permission/tool-scope decision at execution time). Port's dynamic-permissions model — where the *same* action requires different levels of oversight depending on real-time context (which environment, which time, which risk signal) — is a more mature version of what G6 originally scoped and is still open. Directly actionable: `wuce` could offer a UI-configurable policy (e.g. "staging changes are Low oversight always; production changes are High oversight unless a named approver pre-authorises a batch") rather than a fixed per-story value.

**Concept to borrow — explicit approval-workflow state machine:** Port's `WAITING_FOR_APPROVAL → IN_PROGRESS/DECLINED` states, with automated notifications on each transition, is a cleaner state model than this platform's current DoR "Proceed: Yes/No" binary sign-off. Worth considering for `wuce`'s own DoR/DoD approval surfaces — an explicit, filterable, notifiable state rather than a single sign-off field.

### 4b. Backstage vs. Cortex vs. Port — market positioning worth noting

- **Backstage** (Spotify, open-source): a *framework* you build a portal on top of, not a finished product — React shell, YAML-backed catalog, TechDocs, Scaffolder, 200+ community plugins.
- **Cortex**: enterprise-focused, scorecards-first, driving engineering standards and service maturity — commercial, ~$20-40/user/month, 2-4 week time-to-value. Notable limitation: real-time catalog ingestion works for only a few data sources; others update hourly/weekly, and Kubernetes-object visibility is Kubernetes-catalog-only.
- **Port**: fastest time-to-value, flexible data modeling, strong self-service actions, targets 50-500 developer teams.

**Direct market-position note for `wuce`:** Cortex's "scorecards out-of-the-box, driving engineering standards and service maturity" positioning is nearly identical to what this platform's own guardrails/standards web-UI surface (`wugs` — Web UI Guardrails/Standards Surface, this session's own recent prior work, e.g. PR #725 "Provide a create/edit form for a guardrail or standard") is building. This is a genuine, nameable competitor for that specific `wuce` feature area, not a hypothetical — worth a deliberate feature comparison against Cortex specifically (not just the generic Layer 3 comparison in the April doc) the next time `wugs`-adjacent work is scoped.

---

## 5. AI agent audit trails and compliance dashboards — an industry pattern this platform's architecture anticipates but doesn't yet surface

**The pattern (2026, general industry, not one vendor):** production AI agent traces now commonly carry OTel-style span attributes (model version, prompt version, policy version, user ID, tenant ID) covering every tool call, retrieval source, guardrail decision, and judge score. Enterprise compliance dashboards filter by agent, user, approval status, risk level, and date, and periodic reports map directly onto named regulatory frameworks (NIST AI RMF Govern/Map/Measure/Manage, EU AI Act Article 11 technical documentation, ISO 42001).

**A striking, citable stat:** in a Q1 2026 survey, only 17% of organisations could reconstruct the full sequence of tool calls, inputs, and outputs for a specific agent task after the fact — the rest had partial logs, no logs, or logs that captured reasoning but not tool invocations.

**Concept to borrow — this platform is already ahead architecturally, but doesn't say so:** this platform's `workspace/traces/` branch, `validate-trace.sh`/`.ps1`, and hash-verified `SKILL.md` instruction sets already produce an inspectable, git-native audit trail — the *mechanism* substantially exceeds the "17% can reconstruct" industry baseline. But this platform's own traces are not currently framed against or mapped to named compliance frameworks (NIST AI RMF, EU AI Act Article 11, ISO 42001) the way the industry pattern above describes. This is a concrete, low-effort differentiation move: add an explicit crosswalk (which trace fields satisfy which named framework's evidence requirements) to the `/trace` skill's output or to `wuce`'s own compliance-facing documentation. The underlying data is already captured; the framework-mapping layer is what's missing.

**Concept to borrow — filterable dashboard UI:** `wuce`'s current trace/fleet-visibility surfaces (per this session's context: `dashboards/pipeline-viz.html`, fleet aggregation) could adopt the "filter by agent/user/approval-status/risk-level/date" pattern explicitly as a named UI feature, since it is now a recognisable, expected pattern for this exact audience (compliance/risk reviewers).

---

## 6. Claude Code skills ecosystem scale — context for this platform's own recent decision

As of 2026, the Claude Code plugin/skills ecosystem has grown to hundreds of official marketplace plugins and 2,000+ community-contributed skills (one community aggregator, `tonsofskills.com`, alone bundles 425 plugins / 2,810 skills). Plugins are the distribution unit; skills are the content — a plugin bundles one or more skills plus optional hooks/MCP config. The official Anthropic marketplace is signed and reviewed; most community marketplaces are unsigned and unaudited — "roughly where the npm ecosystem was in 2015" on provenance.

**Relevance to this platform's own recent decision:** this session separately investigated (via `/discovery` + `/clarify`, `artefacts/2026-08-24-skill-tool-invocability-pilot/discovery.md`) whether to register this platform's own ~40+ skills natively as Claude Code skills, and decided not to pursue it — the finding was that native registration injects all registered skills' descriptions into every session's context at startup (a permanent token cost), for benefits (slash-command typing, auto-suggestion) largely redundant with this repo's own `CLAUDE.md` routing table.

**This market-scan finding does not change that decision, but adds useful context:** at 2,000+ community skills, the ecosystem's own security/provenance model is explicitly compared to "npm in 2015" — i.e., immature. If this platform's skill library were ever published to a marketplace (a materially different question from the internal-registration question already decided), provenance/signing would be a first-order concern from day one, not an afterthought — worth flagging for whenever platform-distribution (`sync-from-upstream`, the unresolved G0a lockfile/versioning gap from the April doc) is next revisited, since a public marketplace listing is a natural extension of that same distribution mechanism.

---

## 7. Concepts to borrow — consolidated, mapped to `wuce`'s actual feature surface

| # | Concept | Source | Maps to (wuce feature area) | Effort signal |
|---|---------|--------|------------------------------|----------------|
| C0 | **Not a build item — a positioning correction.** State plainly that this platform solves the two problems SDD tools don't: validated discovery from a vague problem (the `/discovery` clarification gate + `/clarify`), and post-hoc proof that delivery traces back to it. Protect this discipline; don't dilute it chasing SDD-tool feature parity. | Section 3d (operator-prompted deep-dive) | `product/mission.md`, `wuce` positioning/marketing copy, sales/onboarding narrative | None — messaging only, but do not skip it |
| C1 | Explicit crosswalk from trace fields to named compliance frameworks (NIST AI RMF, EU AI Act Art. 11, ISO 42001) | Industry AI-agent-audit-trail pattern (Section 5) | `/trace` skill output; `wuce` compliance-facing docs | Low — data already captured, just needs a mapping layer |
| C2 | Dynamic, context-aware oversight level (not static per-epic) | Port.io's dynamic permissions (Section 4a) | `oversightLevel` schema field + DoR/branch-complete gating | Medium — schema change (already flagged as open in G6) + UI |
| C3 | Explicit approval-workflow state machine with notifications | Port.io's action states (Section 4a) | DoR/DoD sign-off surfaces in `wuce` | Medium |
| C4 | Filterable audit/trace dashboard (agent/user/approval-status/risk-level/date) | Industry pattern (Section 5) | `dashboards/pipeline-viz.html`, fleet aggregation views | Medium |
| C5 | Accelerate G18 (spec-drift/delivery-feedback) rather than defer to Phase 6 | OpenSpec's admitted same unsolved problem — differentiation opportunity, not just internal nicety (Section 3a) | WS5.2 assumption-card delivery feedback | High — this is the biggest strategic lever found in this scan |
| C6 | Named "loop engineering" alignment in positioning copy | Loop Engineering concept (Section 2) | `product/mission.md`, `wuce` marketing copy | Low |
| C7 | Glossary note distinguishing this platform's outer/inner loop from Cherny's popularised definition | Same (Section 2) | `CLAUDE.md`, onboarding docs | Low |
| C8 | Lightweight "who is this output for" persona-audience UI affordance (not full Party Mode) | BMAD's Party Mode, cost-adjusted (Section 3b) | `wuce` pipeline-stage views | Medium |
| C9 | Deliberate feature comparison against Cortex specifically for the guardrails/standards surface | Cortex's scorecards-first positioning (Section 4b) | `wugs` (Web UI Guardrails/Standards Surface) roadmap | Low — a comparison exercise, not a build |

---

## 8. Recommended next few features, ranked by directness of the gap closed

0. **C0 (positioning correction) — do this first, before any build item.** It costs nothing to build and changes how every other item in this list should be framed: C1/C4's compliance/audit work and C5's spec-drift work aren't "catching up to the SDD/IDP category" — they're deepening a differentiator that category has repeatedly, independently been criticised for lacking. Get the narrative right before investing build effort, so the build items land as reinforcing a stated position rather than chasing feature parity.
1. **C5 (accelerate G18/WS5.2)** — promoted above C1 after Section 3d's deeper look: this is not just "an industry-wide unsolved problem this platform has a better plan for" (the original framing) — it is the delivery-side half of the exact discovery-to-traceability differentiator C0 identifies. Currently scheduled as a Phase 6 candidate; this scan is grounds to reconsider that sequencing.
2. **C1 (compliance-framework crosswalk)** — smallest effort, clearest differentiation, uses data this platform already captures. The traceability-side half of the same C0 differentiator — makes the "we can prove it traces back" claim externally legible to a compliance/risk audience, not just internally true.
3. **C9 (Cortex comparison for `wugs`)** — cheap to do (a comparison writeup, not a build), and directly informs whatever `wugs` work comes next by naming a real, specific competitor rather than reasoning about the guardrails surface in the abstract.
4. **C2/C3 (dynamic oversight + approval state machine)** — both already partially scoped as open gaps (G6) from the April roadmap; Port.io's implementation gives a concrete reference shape rather than starting from a blank page.
5. **C4, C6, C7, C8** — lower urgency, good candidates for opportunistic pickup alongside other `wuce`/dashboard work rather than dedicated features.

---

## Sources

- [Kiro Feature Specs docs — requirements/design/tasks workflow](https://kiro.dev/docs/specs/feature-specs/)
- [Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl (Martin Fowler)](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [Why Spec-Driven Development Breaks at Scale (And How to Fix It) (Arcturus Labs)](http://arcturus-labs.com/blog/2025/10/17/why-spec-driven-development-breaks-at-scale-and-how-to-fix-it/)
- [Why Specification-Driven Development (SDD) is Not a Silver Bullet for AI-Assisted SDLC (Towards AI)](https://pub.towardsai.net/why-specification-driven-development-sdd-is-not-a-silver-bullet-for-ai-assisted-sdlc-491c71bcf835)
- [Why Spec-Driven Development Tools Fail in the Enterprise (Martinelli)](https://martinelli.ch/why-spec-driven-development-tools-fail-in-the-enterprise/)
- [BMAD-METHOD — Advanced Elicitation docs](https://docs.bmad-method.org/explanation/advanced-elicitation/)
- [BMAD-METHOD — Analysis Phase: From Idea to Foundation](https://docs.bmad-method.org/explanation/analysis-phase/)
- [Loop Engineering (cobusgreyling)](https://cobusgreyling.substack.com/p/loop-engineering)
- [Andrew Ng on "Loop engineering" (X/Twitter)](https://x.com/AndrewYNg/status/2071988145667928442)
- [GitHub — cocodedk/loop-engineering: fact-checked knowledge base on Boris Cherny's methodology](https://github.com/cocodedk/loop-engineering)
- [AddyOsmani.com — Loop Engineering](https://addyosmani.com/blog/loop-engineering/)
- [2026 AI Specification Frameworks Compared: OpenSpec, Spec Kit, Superpowers, BMAD & GSD (BSWEN)](https://docs.bswen.com/blog/2026-08-07-ai-spec-frameworks-compared/)
- [BMAD vs Spec Kit vs OpenSpec (Medium/Reenbit)](https://medium.com/@reenbit/bmad-vs-spec-kit-vs-openspec-choosing-your-spec-driven-ai-framework-in-2026-a6996b3ebb8d)
- [OpenSpec Explained (2026): Delta Tracking + Brownfield](https://codemyspec.com/blog/openspec-explained)
- [Spec-Kit vs OpenSpec: two takes on spec-driven development (Hidde de Smet)](https://hiddedesmet.com/speckit-vs-openspec)
- [GitHub — bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- [What is the BMAD Method? (Charter Global)](https://charterglobal.com/bmad-method-ai-driven-software-development/)
- [BMAD in Practice: The Complete AI Agent Development Workflow (Diego Rodrigo)](https://diegorodrigo.dev/en/2026/04/06/bmad-in-practice-the-complete-ai-agent-development-workflow/)
- [GitHub Spec Kit vs Kiro vs Claude Code SDD Workflows (Rost Glukhov)](https://www.glukhov.org/ai-devtools/ai-coding-assistants/spec-kit-vs-kiro-vs-claude-code/)
- [9 Best AI Tools for Spec-Driven Development in 2026 (MarkTechPost)](https://www.marktechpost.com/2026/05/08/9-best-ai-tools-for-spec-driven-development-in-2026-kiro-bmad-gsd-and-more-compare/)
- [Port.io — Overview of Internal Developer Portals](https://www.port.io/guide/overview-of-internal-developer-portals)
- [Port.io — Self-service actions documentation](https://docs.port.io/actions-and-automations/overview/)
- [Port Workflows: Orchestrate Agents, Approvals, and Automations](https://www.port.io/blog/port-workflows)
- [Port.io Deep Dive: Scorecards & Workflow Automation (200OK Solutions)](https://www.200oksolutions.com/blog/port-io-deep-dive-scorecards-workflow-automation/)
- [Backstage vs Port vs Cortex: Internal Developer Portal Comparison (wetheflywheel)](https://wetheflywheel.com/en/comparisons/backstage-vs-port-vs-cortex/)
- [Port vs Backstage vs Cortex: We Evaluated All 3 (2026) (Tasrie IT Services)](https://tasrieit.com/blog/port-vs-backstage-vs-cortex-developer-portal-comparison-2026/)
- [Top 4 Backstage Alternatives for 2025 (Port.io blog)](https://www.port.io/blog/top-backstage-alternatives)
- [The Enterprise Guide to AI Agent Audit Trails in 2026 (miniOrange)](https://www.miniorange.com/blog/ai-agent-audit-trail/)
- [AI Agent Compliance and Governance in 2026: A Practical Guide (FutureAGI)](https://futureagi.com/blog/ai-agent-compliance-governance-2026)
- [AI Agent Governance and Compliance in 2026 (Zylos Research)](https://zylos.ai/research/2026-05-01-ai-agent-governance-compliance-2026/)
- [Claude Code Plugin Marketplace Guide (2026) (Agensi)](https://www.agensi.io/learn/claude-code-plugin-marketplace-guide)
- [GitHub — jeremylongshore/claude-code-plugins-plus-skills (471 plugins, 3,069 skills)](https://github.com/jeremylongshore/claude-code-plugins-plus-skills)
- [Claude Code Plugins | Skills, MCP Servers & Marketplace Directory](https://claudemarketplaces.com/)
- [Cognizant and Cognition Partner to Scale Autonomous Software Engineering](https://www.prnewswire.com/news-releases/cognizant-and-cognition-partner-to-scale-autonomous-software-engineering-and-deliver-business-value-across-enterprise-operations-302671608.html)
- [Report: Cognition Business Breakdown & Founding Story (Contrary Research)](https://research.contrary.com/company/cognition)
