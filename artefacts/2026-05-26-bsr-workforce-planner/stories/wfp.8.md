## Story: Multi-team initiative scope decomposition and rollup view

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-planning-dashboard.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md

## User Story

As a **Head of Engineering**,
I want to decompose a large initiative with a multi-team budget into named scope items, each assigned to a product group, and view the rolled-up FTE and cost totals alongside the individual team contributions,
So that I can confirm each team's allocation share against the parent initiative's portfolio claim in a single view without aggregating manually across teams.

## Benefit Linkage

**Metric moved:** M1 (Workforce + Initiative Reconciliation Time) and M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** Large cross-team initiatives currently require manual aggregation across multiple team entries before the claimed FTE can be checked. This story eliminates that aggregation step by having workforce-map produce a single rollup parent entry, reducing the reconciliation time for multi-team initiatives. The rollup tab makes the parent-vs-claimed comparison immediately visible, directly supporting M2 pre-GM coverage.

## Architecture Constraints

- Plain Node.js, CommonJS — consistent with all repo scripts (architecture-guardrails.md).
- No external npm dependencies not already in `package.json`.
- The `parentSlug` and `scopeLabel` fields in `workforce/allocation-input.json` are optional. Omitting them is fully backwards-compatible: existing allocation inputs produce identical output to a pre-wfp.8 invocation.
- workforce-map must NOT write separate child entries for scope items into `initiative-map.json` as top-level entries. Scope items appear only within the rollup parent's `scopeItems` array. This prevents double-counting when the dashboard renders both standalone entries and rollup entries.
- The "Initiative Rollup" tab in `workforce.html` is Tab 5 (after Tab 4: Leadership Coverage in wfp.7). It reads from `initiative-map.json` at load time via `fetch()` from the same relative path as all other tabs.
- CSS styling reuses the existing `delta-negative` / `delta-ok` classes established in wfp.6. No new colour values.

## Dependencies

- **Upstream:** wfp.3 (workforce-map core — produces initiative-map.json; parentSlug/scopeLabel parsing extends this flow) and wfp.4 (extended modes — profile-match and net-new entries may also be scope items of a parent) must be implemented first.
- **Upstream (dashboard):** wfp.5/wfp.6/wfp.7 define the tab bar and CSS conventions that wfp.8 extends. The tab bar must already render tabs 1–4 before Tab 5 is added.
- **Downstream:** none — this is the final story in the Planning Dashboard epic.

## Input Format Extension

Two optional fields are added to each entry in `workforce/allocation-input.json` (full Input Format definition in wfp.3):

```json
{
  "allocations": [
    {
      "slug": "platform-migration-api",
      "parentSlug": "platform-migration",
      "scopeLabel": "API Layer",
      "productGroup": "Platform Engineering",
      "allocationMode": "direct",
      "people": ["Alex Rahi", "Sam Okafor"]
    },
    {
      "slug": "platform-migration-data",
      "parentSlug": "platform-migration",
      "scopeLabel": "Data Migration",
      "productGroup": "Data Engineering",
      "allocationMode": "direct",
      "people": ["Jordan Tane", "Priya Nair"]
    }
  ]
}
```

`parentSlug` (optional): groups this allocation entry under a parent initiative. The value must be a valid portfolio slug or a warning is issued (matching the AC2 behaviour in wfp.3). Multiple entries sharing the same `parentSlug` are aggregated into one rollup entry in `initiative-map.json`.

`scopeLabel` (optional): human-readable label for this scope item shown in the rollup tab (e.g. "API Layer", "Data Migration", "UI Rebuild"). Falls back to the entry's own `slug` for display purposes if absent.

Entries without `parentSlug` are processed in standalone mode (wfp.3 AC1–AC6) unchanged.

## Acceptance Criteria

**AC1:** Given `workforce/allocation-input.json` contains two or more entries sharing the same `parentSlug` value (e.g. `"platform-migration"`), when I invoke `workforce-map`, then `initiative-map.json` contains exactly one rollup parent entry with: `slug` equal to the `parentSlug` value, `allocationMode: "rollup"`, `scopeItems` (array — each item contains `slug`, `scopeLabel`, `productGroup`, `allocationMode`, `computedFTE`, `computedCostPerQuarterNZD`, and `fteDelta` for that scope item), `totalComputedFTE` (sum of all `scopeItems[].computedFTE`), `totalComputedCostPerQuarterNZD` (sum of all `scopeItems[].computedCostPerQuarterNZD`), `claimedFTE` (from `portfolio/[parentSlug].json` `people.fte_demand` if the portfolio file exists, else `null`), `claimedCostNZD` (from portfolio if present, else `null`), and `fteDelta` (`totalComputedFTE` minus `claimedFTE`, or `null` if `claimedFTE` is null). The individual scope item entries do NOT appear as separate top-level entries in `initiative-map.json`.

**AC2:** Given `workforce/allocation-input.json` contains entries without a `parentSlug` field, when I run `workforce-map`, those entries are processed identically to wfp.3 AC1–AC6 (standalone mode). No rollup-related fields are added. Running the same input file before and after implementing wfp.8 produces identical `initiative-map.json` output for all entries that lack `parentSlug`.

**AC3:** Given exactly one allocation entry has a given `parentSlug`, when I run `workforce-map`, a rollup parent entry is still created with a `scopeItems` array of length 1. This is intentional: it allows an initiative to start with a single team's scope item and have additional teams added later without breaking the rollup structure.

**AC4:** Given `initiative-map.json` contains entries with `allocationMode: "rollup"`, when I open `workforce.html` in a browser and click Tab 5 "Initiative Rollup", then for each rollup entry the tab renders: a parent heading row showing the initiative slug, `totalComputedFTE`, `fteDelta` as a signed number (e.g. +2 or -3), and `totalComputedCostPerQuarterNZD` formatted as NZD; and beneath it, one indented child row per scope item showing `scopeLabel` (or `slug` if `scopeLabel` is absent), `productGroup`, `computedFTE`, and `computedCostPerQuarterNZD` formatted as NZD.

**AC5:** Given a rollup entry's `fteDelta` is negative (totalComputedFTE < claimedFTE), when I view Tab 5, the parent heading row's fteDelta cell has the `delta-negative` CSS class. Given `fteDelta` is zero or positive, the cell has the `delta-ok` CSS class. Given `fteDelta` is null (no portfolio file found), the cell renders the text "no claim" with no delta colour class.

**AC6:** Given `initiative-map.json` contains no entries with `allocationMode: "rollup"` (i.e. all entries are standalone), when I click Tab 5 "Initiative Rollup", then the tab body renders: "No multi-team scope decompositions found. Add `parentSlug` and `scopeLabel` to entries in `workforce/allocation-input.json` to group initiatives across teams."

## Out of Scope

- Nested rollup (a rollup inside a rollup / grandparent hierarchy) — Phase 1 supports one level of parent/child only; `parentSlug` on a scope item that itself has `parentSlug` entries is not supported and should produce a warning.
- Editing scope items or team assignments from the browser — read-only view only; modifications go through `allocation-input.json`.
- Drag-and-drop reordering of scope items within a rollup — out of scope for Phase 1.
- Exporting the rollup view — out of scope for Phase 1 (applies to all dashboard tabs per wfp-planning-dashboard epic).
