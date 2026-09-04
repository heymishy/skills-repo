# Implementation Plan: Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work

**Story reference:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/stories/daga-s1-include-artefacts-and-github-in-docker-image.md
**DoR contract:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/dor/daga-s1-dor-contract.md
**Worktree:** .worktrees/daga-s1 (branch `feature/daga-s1`)
**Baseline:** 608 files, 1 pre-existing failure (`tests/check-p3.5-validate-trace.js` — confirmed present on master before this branch existed, same known local-environment gap noted in every prior story's DoD this session)

---

## Task 1: `.dockerignore` fix (AC1–AC3)

Removed the `artefacts/` and `.github/` whole-directory exclusion lines (and their comments). `.git/` and `.github/scripts/` left untouched.

**Status:** Complete.

---

## Task 2: `pipeline-state-writer.js` precondition fix (AC4–AC5)

Changed `pipelineStateWriterFactory`'s own "is this a real checkout" precondition from implicit (readable `.github/pipeline-state.json`) to explicit (`fs.existsSync(path.join(repoRoot, '.git'))`, checked once at factory-creation time).

**Regression found and fixed within this task, before commit — a second one beyond what the DoR contract anticipated:** `tests/check-cdg7-gate-advance.js` also calls `pipelineStateWriterFactory` directly (7 call sites, all via a shared `makeTempDir()` helper) — missed by the DoR contract's own assumption that `owle.6`'s T3/T4/T5/T8 were the only affected tests. Found via a full-suite run, not the individually-identified related files. Fixed by adding a `.git/` directory to the shared `makeTempDir()` helper itself (harmless for the 5 other tests in that file that don't touch the writer), rather than editing each of the 7 call sites individually.

**Files touched:**
- `.dockerignore`
- `src/web-ui/adapters/pipeline-state-writer.js`
- `tests/check-owle6-pipeline-state-auto-write.js` (T3/T4/T5/T8 fixture update — anticipated by the DoR contract)
- `tests/check-cdg7-gate-advance.js` (`makeTempDir()` fixture update — found via full-suite run, not anticipated)
- `tests/check-daga-s1-dockerignore-and-writer-safety.js` (new)

**TDD verification performed:** before committing, both fixes (`.dockerignore` and `pipeline-state-writer.js`) were temporarily stashed (`git stash push -u`, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code — confirmed AC1 (both sub-checks) and AC4 fail exactly as expected. AC4's own failure is the strongest evidence in this story: pre-fix, the writer *succeeded* even with `.git/` absent (as long as `pipeline-state.json` was merely readable), empirically proving the exact silent-data-loss regression this story exists to prevent — not just a value-mismatch assertion, but a direct demonstration of the vulnerability itself.

**Status:** Complete. Committed as `ce48efd1` on `feature/daga-s1`.

---

## Verification

- New test file: 6/6 passing.
- `tests/check-owle6-pipeline-state-auto-write.js` (regression guard): 20/20 passing.
- `tests/check-cdg7-gate-advance.js` (regression guard, fixed within this same task): 40/40 checks passing.
- Full suite: 608 files run, 1 failed (the known pre-existing `check-p3.5-validate-trace.js`), 0 new failures.
