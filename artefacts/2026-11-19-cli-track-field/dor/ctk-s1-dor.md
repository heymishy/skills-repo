## Definition of Ready: The skills CLI writes a valid `track` on new features and rejects an invalid one

**Story reference:** artefacts/2026-11-19-cli-track-field/stories/ctk-s1-cli-writes-and-validates-track.md
**Test plan reference:** artefacts/2026-11-19-cli-track-field/test-plans/ctk-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Track:** short

## Contract Proposal
- `src/enforcement/cli-init.js` (AC1 to AC4): optional track argument, default `standard`, validated against the four allowed values.
- `src/enforcement/cli-advance.js` (AC5, AC6): `track` added to `ENUM_FIELDS`.
- `bin/skills` (AC2, AC3): optional `--track` flag passed to `init`, and its usage line.
- `tests/check-ctk-s1-cli-track.js` (T1 to T6).
- A DoD.
- Not built: no schema change, no change to any existing feature's `track`, no other CLI behaviour.

## Contract Review
Contract review passed. All 6 acceptance criteria map to a named test. The three source files and the test are required touchpoints and none is excluded.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. New source behaviour goes through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who starts features with the CLI |
| H2 | At least 3 ACs in Given / When / Then | Pass | 6 ACs |
| H3 | Every AC has a test | Pass | |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | the schema is read, not changed |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | none introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The reference commits come from two older branches and were written against an older tree; they are rewritten against current master, not applied as patches. |
| W2 | Accepted | Existing tests for `init` and `advance` must keep passing; any that assert the exact shape of the written feature will need `track` added. |

## Oversight level
**Low** - small CLI change; the operator reviews the pull request.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-19-cli-track-field/stories/ctk-s1-cli-writes-and-validates-track.md
Test plan: artefacts/2026-11-19-cli-track-field/test-plans/ctk-s1-test-plan.md
Goal: write tests/check-ctk-s1-cli-track.js first and confirm T1 to T5 fail; then make init write and validate track, add the --track flag in bin/skills, and add track to ENUM_FIELDS in cli-advance.js.
Reference (read, do not merge): git show archive/feat-gpa-sc02-unified-gate-evaluator (commit f6973e28e) and archive/feat-b3-cli-advance-boolean-coercion (commit e26db9910).
Constraints:
- Do not change the schema or any existing feature's track.
- Use a temp repo root in every test; never touch the real pipeline-state.json.
- Check the absolute path contains .worktrees/ctk-s1/ before every edit.
```
