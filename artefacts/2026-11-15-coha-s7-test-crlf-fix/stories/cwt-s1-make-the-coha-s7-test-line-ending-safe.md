## Story: Make the coha-s7 structural tests pass in a Windows checkout with CRLF line endings

**Epic reference:** None - short-track (bounded test-portability fix, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery; scope stated directly below. Parent: `artefacts/2026-11-08-cicd-observability-hardening-automation/` (story coha-s7); learning D61 in `workspace/learnings.md`.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [pipeline-tooling, tests]

## User Story

As **a developer working in a Windows checkout of this repository**,
I want **`tests/check-coha-s7-error-issue-incident.js` to pass whatever line endings the workflow file has on disk**,
So that **the test suite is not red for a reason unrelated to the code, and a real regression in the workflow is not hidden among false failures**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Removes two false failures (W3 "the concurrency group is per issue number and never cancels" and W5 "the workflow never pushes to master, merges, approves or marks ready") seen on 2026-11-15 in the main Windows checkout, where `core.autocrlf=true` gives `.github/workflows/error-issue-incident-record.yml` CRLF endings. The test passed 44 of 44 in CI (Linux) and in the story worktree (LF), so only Windows checkouts fail.
**How:** line 732 of the test reads the workflow with `fs.readFileSync(WORKFLOW, 'utf8')` and no normalisation; W3 and W5 match with `^`, `$` and `\n`-anchored patterns.

## Architecture Constraints

- **Normalise at the read, not in each test.** One change where the workflow text is read (`.replace(/\r\n/g, '\n')`), so every structural pin sees the same text on every platform.
- **Do not weaken any pin.** No assertion is loosened, removed or made optional.
- **Do not change the workflow, the script or the library.** Test file only.
- **Architecture guardrails (.github/architecture-guardrails.md):** ADR-011 (artefact-first) is satisfied by this story's own chain; no other Active ADR is engaged (test file only, no src, workflow or schema change).
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** coha-s7 merged (PR 1090). Nothing else.
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given a Windows checkout where the workflow file has CRLF line endings, When `node tests/check-coha-s7-error-issue-incident.js` runs, Then all 44 tests pass.

**AC2:** Given a checkout where the workflow file has LF line endings (CI), When the same command runs, Then all 44 tests still pass.

**AC3:** Given the workflow file is temporarily rewritten with CRLF endings in a scratch copy, When the structural tests run against it, Then they pass; and given a deliberately broken scratch copy (for example `cancel-in-progress: true`), When they run, Then W3 still fails. (Proves the normalisation did not weaken the pin.)

## Out of Scope

- Any other test file that might read checked-in files (a repo-wide audit of line-ending sensitivity is a separate decision).
- Setting `.gitattributes` or changing `core.autocrlf`.
- Any change to coha-s7's production behaviour.

## NFRs

- **Security:** None.
- **Performance:** None.
- **Correctness:** the AC3 negative case must fail, so the fix cannot make the pins vacuous.

## Complexity Rating

**Rating:** 1 - one-line change plus a negative check.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
