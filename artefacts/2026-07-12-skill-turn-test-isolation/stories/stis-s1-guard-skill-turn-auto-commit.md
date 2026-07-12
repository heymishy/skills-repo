# Story: Stop the skill-turn artefact auto-commit from firing real git commits during tests

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/investigator-confirmed defect below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator running the test suite (locally or via a coding agent) in any worktree of this repo**,
I want **the skill-turn-stream handler's "best-effort" artefact auto-commit to never fire a real `git add`/`git commit` when it is exercised by a test, only in a genuine live server session**,
So that **running `npm test` (or `node scripts/run-all-tests.js`) never silently commits synthetic test content into whatever branch happens to be checked out in that worktree**.

## Benefit Linkage

**Metric moved:** Test-run safety / worktree integrity for every future inner-loop story in this repo (operational reliability, not a formal benefit-metric artefact — short-track).
**How:** This session, the same defect independently contaminated 4 different story worktrees at least 6 times (`bri-s3.1`, `pcr-s1`, `bri-s1.5` x2, `bri-s3.4` x2, `bri-s2.5` x2), and one contaminated file made it all the way into a merged PR (`#454`) before being caught and cleaned up in a follow-up PR (`#456`). Each occurrence cost real operator/agent time to diagnose and recover (git reset/cherry-pick cycles), and the risk of a careless recovery silently discarding real work is high. Fixing the mechanism removes this recurring tax entirely, going forward, for every story in this repo — not just the ones already affected.

## Architecture Constraints

None identified beyond this repo's own existing conventions — checked against `.github/architecture-guardrails.md`. This story follows the existing D37 injectable-adapter pattern already used elsewhere in this codebase (e.g. `credits.js`, `stripe-client.js`, `posthog-flags.js`) for exactly this kind of "real side effect that must be stubbable in tests" concern — not introducing a new pattern.

## Dependencies

- **Upstream:** None.
- **Downstream:** None directly, but every future test run in this repo benefits once merged — including any currently-open or future `bri-*`/other inner-loop branch that exercises `handleSkillTurnStream` (or equivalent) via its own test suite.

## Acceptance Criteria

**AC1:** Given `src/web-ui/routes/skills.js`'s skill-turn-stream handler currently calls `child_process.execSync('git add ...')` and `execSync('git commit -m ...')` directly and unconditionally whenever a completed artefact turn is auto-saved to disk (guarded only by a try/catch that silently swallows failure — intended to no-op safely in production Fly.io containers where git is not installed, per the existing code comment), When the handler is invoked in a test context, Then no real `git add` or `git commit` process is ever spawned — the git-commit step is wired through a D37-style injectable adapter (e.g. `setSkillTurnGitCommitAdapter(fn)`), whose default implementation performs the real `execSync` calls, and whose stub (used by tests) records the call without touching git.

**AC2:** Given the D37 rule that stub defaults must throw rather than silently no-op, When no adapter override is supplied in a genuinely uninitialized context (i.e., not test-injected), Then the default adapter still performs the real best-effort git commit exactly as today (production behavior unchanged) — the "stub must throw" D37 requirement applies to the *test-injected* stub, not to the production default, since this adapter's entire purpose is to fail silently and safely in environments where git is unavailable (Fly.io) — this AC exists to make that distinction explicit and prevent a future refactor from accidentally making production no longer commit real artefacts.

**AC3:** Given `tests/check-wusl1-chat-streaming.js` and any other existing test file that exercises a completed skill-turn artefact save (search the full `tests/` directory for any test invoking the skill-turn-stream handler with a completed artefact, not just the one file already known to trigger this), When each such test is updated to inject the stub adapter, Then running that test file standalone produces zero new git commits in the repo (verified by comparing `git rev-parse HEAD` before and after the test run) and all of that file's existing assertions continue to pass unchanged.

**AC4:** Given the fix is in place, When `node scripts/run-all-tests.js` (the full suite) is run twice in a row in a clean worktree, Then `git log --oneline` shows the exact same commit count and tip both times — no new commits of any kind appear as a side effect of running the test suite.

**AC5:** Given the existing pre-existing baseline gap count for this repo (documented across multiple `bri-*` stories' `decisions.md` entries as ~68-70 failures when the full suite is run without short-circuiting), When this story's fix lands, Then the full-suite failure count is unchanged (this story fixes a test-isolation side effect, not any of the documented pre-existing content failures) — verified by running the full suite before and after and diffing the failing-file list.

## Out of Scope

- Fixing any of the ~68-70 pre-existing, already-documented test failures unrelated to this defect — those are tracked separately (see `artefacts/2026-07-11-pipeline-conflict-reduction/decisions.md`'s AC1 verdict-parity finding for the fullest accounting of that list).
- Any change to the skill-turn-stream handler's *production* behavior (the real artefact auto-save-and-commit feature itself is working as intended and stays exactly as-is for real server sessions) — this story only prevents it from firing during automated tests.
- Retroactively cleaning up any other stray `artefacts/*-discovery/discovery.md` junk files that may already exist in other open branches beyond the one already cleaned up in PR #456 — if one is found during this story's own work, log it, don't silently fix branches this story doesn't own.
- Rewriting `_getRepoPath()`'s resolution logic — the adapter-injection approach makes this unnecessary; the function's existing `CLAUDE_REPO_PATH`/`COPILOT_REPO_PATH` env var override mechanism is untouched.

## NFRs

- **Performance:** None identified — this is a control-flow change (adapter indirection) with no measurable runtime cost difference from the direct `execSync` calls it replaces.
- **Security:** None identified — no new external input, no new attack surface. If anything, this closes a minor unintended-write-access surface (a test-triggerable code path that writes to disk and executes shell commands against the real repo).
- **Accessibility:** N/A — no UI surface.
- **Audit:** None identified — the production adapter's behavior (and its console.info/console.warn logging of `artefact_auto_amended`/`artefact_auto_saved`/`artefact_disk_save_failed` events) is unchanged; only the test-time behavior changes.

## Complexity Rating

**Rating:** 1 — well understood, root cause fully confirmed via direct code inspection (`src/web-ui/routes/skills.js` line ~4181, `_getRepoPath()` at line 143), fix pattern is a direct application of this repo's own existing D37 convention.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
