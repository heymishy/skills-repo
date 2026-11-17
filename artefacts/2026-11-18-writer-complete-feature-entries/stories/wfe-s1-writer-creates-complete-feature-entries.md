## Story: A feature the web app records in pipeline-state.json is complete enough to pass the repository's own checks

**Epic reference:** None - short-track (bug, issue #1146, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: issue #1146; commit `dbea58fcb` (the app's own write of `new-feature-c2a2815d`); the repairs `935c260d5` and `42ff38856`; `.github/pipeline-state.schema.json` (a feature requires `slug`, `name`, `track`, `stage`, `health`).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [pipeline-state]

## User Story

As **the operator who merges pull requests while colleagues start features in the web app**,
I want **the app to record a new feature in `.github/pipeline-state.json` with every field the schema requires**,
So that **starting a feature in the app never makes the integrity check, trace validation and `check-bfl-s2` fail on every open pull request until someone repairs the file by hand**.

## Benefit Linkage

**Metric moved:** None formal. On 2026-11-18 the first feature started in the app after the writer shipped (`new-feature-c2a2815d`) was committed as `{ slug, id, discoveryStatus, artefact }`, which failed `check-pipeline-state-integrity` (C11, C15, C16), trace validation's `schema_valid` (also `stage`) and `check-bfl-s2-real-ci-failures` on every pull request until it was hand-repaired twice.
**How:** the writer fills the required fields when it creates a feature, with a test that runs the writer's real output through the integrity check and the schema's required list.

## Architecture Constraints

- **Two writers share the contract.** `pipeline-state-github-writer.js` (production, Contents API) and `pipeline-state-writer.js` (local file system) both create the feature entry and must fill the same defaults; the github writer is the one that failed in production, the local one is fixed too so they cannot drift. No new injectable adapter is introduced (D37 not triggered).
- **Defaults are minimal and honest.** New entry: `track: 'standard'`, `name` = the update's `name` if given, else the slug, `stage` = the update's `stage` if given, else `discovery`, `health` = the update's `health` if given, else `green`. An existing feature is never touched by the defaults.
- **Existing behaviour unchanged.** Feature-level fields in an update still overwrite (the existing `discoveryStatus`, `artefact`, `stage`, `health` loop); story-level handling, conflict detection, the 409 retry and the PUT are not edited.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain.

## Dependencies

- **Upstream:** wsd-s2 (the github writer), `.github/pipeline-state.schema.json`.
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given a feature slug that is not yet in `pipeline-state.json`, When the github writer applies an update for it, Then the new entry has `slug`, `id`, `name`, `track`, `stage` and `health` all set (defaults as above), plus whatever the update carried, and an update carrying its own `stage`, `name` or `health` keeps those values.

**AC2:** Given a feature already present, When the writer applies an update, Then none of its existing fields are replaced by defaults (a feature with `track: 'short'` stays `short`, its `name` and `stage` untouched unless the update names them).

**AC3:** Given the writer's output for a new feature, When it is checked with the repository's own validators, Then `scripts/check-pipeline-state-integrity.js` reports no failure for it and every feature in the output has all of the schema's required feature fields.

**AC4:** Given the local-fs writer (`pipeline-state-writer.js`), When it applies an update for an unknown slug, Then it creates the same complete entry as AC1.

**AC5:** Given the existing writer tests (`check-wsd-s2-github-pipeline-state-writer`, the local writer's tests, `check-pipeline-state-integrity` self-tests), When this change is made, Then they pass unchanged.

## Out of Scope

- Deciding whether the app should write an entry whose artefact it has not committed (the entry for `new-feature-c2a2815d` points at a discovery artefact that is not in the repository). Recorded as a follow-up in `decisions.md`.
- Backfilling or auditing other app-created entries (the repair of `new-feature-c2a2815d` is done).
- A pre-commit validation step in the writer that refuses to push an invalid state (worth considering; separate story).

## NFRs

- **Reliability:** no change to the writer's retry or conflict behaviour; the defaults add no network calls.
- **Security:** the existing prototype-pollution guard and validation still run first; `name` from an update is stored as a plain string only (non-strings are ignored).

## Complexity Rating

**Rating:** 1 - one branch in each of two writers and a test.
**Scope stability:** Stable
