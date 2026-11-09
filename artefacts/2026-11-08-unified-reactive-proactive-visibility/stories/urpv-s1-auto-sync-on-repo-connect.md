## Story: Auto-sync a product's pipeline-state.json immediately on repo connection

**Epic reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/epics/urpv-e1-reactive-work-visibility.md
**Discovery reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **delivery engineer**,
I want to **see my connected repo's real pipeline-state.json data immediately after connecting it**,
So that **I'm not shown an empty or stale consolidated features view just because I haven't happened to click Refresh yet**.

## Benefit Linkage

**Metric moved:** Reactive-work coverage on the surface
**How:** This story makes the underlying data pipeline reliable at the moment a repo is connected — without it, the coverage metric would read a false 0% for any newly-connected product regardless of what stories 2 and 3 build, because `product_rollups` would be empty or stale, not because the rendering is actually missing anything.

## Architecture Constraints

- ADR-025 (multi-tenancy): the new sync trigger call must stay scoped by the same `productId`/`tenantId` already enforced in `_applyRepoChange` — no new cross-tenant query path introduced.
- No new injectable adapter: this story calls the *existing* `triggerProductSync(pool, pipelineStateFetchAdapter, opts)` (`product-rollup.js`) from within `_applyRepoChange` (`product-repo.js`) — the adapter itself (`pipeline-state-fetch-adapter.js`) is already wired and D37-compliant from prior work; this story adds a new call site, not a new adapter.
- Must follow the existing fire-and-forget pattern already established by the manual Refresh endpoint (`handlePostProductSync`, `products.js:3022`) — `triggerProductSync`'s own promise must not be awaited inline inside the repo-connect HTTP response path, for the same reason `pst-s1`'s own comment documents: a GitHub fetch + rollup computation can exceed the platform's reverse-proxy timeout for large repos.

## Dependencies

- **Upstream:** None
- **Downstream:** urpv-s2, urpv-s3, urpv-s4 all render data this story makes reliably available at connect time.

## Acceptance Criteria

**AC1:** Given a tenant admin successfully connects a GitHub repo to a product via `POST /products/:id/repo`, When the connection's existing `_applyRepoChange` logic completes its repo-access check and `UPDATE products` write, Then `triggerProductSync` is called for that `productId`/`repoOwner`/`repoName` without blocking the HTTP response that confirms the connection.

**AC2:** Given `triggerProductSync` was already in progress for this `productId` at the moment a repo connection request arrives (re-connect case), When `_applyRepoChange` attempts to trigger a new sync, Then the existing `isSyncInProgress` guard is respected — no second concurrent sync is started, and the repo-connect response still succeeds.

**AC3:** Given the auto-triggered sync fails (e.g. the GitHub API call errors), When `_applyRepoChange`'s response has already been sent as a successful connection, Then the failure is logged server-side via the same `console.error`/`_posthog.captureException` pattern `triggerProductSync`'s existing callers already use — the repo connection itself is never rolled back or reported as failed because of a sync failure.

**AC4:** Given a product's repo is connected and the auto-triggered sync completes successfully, When a user loads that product's detail page (`GET /products/:id`) shortly afterward, Then `_renderProductView` reflects real `health_counts`/`taxonomy` data from `product_rollups` — not an empty/pre-connection rollup row — without the user having clicked Refresh.

## Out of Scope

- A scheduled or periodic background resync after the initial connect-time sync — deferred per `decisions.md` (2026-11-09, SCOPE) pending real evidence of ongoing staleness.
- Any change to the manual Refresh button/endpoint's own behaviour — it continues to work exactly as before, for re-syncing after the initial connect-time sync.

## NFRs

- **Performance:** The repo-connect HTTP response must not be blocked by the GitHub fetch + rollup computation — same non-blocking requirement already enforced for the manual Refresh endpoint (`pst-s1` AC1).
- **Security:** The `accessToken` used for the sync is the same session-scoped `req.session.accessToken` already used by `_applyRepoChange` for the repo-access check — never persisted, never logged (CLAUDE.md canonical field name rule).
- **Accessibility:** None identified — backend-only change, no new rendered UI.
- **Audit:** A sync failure after auto-trigger is captured via the existing `_posthog.captureException` pattern — no new audit mechanism introduced.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
