# AC Verification Script: Sweep fragile wall-clock NFR budgets and re-tune run-all-tests.js's concurrency cap

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s1-nfr-budget-sweep-concurrency-retune.md
**Technical test plan:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s1-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. Close other heavy applications so timing readings are clean (same requirement as `tfhc-s9`'s own Scenario 4).

**Reset between scenarios:** None needed.

---

## Scenarios

### Scenario 1: All 4 files were genuinely investigated; 2 needed no fix, 2 are formally deferred

**Covers:** AC1

**REVISED (2026-11-01, Task 2 investigation — see decisions.md and the story's own AC1 resolution note):** The original premise (all 4 files pass reliably at a new, higher cap) did not hold — no safe cap increase was found. `cat-s4` and `bri-s2.2` never failed at any tested concurrency and need no fix. `rb-s3` and `cat-s1` were deferred via AC5 RISK-ACCEPT (see Edge case below) — they are expected to keep occasionally flaking, same as before this story.

**Steps:**
1. Run `npm test` 5 times in a row.
2. Each time, check the failed-files list.

**Expected outcome:**
> `check-cat-s4-features-page-integration.js` and `check-bri-s2.2-neon-staging-branch.js` never appear as failed in any of the 5 runs. `check-rb-s3-harness-agnostic-instructions.js` and `check-cat-s1-core-trace-builder.js` may appear intermittently — that is the expected, accepted outcome (see decisions.md's AC5 RISK-ACCEPT entries for both), not a failure of this verification.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The concurrency cap is confirmed empirically optimal at its current value

**Covers:** AC2

**REVISED (2026-11-01, Task 2 investigation):** The original premise (the cap goes up) did not hold. AC2 is satisfied instead by a genuine empirical confirmation that the current value is already the highest stable one — no numeric increase.

**Steps:**
1. Run `node -e "console.log(require('./scripts/run-all-tests.js').getPoolConcurrency())"`.
2. Compare the printed number to `node -e "console.log(Math.max(1, Math.ceil(require('os').cpus().length / 3)))"` (the pre-story formula).

**Expected outcome:**
> The two numbers are equal — the cap is unchanged, confirmed stable by the real investigation logged in decisions.md rather than by a numeric increase.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Nothing else broke

**Covers:** AC3

**REVISED (2026-11-01):** Trivially satisfied by Scenario 2's own resolution — since the cap is unchanged, there is no new cap to introduce a new failure. Still worth confirming directly.

**Steps:**
1. Run `npm test` 3 times.
2. Compare the failed-files list each time against the known baseline: the pipeline-state-integrity flag ([C3]), the pcr-s1 flake, and `rb-s3`/`cat-s1` (now formally deferred, not just "occasional" — see Scenario 1/Edge case).

**Expected outcome:**
> No file outside that known list shows up as failed, in any of the 3 runs.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The real GitHub Actions job duration stays flat (not regressed) 🔴

**Covers:** AC4

**REVISED (2026-11-01):** The original premise (the job gets faster) does not hold given Scenario 2's resolution — with no cap change, there is no mechanism for a real reduction. AC4 is logged as NOT met as originally written (a genuine negative result — see the story's own AC4 resolution note and decisions.md). This scenario is now a flat-not-regressed check, not an improvement check.

**Steps:**
1. Once this story's own PR is open, run `gh pr checks <PR number>` to find the "Lint, typecheck, test, build" job's run ID.
2. Run `gh api repos/heymishy/skills-repo/actions/jobs/<job id> --jq '.steps[] | select(.name == "Unit test chain")'` to get its start/end time.
3. Compare the duration to 124 seconds (the time recorded before this story).

**Expected outcome:**
> The new duration is approximately 124 seconds (no meaningful regression) — not less than 124 seconds, since no cap change was made.

**Result:** [ ] Pass  [ ] Fail
**Notes:** Marked 🔴 — a real timing measurement that can vary with load, not an automatic CI check. A duration noticeably *worse* than 124s would be a real regression worth investigating (this story's diff is test-tooling only, so none is expected); a duration similar to or even on the faster side of 124s due to normal CI variance both count as Pass.

---

### Edge case: If a fix would make an NFR meaningless, it gets deferred instead of forced through

**Covers:** AC5

**Steps:**
1. Open `artefacts/2026-11-01-fixture-hardening-fast-follows/decisions.md`.
2. Check whether any entry says a file's fix was deferred because a safe widen wasn't possible.

**Expected outcome (REVISED 2026-11-01):**
> Two such entries exist: `rb-s3` (no safe widen exists at any tested concurrency above 3) and `cat-s1` (a safe widen exists in isolation, but is a no-op since the cap isn't moving). Both name the file and the reason clearly.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 🔴 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
