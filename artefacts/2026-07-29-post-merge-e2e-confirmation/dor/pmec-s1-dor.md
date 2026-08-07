# Definition of Ready Checklist

## Definition of Ready: Auto-confirm real-staging E2E specs immediately after every master deploy

**Story reference:** artefacts/2026-07-29-post-merge-e2e-confirmation/stories/pmec-s1-post-merge-e2e-confirmation-job.md
**Test plan reference:** artefacts/2026-07-29-post-merge-e2e-confirmation/test-plans/pmec-s1-post-merge-e2e-confirmation-job-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Operational confidence, quantified with the two documented occurrences (dsh-s4 pattern + gap entries, capture-log.md 2026-07-28) |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review by design |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Reuses existing specs/flags/secrets, no new mechanism |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI surface |
| H-NFR | NFR profile exists | ✅ N/A short-track | NFRs stated directly in story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No data involved — CI workflow configuration + documentation only |
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
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | Test plan's own Coverage gaps section documents one permanent, un-testable-synthetically gap (whether the job catches a real bootstrapping failure in practice) | **Acknowledged — proceed.** Cannot be manufactured without a genuine not-yet-deployed endpoint; confirmed organically the next time a qualifying story ships, same category of gap as cif-s1's own accepted test-plan gap |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Auto-confirm real-staging E2E specs immediately after every master deploy — artefacts/2026-07-29-post-merge-e2e-confirmation/stories/pmec-s1-post-merge-e2e-confirmation-job.md
Test plan: artefacts/2026-07-29-post-merge-e2e-confirmation/test-plans/pmec-s1-post-merge-e2e-confirmation-job-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Add exactly one new job to .github/workflows/staging-deploy.yml (e.g.
  post-deploy-e2e-confirm) with `needs: deploy-staging`.
- The new job must read audit.staging_e2e_scenario_a and
  audit.staging_e2e_scenario_b from .github/context.yml (same pattern
  already used in e2e.yml's scenario-a-staging-e2e/scenario-b-staging-e2e
  steps) and run the exact same spec file lists as those two jobs when
  each flag is true. Do not invent a new flag.
- Do NOT add the new job's id to promote-to-prod's needs: list --
  promote-to-prod must continue to depend on smoke-test only. Do not add
  continue-on-error anywhere -- the job's non-blocking nature must come
  structurally from the absence of a needs: edge into it, not from error
  suppression.
- Write a new standards document covering the 4 points in AC5 (why the
  gap happens, how to recognise it in CI output, the manual workaround,
  a pointer to this new job) -- add it as a new named section to
  standards/governance/delivery-patterns.md, following that file's
  existing pattern-numbering convention (D44 is the next free ID as of
  this DoR).
- Write a static-analysis test (new file, e.g.
  tests/check-pmec-s1-post-merge-e2e-confirmation.js) asserting AC1-AC5
  exactly as described in the test plan, following the same
  splitJobs()-based convention as tests/check-cif-s1-deploy-concurrency-guard.js
  and tests/check-bri-s2.6-smoke-test-promote-gate.js.
- Do not modify e2e.yml's existing Scenario A/B jobs in any way.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — modifies shared CI workflow files affecting every future push to master; low individual-change risk (reuses existing specs/flags/secrets, structurally non-blocking) but broad blast radius warrants awareness.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King — Platform owner — requested this follow-up directly, 2026-07-29
