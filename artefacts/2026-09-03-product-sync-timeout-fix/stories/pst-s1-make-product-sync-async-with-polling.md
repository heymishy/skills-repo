# Story: Make product sync fire-and-forget with client-side polling, instead of one long blocking request

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/live-reproduced bug below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer / product owner clicking "Refresh" on a product page**,
I want **the sync request to return immediately and let the page poll for completion, instead of holding one HTTP request open for the entire GitHub-fetch-plus-rollup-computation duration**,
So that **I get a working sync instead of a cryptic client-side crash when the operation takes longer than the platform's own reverse-proxy timeout allows**.

## Benefit Linkage

**Metric moved:** Sync success rate for products with a large connected `pipeline-state.json` (operational reliability, not a formal benefit-metric artefact — short-track).
**How:** Live-reproduced on `skills-framework.fly.dev` (2026-09-03): clicking "Refresh" left the button on "Syncing…" for 90+ seconds, then failed with `Unexpected end of JSON input` — a `JSON.parse()` failure on an empty response body, confirmed via code reading (`handlePostProductSync` in `src/web-ui/routes/products.js` always returns a proper JSON body on any caught error; an empty body can only come from something outside the handler cutting the connection, almost certainly the platform's own reverse-proxy idle timeout). This makes sync functionally unusable for any product whose connected repo's `pipeline-state.json` is large enough that fetch-plus-compute exceeds that timeout — confirmed true for `skills-framework` itself today (1.34MB, 237 features). Removing the single-long-request architecture removes the timeout dependency entirely, regardless of how large the file grows.

## Architecture Constraints

- Reuses the existing `_syncsInProgress` in-memory tracking and `isSyncInProgress(productId)` guard (`src/web-ui/modules/product-rollup.js`, built by `pr-s3 AC4` for exactly this kind of in-flight-tracking purpose) — no new state-tracking mechanism.
- `handleGetProductView`'s existing `isSyncing` read (already passed into `_renderProductView`, already disables the Refresh button and shows "Syncing…" on page load when a sync is in progress) is reused unchanged — confirmed via code reading that this already works correctly today; this story does not need to build it.
- `triggerProductSync`'s own internal logic (the GitHub fetch, the five rollup computations, the Postgres UPSERT) is unchanged — only *when* the HTTP response is sent relative to when that work finishes changes.
- Known, pre-existing, explicitly out-of-scope limitation: `_syncsInProgress` is a single-process in-memory `Set`. If this app ever runs multiple instances behind a load balancer, in-flight tracking would not be shared across instances. This limitation already exists today (unrelated to this fix) and is not introduced or worsened by this story.
- No new npm dependencies.

## Dependencies

- **Upstream:** None.
- **Downstream:** None directly. The archive-completed-features initiative (`artefacts/2026-09-03-pipeline-state-archive-completed-features/`) will likely reduce the file size driving this timeout, but this fix stands on its own regardless of whether/when that ships — a smaller file makes sync faster, not just less broken.

## Acceptance Criteria

**AC1:** Given `POST /products/:id/sync` is called with a valid product/tenant and no sync already in progress for that product, When the request is received, Then the server performs its existing pre-flight validation (product exists and belongs to the caller's tenant, no sync already in progress, repo is configured) synchronously as it does today, but then returns an immediate acknowledgment response *before* the GitHub fetch and rollup computation complete — never blocking the HTTP response on that work.

**AC2:** Given the sync's background work (kicked off by AC1's request) completes successfully, When it finishes, Then `product_rollups` is updated exactly as it is today (unchanged `triggerProductSync` logic) — the only change is that no HTTP request is waiting to observe this directly.

**AC3:** Given the sync's background work throws an error, When it fails, Then the failure is logged server-side (so it remains diagnosable) rather than being silently swallowed — since no HTTP request is waiting to receive that specific error after AC1's immediate response.

**AC4:** Given the client's "Refresh" button triggers a sync and receives AC1's immediate acknowledgment, When the acknowledgment is received, Then the client begins polling a lightweight status check at a reasonable interval (target: every 3 seconds) — backed by the existing `isSyncInProgress(productId)` guard, not a new tracking mechanism — showing "Syncing…" throughout, until the poll reports the sync is no longer in progress, at which point the page reloads to show the fresh data.

**AC5 (regression guard):** Given `handleGetProductView`'s existing `isSyncing` read already disables the Refresh button and shows "Syncing…" on page load when a sync is in progress (confirmed working today via code reading — not new work), When this story's changes ship, Then this existing behaviour is unchanged and still passes its own coverage.

## Out of Scope

- Any change to `triggerProductSync`'s own internal computation (the GitHub fetch, the five rollup functions, the Postgres UPSERT) — this story only changes when the HTTP response is sent, not what work is done or how.
- Making `_syncsInProgress` durable across multiple app instances or process restarts (e.g. moving it to Postgres or Redis) — the existing in-memory, single-process limitation is unchanged; only relevant if this app is ever horizontally scaled, which it is not today.
- Reducing `pipeline-state.json`'s own size — that is the separate `2026-09-03-pipeline-state-archive-completed-features` initiative. This story fixes the sync mechanism's own architecture so it stops depending on the file staying small enough to fit inside one proxy-timeout window, regardless of that other initiative's timeline.

## NFRs

- **Performance:** The immediate acknowledgment response (AC1) must return in well under 1 second under normal conditions (only the existing pre-flight validation queries run synchronously) — the actual sync duration is unchanged, only decoupled from the client's own request lifetime.
- **Security:** None identified — no new external inputs, no new attack surface; the same tenant/product validation already performed today runs unchanged, synchronously, before the response is sent.
- **Accessibility:** The polling-driven "Syncing…" state must remain a real, `disabled`-attributed button state (matching the existing pattern), not a silent background operation with no visible feedback.
- **Audit:** None identified — no new data write; `product_rollups.synced_at` remains the audit trail for sync completion, unchanged.

## Complexity Rating

**Rating:** 2 — the core pattern (respond early, continue async work, poll for completion) is well understood, but requires careful handling of the async/background execution in Node (ensuring the response is truly sent before the sync work runs, and that a thrown error in the background path is caught and logged rather than becoming an unhandled promise rejection) plus a new lightweight status-check route.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
