# DoR Contract — sri.2: Expand DoD entry condition message with actionable guidance

**Date:** 2026-06-25

## What will be built

Instruction text changes to the entry condition block in `skills/definition-of-done/SKILL.md` — expanding the early-exit message with three required elements: PR status check, next steps to reach merge, gate rationale.

One new test file: `tests/check-sri2-dod-entry-condition.js` with 5 content-assertion tests.

## What will NOT be built

- Any change to the logic determining when the entry condition fires
- Any change to the post-merge flow (Steps 1–7 of the DoD skill)
- Automated PR merge status detection (skill does not call GitHub API)
- Personalised messaging based on operator experience level

## How each AC will be verified

| AC | Test approach | Type |
|----|--------------|------|
| AC1 — message includes PR status check | T1 — asserts PR status check pattern in entry condition section | Unit — content assertion |
| AC2 — message includes next steps | T2 — asserts next-steps pattern in entry condition section | Unit — content assertion |
| AC3 — message includes gate rationale | T3 — asserts rationale pattern in entry condition section | Unit — content assertion |
| AC4 — all three in single block | T4 — asserts all three patterns within same bounded section | Unit — content assertion |
| AC5 — guidance absent post-merge | T5 — asserts post-merge flow sections still intact | Unit — regression guard |

## Assumptions

- The entry condition block is identifiable by the `## Entry condition check` heading in `skills/definition-of-done/SKILL.md`.
- The early-exit block (text shown when PR is not yet merged) is within that section, bounded by the next `##` heading.
- Adding the three elements to this block will not push the file past any skill-contracts limit.

## Estimated touch points

- Files: `skills/definition-of-done/SKILL.md`, `tests/check-sri2-dod-entry-condition.js`
- Services: None
- APIs: None
