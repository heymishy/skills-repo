# Story: Accept candidate items and guide framework selection with rationale at session open

**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Discovery reference:** artefacts/2026-04-27-prioritise-skill/discovery.md
**Benefit-metric reference:** artefacts/2026-04-27-prioritise-skill/benefit-metric.md

## User Story

As a **tech lead, product manager, or business lead**,
I want to **describe my candidate items in plain language and receive a framework suggestion with a brief rationale that I can confirm or override**,
So that **I enter the scoring phase with a clear, agreed plan rather than a blank prompt that requires prior framework knowledge**.

## Benefit Linkage

**Metric moved:** M3 — Non-engineer unassisted completion; MM1 — Cold-start replication
**How:** A non-engineer who has never used WSJF, RICE, or MoSCoW can read the framework suggestion and its rationale, confirm or choose differently, and proceed without consulting anything outside the conversation. This is the first observable step in an unassisted session. MM1 is also moved because the skill's opening guidance is the primary cold-start surface — if it is insufficient, the cold-start operator fails here.

## Architecture Constraints

- ADR-011: This story produces the initial `/prioritise` SKILL.md scaffold. No other governed files are touched. The SKILL.md path is `.github/skills/prioritise/SKILL.md`.
- C6 (from discovery): The final SKILL.md produced across all pr.* stories must pass `scripts/check-skill-contracts.js`. This story creates the file; pr.5 verifies the contract.
- Architecture pattern: skill and template files are Markdown only — no embedded HTML except HTML comments.

## Dependencies

- **Upstream:** None — this is the first story in the epic.
- **Downstream:** pr.2 (conversational scoring) depends on the candidate intake output and confirmed framework selection produced by this story.

## Acceptance Criteria

**AC1:** Given the skill is invoked with no prior context, when the skill opens, then it displays a brief opening statement explaining what `/prioritise` does and names the three available frameworks (WSJF, RICE, MoSCoW) with a one-sentence plain-language description of each — sufficient for a non-engineer to understand the difference without external lookup.

**AC2:** Given the operator provides a list of candidate items (as free text, bullet list, or described in any order), when the skill receives the list, then it acknowledges all items, asks for any missing context it needs (goals, time horizon, decision audience), and does not proceed to framework selection until it has confirmed the candidate list is complete.

**AC3:** Given the skill has received a confirmed candidate list, when it suggests a framework, then the suggestion names the recommended framework, states the primary reason it fits the operator's stated context (e.g. "WSJF — you mentioned cost of delay is the key decision driver"), and explicitly invites the operator to confirm or override — it does not proceed to scoring without an explicit confirm.

**AC4:** Given the operator overrides the suggested framework and names a different one, when the skill receives the override, then it accepts the choice without re-arguing, confirms the selected framework, and proceeds to scoring — it does not re-suggest the original choice.

**AC5:** Given the operator provides no context about goals or audience, when the skill reaches framework selection, then it asks at most two clarifying questions before making a suggestion — it does not loop indefinitely before proceeding.

**AC6:** Given the SKILL.md file is authored for this story, when `node scripts/check-skill-contracts.js` is run, then it passes for the partial file (no contract violation for sections not yet written in later stories).

## Out of Scope

- Automated candidate ingestion from `pipeline-state.json` or any external tool — the operator provides the list (operator-supplied intake is MVP; automated intake is a v2 concern)
- Scoring any items — that begins in pr.2
- Explaining divergence between frameworks — that is pr.3
- Suggesting running multiple frameworks simultaneously — the skill selects one to start with; multi-pass is pr.3's concern

## NFRs

- **Performance:** None — conversational skill, no latency constraint.
- **Security:** None — no credentials, tokens, or external data access.
- **Accessibility:** Not applicable — this is instruction text, not a UI component.
- **Audit:** None — operator-facing skill instruction; no system-level audit requirement.
- **Skill contract:** The SKILL.md partial file must pass `check-skill-contracts.js` after this story is implemented.

## Complexity Rating

**Rating:** 2
**Rationale:** The framework selection logic (suggest + rationale + override) has conversational design ambiguity — the exact wording of the framework descriptions and the conditions that trigger different suggestions require judgment calls that can only be validated through real sessions (ASSUMPTION-03).
**Scope stability:** Stable
