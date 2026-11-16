## Story: Make the full test suite leave the repository clean, and stop the cat-s1 timing flake

**Epic reference:** None - short-track (bounded test-hygiene fixes, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: a full `npm test` run in a throwaway worktree on 2026-11-16 created 0 commits (the stray-commit defect was already fixed by stis-s1) but left five pieces of junk in the checkout: `artefacts/<today>-discovery/`, a modified tracked file `artefacts/test-slug/ideate.md`, `artefacts/stis-s1-test-slug/`, `workspace/test-tmp-inf5/` and `workspace/test-tmp-mig4/` (and earlier runs left `workspace/strategy-metrics.json`). A probe of 26 candidate test files, each run standalone, traced the writers. `tests/check-cat-s1-core-trace-builder.js` also failed three times under local load (50.3, 50.4 and 67.1 ms against its 50 ms budget).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [tests]

## User Story

As **the operator or an agent running the full suite in a worktree**,
I want **the suite to leave the checkout exactly as it found it, and its one timing-sensitive file to run without neighbours**,
So that **junk files cannot be committed by accident (one reached master once, PR #454) and a red or flaky result always means something real**.

## Benefit Linkage

**Metric moved:** None formal. Removes a recurring cleanup step and a recurring accidental-commit risk; removes a known flake.
**How:** the production auto-save in `skills.js` gets a test-only root override (`SKILLS_ARTEFACT_SAVE_ROOT`, default unchanged), the five junk-writing tests point their writes at a temporary directory, and `check-cat-s1-core-trace-builder.js` is added to the runner's existing sequential-exclusive phase.

## Architecture Constraints

- **Production behaviour unchanged.** With `SKILLS_ARTEFACT_SAVE_ROOT` unset the auto-save writes under `_getRepoPath()` exactly as before; the override exists only so tests can redirect the write, the metrics write and the commit's working directory together (they all derive from one variable, `_autoRepoRoot`).
- **Path-traversal guard unchanged:** the existing `startsWith(_resolvedRepoRoot + path.sep)` check at the auto-save runs against whichever root is chosen.
- **Why not `CLAUDE_REPO_PATH`:** that variable also decides where skills content is read from (`_getRepoPath()` at several call sites), so pointing it at an empty temporary directory would break the tests that need real skills.
- **Sequential phase:** `scripts/run-all-tests.js` already runs `SEQUENTIAL_EXCLUSIVE_LIST` files one at a time in their own phase, away from the concurrent pool; adding `cat-s1` there gives its 50 ms assertion a quiet machine. The 50 ms budget itself and the best-of-7 method are unchanged.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy (scripts and tests by pull request); the D37 injectable-adapter rule is not engaged (an environment override, not a new adapter). Zero new npm dependencies.

## Dependencies

- **Upstream:** stis-s1 (the git-commit adapter and the test-mode no-op in `server.js`), cat-s1 (the timing test), fhff-s1 (the exclusive list). All merged.

## Acceptance Criteria

**AC1:** Given the test runner, When its file lists are read, Then `tests/check-cat-s1-core-trace-builder.js` is in `SEQUENTIAL_EXCLUSIVE_LIST` and is not scheduled in the concurrent pool, and the other list members and the 50 ms budget are unchanged.

**AC2:** Given `skills.js`, When `SKILLS_ARTEFACT_SAVE_ROOT` is set, Then the root used by the artefact auto-save is that directory; When it is unset, Then it is exactly what it was before (the `_getRepoPath()` result).

**AC3:** Given the five files that left junk (`check-wusl2-progressive-live-draft`, `check-iwu5-lens-complete`, `check-stis-s1-guard-skill-turn-git-commit`, `check-inf5-trace-extension`, `check-mig4-trace-extension`), When each is run on its own, Then `git rev-parse HEAD` is unchanged and none of the paths `artefacts/<today>-discovery`, `artefacts/test-slug`, `artefacts/stis-s1-test-slug`, `workspace/test-tmp-inf5`, `workspace/test-tmp-mig4` or `workspace/strategy-metrics.json` is created or changed (existence, size and modified time are compared before and after).

**AC4 (evidence, not automated):** Given a clean worktree, When the full suite runs, Then `git status --short` shows no new or changed files afterwards. Recorded in the verification evidence.

## Out of Scope

- The git-commit adapter and its test-mode wiring (already done by stis-s1); any production behaviour; other timing-sensitive tests; the pre-existing untracked junk in the operator's main checkout (artefacts/2026-10-16-discovery and similar), which is theirs to delete.

## NFRs

- **Safety:** the guard test only inspects named paths and never deletes anything.
- **Reliability:** the guard test compares before and after, so pre-existing junk in a checkout cannot make it fail.

## Complexity Rating

**Rating:** 1 - one small helper, one list entry, five small test edits. **Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
