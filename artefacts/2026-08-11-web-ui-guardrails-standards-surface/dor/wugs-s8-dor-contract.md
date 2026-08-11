## Contract Proposal — Request a product-level guardrail/standard be promoted to org level

**What will be built:**
A new `guardrail_promotion_requests` table (migration). A request handler that snapshots the entry's current content, inserts a `pending` row (deduplicating against an existing pending row for the same entry), and a UI indicator on `wugs-s2`'s view showing pending state.

**What will NOT be built:**
Approval/rejection (`wugs-s9`). Cancelling a pending request.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, mock pool, no existing pending request | unit |
| AC2 | Unit test, mock pool with an existing pending request | unit |
| AC3 | Unit test, mock pool with a pending request, view render check | unit |
| AC4 | Integration test, cross-tenant product ownership check | integration |

**Assumptions:**
None beyond `wugs-s2`'s already-established view structure.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `scripts/migrate-schema-pg.js` (new table), `tests/check-wugs-s8-*.js` (new)
Services: None
APIs: None
