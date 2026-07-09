## Definition of Ready: Build the CI pipeline — PR checks through staging deploy

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.5-ci-pipeline-staging-deploy.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.5-ci-pipeline-staging-deploy-test-plan.md
**Contract reference:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.5-ci-pipeline-staging-deploy-dor-contract.md
**Assessed by:** Copilot
**Date:** 2026-07-10

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As Hamish (Founder/Operator)..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | AC1–AC4 |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: T1/T2 + Scenario 1; AC2: T3/T4 + Scenario 2; AC3: IT1 + Scenario 3; AC4: T5/T6 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Preview environments and rollback automation excluded |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1, phrased as direct value-movement ("this is the actual pipeline rewiring that makes... true") |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 2 (2026-07-09): 0 HIGH, 0 MEDIUM, 0 LOW. Run 1's HIGH finding (AC4 not concretely verifiable) resolved via the CI-native static-analysis mechanism now in AC4/T5/T6 |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 4 ACs covered; AC1's branch-protection-enforcement gap is an acknowledged External-dependency item with manual-scenario handling |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | "None identified — checked against .github/architecture-guardrails.md" (corrected template phrasing, resolved from Run 1's mislabelled D37 citation); review Category E clean |
| H-E2E | CSS-layout-dependent AC gap check | ✅ (N/A) | Infrastructure/CI story |

**Hard block result: PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ (N/A) | Review Run 2 recorded 0 MEDIUM findings (Run 1's 1-M1 D37-mislabel finding was corrected, not carried forward) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not reviewed by a domain expert — standing W4 solo-operator posture applies | Hamish King (standing W4 RISK-ACCEPT posture) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Three gaps are named in the test plan's own Test Gaps table (AC1 branch-protection enforcement, NFR2's soft secret-naming assertion, T5/T6's dependency on S2.6's not-yet-landed allowlist convention) — all three have explicit handling/fallback plans described, none are left open-ended | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Build the CI pipeline — PR checks through staging deploy — artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.5-ci-pipeline-staging-deploy.md
Test plan: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.5-ci-pipeline-staging-deploy-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Modify the existing push-to-main deploy path so it targets `--app wuce-staging`, never `--app wuce-prod` (or the current `skills-framework` prod app name)
- PR-triggered job must run lint, typecheck, `npm test`, and build with no `continue-on-error: true` on any of them
- The seed-script step (S2.4) must run immediately after the staging deploy step, within the same job — not a separate manually-triggered workflow
- Do not add or wire the S2.6 promote job in this story — only ensure the automatic push-to-main path never deploys to prod
- Use a clearly-named job id (e.g. `promote-to-prod`) as the allowlist convention for the "outside the promote job" exclusion, since S2.6 will introduce that job — coordinate naming, don't invent an undocumented convention
- Architecture standards: read `.github/architecture-guardrails.md` before implementing
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness (per epic rationale — CI/CD pipeline change is exactly the risk class this epic exists to guard)
**Signed off by:** Hamish King (Founder/Operator) — awareness confirmed 2026-07-10

**Overall determination: READY**
