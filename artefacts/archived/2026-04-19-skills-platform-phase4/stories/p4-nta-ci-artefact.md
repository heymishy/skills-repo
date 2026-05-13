## Story: CI artefact integration for non-git-native governance surfaces

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e4-non-technical-access.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **platform maintainer (heymishy) validating a feature that included bot-produced artefacts**,
I want to **have the CI pipeline treat bot-committed artefacts identically to git-native-committed artefacts — same validation checks, same trace validation, same governance gate coverage**,
So that **a feature that mixed bot-produced and git-native artefacts is auditable, the CI green signal means the same thing regardless of which surface produced the artefacts, and no special CI bypass is required for bot sessions**.

## Benefit Linkage

**Metric moved:** M2 — Consumer confidence; M3 — Teams bot C7 fidelity
**How:** The CI pipeline is the objective evidence layer. If CI validates bot-produced artefacts identically to git-native artefacts, a second-line reviewer or audit has a single, uniform CI record for the feature — no "but these were bot artefacts, so CI ran differently" caveat. This is the closing step of the E4 epic: the bot produces artefacts (p4.nta-artefact-parity), standards are injected (p4.nta-standards-inject), approvals are routed (p4.nta-gate-translation), and this story ensures the CI layer validates and accepts the result without special-casing.

## Architecture Constraints

- MC-CORRECT-02: no new CI check is introduced that only runs on bot-produced artefacts — the existing governance check suite (`npm test`) and trace validation (`scripts/validate-trace.sh --ci`) must handle bot artefacts without modification; if a modification is required (e.g. adding a `standards_injected` field to the trace schema), the modification applies to all artefacts, not only bot artefacts
- C1: the CI pipeline runs on the origin repository, not a fork; bot-committed artefacts are committed to a branch on the origin (C1 constraint enforced by p4.nta-artefact-parity AC3); this story ensures the CI trigger for that branch behaves identically to any other PR branch
- ADR-004: if the CI pipeline reads any bot-session configuration (e.g. to validate `standards_injected` metadata), it reads from `context.yml` — no hardcoded CI scripts reference bot-specific paths

## Dependencies

- **Upstream:** p4.nta-artefact-parity must be complete (bot artefacts are committed in the correct format and at the correct path); p4.nta-gate-translation must be complete (approval events written to `pipeline-state.json`)

## Acceptance Criteria

**AC1:** Given a bot-produced discovery.md is committed to a feature branch via the Teams bot (p4.nta-artefact-parity), When the CI pipeline runs on the PR for that branch, Then `npm test` passes for the bot-produced artefact — the same governance check suite that validates git-native artefacts validates the bot artefact without modification to the check scripts.

**AC2:** Given a bot session includes a trace artefact (from the bot's C7-enforced conversation state — question emitted, answer recorded), When `scripts/validate-trace.sh --ci` runs on the PR, Then the trace validation passes — the bot's conversation trace conforms to the trace schema without requiring a new parallel trace format.

**AC3:** Given a bot session produced an artefact with `standards_injected: false` (sidecar unavailable), When CI runs on the PR, Then CI emits a warning (not a failure) identifying the artefact path and the `standards_injected: false` flag — the PR can still be reviewed, but the reviewer is informed that standards injection was unavailable.

**AC4:** Given a CI run completes on a PR that includes bot-produced artefacts, When the CI summary is read, Then it does not include any surface-specific annotation (e.g. "bot artefacts validated separately") — the CI summary reflects the governance check outcome uniformly across all artefacts in the PR.

## Out of Scope

- Modifying the CI pipeline to add new bot-specific validation steps — this story ensures existing CI steps cover bot artefacts, it does not add new ones
- CI integration for Spike D's prototype — the prototype (p4.spike-d) produces a PROCEED/REDESIGN/DEFER verdict; this story covers production artefacts from completed E4 stories, not spike prototype outputs

## NFRs

- **Correctness:** CI check suite covers bot artefacts without special-casing; `npm test` green means the same thing for bot and git-native artefacts
- **Security:** No credentials or session tokens in CI logs (MC-SEC-02)
- **Audit:** CI summary for a bot-artefact PR is indistinguishable from a git-native-artefact PR summary (except for the optional `standards_injected` warning)

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-ci-artefact.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 5 |
| intermediates_produced | 24 |
