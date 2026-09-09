# Test Plan: dmcb-s2 — multi-artefact cell blows out its column width

**Track:** Short-track (live production report, found while verifying dmcb-s1's fix on the same page)
**Reported:** operator, live on `skills-framework.fly.dev/features/2026-06-22-wuce-multi-tenancy` — after dmcb-s1's fix removed the spurious/duplicate columns, the operator's own screenshot still showed a very wide "Ref" column, and pointed out the same wide column in a screenshot I'd shared myself.

## Root cause (confirmed via live DOM inspection, not assumed)

`renderArtefactMatrix`'s cell-rendering (features.js:668-680) joins multiple artefacts landing in the same `(row, column)` cell with a plain space (`.join(' ')`) — an intentional cat-s4 fix (AC2) so a shared cell never silently drops any but the last artefact written to it. On `2026-06-22-wuce-multi-tenancy`'s "Unregistered" synthetic catch-all row, 3 real `reference/` documents share the Ref column's cell, rendering as 3 tick-links + 3 "Unregistered" pill badges all on one un-broken line (`.doc-matrix td`'s own `white-space: nowrap` rule, `html-shell.js:725`). Since HTML tables size a column to its single widest cell, this one crowded row forces the entire Ref column to 369px — even though every other row in the same column shows only a single dash. Confirmed live via `getBoundingClientRect()`: Ref column width 369px vs. RC/RCC/Plan/Rev/TP/Ver at 37-49px each.

## Fix

`renderArtefactMatrix`'s cell-rendering: when a cell holds more than one artefact, join them with `<br>` instead of a plain space, so multiple entries stack vertically within the cell rather than forcing the column wide. `<br>` forces a line break regardless of `white-space: nowrap` (that CSS property only governs wrapping at spaces/soft line breaks in text content, not explicit `<br>` elements) — no CSS change needed. A single-artefact cell (the overwhelming majority) renders byte-identical to before.

## Tests

- **T1 (regression):** a cell with 2+ artefacts renders them joined by `<br>`, not a plain space.
- **T2 (regression guard):** a cell with exactly 1 artefact renders identically to before this fix (no `<br>`, no behaviour change) — confirms the common case is untouched.
- **T3 (regression, existing coverage unchanged):** `check-cat-s4-features-page-integration.js`'s own multi-artefact-cell test (the one that originally proved "every entry renders, none silently dropped") still passes — this fix must not reintroduce that regression while changing the separator.

No CSS-layout-dependent ACs — the fix itself is a markup change (an explicit `<br>`), not a CSS rule, so it's fully assertable via HTML string checks.
