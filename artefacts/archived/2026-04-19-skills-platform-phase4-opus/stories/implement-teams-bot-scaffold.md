## Story: Implement Teams bot scaffold with C7 conversation flow

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e3-non-technical-participation.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **PM/PO or business lead who does not use VS Code or GitHub**,
I want to **interact with a Teams bot that presents pipeline questions in a structured, one-at-a-time conversation flow**,
So that **I can participate in governance decisions (approvals, scope reviews) without learning developer tools (M3)**.

## Benefit Linkage

**Metric moved:** M3 (Teams bot C7 fidelity — 0 violations in test session)
**How:** The bot scaffold is the foundation for all Teams-based interactions. If the scaffold does not enforce C7 at the conversation-flow level, every feature built on top of it will inherit the violation. A scaffold that guarantees one-question-per-message by design prevents M3 regression.

## Architecture Constraints

- **C7 (one question at a time):** The scaffold must enforce C7 at the framework level — not per-feature. Each handler added to the scaffold should be unable to send multiple questions in a single turn.
- **C11 (no persistent hosted runtime):** If the scaffold uses Azure Bot Service, document the C11 ADR requirement. Per decisions.md, this is acceptable during development but requires an ADR before consumer shipment.
- **ADR-004 (context.yml):** Bot configuration (Teams app ID, tenant settings) should reference `context.yml` as the configuration source — not hardcoded values.

## Dependencies

- **Upstream:** Spike D must have a PROCEED verdict — if C7 fidelity is not achievable in Teams, this story is blocked
- **Downstream:** implement-teams-dor-approval, implement-teams-pipeline-health, implement-teams-governance-output all build on this scaffold

## Acceptance Criteria

**AC1:** Given Spike D has a PROCEED verdict, When the Teams bot scaffold is built, Then it includes: (a) a conversation state machine that tracks the current question, (b) a message handler that refuses to send a new question until the current question has a response, and (c) a registration mechanism for adding new question flows.

**AC2:** Given the scaffold's C7 enforcement, When a developer adds a new question flow (e.g. a three-question approval sequence), Then the scaffold automatically sends question 1, waits for the response, sends question 2, waits, sends question 3, waits — without the developer needing to implement the sequencing logic.

**AC3:** Given the scaffold is deployed to Teams, When a user starts a conversation, Then the bot identifies itself, states its purpose, and begins the first registered question flow — all in compliance with C7 (one question per message turn).

## Out of Scope

- Specific pipeline features (DoR approval, health summary, governance output) — those are separate stories
- Multi-tenant deployment — the scaffold runs for a single tenant/team during Phase 4
- Authentication/authorisation for bot actions — the scaffold handles conversation flow only; action authorisation is per-feature
- Slack, Discord, or other platform adapters

## NFRs

- **Security:** Bot must not log or store conversation content beyond what Teams retains natively; no credentials in code (MC-SEC-02)
- **Performance:** Bot should respond within 3 seconds per message
- **Accessibility:** Bot messages must work with Teams' built-in accessibility features

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — conditioned on Spike D PROCEED

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
| model_label | claude-opus-4-6 |
| cost_tier | high |
| skill_name | definition |
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-teams-bot-scaffold.md |
| run_timestamp | 2026-04-19T18:54:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 3 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 3 ACs: state machine with C7 enforcement, developer registration, deployed interaction |
| Scope adherence | 5 | Scaffold only — no specific pipeline features |
| Context utilisation | 5 | C7 enforcement at framework level; C11 documented; ADR-004 referenced |

### Backward references

- target: artefacts/2026-04-19-skills-platform-phase4/discovery.md
  accurate: yes

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
