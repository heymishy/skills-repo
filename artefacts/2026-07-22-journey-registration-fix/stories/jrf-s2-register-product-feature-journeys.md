# Story: "New feature" journeys are registered in the shared in-memory journey store, fixing "Journey not found" at gate-confirm

**Epic reference:** None — short-track (per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`). Direct follow-on from jrf-s1 (the story that introduced the currently-broken flow — see Background).
**Discovery reference:** None — short-track skips discovery; root cause confirmed by direct database inspection this session.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below.

## Background

The operator reported: created a product, clicked "New feature," completed the discovery skill flow, saved the artefact, and hit `POST /api/journey/:journeyId/gate-confirm` — response: "Journey not found."

Direct investigation (`journeys` table inspection on `wuce-staging`) confirmed the journey row **does** exist in Postgres (`journey_id`, `feature_slug`, `created_at` all present) but its `data` column is an empty `{}`. Root cause, confirmed by code inspection: `handlePostProductFeature` (`routes/products.js`, the "New feature" button's handler, added by jrf-s1) creates the journey via a **raw, direct SQL `INSERT INTO journeys ... VALUES (..., '{}'::jsonb)`**, bypassing `modules/journey-store.js`'s `createJourney()` entirely. This means the journey is **never added to the shared in-memory `_journeys` Map** that every other journey-store operation (`getJourney`, `setActiveSession`, `completeStage`) reads from.

The handler's own next line, `_journeyStore.setActiveSession(journeyId, sid, 'discovery')`, silently no-ops (`if (!journey) return;` inside `setActiveSession`) since the in-memory Map has no entry — so `activeSessionId`/`activeSkill` are never set anywhere, in memory or in Postgres. By the time the operator reaches `gate-confirm`, `_journeyStore.getJourney(journeyId)` correctly returns `null` (the journey genuinely was never registered there) and the handler 404s.

This is **not** a redeploy-timing/cache-loss issue (unlike srf-s1's session bug) — it is a structural gap in this one specific creation path. Every journey created via "New feature" on the product page has been broken past the discovery stage since jrf-s1 shipped, regardless of deploys or server uptime. The comment in `handlePostJourney` (`routes/journey.js`, the other, correctly-working journey-creation path) confirms the intended pattern was to mirror it — jrf-s1's own comment even says "Following the same pattern as handlePostJourney in journey.js (which works correctly)" — but the actual implementation diverged: `handlePostJourney` calls `_journeyStore.createJourney()` first; `handlePostProductFeature` never does.

## User Story

As **an operator (or any user) who clicks "New feature" from a product page**,
I want **the resulting journey to be properly registered wherever any other journey is** (the in-memory store, backed by Postgres, with `product_id` correctly attached),
So that **I can complete a discovery session, save its artefact, and advance to `/benefit-metric` without hitting a false "Journey not found" error — the exact same experience as creating a journey through the `/journey` "New journey" form**.

## Architecture Constraints

- Checked against `.github/architecture-guardrails.md` — no conflicting ADR found.
- Reuses the exact, already-proven `createJourney()` → `setJourneyFields()` sequence `handlePostJourney` already uses correctly — not a new pattern.
- `journey-store-pg.js`'s `saveJourney()` gains a new, backward-compatible `product_id` column write: existing callers that never set `journey.productId` continue to persist `product_id: null` exactly as today (the column is already nullable). No migration needed — `product_id` already exists on the `journeys` table (added by `psh-s1`).
- The raw, direct SQL `INSERT INTO journeys ...` in `handlePostProductFeature` is removed entirely — it is fully replaced by the shared `journey-store.js` path, closing the gap at its source rather than patching around it.

## Dependencies

- **Upstream:** None — modifies existing, already-merged code (jrf-s1's `handlePostProductFeature`, and `journey-store.js`/`journey-store-pg.js`, both pre-dating this story).
- **Downstream:** None yet.

## Acceptance Criteria

**AC1 (journey registered in-memory at creation):** Given `POST /products/:id/features` is called, When the handler completes, Then `_journeyStore.getJourney(journeyId)` returns a real journey object (not `null`) for the created `journeyId` — verified directly, not inferred from a later step succeeding.

**AC2 (activeSession is actually set, not silently dropped):** Given the same request, When the handler registers the discovery skill session, Then `_journeyStore.getJourney(journeyId).activeSessionId` and `.activeSkill` are both correctly populated (proving `setActiveSession` no longer silently no-ops).

**AC3 (product_id persists to the real column, not just JSONB):** Given the same request for a product with a real `productId`, When the journey is saved to Postgres, Then a direct query of `SELECT product_id FROM journeys WHERE journey_id = $1` returns the correct `productId` — not `null`, and not merely present inside the `data` JSONB blob.

**AC4 (gate-confirm succeeds end-to-end):** Given a journey created via `POST /products/:id/features`, its discovery session completed (`session.done = true`), and its artefact saved, When `POST /api/journey/:journeyId/gate-confirm` is called, Then it succeeds (not a 404 "Journey not found") and behaves identically to a journey created via the existing, working `/journey` "New journey" form.

**AC5 (existing product-view journeys listing unaffected):** Given `handleGetProductView`'s existing query (`SELECT journey_id, feature_slug, ... FROM journeys WHERE product_id = $1`), When a journey created via this fixed flow is queried, Then it appears correctly in that product's journeys list — unaffected by (and in fact newly correctly populating) that pre-existing query, since `product_id` is now genuinely set by the creation path itself rather than a raw INSERT.

## Out of Scope

- Any change to `handlePostJourney` (`routes/journey.js`) — already correct, untouched.
- Any change to the `data` JSONB shape/fields `_sanitise` already persists — this story only adds the `product_id` COLUMN write, not a new JSONB field.
- Retroactively repairing the ~2 existing broken placeholder journeys already sitting in Postgres from before this fix (`new-feature-aa349dd1`, `new-feature-f3765c1a`, discovered earlier this session) or the operator's own just-broken journey (`58e606e9-...`) — those remain permanently un-registerable in-memory (their sessions are gone) and are a one-off cleanup, not code scope.

## NFRs

- **Performance:** No new queries added beyond what `createJourney`/`setJourneyFields` already fire for every other journey-creation path — this story removes one raw query, adds none.
- **Security:** No new attack surface — same tenant/product scoping as the existing, already-reviewed `handlePostJourney` pattern.
- **Data integrity:** This is itself a data-integrity fix — closes a gap where journeys existed in Postgres with no way to ever complete their pipeline stages.

## Complexity Rating

**Rating:** 1 — well understood, root cause fully diagnosed via direct database inspection and code comparison against the one already-correct sibling code path.
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
