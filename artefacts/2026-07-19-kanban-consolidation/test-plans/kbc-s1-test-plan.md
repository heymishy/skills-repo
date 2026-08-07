## Test Plan: Consolidate kanban rendering into one shared pattern; retire /features, /actions, /status

**Story reference:** artefacts/2026-07-19-kanban-consolidation/stories/kbc-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | one shared renderer, no duplicated column/card logic | 3 | — | — | — | — | 🟢 |
| AC2 | product kanban renders real HTML via shared renderer | 2 | 1 | — | — | — | 🟢 |
| AC3 | org kanban renders real HTML via shared renderer | 2 | 1 | — | — | — | 🟢 |
| AC4 | tenant board aggregates across all products | 2 | 1 | — | — | — | 🟢 |
| AC5 | /features /actions /status /status/export fully removed, no dangling refs | 4 | — | — | — | — | 🟢 |
| AC6 | renderKanban's own rendering behaviour preserved post-refactor | 3 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Fixtures — journey/feature fixtures at product, org, and tenant scope; existing `renderKanban` test fixtures reused where possible.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fixture columns/cards shape, called from 3 different scope-specific data-fetch functions | Fixture | None | |
| AC2 | Product fixture with journeys at multiple stages | Fixture | None | Reuses `handleGetProductKanban`'s existing data-shaping tests |
| AC3 | Org fixture with multiple products/features | Fixture | None | Reuses `handleGetOrgKanban`'s existing data-shaping tests |
| AC4 | Tenant fixture with 2+ products, each with journeys | Fixture | None | New — no existing tenant-aggregate test exists yet |
| AC5 | Full `server.js` route table + full test suite | Existing | None | Regression-style check, not new fixtures |
| AC6 | Existing `renderKanban`/`kanban-view.js` test fixtures | Existing fixtures | None | Confirm they still pass against the generalised function signature |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### U1 — shared renderer accepts a generic columns/cards shape
- **Verifies:** AC1
- **Precondition:** A generic fixture: array of `{ stage, cards: [{ id, title, health, ... }] }`
- **Action:** Call the generalised shared renderer directly
- **Expected result:** Produces HTML board markup — no product/org/tenant-specific assumptions baked into the renderer itself

### U2 — product-scope data-fetch feeds the shared renderer correctly
- **Verifies:** AC1, AC2
- **Precondition:** Product fixture with journeys at multiple `STAGE_COLUMNS` stages
- **Action:** Call the product-scope data function, feed its output to the shared renderer
- **Expected result:** Rendered HTML shows each journey under its correct stage column, with health label/icon

### U3 — org-scope data-fetch feeds the shared renderer correctly
- **Verifies:** AC1, AC3
- **Precondition:** Org fixture with multiple products/features
- **Action:** Call the org-scope data function, feed its output to the shared renderer
- **Expected result:** Rendered HTML shows each feature grouped correctly, same renderer as U2

### U4 — tenant-scope data-fetch aggregates across all of a tenant's products
- **Verifies:** AC4
- **Precondition:** Tenant fixture with 2 products, each with its own journeys at different stages
- **Action:** Call the new tenant-scope data function
- **Expected result:** Returns a single, merged column set covering journeys from BOTH products, not just one — confirms real cross-product aggregation, not accidentally scoped to only the first product found

### U5 — tenant-scope aggregate feeds the shared renderer correctly
- **Verifies:** AC1, AC4
- **Precondition:** Same as U4
- **Action:** Feed the tenant-scope function's output to the shared renderer
- **Expected result:** Rendered HTML shows journeys from both products on one board, same renderer as U2/U3

### U6 — renderKanban's existing rendering behaviour, generalised, still passes its own prior test cases
- **Verifies:** AC6
- **Precondition:** Existing `kanban-view.js` test fixtures (features + ideas shape)
- **Action:** Run existing test cases against the generalised renderer signature
- **Expected result:** Same rendered output as before generalisation — confirms the input-shape generalisation is backward-compatible with the original `renderKanban` call shape, or that any necessary adapter/mapping is applied at each call site

### U7 — "ideas" concept is optional in the generalised renderer
- **Verifies:** AC6, story's Out of Scope note on "ideas"
- **Precondition:** A fixture with columns/cards but no `ideas` array
- **Action:** Call the shared renderer without an `ideas` argument
- **Expected result:** Renders correctly with no ideas section — does not throw or render an empty/broken ideas block

### U8 — no route in server.js references the removed handlers
- **Verifies:** AC5
- **Precondition:** Full `server.js` source after removal
- **Action:** Grep/parse for any remaining reference to `handleGetFeatures`, `/features`, `/actions`, `/status`, `handleGetStatus`, `handleGetActionsHtml`, `handleGetStatusExport`
- **Expected result:** Zero references remain (excluding this story's own artefacts/comments)

### U9 — no remaining test file exercises the removed routes
- **Verifies:** AC5
- **Precondition:** Full `tests/` directory
- **Action:** Search for any test file asserting behaviour of `/features`, `/actions`, `/status`, `/status/export`
- **Expected result:** Any such test is either deleted (route genuinely gone) or migrated to test the surviving piece of logic it actually covered (e.g. a `renderKanban`-level test, not a route-level one)

---

## Integration Tests

### IT1 — GET a product's kanban view returns real HTML
- **Verifies:** AC2
- **Components involved:** Product-scope kanban route, shared renderer
- **Precondition:** Authenticated session, product fixture with journeys
- **Action:** GET the product kanban route
- **Expected result:** `Content-Type: text/html`, response body is a rendered board, not `{"columns": [...]}`

### IT2 — GET an org's kanban view returns real HTML
- **Verifies:** AC3
- **Components involved:** Org-scope kanban route, shared renderer
- **Precondition:** Authenticated session, org fixture
- **Action:** GET the org kanban route
- **Expected result:** Same as IT1, org scope

### IT3 — GET /dashboard?view=board returns a real, aggregated tenant board
- **Verifies:** AC4
- **Components involved:** `/dashboard` route extended with `view=board`, shared renderer
- **Precondition:** Authenticated session, tenant fixture with 2+ products
- **Action:** GET `/dashboard?view=board`
- **Expected result:** HTML board showing journeys from every one of the tenant's products

---

## NFR Tests

### Board rendering escapes all user/repo-supplied text
- **NFR addressed:** Security
- **Measurement method:** Fixture with HTML-special characters in a journey/feature name at each of the 3 scopes; assert escaped output
- **Pass threshold:** Zero raw HTML injection possible via any card's title/name field, at any scope
- **Tool:** Jest-style DOM/string assertions

### Tenant aggregate stays performant for a realistic product count
- **NFR addressed:** Performance
- **Measurement method:** Fixture with a tenant owning ~10 products (realistic upper bound for this platform's current usage), measure aggregate query + render time
- **Pass threshold:** No individual product's data fetch blocks sequentially — parallelised if the existing `handleGetDashboard` pattern already does this (it does, per `Promise.all` in its current implementation)
- **Tool:** Timing assertion in the integration test

---

## Out of Scope for This Test Plan

- Load-testing at a tenant product count far beyond current realistic usage — not a stated NFR target.
- Any UI/CSS styling regression testing — this is a rendering-logic consolidation, not a visual redesign.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Whether any external consumer (bookmark, script, another internal tool) depends on the removed `/features`/`/actions`/`/status` URLs | Cannot be exhaustively verified from code alone — this is a live product decision the operator already confirmed accepting | U8/U9 confirm no *internal* code dependency; external dependency risk is accepted by the operator's own "remove outright" decision, logged in decisions.md |
