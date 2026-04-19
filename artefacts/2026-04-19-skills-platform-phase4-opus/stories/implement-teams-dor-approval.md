## Story: Implement DoR approval routing through Teams

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e3-non-technical-participation.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **PM/PO who reviews and approves stories before coding begins**,
I want to **receive a DoR approval request in Teams, review the story summary, and approve or reject it — all within the Teams conversation**,
So that **I can fulfil my governance role (C4 human approval gate) without needing access to GitHub or VS Code (M3)**.

## Benefit Linkage

**Metric moved:** M3 (Teams bot C7 fidelity — 0 violations in test session)
**How:** DoR approval is the highest-value governance interaction for non-technical participants. If this flow works in Teams with C7 fidelity, it demonstrates that the platform can genuinely include non-engineers in the governance loop — the core promise of M3.

## Architecture Constraints

- **C4 (human approval gate):** This story is the implementation of C4 for non-technical participants. The approval must be a genuine gate — the pipeline must not proceed until the approver responds.
- **C7 (one question at a time):** The approval flow must present the story summary first, then ask a single approval question, then wait. No multi-step forms in a single message.
- **ADR-004 (context.yml):** The approver routing configuration (who gets notified for which story) must be driven by `context.yml`, not hardcoded.

## Dependencies

- **Upstream:** implement-teams-bot-scaffold — the approval flow is built on the scaffold's C7-enforced conversation state machine
- **Downstream:** validate-teams-e2e-session includes DoR approval in its test scenarios

## Acceptance Criteria

**AC1:** Given a story has reached DoR status in the pipeline, When the approval routing is triggered, Then the configured approver receives a Teams message containing: (a) the story title, (b) a plain-language summary of the story scope, and (c) a clear prompt asking for approval or rejection — all in a single message that complies with C7.

**AC2:** Given the approver has read the summary message, When the bot sends the approval question, Then it presents exactly two options: Approve and Reject (with an optional "Ask a question" third option that routes to a clarification flow).

**AC3:** Given the approver selects Approve, When the approval is recorded, Then the pipeline state is updated (the story's DoR status moves to signed-off) and the approver receives a confirmation message.

**AC4:** Given the approver selects Reject, When the rejection is recorded, Then the pipeline state is updated (the story's DoR status moves to rejected with the reason), and the tech lead is notified via the configured channel.

## Out of Scope

- Implementing the full DoR check (hard blocks H1-H9) — that is the /definition-of-ready skill; this story only routes the approval/rejection
- Multi-approver workflows (e.g. two PMs must both approve) — single approver per story in Phase 4
- Rich card rendering of the full story artefact — the bot sends a text summary, not an embedded document

## NFRs

- **Security:** Approval actions must be authenticated — the bot must verify the responder is the configured approver (MC-SEC-01). No credentials in messages.
- **Performance:** Approval should be reflected in pipeline state within 30 seconds of the approver's response
- **Accessibility:** Approval/rejection options must be accessible via keyboard in Teams

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-teams-dor-approval.md |
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
| AC coverage | 5 | 4 ACs: notification content, approval options, approve path, reject path |
| Scope adherence | 5 | Approval routing only — no DoR checks, no multi-approver |
| Context utilisation | 5 | C4, C7, ADR-004 all incorporated; persona is PM/PO, not engineer |

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
