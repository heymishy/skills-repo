## Story: Sidecar install via init command without forking

**Epic reference:** artefacts/2026-04-19-skills-platform-phase4/epics/e2-distribution-model.md
**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md

## User Story

As a **consumer (Craig, Thomas, or any adopter)**,
I want to **run a single `skills-repo init` command that installs the platform's skill sidecar into my repository without forking the skills-repo and without generating a commit in my repo**,
So that **I have a local, hash-verified copy of all skill content I am governed by, and my repo's git history is clean of platform install noise**.

## Benefit Linkage

**Metric moved:** M1 — Distribution sync
**How:** This story is the first half of the M1 measurement baseline — zero-commit install. M1's target cannot be claimed until a consumer can complete an `init` that leaves their `git log --oneline` count unchanged. Without this story, the distribution model has no install step.

## Architecture Constraints

- C1: the sidecar directory is an installed copy, not a fork — no consumer should need to fork `heymishy/skills-repo` to use the install command; running `init` must not create a fork or open a pull request
- C5: skill content hashes must be computed and written to the lockfile during `init` — the sidecar is not trusted at rest without a hash record; a sidecar directory without a lockfile fails `verify`
- ADR-004: the upstream source URL and the skill selection are read from `.github/context.yml` (specifically `skills_upstream.repo`, `skills_upstream.paths`) — not hardcoded in the `init` command
- Spike C output artefact: the sidecar directory convention, lockfile field names, and upstream fetch protocol are defined in the Spike C verdict and must be respected; no E2 story may choose its own sidecar layout independently of the spike

## Dependencies

- **Upstream:** p4.spike-c must have a PROCEED or REDESIGN verdict before this story enters DoR
- **Downstream:** p4.dist-no-commits hardens the zero-commit guarantee; p4.dist-lockfile defines the full lockfile schema; p4.dist-migration depends on a working `init` as the target state for migrating fork consumers

## Acceptance Criteria

**AC1:** Given a consumer repository that has no skills sidecar installed, When `skills-repo init` is run with upstream source configured in `.github/context.yml`, Then a sidecar directory exists (at the path specified in the Spike C output) containing the fetched skill content and a lockfile, zero commits have been added to the consumer's git log, and `git status` shows no staged or modified tracked files in the consumer repo (the sidecar directory must be listed in `.gitignore` or otherwise excluded from git tracking).

**AC2:** Given `init` completes successfully, When the consumer inspects their consumer repo, Then no SKILL.md, POLICY.md, or standards file exists outside the sidecar directory — skill content is isolated in the sidecar and does not appear in the consumer's own source tree.

**AC3:** Given the upstream source is not configured in `.github/context.yml` (field absent or empty), When `init` is run, Then the command exits with a non-zero status and an error message: "No upstream source configured — set skills_upstream.repo in .github/context.yml" before attempting any network operation.

**AC4:** Given `init` is run on a repo that already has a sidecar directory, When the command completes, Then it either errors with "Sidecar already installed — run `skills-repo upgrade` to update" or performs a safe idempotent re-init that produces an identical sidecar and lockfile, and zero commits are generated in either case.

## Out of Scope

- Implementing the upgrade flow — that is p4.dist-upgrade; `init` is the first-install-only path; running `init` on an existing sidecar either errors or re-inits identically, it does not upgrade
- Commit-format validation — that is p4.dist-commit-format; `init` does not inspect the consumer's commit history
- Non-git-native install (Teams, Confluence) — E4 scope; this story is git-native only
- Publishing infrastructure for the upstream source — Phase 4 assumes the upstream source is accessible at the configured URL; the publishing pipeline is out of scope

## NFRs

- **Security:** `init` must not write any credentials to the sidecar, lockfile, or console output (MC-SEC-02); if the upstream source requires authentication, credentials must be sourced from the OS credential store, not from context.yml
- **Audit:** Lockfile written at `init` time must record: upstream source URL, pinned ref, skill content hashes — the minimum fields required for `verify` to re-check the install without the network
- **Performance:** `init` should complete within 30 seconds on a standard developer machine for a typical skill set (all current skills in heymishy/skills-repo); no hard SLA, but user-noticeable hang (>60s) is a bug

## Complexity Rating

**Rating:** 2
**Scope stability:** Unstable — sidecar directory convention and lockfile format are determined by the Spike C output; if Spike C produces a REDESIGN that changes the sidecar layout, this story must be updated before entering DoR

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
| artefact_path | artefacts/2026-04-19-skills-platform-phase4/stories/p4-dist-install.md |
| run_timestamp | 2026-04-19 |

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | 14 |
| constraints_inferred_count | 4 |
| intermediates_prescribed | 4 |
| intermediates_produced | 6 |
