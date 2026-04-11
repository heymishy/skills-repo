## Epic: Remaining discipline standards and Bitbucket CI validation

**Discovery reference:** artefacts/2026-04-11-skills-platform-phase2/discovery.md
**Benefit-metric reference:** artefacts/2026-04-11-skills-platform-phase2/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, all 11 discipline standards are live (8 new + 3 from Phase 1), domain-tier pilot standards exist for at least 3 domains, and every standard routes correctly via `standards/index.yml`. Squads on Bitbucket Cloud can validate their pipeline YAML syntax and shape; squads on Bitbucket DC can validate their auth topology using the Docker DC environment. No squad in a non-software-engineering discipline hits a "no standard for your discipline" blocker when onboarding, and no Bitbucket-hosted squad hits a "CI gate not validated for your platform" blocker.

## Out of Scope

- Automated routing of a story to a discipline standard based on story metadata — discipline selection remains manual via `context.yml` in Phase 2.
- ML/AI specialist safety frameworks, model cards, or bias evaluation tooling beyond the POLICY.md floor template.
- Bitbucket Pipelines native enterprise Data Center (non-Docker) environment.
- Jenkins CI validation.
- GitHub Actions regression testing — inherited from P1.3.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| MM5 — Flow findings conversion rate | 0 of 5 Phase 1 findings actioned | ≥3 of 5 Phase 1 findings actioned within Phase 2 | p2.9 actioning the "only 3 of 11 disciplines have standards" field finding directly contributes to the MM5 count |
| MM1 — Solo operator outer loop calibration | Phase 1: zero blocking lookups for software-engineering stories | Phase 2: zero blocking lookups for any discipline | p2.9 eliminates the "no standard for your discipline" blocking lookup for 8 additional disciplines |
| M1 — Second squad onboarding unassisted | Bitbucket squads blocked at CI gate adoption | Second squad on Bitbucket completes onboarding unblocked | p2.10 removes the Bitbucket CI validation gap that would block a Bitbucket squad at onboarding |
| M2 — Non-git-native adapter assurance verdict | Zero non-git-native PRs through CI gate | First non-git-native adapter produces passing assurance verdict | p2.10 is a prerequisite for M2 evidence from a Bitbucket-hosted squad running a non-git-native adapter |

## Stories in This Epic

- [ ] p2.9 — Eight remaining discipline standards and three pilot domain standards
- [ ] p2.10 — Bitbucket CI validation: Cloud pipeline-shape tests and DC Docker auth topology

## Human Oversight Level

**Oversight:** High
**Rationale:** p2.9 introduces 16–22 new Markdown files establishing governance floors for disciplines (regulatory, ML/AI, security-extended) where correctness matters significantly — a wrong MUST statement in a regulatory or security standard could create false assurance. Human review of each standard's MUST/SHOULD/MAY statements is required before merging. p2.10 involves CI infrastructure changes and credential/auth handling (DC Docker tests); security review of the secret injection pattern is mandatory.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
**Note:** A6 assumption (standards/index.yml extensibility) is the one validation gate — if A6 fails at /review, p2.9 requires a schema migration story before proceeding.
