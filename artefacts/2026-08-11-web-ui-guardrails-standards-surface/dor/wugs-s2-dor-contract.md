## Contract Proposal — Show a product's own guardrails and standards, read live from its connected repo

**What will be built:**
A new view handler in `src/web-ui/routes/products.js` (e.g. `handleGetGuardrailsView`) rendering a product-level section using `wugs-s1`'s new fetch function against the product's `repo_owner`/`repo_name`. Wires `getProductsNavSummary` for the sidebar (matching `rapp-s2`'s pattern), with `activeProductId` set to the current product.

**What will NOT be built:**
Org-level content (`wugs-s3`), any edit capability (Epic 2), caching of fetched content.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, mocked `wugs-s1` fetch returning guardrails content | unit |
| AC2 | Unit test, mocked folder-entry array | unit |
| AC3 | Unit test, mocked `ArtefactNotFoundError` | unit |
| AC4 | Integration test, mocked `ArtefactFetchError`, isolated-section-failure assertion | integration |
| AC5 | Unit test, mock pool matching `getProductsNavSummary`'s real query shapes | unit |

**Assumptions:**
`products.repo_owner`/`repo_name` columns already exist and are populated by the existing `rpc-s1`/`prc-s2.1` connection flow — confirmed via `handlePostProductSync`'s existing query pattern.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `tests/check-wugs-s2-*.js` (new)
Services: None
APIs: None directly (consumes `wugs-s1`'s function)
