## Test Plan: Stop the skill-turn artefact auto-commit from firing real git commits during tests

**Story reference:** artefacts/2026-07-12-skill-turn-test-isolation/stories/stis-s1-guard-skill-turn-auto-commit.md
**Epic reference:** None — short-track
**Test plan author:** Copilot (autonomous, short-track)
**Date:** 2026-07-12

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Adapter wiring; no real execSync in test context | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Production default still fires the real commit (D37 distinction) | 2 tests | — | — | — | — | 🟢 |
| AC3 | Existing affected tests updated; zero new commits from each | — | 1 test per affected file (min. 6) | — | — | — | 🟢 |
| AC4 | Full suite run twice produces identical HEAD | — | 1 test | — | — | — | 🟢 |
| AC5 | Pre-existing failure count unchanged | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. Every AC is a mechanical git/process-behaviour check, testable via unit tests (mocked adapter) and integration tests (real `git rev-parse HEAD` before/after comparisons in a disposable temp git repo or the existing worktree pattern already used by `pcr-s1`'s own test suite). No browser/CSS/external-service dependency anywhere in this story.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved.
**PCI/sensitivity in scope:** No.
**Availability:** Available now — all test data (mock skill-turn session objects, a completed `ARTEFACT-START`/`ARTEFACT-END` fixture payload, temporary git repositories for the commit-count checks) is generated in setup/teardown.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mock completed-artefact skill-turn session object; a spy/stub adapter | Synthetic | None | Mirrors the existing D37 test pattern already used for `credits.js`/`posthog-flags.js` adapters in this codebase |
| AC2 | Same mock session, but with the adapter left at its default (unset) | Synthetic | None | Asserts the real `execSync` is still called by default — this test itself must run in a disposable temp repo, not this repo, to avoid the exact problem this story fixes |
| AC3 | The 6+ existing affected test files, unmodified assertions, only their skill-turn-invocation setup changes | Existing repo fixtures, extended with the stub adapter injection | None | |
| AC4 | A disposable git worktree/temp repo running the real full suite twice | Synthetic, created via `child_process` in test setup | None | Torn down after |
| AC5 | The documented pre-existing failure list (68-70 files, per `pcr-s1`'s decisions.md) | Existing repo state | None | Diff, not full re-derivation |

### PCI / sensitivity constraints

None.

### Gaps

None — all test data is available now and self-contained.

---

## Unit Tests

### U1 — setSkillTurnGitCommitAdapter() overrides the default git-commit behaviour

- **Verifies:** AC1
- **Precondition:** A mock completed-artefact skill-turn session (contains `---ARTEFACT-START---...---ARTEFACT-END---` in the assembled turn text).
- **Action:** Call `setSkillTurnGitCommitAdapter(spyFn)`, then invoke the handler's artefact-completion path with the mock session.
- **Expected result:** `spyFn` is called with the artefact path and commit message; no real `child_process.execSync` call for `git add`/`git commit` occurs (verified by spying on `child_process.execSync` itself and asserting it was never called with a `git` command during this test).
- **Edge case:** No.

### U2 — default adapter (no override) still performs the real git commit

- **Verifies:** AC2
- **Precondition:** No adapter override; a disposable temp git repository set as the effective repo root for this test only (via `CLAUDE_REPO_PATH`, not this real repo).
- **Action:** Invoke the handler's artefact-completion path with a mock completed session, `CLAUDE_REPO_PATH` pointed at the disposable temp repo.
- **Expected result:** A real commit appears in the disposable temp repo's `git log` afterward — proving the production default path is unchanged. This test must NEVER point at the real repo checkout.
- **Edge case:** Yes — this is the "adapter reset to production default" boundary case, deliberately isolated to a throwaway repo so a bug in this test itself cannot recreate the contamination this story fixes.

### U3 — stub adapter records the call without any side effect

- **Verifies:** AC1
- **Precondition:** Same as U1.
- **Action:** Call the stub adapter directly (not through the handler) with a sample path/message.
- **Expected result:** Returns/records without invoking `child_process` at all — a pure-function-style stub, matching this repo's own D37 stub conventions elsewhere (except stubs here intentionally do NOT throw, per AC2's documented rationale — see story).
- **Edge case:** No.

### U4 — the git-commit adapter call site is the only place execSync('git ...') is reachable from the artefact-completion path

- **Verifies:** AC1, AC2
- **Precondition:** Static inspection of `src/web-ui/routes/skills.js`'s artefact-completion block after the fix.
- **Action:** Grep the relevant function body for `execSync` calls.
- **Expected result:** Exactly one call site remains, and it is inside the adapter's default implementation, not inline in the handler — proving the refactor didn't just add a second path alongside the old one.
- **Edge case:** No.

---

## Integration Tests

### IT1 — running check-wusl1-chat-streaming.js (and every other affected file, min. 6) standalone produces zero new commits

- **Verifies:** AC1, AC3
- **Components involved:** Each affected test file, `child_process`, git.
- **Precondition:** A clean worktree (or this repo, since after the fix this becomes safe) with a known `git rev-parse HEAD`.
- **Action:** Record `git rev-parse HEAD`, run the test file, record `git rev-parse HEAD` again.
- **Expected result:** HEAD is identical before and after, for every one of the 6+ affected files (the exact list to be finalized by the coding agent's own exhaustive search per the story's AC3 instruction) — proving the fix actually closes the gap for every currently-known trigger, not just `check-wusl1-chat-streaming.js`.

### IT2 — running the full suite twice in a row produces an identical HEAD

- **Verifies:** AC4
- **Components involved:** `scripts/run-all-tests.js`, `child_process`, git.
- **Precondition:** A clean worktree with a known `git rev-parse HEAD`.
- **Action:** Record HEAD, run `node scripts/run-all-tests.js`, record HEAD, run it again, record HEAD a third time.
- **Expected result:** All three HEAD values are identical.

### IT3 — the full-suite failure count and failing-file list are unchanged by this fix

- **Verifies:** AC5
- **Components involved:** `scripts/run-all-tests.js`, the documented pre-existing baseline failure list.
- **Precondition:** The pre-existing baseline failure list from `pcr-s1`'s decisions.md (68-70 files, as last confirmed by `bri-s2.5`'s independent full-suite delta check).
- **Action:** Run the full suite after this fix lands; diff the failing-file list against the documented baseline.
- **Expected result:** Identical failing-file set (module any files that were already flagged as flaky/environment-dependent in that documented baseline) — proving this story only removed a side effect, not any actual test coverage.

