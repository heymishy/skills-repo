## Contract Proposal — Show org-level guardrails/standards even when a product has no connected repo

**What will be built:**
A conditional branch in the view handler: when `repo_owner`/`repo_name` are both null, render a distinct "connect a repo" prompt (linking to the existing `rpc-s1`/`prc-s2.1` route) in place of `wugs-s2`'s normal product-level rendering, while `wugs-s3`'s org-level section renders unaffected.

**What will NOT be built:**
Changes to the repo-connection flow itself. Auto-prompting elsewhere in the product UI.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, mock product with null repo columns | unit |
| AC2 | Unit test, same + org content present | unit |
| AC3 | Unit test, inspect prompt href | unit |
| AC4 | Integration test, two sequential calls simulating a repo connection between them | integration |

**Assumptions:**
None beyond what `wugs-s2`/`wugs-s3` already established.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `tests/check-wugs-s4-*.js` (new)
Services: None
APIs: None
