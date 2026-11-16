# icf-s1 Definition of Done

Date: 2026-11-17. Story: a fix PR closes its source issue as a matter of course. PR #1131, merged to master on 2026-11-16 at 16:57 UTC (`42fe2cc65`). The change is skills, a template, a script and a schema field only, so there is no production deploy to check.

## Result: COMPLETE WITH ONE OPEN EVIDENCE ITEM

AC1 to AC6 (Acceptance Criteria 1 to 6) were verified by 6 automated tests before merge (see `reference/icf-s1-verify-completion-evidence.md`). AC7 (the next real production-error issue is closed by its own fix PR with no DoD deviation) cannot be observed yet: no production-error fix has merged since. It is recorded as the next-fix check below.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `/branch-complete` carries `Fixes #N` in both PR-body variants and requires the closing-reference check; test in `tests/check-icf-s1-fix-pr-closes-issue.js` | automated | none |
| AC2 | ✅ | closing-keyword check accepts `Fixes`, `Closes`, `Resolves` (any case) and rejects a bare mention | automated | none |
| AC3 | ✅ | scan returns only merged stories whose `sourceIssue` is still open (injected lookup) | automated | none |
| AC4 | ✅ | `/definition-of-done` Step 1 and the template's Source Issue Closure section | automated | none |
| AC5 | ✅ | schema accepts integer `sourceIssue` on both story definitions; integrity check passes | automated | none |
| AC6 | ✅ | missing `gh` exits 0 with a skipped message; no `sourceIssue` reports none | automated | none |
| AC7 | ⚠️ | needs the next real production-error fix, which has not merged yet | pending | DEVIATION: not observable at DoD time; to be confirmed on the next production-error fix PR (it must carry `Fixes #N` and close its issue at merge) |

## Source Issue Closure

No source issue. (PR #1131 itself fixes no issue, so `closingIssuesReferences` is correctly empty.)

## Observations and follow-ups

- AC7 check: when the next production-error issue is fixed, confirm its PR body has `Fixes #N`, the issue closes at merge, and that story's DoD reports no deviation. Until then the mechanism is proven by tests only.
- The scan reports a deviation but never closes an issue itself; closing stays an operator-approved action.

## Scope Deviations

None.
