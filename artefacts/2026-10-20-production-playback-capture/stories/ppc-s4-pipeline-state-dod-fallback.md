# Story: Recognise pipeline-state.json DoD-complete features in self-service playback capture (short-track)

**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Track:** Short-track (bug/gap fix) — per CLAUDE.md's short-track process (`/test-plan → /definition-of-ready → coding agent`), skipping discovery/benefit-metric/definition/review since this is a bounded gap fix to already-shipped `ppc-s1`/`ppc-s2` behaviour, not new scope. `/definition-of-done` still applies after merge.
**Domain:** [web-ui]

---

## Background

`ppc-s1`'s `_resolveJourney` (`src/web-ui/routes/playback-evidence.js`) requires a pre-existing Postgres `journeys` row whose `completedStages` array already contains a `definition-of-done` entry — a signal only ever created by walking a feature through the real web chat UI (`/definition-of-done` skill session completing).

The `2026-08-07-cross-surface-state-sync` epic (css-s1 through css-s4, all merged 2026-10-25) just closed exactly this class of gap for the CLI-vs-web-UI DoD signal divide elsewhere in the platform: a story's `dodStatus` field in the GitHub-synced `.github/pipeline-state.json` and a journey's own `completedStages` entry are now kept in sync bidirectionally, with conflict detection, for every gate in `gate-map.js`'s vocabulary.

`ppc`'s own capture-evidence route was never part of that sync mechanism — it reads a journey's `completedStages` directly, with no fallback to the pipeline-state.json signal at all. A feature that is genuinely DoD-complete (every story's `dodStatus: "complete"` in pipeline-state.json, confirmed live against `feature-playback-demo`'s own product page) still 404s from `GET /products/:productId/playback-evidence/:featureSlug`, because no Postgres journey was ever created for it (it was built entirely via the CLI pipeline, not a chat walkthrough). Operator-confirmed: this parity gap "shouldn't matter" now that the css epic exists, and asked for it to be fixed.

## User Story

As a **tenant Product Owner**,
I want to **self-serve playback evidence capture for a feature that is DoD-complete per my repo's own `pipeline-state.json`**,
So that **I am not blocked from using `ppc`'s capture mechanism just because the feature was delivered via the CLI pipeline instead of a web chat walkthrough**.

## Benefit Linkage

**Metric moved:** m1 (Self-service DoD validation adoption) and m3 (Engineer manual-demo load removed), both already tracked by this epic.
**How:** Removes a false-negative gate on `ppc`'s own entry point — a tenant cannot adopt self-service capture for a feature the mechanism incorrectly reports as "not found," regardless of how real-world DoD-complete that feature actually is.

## Architecture Constraints

- ADR-025 (multi-tenancy enforced via tenant_id/product_id scoping) — the fallback path must preserve `getJourneyByTenantProductSlug`'s fail-closed tenant+product scoping; it must not introduce a path that resolves a feature by slug alone.
- ADR-020 (authenticated user's own token, never a service account) — the GitHub fetch this story adds must use `req.session.accessToken`, matching every other fetch in this route file.
- D37 (injectable adapters) — reuses the already-wired `pipelineStateFetchAdapter`/`pipelineStateBlobFetchAdapter` (css epic, product-rollup.js) rather than introducing a new adapter pair.
- fdn-s1 (journey-store-pg.js field allowlist) — any new journey field this story adds must be listed explicitly in `_sanitise()` or it silently vanishes on a Postgres-backed restart.

## Dependencies

- **Upstream:** `2026-08-07-cross-surface-state-sync` epic (css-s1–css-s4) — DoD-complete, merged. This story's own premise (pipeline-state.json's `dodStatus` is a trustworthy, kept-in-sync signal) depends on that epic having shipped.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a tenant's product has no Postgres `journeys` row for a feature, but every story of that feature (flat `stories[]` or epic-nested `epics[].stories[]`) has `dodStatus: "complete"` in the connected repo's `.github/pipeline-state.json`, When the tenant's authenticated user requests `GET /products/:productId/playback-evidence/:featureSlug`, Then the response is 200 (not 404) and its `acs` list is non-empty.

**AC2:** Given AC1's scenario just occurred, When a second request for the same `productId`/`featureSlug` is made, Then it is served from the now-existing Postgres journey (no second GitHub pipeline-state.json fetch) — the journey created by AC1 is scoped to the requesting `tenantId` and `productId`, with a `completedStages` entry whose `skillName` is `'definition-of-done'`.

**AC3:** Given a feature whose pipeline-state.json shows at least one story NOT `dodStatus: "complete"` (and no Postgres journey exists for it either), When requested, Then the response remains 404 — a partially-complete feature is never treated as DoD-complete by this fallback.

**AC4:** Given a product with no connected repo (`repo_owner`/`repo_name` null or the products row missing) and no Postgres journey for the requested feature, When requested, Then the response is 404 with no stack trace or internal detail leaked — identical failure shape to today's pre-fix behaviour.

**AC5:** Given the same `featureSlug` is genuinely DoD-complete (per pipeline-state.json) for tenant A's product but tenant B has a different product with no matching feature, When tenant B requests that `featureSlug` under tenant B's own `productId`, Then tenant B gets 404 — the fallback's auto-provisioned journey for tenant A must never be visible to, or reused by, tenant B.

**AC6:** Given an auto-provisioned journey (created via AC1's fallback, with no Postgres `artefacts` rows), When the AC list is built for `handleGetPlaybackEvidence` or `handlePostCaptureAll`, Then the AC rows are fetched from the real DoD markdown content on GitHub (via the existing `fetchArtefact` adapter) and aggregated across every one of that feature's `dodStatus: "complete"` stories, using the same `parseDodAcCoverage` parser the Postgres path already uses — not just the first story found.

## Out of Scope

- Does not change `/feature-playback`'s own `checkDodGate` (a different skill's gate, reads pipeline-state.json already — unaffected).
- Does not backfill or reconcile existing journeys retroactively — this is a lazy, on-demand provision triggered only by an incoming request for a feature with no existing journey.
- Does not add a dedicated truncation-fallback implementation for the pipeline-state.json fetch in this file — reuses `product-rollup.js`'s already-built Contents-API/Blob-API fallback (`psbf-s1`) via a small extraction, rather than re-deriving it.
- Does not change `isDodComplete`'s own pure semantics — the fallback composes with the existing fast path, never modifies it.

## NFRs

- **Performance:** The GitHub pipeline-state.json fetch only happens on the cold path (no existing journey) — every subsequent request for the same feature/product hits the existing, fast Postgres-journey path (AC2).
- **Security:** Tenant/product isolation must hold with the same rigor as `ppc-s1`'s own AC6/AC7 (AC5 above) — no new path that resolves a feature by slug alone, across tenants.
- **Accessibility:** N/A — no UI change.
- **Audit:** No new audit requirement beyond what `ppc-s1`/`ppc-s2` already log.

## Complexity Rating

**Rating:** 2 (some ambiguity: aggregating AC rows across multiple stories' DoD artefacts is new, but every building block — `fetchArtefact`, `pipelineStateFetchAdapter`, `createJourney`/`setJourneyFields` — already exists and is proven)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story (css epic confirmed complete)
- [x] NFRs identified
- [x] Human oversight level confirmed from parent epic (Medium, per epic)
