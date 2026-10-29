## Story: Tenant-match guard on pipeline-state-derived journey features

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`) — security/data-isolation bug fix.

## Background

`_mergeStateFeaturesIntoJourneyList` (`src/web-ui/routes/journey.js`, called from `handleGetJourney`, the plain `GET /journey` handler) merges every non-terminal-stage feature from `getRepoRoot(req)`'s own `.github/pipeline-state.json` into the response, with no check that the content actually belongs to the requesting tenant.

**Correction made during review of this story's own first draft:** `GET /journey` is explicitly documented in its own code as the "no product" bucket (`journeys = journeys.filter(function(j) { return j.productId == null; });`, pan-s1 AC4) — a `?productId=` query string on this URL has no effect on this handler at all (confirmed by reading `server.js`'s route dispatch: `/journey` always calls `handleGetJourney` regardless of query params). So the leak is not "per product" — it is **every authenticated session of every tenant that loads plain `/journey`**, full stop. This ruled out an earlier draft of this story's own fix design (comparing a *product's* `repo_owner`/`repo_name` against `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`) — there is no product in scope at this call site to compare at all.

The correct comparison is tenant-level, using the exact same identity check `registerSelfAsProduct` (`server.js`, pr-s1) already uses to decide "is this the platform's own self-hosted tenant": `process.env.PLATFORM_TENANT_ID`. That env var, together with `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`, is what the self-hosted `skills-framework` product's own registration already depends on — reusing it here is consistent with an already-established pattern, not a new concept.

`getRepoRoot(req)` never consults any tenant or product configuration when `WUCE_TENANT_ROOT_BASE` is unset (confirmed unset on both `wuce-staging` and `skills-framework` production, via `flyctl secrets list` and the committed `fly.toml`'s `[env]` block). It falls back to `path.resolve('.')` — the deployed app's own source directory — for every tenant unconditionally.

**Confirmed live on staging, 2026-10-29:** loading `/journey` under a session whose active tenant was `mtrr-s2 live-verify probe` (a product with **no repo connected at all** — "Not yet synced", 0 epics, 0 stories on its own product page) showed 344 features. Every one of them was `heymishy/skills-repo`'s own internal pipeline-state.json content (including this very feature's own sibling stories).

## User Story

As a **tenant on a shared skills-platform deployment**,
I want **my `/journey` page to never show another tenant's (or the platform's own) internal delivery backlog**,
So that **I never see or mistake someone else's work item for my own, and the platform's own internal roadmap is never exposed to a customer**.

## Acceptance Criteria

**AC1:** Given a tenant whose session `tenantId` does not equal `process.env.PLATFORM_TENANT_ID`, When that session loads `GET /journey`, Then zero pipeline-state.json-derived (merged) features appear in the response — only that tenant's own real journey-store entries (if any) are shown.

**AC2:** Given a session whose `tenantId` genuinely equals a non-empty `process.env.PLATFORM_TENANT_ID` (the one legitimate self-hosted case), When that session loads `GET /journey`, Then its own real pipeline-state.json features continue to appear exactly as before — no regression.

**AC3:** Given `process.env.PLATFORM_TENANT_ID` is unset or empty (no self-hosted tenant configured at all, e.g. a fresh install), When any session loads `GET /journey`, Then zero pipeline-state.json-derived features appear for anyone — the guard fails closed, never open, when there is nothing valid to compare against (an unset env var must never be treated as a wildcard match against an unset/missing session `tenantId`).

## Architecture Constraints

- Fix is scoped to `_mergeStateFeaturesIntoJourneyList`'s own call site in `journey.js` (`handleGetJourney`) only. A broader audit of the other 9 files calling `getRepoRoot()` (`artefact.js`, `as-built-diagrams.js`, `as-built-system-architecture.js`, `features.js`, `journeys.js`, `playback-evidence.js`, `playback.js`, `product-repo.js`, `products.js`) for the same class of unguarded-merge risk is explicitly Out of Scope here — logged as a required follow-up (see below), not silently deferred.
- The guard compares `req.session.tenantId` against `process.env.PLATFORM_TENANT_ID` — exact string match, both sides must be non-empty (AC3). No new env var or config concept introduced; reuses `PLATFORM_TENANT_ID`, which already exists for exactly this "is this the self-hosted tenant" purpose (`registerSelfAsProduct`, `server.js`).
- No change to `getRepoRoot()` itself, `_readPipelineFeatures()` itself, or the real tenant-clone infrastructure gap (`WUCE_TENANT_ROOT_BASE`) — that is a separate, larger initiative requiring its own `/discovery` pass, not in scope for this bug fix.

## Out of Scope

- Building real per-tenant repo cloning (`WUCE_TENANT_ROOT_BASE` + clone-on-first-access) — the actual fix that would let auto-resolution and other `getRepoRoot()`-dependent features work correctly for real third-party tenants. Logged separately; this story only stops the data leak, it does not restore the feature's intended function for non-self-hosted tenants (it already didn't work for them — this story does not regress anything that currently works).
- Auditing the other 9 `getRepoRoot()` call sites for the same unguarded-merge risk class. **Required follow-up**, not a nice-to-have — logged in `workspace/state.json` pendingActions at DoD.
- Any change to `_resolveAutoCaptureTarget` (actr-s2/s3) — unaffected by this fix; it already fails closed (returns null) on any read failure, which is a different, already-safe pattern from `_mergeStateFeaturesIntoJourneyList`'s own unguarded merge.

## NFRs

- **Security:** This IS the security fix — closes a live, confirmed cross-tenant data exposure. Must be verified against a real multi-product scenario (AC1/AC2), not just unit-level mocks, before this story's own DoD.
- **Performance:** The repo-owner/repo-name comparison is a single `pool.query` (already-established pattern elsewhere in this file, e.g. `_resolveOwnerRepo` in `playback-evidence.js`) plus a string compare — negligible added cost per `/journey` render.
- **Audit:** Log when the guard suppresses a merge that would otherwise have occurred (repo mismatch), at `info` level — gives operators a way to notice if this ever fires unexpectedly in production once the real fix (tenant cloning) ships and this guard should start passing for real tenants too.

## Complexity Rating

**Rating:** 1 — well understood, single call site, clear match/no-match logic, no new infrastructure.
**Scope stability:** Stable.
