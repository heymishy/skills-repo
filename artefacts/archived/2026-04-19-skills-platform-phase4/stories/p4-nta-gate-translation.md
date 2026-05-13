## Story: Non-technical approval channel routing and gate translation

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e4-non-technical-access.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **non-technical outer-loop participant acting as an approver (e.g. DoR sign-off, definition approval)**,
I want to **have my Teams bot approval action (a button press or `/approve-dor` reply in Teams) routed to the same approval-channel adapter that git-native approvers use**,
So that **my approval has exactly the same downstream effect as a GitHub-issue or direct-commit approval — `pipeline-state.json` is updated identically, and no separate approval pathway exists for bot approvals**.

## Benefit Linkage

**Metric moved:** M3 — Teams bot C7 fidelity; M2 — Consumer confidence
**How:** If Teams bot approvals produce different downstream effects than git-native approvals (e.g. a flag indicating "this was a bot approval"), regulated consumers cannot use bot-based approval in their governance records without annotation. Gate translation ensures that the approval event produced by the bot is semantically identical to the event produced by a git-native approver — the governance record shows "approval received," not "Teams bot approval received," unless the consumer explicitly opts into the channel-source metadata.

## Architecture Constraints

- ADR-006 (approval-channel adapter, from persona-routing skill): the Teams channel is a new approval channel implementation, not a standalone approval mechanism; it must implement the approval-channel adapter interface so that the existing `process-dor-approval.js` script can process it without modification to the script
- C4: all DoR sign-off events, regardless of channel, require the designated approver to take an explicit action — a bot-mediated approval is only valid when the approver explicitly presses the approval button or sends the `/approve-dor` command; the bot must not auto-approve based on inferred consent
- MC-CORRECT-02: the approval event written to `pipeline-state.json` by `process-dor-approval.js` must conform to the existing pipeline-state.json schema; no new fields added to the approval event object without a corresponding schema update
- ADR-004: the Teams channel configuration (tenant, channel ID, approver mapping) is read from `.github/context.yml` under `approval_channels.teams`

## Dependencies

- **Upstream:** p4.nta-surface must be complete (bot runtime exists); the approval routing is delivered via the bot runtime's action handler
- **Downstream:** p4.nta-ci-artefact — CI artefact integration depends on approvals being correctly routed and recorded in `pipeline-state.json`

## Acceptance Criteria

**AC1:** Given a non-technical approver is presented with a DoR sign-off request in Teams, When the approver presses the "Approve" adaptive card button, Then the bot's action handler calls `process-dor-approval.js` with the same arguments and payload structure as a GitHub-issue-channel approval — the script does not need to know the approval came from Teams.

**AC2:** Given `process-dor-approval.js` runs with the Teams-channel approval payload, When the script completes, Then `pipeline-state.json` is updated with `dorStatus: "signed-off"` for the relevant story — identical to the result produced by a GitHub-issue-channel approval.

**AC3:** Given C4 applies and the bot is presenting a DoR approval request, When the approver does not take an action (closes the card without responding), Then the DoR status remains unchanged — no implicit approval, no timeout-based auto-approval.

**AC4:** Given the Teams channel configuration is incomplete or misconfigured in `context.yml`, When the bot attempts to route an approval event, Then the bot returns a user-visible error ("Approval routing configuration is missing — please contact the platform maintainer") rather than silently failing or routing to a fallback channel.

## Out of Scope

- Implementing the approval-channel adapter interface itself — that is defined in the persona-routing skill and ADR-006; this story implements the Teams channel as a new adapter instance
- Dual-authority approval routing (Theme F) — this story delivers single-authority Teams approval channel only; dual-authority is a Theme F deliverable
- Non-approval bot interactions (discovery sessions, standards injection) — those are in other E4 stories

## NFRs

- **Security:** No credentials in approval event payloads (MC-SEC-02); approver identity is validated against the `approval_channels.teams.approvers` list in `context.yml` before processing
- **Correctness:** Approval event schema matches existing pipeline-state.json approval schema (MC-CORRECT-02); validated by `npm test`
- **Audit:** Each approval event includes `channel: "teams"` and `approvedAt` timestamp — not to differentiate the approval, but to support audit trail completeness

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — depends on Spike D PROCEED verdict; deferred if DEFER

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-gate-translation.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 5 |
| intermediates_produced | 21 |
