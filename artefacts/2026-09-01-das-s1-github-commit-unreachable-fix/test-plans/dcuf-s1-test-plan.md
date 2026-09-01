## Test Plan: Move das-s1's GitHub-commit dual-write to the point where a stage actually first completes

**Story reference:** artefacts/2026-09-01-das-s1-github-commit-unreachable-fix/stories/dcuf-s1-move-github-commit-to-real-completion-point.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-01

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Connected-repo turn completion -> commits via commitArtefact + local disk | 1 test | — | — | — | — | 🟢 |
| AC2 | Commit failure -> _stageDone unset, no completeStage, SSE error event | 1 test | — | — | — | — | 🟢 |
| AC3 | Repo-less/resolution-failure -> unchanged behaviour | 1 test | — | — | — | — | 🟢 |
| AC4 | Revision (existing completedStages entry) -> no commit attempted | 1 test | — | — | — | — | 🟢 |
| AC5 | das-s1 suite unmodified, still fully passing | — | 1 full-file run | — | — | — | 🟢 |
| AC6 | sstr-s1/ssdo-s1/wsap-s1/srar-s1 suites unmodified, still fully passing | — | 4 full-file runs | — | — | — | 🟢 |

---

## Coverage gaps

None. `handlePostTurnStreamHtml` already has an established direct-invocation test harness (used by `alrf-s8`, `wsap-s1`, `srar-s1` this session) via `_setHtmlSession`/`setSkillTurnExecutorStreamAdapter`/`_getHtmlSession`, combined with `export-data-source.js`'s `setDbPool` and `artefact-commit-writer.js`'s `setArtefactCommitAdapter` (both already exercised by `das-s1`'s own test file) — no new test infrastructure needed.

---

## Unit Tests

### connectedRepoTurnCompletionCommitsToGitHubAndDisk

- **Verifies:** AC1
- **Precondition:** A journey-linked session (`journeyId` set, no `_stageDone`), a mock DB pool resolving the journey's product to a connected repo (`owner: 'acme', repo: 'widgets'`), a mock `commitArtefact` adapter recording calls.
- **Action:** Drive one turn through `handlePostTurnStreamHtml` producing an artefact block.
- **Expected result:** `commitArtefact` called exactly once, with the same `artefacts/<slug>/<stage>.md` path as the local disk write; the local disk file also exists with matching content (dual-write, not a replacement).
- **Edge case:** Yes — this is the actual gap the story closes (previously never called at all in this flow).

### commitFailureLeavesStageDoneUnsetAndSurfacesError

- **Verifies:** AC2
- **Precondition:** Same as above, but the mock `commitArtefact` adapter throws.
- **Action:** Drive one turn through `handlePostTurnStreamHtml`.
- **Expected result:** `session._stageDone` is not `true` after the call; `_journeyStore.completeStage` was never invoked (no `completedStages` entry for this stage); the SSE stream contains an `error` event with an actionable message; the response ends.
- **Edge case:** Yes — matches `das-s1`'s own AC2 contract, now actually reachable.

### repoLessProductUnchangedBehaviour

- **Verifies:** AC3
- **Precondition:** Same journey-linked session, but the mock DB pool has no matching journey/product row (mirrors `das-s1`'s own `noConnectedRepo_localDiskWriteOnlyUnchanged` fixture) so `ownerRepoForFeature` throws `ExportNotFoundError`.
- **Action:** Drive one turn through `handlePostTurnStreamHtml`.
- **Expected result:** `commitArtefact` is never called; `session._stageDone` becomes `true`; `completeStage` runs normally; no `error` event is emitted; local disk write proceeds as before.
- **Edge case:** No — regression guard, matches `das-s1`'s own AC4.

### revisionSkipsCommitAttempt

- **Verifies:** AC4
- **Precondition:** A journey whose `completedStages` already has an entry for this session's `skillName` (a revision scenario) before the turn runs, with a connected-repo mock pool in place.
- **Action:** Drive one turn through `handlePostTurnStreamHtml` producing a revised artefact.
- **Expected result:** `commitArtefact` is never called for this revision turn (only first-completion attempts a commit) — matches `das-s1`'s own explicitly declared out-of-scope exclusion.
- **Edge case:** Yes.

### dasS1SuiteUnaffected

- **Verifies:** AC5
- **Precondition:** None.
- **Action:** `node tests/check-das-s1-commit-artefact-git-fallback.js`.
- **Expected result:** All existing tests still pass, unmodified — confirms `journey.js`'s own mechanism is untouched.
- **Edge case:** No — regression guard.

### thisSessionsOtherSkillsJsStoriesUnaffected

- **Verifies:** AC6
- **Precondition:** None.
- **Action:** `node tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js`, `node tests/check-ssdo-s1-sse-client-disconnect-logging.js`, `node tests/check-wsap-s1-story-scoped-artefact-paths.js`, `node tests/check-srar-s1-idempotent-turn-reconnect.js`.
- **Expected result:** All four still pass in full, unmodified.
- **Edge case:** No — regression guard.

### fullSuiteRegressionUnaffected

- **Verifies:** Implicit regression coverage.
- **Precondition:** None — full suite.
- **Action:** `node scripts/run-all-tests.js`.
- **Expected result:** Same pass count as pre-change baseline plus the new tests above; zero new failures.
- **Edge case:** No.

---

## Integration Tests

None beyond the unit-level coverage above — this is a same-process, same-function change; the full-file regression runs above serve as the integration check against every other story that touches this function.

---

## NFR Tests

None beyond what's already covered by `das-s1`'s own NFR tests for the identical underlying adapters (latency, commit-author identity) — this story reuses those adapters unchanged, so their guarantees carry over without new tests.

---

## Out of Scope for This Test Plan

- Live-staging/production re-verification that a real feature's stages now commit to GitHub — deferred to the operator's own post-merge smoke check (create or complete a real stage on a repo-connected product and confirm it appears on GitHub), since the underlying logic is fully covered by unit tests against the real function.
- Any test for git-fallback reads (`handleGetJourneyStageView`) — untouched by this story, already covered by `das-s1`'s own AC3/AC5 tests.

---

## Test Gaps and Risks

None.
