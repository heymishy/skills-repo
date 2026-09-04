# Story: Staging deploy workflow skips bookkeeping-only pushes to master

**Slug:** sdsb-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-04

---

## Problem

`.github/workflows/staging-deploy.yml`'s `on: push: branches: [master]` trigger has no path filtering, so it runs its full four-job pipeline (`deploy-staging` -> `smoke-test` -> `post-deploy-e2e-confirm`, and separately `promote-to-prod` behind a required manual approval) on every push to master -- including pushes that change nothing but `workspace/state.json`, `artefacts/**`, or `.github/pipeline-state.json`.

CLAUDE.md's own "State and artefact updates -- no standalone PR required" section already establishes that these three paths are pure pipeline bookkeeping, explicitly exempted from the PR-review gate specifically because they carry no quality-gate value. Today, every one of those bookkeeping-only pushes still triggers a real Fly deploy, a real smoke-test run, and a fresh `promote-to-prod` approval request -- with zero code changed. This session alone, this happened roughly ten times (named explicitly in the DoDs for `pst-s1`, `pgft-s1`, `psbf-s1`, `ppg-s1`, `fal-s1`, `pefl-s1`, `aada-s1`, `prlf-s1`, `fapg-s1`, and `daga-s1`), and separately caused a real operator-facing confusion incident: `fal-s1`'s `promote-to-prod` approval landed on a later run superseded by a DoD-only bookkeeping commit, not the run for the actual fix commit.

## As a / I want / So that

As the operator running this pipeline
I want bookkeeping-only pushes to master (state, artefact, and pipeline-state.json updates with no other file changed) to skip the staging deploy and promote-to-prod cycle entirely
So that I stop burning Fly deploy minutes and fresh approval requests on commits that changed no code, and so the approval queue only ever contains genuine, deployable changes

## Acceptance Criteria

- **AC1:** `staging-deploy.yml`'s `on.push` trigger has a `paths-ignore` list containing exactly `workspace/**`, `artefacts/**`, and `.github/pipeline-state.json` -- the same three paths already named in CLAUDE.md's own bookkeeping-exemption section, and no others.
- **AC2:** A push to master that changes only files matching the `paths-ignore` list does not trigger `staging-deploy.yml` at all (GitHub Actions' own native `paths-ignore` semantics: the whole workflow run is skipped when every changed file matches).
- **AC3 (regression guard):** A push to master that changes at least one file outside the `paths-ignore` list (e.g. a `src/` or `tests/` change), even when bundled with `workspace/state.json` or `artefacts/**` changes in the same commit, still triggers the full workflow exactly as it does today -- `paths-ignore` only skips a run when *every* changed file matches.
- **AC4 (regression guard):** `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` T3 (`staging-deploy.yml is scoped to push:branches:[master] only, not pull_request`) still passes unmodified -- the `paths-ignore` addition must not disturb the existing `push:`/`branches:` structure that test's regex depends on.
- **AC5 (regression guard):** `tests/check-bri-s2.6-smoke-test-promote-gate.js` still passes unmodified -- the `smoke-test` job's own no-error-tolerance assertion is unaffected by a change scoped to the `on:` trigger block only.

## Out of scope

- Any change to `deploy-staging`, `smoke-test`, `post-deploy-e2e-confirm`, or `promote-to-prod` job bodies themselves.
- Any change to `fly.toml`, `Dockerfile`, or `.dockerignore` (covered by `daga-s1`, already merged).
- Any change to the GitHub branch-protection path bypass (a separate, already-documented operator action in CLAUDE.md, unrelated to this workflow file).
- Path-filtering for any OTHER workflow file (`.github/workflows/*.yml` besides `staging-deploy.yml`) -- out of scope unless a future story identifies the same gap elsewhere.

## Benefit linkage

Directly reduces wasted Fly deploy/smoke-test runs and eliminates the specific operator-facing confusion this session surfaced (`fal-s1`'s promote-to-prod approval landing on a superseded, bookkeeping-only run instead of the intended fix-commit run). No formal benefit-metric artefact -- short-track story, consistent with `daga-s1`, `prlf-s1`, `fapg-s1`, and the rest of this session's short-track deliveries.
