## Test Plan: A short-track fix for a GitHub issue closes that issue as a matter of course

**Story reference:** artefacts/2026-11-16-issue-closure-by-fix-pr/stories/icf-s1-fix-pr-closes-its-source-issue.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-icf-s1-fix-pr-closes-issue.js`. Skill text is checked by reading the SKILL.md files; the script's logic by calling its exported functions with an injected lookup; its command line by spawning it with `GH_BIN` pointing at a binary that does not exist.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | branch-complete puts `Fixes #N` in both PR bodies and requires the check | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Closing-keyword test passes the right bodies and fails the wrong ones | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | The scan returns exactly merged stories whose source issue is open | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | definition-of-done Step 1 and its output carry the source-issue row | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Schema accepts `sourceIssue`; integrity passes; `advance` stores an integer | - | 1 (T5) | - | - | - | 🟢 |
| AC6 | No `gh` or no source issues: exits 0 with a skipped or none message | - | 1 (T6) | - | - | - | 🟢 |
| AC7 | The next real error issue closes with its fix PR | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs a real issue and PR | AC7 | Live-only | Observed at the next production-error fix and recorded in that story's DoD |
| The `gh` calls themselves are not exercised in tests | AC1, AC3 | Accepted | The pure functions take the lookup as a parameter; the thin `gh` wrappers are read-only and covered by the skipped-path test and by the first real use |

## Tests (new file `tests/check-icf-s1-fix-pr-closes-issue.js`)

- **T1 (AC1).** `skills/branch-complete/SKILL.md` contains `Fixes #` at least twice (bash body and PowerShell body) near a source-issue instruction, and contains `check-source-issue-closure.js --pr`. Fails today.
- **T2 (AC2).** `closingKeywordPresent(body, n)` (exported from the script): true for `Fixes #1121`, `closes #1121`, `RESOLVES #1121`; false for `the operator can close issue #1121 and incident PR #1122` (the real #1127 text), for `Fixes #11210`, and for an empty body. Fails today (script absent).
- **T3 (AC3).** `findOpenSourceIssues(state, lookup)` over a synthetic state (a merged story with an open source issue, a merged one with a closed issue, a merged one with none, a draft one with an open issue, an epic-nested merged one with an open issue): returns exactly the two merged-and-open stories (flat and epic-nested). Fails today.
- **T4 (AC4).** `skills/definition-of-done/SKILL.md` Step 1 mentions the source issue, the script's scan, a deviation and the operator-confirmed closing offer; the DoD output template section lists a `Source issue closure` row. Fails today.
- **T5 (AC5).** The schema has `sourceIssue` (`type: integer`) in both story definitions; a temporary root with the integrity script and a story with `sourceIssue: 5` exits 0; running `bin/skills advance` against a temporary copy of the state (using the harness's existing test seam, if it has one, else by reading `cli-advance` coercion) stores an integer. Fails today (schema).
- **T6 (AC6).** Spawning the script with `GH_BIN=icf-no-such-binary` exits 0 and prints `skipped`; spawning it with a state that has no `sourceIssue` prints that none were found and exits 0.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Skill-text tests are string checks | Skills are instructions, not code | Each check names the specific phrase and the file; AC7 is the live proof |

**Total automated tests:** 6 (T1 to T6) plus AC7 evidence.
