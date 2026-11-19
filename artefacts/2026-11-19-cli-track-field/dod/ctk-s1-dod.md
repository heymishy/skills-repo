# ctk-s1 Definition of Done

Date: 2026-11-19. Story: the skills CLI writes a valid `track` on new features and rejects an invalid one. Pull request #1161 merged 2026-11-19 (`87dc7c770`). No issue.

## Result: COMPLETE

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (`skills init` with no track writes `standard`) | ✅ | T1 in `tests/check-ctk-s1-cli-track.js` | automated | none |
| AC2 (`skills init --track <allowed value>` writes that value, for all four) | ✅ | T2 | automated | none |
| AC3 (`--track bogus` exits 1, names it, changes nothing) | ✅ | T3, through both `init()` and the real `bin/skills` | automated | none |
| AC4 (a feature written by the real CLI satisfies the schema's required fields and track enum) | ✅ | T4 | automated | none |
| AC5 (`skills advance ... track=defect` exits 8, names the field and allowed values, changes nothing) | ✅ | T5 | automated | none |
| AC6 (`skills advance ... track=short` exits 0 and is written) | ✅ | T6 (baseline) | automated | none |

Red first: 16 of 21 assertions failed on master; the 5 that passed were the schema read, the `init` success checks and the T6 baseline. All 21 pass after. The 8 existing tests that use `init` or `advance` still pass.

## Observations and follow-ups

- **Origin of the story:** the last commit of two old branches (`feat/gpa-sc02-unified-gate-evaluator` and `feat/b3-cli-advance-boolean-coercion`) whose pull requests had merged without it. Found in the held-branch review on 2026-11-19; both branches are archived as `archive/feat-gpa-sc02-unified-gate-evaluator` and `archive/feat-b3-cli-advance-boolean-coercion`. The fix was rewritten against current master, not applied as a patch.
- **Existing features are unchanged.** Features created by `skills init` before this had no `track`; none were backfilled. The repository's own state file passes the integrity check (842 stories, 0 failing).
- **Pattern worth knowing:** a branch whose PR merged can still carry later commits that never reach master. The held-branch review found two of eight.

## Scope Deviations

- None.
