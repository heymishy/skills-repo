## Definition of Ready: Answer 404 for a commit preview or commit with nothing to commit, and say where the file really goes

**Story reference:** artefacts/2026-11-16-commit-preview-unknown-session/stories/cpv-s1-commit-preview-unknown-session.md
**Test plan reference:** artefacts/2026-11-16-commit-preview-unknown-session/test-plans/cpv-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Track:** short

## Contract Proposal
See `artefacts/2026-11-16-commit-preview-unknown-session/dor/cpv-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Three source files and one new test; all 7 acceptance criteria (AC) map to a named test or live scenario. The exclusion list (`htmlGetPreview`, `scm-adapter.js`, the result handler, the guards, credits, branch or PR flow, dependencies) has zero test assertions against it except T6, which only asserts that `htmlGetPreview` is unchanged (it is not edited), and the touched files are exactly those the tests need (B1/D1 check: `server.js`, `routes/skills.js` and the view are required touchpoints and not excluded).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "a person committing a skill session's artefact" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 T6 and the full suite, AC7 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Removes a misleading page, an outward call with an empty path, and a false claim |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC7 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011, ADR-012, ADR-025 named |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | Copy change only; no layout |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | |
| H-ADAPTER | Injectable adapter (D37) | ✅ | The existing adapter stays wired; the wiring is changed to the checked function and T1, T4 and T5 assert behaviour through the real wiring, not just that a function was assigned |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | Two text strings in an existing view; no new markup or styles; `hasDesignSystemTrack` not set |

**Hard blocks: 19/19 passed** (2 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending operator | AC7 needs a signed-in session on each app after deploy (read-only GETs) |
| W5 | ⚠️ Accepted | The commit still writes to the default branch; this story only makes the wording true. If a branch or pull request flow is wanted, that is a product decision and a separate story |
| W6 | ⚠️ Accepted | A drafted session that was lost from memory and Redis (old, evicted) now answers 404 instead of showing an empty form; that is the intended behaviour |

## Standards injection
Domain tags `[web-ui]`: matched `.github/standards/web-ui/web-ui-patterns.md`. The agent must read it first.

## Oversight level
**Low** - failure-path checks and copy; the successful commit path is unchanged. No named sign-off required.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-16-commit-preview-unknown-session/stories/cpv-s1-commit-preview-unknown-session.md
Test plan: artefacts/2026-11-16-commit-preview-unknown-session/test-plans/cpv-s1-test-plan.md
Contract: artefacts/2026-11-16-commit-preview-unknown-session/dor/cpv-s1-dor-contract.md
Goal: write tests/check-cpv-s1-commit-preview-unknown-session.js (T1 to T7) first and confirm T1, T2, T3 and T4 FAIL for the right reason (200 with a form; copy; GitHub called with an empty path); then add htmlGetCommitPreviewChecked, use it in htmlCommitSession, wire it in server.js, and correct the two copy lines.
Constraints:
- Do NOT change htmlGetPreview (dsq4 T5.1 and T5.7 pin it) or scm-adapter.js. The commit still goes to the default branch.
- The 404 uses the existing error path (an error with status 404 and the fixed message); do not edit the handlers.
- With nothing to commit, no request may be made to GitHub (T4 asserts zero fetch calls).
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md first. No new npm dependencies.
- Commit before running the full suite in the worktree (a test fires a stray git commit that can sweep up staged work); stage only the files you changed.
- Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
