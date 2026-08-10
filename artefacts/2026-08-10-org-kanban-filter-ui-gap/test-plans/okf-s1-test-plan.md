## Test Plan: Org kanban has a working, tested product filter on the backend but no UI control to trigger it

**Story reference:** artefacts/2026-08-10-org-kanban-filter-ui-gap/stories/okf-s1-product-filter-dropdown.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dropdown renders with all products + "All products", unfiltered board unchanged | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Selecting a product navigates with `?product=<id>` and filters the board | — | 1 test | — | — | — | 🟢 |
| AC3 | Filtered reload echoes the selected option | 1 test | — | — | — | — | 🟢 |
| AC4 | Single-product account: dropdown absent/disabled, pre-selected | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All four ACs are server-rendered markup/query-param assertions — no CSS-layout-dependent behaviour (no client-side re-render, unlike `bmau-s1`'s AC3) since this story uses a plain GET navigation, not an AJAX update. No RISK-ACCEPT or E2E tooling required per CLAUDE.md's B2 rule.

---

## Test Data Strategy

**Source:** Hand-authored fixtures matching `handleGetOrgKanban`'s existing `prodRows`/`productJourneyGroups` shapes, reusing the mock-pool pattern from existing org-kanban tests (`bri-s1.5`/`kbc-s1`/`s2.2` suites).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | ≥2 products, no `product` query param | Hand-authored mock pool | None | |
| AC2 | Same, with `?product=<id>` set | Hand-authored mock pool | None | |
| AC3 | Same as AC2 | Hand-authored mock pool | None | |
| AC4 | Exactly 1 product | Hand-authored mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### renderKanban_multipleProducts_rendersFilterDropdownWithAllProductsOption (AC1)

- **Verifies:** AC1
- **Precondition:** `renderKanban` called with `{ columns, products: [{id:'p1',name:'Product One'},{id:'p2',name:'Product Two'}], selectedProductId: null }`.
- **Action:** Render.
- **Expected result:** Output contains a `<select>` (or equivalent) with an option for each product plus an "All products" option; the board content (columns) is unchanged from today's output.

### renderKanban_singleProduct_noDropdownOrDisabled (AC4)

- **Verifies:** AC4
- **Precondition:** `renderKanban` called with `{ columns, products: [{id:'p1',name:'Product One'}], selectedProductId: null }`.
- **Action:** Render.
- **Expected result:** No `<select>` element present, OR a `<select disabled>` with `p1` pre-selected — either satisfies AC4's stated either/or.

### renderKanban_filteredReload_selectedOptionReflectsCurrentFilter (AC3)

- **Verifies:** AC3
- **Precondition:** `renderKanban` called with `{ columns, products: [{id:'p1',...},{id:'p2',...}], selectedProductId: 'p2' }`.
- **Action:** Render.
- **Expected result:** The `<option value="p2">` element carries the `selected` attribute; no other option does.

## Integration Tests

### handleGetOrgKanban_noProductParam_passesFullProductListAndUnfilteredColumns (AC1)

- **Verifies:** AC1
- **Precondition:** Mock pool returns 3 products, each with journeys; no `product` query param on the request.
- **Action:** `handleGetOrgKanban(req, res, next, mockPool, mockPosthog)`.
- **Expected result:** Response body includes all 3 products' journey cards (today's existing unfiltered behaviour, unchanged) AND all 3 products listed in the rendered dropdown.

### handleGetOrgKanban_withProductParam_dropdownNavigationFiltersBoard (AC2)

- **Verifies:** AC2
- **Precondition:** Same mock pool as above; request has `?product=p2`.
- **Action:** Same handler call.
- **Expected result:** Response body includes only `p2`'s journey cards — confirms the already-existing, already-correct `productFilter` server logic is now reachable via the real query param a dropdown navigation would set, and that the dropdown itself carries `p2` as selected (AC3's server-side half).

---

## NFR Tests

None beyond the ACs above.

---

## Out of Scope for This Test Plan

- The per-product kanban view (`/products/:id/kanban`) — unaffected, not covered here.
- Live browser confirmation of the dropdown's `onchange` navigation firing correctly — the plain-GET-navigation mechanism itself is standard HTML behaviour with no custom JS logic to unit test; covered adequately by the server-rendered markup assertions above, matching the level `smug-s1`'s own test plan used for its similarly simple query-driven UI.

---

## Test Gaps and Risks

None identified as blocking.
