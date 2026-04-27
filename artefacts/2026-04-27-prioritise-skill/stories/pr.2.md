# Story: Score candidate items conversationally across WSJF, RICE, and MoSCoW with suggested values and rationale elicitation

**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Discovery reference:** artefacts/2026-04-27-prioritise-skill/discovery.md
**Benefit-metric reference:** artefacts/2026-04-27-prioritise-skill/benefit-metric.md

## User Story

As a **tech lead, product manager, or business lead**,
I want to **be walked through scoring my candidate items one dimension at a time, with the skill suggesting a plausible value and reasoning that I can correct**,
So that **I complete a full scored pass without needing prior scoring expertise, and the skill's suggestions give me a reference point rather than a blank field to fill**.

## Benefit Linkage

**Metric moved:** M1 — Session completion rate; M2 — Input quality / rationale completeness
**How:** The conversational one-dimension-at-a-time format with suggested values reduces abandonment by removing the "blank scoring sheet" friction that causes users to stop — directly moving M1. The rationale elicitation prompts (the skill asks "what's driving that score?") ensure the output artefact contains reasoning, not just numbers — directly moving M2. Without this story, neither metric is measurable.

## Architecture Constraints

- C6 (from discovery): The SKILL.md additions in this story must not break `scripts/check-skill-contracts.js`.
- Skill/template file constraint: Markdown only — no embedded HTML except comments.
- This story extends the SKILL.md created in pr.1; it does not create any additional files.

## Dependencies

- **Upstream:** pr.1 must be complete — this story's scoring phase begins only after a confirmed candidate list and selected framework exist.
- **Downstream:** pr.3 (multi-pass / divergence) uses the scoring output produced by this story as its input.

## Acceptance Criteria

**AC1:** Given a confirmed framework selection and candidate list, when the skill begins a WSJF scoring pass, then it scores one item at a time, presenting each WSJF dimension (Cost of Delay components: User/Business Value, Time Criticality, Risk Reduction/Opportunity Enablement; and Job Size) individually, suggesting a plausible value with a one-sentence reasoning, and inviting the operator to confirm or override — it does not present all dimensions at once.

**AC2:** Given a confirmed framework selection and candidate list, when the skill begins a RICE scoring pass, then it presents each RICE dimension (Reach, Impact, Confidence, Effort) individually with a suggested value and reasoning, and invites correction — same pattern as AC1.

**AC3:** Given a confirmed framework selection and candidate list, when the skill begins a MoSCoW scoring pass, then it assigns each item to a MoSCoW bucket (Must-have, Should-have, Could-have, Won't-have) with a one-sentence rationale, and invites the operator to confirm or move the item — it does not present all items simultaneously.

**AC4:** Given the operator overrides a suggested score for any dimension, when the skill receives the override, then it accepts the corrected value without re-arguing, uses it in all subsequent calculations, and notes the correction without flagging it as unusual.

**AC5:** Given the skill has scored all items on all dimensions for the selected framework, when it presents intermediate results, then it asks at least one rationale question per item (e.g. "What's driving the high Cost of Delay score for [item]?") before proceeding to output — it does not skip rationale elicitation even if the operator is moving quickly.

**AC6:** Given the operator does not provide a rationale when prompted, when the skill receives a non-answer or a skip, then it records a placeholder rationale marker (e.g. "[rationale not provided]") in the scoring record and proceeds — it does not block progress but makes the gap visible in the output.

**AC7:** Given the scoring pass is complete and rationale has been elicited (or a placeholder recorded), when the skill presents the scored list, then it displays items in descending score order with each item's score, the operator's rationale (or placeholder), and offers to proceed to output or run another framework pass.

## Out of Scope

- Automatically triggering a second framework pass — the decision to run a second pass is handled by pr.3
- Explaining why two frameworks produce different rankings — that is pr.3's divergence explanation
- Generating the final saved artefact — that is pr.5
- Workshopping/group facilitation prompts — that is pr.4

## NFRs

- **Performance:** None — conversational skill, no latency constraint.
- **Security:** None — no credentials, tokens, or external data access.
- **Accessibility:** Not applicable — instruction text, not a UI component.
- **Audit:** None — operator-facing skill instruction.
- **Skill contract:** SKILL.md additions must pass `node .github/scripts/check-skill-contracts.js`.

## Complexity Rating

**Rating:** 2
**Rationale:** The dimension-by-dimension suggestion logic requires careful judgment on the suggested-value heuristics for each framework. WSJF in particular has multi-component Cost of Delay that can confuse first-time users — the skill's explanations must be calibrated against ASSUMPTION-03 (conversational scoring UX acceptability for non-engineers). Known unknown; manageable.
**Scope stability:** Stable
