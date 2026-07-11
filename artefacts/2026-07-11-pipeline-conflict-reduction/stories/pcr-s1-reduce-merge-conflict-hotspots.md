# Story: Remove the three recurring merge-conflict hotspots in parallel-wave inner-loop delivery

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported pattern below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As an **operator running multiple inner-loop coding-agent stories in parallel waves**,
I want **`package.json`'s test chain, `.github/pipeline-state.json`'s feature-level timestamp, and `decisions.md`'s append log to stop producing textual merge conflicts between concurrently-open story branches**,
So that **PRs from parallel stories can be rebased onto a fast-moving master with zero or near-zero manual conflict resolution**.

## Benefit Linkage

**Metric moved:** Manual conflict-resolution overhead per parallel-wave PR (operational efficiency, not a formal benefit-metric artefact — short-track).
**How:** Across Wave 2–3 of `2026-07-09-beta-readiness-infra` (~13 stories), nearly every PR required a manual or agent-driven conflict resolution on the same three files after each sibling PR merged. Removing the structural cause of each hotspot eliminates that resolution step for future parallel waves, directly reducing operator/agent time spent per merge and the risk of a resolution error (e.g. silently dropping one side's content).

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. This story touches tooling/governance files (`package.json`, `.github/pipeline-state.json`'s write behaviour, `.gitattributes`), not application architecture; no ADR governs test-runner mechanics or pipeline-state write granularity today.

## Dependencies

- **Upstream:** None.
- **Downstream:** None directly, but every future parallel-wave story in any feature benefits once merged.

## Acceptance Criteria

**AC1:** Given `package.json` currently defines `scripts.test` as a single `&&`-chained string listing every `tests/check-*.js` file by name, When a new test runner script (`scripts/run-all-tests.js`) is added that discovers and runs all `tests/check-*.js` files (plus any other currently-chained non-`check-*` test files) programmatically in a stable, deterministic order, Then `package.json`'s `scripts.test` is reduced to a single invocation of that script (e.g. `"test": "node scripts/run-all-tests.js"`), and running `npm test` produces the same pass/fail verdict as the current full chain did (module for the two already-documented pre-existing baseline gaps: the Windows `cmd.exe` command-line-length failure and the missing `.github/skills/definition/SKILL.md` — both of which this AC is expected to resolve as a side effect, not regress).

**AC2:** Given two different stories both add a new test file under `tests/`, When each story's branch is created from the same base commit and neither branch edits the other's test file, Then merging one branch into master and then merging master into the other branch produces zero conflict in `package.json` (there is nothing left in that file for two such branches to collide on).

**AC3:** Given `.github/pipeline-state.json`'s per-story write helpers (`node bin/skills advance`, `node bin/skills gate-advance`) currently bump the parent feature object's top-level `updatedAt` field on every single per-story field write, When a story's stage/field is advanced, Then the parent feature's `updatedAt` is left unchanged unless the write is a genuine feature-level milestone (feature `stage` transition, `discovery`/`benefit-metric`/`definition`-level field change) — story-level writes only touch the individual story object's own fields.

**AC4:** Given two different stories in the same feature both advance their own pipeline-state fields concurrently (neither touching the parent feature's milestone-level fields), When each story's branch is merged into master in sequence and the other branch is then rebased, Then `.github/pipeline-state.json` produces zero conflict (the parent feature's `updatedAt` line is untouched by either branch, so there is nothing to collide on).

**AC5:** Given `.gitattributes` does not currently declare a merge strategy for `decisions.md` files, When `artefacts/**/decisions.md merge=union` is added to `.gitattributes`, Then two branches that each append an independent, non-overlapping decision entry to the same `decisions.md` file merge automatically with both entries present and zero conflict markers, verified by a scripted three-way-merge test (base commit with N entries; branch A appends entry A; branch B appends entry B; merging A then B, or B then A, both auto-resolve with N+2 entries present, no manual intervention).

## Out of Scope

- Splitting `.github/pipeline-state.json` into per-feature or per-story files is out of scope for this story — AC3/AC4 solve the specific observed conflict (feature-level `updatedAt` contention) without the larger structural change of file-per-feature/story, which remains a candidate future story if cross-feature (not just same-feature) parallelism becomes a pain point.
- Retroactively fixing the two already-RISK-ACCEPTed pre-existing baseline gaps in any currently-open `bri-*` branch's own `decisions.md`/pipeline-state.json content is out of scope — this story only changes the mechanism going forward; existing open PRs are not rebased or edited by this story.
- Any change to `decisions.md`'s content template, entry schema, or the `/decisions` skill's authoring instructions is out of scope — only the git merge strategy for the file changes.

## NFRs

- **Performance:** `scripts/run-all-tests.js` must not meaningfully increase total `npm test` wall-clock time versus the current `&&` chain (within normal run-to-run variance) — no new per-file subprocess overhead beyond what Node's `child_process` already requires to run each file today.
- **Security:** None identified — no new external inputs, no new attack surface.
- **Accessibility:** N/A — no UI surface.
- **Audit:** None identified — pipeline-state.json's existing `updatedAt` values on story objects remain the audit trail for individual story changes; only the redundant parent-feature bump is removed.

## Complexity Rating

**Rating:** 2 — some ambiguity in exactly how `bin/skills advance`/`gate-advance` currently compute the feature-level `updatedAt` bump (needs code reading before the fix is applied), but the shape of the fix is well understood and bounded to a small number of files.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
