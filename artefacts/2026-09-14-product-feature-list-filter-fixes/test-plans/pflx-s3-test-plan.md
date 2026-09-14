# Test Plan: Collapsed group counts reflect the currently-filtered item count, not the unfiltered total (pflx-s3)

**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s3-live-group-counts.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-pflx-s3-live-group-counts.js`, using the same "extract the real generated script, run it in real jsdom against a real render" technique as `pflx-s1`/`pflx-s2` (`tests/check-icv-s1-ideate-canvas-turn2-render-fix.js`'s own established precedent).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | A group with mixed active/`definition-of-done` items shows a reduced `.a4-module-count` after a search filter narrows visible rows |
| T2 | AC2 | Behavioural | On initial render (before any interaction), with "Active only" checked by default, a group's count already reflects only its active items, not its full membership |
| T3 | AC3 | Behavioural | A group whose every item is `definition-of-done` shows `(0)` once "Active only" is checked (its default state) |
| T4 | AC4 | Regression | Unchecking "Active only" (and clearing search/health) restores every group's count to its original `groupFeatures.length` |
| T5 | AC5 | Behavioural | The same underlying group's count updates correctly and independently in both the By Module and By Phase tabs |

## Regression coverage

- `pflx-s1`'s own auto-expand tests re-run to confirm this story's added count-sync pass does not interfere with the existing expand/collapse logic (both run inside the same `pvcApplyFilters()`).
- `pflx-s2`'s own active-only tests re-run to confirm row-level hide/show behaviour is unchanged — this story only adds a header-count read-out on top of it.

## Out of Scope (per story)

- Auto-hiding zero-count groups.
- Recomputing the health-signal glyph or top-level health-chip counts.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
