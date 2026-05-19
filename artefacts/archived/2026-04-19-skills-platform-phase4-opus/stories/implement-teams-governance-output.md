## Story: Implement readable governance output in Teams

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e3-non-technical-participation.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **business lead or auditor who does not read JSON or YAML**,
I want to **receive governance decisions, gate verdicts, and trace summaries in Teams as plain-language narratives**,
So that **I can understand what the pipeline decided and why without needing a developer to translate the output for me (M3)**.

## Benefit Linkage

**Metric moved:** M3 (Teams bot C7 fidelity — 0 violations in test session)
**How:** Readable governance output is the second half of the non-technical participation promise. If the bot can accept input (DoR approval) but only output machine-readable JSON, non-technical participants are still excluded from understanding governance outcomes. Plain-language output in Teams completes the M3 loop.

## Architecture Constraints

- **C7 (one question at a time):** If governance output is lengthy (e.g. a trace summary with multiple findings), the bot must paginate — presenting one finding per message rather than dumping all findings in a single message
- **ADR-004 (context.yml):** Output format preferences (verbosity level, included sections) should be configurable via `context.yml`

## Dependencies

- **Upstream:** implement-teams-bot-scaffold — the governance output flow is registered with the scaffold; Epic 4 stories (implement-trace-plain-language, implement-gate-verdict-narrative) provide the plain-language rendering logic that this story surfaces in Teams
- **Downstream:** validate-teams-e2e-session includes governance output in its test scenarios

## Acceptance Criteria

**AC1:** Given a governance decision has been recorded (e.g. a DoR verdict, a review finding, a gate pass/fail), When the user asks the Teams bot for the latest governance output for a story, Then the bot returns a plain-language narrative (not JSON, not YAML) that states: what was decided, why, and what happens next.

**AC2:** Given the governance output contains multiple findings (e.g. a review with 3 findings), When the bot presents the findings, Then each finding is sent as a separate message — one finding per message — in compliance with C7. The bot waits for a "next" acknowledgement before sending the subsequent finding.

**AC3:** Given the user asks for governance output on a story that has not yet reached a governance decision point, When the bot processes the request, Then it returns a clear message stating the story's current phase and that no governance output is available yet.

## Out of Scope

- Generating the plain-language rendering logic — that is Epic 4; this story surfaces Epic 4's output in Teams
- Interactive editing of governance decisions via Teams — Teams is a read/approve channel, not an editing channel
- PDF or document export from Teams — the bot sends text messages, not document attachments

## NFRs

- **Security:** Governance output must not expose internal implementation details or credentials (MC-SEC-02)
- **Performance:** Each message should be sent within 3 seconds
- **Accessibility:** Messages must work with Teams' built-in accessibility features

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — conditioned on teams-bot-scaffold and Epic 4 rendering logic

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-teams-governance-output.md |
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
| AC coverage | 5 | 3 ACs: plain-language narrative, paginated multi-finding with C7, no-output-yet handling |
| Scope adherence | 5 | Surfacing in Teams only — no rendering logic creation, no export |
| Context utilisation | 5 | C7 pagination requirement derived from discovery; Epic 4 dependency acknowledged |

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
