# AC Verification Script: Make the coha-s7 structural tests pass in a Windows checkout

**Story:** artefacts/2026-11-15-coha-s7-test-crlf-fix/stories/cwt-s1-make-the-coha-s7-test-line-ending-safe.md

## Setup
Open a terminal in the project folder (the main Windows checkout). The command is `node tests/check-coha-s7-error-issue-incident.js`; it prints one line per check and a total.

### Scenario 1: All checks pass on a Windows checkout (AC1)
**Steps:** run the command in the main checkout, where the workflow file has Windows line endings.
**Expected outcome:** the last line says `Results: 46 passed, 0 failed` (44 existing plus 2 new); lines W3 and W5 show a tick.
**Broken behaviour looks like:** W3 or W5 marked with a cross (today's behaviour: 42 passed, 2 failed).
**Result:** [ ] Pass  [ ] Fail

### Scenario 2: All checks still pass in CI (AC2)
**Steps:** open the pull request's "Lint, typecheck, test, build" check.
**Expected outcome:** green; the same file reports 46 passed, 0 failed on Linux.
**Result:** [ ] Pass  [ ] Fail

### Scenario 3: The pin still catches a real mistake (AC3)
**Steps:** run the command and find the new line about normalising keeping the pin strong.
**Expected outcome:** it passes: Windows-style text passes the concurrency check, and a copy with `cancel-in-progress: true` fails it.
**Result:** [ ] Pass  [ ] Fail