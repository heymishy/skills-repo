# DoR Contract: Stop the skill-turn artefact auto-commit from firing real git commits during tests

**Story reference:** artefacts/2026-07-12-skill-turn-test-isolation/stories/stis-s1-guard-skill-turn-auto-commit.md
**Test plan reference:** artefacts/2026-07-12-skill-turn-test-isolation/test-plans/stis-s1-guard-skill-turn-auto-commit-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/web-ui/routes/skills.js`, extract the existing artefact-completion `git add`/`git commit` block (currently inline `child_process.execSync` calls around line 4181-4189) into a D37-style injectable adapter: `let _skillTurnGitCommit = <default implementation performing the real execSync calls, wrapped in the same try/catch swallow-on-failure behaviour as today>; function setSkillTurnGitCommitAdapter(fn) { _skillTurnGitCommit = fn; }`. The handler calls `_skillTurnGitCommit(artefactPath, commitMessage, repoRoot)` instead of calling `execSync` directly.
2. Update the 6+ existing test files identified by a full search of `tests/` for anything that exercises a completed skill-turn artefact (candidates already found via grep: `check-wusl1-chat-streaming.js`, `check-wusl2-progressive-live-draft.js`, `check-mfc1-model-first-chat-session.js`, `check-iwu5-lens-complete.js`, `check-inc2.1-conditions-panel.js`, `check-dsq4-section-artefact-assembly.js`, and the E2E spec `tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js` — the coding agent must confirm this list is exhaustive, not assume it) to call `setSkillTurnGitCommitAdapter(stubFn)` in their setup, where the stub records the call without touching git.
3. New test file `tests/check-stis-s1-*.js` covering AC1/AC2/AC4/AC5 directly (AC3 is covered by the updated existing files themselves, per the test plan's IT1).

**What will NOT be built:**
- No change to the real production artefact-auto-save-and-commit feature's behaviour — a genuine live server session still writes to disk and commits exactly as today.
- No change to `_getRepoPath()`'s resolution logic or its `CLAUDE_REPO_PATH`/`COPILOT_REPO_PATH` env var override mechanism.
- No fix to any of the ~68-70 already-documented pre-existing test failures.
- No new junk-artefact cleanup beyond what's already been handled in PR #456 — if this story's own work surfaces a new stray artefact in an unrelated branch, log it, don't silently touch branches this story doesn't own.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | U1 (adapter override), U3 (stub behaviour), U4 (single call-site check), IT1 (existing affected files produce zero commits) | unit + integration |
| AC2 | U2 (default adapter still commits for real, in a disposable temp repo) | unit |
| AC3 | IT1 (each of the 6+ affected files individually, before/after HEAD comparison) | integration |
| AC4 | IT2 (full suite run twice, HEAD unchanged both times) | integration |
| AC5 | IT3 (failing-file list diffed against the documented pre-existing baseline) | integration |

**Assumptions:**
- The 6 candidate files found via grep for artefact-completion markers are a good starting point but not guaranteed exhaustive — the coding agent must do its own search (e.g. tracing which tests actually reach the artefact-completion code block at runtime, not just grep for similar-looking strings) before considering AC3 satisfied.
- The existing try/catch swallow-on-failure behaviour around the git commit (`catch (_gitErr) { /* git unavailable in production */ }`) is preserved exactly as-is inside the default adapter implementation — this story does not change error-handling behaviour, only where the git call itself is invoked from.
- U2 (proving the production default still works) must run against a disposable temporary git repository, never this real repo — get this wrong and the test recreates the exact bug this story fixes.

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js`, `tests/check-stis-s1-*.js` (new), plus setup-only edits to the 6-7 existing test files named above (no assertion changes, only adapter-injection additions)
Services: None
APIs: None

---

## Contract Review

Reviewed against all 5 story ACs and the test plan's AC Coverage table:

- AC1 ↔ built via the new adapter + its call-site replacement, verified by U1/U3/U4/IT1 — ✅ aligned.
- AC2 ↔ built via preserving the default adapter's real-commit behaviour, verified by U2 in an isolated disposable repo — ✅ aligned.
- AC3 ↔ built via updating the existing affected test files' setup, verified by IT1 scaling to however many files the exhaustive search finds — ✅ aligned.
- AC4 ↔ a direct structural consequence of AC1's fix, verified by IT2 — ✅ aligned.
- AC5 ↔ verified by IT3's diff against the documented baseline — ✅ aligned.

No mismatches found between proposed implementation and stated ACs.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "an operator running the test suite (locally or via a coding agent) in any worktree of this repo" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | See coverage table above |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 4 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Operational reliability, quantified with this session's actual incident count (6+ occurrences, 1 production leak) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Explicitly follows the existing D37 pattern, checked against `.github/architecture-guardrails.md` |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-07-12-skill-turn-test-isolation/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact exists — short-track skips /discovery by design, same handling as pcr-s1's precedent |
| H-ADAPTER | D37 adapter wiring check | ✅ | This story explicitly introduces a D37 adapter (`setSkillTurnGitCommitAdapter`) — AC1 scopes production wiring (the default implementation IS the production wiring, preserving existing behaviour), AC2 explicitly documents why the stub does NOT throw (deliberate D37 exception, justified in the story), and the implementation plan will name wiring as a distinct task from the handler-refactor task |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass**, with the H-GOV note recorded transparently (same precedent as `pcr-s1`).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Same rationale as `pcr-s1`'s precedent: bounded infra/tooling fix, operator directly requested this follow-up story in-session with full context of the root cause already established. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's Coverage gaps table is "None" | — |
