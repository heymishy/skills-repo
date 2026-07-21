**Contract Proposal — Reassign an epic to a different module**

**What will be built:**
A `PUT /products/:id/epics/:epicId/module` route handler updating the epic's module reference (via A1's storage layer), plus the corresponding "Move to ▾" UI control on each epic row.

**What will NOT be built:**
Bulk reassignment of multiple epics at once — single-epic reassignment only.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on reassign function | unit |
| AC2 | Unit test on unassigned→module transition | unit |
| AC3 | Unit test confirming same-module reassignment is a no-op | unit |
| AC4 | Integration test rejecting cross-product reassignment | integration |

**Assumptions:**
Reassignment is a simple foreign-key update on the epic's module reference — no cascading changes to story-level data.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `src/web-ui/adapters/modules-adapter.js` (extends A1's adapter)
Services: Postgres (existing `product_modules` table from A1)
APIs: 1 new REST endpoint
