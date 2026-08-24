## Story: Report environment-gated skips separately from passes in the test suite

**Epic reference:** none (short-track, single story)
**Discovery reference:** none (short-track — see `CLAUDE.md` short-track flow)
**Benefit-metric reference:** none (short-track)
**Domain:** pipeline-infrastructure / test-harness-integrity

## User Story

As an operator running `npm test` on Windows (or any environment missing `bash`, `python3`, or `pwsh`)
I want environment-gated skips to be counted and reported as a distinct outcome, never folded into the passed count
So that a green local test run cannot mask assertions that never actually executed

## Benefit Linkage

This closes item #5 of the 7-item ranked backlog surfaced during the 2026-08-24 capture-log sweep ("Windows-gated `.sh` tests give false local confidence"). Three test files (`tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-second-line.js`, `tests/check-vtp-s1-validate-trace-consolidation.js`) currently increment the `passed` counter when `bash`, `python3`, or `pwsh` is unavailable on the running machine, rather than tracking the skip separately. Because `scripts/run-all-tests.js` treats a file as green purely on process exit code, and each of these files' own numeric summary line folds skips into `passed`, an operator running the suite in an environment missing one of these binaries sees an identical-looking "all passed" result whether or not the underlying `validate-trace.sh`/`validate-trace.ps1` behaviour was actually exercised. This is exactly the false-confidence failure mode this story closes — bringing these 3 files in line with the existing correct pattern already used by `tests/check-assurance-gate.js` (a `skipped` counter, reported distinctly in the summary line, that does not count toward `failed` and does not inflate `passed`).

## Architecture Constraints

- Do not modify `scripts/run-all-tests.js` — it already inherits child stdio (`stdio: 'inherit'`), so per-file skip lines are already visible in a full local run; the defect is confined to each file's own internal counter, not the harness.
- Do not change exit-code semantics — an environment-gated skip must continue to NOT fail the suite (skipping is an accepted, intentional behaviour in this codebase per the existing `check-assurance-gate.js` precedent and the `check-p4-dist-*`/`check-p4-spike-*` family of skip sites that are out of scope for this story).
- Follow the exact reporting shape already established in `tests/check-assurance-gate.js` line 735: `<passed> passed, <failed> failed, <skipped> skipped (<reason>)` — do not invent a new format.
- Out of scope: the broader family of non-platform skip sites (`check-p4-dist-install.js`, `check-p4-dist-no-commits.js`, `check-p4-dist-registry.js`, `check-p4-dist-upstream.js`) that skip on "not exported" / "fixture-shape" grounds rather than platform/binary availability — these are a different category (API-shape skip, not environment-gated skip) and were confirmed during discovery to have the identical `passed++`-on-skip shape, but are noted as a follow-up candidate, not fixed here, to keep this story bounded to the specific "Windows-gated" finding it was ranked for.

## Dependencies

None. Independent of `s3fw-s1` and `vtc-s1` (both already merged/in-flight as of this story's creation).

## Acceptance Criteria

**AC1**
Given `tests/check-p3.5-validate-trace.js` runs in an environment where `pwsh` is not on PATH
When the two `pwsh`-gated tests (`ps1-exits-0-on-valid-repo-with-ci-flag`, `ps1-exits-nonzero-on-missing-required-field`) are skipped
Then each skip increments a `skipped` counter (not `passed`), and the file's final summary line includes `<N> skipped (pwsh unavailable)` when `skipped > 0`

**AC2**
Given `tests/check-p4-enf-second-line.js` runs in an environment where `bash` (or a required script dependency such as `python3`) is unavailable
When T6 is skipped
Then the skip increments a `skipped` counter (not `passed`), and the file's final summary line includes `<N> skipped (bash unavailable)` when `skipped > 0`

**AC3**
Given `tests/check-vtp-s1-validate-trace-consolidation.js` runs in an environment where `bash`/`python3` are unavailable
When the AC1/AC2/AC3 block-skip and the AC1 baseline-comparison skip fire
Then each fires as a `skipped` increment (not `passed`), and the file's final summary line includes `<N> skipped (bash/python3 unavailable)` when `skipped > 0`

**AC4**
Given any of the three files runs in an environment where the required binary IS available (the normal case, including CI)
When the full test file runs
Then behaviour is unchanged — the same assertions run and the same `passed`/`failed` outcome as before this story, byte-for-byte

**AC5**
Given the full local suite (`npm test`) runs to completion in either environment (binary present or absent)
When the run finishes
Then the overall suite exit code is unchanged by this story (skips still do not fail the suite) — this story is reporting-only, not a policy change on whether skipping is acceptable

## Out of Scope

- `check-p4-dist-install.js`, `check-p4-dist-no-commits.js`, `check-p4-dist-registry.js`, `check-p4-dist-upstream.js`, `check-p4-nta-standards-inject.js`, `check-p4-spike-*.js` — API-shape / verdict-conditional skips, not platform/binary-availability skips. Same underlying `passed++`-on-skip shape, confirmed present, deliberately not touched here to keep this story bounded to the specific "Windows-gated" finding.
- Any change to `scripts/run-all-tests.js`'s aggregate summary (it does not parse per-file stdout today; teaching it to do so is a materially larger change than this story's scope).
- Any change to CI behaviour — CI runners have `bash`/`python3`/`pwsh` available, so these skip paths are not expected to fire there; this story is about local-Windows-developer visibility.

## NFRs

None beyond the existing per-file test run-time budget (60s per spawned subprocess, already established by `check-p4-enf-second-line.js`'s own T6 timeout comment).

## Complexity Rating

**Complexity:** 1 (well understood — same pattern already proven correct in `check-assurance-gate.js`, being applied to 3 more files)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] Acceptance criteria are testable
- [x] No architectural decision requiring `decisions.md` (this is a reporting-only change to existing test files, not an architectural choice)
- [x] No CSS-layout-dependent ACs
- [x] No injectable adapter introduced
