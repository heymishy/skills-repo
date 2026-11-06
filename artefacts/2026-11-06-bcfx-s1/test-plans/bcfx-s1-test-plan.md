## Test Plan: /branch-complete's freshness check must not be invalidated by /verify-completion's own bookkeeping commit

**Story reference:** artefacts/2026-11-06-bcfx-s1/stories/bcfx-s1-freshness-bookkeeping-commit-fix.md

---

## AC Coverage

| AC | Description | Unit | Integration | Gap type | Risk |
|----|-------------|------|-------------|----------|------|
| AC1 | A bookkeeping-only commit after the record does not break freshness | 2 tests | — | — | 🟢 |
| AC2 | A real code commit after the record still correctly reports not-fresh | 1 test | — | — | 🟢 |
| AC3 | The git-log command used is pure/injectable and unit-testable | 1 test | — | — | 🟢 |

---

## Test Data Strategy

**Source:** Synthetic — a mocked `execSync`/git-log-output injection, consistent with `scripts/lib/dod-handoff-reconciliation.js`'s `execGhPrList` injection pattern from this same feature.
**PCI/sensitivity in scope:** No

---

## Unit Tests

### getLastCodeCommitTimestamp excludes a commit that only touches the two bookkeeping paths

- **Verifies:** AC1
- **Precondition:** A mocked git-log invocation that, when given the pathspec exclusion for `.github/pipeline-state.json` and `.github/pipeline-timings.jsonl`, returns an earlier timestamp than the raw `git log -1` would (simulating: the bookkeeping-only commit is skipped, the function finds the prior real code commit instead).
- **Action:** Call `getLastCodeCommitTimestamp(mockedExecGitLog)`.
- **Expected result:** Returns the earlier (correct) timestamp, not the bookkeeping commit's timestamp.

### getLastCodeCommitTimestamp returns null gracefully when no code commit exists yet (e.g. first commit is bookkeeping-only)

- **Verifies:** AC1 (edge case)
- **Precondition:** A mocked git-log invocation that returns empty output for the excluded-pathspec query.
- **Action:** Call the function.
- **Expected result:** Returns `null` (or equivalent), does not throw.

### getLastCodeCommitTimestamp still finds a real code commit when one exists after the record

- **Verifies:** AC2
- **Precondition:** A mocked git-log invocation where the excluded-pathspec query returns a real, later timestamp (simulating an actual code change after the record).
- **Action:** Call the function, then call `isFresh` with that result as `lastCommitTimestamp`.
- **Expected result:** `isFresh` correctly returns `false` — AC2 is not weakened by the fix.

### getLastCodeCommitTimestamp is injectable and does not require real git state to test

- **Verifies:** AC3
- **Precondition:** None — this test simply confirms the function accepts an injected executor parameter, defaulting to the real `git log` invocation only when not provided.
- **Action:** Call the function with a mock executor.
- **Expected result:** The mock is called instead of real `execSync`; no real git process is spawned during the test.

---

## Out of Scope for This Test Plan

- Testing the real, non-mocked git invocation against actual repo history (that remains an integration-level concern verified by live usage, same as the rest of this module).

---

## Test Gaps and Risks

None identified beyond the already-accepted gap that `isFresh`'s own comparison logic (unchanged by this fix) is unit-tested with synthetic timestamps, not live git state.
