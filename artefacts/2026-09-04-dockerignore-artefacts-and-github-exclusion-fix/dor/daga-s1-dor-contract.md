# Contract Proposal: Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work

**Story reference:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/stories/daga-s1-include-artefacts-and-github-in-docker-image.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## What will be built

1. In `.dockerignore`: remove the `# Pipeline artefacts — not required at runtime` comment and its `artefacts/` line (currently lines 40–41), and remove the `# CI configuration — not required at runtime` comment and its `.github/` line (currently lines 52–53).
2. In `pipeline-state-writer.js` (`pipelineStateWriterFactory`): change the factory's own "is this a real checkout" precondition from implicitly relying on `.github/pipeline-state.json`'s own readability, to explicitly checking `fs.existsSync(path.join(repoRoot, '.git'))` once at factory-creation time. When false, the returned writer throws immediately (before attempting any read/write), with an error message naming the missing `.git/` directory as the reason. When true, behaviour is completely unchanged from today.
3. In `tests/check-owle6-pipeline-state-auto-write.js`: add `fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true })` to T3, T4, T5, and T8's own fixture setup (alongside their existing `.github/` mkdir) — the only tests in that file that call the real factory rather than a spy.
4. Writes the 5 tests from the test plan (AC1–AC5).

## What will NOT be built

- Any change to `.github/scripts/`'s own exclusion (line 63) — kept exactly as-is; it becomes meaningfully re-scoped automatically once its parent directory is no longer wholesale-excluded.
- Any change to any other `.dockerignore` line (including `.git/`'s own exclusion, which Fix 2 now depends on staying in place), the `Dockerfile`, `fly.toml`, or any other application code.
- A narrower, per-file re-inclusion in `.dockerignore` — the whole-directory removal is the simplest correct fix given the confirmed-negligible size and confirmed-absent secret content.
- Any change to `pipelineStateWriter`'s own field-level logic, schema validation, atomic-write mechanics, or `owle.6`'s own T1/T2/T6/T7 (spy-based, unaffected by this change).
- Any automated `docker build` test — not available in this environment; covered by the verification script's own manual post-deploy scenario instead.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read `.dockerignore`, assert no line trims to exactly `artefacts/` or exactly `.github/` | unit |
| AC2 | Read `.dockerignore`, assert a `.github/scripts/` line is present | unit |
| AC3 | Read `.dockerignore`, assert every other pre-existing exclusion string is still present | unit (regression guard) |
| AC4 | Temp repo with `pipeline-state.json` but no `.git/`; assert the writer throws | unit |
| AC5 | Temp repo with both; assert the writer succeeds. Separately, re-run `owle.6`'s own updated T3/T4/T5/T8 | unit (regression guard) |

## Assumptions

- `.dockerignore` line-matching (trimmed, exact-match for the removed lines; substring-present for the regression-guard list) is a sufficient, correct verification of this story's own intent — confirmed sufficient given the story's own scope is purely "which lines exist in this text file," not build behaviour itself (which the manual verification script covers separately).
- No other file in this repo depends on `.dockerignore`'s own exact line numbers or comment text (confirmed via a repo-wide search before writing this contract — nothing references `.dockerignore` programmatically).
- `pipelineStateWriterFactory`'s own `.git/`-presence check, done once at factory-creation time (not per-call), is correct and sufficient — `repoRoot` does not change between the factory call in `server.js` (startup) and any individual write, confirmed via direct code reading.
- `owle.6`'s own T3/T4/T5/T8 are the only tests in that file exercising the real factory (not a spy) and therefore the only ones needing a fixture update — confirmed via direct reading of the full test file before writing this contract.

## Estimated touch points

Files: `.dockerignore`, `src/web-ui/adapters/pipeline-state-writer.js`, `tests/check-owle6-pipeline-state-auto-write.js` (fixture update, not new scope), `tests/check-daga-s1-*.js` (new).
Services: None new.
APIs: None new.
