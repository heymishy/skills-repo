# Epic: Operators and non-engineers can run structured prioritisation sessions and produce traceable ranked artefacts

**Discovery reference:** artefacts/2026-04-27-prioritise-skill/discovery.md
**Benefit-metric reference:** artefacts/2026-04-27-prioritise-skill/benefit-metric.md
**Slicing strategy:** User journey — stories follow the chronological session flow: intake → scoring → multi-pass → socialisation → output. Each story delivers a usable increment of the skill; the skill is minimally usable after pr.2 and reaches its full v1 capability after pr.5.

## Goal

When this epic is complete, any operator, product manager, or business lead can invoke `/prioritise`, describe their candidate items in plain language, be guided through one or more scoring frameworks (WSJF, RICE, or MoSCoW), and produce a saved ranked markdown artefact with scores and rationale that they would share with a stakeholder without further editing. Mixed groups can run workshopping sessions with guided facilitation prompts. The skill explains divergence between frameworks at the level of the underlying model. A second operator who was not part of this design session can pick up the skill cold and complete a run unassisted.

## Out of Scope

- Story decomposition of prioritised items — that remains `/definition`'s responsibility
- Automated ingestion from GitHub Issues, Jira, or any external backlog tool — operator provides the candidate list
- Roadmap publishing or integration with any external roadmap tool
- Benefit metric derivation from scores — operator supplies or confirms values; no writeback to benefit-metric artefacts
- v2 frameworks (Kano, ICE, Opportunity Scoring, Cost of Delay standalone) — documented extension point only; not implemented in this epic

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Session completion rate | 0 (skill doesn't exist) | ≥80% of sessions started result in saved artefact (first 5 uses) | The skill exists and produces an artefact; M1 becomes measurable |
| M2 — Rationale completeness | 0 | 100% of completed artefacts contain rationale per framework pass | pr.2 conversational scoring elicits rationale; pr.5 output format enforces the rationale field |
| M3 — Non-engineer unassisted completion | Not established | First non-engineer completes session unassisted | pr.1 framework introductions, pr.2 scoring guidance, pr.4 socialisation features target PM/business-lead self-sufficiency |
| MM1 — Cold-start replication | Not established | First cold-start operator run produces passing artefact without author help | pr.1 opening guidance, pr.5 extension-point documentation together make the skill self-contained |

## Stories in This Epic

- [ ] pr.1 — Candidate intake and framework selection
- [ ] pr.2 — Conversational scoring: WSJF, RICE, and MoSCoW passes
- [ ] pr.3 — Multi-pass orchestration and divergence handling
- [ ] pr.4 — Socialisation and workshopping features
- [ ] pr.5 — Output format, rationale enforcement, extension point, and artefact save

## Human Oversight Level

**Oversight:** High
**Rationale:** The deliverable is a new SKILL.md — instruction text that governs agent behaviour across all future sessions. Errors in the skill's conversational design cannot be caught by automated tests; they require human review of the produced artefact and session transcript. Per constraint C2, the SKILL.md must be merged via PR with explicit human review.

## Complexity Rating

**Rating:** 2
**Rationale:** The skill logic is well-understood (the P6a manual WSJF session gives a live reference protocol), but the conversational UX design has known ambiguity — specifically ASSUMPTION-01 (input quality) and ASSUMPTION-03 (whether conversational scoring is acceptable UX for non-engineers). These are manageable unknowns, not blockers.

## Scope Stability

**Stability:** Stable
**Rationale:** Constraint C1 (additive only — single new SKILL.md) sharply bounds the scope. No schema changes, no infrastructure, no integration with external tools.

## Architecture Guardrails Check

No viz changes, no schema changes, no new scripts. Relevant constraints:
- ADR-011: New SKILL.md requires a story artefact before commit — this epic satisfies that.
- C6: The SKILL.md must pass `scripts/check-skill-contracts.js` structural contracts — pr.5 (the story that produces the final file) must include this verification in its ACs.
- Architecture pattern: *"Group instruction-text-only changes at the same exit point into a single story"* — followed: no story splits by section within the same session phase.
