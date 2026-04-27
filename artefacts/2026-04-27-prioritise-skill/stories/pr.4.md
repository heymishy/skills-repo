# Story: Guide mixed groups through a workshopping session with facilitation prompts that build shared ownership of the result

**Epic reference:** artefacts/2026-04-27-prioritise-skill/epics/pr-e1.md
**Discovery reference:** artefacts/2026-04-27-prioritise-skill/discovery.md
**Benefit-metric reference:** artefacts/2026-04-27-prioritise-skill/benefit-metric.md

## User Story

As a **workshop facilitator running a mixed group of product managers, tech leads, and business leads**,
I want to **run the skill in workshopping mode, where it provides turn-by-turn facilitation prompts that help the group reason through scoring together**,
So that **the ranked output feels owned by the group rather than imposed by a tool, and disagreements surface as explicit, recorded positions rather than silent overrides**.

## Benefit Linkage

**Metric moved:** M3 — Non-engineer unassisted completion; M1 — Session completion rate
**How:** Workshopping mode with facilitation prompts is the primary mechanism for S4 (group ownership) and the primary use case for non-engineer entry (M3). When a PM or business lead is running the skill alongside engineers, the facilitation prompts reduce the risk of the engineer dominating the scoring — the prompts address each role explicitly. Group sessions are also higher-completion sessions (M1) because multiple participants provide mutual accountability.

## Architecture Constraints

- C6 (from discovery): SKILL.md additions must pass `scripts/check-skill-contracts.js`.
- This story extends the SKILL.md from pr.1/pr.2/pr.3; no new files.

## Dependencies

- **Upstream:** pr.1 must be complete (candidate intake and framework selection must exist before workshopping mode can be offered). pr.2 is implicitly upstream — workshopping mode operates during the scoring phase defined by pr.2.
- **Downstream:** None — pr.5 (output format) is independent; it handles the save regardless of whether workshopping mode was used.

## Acceptance Criteria

**AC1:** Given the skill has received a confirmed candidate list, when it asks about session format, then it offers two modes: (1) solo scoring and (2) workshopping/group session — and does not default to solo without asking.

**AC2:** Given workshopping mode is selected, when the skill begins a scoring dimension, then it provides a facilitation prompt that names the typical perspectives of at least two roles (e.g. "Tech lead: consider implementation risk and dependency chain. PM: consider user adoption urgency and business deadline.") — the prompt contains wording addressed to at least two named roles and poses an open question ('What's driving your score for this?') rather than an imperative directive.

**AC3:** Given workshopping mode is active and the group provides conflicting scores for an item, when the skill detects a range (e.g. two participants give different values), then it surfaces the range explicitly (e.g. "I heard 3 and 7 for this dimension — what's driving the gap?") and invites a brief discussion before the facilitator confirms a final value — it does not silently average or pick the first value.

**AC4:** Given a conflict has been surfaced in workshopping mode, when the group resolves it, then the skill records both the final agreed value and a brief note about the disagreement (e.g. "Range 3–7; agreed 5 — tech concern about integration effort outweighed by PM deadline pressure") for inclusion in the artefact rationale.

**AC5:** Given workshopping mode is active, when the skill completes a dimension for all items, then it pauses and asks if the group is ready to proceed to the next dimension — it does not advance automatically as in solo mode.

**AC6:** Given the operator switches back to solo mode mid-session (after starting in workshopping mode), when the skill receives the mode switch request, then it accepts the switch, continues scoring in solo mode, and does not re-prompt for workshopping mode for the remainder of the session.

**AC7:** Given workshopping mode is active and scoring is complete, when the skill presents the final ranked list, then its closing statement attributes the result to the group's decisions — beginning with 'Based on your group's agreed scores...' or equivalent group-attribution phrasing — and does not begin with 'I recommend' or frame the ranking as the skill's own recommendation.

## Out of Scope

- Real-time multi-user concurrent input (e.g. multiple chat participants simultaneously) — one facilitator runs the session and narrates group input; concurrent multi-user sessions are a v2 concern
- Recording individual participant names or votes — the skill records group-agreed values and noted disagreements, not individual scorecards
- Generating a facilitator debrief report separate from the ranked output — the workshopping notes are embedded in the standard artefact produced by pr.5

## NFRs

- **Performance:** None — conversational skill.
- **Security:** None — no credentials or personal data recorded.
- **Accessibility:** Not applicable — instruction text.
- **Audit:** None.
- **Skill contract:** SKILL.md additions must pass `node .github/scripts/check-skill-contracts.js`.

## Complexity Rating

**Rating:** 2
**Rationale:** Facilitation prompt design is a judgment call with no objective test — only real group sessions will validate whether the prompts genuinely invite multiple voices or inadvertently direct the conversation (ASSUMPTION-03 applies in group context). Known ambiguity; accepted.
**Scope stability:** Stable
