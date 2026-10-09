# Contract Proposal: Feature-to-stage mapping: save mapping with metric key selection (ep2-s2)

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep2-s2-test-plan.md
**Date:** 2026-10-09

---

## What will be built

- **`handleGetJourneyCanvas`** embeds each feature's optional `metricKeys` (array of strings, read from each feature's own `pipeline-state.json` record) as JSON keyed by slug, alongside the existing `features` list `ep2-s1` already reads.
- **A second internal view inside `ep2-s1`'s own feature-picker modal** — no new modal. Clicking a `.sw-feature-picker-item` (currently inert) transitions the modal to a metric-key sub-view: the selected feature's name/slug, a list of checkboxes (one per `metricKeys` entry) or the exact text "No metrics recorded" when none exist, and "Save mapping" / "Back" controls.
- **`handlePostFeatureMapping`** (new handler, `src/web-ui/routes/journeys.js`): CSRF guard first → tenant ownership check on `journey_stage_id` (404 on cross-tenant, per `decisions.md` D13, checked BEFORE any transaction opens) → a single-transaction upsert (`pool.connect()` → `BEGIN` → `SELECT id FROM feature_customer_journey_stage_mappings WHERE journey_stage_id = $1 AND feature_slug = $2 AND tenant_id = $3 FOR UPDATE` → `UPDATE ... SET metric_keys = $1` if found, else `INSERT ...` → `COMMIT`, `ROLLBACK` in catch, `client.release()` in `finally`) — matching `handlePatchJourneyStagesOrder`'s exact transactional pattern.
- **New dispatch entry** in `server.js`: `POST /journeys/:id/stages/:stageId/feature-mappings` → `authGuard` + `requireNonViewer`, matching every other mutating journeys route.

## What will NOT be built

- No visible stage-card badge, annotation, or any other UI change after a successful save — explicitly `ep2-s3`'s own scope ("Delivery view: feature and metric annotation rows on stage cards"), caught and corrected in this story's own verification script before DoR.
- No remove-mapping UI or endpoint (explicit story Out of Scope).
- No edit-after-save UI (explicit story Out of Scope, deferred for MVP).
- No write path for populating `metricKeys` itself on a feature's own `pipeline-state.json` record — this story only reads an optional field that nothing currently writes (see `decisions.md` D12).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (metric-key picker with real keys, or "No metrics recorded") | `handleGetJourneyCanvas` called with mocked features (one with `metricKeys`, one without); assert checkboxes vs. the exact fallback text | unit |
| AC2 (save with metric keys → full mapping row inserted) | Transactional mock pool with no pre-existing row; assert exactly one `INSERT` with all 6 columns in order | integration |
| AC3 (save with zero metric keys → `metric_keys: []`) | Same mock pool, empty selection; assert the inserted value is exactly `[]`, not `null`/omitted | integration |
| AC4 (re-map same feature+stage → exactly one row, latest wins) | Mock pool with ONE pre-existing row; assert `SELECT ... FOR UPDATE` + `UPDATE` (not a second `INSERT`), row count stays 1, new `metric_keys` value stored | integration |
| AC5 (cross-tenant → 404, no insert) | Mock pool where the stage's own journey belongs to a different tenant; assert `404`, zero `pool.connect()` calls, zero `INSERT`/`UPDATE` | integration |

## Assumptions

- The metric-key sub-view toggles within the existing modal via the same `display:none`/`block` convention already used throughout `journeys.js` (stage panel, New journey modal) — no new modal/dialog element.
- "Save mapping" is only reachable after a feature has been selected; no client-side guard against calling it with no feature selected is needed since the control doesn't render until then.
- `journeyId` and `csrfToken`, already present in `ep2-s1`'s first script block's own closure, must be duplicated into the second script block (separate IIFE, no shared scope) — cheap, server-side constants, no new risk.

## Estimated touch points

**Files:** `src/web-ui/routes/journeys.js`, `src/web-ui/server.js`, `tests/check-ep2-s2-feature-mapping-save.js` (new)
**Services:** None external.
**APIs:** One new route — `POST /journeys/:id/stages/:stageId/feature-mappings`.
