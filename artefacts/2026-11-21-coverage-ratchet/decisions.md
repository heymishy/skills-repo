# Decisions: coverage ratchet (cvrt-s1)

## D1. Two independent floors now, one combined number later (2026-11-21)

**Context:** the browser suite's server coverage is already produced as a c8 summary in `e2e.yml`; the unit chain has no coverage. The two run in different jobs, so one combined percentage needs the raw V8 coverage of both uploaded, downloaded into a third job and merged by a c8 report over both temp directories.
**Decision:** measure the unit chain under c8 in its own job, keep the browser suite's measurement where it is, and give each suite its own floor in `tests/coverage-baseline.json`. A combined percentage is a follow-up.
**Rationale:** each suite's floor stops its own number from falling, which is the goal; each step is small and independently verifiable; a merge job adds a third job's wall time and a cross-job artefact dependency on every pull request for a figure whose first use is choosing where to add tests, not gating.
**Alternatives rejected:** merging raw coverage in a third job now (more moving parts than the guard it adds, and its value is reporting); a single absolute threshold such as 70% (the current number is 66.4% for the browser suite alone, so a threshold would fail every pull request, and a target is a goal to be chosen by the operator, not a guard); per-file floors (hundreds of files to baseline and constant churn on routine edits).

## D2. A 0.5 percentage-point tolerance, and the baseline read from the base branch (2026-11-21)

**Context:** the browser suite's coverage moves slightly with which specs ran and which branches a spec happens to take; a zero-tolerance floor would flag noise as a regression. The known-failures baseline already solves the "a pull request must not lower its own bar" problem by reading the file from the base branch (gic-s1).
**Decision:** a metric fails only when it is more than 0.5 percentage points below its baseline; the baseline is read from the base branch, so a pull request that edits its own copy is judged against the base branch's; a pull request that raises the baseline takes effect after it merges.
**Rationale:** the guard targets real losses (removed tests, a large untested addition), not rounding; reusing the existing pattern means no new trust rule to explain.
**Risk accepted:** a series of pull requests each lowering coverage by under 0.5 points can drift down (a "ratchet" that only locks in the recorded number). Mitigated by the operator re-recording the baseline upward when coverage improves, and by reviewing the number periodically; a tighter tolerance can be set once two weeks of real data show the noise.

## D3. Baselines are taken from the CI run, never from a developer machine (2026-11-21)

**Context:** coverage depends on platform (path handling, the server tests that only run on Linux or only on Windows) and on which checks pass.
**Decision:** the numbers in `tests/coverage-baseline.json` come from the pull request's own CI artefacts, recorded in a second commit, exactly as lane moves wait for CI evidence.

## D4. The unit suite counts never-loaded files (`--all`); the browser suite's measurement stays as it was (2026-11-21)

**Context:** by default c8 reports only files a process actually loaded. A new source file with no unit test is never loaded by the unit chain, so it would not lower the unit percentage, and the floor would not see the exact thing it exists to catch. A local measurement of the stored raw data showed the difference: 89.82% statements without `--all`, 87.17% with it (18 source files at 0%). The browser suite's c8 report (lpw-s1) has no `--all` and already feeds a number the operator and the per-spec coverage selection have used.
**Decision:** the unit chain runs under `c8 --all --include="src/**"`; the browser suite's existing report is not changed, and the ratchet is added after it as it stands.
**Rationale:** the unit floor is new, so there is no history to keep comparable and it should count unloaded files; the browser number has history, and changing its denominator would silently move a metric other work reads. The browser floor still guards against losing browser tests; new untested files are caught by the unit floor.
**Risk accepted:** the browser floor cannot see a new file that no browser test loads; recorded in the DoD. If wanted later, add `--all` to the browser report and re-record that baseline in the same pull request that says why.

**Operator go-ahead (2026-11-21, "OK do it 2 and 3" after the stand-back audit):** deliver the coverage ratchet end to end; investigate the `deploy-group` lock before choosing a change.
