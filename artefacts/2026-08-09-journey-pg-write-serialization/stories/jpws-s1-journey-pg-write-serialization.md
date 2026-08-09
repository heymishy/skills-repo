## Story: Serialize a journey's Postgres writes so an earlier, incomplete write can never overwrite a later, correct one

**Epic reference:** None — short-track (bug fix, found via code-level root-cause investigation of the operator's real staging environment)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **user creating a new feature/journey**,
I want **its `tenantId`, `ownerId`, and other fields to be reliably and permanently persisted**,
So that **a journey I create never silently loses its tenant assignment on a server restart, becoming invisible to my own account or (worse) miscategorised**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — root-caused while investigating a live finding (2026-08-09): the operator's real "No product" journey list showed ~1000 tenant-less journeys instead of the real ~7, all dated after the tenancy rollout, meaning they should have had a real `tenantId` from day one.

**How:** Traced to `src/web-ui/modules/journey-store.js`. `createJourney(featureSlug, productProfile)` builds a journey object with **no** `tenantId`/`ownerId` field at all, then immediately fires an un-awaited `_pgWrite(journey)` (line 34-40). Every real call site (`handlePostJourney`, `handlePostProductFeature`, etc.) immediately follows up with `setJourneyFields(journeyId, { ownerId, tenantId, ... })`, which fires its **own**, independent, un-awaited `_pgWrite(journey)`. `adapters/journey-store-pg.js`'s `saveJourney()` does a full `INSERT ... ON CONFLICT (journey_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id, ...` — a complete upsert of the whole row, keyed only on `journey_id`, with **no sequencing** between the two independent `pool.query()` calls. Under a real connection pool (Neon Postgres) with real network latency, there is no guarantee the second (correctly-tenanted) write's transaction commits after the first (tenant-less) one. If the tenant-less write lands last, the row is permanently left `tenant_id: NULL` in Postgres. The in-memory copy stays correct (same mutated object reference), so this is invisible on the running process — it only surfaces after a restart, when `loadAllFromPg()` reloads the corrupted row. This affects **any** journey creation by **any** real user, not just automated test runs.

## Architecture Constraints

- **Fix must live entirely inside `journey-store.js`'s `_pgWrite`** — no call-site changes anywhere in the codebase (`handlePostJourney`, `handlePostProductFeature`, `handlePostProductModule`, or any other caller of `createJourney`/`setJourneyFields`/`completeStage`/`setActiveSession`). This keeps the fix minimal, low-risk, and self-contained to the exact function where the race originates.
- **Must not change the fire-and-forget performance characteristic for callers.** The whole point of `_pgWrite` being un-awaited today is that a journey-mutating HTTP handler doesn't block its own response on a Postgres round-trip. This story must preserve that — callers still get an immediate, synchronous-feeling return; only the *order* in which writes for the *same* `journeyId` land in Postgres is guaranteed, not the latency of any individual write.
- **Serialization must be scoped per-`journeyId`**, not a single global write queue — writes for two different journeys must remain fully concurrent with each other; only writes for the *same* journey need strict ordering.
- **No change to `adapters/journey-store-pg.js`'s `saveJourney()` SQL** — the fix is about *when* each write is issued relative to the others for the same journey, not about changing the upsert statement itself.

## Dependencies

- **Upstream:** None (this fixes already-shipped Postgres persistence code, `p3.1`).
- **Downstream:** None known. Related to (but does not fully resolve) the separately-logged "why do tenant-less journeys keep being created" investigation — that investigation named this exact race as the mechanism; this story closes it. It does NOT address the separate, larger "zero E2E teardown" root cause (why so much throwaway data accumulates on real staging in the first place) — that stays a distinct, deferred item.

## Acceptance Criteria

**AC1:** Given `createJourney()` is called and, before its own write's promise settles, `setJourneyFields()` is called for the same `journeyId` with a `tenantId`, When both writes eventually complete, Then the row in Postgres reflects the `setJourneyFields()` call's `tenantId` — never reverts to the earlier, tenant-less state, regardless of which underlying `pg.saveJourney()` promise resolves first in real time.

**AC2:** Given `_pgWrite` is called three or more times in quick succession for the same `journeyId` (e.g. `createJourney` → `setJourneyFields` → `completeStage`), When all writes complete, Then `pg.saveJourney` was invoked once per call, in the same order the calls were made — no write is skipped, coalesced, or reordered.

**AC3:** Given `_pgWrite` is called for two different `journeyId`s at the same time, When both complete, Then neither journey's writes are blocked waiting on the other's — the per-journey serialization must not become a single global bottleneck.

**AC4:** Given an earlier write for a journey rejects (the simulated Postgres call throws), When a later write for the SAME journey is issued, Then the later write still proceeds and completes normally — one failed write must never permanently jam that journey's write queue.

**AC5:** Given no PG adapter is configured (`_activePgAdapter()` returns falsy), When `_pgWrite` is called, Then it remains a no-op exactly as today — this story must not change behaviour for disk-only/in-memory-only deployments.

## Out of Scope

- **Any call-site change** — `handlePostJourney`, `handlePostProductFeature`, and every other caller of `createJourney`/`setJourneyFields` stay completely untouched.
- **The separate "why do tenant-less journeys keep being created" root cause for E2E-originated data** (zero teardown infrastructure) — already logged as its own, larger, deferred item; this story only prevents the write-order race, which affects real users' journeys too, not just E2E-created ones.
- **Bulk repair of already-corrupted rows** (the ~1000 tenant-less journeys currently in Postgres) — a separate data-cleanup action, not addressed by this forward-looking fix.
- **Changing `saveJourney()`'s SQL** in `journey-store-pg.js` — untouched.

## NFRs

- **Correctness/Data integrity:** Closes a real, previously-unknown production race condition affecting any journey creation, not just a hypothetical edge case — the story's own root-cause investigation found ~1000 real corrupted rows already in production Postgres.
- **Performance:** Negligible — callers already don't await `_pgWrite`; this adds an internal `.then()` chain per journey, not a new round-trip or added latency to any HTTP response.

## Complexity Rating

**Rating:** 2 — the fix itself (a per-key promise chain) is a well-known, contained pattern, but correctly reasoning about the concurrency properties (per-journey isolation per AC3, failure isolation per AC4, ordering guarantee per AC1/AC2) requires care, and this touches the most heavily-used write path in the journey subsystem, so the regression bar is high.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
