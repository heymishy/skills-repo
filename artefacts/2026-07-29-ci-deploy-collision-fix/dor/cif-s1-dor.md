# Definition of Ready Checklist

## Definition of Ready: Prevent a staging redeploy from racing a PR's real-staging E2E job

**Story reference:** artefacts/2026-07-29-ci-deploy-collision-fix/stories/cif-s1-add-deploy-concurrency-guard.md
**Test plan reference:** artefacts/2026-07-29-ci-deploy-collision-fix/test-plans/cif-s1-add-deploy-concurrency-guard-test-plan.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-29

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Includes an explicit, accepted tradeoff (A/B lose their parallelism) |
| H5 | Benefit linkage field references a named metric | ✅ N/A short-track | Operational reliability, quantified with the 5 confirmed occurrences this session |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips /review by design |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Reuses existing `deploy-group` concurrency name, no new mechanism |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No UI surface |
| H-NFR | NFR profile exists | ✅ N/A short-track | NFRs stated directly in story |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ N/A | No data involved — CI workflow configuration only |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See decisions.md GAP entry** | No discovery artefact — short-track skips /discovery by design |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No adapter — pure workflow YAML change |
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
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | Test plan's own Coverage gaps section documents one permanent, un-testable-locally gap (real cross-workflow queueing behaviour) | **Acknowledged — proceed.** This is a fundamental limitation of testing GitHub Actions' own server-side concurrency implementation, not a shortcut; static YAML verification plus real-world observation is the correct verification method here |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Prevent a staging redeploy from racing a PR's real-staging E2E job — artefacts/2026-07-29-ci-deploy-collision-fix/stories/cif-s1-add-deploy-concurrency-guard.md
Test plan: artefacts/2026-07-29-ci-deploy-collision-fix/test-plans/cif-s1-add-deploy-concurrency-guard-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Add `concurrency: deploy-group` to exactly two jobs in
  .github/workflows/e2e.yml: scenario-a-staging-e2e and
  scenario-b-staging-e2e. Use the bare-string form (no explicit
  cancel-in-progress override) -- GitHub's documented default for this
  form queues a job entering an occupied group rather than cancelling the
  currently-running one, which is the desired behaviour (never cancel a
  real deploy or a real E2E test mid-flight).
- The group name must be the EXACT string already used by
  staging-deploy.yml's deploy-staging job (concurrency: deploy-group) --
  read that job's current YAML first to confirm the exact string, do not
  guess or introduce a near-miss variant.
- Do NOT touch staging-deploy.yml's deploy-staging job, smoke-test job, or
  promote-to-prod job. Do NOT touch e2e.yml's own `e2e` job (the local-
  mocked Playwright smoke suite). This story is scoped precisely to the
  two Scenario A/B jobs.
- Write a static-analysis test (new file, e.g.
  tests/check-cif-s1-deploy-concurrency-guard.js) that parses both
  workflow YAML files (js-yaml or an equivalent already-available parser
  in this repo -- check package.json/other tests for the established
  YAML-parsing convention before adding a new dependency) and asserts
  AC1-AC4 exactly as described in the test plan.
- Do not add continue-on-error or any other unrelated change to either
  workflow file.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — modifies shared CI workflow files that gate every future PR touching real staging; low individual-change risk (a two-line, reused-mechanism addition) but broad blast radius (affects every PR going forward) warrants awareness.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King — Platform owner — requested this follow-up directly, 2026-07-29
