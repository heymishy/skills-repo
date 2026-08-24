## Test Plan: egsv-s1 — Report environment-gated skips separately from passes

**Story reference:** `artefacts/2026-08-24-env-gated-skip-visibility/stories/egsv-s1-report-environment-gated-skips-separately-from-passes.md`
**Test file:** `tests/check-egsv-s1-env-gated-skip-visibility.js`

This story modifies existing test files' internal counters rather than adding new externally-observable behaviour, so the test approach is a content-assertion pattern (same family as `check-s3fw-s1`/`check-vtc-s1`): read each of the 3 target files' source text and assert the specific `passed++`/`pass(name)`-on-skip anti-pattern has been replaced with `skipped++`, and that each file's final summary line reports the skip count distinctly, using a `norm()` whitespace-collapse helper for tolerance to incidental formatting.

### Tests

**T1 — p35SkipsAreTrackedSeparately (AC1)**
Read `tests/check-p3.5-validate-trace.js`. Assert the two `pwsh not available` skip blocks no longer call `pass(name)` — assert `skipped++` (or equivalent) appears in both blocks instead. Assert `skipped` is declared and initialised near `passed`/`failed`.

**T2 — p35SummaryReportsSkipCount (AC1)**
Assert the file's final summary `console.log` line contains a conditional skip-count fragment (e.g. `skipped > 0` ternary) mentioning `skipped` and `pwsh`.

**T3 — enfSecondLineT6TrackedSeparately (AC2)**
Read `tests/check-p4-enf-second-line.js`. Assert the T6 skip block (`bash not available on this platform`) no longer does bare `passed++` — assert a `skipped` increment instead. Assert `skipped` is declared near the top-level `passed`/`failed` declarations.

**T4 — enfSecondLineSummaryReportsSkipCount (AC2)**
Assert the file's closing `Results:` summary line contains a conditional skip-count fragment mentioning `skipped` and `bash`.

**T5 — vtpS1BlockSkipsTrackedSeparately (AC3)**
Read `tests/check-vtp-s1-validate-trace-consolidation.js`. Assert both `skipped (bash/python3 not usable...)` and `skipped (pre-change baseline cannot run...)` blocks no longer do `passed += 1` — assert `skipped +=` instead. Assert `skipped` is declared near `passed`/`failed`.

**T6 — vtpS1SummaryReportsSkipCount (AC3)**
Assert the file's final `console.log` summary line contains a conditional skip-count fragment mentioning `skipped`.

**T7 — exitCodeLogicUnchangedAcrossAllThree (AC5)**
For each of the 3 files, assert the `process.exit(failed > 0 ? 1 : 0)` (or equivalent `process.exitCode = failed > 0 ? 1 : 0`) still gates only on `failed`, never on `skipped` — a regression here would silently turn accepted environment skips into suite failures.

**T8 — passIncrementSitesUnrelatedToSkipUnchanged (AC4, non-regression)**
Spot-check that the non-skip `pass(...)`/`assert(...)` call sites elsewhere in each of the 3 files (the genuine assertions, not the skip paths) are still present and unmodified — proves this story only touched the 5 identified skip sites, not the surrounding test logic.

### Out of scope for this test plan

Actually spawning the 3 files under a real `bash`-unavailable / `pwsh`-unavailable environment is not attempted — this machine has both available, and simulating their absence (e.g. via `PATH` manipulation) risks destabilising the rest of the suite's own use of `bash`/`pwsh` mid-run. Content-assertion against the source is sufficient to verify the counting/reporting logic is correct by inspection, consistent with this repo's established pattern for verifying conditional/environment-dependent code paths without needing to fabricate the environment.
