## Story: Implement sync command with update-channel preservation

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e2-distribution-zero-commit-install.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead maintaining a consumer repo (Craig's context)**,
I want to **run a sync command that pulls upstream governance package updates into my repo without severing my ability to receive future updates**,
So that **my team always has the latest governance rules and the update channel is never a one-shot operation that requires manual re-wiring (M1, C1)**.

## Benefit Linkage

**Metric moved:** M1 (Distribution sync — zero-commit install and sync success rate)
**How:** Sync is the ongoing M1 interaction after initial install. The ≥90% sync success rate target depends on the sync command working reliably and preserving the update channel. If sync breaks the channel (requiring reinstall) or fails on consumer-side customisations, the success rate drops.

## Architecture Constraints

- **C1 (update channel never severed):** This is the primary constraint for this story. Sync must preserve the upstream reference after every run — a consumer who syncs once can sync again without reconfiguration.
- **C5 (hash-verified skill files):** After sync, the lockfile must be updated with new per-file hashes for all changed files
- **ADR-012 (platform-agnostic):** Sync command must work on macOS, Linux, and Windows (PowerShell)
- **Consumer customisation safety:** Discovery identifies that consumers may have `context.yml` customisations. Sync must not overwrite consumer-modified files outside the governed package boundary.

## Dependencies

- **Upstream:** implement-zero-commit-install — sync builds on the install infrastructure and lockfile format
- **Downstream:** validate-install-sync-e2e tests the full install→sync cycle

## Acceptance Criteria

**AC1:** Given a consumer repo with the governance package already installed (lockfile present), When I run the sync command, Then files in the governance package that have changed upstream are updated in the consumer's working tree, and the lockfile is updated with new hashes for the changed files.

**AC2:** Given the sync command has completed, When I inspect `context.yml` and any other consumer-customised files outside the governance package boundary, Then they are untouched — sync only updates files declared in the governance package manifest.

**AC3:** Given the sync command has completed, When I run the sync command a second time immediately, Then it reports "already up to date" — demonstrating the update channel is preserved and sync is idempotent.

**AC4:** Given a consumer repo where the upstream source has been moved or is unreachable, When I run the sync command, Then it exits with a clear error message identifying the unreachable upstream — it does not silently skip the sync or corrupt the lockfile.

## Out of Scope

- Initial install — that is a separate story
- Conflict resolution for consumer-modified governed files — Phase 4 MVP treats governed files as upstream-only; conflict resolution is a Phase 5 concern
- `context.yml` seeding — that is a separate story
- Cross-VCS sync (Bitbucket, GitLab) — Phase 5

## NFRs

- **Security:** Sync must not transmit or store credentials; upstream references must not include tokens (MC-SEC-02)
- **Performance:** Sync should complete in under 30 seconds for a typical governance package update (~20 changed files)
- **Accessibility:** CLI output must be readable by screen readers

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — conditioned on implement-zero-commit-install complete

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-sync-command.md |
| run_timestamp | 2026-04-19T18:52:00Z |

> **Security note:** `model_label` is a descriptive string only (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 3 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 1 |
| intermediates_produced | 1 |

**files_referenced:**

- artefacts/2026-04-19-skills-platform-phase4/discovery.md
- artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

### Fidelity self-report

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | 5 | 4 ACs: update pull, customisation safety, idempotency, error handling |
| Scope adherence | 5 | Sync only — no install, no conflict resolution, no seeding |
| Context utilisation | 5 | C1 constraint is central; consumer customisation safety from discovery incorporated |

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
