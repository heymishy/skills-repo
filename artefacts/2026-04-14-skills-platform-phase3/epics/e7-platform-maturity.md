# Epic: Platform Maturity

**Discovery reference:** artefacts/2026-04-14-skills-platform-phase3/discovery.md
**Benefit-metric reference:** artefacts/2026-04-14-skills-platform-phase3/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, the platform supports the full self-improvement lifecycle at multi-squad scale: EA registry queries are live at discovery time with blast-radius data, the improvement agent can produce estimation calibration proposals from actuals, squads can contribute skills through a governed PR process, and a periodic compliance monitoring report provides an attestation artefact for the risk function. These four stories represent the platform operating as a self-sustaining improvement system rather than a manually-maintained toolset.

## Out of Scope

- The cross-team trace backend (prerequisite for p3.13) — that is Epic E5 which must be DoD-complete before p3.13 can proceed.
- The tamper-evidence registry (prerequisite for p3.13 audit attestation) — Epic E2.
- Real-time compliance dashboards or alerting — the p3.13 report is a scheduled periodic artefact, not a live dashboard.
- EA registry peer organisation data — p3.10 integrates the platform's own registry (Phase 2 p2.6) at discovery time; cross-organisation registry federation is Phase 4.
- SKILL.md content reviews for contributed skills — the contribution flow in p3.12 covers the governance process; content quality review is human judgment at PR time.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| MM1 — Estimation calibration continuity | Phase 2 norms established | E2 estimates within 25% of E3 for ≥70% of stories | p3.11 adds calibration adjustment proposals to the improvement agent |
| MM2 — Outer loop self-sufficiency | 0 blocking lookups in Phase 2 | 0 blocking lookups in Phase 3 | p3.10 eliminates manual EA registry lookup at discovery |
| CR1 — T3M1 independent validation | Prerequisite data | Full attestation view | p3.13 produces the periodic attestation report consumed by risk function |

## Stories in This Epic

- [ ] p3.10 — EA registry live query at discovery time (blast radius + dependency graph)
- [ ] p3.11 — Estimation calibration as improvement agent eval dimension
- [ ] p3.12 — Squad-to-platform skill contribution governed flow
- [ ] p3.13 — Compliance monitoring report: periodic attestation for risk function
- [ ] p3.14 — Framework concepts documentation suite for new-user onboarding (Phase 2 user feedback)

## Human Oversight Level

**Oversight:** Medium
**Rationale:** p3.12 (contribution flow) modifies the platform's own quality gate for accepting new skills — errors here could allow under-tested skills into the platform. p3.13 produces compliance-level attestation artefacts. Human review required for both. p3.10 and p3.11 are Medium by inheritance.

## Complexity Rating

**Rating:** 2
All four stories build on established Phase 2 mechanisms. p3.13 is the most complex (depends on E5 aggregated traces and E2 tamper-evidence); recommend against starting p3.13 until both E2 and E5 are DoD-complete.

## Scope Stability

**Stability:** Stable for p3.10, p3.11, p3.12; Unstable for p3.13 (depends on E2 and E5 completion)
