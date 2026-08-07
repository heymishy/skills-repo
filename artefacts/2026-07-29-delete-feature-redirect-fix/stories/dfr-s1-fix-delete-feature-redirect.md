# Story: Fix "Delete feature" to redirect back to the owning product, not the generic journeys list

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/investigator-confirmed defect below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **a pipeline operator managing features under a product**,
I want **deleting a feature to return me to that product's page**,
So that **I stay oriented in the product I was working on, instead of being dropped onto the unrelated, generic journeys list**.

## Benefit Linkage

**Metric moved:** None formal (short-track UX fix, no benefit-metric artefact) — operator-reported navigation friction, logged in `workspace/capture-log.md` (2026-07-28, "Operator-reported UX gap: deleting a feature redirects to the generic /journey page rather than back to the specific product page").
**How:** Directly fixes the reported friction: the delete-feature success handler currently hardcodes `window.location.href="/journey"`, discarding the feature's product context entirely.

## Architecture Constraints

None new. Reuses the existing `productId` field already written onto in-memory journey objects at feature-creation time (`routes/products.js`'s `handlePostProductFeature`, via `journeyStore.setJourneyFields`) and already persisted to Postgres's `journeys.product_id` column (`journey-store-pg.js`'s `saveJourney`) — no new schema, no new field.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a feature belonging to a product, whose journey is still resident in this server process's in-memory store (the common case — created or last touched since the last restart), When the operator deletes that feature from `/features/:slug`, Then the client-side success handler redirects to `/products/:productId` (the feature's actual owning product), not `/journey`.

**AC2 (edge case, the real underlying gap this story also closes):** Given a feature whose journey was loaded from Postgres after a server restart (not created fresh in the current process), When the operator opens that feature's page, Then `journeyForPage.productId` is populated correctly from the database — today it is silently lost, because `journey-store-pg.js`'s `listJourneys()` selects `journey_id, tenant_id, owner_id, feature_slug, created_at, data` but never selects or maps back `product_id`, even though the column is written on save. Fixing only the redirect (AC1) without this would make the fix silently regress to the old `/journey` fallback for every journey loaded after a restart — this AC is the actual root-cause closure, not a nice-to-have.

**AC3 (edge case, graceful fallback):** Given a feature whose journey genuinely has no resolvable `productId` (a pre-existing edge case unrelated to this fix, e.g. a feature created through some path that never set it), When the operator deletes that feature, Then the redirect falls back to `/journey` exactly as it does today — never a broken link, never a redirect to `/products/undefined`.

## Out of Scope

- Any change to the delete confirmation dialog, the DELETE endpoint's own behaviour, or CSRF/audit handling — this story only changes what happens after a successful delete.
- Cleaning up `feature_module_assignments` rows (a known, separately-logged, low-severity limitation from the original delete-feature story, alrf-s10) — unrelated to this redirect fix.
- Backfilling `product_id` for any already-rehydrated in-memory journey from before this fix ships — the fix corrects the read path going forward (every future rehydration), not existing in-memory state from prior server sessions.

## NFRs

- **Performance:** None identified — one additional column in an already-existing SELECT statement, negligible cost.
- **Security:** None new — `productId` is already tenant-scoped data the operator already has access to (it's their own feature); no new exposure.
- **Accessibility:** None new — no visible UI change beyond the redirect destination.
- **Audit:** None identified — no change to what's logged for the delete action itself.

## Complexity Rating

**Rating:** 1 — well understood, root cause fully confirmed via direct code inspection (`routes/features.js` line ~256 for the redirect; `journey-store-pg.js`'s `listJourneys()` for the rehydration gap).
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
