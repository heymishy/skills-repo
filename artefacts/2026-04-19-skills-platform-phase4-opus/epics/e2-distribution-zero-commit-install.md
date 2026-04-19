# Epic Template

## Epic: Engineers can install and sync the governance package into any repo without committing upstream files

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

A tech lead or senior engineer can run a single install command in a new or existing repository that pulls the skills platform governance package (skills, templates, standards, scripts) into the repo without requiring a commit of upstream files to the consumer's history. A sync command updates the package without severing the update channel (C1 constraint). The distribution model is validated by Spike C before implementation begins, and the implementation delivers Theme B deliverables (4.B.1 through 4.B.9 from the Phase 4.5 reference document) as far as spike verdicts permit.

## Out of Scope

- Governance logic extraction — that is Epic 1 (Spike A must complete first)
- Enforcement mechanism implementation beyond what the distribution installer configures — enforcement is seeded by install but governed by the mechanism selected in Epic 1
- Non-technical access channel (Teams bot, approval routing) — that is Epic 3
- Second-line audit tooling — that is Epic 4
- Cross-VCS distribution for Bitbucket or GitLab — C1 constraint and ADR-012 require portability, but Phase 4 validates on GitHub only; other VCS adapters are Phase 5 scope (5.E-H)

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 (Distribution sync — zero-commit install + ≥90% sync success rate) | Not measured | Zero-commit install; ≥90% sync success | This epic directly delivers the install and sync mechanism. Zero-commit install is the primary M1 target. Sync success rate is measured against the sync command. |
| M2 (Consumer confidence — unassisted team member onboarding) | Not measured | One team member onboards unassisted | A working install + sync lowers the barrier to onboarding — team members can set up the pipeline without upstream expert guidance |

## Stories in This Epic

- [ ] Spike C: Validate the distribution model for the governance package — spike-c-distribution-model
- [ ] Design the governance package manifest and lockfile format — design-package-manifest
- [ ] Implement zero-commit install command — implement-zero-commit-install
- [ ] Implement sync command with update-channel preservation — implement-sync-command
- [ ] Implement lockfile hash verification for skill integrity — implement-lockfile-hash-verification
- [ ] Implement context.yml seeding on first install — implement-context-yml-seeding
- [ ] Validate install and sync end-to-end against a fresh consumer repo — validate-install-sync-e2e

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Distribution implementation is well-constrained by Spike C verdict and existing PR #155 reference material. Human review at PR is sufficient — autonomous coding within story boundaries is safe.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable — conditioned on Spike C verdict confirming the distribution model. If Spike C produces REDESIGN, this epic's implementation stories are replanned.
