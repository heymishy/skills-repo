# Contract Proposal - Fix the three test files that really fail in CI, then empty the baseline

**What will be built:**
- `scripts/check-pipeline-state-integrity.js`: C3 accepts a documented carve-out (`testPlan.knownFailing` positive integer plus non-empty `testPlan.knownFailingReason`, with `passing + knownFailing >= totalTests`); a `knownFailing` without a reason, or a shortfall, still fails C3; `passing + knownFailing > totalTests` fails under C2.
- `.github/pipeline-state.schema.json`: the two optional `testPlan` fields (both `testPlan` definitions).
- `.github/pipeline-state.json` (NOT in the PR): `tfhc-s1` gains `testPlan.knownFailing: 1` and `knownFailingReason` pointing at the RISK-ACCEPT entry in its `decisions.md`; `passing` stays 4. `tfhc-s1` is epic-nested, so per CLAUDE.md it is written on master with `node bin/skills advance` BEFORE the PR (the current checker ignores the new field, so master stays exactly as green or red as it is today); the PR then only adds the checker rule, schema fields and tests.
- `scripts/ci-audit-comment.js`: exported `isInsideRepo(sourcePath, repoRoot, pathApi)`; `sourceIntegrity` resolves against the repository root and calls it before reading.
- `tests/check-gpa-sc06-source-path-guard.js`: T3 only (the ordering check follows the helper call).
- `tests/check-bfl-s1-baseline-tightened.js`: T1 and the checker calls in T2 to T4 (temporary baseline).
- `tests/known-baseline-failures.json`: `files: []` and an updated note.
- `tests/check-bfl-s2-real-ci-failures.js` (new, T1 to T9).

**What will NOT be built:**
- No change to the `ep3-s1-regression.spec.js` test, to `journey.js` or any product code, to the baseline mechanism (`ci-test-regression-check.js`), to any other integrity check code, or any new npm dependency. No other story's recorded counts are touched.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1 to T4 | integration (script run in a temporary root) |
| AC2 | T5 | integration (real state and script) |
| AC3 | T6, T7 | unit (posix and win32 rules) |
| AC4 | T8 | integration |
| AC5 | T9, bfl-s1 tests, gpa files, ci-test-regression-check tests | integration |
| AC6 | CI run on the PR | live |

**Assumptions:** the integrity script resolves its root from `__dirname` and only needs `.github/pipeline-state.json` for the C-checks (read at lines 100 to 106 and 1246 to 1253); the checker script takes a baseline path as its second argument (read at lines 72 to 110 of `ci-test-regression-check.js`); the `testPlan` schema objects do not forbid extra properties (read at schema lines 136 to 144 and 178 to 185); `tests/check-gpa-sc06-source-path-guard.js` T3 slices 600 characters of `sourceIntegrity` (read in full); `tests/run-gpa-tests.js` runs the gpa checks and needs no edit (searched: it does not reference `sourceIntegrity`).

`schemaDepends: []`. **Estimated touch points:** Files: the nine listed above. Services: none. APIs: none.
