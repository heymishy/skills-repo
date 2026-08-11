## Contract Proposal — Remove `smug-s1`'s promote/opt-out routes and old Standards tab rendering

**What will be built:**
Deletion of `handleGetProductStandardsTab`, `_renderStandardsTab`, `handlePutStandardPromote`, `handlePostStandardOptout` and `standards.js`'s `standardsPost`/`standardsList`/`standardsPut`. Nav "Standards" link repointed to the new view's route. Removal of `check-smug-s1-standards-tab-and-query-fix.js` and `check-rapp-s2-standards-tab-nav-and-breadcrumb.js`.

**What will NOT be built:**
DB table removal — `wugs-s12`.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test, request old routes, expect 404 | unit |
| AC2 | Unit test, render nav, inspect href | unit |
| AC3 | Manual check — confirm test files removed | manual |
| AC4 | Manual/CI check — repo-wide grep for removed export names | manual |

**Assumptions:**
Epics 1-3 are live and confirmed working before this story starts, per this epic's own sequencing rationale.

**Estimated touch points:**
Files: `src/web-ui/routes/products.js`, `src/web-ui/routes/standards.js`, `src/web-ui/utils/html-shell.js` (nav), `tests/check-smug-s1-*.js` (deleted), `tests/check-rapp-s2-*.js` (deleted)
Services: None
APIs: None
