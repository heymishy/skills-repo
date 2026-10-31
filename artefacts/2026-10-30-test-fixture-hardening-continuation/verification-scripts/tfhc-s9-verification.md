# AC Verification Script: Parallelize scripts/run-all-tests.js's sequential child-process execution

**Story reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s9-run-all-tests-parallelization.md
**Technical test plan:** artefacts/2026-10-30-test-fixture-hardening-continuation/test-plans/tfhc-s9-run-all-tests-parallelization-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the repo root.
2. No server needs to be running — this is a command-line and console-output check, not a live system check.

**Reset between scenarios:** None needed, except Scenario 4 which should be run on an otherwise-idle machine (close other heavy applications) to get a clean timing read.

---

## Scenarios

### Scenario 1: The test suite still reports exactly the same passes and failures as before

**Covers:** AC1

**Steps:**
1. Run `npm test`.
2. Look at the final summary line and the list of failed files, if any.

**Expected outcome:**
> The same set of files runs as before this story. The only failures listed are the same, already-known ones that were present before this story started (the pipeline-state-integrity flag, and the stray-local-artefact-dir flake in the trace validator) — no new or different file appears in the failed list, and no previously-failing file is missing from it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The runner never runs more files at once than its configured limit

**Covers:** AC2

**Steps:**
1. While `npm test` is running, open a second terminal.
2. Run a process-listing command (e.g. `tasklist | findstr node` on Windows, or `ps aux | grep node` on macOS/Linux) a few times in quick succession while the run is in progress.

**Expected outcome:**
> At no point do you see more `node` child processes running the test files than the number of CPU cores on the machine (confirm the core count with `node -e "console.log(require('os').cpus().length)"` — 8 on the reference machine this story was built against).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The suite finishes noticeably faster than before, not just "the same time with extra steps"

**Covers:** AC3

**Steps:**
1. Run `npm test` and note the final summary line, which prints the total elapsed time in milliseconds.

**Expected outcome:**
> The printed time is the real, observed clock time for the whole run — if you timed it yourself with a stopwatch, it matches. It is clearly less than the old sequential time (816 files, 485063ms / ~8 minutes 5 seconds, confirmed 2026-10-31) — not some older, unrelated serial-sum number.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The suite is at least 40% faster than before, measured on a quiet machine 🔴

**Covers:** AC4

**Steps:**
1. Close other heavy applications so the timing reading is clean.
2. Run `npm test` (or `node scripts/run-all-tests.js` directly) and time it (for example, in PowerShell: `Measure-Command { node scripts/run-all-tests.js }`; in bash: `time node scripts/run-all-tests.js`).
3. Compare the total time to the known "before" time of 485063 milliseconds (about 8 minutes 5 seconds), confirmed fresh on 2026-10-31 on the same kind of machine.

**Expected outcome:**
> The new total time is 291000 milliseconds (about 4 minutes 51 seconds) or less — at least 40% less than the "before" time. The pass/fail results reported are the same as Scenario 1 — nothing new fails just because it ran faster.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This scenario is marked 🔴 because it is a real-world timing measurement that can vary with machine load — it is not run as an automatic pass/fail check in CI (see the technical test plan's Coverage Gaps section). Run it on a quiet machine and re-run once if the first result looks unusually slow before recording a Fail.

---

### Scenario 5: Each file's own printed output stays together, instead of getting mixed up with another file's output

**Covers:** AC5

**Steps:**
1. Run `npm test` and watch the console output scroll by (or save it to a file and open that file afterward).
2. Pick any two files that printed multiple lines of their own output.

**Expected outcome:**
> Each file's own lines of output appear together, one after another, without a different file's line appearing in between. You should never see output that looks shuffled between two files, even though many files are now running at the same time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A file that hangs doesn't hold up the rest of the suite

**Covers:** AC6

**Steps:**
1. This scenario is best confirmed by reading the automated test for it (technical test plan, AC6 unit test) rather than reproducing a real hang in the full suite, since deliberately hanging a real file would require a throwaway change.
2. If you want to see it directly: temporarily edit one real test file to `while(true){}` forever (do not commit this), run `npm test`, and watch what happens — then revert the edit immediately afterward.

**Expected outcome:**
> After roughly 2 minutes (the existing 120-second per-file timeout, unchanged by this story), the hanging file is reported as failed/killed. The other files that were running at the same time finish normally and are not delayed waiting for the hanging one.

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
| Scenario 5 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
