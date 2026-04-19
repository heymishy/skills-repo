# Epic Template

## Epic: Non-technical disciplines can participate in pipeline governance without touching code or CLI

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

Product managers, business analysts, business leads, and auditors can interact with the pipeline's governance process — approving DoR sign-offs, viewing pipeline health, reading governance output — through channels that do not require VS Code, a terminal, or a Git checkout. The first validated channel is a Teams bot prototype that preserves C7 fidelity (one question at a time). Spike D determines whether the Teams interaction model can meet C7 before any implementation proceeds. Theme C deliverables (4.C.1 through 4.C.4 from the Phase 4.5 reference document) are implemented to the extent that Spike D permits.

## Out of Scope

- Full production Teams bot deployment — Phase 4 produces a working prototype, not a production-grade bot
- Slack, email, or web portal as alternative non-technical channels — Teams is the Phase 4 validation target; other channels are Phase 5 scope
- Azure/MS account provisioning — this is an external prerequisite; the epic assumes it is resolved before Spike D begins
- Approval routing for VCS platforms other than GitHub — ADR-006 and ADR-012 require adapter portability, but Phase 4 validates on GitHub only
- Modifying the existing `src/approval-channel/` adapter to support Teams — the adapter pattern exists; this epic adds a new Teams adapter, not refactors the existing one

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M3 (Teams bot C7 fidelity — 0 violations in test session) | Not measured | 0 C7 violations in a structured test session | Spike D validates C7 fidelity in the Teams interaction model; implementation stories deliver the prototype that is measured against M3 |
| M2 (Consumer confidence — unassisted team member onboarding) | Not measured | One team member onboards unassisted | Non-technical access removes a barrier to onboarding for personas who cannot use CLI/VS Code |

## Stories in This Epic

- [ ] Spike D: Validate whether a Teams bot can preserve C7 fidelity in non-technical interactions — spike-d-teams-c7-fidelity
- [ ] Implement Teams bot scaffold with C7-compliant conversation flow — implement-teams-bot-scaffold
- [ ] Implement DoR approval routing through the Teams bot — implement-teams-dor-approval
- [ ] Implement pipeline health summary view in the Teams bot — implement-teams-pipeline-health
- [ ] Implement readable governance output rendering in the Teams bot — implement-teams-governance-output
- [ ] Validate Teams bot end-to-end with a non-technical user test session — validate-teams-e2e-session

## Human Oversight Level

**Oversight:** High
**Rationale:** Teams bot prototype involves an external platform dependency (Azure/MS account), a new interaction surface not previously validated, and C7 fidelity is a hard constraint. Human must review Spike D verdict and each implementation milestone.

## Complexity Rating

**Rating:** 3

## Scope Stability

**Stability:** Unstable — Spike D verdict may reduce scope significantly. The decisions.md entry explicitly allows deferral to Phase 4.1 or Phase 5 if implementation complexity proves too high. If Spike D produces DEFER, implementation stories in this epic are removed and a follow-on spike story is written for Phase 5.
