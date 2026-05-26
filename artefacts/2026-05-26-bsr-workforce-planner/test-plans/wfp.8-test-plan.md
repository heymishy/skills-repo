# Test Plan: Multi-team initiative scope decomposition and rollup view

**Story reference:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.8.md
**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Test plan author:** Copilot
**Date:** 2026-05-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Entries sharing parentSlug → single rollup entry with scopeItems, totals, portfolio claim | 6 tests | 1 test | — | — | — | 🟢 |
| AC2 | Entries without parentSlug → standalone processing unchanged (backwards compatible) | 2 tests | — | — | — | — | 🟢 |
| AC3 | Single scope item → rollup entry with scopeItems of length 1 | 1 test | — | — | — | — | 🟢 |
| AC4 | Tab 5 renders parent row + indented child rows; scopeLabel displayed | 4 tests | — | 1 test | — | — | 🟢 |
| AC5 | Delta colour coding: delta-negative, delta-ok, null → "no claim" | 3 tests | — | — | — | — | 🟢 |
| AC6 | Empty state message when no rollup entries | 1 test | — | 1 test | — | — | 🟢 |
| NFR-SEC | No external network calls | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — colour checks verified by CSS class name presence; all ACs automatable.

---

## Test Data Strategy

All test data is synthetic. No real PII.

- **Rollup fixture (engine):** 2 allocation-input entries sharing `parentSlug: "platform-migration"` — one with `scopeLabel: "API Layer"`, one with `scopeLabel: "Data Migration"`. Portfolio file `portfolio/platform-migration.json` present with `fte_demand: 5`.
- **Standalone fixture:** 1 allocation-input entry with no `parentSlug` — processed identically to wfp.3.
- **Mixed fixture:** Combines rollup and standalone entries in a single allocation-input array.
- **Dashboard fixtures:** `initiative-map.json` entries with `allocationMode: "rollup"` and non-null `scopeItems`.
- Rendering functions extracted to `dashboards/wfp-functions.js`; engine logic in `src/workforce/map.js` (extends wfp.3/wfp.4 processing pipeline).

---

## Unit tests — Engine (src/workforce/map.js)

Test file: `tests/check-wfp8-rollup.js`
Run command: `node tests/check-wfp8-rollup.js`
Source under test: `src/workforce/map.js` (adds `groupByParentSlug`, `processRollupGroup`) and `dashboards/wfp-functions.js` (adds `renderRollupTab`)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 1 | `rollup-groups-entries-by-parent-slug` | AC1 | 2 entries with same `parentSlug: "platform-migration"` | `groupByParentSlug` returns map with key `"platform-migration"` → array of length 2 |
| 2 | `rollup-entry-has-allocationMode-rollup` | AC1 | `processRollupGroup` on 2-entry group | Result entry has `allocationMode: "rollup"` |
| 3 | `rollup-entry-slug-is-parent-slug` | AC1 | `processRollupGroup` with `parentSlug: "platform-migration"` | Result entry `slug === "platform-migration"` |
| 4 | `rollup-total-fte-is-sum-of-scope-items` | AC1 | Scope item A computedFTE=2, item B computedFTE=3 | `totalComputedFTE: 5` |
| 5 | `rollup-total-cost-is-sum-of-scope-items` | AC1 | Scope item A cost=30000, item B cost=45000 | `totalComputedCostPerQuarterNZD: 75000` |
| 6 | `rollup-scope-items-not-top-level-entries` | AC1 | Process entries with parentSlug | `initiative-map.json` contains rollup parent entry at top level; individual scope item slugs do NOT appear as separate top-level entries |
| 7 | `standalone-entries-unchanged` | AC2 | Entry without `parentSlug` in same invocation | Entry in result matches wfp.3 AC1 output exactly; no `scopeItems` or `allocationMode: "rollup"` |
| 8 | `mixed-rollup-and-standalone-both-present` | AC2 | 1 rollup group + 1 standalone entry | Both appear in output; rollup as parent entry + scope items; standalone as direct entry |
| 9 | `single-scope-item-creates-rollup` | AC3 | 1 entry with `parentSlug: "solo-initiative"` | Rollup entry created with `scopeItems.length === 1` |

---

## Unit tests — Dashboard (dashboards/wfp-functions.js)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| 10 | `render-rollup-parent-row` | AC4 | Rollup entry with `totalComputedFTE: 5` | Parent row HTML contains "platform-migration" slug and `totalComputedFTE` value |
| 11 | `render-scope-item-child-rows` | AC4 | Rollup entry with 2 scopeItems | 2 child row elements rendered; each with indented visual style (CSS class or indent element) |
| 12 | `render-scope-label-shown` | AC4 | scopeItem with `scopeLabel: "API Layer"` | "API Layer" text appears in rendered child row |
| 13 | `render-scope-label-fallback-to-slug` | AC4 | scopeItem with no `scopeLabel` field | scopeItem `slug` value used for display instead |
| 14 | `render-negative-delta-has-delta-negative-class` | AC5 | Rollup entry with `fteDelta: -2` | Parent row delta cell has CSS class `delta-negative` (consistent with wfp.6) |
| 15 | `render-positive-delta-has-delta-ok-class` | AC5 | Rollup entry with `fteDelta: 1` | Parent row delta cell has CSS class `delta-ok` |
| 16 | `render-null-delta-shows-no-claim-text` | AC5 | Rollup entry with `fteDelta: null` | Delta cell rendered as "no claim" |
| 17 | `render-empty-state-no-rollup-entries` | AC6 | `renderRollupTab([])` — empty initiative-map | Returns HTML containing message about no rollup entries |
| 18 | `nfr-sec-no-external-fetch` | NFR-SEC | Static analysis of `dashboards/workforce.html` source | No absolute-URL fetch; no CDN script tags for Tab 5 additions |

---

## Integration tests

Test file: `tests/check-wfp8-rollup.js` (same file, integration section)

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| I1 | `integration-rollup-produces-correct-initiative-map` | AC1 | Full `workforce-map` invocation with rollup fixture | `initiative-map.json` written; parent rollup entry present; no standalone child entries at top level |

---

## E2E tests

Test file: `tests/e2e/wfp8-rollup-tab.spec.js`
Run command: `npm run test:e2e -- --grep "wfp8"`

| # | Test ID | AC | Scenario | Expected |
|---|---------|-----|---------|---------|
| E1 | `e2e-rollup-tab-shows-parent-with-children` | AC4 | Load fixture with 1 rollup parent (2 scope items); navigate to Tab 5 | Parent row visible; 2 child rows indented below parent |
| E2 | `e2e-rollup-empty-state-message` | AC6 | Load initiative-map.json with no rollup entries; navigate to Tab 5 | Empty state message visible |

---

## Total test count

**18 unit + 1 integration + 2 E2E = 21 tests**
All automated tests are expected to FAIL before implementation (RED phase of TDD).
