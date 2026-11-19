# cvt-s1 Definition of Done

Date: 2026-11-19. Story: the live npm audit test checks the shape of the audit, not which packages happen to be vulnerable today. Pull request #1160 merged 2026-11-19 (`08650edf7`). No issue.

## Result: COMPLETE

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (the live audit case passes on a readable, non-error audit with the expected shape) | ✅ | T1 in `tests/check-cvt-s1-live-audit-shape.js` | automated | none |
| AC2 (the case requires no named package or severity) | ✅ | T2 | automated | none |
| AC3 (a registry error or non-JSON output still fails the case) | ✅ | T3 (the case calls `isAuditCommandError`, checks the shape and the filter; a registry-error fixture is rejected) | automated | none |
| AC4 (the coha-s3 and bkn-s1 tests exit 0) | ✅ | T1, T4 | automated | none |

Red first: 8 of 10 assertions failed before the change; all 10 pass after.

## Observations and follow-ups

- **Why it happened:** the test's expectation came from the advisory database as it stood when it was written. When the advisory was resolved upstream, master went red with no code change. The same pattern can recur in any test that reads live external state; none others were searched for.
- **Master was red from the advisory change until this merged,** and blocked pull request 1159 (fhc-s1), whose only failures were these two tests.
- **The case still needs the npm registry,** and fails when it is unreachable, as before.

## Scope Deviations

- None.
