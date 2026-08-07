## Definition of Ready: Feature display name at creation + rename

**Story reference:** artefacts/2026-07-25-feature-display-name-and-progress/stories/fdn-s1-feature-display-name.md
**Test plan reference:** artefacts/2026-07-25-feature-display-name-and-progress/test-plans/fdn-s1-feature-display-name-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-25

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | >=3 ACs | ✅ | 6 ACs |
| H3 | Every AC has >=1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage named | ✅ | Direct operator-reported UX gap (feature-naming clutter), found via live usage |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Short-track |
| H8 | No uncovered ACs | ✅ | |

**All hard blocks PASS.**

## Coding Agent Instructions

```
Proceed: Yes
Story: fdn-s1 -- artefacts/2026-07-25-feature-display-name-and-progress/stories/fdn-s1-feature-display-name.md
Test plan: artefacts/2026-07-25-feature-display-name-and-progress/test-plans/fdn-s1-feature-display-name-test-plan.md

Add an optional displayName field to the "New feature" modal, persisted via
_journeyStore.setJourneyFields at creation (handlePostProductFeature,
products.js). Add a small rename route (tenant-ownership-checked, matching
every other journey-scoped route's guard) that updates displayName via the
same mechanism -- never featureSlug. Render displayName instead of the raw
slug in _renderEpicRow and _renderPvcItemRow (products.js) whenever present,
falling back to the slug otherwise -- HTML-escaped like every other
user-supplied string in this file. Fix the real persistence gap: add
displayName to journey-store-pg.js's _sanitise() allowlist (currently an
explicit field list that would otherwise silently drop it on every
Postgres-backed restart). Thread displayName into product-rollup.js's
mergeFeatureSources for journey-sourced (not-yet-taxonomy-synced) items so
_renderPvcItemRow's item.name || item.slug fallback picks it up.

Do NOT touch featureSlug, its disk artefact path, or its pipeline-state.json
key anywhere in this story.

Oversight level: Low -- additive field using an existing generic
field-merge mechanism (setJourneyFields), no schema migration.
```

## Sign-off

**Oversight level:** Low
**Signed off by:** Hamish King, Founder/Operator, 2026-07-25 (short-track, operator-directed same session, found via live usage)
