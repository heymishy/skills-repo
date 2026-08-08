## Story: Remove check-md-3-adr.js's nested full-suite npm test recursion

**Epic reference:** None — short-track (bounded refactor)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [platform/CI]

## User Story

As an **operator running `npm test` in this repo**,
I want **no single test file to re-run the entire test suite from inside itself**,
So that **the suite's total CI cost stops growing quadratically with its own file count, and other files' subprocess-timing checks stop being put at risk of resource contention**.

## Benefit Linkage

**Metric moved:** Direct CI-reliability fix (short-track, no formal benefit-metric artefact) — found during the same audit (2026-08-08) that produced `vtp-s1` (`validate-trace.sh` consolidation) and `cas-s1` (`clean-local-test-artefacts.js` early-exit).

**How:** Direct source inspection of `tests/check-md-3-adr.js`'s `T4` (lines 93–131) confirms it calls `execSync('npm test', { cwd: ROOT, stdio: 'pipe' })` — i.e. it re-runs the **entire, ever-growing `check-*.js` suite** as a subprocess from inside a single test file that `scripts/run-all-tests.js` itself discovers and runs as part of that same suite. A guard (`process.env.npm_lifecycle_event === 'test'`, line 98) is meant to skip this when already inside a real `npm test` invocation, and direct testing during this audit confirmed the underlying mechanism is sound (`spawnSync` correctly inherits `npm_lifecycle_event` when set). However, this repo's own prior investigation (`tests/check-tst-s1-baseline-triage.js`, lines 127–132) documents `check-md-3-adr.js` as a **permanent, un-fixable baseline entry** specifically because "`scripts/run-all-tests.js`'s own 120s per-file `spawnSync` timeout always kills its nested npm test check before it can complete inside the aggregate suite" — meaning that even when the guard does correctly prevent recursion, the test's design is fragile by construction (dependent on exact env propagation through however many process layers CI's actual invocation chain has), and when it does recurse, the resulting full nested suite run has been separately, independently diagnosed as the confirmed cause of CPU-contention-driven flakiness in a different file (`check-p3.5-validate-trace.js`, per `triage-report.md`'s AC3 section) across three past PRs (#489/#490/#492), where a previous mitigation attempt (doubling that file's own timeout) did not resolve it.

**The underlying design flaw, independent of the guard's reliability:** `T4` asks "does the whole suite still pass after this ADR was added" — a question the *enclosing* CI job (`Lint, typecheck, test, build`, which runs `npm test` once and gates the PR on its exit code) already answers definitively, without any nested recursion. No other test file in this suite re-verifies the whole suite's health from inside itself; every other file scopes its assertions to its own specific concern. `T4` is structurally redundant with the CI job that contains it, and that redundancy is the actual root cause — not a guard bug to patch.

## Architecture Constraints

- **T1–T3 (the actual ADR-015 content checks) are untouched.** This story only removes `T4`'s nested full-suite execution; the file's real purpose (verifying `architecture-guardrails.md` contains the ADR-015 write-up with the required fields) is unaffected.
- **No change to `scripts/run-all-tests.js`, `scripts/ci-test-regression-check.js`, or `tests/known-baseline-failures.json`'s handling of other files.** This story's scope is the one file whose design causes the recursion.
- **`check-md-3-adr.js` must be removable from the accepted-baseline list as a direct consequence of this fix** — if `T4` is removed, the file must pass cleanly and unconditionally on every run, closing the historically-permanent baseline entry described in `check-tst-s1-baseline-triage.js`.
- **No D37/adapter concern:** this is not an injectable adapter — it is a single test file's internal assertion design.

## Dependencies

- **Upstream:** None. Independent of `vtp-s1` and `cas-s1` — same audit, different file, no shared code path.
- **Downstream:** `tests/check-tst-s1-baseline-triage.js`'s `FIXED_FILES`/permanent-baseline bookkeeping for this specific file becomes stale once this ships — that file's own comment (lines 127–132) should be updated to reflect the fix, or a follow-up note added, so the baseline-triage tooling doesn't keep describing a since-fixed file as permanently unfixable.

## Acceptance Criteria

**AC1:** Given `tests/check-md-3-adr.js` is run standalone (`node tests/check-md-3-adr.js`), When it executes, Then it completes without spawning any nested `npm test` (or `execSync`) subprocess, and all T1–T3 assertions still run and pass exactly as before.

**AC2:** Given `tests/check-md-3-adr.js` is run as part of the full suite via `node scripts/run-all-tests.js` (or `npm test`), When it executes, Then its own wall-clock time is a small, bounded fraction of a second (matching every other file-content-check test in this repo, not a multi-minute nested suite run), and it does not consume disproportionate CPU/IO relative to its neighbours in the sequential run order.

**AC3:** Given `tests/known-baseline-failures.json` and `tests/check-tst-s1-baseline-triage.js`'s historical documentation of this file as a permanent, un-fixable baseline entry, When this fix ships, Then `check-md-3-adr.js` is removed from any baseline/known-failure list it currently appears in, and the historical comment explaining why it "can never be removed from the baseline" is corrected or annotated to reflect that it has, in fact, been fixed.

**AC4:** Given the full `npm test` suite is re-run after this fix, When compared against the current baseline, Then no NEW regressions are introduced, and `check-md-3-adr.js` itself is no longer among either the "currently failing" or "new regression" lists in `scripts/ci-test-regression-check.js`'s output.

## Out of Scope

- **Fixing or hardening `check-p3.5-validate-trace.js`** (the file previously found to be starved by this recursion). If this fix resolves that file's flakiness as a side effect, that's a welcome bonus, but re-verifying or re-tuning that file's own timeout is not part of this story — it should be independently re-observed over subsequent CI runs, not assumed fixed.
- **Any other file's use of `execSync('npm test', ...)` or similar nested-suite patterns**, if any exist elsewhere in this repo — not found during this audit, but if discovered later, that would be a separate finding.
- **Rewriting `scripts/ci-test-regression-check.js`'s baseline-comparison logic itself.** Only the specific entry for this one file is affected.

## NFRs

- **Performance:** This IS the performance/reliability fix — removes an O(total-suite-size) cost from inside a single file that should cost O(1), and removes a documented resource-contention risk to sibling test files.
- **Security:** None identified.
- **Accessibility:** Not applicable (CI test file, no UI).
- **Audit:** Improves — a test file's runtime and resource footprint becoming predictable and bounded makes future audits of this class easier.

## Complexity Rating

**Rating:** 1 — deleting a redundant, structurally-flawed assertion block; T1–T3 are untouched and already well-understood.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
