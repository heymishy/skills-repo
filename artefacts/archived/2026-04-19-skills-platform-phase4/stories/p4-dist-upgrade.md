## Story: Upgrade command with diff and confirm flow

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e2-distribution-model.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **consumer (Craig, Thomas, or any adopter)**,
I want to **run `skills-repo upgrade` that fetches the latest upstream content, shows me a diff of what has changed, and waits for my explicit confirmation before re-pinning**,
So that **I can adopt skill updates without being surprised by silent changes to the governance model I operate under, and M1's sync success target (≥90% conflict-free) is achievable because upgrade is a transparent, operator-controlled operation**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync
**How:** M1's second target (≥90% conflict-free sync) is not about resolving merge conflicts in a forked repo — it is about the proportion of upgrade cycles that complete without the consumer needing to manually intervene beyond reading and approving the diff. This story implements the upgrade mechanism that M1 measures. Without it, M1's sync success metric has no implementation.

## Architecture Constraints

- C4: human approval gate — the operator must explicitly confirm the upgrade before any files are modified; an automated upgrade without operator confirmation is a C4 violation; this applies even in non-interactive CI contexts (the command must fail with "Upgrade requires operator confirmation — run with --confirm flag or interactively" if no confirmation is provided)
- C5: after a confirmed upgrade, the sidecar is re-pinned with new content hashes and the lockfile is updated atomically; a partial upgrade (some skills updated, some not) must be prevented — if the upgrade fails mid-way, the sidecar and lockfile must be in their pre-upgrade state
- ADR-004: the upstream source for the upgrade is read from `.github/context.yml` — the operator cannot specify a different upstream source at `upgrade` time via a flag; only the context.yml-configured source is authoritative
- POLICY.md floor: if the upgraded content raises a POLICY.md floor (minimum required version for a governance requirement), the diff presented to the operator must highlight floor changes explicitly — they must not be hidden in a bulk diff

## Dependencies

- **Upstream:** p4.dist-lockfile — the upgrade reads the current lockfile and writes a new one; the lockfile schema must be stable before upgrade can be implemented; p4.dist-upstream — the upstream source configuration must be in place
- **Downstream:** p4.dist-migration references the upgrade path for consumers transitioning from a fork-based install

## Acceptance Criteria

**AC1:** Given a consumer has an older sidecar (lockfile `pinnedRef` is behind the current upstream head), When `skills-repo upgrade` is run interactively, Then the command fetches the upstream content, presents a diff to the operator listing each skill that has changed (added, modified, removed), and waits for explicit confirmation ("y/N" prompt) before modifying any file in the sidecar or the lockfile.

**AC2:** Given the operator confirms the upgrade, When the new sidecar and lockfile are written, Then `skills-repo verify` runs automatically as the final step and passes — the operator receives confirmation that the upgraded sidecar matches the new lockfile; if verify fails (hash mismatch), the upgrade is rolled back to the pre-upgrade state and the operator is notified.

**AC3:** Given the operator aborts the upgrade (responds "N" or sends Ctrl-C), When the command exits, Then the sidecar directory and lockfile are byte-for-byte identical to their state before `upgrade` was run — no partial modification has occurred.

**AC4:** Given the upstream content includes a POLICY.md floor change in the upgraded skills, When the diff is presented to the operator, Then the diff output renders POLICY.md floor changes with a distinct visual marker (e.g. "⚠ POLICY FLOOR CHANGE:") above the changed lines — the operator cannot overlook a floor change in the upgrade diff.

## Out of Scope

- Automatic upgrade without operator confirmation — C4 is non-negotiable; `upgrade` always requires human confirmation
- Multi-step upgrade across many upstream versions (e.g. upgrading from v1.0 to v3.0 skipping v2.0) — Phase 4 MVP supports single-step upgrade to the current upstream head; multi-version upgrade paths are Phase 5
- Upgrading the CLI tool itself — this story upgrades skill sidecar content; CLI binary upgrades are managed via the consumer's package manager

## NFRs

- **Security:** Upgrade diff output must not expose credential values, internal URL tokens, or session identifiers from the upstream source response (MC-SEC-02)
- **Audit:** The new lockfile must record the `previousPinnedRef` alongside the new `pinnedRef` — an audit trail of upgrade history is valuable and must be captured
- **Correctness:** Atomic sidecar update — either the full upgrade completes and verify passes, or the pre-upgrade state is fully restored (C5)
- **Performance:** Upgrade diff presentation must complete within 15 seconds for a typical full skill set

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — POLICY.md floor change detection and rollback behaviour are the most complex aspects; if Spike C defines a different lockfile schema for the `previousPinnedRef` field, this story must be updated

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-upgrade.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 4 |
| intermediates_produced | 10 |
