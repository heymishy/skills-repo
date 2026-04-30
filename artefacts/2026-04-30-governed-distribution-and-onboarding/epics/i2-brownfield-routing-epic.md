## Epic: Brownfield teams can adopt the platform via a named entry path without abandoning prior investment

**Discovery reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/discovery.md
**Benefit-metric reference:** artefacts/2026-04-30-governed-distribution-and-onboarding/benefit-metric/initiative-2-brownfield-benefit-metric.md
**Slicing strategy:** User journey — stories follow the three brownfield entry paths in order of adoption likelihood: Entry A (story-first: teams with stories are most common) → Entry B (code-first: teams with code but no artefacts) → Entry C (no-history: least common but needs explicit routing to avoid no-path dead ends).

## Goal

A team with an existing codebase, existing stories, or live systems with no prior artefacts can run `/orient` once and receive a specific, named entry path (Entry A, B, or C) that tells them exactly which platform skill to run first — enabling platform adoption without the team discarding their existing work.

## Out of Scope

- A fourth brownfield entry pattern — if a team arrives with a context not covered by A/B/C, it is triaged as a new I2 extension story, not a hotfix to this epic.
- Deep code analysis beyond file and directory presence heuristics — `/orient` uses lightweight signals (presence of `artefacts/`, `src/`, `stories/`, git history markers) to classify entry type; it does not perform AST analysis or semantic understanding of existing code.
- Migrating existing stories into the platform-state.json format — that is a separate `migration-story.md` scope item.
- Integration with external project management tools (Jira, Linear) to import existing story data — post-I2 scope.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| I2-M1 — Brownfield team reaches supported entry path in one /orient interaction | Zero brownfield adoptions; no supported entry path exists | At least one brownfield team completes a real delivery cycle via Entry A/B/C without platform-team support | Each story (i2.1, i2.2, i2.3) adds one routing state to `/orient`; together they cover the full brownfield distribution |
| I2-MM1 — Entry A/B/C routing correctness | No brownfield detection exists | 100% correct routing for all three patterns; zero misroutes | This epic implements all three detection heuristics and routing outputs |
| I2-MM2 — Assumption 2 validation (three patterns cover real distribution) | Three patterns hypothesised from surveyed teams | 100% of brownfield adoption attempts in 90 days covered by A/B/C | Epic delivers the patterns; signal accumulates post-I2 from real adoption attempts |

## Stories in This Epic

- [ ] i2.1 — Entry A routing: detect existing stories without discovery, route to `/tdd` as brownfield inner loop entry
- [ ] i2.2 — Entry B routing: detect existing codebase without artefacts, route to `/reverse-engineer → /discovery`
- [ ] i2.3 — Entry C routing: detect no-history or ops-only repo, surface retrospective story path

## Human Oversight Level

Medium — brownfield routing correctness is critical (a wrong entry path recommendation could cause a team to waste significant time). Platform maintainer should review `/orient` output for all three entry types before recommending I2 for external use.
