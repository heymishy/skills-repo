## Definition of Ready: Bookkeeping pushes to master stop starting workflows that add nothing

**Story reference:** artefacts/2026-11-17-bookkeeping-push-noise/stories/bkn-s1-stop-bookkeeping-push-noise.md
**Test plan reference:** artefacts/2026-11-17-bookkeeping-push-noise/test-plans/bkn-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-bookkeeping-push-noise/dor/bkn-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Three workflow files and one new test; all 6 acceptance criteria (AC) map to a named test or live scenario. The exclusion list (behaviour of the workflows, the dreaming failure, required checks, source) has zero test assertions against it (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has a test | ✅ | AC1 T1, AC2 T2, AC3 T3, AC4 T4, AC5 T5, AC6 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Removes about 440 no-value runs per 40 hours |
| H6 | Complexity rated | ✅ | 1, Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC6 live-only |
| H9 | Architecture Constraints populated | ✅ | ADR-011 named; platform change policy followed |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No UI |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | None |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI |

**Hard blocks: 19/19 passed** (4 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending | AC6 is observed on this story's own post-merge bookkeeping commit |
| W5 | ⚠️ Accepted | A merge that touches only excluded paths is no longer traced by Trace Commit |
| W6 | ⚠️ Accepted | Dreaming still fails when it runs (weekly, manual); the cause is `ciw-s1` |

## Standards injection
Domain tag `[ci]`: no standards file beyond `.github/architecture-guardrails.md`; read the three workflows first.

## Oversight level
**Low** - three trigger edits and a guard; no behaviour change when a workflow runs. No named sign-off.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-bookkeeping-push-noise/stories/bkn-s1-stop-bookkeeping-push-noise.md
Test plan: artefacts/2026-11-17-bookkeeping-push-noise/test-plans/bkn-s1-test-plan.md
Contract: artefacts/2026-11-17-bookkeeping-push-noise/dor/bkn-s1-dor-contract.md
Goal: write tests/check-bkn-s1-bookkeeping-push-noise.js (T1 to T5) first and confirm T1 to T4 FAIL today; then edit the three workflows.
Constraints:
- Change only the `on:` triggers (and the dreaming `if:` that guards the push event, plus comments). Do not change what any step does.
- Copy the bookkeeping exclusion list from staging-deploy.yml exactly.
- Do not touch the ruleset, required checks, the Scenario jobs, or application source.
- Stage only the files you changed. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Low - no named sign-off required.
```

## Sign-off
**Oversight level:** Low; **Sign-off required:** No.
