## Story: Support `ops/` path prefix for standalone infra changes without a parent story

**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/shared-infrastructure.md
**Discovery reference:** artefacts/2026-06-22-skills-infra-migration-tracks/discovery.md
**Benefit-metric reference:** artefacts/2026-06-22-skills-infra-migration-tracks/benefit-metric.md

## User Story

As a **P-Founder (solo founder/operator)**,
I want to run an infra plan for a secrets rotation or firewall rule change using the path `ops/YYYY-MM-DD-[change-slug]` as the feature slug, without any pipeline tooling rejecting the path as invalid,
So that operational changes that are not attached to a feature delivery story can still be governed, traced, and audited within the same pipeline.

## Benefit Linkage

**Metric moved:** M1 — Infra track completion time
**How:** Without the `ops/` path prefix, a standalone operational infra change has no valid feature slug and cannot be run through the infra track at all; this story removes that blocker for the solo-founder use case.

## Architecture Constraints

- Path-traversal guard (CLAUDE.md ougl): the `ops/` prefix must be validated such that artefact paths under `artefacts/ops/[slug]/` resolve within `repoRoot` — `path.resolve(inputPath).startsWith(repoRoot + path.sep)` must hold
- ADR-012 (platform-agnostic): the `ops/` path convention must be expressed in `check-pipeline-state-integrity.js` without assuming a specific VCS host or CI platform
- Script style guide: plain Node.js, CommonJS, no external npm dependencies

## Dependencies

- **Upstream:** None — independent of shr.1; can land in any order relative to shr.1
- **Downstream:** inf.1 references `ops/[slug]` as a valid feature slug for standalone infra use; shr.2 must land before any standalone ops run

## Acceptance Criteria

**AC1:** Given a feature slug of `ops/2026-06-25-secrets-rotation`, when `check-pipeline-state-integrity.js` runs, then the slug is accepted as valid — no "invalid feature slug" error.

**AC2:** Given an infra-definition artefact at `artefacts/ops/2026-06-25-secrets-rotation/infra/standalone-infra-def.md`, when the artefact path is resolved against `repoRoot`, then `path.resolve(artefactPath).startsWith(path.resolve(repoRoot) + path.sep)` is true.

**AC3:** Given a slug with traversal sequence `ops/../../etc/passwd`, when the path is resolved, then the resolved artefact path does not escape `repoRoot` — path-traversal guard holds for `ops/`-prefixed slugs.

**AC4:** Given a standard feature slug (without `ops/` prefix), when the integrity check runs, then behaviour is unchanged — existing feature slugs are unaffected.

## Out of Scope

- Creating a web UI journey or pipeline-state.json feature entry for ops changes — ops changes use the CLI path only; no UI journey is created
- Automatic discovery of `ops/` change slugs from the filesystem — slugs are operator-declared

## NFRs

- **Security:** Path-traversal guard applies to `ops/`-prefixed artefact paths; the guard must not be relaxed for this prefix
- **Audit:** No additional audit requirements beyond existing pipeline-state.json commit history

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
