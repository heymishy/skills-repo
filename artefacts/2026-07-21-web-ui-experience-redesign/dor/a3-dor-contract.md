**Contract Proposal — Compute health per-feature, distinct from test coverage**

**What will be built:**
An investigation (this story's own first task) tracing `computeHealthCounts`'s current input sources in `pipeline-state.json`, followed by an extension of that function to also return a per-feature health breakdown, persisted in the existing `product_rollups.health_counts` JSONB column (extended shape, not a new column).

**What will NOT be built:**
Any UI rendering of this data (that's A4). Any redefinition of what "health" means at the product level — this is a per-feature breakdown of the same existing concept.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test confirming extended return shape | unit |
| AC2 | Unit test confirming no silent coverage-derived equality | unit |
| AC2a | **NOT YET WRITTEN — depends on this story's own investigation outcome.** Placeholder in the test plan; must be concretized before this story's own implementation is considered complete. | TBD |
| AC3 | Unit + integration test confirming existing aggregate consumers unaffected | unit / integration |
| AC4 | Integration test confirming persistence via sync | integration |

**Assumptions:**
The real per-feature health signal source is currently unknown — this contract cannot commit to AC2a's concrete test approach until the investigation (named in Architecture Constraints) resolves. This is a genuine, acknowledged gap, not an oversight.

**Estimated touch points:**
Files: `src/web-ui/modules/product-rollup.js`
Services: Postgres (existing `product_rollups` table, extended JSONB shape)
APIs: None new — extends an existing internal computation
