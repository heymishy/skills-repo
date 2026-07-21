**Contract Proposal — Curate a Modules taxonomy for a product**

**What will be built:**
A new `product_modules` Postgres table (id, product_id, tenant_id, name, created_at) and a new `modules` foreign key column on the existing epic-taxonomy representation. New route handlers: `POST /products/:id/modules` (create), `PUT /products/:id/modules/:moduleId` (rename), `DELETE /products/:id/modules/:moduleId` (delete + reassign epics to null/"Unassigned"). A new D37 injectable adapter `setModulesAdapter()` wired to a real Postgres implementation in `server.js`, following the exact pattern already established for `setCreditsAdapter`/`setGetUserRole` in the same file.

**What will NOT be built:**
Any default/starter module set for new products (confirmed operator-curated only, zero defaults). Reassignment of epics between modules (that is story A2 — this story only creates the modules and the storage layer A2 will write to).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on create function + integration test on POST route | unit / integration |
| AC2 | Unit test on rename function + integration test confirming epic references survive | unit / integration |
| AC3 | Integration test on DELETE confirming epic reassignment to Unassigned | integration |
| AC4 | Unit test on duplicate-name rejection | unit |
| AC5 | Integration test confirming tenant/product-scoped WHERE clause | integration |
| AC6 (D37 wiring) | Integration test with two real products, asserting two distinct correct result sets | integration |

**Assumptions:**
Modules are stored as a genuinely new table (not repurposing any existing table) — no existing schema has a natural home for this concept. The `product_rollups` JSONB `taxonomy` column is NOT reused for module storage, since module assignment needs to be independently mutable outside of a sync cycle.

**Estimated touch points:**
Files: `src/web-ui/server.js` (table creation, adapter wiring, route registration), `src/web-ui/routes/products.js` (route handlers), a new `src/web-ui/adapters/modules-adapter.js`
Services: Postgres (new table)
APIs: 3 new REST endpoints under `/products/:id/modules`
