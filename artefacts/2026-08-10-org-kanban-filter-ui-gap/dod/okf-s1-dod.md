# Definition of Done: Org kanban has a working, tested product filter on the backend but no UI control to trigger it

**PR:** #709 (commit `7a7b18a1`) | **Merged:** 2026-08-10
**Story:** artefacts/2026-08-10-org-kanban-filter-ui-gap/stories/okf-s1-product-filter-dropdown.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 -- Dropdown lists all products + "All products", unfiltered board unchanged | Yes | `renderKanban_multipleProducts_rendersFilterDropdownWithAllProductsOption` (asserts form markup, `<option value="" selected>All products</option>`, both product names present) and `handleGetOrgKanban_noProductParam_passesFullProductListAndUnfilteredColumns` (asserts both products' journey cards render unfiltered AND both listed as dropdown options) | Unit + integration, both passed | None |
| AC2 -- Selecting a product navigates with `?product=<id>` and filters the board | Yes | `handleGetOrgKanban_withProductParam_dropdownNavigationFiltersBoard` (asserts Product B's card present, Product A's card absent, `<option value="pB" selected>` present) | Integration, passed | None |
| AC3 -- Filtered reload echoes the selected option | Yes | `renderKanban_filteredReload_selectedOptionReflectsCurrentFilter` (asserts `<option value="p2" selected>`, and that neither p1 nor "All products" carries `selected`) | Unit, passed | None |
| AC4 -- Single-product account: dropdown absent or disabled, pre-selected | Yes | `renderKanban_singleProduct_noDropdownOrDisabled` (asserts no filter form present with 1 product) | Unit, passed | Story allowed either "no dropdown" or "disabled dropdown, pre-selected" -- shipped code took the "no dropdown" branch only; the disabled-and-pre-selected variant was never separately exercised, but AC4's either/or wording is satisfied as written |

## Scope Deviations

None. The story's own Out of Scope items (`handleGetOrgKanban`'s filter query logic, multi-product/checkbox filtering, the per-product kanban view) were not touched, consistent with the DoR scope contract.

## Test Plan Coverage

`check-okf-s1-org-kanban-product-filter-ui.js`: 5 passed, 0 failed (freshly re-run 2026-08-17). This matches the test plan's full set: 3 unit tests (AC1, AC3, AC4) + 2 integration tests (AC1, AC2) -- all 5 named tests in the file executed and passed, no gaps against the test plan's AC Coverage table.

## NFR Status

| NFR | Status | Note |
|-----|--------|------|
| Correctness | Met | Closes the "backend exists, unreachable by any UI action" gap; the pre-existing `productFilter` server logic is now reachable and is exercised end-to-end by the integration tests |
| Usability | Met | Dropdown is present at ≥2 products and absent at 1 product, matching the story's stated zero-state convention (`bmau-s1`-aligned) |

## Metric Signal

No benefit-metric artefact is referenced by this story -- it is explicitly a short-track story (per its own Discovery/Benefit-metric reference fields: "None -- short-track skips discovery/benefit-metric"), with benefit stated directly as closing a UI-completion gap on an already-shipped, already-tested backend filter (`psh-s7`). No formal metric movement is claimed or measurable from this artefact set.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

Third instance this session of the "backend built and tested, zero UI trigger" pattern (alongside `smug-s1`, `bmau-s1`); all 4 ACs map to named, currently-passing tests with no fabricated or inferred coverage. Production longevity not independently confirmed (no post-merge incident record checked).
