## Story: Fix the three test files that really fail in CI, then empty the baseline

**Epic reference:** None - short-track (bounded fixes to CI checks, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: the per-file CI artefact from run 43811318391 (867 files, 864 passed, 3 failed) and `artefacts/2026-11-16-ci-regression-review/` (the CI audit and its correction).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [ci, tests]
**Revised 2026-11-16:** the first draft planned to set `tfhc-s1`'s `testPlan.passing` to 5. Reading its DoD and decisions showed that count is honestly 4 of 5 (one end-to-end test genuinely fails because of a documented, unrelated product bug), so the fix is a documented carve-out in the check instead. See `decisions.md`.

## User Story

As **the operator**,
I want **the last three failing CI test files fixed honestly**,
So that **CI is fully green, the known-failures baseline is empty, and a red result always means something new**.

## Benefit Linkage

**Metric moved:** None formal. Removes the last tolerated failures (the baseline becomes empty) without falsifying any record.
**How:** (1) the pipeline-state integrity check C3 learns a documented carve-out for an accepted known failure instead of demanding a false count; (2) the source-path guard in `scripts/ci-audit-comment.js` becomes platform-independent so its adversarial vectors are rejected on Linux as well as Windows.

## Root causes

1. **`scripts/check-pipeline-state-integrity.js`, check C3.** Story `tfhc-s1` is merged with `testPlan.passing` 4 below `totalTests` 5. The 4 is correct: `tests/e2e/ep3-s1-regression.spec.js` fails for a pre-existing product bug (regressing a journey back lands on a `discovery` session instead of `definition`; `handlePostJourneyRegress` / `handleGetJourneyResume` in `src/web-ui/routes/journey.js`), recorded as a RISK-ACCEPT in `artefacts/2026-10-30-test-fixture-hardening-continuation/decisions.md` which already named the check's missing carve-out as the gap. That spec is not run in CI (CI runs only a1 to a4, dsh-s4 and b1 specs), so the bug is also unguarded; it is a separate story (`rgs-s1`, not in scope here).
2. **`tests/check-gpa-sc06-source-path-guard.js` T2 (and `tests/run-gpa-tests.js`, which runs it).** `sourceIntegrity` checks `path.resolve(sourcePath).startsWith(repoRoot + path.sep)`. On Linux a backslash is an ordinary filename character, so two of the six adversarial vectors (`..\..\.\Windows\System32\config\SAM`, `C:\Windows\System32\config\SAM`) resolve to names inside the repo and are not flagged; on Windows they are, so the test passes locally and fails in CI. The guard also resolves against the current directory rather than the repository root.

## Architecture Constraints

- **Carve-out is explicit and documented, never silent.** C3 accepts `passing + knownFailing >= totalTests` only when `testPlan.knownFailing` is a positive integer AND `testPlan.knownFailingReason` is a non-empty string (the reference to the accepted-risk entry). `passing` is never inflated. A new rule rejects `passing + knownFailing > totalTests` (over-count, reported under the existing C2 code).
- **Schema:** the two new optional fields are added to both `testPlan` definitions in `.github/pipeline-state.schema.json` (neither sets `additionalProperties: false`, so existing data is unaffected).
- **Guard:** the check is extracted to a small exported helper `isInsideRepo(sourcePath, repoRoot, pathApi)` (pathApi defaults to Node's `path`), so the Linux and Windows rules can both be tested on any machine. It normalises backslashes to `/`, rejects a leading drive letter (`C:`), resolves against `repoRoot` (not the current directory), and keeps the existing `startsWith(repoRoot + sep)` containment test. `sourceIntegrity` calls it before any `readFileSync` (the existing test T3 for that ordering is updated to look for the helper call).
- **Baseline:** when this merges `tests/known-baseline-failures.json` has `files: []`; the bfl-s1 stale-entry rule enforces that the three entries leave in this same PR. `tests/check-bfl-s1-baseline-tightened.js` is updated: T1 asserts the baseline is empty and T2 to T4 use a temporary baseline of the three names, so the stale-entry and new-regression behaviours stay tested.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; platform change policy (scripts, tests and `.github` schema change by pull request); no other Active ADR engaged. Zero new npm dependencies.

## Dependencies

- **Upstream:** `bfl-s1` (the baseline lists exactly these three). Merged.
- **Related, not in scope:** `rgs-s1` (fix the regress-back bug and put its spec in CI).

## Acceptance Criteria

**AC1:** Given the integrity check, When a merged story records `knownFailing` N with a non-empty `knownFailingReason` and `passing + knownFailing >= totalTests`, Then C3 passes; When `knownFailing` is set without a reason, or `passing + knownFailing < totalTests`, Then C3 fails; When `passing + knownFailing > totalTests`, Then C2 fails.

**AC2:** Given the real `pipeline-state.json`, When `tfhc-s1` is read, Then `passing` is still 4, `knownFailing` is 1 and `knownFailingReason` names the RISK-ACCEPT in its `decisions.md`; and `node scripts/check-pipeline-state-integrity.js` exits 0.

**AC3:** Given the six adversarial vectors (`../../etc/passwd`, `../../../etc/passwd`, `..\..\.\Windows\System32\config\SAM`, `/etc/passwd`, `C:\Windows\System32\config\SAM`, `artefacts/../../../etc/passwd`), When `isInsideRepo` is called with Linux (`path.posix`) rules and with Windows (`path.win32`) rules, Then all six are rejected under both, and valid in-repo paths (`README.md`, `scripts/ci-audit-comment.js`, `artefacts/a/b.md`) are accepted under both.

**AC4:** Given a different working directory, When `sourceIntegrity('README.md', null)` is called, Then it returns the em dash (not flagged); and the six vectors still return `{ traversal: true, sanitisedPath: '[REDACTED]' }` from the real function on the current platform.

**AC5:** Given the baseline, When this merges, Then `files` is empty, `check-gpa-sc06-source-path-guard` (T2 unchanged, T3 updated) and `run-gpa-tests` pass, `ci-test-regression-check` against a log with no failures prints "0 file(s) currently failing, 0 in known baseline" and exits 0, and a log naming any failing file exits 1.

**AC6 (live, CI):** Given this PR's CI run on Linux, When "Lint, typecheck, test, build" completes, Then the regression check line reads "0 file(s) currently failing" and "no new regressions", with no stale-entry line.

## Out of Scope

- Fixing the regress-back product bug or adding its spec to CI (`rgs-s1`).
- Any other test; the baseline mechanism beyond the bfl-s1 tests that read it; the local-only failures that need a working bash on Windows.

## NFRs

- **Security:** the guard becomes stricter or equal on every platform; no vector that was rejected before is accepted now (tests cover all six on both rule sets).
- **Honesty:** no record is edited to make a check pass; the carve-out requires a written reason.
- **Performance:** no measurable change.

## Complexity Rating

**Rating:** 2 - a checker rule, a schema field, a small guard refactor and one baseline test change. **Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
