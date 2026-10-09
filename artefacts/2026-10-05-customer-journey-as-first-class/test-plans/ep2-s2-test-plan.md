## Test Plan: Feature-to-stage mapping: save mapping with metric key selection

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
**Epic reference:** feature-mapping-and-delivery-view
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-09):**

- **Metric key source (operator decision, 2026-10-09):** AC1's own wording ("DoD metric keys from that feature's record in `pipeline-state.json`") assumes a field that does not exist anywhere in `pipeline-state.schema.json` or the codebase today — confirmed by grep. Resolved: add support for reading an optional `metricKeys: string[]` array from each feature's own `pipeline-state.json` record. Nothing writes this field yet, so every feature correctly falls through to AC1's own explicit "No metrics recorded" fallback today — forward-compatible the moment a future story defines how `metricKeys` actually gets populated. No schema change, no new write path, no blocking dependency on this story.
- **Real schema** (`scripts/migrate-schema-journeys.js:66-76`, already migrated by `ep5-s1`): `feature_customer_journey_stage_mappings(id, journey_stage_id, journey_id, tenant_id, feature_slug, metric_keys JSONB, created_at)` — matches AC2's own column list exactly. **No unique constraint exists on `(journey_stage_id, feature_slug)`** — AC4's "exactly one mapping, not two" requirement cannot use SQL `INSERT ... ON CONFLICT`; it must be implemented as an application-level check-then-write inside a single transaction (`SELECT ... FOR UPDATE` then `UPDATE` or `INSERT`), matching this file's own established transactional pattern (`handlePatchJourneyStagesOrder`, `journeys.js:234-249`: `pool.connect()` → `BEGIN` → work → `COMMIT`, `ROLLBACK` in catch, `client.release()` in `finally`).
- **AC5 reinterpreted from 403 to 404 (same resolution pattern as `ep4-s1`'s own D8):** every existing mutating handler in this file uses a deliberate, explicitly-commented "404, not 403, for a cross-tenant journey id" policy (`handlePostJourneyStage:78-79`, `handlePatchJourneyStage:144-145`, `handlePatchJourneyStagesOrder:205-206` — the latter two explicitly citing it as matching every other handler, tracing back to `handlePostProductModule`'s own original FORBIDDEN-vs-NOT_FOUND policy). A 403 would be the first handler in this entire file to diverge from that policy, leaking stage-id existence to a cross-tenant caller. AC5 is implemented as 404, matching established, security-motivated precedent — logged in `decisions.md`.
- **No new D37 injectable adapter.** The story's own NFR line ("Injectable adapter for Postgres calls (D37)") does not describe anything genuinely new here — every existing write handler in this file (including the one this story most closely extends, `handlePatchJourneyStagesOrder`) already receives `pool` as an ordinary dependency-injected parameter, the established non-D37 convention for Postgres access throughout `journeys.js`. No `setX`/`getX` adapter is introduced by this story. H-ADAPTER: N/A.
- **New route:** `POST /journeys/:id/stages/:stageId/feature-mappings` — does not collide with any existing dispatch regex (`/stages$`, `/stages/[^/]+$`, `/stages-order$`); matches this file's own REST pluralization convention. `authGuard` + `requireNonViewer`, matching every other mutating journeys route (`server.js:3986-4014`).
- **UI extension of `ep2-s1`'s own feature-picker modal:** clicking a `.sw-feature-picker-item` (currently inert — no click handler exists yet) must transition the SAME modal to a metric-key sub-view (feature name/slug, metric-key checkboxes or "No metrics recorded", Save + Back controls), server-rendered with each feature's `metricKeys` embedded as JSON (mirroring the canvas's own existing `stageData` embedding pattern at `journeys.js:333-335`, avoiding a second round-trip). The save POST needs `journeyId` and `csrfToken`, both already in the FIRST script block's own closure but NOT accessible from the second script block `ep2-s1` added (separate IIFE) — both values must be duplicated into the second block (cheap, server-side constants, no new risk). The target `stageId` comes from the `data-stage-id` attribute already present on the `.sw-stage-map-feature` trigger button (`journeys.js:348`), captured into a new `fpStageId` variable when `fpOpen(trigger)` runs.

---

**E2E/browser-layout detection (Step 3a):** No AC matches any CSS-layout-dependent trigger pattern (no drag-and-drop, no pointer coordinates, no `getBoundingClientRect`). All 5 ACs are either pure backend logic (AC2-AC5) or DOM-structural/content assertions (AC1's sub-view rendering). No E2E spec required, no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Selecting a feature shows a metric-key picker (real keys, or "No metrics recorded") | 2 tests | — | — | — | — | 🟢 |
| AC2 | Confirming with metric keys selected inserts a mapping row with all required columns | — | 1 test | — | — | — | 🟢 |
| AC3 | Confirming with zero metric keys selected inserts a mapping with `metric_keys: []` | — | 1 test | — | — | — | 🟢 |
| AC4 | Mapping the same feature+stage twice results in exactly one row, latest keys win | — | 1 test | — | — | — | 🟢 |
| AC5 | Cross-tenant `journey_stage_id` → 404 (reinterpreted from 403; see grounding), no insert | — | 1 test | — | — | — | 🟢 |
| (shape) | New route dispatch entry does not collide with existing `/stages` regexes | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC1 is covered by server-rendered markup assertions (the metric-key sub-view, keyed per feature). AC2-AC5 are covered by a transactional mock pool extending `ep1-s4`'s own `makeTransactionalMockPool` precedent, asserting exact `BEGIN`/`COMMIT`/`ROLLBACK` call counts and the real SQL executed — not re-implementing Postgres's own upsert/constraint behavior client-side.

---

## Test Data Strategy

**Source:** Synthetic — extends `tests/check-ep1-s4-stage-reorder.js`'s own `makeTransactionalMockPool` convention (transactional mock pool/client) and `tests/check-ep2-s1-feature-picker.js`'s own `fs.readFileSync` monkey-patch convention for mocking `pipeline-state.json` feature records (including their new optional `metricKeys` field).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked `pipeline-state.json` feature with `metricKeys: ['m1', 'm2']`, and a second feature with no `metricKeys` field at all | Synthetic | None | Assert the metric-key sub-view renders checkboxes for the first feature and "No metrics recorded" for the second |
| AC2 | Transactional mock pool with no pre-existing mapping row; POST body `{ featureSlug, metricKeys: ['m1'] }` | Synthetic | None | Assert exactly one `INSERT` with all 6 columns in the correct order/values |
| AC3 | Same as AC2, `metricKeys: []` | Synthetic | None | Assert the inserted `metric_keys` value is `[]`, not `null` or omitted |
| AC4 | Transactional mock pool with ONE pre-existing mapping row for the same `(journey_stage_id, feature_slug)`; POST a second time with different `metricKeys` | Synthetic | None | Assert exactly one `SELECT ... FOR UPDATE`, zero additional `INSERT`s, exactly one `UPDATE` setting the new `metric_keys` value, and that the mock pool's own row count stays at 1 after the second call |
| AC5 | Mock pool where the stage belongs to a different `tenant_id` than the requester's session | Synthetic | None | Assert `res._s === 404`, zero `INSERT`/`UPDATE` calls, zero `client.connect()` calls (ownership checked before the transaction opens, matching `handlePatchJourneyStagesOrder`'s own precedent) |
| (shape) | Server source text | Synthetic | None | Assert the new dispatch regex and that it's distinct from `/stages$`, `/stages/[^/]+$`, `/stages-order$` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Feature picker shows metric-key checkboxes for a feature with recorded metric keys

- **Verifies:** AC1
- **Action:** Call `handleGetJourneyCanvas` with a mocked `pipeline-state.json` feature `{ slug: 'feat-a', name: 'Feature A', metricKeys: ['M1', 'M2'] }`
- **Expected result:** The rendered feature-picker markup includes a metric-key sub-view (hidden by default, revealed on feature selection) containing checkboxes labeled `M1` and `M2`, keyed to `feat-a`
- **Edge case:** No

### Feature picker shows "No metrics recorded" for a feature with no metric keys

- **Verifies:** AC1
- **Action:** Call `handleGetJourneyCanvas` with a mocked feature that has no `metricKeys` field at all
- **Expected result:** The metric-key sub-view for that feature shows the exact text "No metrics recorded", no checkboxes
- **Edge case:** Yes

---

## Integration Tests

### Confirming a mapping with metric keys selected inserts a complete row

- **Verifies:** AC2
- **Components involved:** `handlePostFeatureMapping` (new handler), transactional mock pool
- **Precondition:** Mock pool with a real stage owned by the requester's tenant, no pre-existing mapping row
- **Action:** POST with `{ featureSlug: 'feat-a', metricKeys: ['M1'] }`
- **Expected result:** Exactly one `INSERT INTO feature_customer_journey_stage_mappings` with `journey_stage_id`, `journey_id`, `tenant_id`, `feature_slug`, `metric_keys: ['M1']` (JSONB), `created_at` (server-defaulted) — response 201

### Confirming a mapping with zero metric keys selected inserts metric_keys: []

- **Verifies:** AC3
- **Precondition:** Same as AC2, `metricKeys: []` or omitted from the request body
- **Action:** POST with no `metricKeys` field
- **Expected result:** The inserted row's `metric_keys` parameter is exactly `[]` — not `null`, not omitted from the query params
- **Edge case:** Yes

### Mapping the same feature to the same stage twice results in exactly one row

- **Verifies:** AC4
- **Precondition:** Mock pool with ONE existing mapping row for `(journey_stage_id: 's1', feature_slug: 'feat-a')`, `metric_keys: ['M1']`
- **Action:** POST again with `{ featureSlug: 'feat-a', metricKeys: ['M2'] }`
- **Expected result:** Exactly one `SELECT ... FOR UPDATE` by `(journey_stage_id, feature_slug, tenant_id)`, zero new `INSERT`s, exactly one `UPDATE ... SET metric_keys = $1` on the existing row's id, mock pool's own row count remains 1, and the stored `metric_keys` is now `['M2']`
- **Edge case:** Yes

### A cross-tenant journey_stage_id returns 404, not 403, with no insert

- **Verifies:** AC5
- **Precondition:** Mock pool where the stage's own journey has `tenant_id: 'org-2'` but the requester's session `tenantId` is `'org-1'`
- **Action:** POST to the mapping endpoint for that stage
- **Expected result:** `res._s === 404` (matching this file's own established FORBIDDEN-vs-NOT_FOUND policy, not a literal 403), zero `pool.connect()` calls (ownership verified before any transaction opens), zero `INSERT`/`UPDATE` calls
- **Edge case:** Yes

### The new feature-mappings route does not collide with existing stage route regexes

- **Verifies:** (shape)
- **Action:** Read `server.js`'s own dispatch source text
- **Expected result:** A regex matching `/journeys/:id/stages/:stageId/feature-mappings` for `POST`, distinct from the existing `/stages$` (POST), `/stages/[^/]+$` (PATCH), and `/stages-order$` (PATCH) entries — confirmed by testing each existing regex against the new path and asserting no false match
- **Edge case:** Yes
