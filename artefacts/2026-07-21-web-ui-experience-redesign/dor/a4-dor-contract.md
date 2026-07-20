**Contract Proposal — Render the product view grouped by module with dual health/coverage indicators and a scale gauge**

**What will be built:** Extension of `_renderProductView` in `products.js` to group epics by module (reading A1/A2's data), render health (A3) and coverage as two distinct indicators per epic/module, and add a scale gauge with a proportional distribution strip. A CSS grid-based expand/collapse transition for module sections (matching this session's own established `grid-template-rows: 0fr → 1fr` pattern).

**What will NOT be built:** The Modules CRUD UI itself (A1's job) or the Roadmap tab (A5's job).

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit + integration test on grouped rendering | unit / integration |
| AC2 | Unit + integration test on dual-indicator rendering | unit / integration |
| AC3 | Unit test on scale gauge | unit |
| AC4 | Unit + integration test on zero-module fallback | unit / integration |
| AC5 | Playwright E2E test on transition smoothness | E2E |

**Assumptions:** A1, A2, and A3 are merged and their data is queryable before this story's implementation begins.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`
Services: None new
APIs: None new — reads existing/extended data from A1–A3
