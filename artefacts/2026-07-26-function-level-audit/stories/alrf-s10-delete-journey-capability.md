# Retrospective Story: DELETE /api/journey/:journeyId — delete a stale/corrupted feature

**Story ID:** alrf-s10
**Retrospective audit date:** 2026-07-26
**Risk classification:** MEDIUM (a new, real destructive/irreversible capability; scoped narrowly — hard delete of wuce-side data only, tenant-scoped, CSRF-protected)

**Epic reference:** none directly — operator-requested tooling, following directly from testing `alrf-s8`'s fix on staging
**Parent signal:** operator tested `alrf-s8` on staging against a pre-existing feature ("new-feature-d350e651") that was already corrupted from before the fix landed, and asked for a way to delete stale/bad-data features on staging.

## What was delivered

A real, general-purpose "delete this feature" capability — not scoped only to the one bad-data case, usable for any feature going forward:

- **`src/modules/journey-disk.js`** — `deleteJourney(featureSlug, repoRoot)`, removing the whole `workspace/journeys/{featureSlug}/` directory (local-dev-only counterpart).
- **`src/web-ui/adapters/journey-store-pg.js`** — `deleteJourney(journeyId)`, an explicit two-statement delete (`artefacts` rows first, then the `journeys` row — `artefacts.journey_id` has a plain FK with no `ON DELETE` clause, so this order is required, not just tidy), matching the established "assertable DELETE, not cascade-reliance-alone" convention already used by `routes/products.js`'s `handleDeleteProduct`.
- **`src/web-ui/modules/journey-store.js`** — `deleteJourney(journeyId)` wrapper: removes the in-memory entry, delegates to whichever durable adapter (Postgres or disk) is wired.
- **`src/web-ui/routes/journey.js`** — `handleDeleteJourney(req, res)`: `DELETE /api/journey/:journeyId`. Tenant-scoped (a journey belonging to a different tenant, or one that doesn't exist at all, both return 404 — never 403 — matching the existing FORBIDDEN-vs-NOT_FOUND policy, so a cross-tenant probe can't distinguish "not yours" from "doesn't exist"). CSRF-protected. Audit-logged (`journey_deleted` event with journeyId, featureSlug, tenantId, deletedBy).
- **`src/web-ui/routes/features.js`** — a real "Delete this feature" button on the artefact-index page (the same page the operator has been testing resume on), with a native `confirm()` before the destructive `fetch`, matching the exact client-side pattern `routes/products.js`'s module-delete button already establishes.

## Benefit Linkage

**Metric moved:** gives the operator a real, safe way to clean up stale/corrupted staging data going forward, rather than that data being permanently stuck (as `alrf-s8`'s fix, being forward-only, could not retroactively repair already-corrupted Postgres rows for a feature created before the fix deployed).

## Acceptance Criteria

**AC1 — deletes a journey belonging to the requesting tenant; journey no longer resolvable afterward**
Status: MET — `tests/check-alrf-s10-delete-journey.js` AC1.

**AC2 — a nonexistent journeyId returns 404**
Status: MET — AC2.

**AC3 — a journey owned by a different tenant returns 404 (not 403), and is not deleted**
Status: MET — AC3.

**AC4 — a missing/mismatched CSRF token is rejected (403), and the journey survives**
Status: MET — AC4.

**AC5 — an unauthenticated request returns 401**
Status: MET — AC5.

**AC6 — `journey-store.deleteJourney` delegates to the durable (Postgres) adapter with the correct journeyId**
Status: MET — AC6.

**AC7 — the feature-index page renders a real Delete button targeting the resolved journey's actual journeyId**
Status: MET — AC7.

**AC8 — no regression to existing journey-lifecycle/tenant-isolation/feature-index behaviour**
Status: MET — `check-owle1-clarify-side-trip.js` (14/14), `check-p0.2-journey-guard-wiring.js` (13/13), `check-p2.2-tenant-isolation.js` (27/27), `check-p3.1-pg-journey-adapter.js` (13/13), `check-jrf-s1-new-feature-redirect.js` (5/5), `check-wuce6-feature-navigation.js` (57/57), `check-wuce20-artefact-index-html.js` (40/40), `check-kfd1-...` (42/42), `check-alrf-s1-...` (8/8), `check-alrf-s4-...` (14/14) — all unchanged.

## Out of Scope

- Cleaning up `feature_module_assignments` rows for a deleted feature (keyed by `product_id + feature_slug`, not `journey_id` — would need a separate query; likely N/A for a standalone journey with no product association, but a stray row could remain for a feature that WAS assigned to a product's kanban view). Flagged as a known limitation, not fixed this pass.
- A bulk "delete all stale features matching X" admin tool — this story ships a per-feature delete action; a bulk cleanup tool is a separate, larger feature if ever needed.
- Actually using this capability to delete "new-feature-d350e651" on staging — done as a follow-up action after this PR deploys, not part of this code change itself.

## Traceability Linkage

**DoR artefact:** not written — retrospective story, same convention as this session's other same-day fixes
**Test plan:** `tests/check-alrf-s10-delete-journey.js` (11 ACs, all passing)
**DoD artefact:** not yet written
