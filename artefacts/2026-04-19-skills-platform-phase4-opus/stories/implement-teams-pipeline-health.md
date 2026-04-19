## Story: Implement pipeline health summary in Teams

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e3-non-technical-participation.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **business lead or PM/PO who does not use developer tools**,
I want to **ask the Teams bot "what's the status of feature X?" and receive a plain-language pipeline health summary**,
So that **I can monitor delivery progress without asking an engineer to interpret pipeline state for me (M2, M3)**.

## Benefit Linkage

**Metric moved:** M2 (Consumer confidence) and M3 (Teams bot C7 fidelity)
**How:** Pipeline health visibility for non-engineers directly supports M2 (the "problem feels solved" indicator — governance information is accessible, not locked in developer tools) and M3 (the Teams bot maintains C7 fidelity during an information-retrieval interaction, not just an approval interaction).

## Architecture Constraints

- **C7 (one question at a time):** If the health summary requires clarification (which feature? which time range?), the bot must ask these as sequential single questions
- **ADR-004 (context.yml):** The bot reads pipeline state from `pipeline-state.json`; feature mapping is driven by artefact paths, not hardcoded feature lists

## Dependencies

- **Upstream:** implement-teams-bot-scaffold — the health summary is a conversation flow registered with the scaffold
- **Downstream:** validate-teams-e2e-session includes health summary in its test scenarios

## Acceptance Criteria

**AC1:** Given a user asks the Teams bot for the status of a feature (by name or slug), When the bot processes the request, Then it reads `pipeline-state.json` and returns a plain-language summary containing: (a) the current pipeline phase, (b) the count of stories in each state (not started, in progress, complete), and (c) any blocking items.

**AC2:** Given the feature name is ambiguous (matches multiple features), When the bot detects the ambiguity, Then it asks the user to choose — presenting one option per message in compliance with C7.

**AC3:** Given the user asks for overall pipeline health (not a specific feature), When the bot processes the request, Then it returns a summary of all active features with their phase and story completion percentage — in a single message that is readable without scrolling (≤10 lines of text).

## Out of Scope

- Drill-down into specific story details — the health summary is a roll-up; per-story detail is accessed via the full pipeline dashboard
- Historical trend analysis (velocity, burndown) — Phase 5
- Push notifications for pipeline state changes — this story is pull-based (user asks, bot responds)

## NFRs

- **Security:** Bot must not expose story details to users not in the configured approver/viewer list (MC-SEC-01)
- **Performance:** Health summary should be returned within 5 seconds of the user's question
- **Accessibility:** Summary text must work with Teams' built-in accessibility features

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — conditioned on teams-bot-scaffold complete

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-teams-pipeline-health.md |
| run_timestamp | 2026-04-19T18:54:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 2 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 3 ACs: specific feature summary, ambiguity handling with C7, overall summary |
| Scope adherence | 5 | Health summary only — no drill-down, no trends, no push notifications |
| Context utilisation | 4 | C7, ADR-004 used; pipeline-state.json as data source |

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
