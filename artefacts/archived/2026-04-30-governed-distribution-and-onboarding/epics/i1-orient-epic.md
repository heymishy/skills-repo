## Epic: Engineers and non-technical operators can discover what to do next without reading the docs

**Discovery reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/discovery.md
**Benefit-metric reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/benefit-metric/initiative-1-onboarding-benefit-metric.md
**Slicing strategy:** Risk-first — /orient routing correctness is the highest risk item; incorrect routing misleads new consumers at their most vulnerable point; the lockfile and CLI stories (i1-lockfile-cli-epic) build on top of a working orientation layer.

## Goal

A first-time or returning platform consumer can run `/orient` in any pipeline state and receive a specific, correct routing recommendation — which skill to run, and why — without reading the pipeline documentation, asking the platform team, or knowing in advance what phase they are in.

## Out of Scope

- Brownfield codebase detection (Entry A/B/C routing) — that is i2-brownfield-routing-epic scope.
- Executing any pipeline action on behalf of the operator — `/orient` routes only; it does not run other skills.
- Validating the quality or completeness of existing artefacts found in the repo — that is `/workflow` and `/trace` scope.
- CLI commands (`platform:init`, `platform:fetch`, `platform:pin`, `platform:verify`) — that is i1-lockfile-cli-epic scope.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| I1-M1 — Time-to-first-skill-run | Not established; observed range 15–45 min (with support) | Under 2 minutes from `platform:init` to first skill invocation | `/orient` removes the "which skill do I run?" blocker that causes most of the elapsed time |
| I1-M2 — Zero orientation contacts from platform:init users | All onboarding has required direct engineering support | Zero orientation contacts from platform:init users in 30 days | Any operator who ran platform:init and gets stuck can run `/orient` instead of asking the platform team |
| I1-MM3 — /orient routing coverage | No /orient skill exists | 100% correct routing for all 6 pipeline entry states | This epic implements all 6 routing states |

## Stories in This Epic

- [ ] i1.1 — `/orient` concierge skill: read artefact state and route operator to next pipeline skill

## Human Oversight Level

Medium — `/orient` is a new SKILL.md; its routing correctness is critical to the consumer experience. Platform maintainer should review the skill before it is used in a real onboarding session.
