## Story: Make clean-local-test-artefacts.js's bare-discovery scan early-exit instead of building a full file list per directory

**Epic reference:** None — short-track (bounded refactor)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [platform/CI]

## User Story

As an **operator running `npm test` in this repo**,
I want **the bare-discovery-directory scan to stay cheap regardless of how deep or numerous any single feature's artefact tree gets**,
So that **this check doesn't become the next `validate-trace.sh`-style unscaled-growth defect as `artefacts/` keeps growing**.

## Benefit Linkage

**Metric moved:** Direct efficiency fix (short-track, no formal benefit-metric artefact) — found during a broader audit (2026-08-08) triggered by diagnosing `validate-trace.sh`'s own growth-driven slowdown (see `artefacts/2026-08-08-validate-trace-perf/`).

**How:** Direct source inspection of `scripts/clean-local-test-artefacts.js` (`findBareDiscoveryDirs`, lines 41–56, calling `listFilesRecursive`, lines 72–85) confirms `listFilesRecursive` builds a **complete recursive file list** for every top-level directory under `artefacts/` just to test `files.length === 1` — i.e. "is this directory's only content a bare `discovery.md`." The function does not stop once it has found a second file; it walks the entire subtree first, then checks the length of the resulting array. This runs unconditionally on every `npm test` invocation via `tests/check-tdc-s1-clean-local-test-artefacts.js`'s third test case, which execs the real CLI against the real repo root — no fixture, no scoping. Cost is `O(total files across every artefacts/ subdirectory)`, not `O(directory count)`, and grows every session as feature folders accumulate `stories/`, `epics/`, `test-plans/`, `dor/`, `plans/`, `dod/`, `review/` subdirectories. Currently cheap (~0.8s measured directly against this repo's real `artefacts/` tree, 149+ top-level directories), but the same unbounded-growth shape as the `validate-trace.sh` defect already confirmed and being fixed in `vtp-s1`.

## Architecture Constraints

- **Preserve exact classification semantics.** A directory must still be classified as a "bare discovery.md directory" if and only if it contains exactly one file, and that file is named `discovery.md`. The fix changes only how quickly the answer is reached, not the answer itself.
- **Do not change `findTestTmpDirs` or `isTracked`.** Those functions are not implicated by this finding — `findTestTmpDirs` already does a single, unrecursed `readdirSync` at one level, and `isTracked`'s `git ls-files` subprocess only runs once per already-identified candidate (after the file-count check narrows the set), not once per total directory.
- **No D37/adapter concern:** this is not an injectable adapter — it is a pure filesystem-scanning function.

## Dependencies

- **Upstream:** None. Related to, but independent of, `vtp-s1` (`validate-trace.sh` consolidation) — same audit, same growth-shape defect class, different script.
- **Downstream:** None known. `tests/check-tdc-s1-clean-local-test-artefacts.js` is the only known caller/test of this code path.

## Acceptance Criteria

**AC1:** Given a directory containing exactly one file named `discovery.md` (at any depth via subdirectories, matching current recursive-search behaviour), When `findBareDiscoveryDirs` scans it, Then it is still classified as a bare-discovery candidate — behaviour unchanged from before this fix.

**AC2:** Given a directory containing 2 or more files (e.g. `discovery.md` plus a `benefit-metric.md`, or `discovery.md` plus a nested `stories/` folder with files in it), When `findBareDiscoveryDirs` scans it, Then the scan stops as soon as a second file is found — it does not continue walking the rest of that directory's subtree — and the directory is correctly excluded from candidates, same as before this fix.

**AC3:** Given the existing `tests/check-tdc-s1-clean-local-test-artefacts.js` test suite, When re-run after this fix, Then all existing tests still pass unchanged.

**AC4:** Given a synthetic directory tree with a deliberately large number of files (e.g. 500+ files nested several levels deep) that is NOT a bare-discovery candidate, When `findBareDiscoveryDirs` scans it, Then it demonstrably visits far fewer than 500 filesystem entries before concluding "not a candidate" (verified via an instrumented `fs.readdirSync` call counter in the test, not by timing alone).

## Out of Scope

- **Any change to what qualifies as "test cruft"** (the bare-discovery-directory and `test-tmp-*` shape definitions themselves) — this story only changes how efficiently the existing definition is evaluated.
- **Batching or removing the per-candidate `git ls-files` subprocess call in `isTracked`.** Not flagged as a scaling concern by the audit (it only runs against the narrow, already-filtered candidate set, not the full directory list), and changing it is unrelated to this story's specific finding.

## NFRs

- **Performance:** This IS the performance fix — target is early-exit at the 2nd file found, rather than a full recursive walk, for every directory that isn't actually a bare-discovery candidate.
- **Security:** None identified.
- **Accessibility:** Not applicable (CLI script, no UI).
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1 — a single function gets an early-exit condition; no behavioural ambiguity.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
