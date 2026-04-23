# Story: caa.3 — `context.yml` opt-in gate and `ci_platform` adapter routing

**Feature:** 2026-04-23-ci-artefact-attachment
**Epic:** e1-ci-artefact-attachment
**Story ID:** caa.3
**Track:** standard
**Complexity:** 1 — Well understood; configuration gate pattern is established in the codebase
**Scope stability:** Stable

## User Story

As a tech lead configuring the delivery pipeline for my team,
I want to enable CI artefact attachment and switch CI platform by editing only `context.yml`,
So that I can control this feature for my repo without touching workflow YAML, adapter files, or any other configuration surface. (MM1-context-yml-config)

## Context and Background

This story adds the configuration harness that makes the entire WS0.6 feature opt-in and platform-switchable. It extends `context.yml` with an `audit:` block and makes `assurance-gate.yml` read those values before invoking the collect+upload+comment steps from caa.1 and caa.2.

The `ci_platform` value in `context.yml` is the single dispatch key that selects which adapter file under `scripts/ci-adapters/` is loaded at runtime. This is the mechanism that satisfies M3 (adapter extensibility) and MM1 (`context.yml` as single config surface).

Default behaviour: when `audit.ci_attachment` is absent or `false`, no collect, upload, or comment steps run. This is the zero-breakage guarantee (M2).

`context.yml` schema addition (documented in `docs/` and `contexts/personal.yml`):
```yaml
audit:
  ci_attachment: true          # default false — opt-in
  ci_platform: github-actions  # github-actions | gitlab-ci | azure-devops | jenkins | circleci
  artifact_retention_days: 90  # optional, default: CI platform default
```

## Architecture Constraints

- Config reading (architecture-guardrails.md): all configuration must be read from `context.yml`, never hardcoded in workflow YAML or scripts. The `ci_platform` value is the only mechanism for selecting an adapter.
- Schema evolution (architecture-guardrails.md): the `audit:` block additions to `context.yml` do not affect `pipeline-state.schema.json` (context.yml is not validated by the pipeline schema). However, a parsing error in `context.yml` must not silently swallow the error — the workflow must exit clearly if `context.yml` is malformed.
- No external npm dependencies: the YAML parsing of `context.yml` in the workflow uses `yq` (already available in GitHub Actions runners as `yq` from mikefarah/yq) or simple grep/awk — no new npm packages.

## Dependencies

- **Upstream:** caa.2 must be DoD-complete — this story wraps the steps established in caa.2 behind a condition gate. There is nothing to gate until caa.2's steps exist.
- **Downstream:** None — this is the final story in the epic.

## Acceptance Criteria

**AC1:** Given a repository where `context.yml` has `audit.ci_attachment: false` (or the `audit:` block is absent), when `assurance-gate.yml` runs on a pull request, then the `--collect` step, the upload step, and the comment step from caa.1 and caa.2 do not run — confirmed by the workflow step being skipped (`if: false` or equivalent) and no staging directory being created.

**AC2:** Given a repository where `context.yml` has `audit.ci_attachment: true` and `audit.ci_platform: github-actions`, when `assurance-gate.yml` runs on a pull request, then the `--collect` step runs, the staging directory is created, the artifact is uploaded, and the PR comment is posted — as specified in caa.1 and caa.2.

**AC3:** Given a repository where `context.yml` has `audit.ci_attachment: true` and `audit.ci_platform: gitlab-ci` (or any value other than `github-actions`), when `assurance-gate.yml` runs, then the workflow step that loads the adapter exits with code 1 and an informative error message: `"[ci-artefact-attachment] Adapter '[platform]' is not yet implemented. Available adapters: github-actions."` The rest of the workflow continues (the error in the attachment step is non-fatal to the governance gate result).

**AC4:** Given `contexts/personal.yml` (the reference context file checked into the repo), when a new `audit:` block is added to it by this story, then the block includes `ci_attachment`, `ci_platform`, and `artifact_retention_days` fields with inline comments explaining each field and the list of valid `ci_platform` values.

**AC5:** Given the existing test suite (`npm test`), when this story is implemented, then all 4 existing test suites continue to pass with zero new failures — confirming that the opt-in gate introduces no regressions.

**AC6:** Given a `context.yml` that is syntactically invalid YAML, when `assurance-gate.yml` reads it during the opt-in check, then the workflow step that reads the file exits with code 1 and a message: `"[ci-artefact-attachment] context.yml could not be parsed — check YAML syntax."`. The overall assurance gate result is unaffected (attachment failure is non-fatal).

## Out of Scope

- Implementing adapters for GitLab CI, Azure DevOps, Jenkins, or CircleCI — this story only establishes the routing mechanism and documents the valid `ci_platform` values.
- Adding `audit:` block schema validation to `pipeline-state.schema.json` — `context.yml` is a per-repo operator file, not a pipeline state file.
- User-facing documentation beyond inline comments in `contexts/personal.yml` — a separate documentation story could be added if needed.

## NFRs

- **Zero regressions (M2):** All 4 existing `npm test` suites must pass with zero failures after this story is implemented.
- **Fail-open on attachment (non-fatal):** A failure in the CI attachment steps (collection error, upload error, malformed context.yml) must not fail the overall governance gate check. The gate result is independent of the attachment result.
- **Explicit over implicit:** If `ci_platform` is set to a recognised but not-yet-implemented adapter, the error message must name the unimplemented adapter and list available adapters. Silent no-ops are not acceptable.
