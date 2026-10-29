## Story: Tenant-match guard on pipeline-state-derived journey features

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`) — security/data-isolation bug fix.

## Background

`_mergeStateFeaturesIntoJourneyList` (`src/web-ui/routes/journey.js`) merges every non-terminal-stage feature from `getRepoRoot(req)`'s own `.github/pipeline-state.json` into the `/journey` page's feature list for the CURRENT tenant/product, with no check that the content actually belongs to them.

`getRepoRoot(req)` never consults a product's own connected-repo configuration (`repo_owner`/`repo_name`). It only checks `WUCE_TENANT_ROOT_BASE` + session `tenantId` (an env var confirmed unset on both `wuce-staging` and `skills-framework` production, via direct inspection — see `artefacts/2026-10-28-auto-capture-target-resolution/decisions.md`-adjacent session notes); when unset, it falls back to `path.resolve('.')`, i.e. the deployed app's own source directory, for every tenant unconditionally.

**Confirmed live on staging, 2026-10-29:** `productId=6eee4b07-...` (`mtrr-s2 live-verify probe`, a product with **no repo connected at all** — "Not yet synced", 0 epics, 0 stories on its own product page) showed 344 features on its `/journey` page. Every one of them was `heymishy/skills-repo`'s own internal pipeline-state.json content (including this very feature's own sibling stories). The leak is fully independent of what — if anything — a product has connected; it affects every tenant on the deployment identically.

## User Story

As a **tenant product owner on a shared skills-platform deployment**,
I want **my `/journey` page to only ever show features that genuinely belong to my own product**,
So that **another tenant's (or the platform's own) internal delivery backlog is never exposed to me, and I never mistake someone else's work item for my own**.

## Acceptance Criteria

**AC1:** Given a product with no repo connected, When its `/journey` page renders, Then zero pipeline-state.json-derived features appear — only real journey-store entries (if any) are shown.

**AC2:** Given a product connected to a repo that is NOT the repo this server process was itself deployed from (`GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`), When its `/journey` page renders, Then zero pipeline-state.json-derived features from `getRepoRoot()`'s content appear — same outcome as AC1, since there is currently no real per-tenant clone for `getRepoRoot()` to resolve to.

**AC3:** Given the self-hosted platform product (the one product whose connected `repo_owner`/`repo_name` genuinely matches `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`), When its `/journey` page renders, Then its own real pipeline-state.json features continue to appear exactly as before — no regression for the one legitimate case.

**AC4:** Given `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` are unset (no self-hosted product configured at all, e.g. a fresh install), When any product's `/journey` page renders, Then zero pipeline-state.json-derived features appear for anyone — the guard must fail closed, never open, when the comparison has nothing to compare against.

## Architecture Constraints

- Fix is scoped to `_mergeStateFeaturesIntoJourneyList`'s own call site(s) in `journey.js` only. A broader audit of the other 9 files calling `getRepoRoot()` (`artefact.js`, `as-built-diagrams.js`, `as-built-system-architecture.js`, `features.js`, `journeys.js`, `playback-evidence.js`, `playback.js`, `product-repo.js`, `products.js`) for the same class of unguarded-merge risk is explicitly Out of Scope here — logged as a required follow-up (see below), not silently deferred.
- The guard compares the CURRENT product's own `repo_owner`/`repo_name` (read from the `products` table via `pool`) against `process.env.GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`. Case-insensitive compare (GitHub owner/repo names are case-insensitive in practice). Both sides must be non-empty for a match — an empty/unset value on either side is never treated as a wildcard match (AC4).
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
