## Story: Implement zero-commit install command

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4-opus/epics/e2-distribution-zero-commit-install.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4-opus/benefit-metric.md

## User Story

As a **tech lead adopting the platform into a consumer repo (Craig's context)**,
I want to **run a single install command that places the governance package into my repo's working tree without generating any commits**,
So that **I can inspect the installed files before committing them myself, and the platform's install process does not pollute my repo's commit history (M1)**.

## Benefit Linkage

**Metric moved:** M1 (Distribution sync — zero-commit install and sync success rate)
**How:** The install command is the primary M1 interaction. If the install produces unexpected commits, fails silently, or requires manual file copying, the success rate drops. A clean zero-commit install is the baseline requirement for the ≥90% target.

## Architecture Constraints

- **C1 (update channel never severed):** The install must preserve the upstream reference so that subsequent `sync` operations work without reconfiguration
- **C5 (hash-verified skill files):** The install must write a lockfile with per-file hashes at install time
- **ADR-012 (platform-agnostic):** The install command must work on macOS, Linux, and Windows (PowerShell) without platform-specific dependencies
- **MC-CORRECT-02 (schema-first):** The install command's output (lockfile) must conform to the lockfile schema defined in design-package-manifest

## Dependencies

- **Upstream:** design-package-manifest — the install reads the manifest to know what to install; Spike C PROCEED — the distribution model determines how the install fetches the package
- **Downstream:** implement-sync-command (reuses the install path for updates), implement-context-yml-seeding (runs after install), implement-lockfile-hash-verification (verifies the lockfile written by install)

## Acceptance Criteria

**AC1:** Given a fresh consumer repository with no governance package installed, When I run the install command with the upstream source reference, Then the governance package files are placed in the correct directory structure (`.github/skills/`, `.github/templates/`, `scripts/`, `standards/` as applicable) and a lockfile is written to the repo root (or `.github/`).

**AC2:** Given the install command has completed, When I run `git status` in the consumer repository, Then the governance package files appear as untracked files — zero commits were added to the consumer's git history by the install process.

**AC3:** Given the install command has completed, When I inspect the lockfile, Then it contains: (a) the upstream source reference, (b) the installed manifest version, (c) a SHA-256 hash for every installed file, and (d) the installation timestamp — all conforming to the lockfile schema.

**AC4:** Given the install command is run on a repo that already has a governance package installed, When the command detects existing files, Then it exits with a clear error message directing the user to use the sync command instead — it does not overwrite existing files.

## Out of Scope

- The sync/update command — that is a separate story
- Publishing the governance package to a registry — that is Spike C's distribution model concern
- `context.yml` seeding — that is a separate story
- Enforcement mechanism installation (CLI/MCP/etc.) — that is handled by the enforcement stories after Epic 1 completes

## NFRs

- **Security:** Install command must not store credentials; upstream references must not include tokens (MC-SEC-02)
- **Performance:** Install should complete in under 30 seconds for a typical governance package (~200 files)
- **Accessibility:** CLI output must be readable by screen readers (no colour-only status indicators)

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable — conditioned on Spike C PROCEED and design-package-manifest complete

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4-opus/stories/implement-zero-commit-install.md |
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
| AC coverage | 5 | 4 ACs: install to working tree, zero-commit check, lockfile content, existing-install guard |
| Scope adherence | 5 | Install only — no sync, no seeding, no enforcement |
| Context utilisation | 5 | Discovery zero-commit requirement, C1 update channel, C5 hash verification, ADR-012 platform portability |

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
