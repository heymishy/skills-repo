## Test Plan: Consolidate validate-trace.sh's checks into a single Python pass

**Story reference:** artefacts/2026-08-08-validate-trace-perf/stories/vtp-s1-consolidate-validate-trace-checks.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-08

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Byte-identical report output before/after, full run | — | 1 test (golden-file diff) | — | — | — | 🟢 |
| AC2 | Reduced process-spawn count, measurably lower wall-clock | — | 1 test (spawn-count instrumentation) | — | Manual timing note in PR | — | 🟡 |
| AC3 | Each `--check <name>` mode produces identical verdict | — | 6 tests (one per check name) | — | — | — | 🟢 |
| AC4 | T6 sub-check still passes; margin documented | — | — | — | 1 manual re-run + PR note | — | 🟢 |

---

## Coverage gaps

**AC2 (🟡):** Wall-clock timing is inherently noisy (depends on machine load), so the automated assertion is process-spawn *count* (a deterministic proxy), not wall-clock time directly. The wall-clock improvement itself is reported as a manual observation in the PR description, not gated by an automated assertion — consistent with how NFR-performance items are typically evidenced in this repo (see: NFR sections elsewhere note "negligible/reduced" qualitatively). Not a blocking gap given AC1 already gates correctness and the spawn-count test gates the actual mechanism of the fix.

---

## Test Data Strategy

**Source:** Real repo state — `artefacts/`, `.github/pipeline-state.json`, `.github/trace-validation.yml` as they exist at implementation time. Golden-file capture: run the pre-change script once, save `trace-validation-report.json` as a fixture, then diff the post-change script's output against it.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Integration Tests

### validateTrace_fullRun_producesIdenticalReport_beforeAndAfter

- **Verifies:** AC1
- **Precondition:** Golden-file fixture captured from the pre-change script's `--ci` output on current repo state
- **Action:** Run the post-change `validate-trace.sh --ci` against the same repo state
- **Expected result:** `trace-validation-report.json`'s `passed`/`warnings`/`failures` arrays are identical (same members, same order or order-independent set-equality) to the golden fixture

### validateTrace_fullRun_spawnsAtMostOnePython3ProcessForSharedState

- **Verifies:** AC2
- **Precondition:** Instrument via a wrapper script or `strace`-equivalent (or, more simply, a temporary counting shim on `PATH` that logs each `python3` invocation to a file) around a full `validate-trace.sh` run
- **Action:** Run the full script once
- **Expected result:** At most 1 `python3` process is spawned for the purpose of loading `pipeline-state.json`/`trace-validation.yml` (down from 5+); `check_discovery_approved` spawns zero `grep` subprocesses per artefact directory (moved into the single Python pass)

### validateTrace_perCheckMode_matchesPreChangeVerdict (×6)

- **Verifies:** AC3
- **Precondition:** Golden verdicts captured per check name from the pre-change script (`schema_valid`, `discovery_exists`, `discovery_approved`, `test_plan_coverage`, `unresolved_blockers`, `no_eval_mode_artefacts`)
- **Action:** Run `validate-trace.sh --check <name>` for each name post-change
- **Expected result:** Exit code and recorded pass/fail messages match the golden verdict for that check name

## Manual Verification

### T6 re-run + margin note

- **Verifies:** AC4
- **Action:** Re-run `tests/check-p4-enf-second-line.js` after this change lands; note the observed `validate-trace.sh` wall-clock time in the PR description relative to T6's 60-second timeout
- **Expected result:** T6 passes; the PR description states the new margin (e.g. "now completes in ~Xs against a 60s timeout")
