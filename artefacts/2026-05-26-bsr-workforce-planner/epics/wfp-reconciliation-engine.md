## Epic: Initiative Reconciliation Engine

**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Slicing strategy:** User journey

## Goal

The Head of Engineering can invoke a single skill to link squad and individual allocations to portfolio initiative slugs across all three modes (direct, profile-match, net-new), compute actual FTE and cost against what was claimed in portfolio submissions, and produce a machine-readable `workforce/initiative-map.json` and a human-readable gap report. The reconciliation that previously took 2–4 hours of cross-referencing xlsx and portfolio docs completes in a single invocation.

## Out of Scope

- Dashboard rendering of reconciliation results — addressed in Epic 3 (wfp-planning-dashboard)
- Writing back to portfolio files (`portfolio/[slug].json`) — explicitly excluded in discovery constraints; portfolio files are read-only inputs
- Automated scheduling or event-driven reconciliation — operator-initiated only for Phase 1
- Handling portfolio slugs from repositories other than the enterprise fork's `initiative-intake` skill output — out of scope; reads `portfolio/[slug].json` at a fixed path only

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1: Workforce + Initiative Reconciliation Time | TBD (est. 2–4 hrs manual) | < 10 min | This skill replaces manual cross-referencing; a single invocation produces the complete reconciliation |
| M2: Pre-GM Initiative FTE Cross-Check Coverage | 0% | 100% at first FY GM | `workforce/initiative-map.json` completeness is the measurement vehicle for M2 |
| M3: Hiring Gap Specificity Rate | 0% (headcount only today) | 100% (structural — skill enforces role + skill tags per gap) | Net-new gap entries in initiative-map.json must contain role + skill tags — the skill enforces this structurally |

## Stories in This Epic

- [ ] wfp.3 — Map workforce to initiatives with direct allocation, FTE delta, and cost inference
- [ ] wfp.4 — Extended workforce-map modes: profile-match and net-new gap

## Human Oversight Level

**Oversight:** Low
**Rationale:** Reads roster.json and portfolio/*.json (read-only); writes initiative-map.json locally. No external calls, no shared infrastructure. Operator reviews output before any planning decision.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