---

## NFR Tests

None — confirmed with story owner. This story has no NFRs beyond "unchanged production behaviour," which is already covered by AC2/U2 above as a functional AC, not a separate non-functional concern.

---

## Out of Scope for This Test Plan

- Any test of the ~68-70 pre-existing, already-documented failures themselves — IT3 only diffs the list, does not attempt to fix or further characterize any individual pre-existing failure.
- Any test of `_getRepoPath()`'s env-var override behaviour — untouched by this story, already implicitly exercised by U2's use of `CLAUDE_REPO_PATH`.
- Any E2E/Playwright-level test — no CSS-layout or browser-rendering concern exists anywhere in this story; all behaviour is server-side git/process control flow.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| The exact final count of "existing affected test files" (AC3) is not fully enumerated in this test plan — only 6 candidates identified via a grep for artefact-completion markers | A fully exhaustive search requires running each candidate test file with tracing to confirm it actually reaches the artefact-completion code path at runtime, not just contains a similar-looking string — this is more reliably done by the coding agent during implementation than guessed at here | The story's own AC3 wording explicitly instructs the coding agent to "search the full tests/ directory for any test invoking the skill-turn-stream handler with a completed artefact, not just the one file already known to trigger this" — IT1 is written to scale to however many files that search turns up, not a hardcoded list |
