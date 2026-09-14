# Test Plan: Hide a module/phase group entirely once its current filter leaves it with zero visible items (pflx-s5)

**Story:** artefacts/2026-09-14-product-feature-list-filter-fixes/stories/pflx-s5-hide-empty-groups.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-pflx-s5-hide-empty-groups.js`, using the same "extract the real generated script, run it in real jsdom against a real render" technique as `pflx-s1`/`s2`/`s3` (`tests/check-icv-s1-ideate-canvas-turn2-render-fix.js`'s own established precedent).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | A group whose "Active only" default leaves it at 0 visible items has its `.a4-module-section` hidden |
| T2 | AC2 | Behavioural | Unchecking "Active only" restores that group's count above 0 and its `.a4-module-section` becomes visible again |
| T3 | AC3 | Behavioural | A fixture where every group is empty under "Active only" shows a "No active features match" empty-state message in that tab |
| T4 | AC4 | Behavioural | The same underlying group hides/shows independently and correctly in both the By Module and By Phase tabs |
| T5 | AC5 | Regression | A group with at least one visible item is never hidden, and its count badge (`pflx-s3`) is unaffected |

## Regression coverage

- `pflx-s1`'s own auto-expand tests re-run to confirm hiding an empty group doesn't interfere with expand/collapse logic on non-empty groups.
- `pflx-s3`'s own count tests re-run to confirm count computation itself is unchanged.
- `pflx-s4`'s own tests re-run to confirm the upstream data fix this story depends on is unaffected.

## Out of Scope (per story)

- The "All" tab.
- Any change to count computation.
- Persisting hidden-group state across reloads.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
