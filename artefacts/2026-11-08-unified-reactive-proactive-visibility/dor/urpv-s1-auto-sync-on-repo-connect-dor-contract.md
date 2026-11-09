## Contract Proposal — Auto-sync a product's pipeline-state.json immediately on repo connection

**What will be built:**
Inside `src/web-ui/routes/product-repo.js`'s `_applyRepoChange` function, immediately after the existing repo-access check and `UPDATE products` write succeed, add a single fire-and-forget call: `triggerProductSync(pool, pipelineStateFetchAdapter, { productId, tenantId, repoOwner, repoName, accessToken: req.session.accessToken })`. The call's returned promise is not awaited inline on the HTTP response path; a `.catch` handler attached to it logs any rejection via the existing `console.error`/`_posthog.captureException` pattern already used by `product-rollup.js`'s other callers. No new function is introduced in `product-rollup.js` — `triggerProductSync` and its own `isSyncInProgress` guard already exist and are reused as-is.

**What will NOT be built:**
A scheduled or periodic background resync mechanism. This story only fixes the sync-on-connect gap; an always-on polling mechanism is explicitly deferred (`decisions.md`, 2026-11-09, SCOPE entry) pending real evidence of ongoing staleness after this fix ships.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test asserting the HTTP response completes without waiting on a mocked never-resolving `triggerProductSync` promise | unit |
| AC2 | Integration test with `isSyncInProgress` mocked `true`, asserting the mocked adapter fetch is not called a second time | integration |
| AC3 | Unit test forcing a rejected `triggerProductSync` promise after response-send, asserting `console.error`/`_posthog.captureException` is called and no rollback occurs | unit |
| AC4 | Integration test awaiting the triggered sync directly, then asserting `GET /products/:id` reflects real `health_counts`/`taxonomy` data | integration |

**Assumptions:**
- `req.session.accessToken` is already populated and valid at the point `_applyRepoChange` runs (the existing repo-access check earlier in the same handler already depends on this being true).
- `triggerProductSync`'s existing signature accepts the same argument shape the manual Refresh endpoint (`handlePostProductSync`) already passes it — no signature change needed.

**Estimated touch points:**
Files: `src/web-ui/routes/product-repo.js` (add the call site), `src/web-ui/modules/product-rollup.js` (reused, unmodified). Services: none new. APIs: none new — reuses the existing `POST /products/:id/repo` route.

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatch found: each AC maps to a specific, named function-level behaviour change or assertion against existing, already-wired primitives (`triggerProductSync`, `isSyncInProgress`), consistent with the story's own Architecture Constraints (no new injectable adapter, existing fire-and-forget pattern, `req.session.accessToken` canonical field).
