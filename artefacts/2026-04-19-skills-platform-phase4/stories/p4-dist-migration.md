## Story: Migration path for existing fork consumers (Craig, Thomas)

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e2-distribution-model.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As an **existing fork consumer (Craig or Thomas)**,
I want to **follow a documented migration path that transitions my repository from a forked skills content layout to the sidecar model without losing my artefact history or generating merge conflicts**,
So that **I can adopt Phase 4's non-fork distribution model without rebuilding my artefact directory from scratch, and M1 measurement can include real adopters, not just greenfield installs**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync; M2 — Consumer confidence
**How:** M1 measurement requires Craig and Thomas to successfully adopt — not just heymishy in a clean test repo. Without a migration path for existing fork consumers, M1 cannot be measured at the ≥1 real adopter level. The migration story is the proof that non-fork distribution works for existing adopters, not just greenfield setups.

## Architecture Constraints

- C1: the result of a completed migration must be a non-fork state — no forked SKILL.md, POLICY.md, or standards file remaining in the consumer repo's source tree; `skills-repo verify` must pass post-migration, confirming the sidecar matches the lockfile
- C4: any migration step that requires the consumer to abandon custom modifications to skills files (content that cannot be preserved in the sidecar model) must require explicit operator confirmation before those files are removed — silent removal of consumer-modified files is not permitted
- MC-CORRECT-02: the migration guide must include a verification step (`skills-repo verify`) as the final step; the guide is not complete without a confirm-and-verify sequence
- Spike C output: the migration path must follow the sidecar directory convention and lockfile schema specified in the Spike C verdict; the guide must reference the Spike C output as its source of truth for those structural decisions

## Dependencies

- **Upstream:** p4.dist-install — the migration guide targets the sidecar model that p4.dist-install implements; without a working `init`, there is no target state to migrate to; p4.dist-upstream — the migration guide must include the context.yml `skills_upstream` configuration step as the first instruction
- **Downstream:** None — this is the end-user adoption story; p4.dist-registry is updated after migration completes

## Acceptance Criteria

**AC1:** Given Craig (or Thomas) follows the migration guide from start to finish on their existing fork-based consumer repository, When they run `skills-repo verify` as the final migration step, Then verify passes — the migrated sidecar contains all pinned skills with correct content hashes and no SKILL.md or POLICY.md file exists outside the sidecar directory.

**AC2:** Given the consumer's existing consumer artefacts (files under `artefacts/`) were in the repo before migration, When the migration completes and `git log` is reviewed, Then all artefact history is intact — migration does not alter, squash, or remove any commit that predates the migration, and artefact files are in the same location post-migration as pre-migration.

**AC3:** Given the consumer has made custom modifications to skills files in their fork (content that diverges from the upstream), When the migration guide is followed, Then the guide includes a pre-migration checklist section explicitly identifying which types of customisation survive migration (e.g. context.yml-configured POLICY.md overrides, if supported) and which must be abandoned — the consumer reaches the "abandon custom content" decision point with full information, not mid-migration.

**AC4:** Given the consumer has abandoned their custom skills content and the migration is complete, When they run `npm test` (or the consumer's CI suite), Then the CI suite passes — the post-migration state is a fully valid consumer repo configuration with no test failures attributable to the migration.

## Out of Scope

- Automated migration tooling — the migration guide is documentation-first for Phase 4 MVP; a migration command (`skills-repo migrate`) is a Phase 5 enhancement if the manual migration proves error-prone
- Migrating non-git-native consumers — the guide is for git-native fork consumers; Teams bot consumers (E4) have a different adoption path
- Preserving forked custom skills content in the sidecar — the sidecar is read-only at rest; custom modifications to skill files are not supported in Phase 4; the guide must say this clearly

## NFRs

- **Security:** Migration guide must not instruct the consumer to commit credentials, OAuth tokens, or Microsoft 365 tenant IDs to their repository as part of the migration (MC-SEC-02)
- **Audit:** Migration is confirmed complete when `skills-repo verify` passes and the consumer records the migration event in their artefacts (e.g. a decisions.md entry noting the migration date and upstream source)
- **Performance:** Not applicable — migration is a one-time human-guided process, not a runtime operation

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — the migration guide structure depends on the Spike C sidecar layout decision; if the sidecar directory convention changes from the expected `.skills-repo/`, the guide must be updated before it enters DoR

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-migration.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 4 |
| intermediates_produced | 12 |
