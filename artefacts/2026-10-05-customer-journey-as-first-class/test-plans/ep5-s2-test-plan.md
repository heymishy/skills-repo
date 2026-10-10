## Test Plan: Tenant isolation hardening: adversarial path and cross-tenant guard tests for journey routes

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md
**Epic reference:** database-migration-and-tenant-isolation-hardening
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-10):**

- **Route surface and 403→404 correction:** see `decisions.md` D19 — the story's own original ACs referenced a fictional `/api/journeys/:id` REST surface and 403 responses. Retargeted to this feature's real 6 mutating/read routes with the established 404-not-403 convention (D13).
- **5 of 6 routes already have dedicated cross-tenant tests, confirmed by direct test-file audit:**
  - `POST /journeys/:id/stages` → `tests/check-ep1-s2-journey-stage-create.js` ("(security) cross-tenant journey id returns 404 and does not insert")
  - `PATCH /journeys/:id/stages/:stageId` → `tests/check-ep1-s3-stage-panel.js`
  - `PATCH /journeys/:id/stages-order` → `tests/check-ep1-s4-stage-reorder.js`
  - `POST /journeys/:id/stages/:stageId/feature-mappings` → `tests/check-ep2-s2-feature-mapping-save.js` (AC5)
  - `DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId` → `tests/check-ep2-s3-delivery-view.js`
  - **`GET /journeys/:id` (the canvas render itself) has NO existing cross-tenant test anywhere in this codebase** — confirmed by grepping every test file that calls `handleGetJourneyCanvas` for a mismatched-tenant-id case; none exists. This is the one genuine, previously-unverified gap this story closes.
