## Story: Validate whether the Teams interaction model can satisfy C7 one-question-at-a-time fidelity (Spike D)

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e1-spike-programme.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy)**,
I want to **prototype the Teams bot interaction model for at least one outer-loop step and verify it can deliver C7-compliant (one question at a time) exchanges without requiring a persistent hosted runtime**,
So that **M3 (Teams bot C7 fidelity) has a validated architecture path and the E4 implementation stories are either gated to proceed or deferred to Phase 5 based on evidence rather than assumption**.

## Benefit Linkage

**Metric moved:** M3 — Teams bot C7 fidelity
**How:** M3's target (0 C7 violations across a complete outer-loop step in Teams) cannot be grounded until Spike D demonstrates whether the Teams surface can structurally enforce single-turn mediation. A PROCEED verdict unlocks E4 stories and means M3 is achievable in Phase 4. A DEFER/REJECT verdict means M3 moves to Phase 5 with Spike D's findings as the design input, preventing Phase 4 from committing engineering time to a surface that cannot satisfy C7.

## Architecture Constraints

- C11: no persistent hosted runtime — the Teams bot must operate without a long-running server process that sits outside Microsoft 365 / Power Platform event-driven triggers; the spike must explicitly test whether C11 is satisfied and record the finding; if a persistent process is required, C11 is violated and the spike must produce a REDESIGN or DEFER verdict
- C7: one question at a time — the spike's primary test criterion is whether the Teams surface can structurally enforce single-turn mediation; the bot must not be able to present multiple questions simultaneously, and the operator must not be able to advance state without answering the presented question
- ADR-004: any Teams bot configuration (tenant ID, channel, approval routing) must be sourced from `.github/context.yml` — the spike output must identify which context.yml fields are needed
- C4: human approval gates routing through Teams must use the existing approval-channel adapter pattern (ADR-006), not a parallel approval mechanism
- MC-SEC-02: the spike prototype must not commit Microsoft 365 tenant IDs, OAuth tokens, bot framework secrets, or any credentials to the repository

## Dependencies

- **Upstream:** p4.spike-a provides the interaction pattern context (governance package interface) but Spike D can run independently of Spikes B1 and B2 — the C7 question is surface-level and does not depend on the enforcement mechanism selected for other surfaces
- **Downstream:** p4.nta-surface, p4.nta-gate-translation, p4.nta-artefact-parity, p4.nta-standards-inject, p4.nta-ci-artefact in E4 all depend on a PROCEED verdict from this spike; a DEFER or REJECT verdict defers all E4 stories to Phase 5

## Acceptance Criteria

**AC1:** Given heymishy runs the Spike D prototype with the Teams bot executing at least one outer-loop step (e.g. a simulated `/discovery` interaction), When the spike output artefact is written to `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-d-output.md`, Then the artefact contains a structured turn-by-turn test log recording: each question presented (single or multiple), whether the operator could answer, and whether the bot correctly advanced state — minimum 3 consecutive turns logged.

**AC2:** Given the spike tests C11 compliance (no persistent hosted runtime), When heymishy records the infrastructure finding, Then the artefact explicitly states whether the Teams bot prototype ran without a persistent hosted server process — if a persistent process was required, the artefact states the specific requirement (e.g. bot framework registration, Azure Bot Service endpoint), the estimated hosting cost, and whether this constitutes a C11 violation requiring a REDESIGN or DEFER verdict.

**AC3:** Given the spike tests C7 fidelity specifically, When heymishy counts violations, Then the artefact records the total C7 violations observed across the test session — a C7 violation is defined as: (a) the bot presenting more than one question in a single turn, or (b) the operator being able to advance state without answering the presented question; if any violations occur, the artefact records the specific interaction pattern that caused them.

**AC4:** Given the minimum validation signal from the benefit-metric (3 consecutive C7-compliant turns), When heymishy evaluates the minimum signal, Then the artefact states explicitly whether the minimum signal was met (PROCEED) or not met (DEFER) — the minimum signal is pass/fail for E4 scope in Phase 4; failure defers all E4 stories.

**AC5:** Given the spike produces any verdict, When heymishy records the outcome, Then the overall verdict (PROCEED / REDESIGN / DEFER / REJECT) is written to `pipeline-state.json` under the feature's spike record AND an ADR entry is added to `artefacts/2026-04-19-skills-platform-phase4/decisions.md` covering the Teams-surface-in-Phase-4 decision, the C11 compliance finding, and the C7 violation count; if DEFER, the ADR records the Phase 5 handoff instruction.

## Out of Scope

- Implementing the production Teams bot — that is p4.nta-surface in E4; the spike produces a C7 and C11 viability finding, not a shipping bot
- Microsoft 365 Power Automate or Power Apps production deployment — any infrastructure provisioned for the spike is temporary and must not be left running post-spike (C11)
- Evaluating non-Teams non-technical surfaces (Jira, Confluence, Slack) — Phase 4 scopes to Teams only; other surfaces are Phase 5; the spike tests Teams specifically
- Designing the full E4 story set — the spike validates viability; E4 decomposition happens after PROCEED verdict

## NFRs

- **Security:** No Microsoft 365 tenant IDs, bot framework secrets, OAuth tokens, or Azure credentials may be committed to the repository during or after the spike (MC-SEC-02); any temporary credentials used during prototyping must be rotated or revoked after the spike
- **Audit:** C11 compliance status must be explicitly recorded in the spike artefact; verdict written to pipeline-state.json before this story is closed
- **Performance:** None identified for the spike itself — C11 compliance means no ongoing compute costs from the prototype

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — C11 is the most likely source of a DEFER verdict; if Teams requires a persistent bot framework endpoint, the spike scope may need to extend to explore event-driven alternatives (e.g. Logic Apps, Power Automate with no persistent runtime)

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | exp-phase4-sonnet-vs-opus-20260419 |
| model_label | claude-sonnet-4-6 |
| cost_tier | fast |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-spike-d.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 5 |
| intermediates_prescribed | 5 |
| intermediates_produced | 5 |
