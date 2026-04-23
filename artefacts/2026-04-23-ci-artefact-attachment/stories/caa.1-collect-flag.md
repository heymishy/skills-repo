# Story: caa.1 — Add `--collect` flag to `trace-report.js`: CI-platform-agnostic artefact assembly

**Feature:** 2026-04-23-ci-artefact-attachment
**Epic:** e1-ci-artefact-attachment
**Story ID:** caa.1
**Track:** standard
**Complexity:** 1 — Well understood, clear path
**Scope stability:** Stable

## User Story

As a platform maintainer,
I want `trace-report.js --collect` to assemble the full governed artefact chain for a feature into a flat staging directory,
So that any CI platform adapter can upload the bundle without needing to know the internal artefact folder structure.

## Context and Background

`scripts/trace-report.js` currently generates a human-readable trace validation report. This story extends it with a `--collect` flag that, instead of (or in addition to) generating the report, assembles the relevant artefact chain into a flat staging directory with sequentially numbered files and a manifest. This collection step is deliberately CI-platform-agnostic — it produces a directory on disk that the next step (upload, archive, email, etc.) can consume.

Feature resolution uses the existing `pipeline-state.json` active feature detection logic. The `--collect` step introduces zero new npm dependencies — only Node.js built-ins (`fs`, `path`, `crypto`).

## Architecture Constraints

ADR-003 / guardrail: No external npm dependencies in pre-commit hooks or governance scripts — must run with only `node` available. This constraint extends to the `--collect` flag. All file operations use `fs` / `path` / Node built-ins only.

## Dependencies

- **Upstream:** None — this story is the foundation of the epic. No prior story needs to complete first.
- **Downstream:** caa.2 (GitHub Actions adapter) consumes the staging directory produced by this story.

## Acceptance Criteria

**AC1:** Given a repository with a feature slug present in `pipeline-state.json` and a corresponding `artefacts/[slug]/` directory, when `node scripts/trace-report.js --collect --feature=[slug]` is run, then a staging directory is created at `.ci-artefact-staging/[slug]/` containing one file per artefact in the feature chain (discovery.md, benefit-metric.md, epic files, story files, test plans, DoR files, DoD files if present), each prefixed with a two-digit sequence number (e.g. `01-discovery.md`, `02-benefit-metric.md`).

**AC2:** Given the same repository, when `node scripts/trace-report.js --collect --feature=[slug]` is run, then a `manifest.json` is written to `.ci-artefact-staging/[slug]/manifest.json` containing: `featureSlug`, `collectedAt` (ISO 8601), `fileCount` (integer), and a `files` array listing each collected filename with its source path relative to the repo root.

**AC3:** Given a repository where `pipeline-state.json` contains exactly one feature with an active (`stage` not equal to `archived`) status and no `--feature` flag is passed, when `node scripts/trace-report.js --collect` is run, then the active feature is resolved automatically and the staging directory is produced as per AC1 and AC2.

**AC4:** Given a repository with no matching feature slug (or no active feature when `--feature` is omitted), when `node scripts/trace-report.js --collect` is run, then the script exits with code 1 and prints a clear error message to stderr: `"[trace-report --collect] No feature resolved. Pass --feature=<slug> or ensure exactly one active feature in pipeline-state.json."`.

**AC5:** Given the staging directory already exists from a previous run, when `node scripts/trace-report.js --collect --feature=[slug]` is run again, then the staging directory is cleared and rebuilt from scratch (no stale files from previous runs).

**AC6:** When `node scripts/trace-report.js --collect` is run, the script requires zero new npm packages — `node_modules` does not need to be installed for the `--collect` path. Verified by running with a fresh `node scripts/trace-report.js --collect` in a directory where `node_modules` does not exist.

## Out of Scope

- Uploading the staging directory to any CI platform — that is caa.2.
- Reading or validating the content of collected artefacts (content validation is trace-report's existing non-`--collect` mode).
- Collecting artefacts from multiple features simultaneously.
- Artefact diff between runs or versions.

## NFRs

- **Performance:** `--collect` completes in under 2 seconds for a feature with up to 30 artefact files on a standard CI runner.
- **Security:** The staging directory must not include `pipeline-state.json`, `.github/context.yml`, or any file outside the `artefacts/[slug]/` tree. No credentials, tokens, or secrets are collected.
- **Dependency constraint (MM2):** Zero new entries in `package.json` `dependencies` or `devDependencies` as a result of this story.
