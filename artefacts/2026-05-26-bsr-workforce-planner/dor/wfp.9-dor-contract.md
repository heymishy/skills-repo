# DoR Contract — wfp.9 Author and maintain workforce-to-initiative allocation assignments

**Story:** wfp.9
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-26

---

## What will be built

- `src/workforce/assign.js` — new module implementing three allocation authoring modes:
  - `runAutoDerive(opts)`: product-group matching against portfolio/*.json and roster.json; writes `_autoderived: true` root flag and `_reviewRequired: true` on every entry; summary stdout
  - `runFileImport(opts)`: xlsx/csv import via `require('xlsx')`; column validation; row merge by slug; optional-column omission (not null); unmatched-person stderr warning
  - `runGuided(opts)`: interactive terminal loop using injectable `_promptFn` adapter; person validation against roster; skip/net-new options
  - `runAssign(opts)`: entry dispatcher routing to the three mode runners
  - `setPromptFn(fn)` / `getPromptFn()`: D37 injectable adapter (stub must throw)
  - `atomicWrite(dest, content)`: write to `.tmp`, then `fs.renameSync()` to dest
  - `overwriteGuard(opts)`: mode-agnostic existing-file guard
  - Exported constant `MIN_COVERAGE_SCORE = 0.6` (used by wfp.10)
- `.github/skills/workforce-assign/SKILL.md` — skill instructions + CLI runner block that wires the readline adapter (D37 production wiring)
- `tests/check-wfp9-assign.js` — 20 unit tests covering all 9 ACs

## What will NOT be built

- Incremental merge into an existing `allocation-input.json`
- A browser UI for assignment authoring
- Skills validation in guided or file-import modes
- `parentSlug` / `scopeLabel` generation in auto-derive mode
- Any new npm package not already in `package.json`

## AC verification table

| AC | Verified by | Test IDs |
|----|-------------|----------|
| AC1 — guided happy path (squad, person, skip) | Unit: mock promptFn | T1, T2, T3 |
| AC2 — guided invalid person re-prompts | Unit: mock promptFn sequence | T4 |
| AC3 — file import xlsx/csv row merge | Unit: xlsx + csv fixtures | T5, T6 |
| AC4 — unmatched person warning (stderr, still included) | Unit: roster miss | T7 |
| AC5 — missing required column exits nonzero, no output | Unit: missing initiative-slug | T8 |
| AC6 — auto-derive root flags + summary stdout | Unit: fixture run | T10, T11, T12, T13 |
| AC7 — no portfolio files exits nonzero | Unit: absent + empty dir | T14, T15 |
| AC8 — overwrite protection all modes | Unit: 3 mode tests | T16, T17, T18 |
| AC9 — overwrite flag replaces file atomically | Unit: overwrite + JSON validity | T19, T20 |

## Assumptions

- wfp.1 (workforce-intake) is DoD-complete — `workforce/roster.json` is readable
- `xlsx` npm package is in `package.json` (introduced by wfp.1)

## Required touchpoints (MUST be in implementation)

- `src/workforce/assign.js` — new file
- `.github/skills/workforce-assign/SKILL.md` — new file
- `tests/check-wfp9-assign.js` — new file
- `package.json` — append `&& node tests/check-wfp9-assign.js` to `scripts.test`

## Out-of-scope constraints (MUST NOT touch)

- `workforce/roster.json`, `workforce/initiative-map.json`, `portfolio/` — read-only inputs; not written by this story
- `dashboards/` — read-only for wfp.9; no dashboard changes
- Any existing `src/workforce/*.js` files other than the new `assign.js`
- `tests/check-wfp1-*.js` through `tests/check-wfp8-*.js` — must not be modified

## Schema dependencies

Upstream: wfp.1 (roster.json schema). No pipeline-state schema field dependency.
