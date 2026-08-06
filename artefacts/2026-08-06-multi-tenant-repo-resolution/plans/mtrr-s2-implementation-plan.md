# Implementation Plan: mtrr-s2 — Connect a repo by picking from your own accessible repos

**Story:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s2-repo-connection-picker.md
**Test plan:** artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s2-test-plan.md
**Branch:** mtrr-s2-repo-connection-picker (off origin/master, mtrr-s1 already merged)

## Reused surface (confirmed by reading the current code before planning)

- `src/web-ui/adapters/repo-adapter.js` already holds two D37 injectable adapters (`setRepoAdapter`/`getRepoAdapter` for access-check, `setCreateRepoAdapter`/`getCreateRepoAdapter` for repo creation). A third, `setListReposAdapter`/`getListReposAdapter`, follows the exact same pattern (throwing stub default, real GitHub implementation, wired in `server.js` only outside `NODE_ENV=test`).
- `src/web-ui/routes/product-repo.js`'s `_applyRepoChange` and `routes/products.js`'s `handlePutProductEdit` already write `repo_provider`/`repo_owner`/`repo_name` from a `PUT /products/:id` body of `{owner, repo}`. The picker's "select" action reuses this exact endpoint and body shape — no new write path, satisfying AC2 by construction rather than by a shape-matching assertion after the fact.
- `_renderProductView` (`src/web-ui/routes/products.js`, exported) already renders the "Connect GitHub repo" panel (`repoHtml`) when a product has no `repo_owner`/`repo_name`. This story extends that panel; the "connected" branch (repo info display) is untouched.
- `rpc-s1` (merged) already put "Create new repo" / "Connect existing" behind a click-through panel with a `PUT /products/:id` submit path (`rpcSubmitConnect`). This story keeps "Create new repo" as-is (untouched, prc-s2.1 scope) and replaces "Connect existing"'s bare URL-first default with a repo-picker default, keeping the URL fields as an explicit fallback/escape hatch.

## Tasks

1. **`src/web-ui/adapters/repo-adapter.js`** — add the third D37 adapter pair: `setListReposAdapter`/`getListReposAdapter`, throwing stub default, `realListRepos(accessToken)` calling `GET /user/repos` with the caller's own OAuth token (never a service account, matches ADR-020/existing two adapters in this file).
2. **`src/web-ui/modules/repo-picker.js` (new)** — pure/testable business logic, no DOM/markup:
   - `getAccessibleRepos(accessToken, listReposFn)`: session-scoped cache keyed by `accessToken` (module-level Map) so a repeat render never re-calls the adapter (NFR); returns `{ok:true, repos}` on success or `{ok:false, message}` on any failure (rate limit / scope / network) — never throws, so the caller always has something renderable (AC3's "operator never left with no way to proceed").
   - `filterRepoList(repos, query)`: pure case-insensitive substring filter against `owner/name` (AC4), independent of any DOM so it's directly unit-testable.
   - `_resetCacheForTests()`: test-only cache clear.
3. **`src/web-ui/routes/products.js`**:
   - `handleGetProductView`: when the product has no connected repo and the session has an `accessToken`, call `repoPicker.getAccessibleRepos(accessToken, repoAdapterModule.listRepos)` and pass the result into `_renderProductView` as a new, final parameter (`repoPickerResult`) — appended at the end of the existing (long) positional parameter list so every existing caller/test that doesn't pass it keeps working unchanged (verified: `check-a1-modules-taxonomy-crud.js`, `check-a4-module-grouped-rendering.js`, `check-a5-roadmap-tab.js`, `check-fps-s1-progress-proxy.js`, `check-pvc-s1-consolidate-and-tab-features-view.js`, `check-rpc-s1-connect-repo.js` all call it positionally without this param).
   - `_renderProductView`'s not-connected branch: when `repoPickerResult.ok` and it has repos, render the picker (search input + repo list, each with a "Select" button calling a new `rpcSelectRepo(productId, owner, repo)` client function that `PUT`s to `/products/:id` — the exact same endpoint/body `rpcSubmitConnect` already uses) as the default/primary view, with an "Enter a repo URL instead" link revealing the existing owner/repo fields. When `repoPickerResult` is falsy or `ok:false`, show the existing owner/repo URL fields directly (no extra click) — with a short explanatory message when a real fetch failure occurred (AC3). "Create new repo" stays exactly as-is (out of scope).
   - New inline client JS: `rpcFilterRepoPicker()` (AC4 — filters the already-rendered list client-side, zero extra GitHub calls per keystroke, matching the NFR) and `rpcSelectRepo()`.
4. **`src/web-ui/server.js`** — wire `setListReposAdapter(realListRepos)` under the same `if (process.env.NODE_ENV !== 'test')` guard used for the other two repo adapters in this file.
5. **Tests** (`tests/check-mtrr-s2-repo-connection-picker.js`, new) — the 6 tests from the test plan, written first (RED), then made to pass (GREEN):
   - `pickerListsAccessibleRepos_asPrimaryPath` (AC1, unit) — `_renderProductView` with a successful `repoPickerResult` shows the repo list as the primary view, not the bare URL fields.
   - `selectingRepoPopulatesSameColumnsAsUrlFlow` (AC2, unit) — the picker's selection reaches `handlePutProductEdit` with the same `{owner, repo}` body shape and produces an identical `UPDATE` to the URL-entry flow.
   - `rateLimitOrScopeFailure_fallsBackToUrlEntry` (AC3, unit) — `getAccessibleRepos` resolves `{ok:false}` on a thrown/rejected fetch, and `_renderProductView` falls back to the URL fields with a message.
   - `searchFilterNarrowsLargeRepoList` (AC4, unit) — `filterRepoList` narrows a 20+ fixture list correctly.
   - `repoConnectionEndToEnd_pickAndPersist` (AC1+AC2, integration) — load (mocked list) → select → `handlePutProductEdit` → product row updated, matching a direct URL-entry submission for the same repo.
   - `repoListLoadUnder2SecondsCached` (Performance NFR) — first call invokes the mock adapter once; a second `getAccessibleRepos` call with the same token does not call it again (cache-hit assertion) and both resolve well under 2 seconds.
6. **Regression check** — run the full suite via `node scripts/run-all-tests.js`, with particular attention to every `check-*repo*`/`check-*product*` file (`check-prc-*.js`, `check-rpc-s1-connect-repo.js`, `check-a1-modules-taxonomy-crud.js`, `check-a4-module-grouped-rendering.js`, `check-a5-roadmap-tab.js`, `check-fps-s1-progress-proxy.js`, `check-pvc-s1-consolidate-and-tab-features-view.js`, `check-tir-s5-github-org-bulk-add.js`) since `_renderProductView`'s signature and the repo-panel markup both change.

## Explicitly not touched

- `src/web-ui/adapters/export-data-source.js` and `ownerRepoForFeature` (mtrr-s1, merged).
- Repo-creation flow (`rpc-s2.1` / `handlePostProductRepoCreate`, `rpc-create-panel`).
- No new database columns or tables — only `prc-s1.1`'s existing `repo_provider`/`repo_owner`/`repo_name`.
