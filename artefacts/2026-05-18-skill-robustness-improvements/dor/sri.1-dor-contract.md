# DoR Contract — sri.1: Add git fetch timeout and fallback in inner-loop skills

**Date:** 2026-06-25

## What will be built

Instruction text changes in three SKILL.md files — `skills/branch-complete/SKILL.md`, `skills/implementation-plan/SKILL.md`, and `skills/subagent-execution/SKILL.md` — wrapping the existing `git fetch origin master` step with a 5-second timeout, a fallback path to the local branch copy, and a plain-text operator warning.

One new test file: `tests/check-sri1-fetch-timeout.js` with 13 content-assertion tests.

## What will NOT be built

- Changes to any skill other than the three named
- Automated retry logic (more than one attempt)
- Operator-configurable timeout value
- Persistence of warning to pipeline-state.json or any log file
- Any change to schema, scripts, or server code

## How each AC will be verified

| AC | Test approach | Type |
|----|--------------|------|
| AC1 — branch-complete fallback on missing origin | T1 (timeout+fallback text present), T2 (local-copy fallback text), T3 (warning text present) | Unit — content assertion |
| AC2 — implementation-plan fallback | T4, T5, T6 — same pattern on implementation-plan/SKILL.md | Unit — content assertion |
| AC3 — subagent-execution fallback | T7, T8, T9 — same pattern on subagent-execution/SKILL.md | Unit — content assertion |
| AC4 — 5-second timeout | T1, T4, T7 — timeout text check included in each | Unit — content assertion |
| AC5 — no change when origin healthy | T10 — asserts `git fetch origin master` instruction still present | Unit — regression guard |
| NFR-SEC — no credentials in warning | T11, T12, T13 — assert absence of log-URL or log-error-output instruction | NFR — regression guard |

## Assumptions

- `git fetch origin master` in the three SKILL.md files is instruction text directing the agent, not executable code in a script — the "timeout" is expressed as instruction text (e.g. "wrap in a try/catch with a 5-second timeout using `execSync` with `timeout: 5000`"), not as a new script or function.
- The local branch copy of `pipeline-state.json` is always available at the point in the session where the fetch occurs.
- The fallback chain (origin → local branch → worktree file) is the same across all three skills — a single text pattern can be applied consistently.

## Estimated touch points

- Files: `skills/branch-complete/SKILL.md`, `skills/implementation-plan/SKILL.md`, `skills/subagent-execution/SKILL.md`, `tests/check-sri1-fetch-timeout.js`
- Services: None
- APIs: None
