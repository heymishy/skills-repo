## Story: The skills CLI writes a valid `track` on new features and rejects an invalid one

**Epic reference:** None - short-track (bounded fix)
**Discovery reference:** None - short-track skips discovery. Evidence: the branch review on 2026-11-19 of two held branches whose PRs had merged but whose last commit never reached master. `feat/gpa-sc02-unified-gate-evaluator` commit `f6973e28e` (archive tag `archive/feat-gpa-sc02-unified-gate-evaluator`) and `feat/b3-cli-advance-boolean-coercion` commit `e26db9910` (archive tag `archive/feat-b3-cli-advance-boolean-coercion`). Confirmed on master: `node bin/skills init <slug>` writes a feature with `slug`, `name`, `stage`, `health` and no `track`, while `.github/pipeline-state.schema.json` requires `slug`, `name`, `track`, `stage`, `health`; and `skills advance` accepts any value for `track`.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [cli]

## User Story

As **an operator who starts features with `skills init` and updates them with `skills advance`**,
I want **`skills init` to write a schema-valid `track` and `skills advance` to reject a `track` that the schema does not allow**,
So that **a feature created by the CLI passes the pipeline-state schema check, and a typo such as `track=defect` cannot slip into the state file**.

## Benefit Linkage

**Metric moved:** features created by the CLI that fail the pipeline-state schema (today: every one, `track` is missing) become valid on creation.
**How:** `init` takes an optional track argument defaulting to `standard`; `advance` validates `track` against the same four values the schema allows.

## Architecture Constraints

- Change confined to `src/enforcement/cli-init.js`, `src/enforcement/cli-advance.js`, `bin/skills` (one new optional `--track` flag and its usage line), and one new test. The two held commits are the reference implementation and are cherry-picked or rewritten, not merged wholesale.
- The allowed values are exactly the schema's: `short`, `standard`, `programme-workstream`, `library`. The test reads them from `.github/pipeline-state.schema.json` so the CLI and the schema cannot drift apart silently.
- Injectable adapter rule (D37): none introduced.
- Existing behaviour is unchanged when no `--track` is given, apart from the new default `track: 'standard'` on the written feature.

## Dependencies

- **Upstream:** none. **Downstream:** none.

## Acceptance Criteria

**AC1:** Given `skills init <slug>` with no `--track`, When it succeeds, Then the new feature in the state file has `track` equal to `standard`.
**AC2:** Given `skills init <slug> --track short` (or any of the four allowed values), When it succeeds, Then the new feature has that `track`.
**AC3:** Given `skills init <slug> --track bogus`, When it runs, Then it exits 1, the error names `bogus`, and the state file is not changed.
**AC4:** Given a feature written by `skills init`, When the pipeline-state schema is applied to it, Then it validates (all of `slug`, `name`, `track`, `stage`, `health` present).
**AC5:** Given `skills advance <feature> <story> track=defect`, When it runs, Then it exits 8, the error names `track` and the allowed values, and the state file is not changed.
**AC6:** Given `skills advance <feature> <story> track=short`, When it runs, Then it exits 0 and the value is written.

## Out of Scope

- Changing the schema, the allowed values, or any existing feature's `track`.
- Any other `skills init` or `skills advance` behaviour.
- The other held-branch commits (all superseded).

## NFRs

- **Reliability:** each test runs against a throwaway repo root, never the real state file.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
