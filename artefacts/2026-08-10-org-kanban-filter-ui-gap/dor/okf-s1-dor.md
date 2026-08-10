## Definition of Ready: okf-s1 — Org kanban has a working, tested product filter on the backend but no UI control to trigger it

**Story:** artefacts/2026-08-10-org-kanban-filter-ui-gap/stories/okf-s1-product-filter-dropdown.md
**Review artefact:** artefacts/2026-08-10-org-kanban-filter-ui-gap/review/okf-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-org-kanban-filter-ui-gap/test-plans/okf-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/products.js` — `handleGetOrgKanban` (~line 1676-1735): pass `prodRows` (id + name, full unfiltered list) and `productFilter` through to `renderKanban`'s `data` argument, alongside the existing `columns`.
- `src/web-ui/views/kanban-view.js` — `renderKanban(data)`: accept new optional `data.products` (array of `{id, name}`) and `data.selectedProductId`; when `products` has ≥2 entries, render a `<select>` (wrapped in a `<form method="GET">` or with an inline `onchange="location.href=...?product='+this.value"` navigation) with an "All products" option plus one option per product, the current `selectedProductId` marked `selected`. When `products` has 0-1 entries, render no dropdown (or a disabled one pre-selected) per AC4.
- New test file: `tests/check-okf-s1-org-kanban-product-filter-ui.js`.

**Files explicitly out of scope (must not be touched):**
- `handleGetOrgKanban`'s existing `productFilter` query-parsing and `prodRows.filter(...)` logic (`products.js:1680`, `1697-1699`) — reused exactly as-is.
- `handleGetProductKanban` (the separate per-product kanban route) — unaffected.
- `buildOrgKanbanColumns` / `_enrichColumnsWithArtefactCounts` — column-building logic unaffected; this story only adds the filter-selection UI around the already-correctly-filtered columns.

### Architecture Constraints

No new architectural decision — reuses the existing server-rendered, plain-GET-navigation convention already used throughout this view family (no client-side framework, no new JS dependency). No ADR required.

### Human oversight

**Low** — a single dropdown control and one additional data field threaded from handler to view; no new client-side state machine, no AJAX re-render (unlike `bmau-s1`'s selection-bar work).

### Coding Agent Instructions

1. In `handleGetOrgKanban` (`products.js`), after building `columns` (line ~1715) and before calling `renderKanban` (line ~1726), pass `products: prodRows.map(function(p){ return {id: p.product_id, name: p.name}; })` and `selectedProductId: productFilter || null` into the `data` object alongside `columns`.
2. In `renderKanban` (`kanban-view.js`), add the dropdown render branch described in the Scope Contract above. Use a plain `<form method="GET" action="/org/kanban">` wrapping a `<select name="product" onchange="this.form.submit()">` — no custom JS event wiring needed beyond the native form submit.
3. Write the 3 unit tests (`renderKanban_*`) + 2 integration tests (`handleGetOrgKanban_*`) per the test plan.
4. Run the new test file plus the existing org-kanban suites (`bri-s1.5`, `kbc-s1`, `s2.2` — whichever files currently cover `handleGetOrgKanban`/`renderKanban`) unmodified — zero regression, specifically confirming the existing unfiltered-board and artefact-count-enrichment behaviour is unchanged.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — plain GET navigation, no client-side re-render, no layout-dependent AC)

**PROCEED: Yes**
