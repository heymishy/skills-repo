## Definition of Ready: Make the full test suite leave the repository clean, and stop the cat-s1 timing flake

**Story reference:** artefacts/2026-11-16-test-hygiene-isolation/stories/tht-s1-tests-leave-the-repo-clean.md
**Test plan reference:** artefacts/2026-11-16-test-hygiene-isolation/test-plans/tht-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-test-hygiene-isolation/dor/tht-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Nine files; all 4 acceptance criteria (AC) map to a named test or the recorded evidence. The exclusion list (artefact-completion logic, commit adapter, traversal check, production defaults, cat-s1's budget, dependencies) has zero test assertions against it, and every file the tests touch is in the build list (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator or an agent running the full suite in a worktree" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2 and T3, AC3 T4, AC4 evidence |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Removes a recurring accidental-commit risk and a known flake |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC4 is evidence by design |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No UI |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | An environment override, not an adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI |

**Hard blocks: 19/19 passed** (several vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | ⚠️ Accepted | A small production file (`routes/skills.js`) gains an environment override used only by tests; default behaviour is asserted unchanged by T3 |
| W2 | ⚠️ Accepted | The guard test knows only the five current writers; a future junk-writing test is caught by the AC4 full-suite check, not automatically |

## Standards injection
Domain tag `[tests]`: `.github/standards/testing/test-design-patterns.md` if present; the agent must read it and `.github/architecture-guardrails.md` first.

## Oversight level
**Low** - test hygiene plus a test-only override with an asserted unchanged default. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-test-hygiene-isolation/stories/tht-s1-tests-leave-the-repo-clean.md
Test plan: artefacts/2026-11-16-test-hygiene-isolation/test-plans/tht-s1-test-plan.md
Contract: artefacts/2026-11-16-test-hygiene-isolation/dor/tht-s1-dor-contract.md
Goal: write tests/check-tht-s1-tests-leave-the-repo-clean.js (T1 to T4) first and confirm T1, T2 and T4 FAIL for the right reason; then add _artefactSaveRoot and use it at the auto-save, add cat-s1 to the exclusive list, and point the five writers at temporary directories.
Constraints:
- Production default must not change (T3). Do not touch the artefact-completion logic, the commit adapter, the path-traversal check, or cat-s1's 50 ms budget.
- Do not use CLAUDE_REPO_PATH for the override (it also controls where skills content is read from).
- The guard test must never delete anything and must compare before and after (pre-existing junk must not fail it).
- Read .github/architecture-guardrails.md first. No new npm dependencies.
- Commit before running the full suite in the worktree; stage only the files you changed; afterwards verify (AC4) that `git status --short` is clean and say so in the evidence.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
