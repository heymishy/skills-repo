## Story: Teams bot runtime — C11 compliant serverless implementation

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e4-non-technical-access.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **non-technical outer-loop participant (product manager, BA, or risk reviewer)**,
I want to **interact with the platform's outer loop (discovery, review, DoR participation) via a Microsoft Teams bot that asks me exactly one question at a time and never asks a follow-up before my previous answer is recorded**,
So that **I can participate in governed delivery cycles without needing git access, a terminal, or knowledge of the platform's file structure**.

## Benefit Linkage

**Metric moved:** M3 — Teams bot C7 fidelity
**How:** This story implements the bot runtime — the foundation that all other E4 stories build on. Without the runtime, C7 structural enforcement (one question at a time) cannot be implemented, artefacts cannot be produced, and non-technical participation cannot be demonstrated. M3's primary measurement (3-turn minimum pass: bot asks a question, operator answers, bot asks only the next question) is verified against this story's runtime.

## Architecture Constraints

- C11: no persistent hosted runtime — the Teams bot must be implemented as a stateless webhook or Azure Function (per-invocation compute); it must not require an always-on bot server process; Spike D's output artefact specifies the compliant runtime architecture and this story implements exactly that architecture
- C7: structural one-question-at-a-time enforcement — the bot's conversation handler must be implemented so that after sending a question, it cannot send another question until it has received and recorded an answer; this is a hard state machine constraint in the bot runtime, not a prompt instruction to an underlying LLM
- ADR-004: any Teams bot configuration (tenant ID, channel routing, workflow step pointers) is read from `.github/context.yml`; the bot does not have its own configuration file
- Spike D output: the runtime architecture, C11 compliance finding, and C7 violation count from the prototype are the implementation inputs for this story; the story implements the Spike D PROCEED architecture, it does not re-prototype

## Dependencies

- **Upstream:** p4.spike-d must have a PROCEED verdict and output artefact; the PROCEED artefact specifies the compliant runtime architecture that this story implements; if Spike D returns DEFER, this story is deferred to Phase 5

## Acceptance Criteria

**AC1:** Given the Teams bot is deployed and a non-technical participant opens a session, When the bot sends the first question in a workflow step, Then the bot state machine transitions to AWAITING_RESPONSE — it does not send a second message until it receives a response from the participant; this is enforced at the state machine level, not via prompt instruction.

**AC2:** Given the bot has sent a question and is in AWAITING_RESPONSE state, When the participant sends a response, Then the bot records the response (associating it with the active step and question ID), transitions to PROCESSING, produces any required output (artefact contribution or session state update), and transitions to READY_FOR_NEXT_QUESTION before sending the next question.

**AC3:** Given the C11 constraint, When the bot's runtime architecture is reviewed in CI, Then a test confirms the bot handler is stateless and event-driven — the handler function has no in-memory session state that persists between invocations; session state is persisted to an external store (e.g. a key-value store or file) and loaded per invocation.

**AC4:** Given the bot is deployed without an Azure account or Microsoft Graph token, When the CI configuration check runs, Then the check confirms that no credentials are hardcoded in the bot implementation (MC-SEC-02) and that all configuration references are sourced from `.github/context.yml` (ADR-004).

## Out of Scope

- Artefact format or git commit logic — that is p4.nta-artefact-parity; this story implements the runtime and state machine only
- Standards injection — that is p4.nta-standards-inject
- Approval channel routing — that is p4.nta-gate-translation
- CI artefact integration — that is p4.nta-ci-artefact
- Mobile or non-Teams bot clients

## NFRs

- **Security:** No credentials in runtime code or configuration (MC-SEC-02); no user input stored to external services beyond the designated session state store
- **Availability:** Bot handler must respond within 5 seconds — Teams's timeout for adaptive card responses
- **Correctness:** C7 state machine has unit tests covering: initial state, AWAITING_RESPONSE lock, answer-received unlock, and invalid multi-question attempt rejection

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable — depends on Spike D PROCEED verdict; if DEFER, story is deferred

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-surface.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 5 |
| intermediates_produced | 20 |
