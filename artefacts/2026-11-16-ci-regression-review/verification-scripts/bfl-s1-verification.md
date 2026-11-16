# Verification script: bfl-s1 (baseline tightened)

Steps 1 to 5 are covered by `node tests/check-bfl-s1-baseline-tightened.js` and the full suite; step 6 needs the next real PR run.

1. T1: the baseline lists exactly the three CI-failing files and the note names bfl-s1 and bfl-s2.
2. T2: a failure in one of the 67 formerly tolerated files is a NEW regression (exit 1).
3. T3: a baseline entry that does not fail is a stale entry (exit 1).
4. T4: failures equal to the baseline exit 0.
5. T5 and the full suite: the two existing checker tests pass; only the known local-environment failures appear in a full local run (on a machine without a working bash).
6. **Live (after merge):** open the next PR's "PR Checks" run and read the Unit test chain log: it should say "3 file(s) currently failing, 3 in known baseline" and "no new regressions", with no "baseline file(s) now pass" block.
