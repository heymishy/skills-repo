# Contract Proposal — Point platform-init.js at the real skills/ and templates/ source directories

**Story:** `pisd-s1` — `artefacts/2026-08-22-platform-init-stale-source-dirs/stories/pisd-s1-fix-platform-init-source-directories.md`
**Test plan:** `artefacts/2026-08-22-platform-init-stale-source-dirs/test-plans/pisd-s1-test-plan.md`
**Date:** 2026-08-22

---

## What will be built

In `scripts/platform-init.js`, the `COPY_DIRS` array's two `src` entries are corrected:
- `{ src: path.join(sourceRoot, '.github', 'skills'), dest: path.join(targetDir, '.github', 'skills') }` → `src` becomes `path.join(sourceRoot, 'skills')`
- `{ src: path.join(sourceRoot, '.github', 'templates'), dest: path.join(targetDir, '.github', 'templates') }` → `src` becomes `path.join(sourceRoot, 'templates')`

The `scripts` `COPY_DIRS` entry (third array member) is unaffected — its `src` (`sourceRoot/scripts`) was never part of the stale-path bug.

Before finalizing, the implementer completes AC5's investigation (git history + `git grep` of `.github/skills/`'s current 5 entries — `infra-definition`, `infra-plan`, `infra-review`, `schema-migration-plan`, `schema-migration-review`) and records the answer in this artefact folder's `decisions.md`. If the investigation concludes these must be preserved in bootstrap output, the implementation adds a fourth `COPY_DIRS` entry (or a merge step) to carry them forward from `sourceRoot/.github/skills` in addition to the corrected `sourceRoot/skills` entry — this is not prescribed in advance; the investigation's outcome decides it.

## What will NOT be built

- No change to `src/adapters/skill-discovery.js`'s own default source-resolution behaviour (`.github/skills/` as the runtime default for a bootstrapped consumer repo) — that is F15/`csdg-s1`'s separate scope.
- No change to `scripts/assemble-copilot-instructions.sh`'s `context.yml` path resolution.
- No retroactive re-bootstrap or notification of consumer repos that already ran `/bootstrap` against the broken paths.
- No end-to-end test of a full `/bootstrap` skill conversation — this story's tests exercise `platform-init.js`'s file-copy behaviour directly (via `execFileSync`, matching the existing `check-i1.2-platform-init-fetch.js` pattern), not the conversational skill flow around it.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read `scripts/platform-init.js`'s source text; assert `COPY_DIRS`'s skills/templates `src` values | unit |
| AC2 | Run `platform-init.js` against a fresh temp target; assert installed skill count/names match live `skills/` dir | unit + integration |
| AC3 | Same, for templates | unit + integration |
| AC4 | Re-run `tests/check-i1.2-platform-init-fetch.js` unmodified; assert 20/20 pass | integration |
| AC5 | Manual investigation (git log + git grep), documented in `decisions.md` | manual |
| AC6 | Run `node scripts/run-all-tests.js`; assert no new failures beyond the known `check-pipeline-state-integrity.js` baseline | integration + manual |

## Assumptions

- `PLATFORM_ROOT` (or the default `path.join(__dirname, '..')`) correctly identifies this repo's own root in both the test harness and any real invocation — unchanged by this fix.
- The existing `runInit`/`mktmp` test helpers in `check-i1.2-platform-init-fetch.js` remain reusable without modification for any NEW tests this story adds (they were already correctly written against real skill names — only the source path under test was wrong).
- No other currently-passing test in the suite depends on `.github/skills/`'s current narrow 5-entry content being the ONLY thing `platform-init.js` copies (verified via `git grep` before implementation, per AC6's own wording).

## Estimated touch points

**Files:** `scripts/platform-init.js` (the fix itself); `artefacts/2026-08-22-platform-init-stale-source-dirs/decisions.md` (AC5's documented answer); possibly a new `tests/check-pisd-s1-*.js` file for the test-plan's new unit/integration tests (AC1-AC3, AC6), or additions to the existing `tests/check-i1.2-platform-init-fetch.js` file — implementer's choice, whichever keeps related coverage together most clearly.
**Services:** None — CLI script only, no running service involved.
**APIs:** None.
