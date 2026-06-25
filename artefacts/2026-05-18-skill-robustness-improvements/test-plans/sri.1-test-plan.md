# Test Plan — sri.1: Add git fetch timeout and fallback in inner-loop skills

**Story:** artefacts/2026-05-18-skill-robustness-improvements/stories/sri.1.md
**Review:** artefacts/2026-05-18-skill-robustness-improvements/review/sri.1-review-1.md — PASS (Run 1, 2026-06-25)
**Date:** 2026-06-25
**Test runner:** `node tests/check-sri1-fetch-timeout.js` (file to be created by coding agent)
**Framework:** Plain Node.js — content assertions on SKILL.md files read from disk

---

## Test Data Strategy

**Strategy:** Synthetic — tests read SKILL.md file content from disk using `fs.readFileSync`. No external data, no network calls, no real git operations. Tests assert text patterns in the modified skill files.

**Data owner:** Self-contained (tests generate no data; source files are in the repo).

**PCI/sensitivity:** None — skill files contain no personal or sensitive data.

---

## AC Coverage Table

| AC | Test(s) | Type | Gap |
|----|---------|------|-----|
| AC1 — branch-complete fallback on missing origin | T1, T2, T3 | Unit (content) | None |
| AC2 — implementation-plan fallback on missing origin | T4, T5, T6 | Unit (content) | None |
| AC3 — subagent-execution fallback on missing origin | T7, T8, T9 | Unit (content) | None |
| AC4 — 5-second timeout on unreachable origin | T1, T4, T7 (timeout text check) | Unit (content) | None |
| AC5 — no behaviour change when origin healthy | T10 | Unit (content) | None |
| NFR-SEC — warning does not expose remote URL or credentials | T11, T12, T13 | NFR | None |

---

## Unit Tests

All tests read the relevant SKILL.md from disk and assert text content. All tests must FAIL before implementation (the changes have not yet been made to the skill files).

Test file: `tests/check-sri1-fetch-timeout.js`

**T1 — `branch-complete-contains-fetch-timeout-and-fallback`** (AC1, AC4)
- Precondition: `skills/branch-complete/SKILL.md` exists
- Action: read file; search for a 5-second timeout pattern around `git fetch origin master` — expect text matching `/5.second/i` OR `/timeout.*5/i` AND text matching `/fallback/i` within the same file
- Expected: both patterns found
- Currently: FAIL — bare `execSync('git fetch origin master')` with no timeout at line 268

**T2 — `branch-complete-contains-local-copy-fallback-path`** (AC1)
- Action: read `skills/branch-complete/SKILL.md`; assert presence of text describing falling back to local branch copy when fetch fails — pattern: `/local.*copy/i` OR `/local.*branch/i` OR `/worktree.*file/i`
- Expected: pattern found
- Currently: FAIL

**T3 — `branch-complete-contains-origin-not-reachable-warning`** (AC1)
- Action: read `skills/branch-complete/SKILL.md`; assert presence of a warning message instruction — pattern: `/origin.*not.*reachable/i` OR `/warn.*origin/i` OR `/fetch.*failed.*warn/i`
- Expected: pattern found
- Currently: FAIL

**T4 — `implementation-plan-contains-fetch-timeout-and-fallback`** (AC2, AC4)
- Precondition: `skills/implementation-plan/SKILL.md` exists
- Action: read file; assert `/5.second/i` OR `/timeout.*5/i` AND `/fallback/i`
- Expected: both patterns found
- Currently: FAIL — bare `execSync('git fetch origin master')` at line 177

**T5 — `implementation-plan-contains-local-copy-fallback-path`** (AC2)
- Action: read `skills/implementation-plan/SKILL.md`; assert `/local.*copy/i` OR `/local.*branch/i` OR `/worktree.*file/i`
- Expected: pattern found
- Currently: FAIL

**T6 — `implementation-plan-contains-origin-not-reachable-warning`** (AC2)
- Action: read `skills/implementation-plan/SKILL.md`; assert `/origin.*not.*reachable/i` OR `/warn.*origin/i` OR `/fetch.*failed.*warn/i`
- Expected: pattern found
- Currently: FAIL

**T7 — `subagent-execution-contains-fetch-timeout-and-fallback`** (AC3, AC4)
- Precondition: `skills/subagent-execution/SKILL.md` exists
- Action: read file; assert `/5.second/i` OR `/timeout.*5/i` AND `/fallback/i`
- Expected: both patterns found
- Currently: FAIL — bare `execSync('git fetch origin master')` at line 233

**T8 — `subagent-execution-contains-local-copy-fallback-path`** (AC3)
- Action: read `skills/subagent-execution/SKILL.md`; assert `/local.*copy/i` OR `/local.*branch/i` OR `/worktree.*file/i`
- Expected: pattern found
- Currently: FAIL

**T9 — `subagent-execution-contains-origin-not-reachable-warning`** (AC3)
- Action: read `skills/subagent-execution/SKILL.md`; assert `/origin.*not.*reachable/i` OR `/warn.*origin/i` OR `/fetch.*failed.*warn/i`
- Expected: pattern found
- Currently: FAIL

**T10 — `branch-complete-retains-primary-fetch-instruction`** (AC5)
- Action: read `skills/branch-complete/SKILL.md`; assert the primary `git fetch origin master` instruction is still present — the fix wraps it, not removes it
- Pattern: `/git fetch origin master/`
- Expected: found (the instruction remains, with timeout wrapper added around it)
- Currently: PASS (the instruction exists) — this test guards against regression where the implementation removes the fetch entirely

**Note on T10:** This test currently passes. It is included as a regression guard to confirm the implementation wraps, not removes, the fetch instruction. Flag this in the test file with a comment: `// regression guard — passes before and after implementation`.

---

## NFR Tests

**T11 — `branch-complete-warning-text-does-not-instruct-logging-url`** (NFR-SEC)
- Action: read `skills/branch-complete/SKILL.md`; find the warning/fallback section; assert it does NOT instruct logging the remote URL or the full `git fetch` error output
- Pattern: assert absence of `/log.*remote.*url/i` and `/log.*error.*output/i` and `/print.*fetch.*error/i`
- Expected: patterns absent from warning instruction text
- Currently: PASS (no such instruction exists) — regression guard against implementation accidentally logging credentials

**T12 — `implementation-plan-warning-text-does-not-instruct-logging-url`** (NFR-SEC)
- Same assertion on `skills/implementation-plan/SKILL.md`
- Currently: PASS (regression guard)

**T13 — `subagent-execution-warning-text-does-not-instruct-logging-url`** (NFR-SEC)
- Same assertion on `skills/subagent-execution/SKILL.md`
- Currently: PASS (regression guard)

**Note on T11–T13:** These NFR tests currently pass (no offending instructions exist). They are written to detect a regression if the implementation accidentally adds instruction text that would cause credentials or URLs to be logged. Flag each with `// NFR regression guard` in the test file.

---

## Gap Table

No gaps. All 5 ACs are testable via content assertion. AC5 (no change when healthy) and NFR-SEC tests are written as regression guards that pass before and after implementation — documented in-test.

---

## Integration Tests

None — this story introduces no cross-component handoffs. The changes are instruction-text additions to three independent SKILL.md files.

---

## Test count summary

| Type | Count |
|------|-------|
| Unit (content assertion — must fail before impl) | 9 |
| Unit (regression guard — pass before and after) | 1 |
| NFR (regression guard — pass before and after) | 3 |
| **Total** | **13** |
| Integration | 0 |
