## Definition of Ready: The build stamp records the workflow run that built the image, so an operator can find the run from the running app

**Story reference:** artefacts/2026-11-18-version-build-run/stories/vbr-s1-version-build-run.md
**Test plan reference:** artefacts/2026-11-18-version-build-run/test-plans/vbr-s1-test-plan.md
**Assessed by:** Claude Haiku 5.5
**Date:** 2026-11-18
**Track:** short

## Contract Proposal
- `scripts/write-version-file.js` (AC1 to AC4): two new fields in `buildVersionInfo()`.
- `tests/check-vbr-s1-version-build-run.js` (T1 to T4).
- `decisions.md` entry and a DoD.
- Not built: no workflow change, no change to `src/web-ui/utils/version-info.js`, no footer UI, no "tests passed" claim.

## Contract Review
Contract review passed. All 4 acceptance criteria map to a named test. The exclusion list (workflows, web UI) has no test assertion against it.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. The changed file is an existing script; the story artefact is committed before the code.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | operator checking the live build |
| H2 | At least 3 ACs in Given / When / Then | Pass | 4 ACs |
| H3 | Every AC has a test | Pass | see the test plan |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema dependency |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | Accepted | The record names the build run; it does not prove tests passed. Stated in the story. |

## Oversight level
**Low** - one script, two fields.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-18-version-build-run/stories/vbr-s1-version-build-run.md
Test plan: artefacts/2026-11-18-version-build-run/test-plans/vbr-s1-test-plan.md
Goal: write tests/check-vbr-s1-version-build-run.js first and confirm T1 to T3 fail; then add buildRunId and buildRunAttempt to buildVersionInfo() in scripts/write-version-file.js.
Constraints:
- Do not change any workflow file, src/web-ui/utils/version-info.js, or the existing alrf-s2 test.
- Do not add any "tests passed" or verification field.
- Check the absolute path contains .worktrees/vbr-s1/ before every edit.
```
