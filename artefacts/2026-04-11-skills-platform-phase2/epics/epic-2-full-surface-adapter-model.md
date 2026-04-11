# Epic: Full Surface Adapter Model

**Discovery reference:** artefacts/2026-04-11-skills-platform-phase2/discovery.md
**Benefit-metric reference:** artefacts/2026-04-11-skills-platform-phase2/benefit-metric.md
**Slicing strategy:** Risk-first — AGENTS.md adapter (p2.4) is the distribution prerequisite for non-GitHub squads; five surface adapters (p2.5a/b) have the highest technical unknowns (new result vocabulary types for GUI/admin/manual surfaces); EA registry Path A (p2.6) is sequenced last as it depends on all five adapters being registered.

## Goal

When this epic is complete, the assembly script emits the correct agent instruction format for any VCS environment (GitHub or non-GitHub), all five non-git-native surface types have working adapters and POLICY.md floor variants, and the surface adapter resolver supports both Path B (explicit context.yml declaration) and Path A (EA registry lookup). Any squad — regardless of delivery surface or VCS toolchain — can adopt the platform without manual format conversion or missing governance coverage.

## Out of Scope

- Phase 3 EA registry promotion to cross-team shared registry — Phase 2 reads from the existing single EA registry repo; cross-team registry architecture is Phase 3
- Production rollout of non-git-native adapters to fleet squads — Phase 2 delivers the adapter implementations; actual squad onboarding occurs post-Phase-2 (P2.3 fleet stories handle visibility of who has adopted which adapter)
- DoD criteria variant generation by surface type — the adapter model identifies surface type and applies the appropriate POLICY.md floor; generating bespoke DoD criteria templates per surface is a Phase 3 capability
- Bitbucket CI adapter validation — that is P2.5 (separate epic E4)
- POLICY.md floor authoring for the 8 additional discipline standards (data, UX, security-extended, etc.) — those are in E4; this epic covers surface-type floors, not discipline-type floors

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M2 — Non-git-native surface adapter assurance verdict | Zero — no non-git-native adapter exists | At least one non-git-native adapter produces a passing assurance verdict on a real PR | p2.5a/b deliver all five adapters; M2 acceptance test fires on first p2.5a/b inner loop PR |
| M1 — Second squad outer loop unassisted | Currently requires GitHub + git-native surface | Second squad completes full outer loop with zero blocking lookups | p2.4 removes format blocker (AGENTS.md); p2.5a/b remove surface blocker for IaC/SaaS/GUI/admin/manual squads; p2.6 removes resolution blocker for registry-native squads |

## Stories in This Epic

- [ ] p2.4 — AGENTS.md adapter in assembly script (ADR-005 revisit trigger)
- [ ] p2.5a — IaC + SaaS-API surface adapters + POLICY.md floor variants
- [ ] p2.5b — SaaS-GUI + M365-admin + manual surface adapters + POLICY.md floor variants
- [ ] p2.6 — EA registry Path A surface type resolution

## Human Oversight Level

**High** — p2.4 modifies the assembly script that all squads' distribution relies on; p2.5a/b introduce new code in `src/surface-adapter/`; p2.6 introduces an external HTTP dependency (EA registry) with fallback logic. All require human review before merge.
