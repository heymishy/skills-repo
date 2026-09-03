# Contract Proposal: Make product sync fire-and-forget with client-side polling

**Story reference:** artefacts/2026-09-03-product-sync-timeout-fix/stories/pst-s1-make-product-sync-async-with-polling.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## What will be built

1. Modify `handlePostProductSync` (`src/web-ui/routes/products.js`): keep the existing pre-flight validation (product exists/tenant match, no sync already in progress, repo configured) fully synchronous and unchanged, but send the HTTP response (an immediate acknowledgment) *before* awaiting `triggerProductSync`'s own work — continue that work in the background, wrapped in its own `.catch()` that logs any failure via `console.error` rather than letting it become an unhandled rejection.
2. Add a new lightweight route, `GET /products/:id/sync/status`, wired in `src/web-ui/server.js` alongside the existing `/sync` POST route, returning `{ inProgress: boolean }` sourced directly from the existing `_productRollup.isSyncInProgress(productId)` — no new state-tracking mechanism.
3. Update the inline client-side `pshTriggerSync` function (rendered inside `_renderProductView`'s own `<script>` block): after receiving the immediate acknowledgment, begin polling the new status endpoint at a ~3 second interval, keeping the button in its existing "Syncing…" disabled state throughout, and calling `window.location.reload()` once the poll reports `inProgress: false`.
4. Writes the 7 tests from the test plan: 4 unit, 1 integration, 2 NFR.

## What will NOT be built

- Any change to `triggerProductSync`'s own internal logic (the GitHub fetch, the five rollup computations, the Postgres UPSERT) — reused entirely as-is.
- Durable, multi-instance-safe in-flight sync tracking (e.g. moving `_syncsInProgress` to Postgres/Redis) — the existing single-process in-memory `Set` is reused unchanged; this app does not run multiple instances today.
- Any change to `2026-09-03-pipeline-state-archive-completed-features`'s own scope — that initiative may reduce sync duration as a side effect once it ships, but this story stands alone regardless of its timeline.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Deferred-promise mock sync adapter; assert `res.end`/`res.writeHead` (the ack) is called before the deferred promise is released | unit |
| AC2 | Same deferred-promise mock, resolved after the ack; assert the mock `pool.query`'s UPSERT call happened, matching today's unchanged shape | integration |
| AC3 | A rejecting mock sync adapter; assert `console.error` was called with the error after the ack was already sent | unit |
| AC4 | Presence/shape assertion on the rendered inline `<script>` (fetch URL pattern, polling interval, reload call) for the automatable portion; a manual scenario in the verification script for the real-browser timing/reload behaviour (DOM-behaviour gap, no E2E tooling configured for this route) | unit + manual |
| AC5 (regression) | Reuse the existing `isSyncing: true` fixture pattern already used by `check-pr-s2-products-route.js`'s own Refresh-disabled test; assert unchanged | unit |

## Assumptions

- Node's own HTTP server model keeps a background `async` operation running after `res.end()` has already been called, as long as the process itself stays alive — a standard, well-established pattern, not something this story needs to newly prove.
- A ~3 second polling interval is a reasonable default; the exact value is an implementation detail not prescribed precisely by any AC.
- The existing `isSyncInProgress`/`_syncsInProgress` guard's known single-process limitation (not shared across multiple app instances) is acceptable for this story, since this app does not run multiple instances today — explicitly named as Out of Scope in the story itself.

## Estimated touch points

Files: `src/web-ui/routes/products.js` (handler + inline client JS), `src/web-ui/server.js` (new route wiring), `tests/check-pst-s1-*.js` (new).
Services: None new.
APIs: One new internal endpoint (`GET /products/:id/sync/status`).
