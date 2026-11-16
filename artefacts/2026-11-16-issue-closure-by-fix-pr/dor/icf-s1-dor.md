## Definition of Ready: A short-track fix for a GitHub issue closes that issue as a matter of course

**Story reference:** artefacts/2026-11-16-issue-closure-by-fix-pr/stories/icf-s1-fix-pr-closes-its-source-issue.md
**Test plan reference:** artefacts/2026-11-16-issue-closure-by-fix-pr/test-plans/icf-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-issue-closure-by-fix-pr/dor/icf-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Five files; all 7 acceptance criteria (AC) map to a named test or live evidence. The exclusion list (agent-side closing, the error bridge, CI workflows, `bin/skills` code, other skills, dependencies) has zero test assertions against it, and every file the tests touch is in the build list (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 T6, AC7 live evidence |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Removes a manual step that left issue #1121 open |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No UI |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | Read-only script, never fails the pipeline |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | The lookup is a function parameter in a script, not a server adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI |

**Hard blocks: 19/19 passed** (several vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | ⚠️ Accepted | Skill behaviour is verified by text checks; the first real use (AC7) is the live proof |
| W2 | ⚠️ Pending | If a governance test hash-pins SKILL.md files, the manifest must be updated in the same PR and named in the evidence |

## Standards injection
Domain tags `[pipeline, skills]`: the agent must read `.github/architecture-guardrails.md` and the two SKILL.md files being edited first.

## Oversight level
**Low** - skill text, one read-only script, one optional schema field. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-issue-closure-by-fix-pr/stories/icf-s1-fix-pr-closes-its-source-issue.md
Test plan: artefacts/2026-11-16-issue-closure-by-fix-pr/test-plans/icf-s1-test-plan.md
Contract: artefacts/2026-11-16-issue-closure-by-fix-pr/dor/icf-s1-dor-contract.md
Goal: write tests/check-icf-s1-fix-pr-closes-issue.js (T1 to T6) first and confirm T1 to T5 FAIL for the right reason; then write the script, edit the two skills, add the schema field.
Constraints:
- The script is read-only against GitHub and must never fail the pipeline when gh is missing (exit 0, "skipped").
- Do not close any issue anywhere; do not set sourceIssue on any existing story.
- closingKeywordPresent must reject "the operator can close issue #N" (the real PR #1127 wording) and a longer number that starts with N's digits.
- Keep both bodies in branch-complete (bash and PowerShell) in step.
- Read .github/architecture-guardrails.md first. No new npm dependencies.
- Commit before running the full suite in the worktree; stage only the files you changed; afterwards discard the known suite junk (artefacts/<date>-discovery, artefacts/stis-s1-test-slug, workspace/test-tmp-*, the artefacts/test-slug/ideate.md edit).
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges, and the PR body must carry no closing keyword for any unrelated issue.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
