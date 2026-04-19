## Epic: Spike Programme — Architecture Decisions Gating Phase 4 Implementation

**Discovery reference:** artefacts/2026-04-19-skills-platform-phase4/discovery.md
**Benefit-metric reference:** artefacts/2026-04-19-skills-platform-phase4/benefit-metric.md
**Slicing strategy:** Risk-first — all spikes complete before any implementation story in E2, E3, or E4 begins

## Goal

The five open architecture questions at the centre of Phase 4 — whether a shared governance core is extractable, which enforcement mechanism fits which surface class, how the distribution model resolves upstream authority and update-channel integrity, and whether the Teams interaction model can satisfy C7 (one question at a time) structurally — are resolved by evidence before any production code is committed. Every spike produces a verifiable verdict (PROCEED / REDESIGN / DEFER / REJECT) recorded in an artefact and in `pipeline-state.json`. Implementation stories in E2, E3, and E4 may not enter DoR (Definition of Ready) until the spike they depend on has a PROCEED or REDESIGN verdict.

## Out of Scope

- Implementing any enforcement mechanism — that is E3; spikes produce verdicts, not shipping mechanisms
- Implementing any distribution feature — that is E2; spikes produce design decisions, not install tooling
- Implementing any non-technical surface — that is E4; Spike D produces a C7 viability finding, not a production bot
- Running full DoR on E2/E3/E4 stories before the relevant spike has a verdict
- Craig's CLI as a production artefact — `p4.spike-b2` evaluates Craig's MVP as a reference implementation and produces an ADR; it does not merge Craig's code into master

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| M1: Distribution sync | 0% zero-commit install | 100% zero-commit install + ≥90% conflict-free sync | Spike C resolves upstream authority and lockfile design; without it the distribution mechanism cannot be selected and M1 implementation cannot begin |
| M2: Consumer confidence | 0 unassisted onboardings | ≥1 team member completes outer loop unassisted | Spikes A, B1, B2 resolve which enforcement mechanism fits which surface class; the correct mechanism per surface is a prerequisite for the consumer confidence claim |
| M3: Teams bot C7 fidelity | No bot exists | 0 C7 violations across a complete outer-loop step in Teams | Spike D establishes whether the Teams interaction model can satisfy C7 structurally — without this verdict, no Teams bot implementation can be justified |

## Stories in This Epic

- [ ] p4.spike-a — Governance logic extractability and shared core interface definition
- [ ] p4.spike-b1 — MCP tool-boundary enforcement reference implementation
- [ ] p4.spike-b2 — CLI enforcement reference implementation (evaluation of Craig's PR #155 MVP)
- [ ] p4.spike-c — Distribution model: upstream authority, sidecar semantics, and update channel design
- [ ] p4.spike-d — Teams bot C7 prototype: non-technical discipline interaction model viability

## Human Oversight Level

**Oversight:** High
**Rationale:** Every spike produces an architecture decision record. A PROCEED verdict commits Phase 4 to a specific design path; a REJECT verdict closes a workstream. These are irreversible strategic choices that require heymishy's explicit approval. No coding agent may approve a verdict.

## Complexity Rating

**Rating:** 3

## Scope Stability

**Stability:** Unstable — individual spike directions may surface unexpected constraints or contradictions that reshape the spike scope or require follow-on spikes before the downstream implementation stories can proceed.
