# DoR Contract — wfp.3 Map workforce to initiatives (core direct-allocation)

**Story:** wfp.3
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- `src/workforce/map.js` — Node.js CommonJS module with exported functions:
  - `loadRoster(rosterPath)` — reads `workforce/roster.json`
  - `loadCostModel(costModelPath)` — reads `workforce/cost-model.json`
  - `loadPortfolioItem(slug, portfolioDir)` — reads `portfolio/[slug].json`; returns null if not found + emits warning
  - `processDirectAllocation(entry, roster, costModel)` — for `allocationMode: "direct"`: sums computedFTE from people array, computes cost, sets fteDelta
  - `computeFTEDelta(computedFTE, claimedFTE)` — returns numeric delta or null
  - `writeInitiativeMap(entries, outputPath)` — atomic write of initiative-map.json
  - `run(inputPath, options)` — CLI entry point; reads allocation-input.json, processes all entries, writes initiative-map.json
- `.github/skills/workforce-map/SKILL.md` — CLI skill definition

## What will NOT be built

- Profile-match or net-new allocation modes (wfp.4 scope)
- Dashboard tab rendering (wfp.5–wfp.8 scope)
- Multi-team rollup entries (wfp.8 scope)

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — direct allocation: computedFTE summed; cost computed | Unit: `processDirectAllocation` people=[2] test | wfp3-T1 |
| AC2 — portfolio slug match: claimedFTE/cost + fteDelta | Unit: `loadPortfolioItem` + delta test | wfp3-T2, wfp3-T3 |
| AC3 — unknown slug: null claimedFTE; warning to stderr | Unit: unknown slug test | wfp3-T4 |
| AC4 — missing person in roster: warning; contribution = 0 FTE | Roster lookup missing-person test | wfp3-T5 |
| AC5 — initiative-map.json written with required fields | Integration: `run` with fixture input | wfp3-T6 (integration) |
| AC6 — null rate for role: cost = 0; warning | `loadCostModel` null rate test | wfp3-T7 |

## Assumptions

- wfp.1 is DoD-complete before implementation begins (roster.json exists)
- `workforce/cost-model.json` populated with rates before invocation
- `portfolio/[slug].json` files exist for tracked initiatives

## Required touchpoints (MUST NOT be in out-of-scope list)

- `src/workforce/map.js` — new file
- `.github/skills/workforce-map/SKILL.md` — new file
- `tests/check-wfp3-map-core.js` — new file
- `package.json` — add test script entry

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/intake.js` — wfp.1 scope
- `src/workforce/update.js` — wfp.2 scope
- `dashboards/workforce.html` — wfp.5–wfp.8 scope
- Any existing test file other than `tests/check-wfp3-map-core.js`

## Schema dependencies

Upstream: wfp.1. No pipeline-state schema field dependency.
