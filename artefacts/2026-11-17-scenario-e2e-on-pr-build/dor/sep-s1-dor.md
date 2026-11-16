## Definition of Ready: Scenario A and B end-to-end tests run against the pull request's own build before merge, and against the deployed staging before production

**Story reference:** artefacts/2026-11-17-scenario-e2e-on-pr-build/stories/sep-s1-scenario-e2e-on-the-pr-build.md
**Test plan reference:** artefacts/2026-11-17-scenario-e2e-on-pr-build/test-plans/sep-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Track:** short

## Contract Proposal
See `artefacts/2026-11-17-scenario-e2e-on-pr-build/dor/sep-s1-dor-contract.md`.

## Contract Review
✅ **Contract review passed.** Two workflow files, possibly two guard files, one new test; all 7 acceptance criteria (AC) map to a named test, CI evidence or live scenario. The exclusion list (application source, the ruleset, check names, flags) has zero test assertions against it (B1/D1 check).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | ✅ | "the operator" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has a test or evidence | ✅ | AC1 to AC4 T1 to T4, AC5 and AC6 CI evidence, AC7 live |
| H4 | Out of scope populated | ✅ | |
| H5 | Benefit linkage | ✅ (short-track) | Makes the required checks test the PR's own code |
| H6 | Complexity rated | ✅ | 3, Unstable until the first green run |
| H7 | No unresolved HIGH review findings | ✅ (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | ✅ | `schemaDepends: []`; AC5 to AC7 are CI or live evidence |
| H9 | Architecture Constraints populated | ✅ | ADR-011, ADR-004 and the ADR-018 addendum named; operator decisions recorded |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No new layout AC; the existing specs are the E2E tooling |
| H-NFR, H-NFR2, H-NFR3 | NFRs | ✅ | |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | No adapter introduced |
| H-GOV, H-INF, H-MIG | N/A or vacuous | ✅ | |
| H-DESIGN | Design-token gate | ✅ (N/A) | No UI |

**Hard blocks: 19/19 passed** (4 vacuous or N/A).

## Warnings
| # | Status | Note |
|---|--------|------|
| W4 | ⚠️ Pending operator | AC7 is observed on the next real master deploy after merge |
| W5 | ⚠️ Accepted | The check names still say "(staging)" although they now test the PR's build; renaming needs a ruleset change by the operator and is offered as a later cleanup |
| W6 | ⚠️ Accepted | Complexity 3: the first CI runs may expose staging-only assumptions in specs; each fix is recorded in `decisions.md` |

## Standards injection
Domain tag `[ci]`: no standards file for CI workflows beyond `.github/architecture-guardrails.md`; the agent reads the two workflow files and the guard tests first.

## Oversight level
**Medium** - changes the required merge checks' meaning and the promotion gate, though no application code. The operator reviews the PR; no named sign-off beyond the merge.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-17-scenario-e2e-on-pr-build/stories/sep-s1-scenario-e2e-on-the-pr-build.md
Test plan: artefacts/2026-11-17-scenario-e2e-on-pr-build/test-plans/sep-s1-test-plan.md
Contract: artefacts/2026-11-17-scenario-e2e-on-pr-build/dor/sep-s1-dor-contract.md
Goal: write tests/check-sep-s1-scenarios-on-pr-build.js (T1 to T4) first and confirm T1, T2 and T4 FAIL today; then change the two workflows; then iterate on the PR's own CI until both jobs are green three times, recording each change in decisions.md.
Constraints:
- Do NOT rename the two jobs' display names, change the ruleset, change context.yml flags, or edit application source.
- Do NOT edit a spec unless it reads a staging-only value the throwaway environment lacks; record each edit and why.
- The PR jobs must not use any staging secret, staging URL or the deploy-group concurrency group.
- Do the AC6 negative control on the PR branch only and revert it in the next commit; record the failing run's link.
- Stage only the files you changed. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree. Draft PR only; the operator merges.
Oversight level: Medium - operator reviews the PR; no named sign-off required.
```

## Sign-off
**Oversight level:** Medium; **Sign-off required:** No named sign-off (merge by the operator).