- **This story's real value is consolidation + one genuine gap closure, not 6 brand-new tests from scratch.** Matching the story's own cited `wuce-multi-tenancy` Phase 5 precedent (a single dedicated "14/14 adversarial path-traversal tests" file), this story builds ONE new consolidated adversarial suite (`tests/check-ep5-s2-tenant-isolation-adversarial.js`) that re-exercises all 6 routes' own cross-tenant 404 behavior directly against the real handlers — proving isolation holistically in one audit-friendly place, not duplicating each originating story's own more detailed functional test coverage.
- **No production code changes anticipated.** All 6 handlers already implement the ownership-check-before-mutation / 404-not-403 pattern (confirmed by code read of each). This story is pure test-writing — UNLESS the new consolidated test for `GET /journeys/:id` reveals that route does NOT actually enforce tenant isolation correctly, in which case a real fix would be required (see Coverage gaps below — this is the one AC where the outcome isn't pre-determined by already-passing coverage elsewhere).
- **`GET /journeys/:id`'s real code path, read directly:** `handleGetJourneyCanvas` queries `SELECT id, name, description FROM customer_journeys WHERE id = $1 AND tenant_id = $2` (tenant-scoped in the WHERE clause itself, not a separate ownership check) and returns 404 if no row matches. This is a DIFFERENT isolation pattern than the other 5 routes (which do a separate ownership `SELECT` before their own mutation) — but accomplishes the same outcome (404 for cross-tenant, no data leak). Confirmed correct by code read; the new test proves it, rather than assuming it.

---

**E2E/browser-layout detection (Step 3a):** No AC matches any CSS-layout-dependent trigger pattern — this is pure backend/handler-level adversarial testing. No E2E spec required, no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `GET /journeys/:id` cross-tenant → 404, no data in response | — | 1 test | — | — | — | 🟢 (genuine new coverage) |
| AC2 | `POST /journeys/:id/stages` cross-tenant → 404, no stage created | — | 1 test | — | — | — | 🟢 (re-confirms existing `ep1-s2` coverage) |
| AC3 | `PATCH /journeys/:id/stages/:stageId` cross-tenant → 404, not modified | — | 1 test | — | — | — | 🟢 (re-confirms existing `ep1-s3` coverage) |
| AC4 | `PATCH /journeys/:id/stages-order` cross-tenant → 404, not modified | — | 1 test | — | — | — | 🟢 (re-confirms existing `ep1-s4` coverage) |
| AC5 | `POST .../feature-mappings` cross-tenant → 404, no mapping created | — | 1 test | — | — | — | 🟢 (re-confirms existing `ep2-s2` coverage) |
| AC6 | `DELETE .../feature-mappings/:mappingId` cross-tenant → 404, not deleted | — | 1 test | — | — | — | 🟢 (re-confirms existing `ep2-s3` coverage) |
| AC7 | Zero cross-tenant leaks across all 6 routes, exercised together | — | 1 test | — | — | — | 🟢 (aggregate assertion over the above 6) |

---

## Coverage gaps

None. AC1 is the one case without prior coverage anywhere in this codebase — closed by this story's own new test. AC2-AC6 already have dedicated coverage in their originating stories' own test files; this story's own tests for them are a deliberate consolidation/audit re-confirmation, not redundant busywork, matching the story's own cited adversarial-suite precedent.

---

## Test Data Strategy

**Source:** Synthetic — a new, self-contained mock-pool helper purpose-built for adversarial cross-tenant testing (not reusing/importing other test files' own helpers, per this repo's own established self-contained-test-file convention), supporting all 6 handlers' own real SQL query shapes.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey row owned by `tenant-B`; request authenticated as `tenant-A` | Synthetic | None | Assert 404, response body contains no journey name/description |
| AC2 | Same journey, request to create a stage on it | Synthetic | None | Assert 404, zero `INSERT` calls |
| AC3 | A stage row on `tenant-B`'s journey; request to PATCH it as `tenant-A` | Synthetic | None | Assert 404, zero `UPDATE` calls |
| AC4 | Same journey+stages; request to reorder as `tenant-A` | Synthetic | None | Assert 404, zero `UPDATE`/transaction calls |
| AC5 | Same stage; request to save a feature mapping as `tenant-A` | Synthetic | None | Assert 404, zero `pool.connect()`/`INSERT` calls |
| AC6 | A mapping row on `tenant-B`'s stage; request to delete it as `tenant-A` | Synthetic | None | Assert 404, zero `DELETE` calls |
| AC7 | All of the above run together in one suite | Synthetic | None | Assert all 6 pass; a single "0 leaks" summary assertion over the aggregate pass count |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Integration Tests

### GET /journeys/:id for a cross-tenant journey returns 404 with no data leaked

- **Verifies:** AC1
- **Components involved:** `handleGetJourneyCanvas`
- **Precondition:** A journey row owned by `tenant-B`; request session `tenantId: 'tenant-A'`
- **Action:** Call `handleGetJourneyCanvas` directly
- **Expected result:** `res._s === 404`; the response body contains no journey `name`/`description` field with real content (confirms the tenant-scoped `WHERE` clause, not just an empty-but-leaky response)

### POST /journeys/:id/stages for a cross-tenant journey returns 404, no stage created

- **Verifies:** AC2
- **Action:** Call `handlePostJourneyStage` with a cross-tenant journey id
- **Expected result:** `res._s === 404`, zero `INSERT` calls

### PATCH /journeys/:id/stages/:stageId for a cross-tenant stage returns 404, not modified

- **Verifies:** AC3
- **Action:** Call `handlePatchJourneyStage` with a cross-tenant stage id
- **Expected result:** `res._s === 404`, zero `UPDATE` calls

### PATCH /journeys/:id/stages-order for a cross-tenant journey returns 404, order not modified

- **Verifies:** AC4
- **Action:** Call `handlePatchJourneyStagesOrder` with a cross-tenant journey id
- **Expected result:** `res._s === 404`, zero transaction/`UPDATE` calls, zero `pool.connect()` calls

### POST .../feature-mappings for a cross-tenant stage returns 404, no mapping created

- **Verifies:** AC5
- **Action:** Call `handlePostFeatureMapping` with a cross-tenant stage id
- **Expected result:** `res._s === 404`, zero `pool.connect()` calls, zero `INSERT` calls

### DELETE .../feature-mappings/:mappingId for a cross-tenant stage returns 404, not deleted

- **Verifies:** AC6
- **Action:** Call `handleDeleteFeatureMapping` with a cross-tenant stage id
- **Expected result:** `res._s === 404`, zero `DELETE` calls

### All 6 adversarial cases pass together with zero cross-tenant leaks

- **Verifies:** AC7
- **Action:** Run all 6 cases above in the same suite file, track a pass counter
- **Expected result:** All 6 individually pass (already asserted above); a final summary assertion confirms the suite's own pass count equals 6/6, with an explicit "0 cross-tenant leaks found" log line matching the `wuce-multi-tenancy` Phase 5 precedent's own reporting style
