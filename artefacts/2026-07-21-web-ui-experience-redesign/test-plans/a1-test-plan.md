## Test Plan: Curate a Modules taxonomy for a product

**Story reference:** `artefacts/2026-07-21-web-ui-experience-redesign/stories/a1-modules-taxonomy-crud.md`
**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Test plan author:** Claude (agent)
**Date:** 2026-07-21

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Create a module, persisted, appears next load | 1 | 1 | — | — | — | 🟢 |
| AC2 | Rename preserves epic assignments | 1 | 1 | — | — | — | 🟢 |
| AC3 | Delete reassigns epics to Unassigned | 1 | 1 | — | — | — | 🟢 |
| AC4 | Duplicate name rejected | 1 | — | — | — | — | 🟢 |
| AC5 | Modules scoped per-product, not cross-visible | — | 1 | — | — | — | 🟢 |
| AC6 | D37 wiring: two products resolve independently and correctly | — | 1 | — | — | — | 🟢 |

## Coverage gaps

None.

## Test Data Strategy

**Source:** Mixed — synthetic in-memory fixtures for unit tests; a mocked `pool.query` (matching this repo's own established `products.js` test convention, e.g. `check-pr-s2-products-route.js`) for integration tests.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC5 | Two fixture products, each with 0–2 modules | Synthetic fixtures in the test file | None | Matches this repo's convention of literal fixture objects, not a seeded DB |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### createModule rejects a duplicate name within the same product
- **Verifies:** AC4
- **Precondition:** Product `p1` has a module named "Governance"
- **Action:** Call the module-create function again with name "Governance" for `p1`
- **Expected result:** Returns a rejection/error result; no second module record created
- **Edge case:** No

### renameModule updates the name without creating a new record
- **Verifies:** AC2
- **Precondition:** Product `p1` has module `m1` named "Old Name" with 2 epics assigned
- **Action:** Call rename with `m1` → "New Name"
- **Expected result:** `m1`'s name field updates; its `id` is unchanged; both previously-assigned epics still reference `m1`
- **Edge case:** No

### createModule succeeds for a genuinely new name
- **Verifies:** AC1
- **Precondition:** Product `p1` has zero modules
- **Action:** Call create with name "Governance & Gate Enforcement"
- **Expected result:** Returns a new module record with a generated `id`, `product_id: p1`, `name` as given
- **Edge case:** No

---

## Integration Tests

### POST /products/:id/modules persists a module and it appears in the next GET
- **Verifies:** AC1
- **Components involved:** route handler, mocked `pool.query`
- **Precondition:** Mocked pool returns empty module list on first GET
- **Action:** POST a create request, then GET the module list again
- **Expected result:** The GET response includes the newly created module

### DELETE /products/:id/modules/:moduleId reassigns its epics to Unassigned
- **Verifies:** AC3
- **Components involved:** route handler, mocked `pool.query` tracking UPDATE calls
- **Precondition:** Module `m1` has 2 epics assigned
- **Action:** DELETE `m1`
- **Expected result:** An UPDATE call is issued setting both epics' module reference to null/"Unassigned"; the module record itself is deleted; no epic is silently dropped from the response

### Module list for product B never includes product A's modules
- **Verifies:** AC5
- **Components involved:** route handler, mocked `pool.query` with tenant/product-scoped WHERE clause assertion
- **Precondition:** Product A has 2 modules, Product B has 0
- **Action:** GET modules for product B
- **Expected result:** Response is an empty list; the underlying SQL query includes a `product_id = $1` (or equivalent) filter matching product B's ID, not product A's

### Rename preserves epic assignment references end-to-end
- **Verifies:** AC2
- **Components involved:** route handler, mocked pool
- **Precondition:** Same as the unit test above, exercised through the real HTTP handler
- **Action:** PUT a rename request
- **Expected result:** Subsequent GET of the product view shows the epics still grouped under the renamed module

### setModulesAdapter wiring resolves two different products to two different, correct results
- **Verifies:** AC6 (D37 wiring test — behavioural correctness, not just that a function reference was assigned)
- **Components involved:** `setModulesAdapter`, a real (not mocked) Postgres-backed implementation wired in `server.js`
- **Precondition:** Product A has modules `["Governance", "Billing"]`; Product B has modules `["Onboarding"]` — created via two independent real database writes
- **Action:** Query modules for Product A, then independently for Product B, through the real wired adapter
- **Expected result:** Product A's query returns exactly `["Governance", "Billing"]`; Product B's returns exactly `["Onboarding"]` — two genuinely different, individually-correct results, proving the wiring is real and functioning, not merely present

---

## NFR Tests

### Module CRUD completes within budget for a large product
- **NFR addressed:** Performance
- **Measurement method:** Time a create/rename/delete cycle against a fixture with 200 epics
- **Pass threshold:** Under 500ms per operation
- **Tool:** Manual timing script (`node -e` timing harness, matching this session's own established pattern)

### Cross-tenant module access is rejected
- **NFR addressed:** Security
- **Measurement method:** Attempt a module create/rename/delete request with a session `tenantId` that doesn't own the target product
- **Pass threshold:** Request rejected (403/404), zero rows affected
- **Tool:** Integration test with a mocked mismatched-tenant session, matching this repo's existing `check-bri-s3.4-cross-tenant-isolation.js` convention

---

## Out of Scope for This Test Plan

- Reassigning epics between modules — covered by A2's own test plan.
- Rendering the module list in the UI — covered by A4's test plan.

## Test Gaps and Risks

None.
