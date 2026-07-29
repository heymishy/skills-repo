# Definition of Ready Checklist

## Definition of Ready: Sequence Scenario B after Scenario A so they never simultaneously race for the shared concurrency slot

**Story reference:** artefacts/2026-07-29-ci-deploy-collision-fix/stories/cif-s2-sequence-scenario-b-after-scenario-a.md
**Test plan reference:** artefacts/2026-07-29-ci-deploy-collision-fix/test-plans/cif-s2-sequence-scenario-b-after-scenario-a-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Operational correctness, evidenced by the confirmed defect + isolated-rerun evidence on PR #633 |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review by design |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Depends on cif-s1, already merged (PR #632) — upstream dependency satisfied |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Adds only a `needs:` edge; reuses existing job ids and concurrency group |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI surface |
| H-NFR | NFR profile exists | ✅ N/A short-track | NFRs stated directly in story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No data involved — CI workflow configuration only |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No /review run (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss an edge case | **Acknowledged — proceed.** Solo-operator posture, same basis as prior short-track stories this session |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | Test plan's own Coverage gaps section documents the same permanent, un-testable-locally gap already accepted for cif-s1 (real GitHub-side concurrency behaviour) | **Acknowledged — proceed.** Direct isolated-rerun evidence from PR #633 already confirms the mechanism; ongoing observation is the remaining confirmation channel, same as cif-s1's own accepted gap |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Sequence Scenario B after Scenario A so they never simultaneously race for the shared concurrency slot — artefacts/2026-07-29-ci-deploy-collision-fix/stories/cif-s2-sequence-scenario-b-after-scenario-a.md
Test plan: artefacts/2026-07-29-ci-deploy-collision-fix/test-plans/cif-s2-sequence-scenario-b-after-scenario-a-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Add exactly one line to .github/workflows/e2e.yml's
  scenario-b-staging-e2e job: `needs: scenario-a-staging-e2e`.
- Do NOT remove or modify either job's existing `concurrency: deploy-group`
  declaration.
- Do NOT touch staging-deploy.yml at all.
- Do NOT add a needs: edge to any other job (e2e, smoke-test,
  promote-to-prod, deploy-staging) as a side effect.
- Write a static-analysis test (new file, e.g.
  tests/check-cif-s2-scenario-sequencing.js) asserting AC1-AC4 exactly as
  described in the test plan, following the same splitJobs()-based
  convention as tests/check-cif-s1-deploy-concurrency-guard.js.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — modifies a shared CI workflow file affecting every future PR touching Scenario A/B; low individual-change risk (single `needs:` line, reuses existing job ids) but broad blast radius warrants awareness. This is also a fix-forward correction of already-merged, DoD-marked-complete work (cif-s1), which raises the bar for care even though the change itself is small.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King — Platform owner — requested this follow-up directly, 2026-07-29
