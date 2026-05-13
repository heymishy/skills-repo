# Discovery: /prioritise — Multi-Framework Prioritisation Skill

**Status:** Approved
**Created:** 2026-04-27
**Approved by:** Operator, 2026-04-27
**Author:** Copilot (GitHub Copilot, Claude Sonnet 4.6) with operator

---

## Problem Statement

Operators have no structured skill for sequencing competing initiatives. Prioritisation is ad hoc, undocumented, and non-repeatable. There is no framework selection guidance, no scored artefact, and no divergence detection across frameworks. When an operator needs to decide what to build next, they either choose intuitively (no audit trail) or run a manual scoring session outside the pipeline (no artefact, no reuse). The recent P6a sequencing decision was run manually as a WSJF session — that protocol is now fresh to encode and the absence of a skill was directly felt.

## Who It Affects

Tech leads, operators, and platform maintainers who sequence competing initiatives across a feature backlog. Also product owners, product managers, and business leads who make prioritisation decisions every sprint and need to justify sequencing choices to stakeholders. A scored, traceable artefact provides them with an audit record for why item X was prioritised over item Y — something currently unavailable without manual effort outside the pipeline.

## Why Now

Two triggers converge. First, the operator just ran a manual WSJF prioritisation session (the P6a sequencing decision) without a skill — the protocol is fresh to encode and the gap was directly experienced. Second, adoption friction: the platform is currently perceived as an engineering tool. POs, PMs, and business leads make prioritisation decisions every sprint but have no entry point into the pipeline. `/prioritise` speaks their language (value, urgency, cost of delay) and produces a stakeholder-readable artefact — a natural bridgehead for PM/business-lead adoption. Encoding now means every phase-gate sequencing exercise from P6a onward can double as a PM onboarding moment.

## MVP Scope

Three frameworks in v1 with a designed extension point:

- **WSJF** (Weighted Shortest Job First — SAFe model: cost-of-delay / job size) — demand proven: just run manually as the P6a sequencing session
- **RICE** (Reach × Impact × Confidence / Effort) — PM ubiquity; speaks the language of the target bridgehead personas
- **MoSCoW** (Must-have, Should-have, Could-have, Won't-have) — business/stakeholder interoperability; lowest barrier to entry for non-engineers

Deferred to v2 (extension point in SKILL.md will document how to add): Kano, ICE, Opportunity Scoring, Cost of Delay (standalone). ICE overlaps with RICE sufficiently to cause confusion in v1. The remaining three require per-dimension explanation overhead that is not warranted without demonstrated demand.

The skill must:
- Accept candidate items from the operator (described in plain language) or optionally from `pipeline-state.json` candidate feature list
- Suggest which framework(s) to use based on the operator's context and goals, with brief rationale — the operator confirms or overrides
- Walk through scoring conversationally, one dimension at a time, suggesting plausible values with reasoning and inviting the operator to correct
- Support multi-framework passes — when a single framework produces a tie or ambiguous result, the skill may recommend running a second or third framework to triangulate
- Include socialisation/workshopping features — guided prompts that help operators and mixed human groups (PMs, business leads, tech leads) reason through scoring together, building shared ownership of the result
- Produce a ranked output artefact with scores, rationale, and a divergence flag when multiple frameworks give conflicting rankings, with an explanation of why they diverge (not just a flag)
- Output readable by a non-engineer stakeholder without pipeline context
- Invocable at any pipeline stage with no mandatory entry condition

## Out of Scope

- **Story decomposition** — `/prioritise` ranks items; it does not decompose them into stories. That is `/definition`'s job.
- **Benefit metric derivation** — scoring values are operator-supplied (or suggested by the skill). They are not derived from or written back to benefit-metric artefacts.
- **External tool ingestion** — no automatic pull from GitHub Issues, Jira, or any external backlog tool. The operator provides the candidate list.
- **Roadmap publishing** — the output is a decision record, not a published or integrated roadmap artefact.
- **Final sequencing authority** — the skill suggests frameworks, suggests scoring values with reasoning, and may recommend a second or third framework pass when results are ambiguous. The operator confirms or overrides every score and makes the final call. The skill advises; it does not decide.

## Assumptions and Risks

- **ASSUMPTION-01 (highest risk):** Operators will provide honest scoring inputs. The skill can suggest values but cannot validate them against external data — garbage-in, garbage-out on scores is the highest risk, especially when a stakeholder wants a particular item to win. A well-formatted artefact does not indicate a well-scored one. The benefit-metric session must surface a meta-metric around input quality (e.g. operator can state a rationale for at least one score per framework pass when prompted), not just ranked output production. S1 ("artefact they'd share with a stakeholder") is gameable by a well-formatted but poorly-scored run without this paired signal.
- **ASSUMPTION-02:** The 7 frameworks listed cover the current user base's needs. Enterprise teams may use proprietary or hybrid frameworks not included here.
- **ASSUMPTION-03:** A conversational scoring session (one dimension at a time, with suggested values) is acceptable UX for non-engineers. If PMs expect a spreadsheet-style input, the conversational format may feel unfamiliar initially.
- **RISK-01:** The skill produces a confident-looking artefact. A low-quality input session (rushed scores, no rationale) will produce a well-formatted but unreliable output. The socialisation/workshopping features are the primary mitigation — guided group prompts reduce the likelihood of unconsidered scores getting through.
- **RISK-02:** Multi-framework divergence flagging may create more confusion than clarity if the operator does not understand why the frameworks disagree. The skill must explain divergence at the level of the underlying model (e.g. "WSJF favours job size efficiency; RICE weights confidence more heavily") — the socialisation features provide a natural vehicle for this group-level explanation.

## Directional Success Indicators

- **S1:** An operator runs the skill start-to-finish in one session and produces an artefact they would share with a stakeholder without further editing.
- **S2:** A product manager or business lead runs the skill without prior knowledge of the pipeline and produces a ranked output without needing to ask what WSJF or RICE means — the skill's conversational guidance is sufficient.
- **S3:** When two frameworks give conflicting rankings, the operator can articulate why they accepted one ranking over the other because the skill explained the divergence clearly, not just flagged it.
- **S4:** A socialisation/workshopping session run with a mixed group (PM + tech lead + business lead) produces a result that feels owned by the group rather than imposed by the tool.

## Constraints

- **C1:** ADDITIVE only — the deliverable is a single new `SKILL.md` file under `.github/skills/prioritise/`. No changes to existing skills, no schema changes, no new infrastructure.
- **C2:** Human approval gate is non-negotiable — the new SKILL.md must be merged via PR with explicit human review (product/constraints.md constraint 4).
- **C3:** Artefact-first rule — no SKILL.md implementation before the full discovery → benefit-metric → stories → test-plan → DoR chain is complete.
- **C4:** No external integrations — the skill reads from operator input and optionally from `pipeline-state.json` candidate feature lists. No Jira, GitHub Issues, or other external tool calls.
- **C5:** Output format is plain markdown — self-contained, no runtime dependencies, readable without the pipeline dashboard.
- **C6:** The SKILL.md file must follow established section headings and structural contracts checked by `scripts/check-skill-contracts.js`.
- **C7:** The skill is optional with no mandatory entry condition. It is never a required pipeline gate. `/workflow` and other orientation skills (e.g. a future `/where-am-i` concierge) may suggest it when multiple candidate features are in play, but the operator is never blocked for not running it.

---

**Next step:** Human review and approval → /benefit-metric
