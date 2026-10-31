## Story: Parallelize scripts/run-all-tests.js's sequential child-process execution

**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
**Domain:** [testing]

## User Story

As a **developer or AI coding agent running the inner loop**,
I want to **`node scripts/run-all-tests.js` to run its discovered test files concurrently instead of one at a time**,
So that **the full-suite feedback loop (today 816 files, 485063ms / ~8m05s sequential, confirmed fresh 2026-10-31) takes substantially less wall-clock time without losing any pass/fail signal**.

## Benefit Linkage

**Metric moved:** `scripts/run-all-tests.js` wall-clock runtime (m10)
**How:** Running child processes concurrently, bounded by a fixed worker limit, reduces total wall-clock time roughly in proportion to available cores while keeping the aggregate pass/fail result and exit code identical to today's sequential run — directly moving the one remaining metric this epic's own spike (`tfhc-s6`) and precondition story (`tfhc-s8`) explicitly unlocked but did not itself implement.

## Architecture Constraints

None identified — checked against `.github/architecture-guardrails.md`. This story touches only `scripts/run-all-tests.js` (test tooling), no `src/` production code path.

## Dependencies

- **Upstream:** `tfhc-s8` must be DoD-complete — this story consumes its closed precondition (0 of 41 `handlePostTurnStreamHtml`-calling files left unstubbed for the real `git commit` adapter, confirmed via `scripts/check-skill-turn-git-commit-stubbing.js`). Confirmed: `tfhc-s8` reached DoD 2026-10-31, PR #1047 merged.
- **Downstream:** None named yet.

## Acceptance Criteria

**AC1:** Given the full discoverable test file set returned by `getAllTestFiles()` (816 files as of 2026-10-31), When `node scripts/run-all-tests.js` is run under the new concurrent implementation, Then the aggregated `failedFiles` list and the process exit code are identical to the current sequential run's own list and exit code for the same file set — no false pass, no false fail, and no failure silently dropped from the summary.

**AC2:** Given a fixed concurrency limit set at implementation time (grounded in the reference dev machine's 8 logical CPUs, confirmed 2026-10-31 via `os.cpus().length`), When the runner executes the full file set, Then no more than that configured number of child test processes are running simultaneously at any instant — verified by a dedicated test that instruments concurrent-process count and asserts it never exceeds the limit.

**AC3:** Given two or more files run concurrently, When all files complete, Then the printed `[run-all-tests] N file(s) run, M failed, Xms` summary reports real wall-clock elapsed time for the whole run (start-to-finish), not a serial sum of each child's own individual duration.

**AC4:** Given the confirmed 2026-10-31 baseline of 816 files / 485063ms sequential, When the same file set is run under the new parallel implementation on the same reference machine, Then total wall-clock time is reduced by at least 40% (≤291000ms / ~4m51s) — a deliberately conservative target below the theoretical 8x ceiling, since node process-spawn overhead and any single long-running file both cap the real-world speedup.

**AC5:** Given a file that currently prints to the console via `stdio: 'inherit'`, When run under parallel execution, Then that file's complete stdout/stderr output is still attributable to it as a contiguous block (buffered per-child, flushed together once that child completes) — not interleaved mid-line with another concurrently-running file's output.

**AC6:** Given one file that hangs past the existing 120000ms per-file timeout, When run under the parallel runner, Then that file is killed and marked failed exactly as it is today under the sequential runner (timeout behaviour unchanged), and its hang does not block, delay, or reduce the concurrency available to the other files still running.

## Out of Scope

- The test-file discovery mechanism itself (`GRANDFATHER_LIST`, the `check-*.js` glob) — untouched; this story only changes how discovered files are *executed*, not which files are discovered.
- Any individual `check-*.js` file's own internal test logic or assertions — untouched. If parallel execution surfaces a pre-existing test-isolation bug in a specific file (e.g. an implicit assumption of exclusive filesystem/port access), that is logged as a separate finding, not fixed inside this story.
- CI workflow YAML changes (`.github/workflows/*.yml`) — CI already calls this same script, so it inherits the speedup automatically; any CI-specific concurrency tuning (e.g. a different limit for a smaller/larger CI runner) is a separate concern, not addressed here.
- A configurable concurrency override (CLI flag or environment variable) — this story ships a single fixed default grounded in the reference dev machine; making the limit operator-configurable is a candidate fast-follow, not bundled here.

## NFRs

- **Performance:** Full-suite wall-clock time on the confirmed 816-file / 485063ms baseline reduces by at least 40% (≤291000ms), measured by a timed run at `/definition-of-done`.
- **Security:** None identified — no new production code path, no new subprocess target beyond what already runs sequentially today; the git-commit-adapter collision risk this story depends on closing was already fully closed by `tfhc-s8`.
- **Accessibility:** N/A — no UI.
- **Audit:** N/A — no audit-relevant surface.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
