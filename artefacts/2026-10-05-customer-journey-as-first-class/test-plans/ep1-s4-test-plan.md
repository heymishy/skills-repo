## Test Plan: Drag-and-drop stage reorder with keyboard alternative

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
**Epic reference:** journey-entity-and-stage-management
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-09):**

- **New route:** `PATCH /journeys/:id/stages-order` — deliberately NOT `/journeys/:id/stages/order`, which would collide with the existing dispatch regex `/^\/journeys\/[^/]+\/stages\/[^/]+$/` (`handlePatchJourneyStage`, ep1-s3) that treats any single path segment after `/stages/` as a `stageId`. `stages-order` has no `/` in it, so it is unambiguous and requires no change to the existing regex or its match order. Body: `{ stageIds: [uuid, uuid, ...], _csrf }` — the full new order of every stage in the journey, index position = array index.
- **New handler `handlePatchJourneyStagesOrder`** in `journeys.js`. CSRF-guarded first (mandatory from first implementation, per `jcg-s1`/`ep1-s2`/`ep1-s3`'s own precedent). Journey ownership checked (404 for cross-tenant), matching every other handler in this file.
- **Single-transaction requirement (AC1, this story's own explicit architecture constraint):** uses `pool.connect()` → `client.query('BEGIN')` → one `UPDATE customer_journey_stages SET position = $1 WHERE id = $2 AND journey_id = $3 AND tenant_id = $4` per stage in the submitted order → `client.query('COMMIT')`, with `client.query('ROLLBACK')` in the catch branch and `client.release()` in `finally` — this is the exact pattern already established in `tenant-admin-bootstrap.js`'s `bootstrapTenantAdminIfNeeded` (the only other transactional write in this codebase), reused rather than inventing a second convention. A single `pool.query()` per-row (no `BEGIN`/`COMMIT`) would NOT satisfy AC1's own "single Postgres transaction" wording — `pg.Pool.query()` may route each call to a different pooled connection and gives no atomicity guarantee across statements.
- **stageIds validation before any UPDATE:** every id in the submitted array must belong to this journey (verified by a single `SELECT id FROM customer_journey_stages WHERE journey_id = $1` and set-comparison against the submitted array) — reject with 400 if the sets don't match exactly (missing id, extra id, or an id from a different journey/tenant). This is checked before `BEGIN`, so a rejected request never opens a transaction at all.
- **Client-side drag-and-drop:** reuses this codebase's own existing native-HTML5-drag-and-drop convention from `kanban-view.js` (`draggable="true"` + `ondragstart` setting `event.dataTransfer.setData('text/plain', JSON.stringify({stageId}))`; the list container gets `ondragover` (calling `event.preventDefault()`) and `ondrop` reading `event.dataTransfer.getData(...)`) — not a new pattern, and satisfies this story's own "no new npm runtime dependencies" NFR the same way `kanban-view.js` already does.
- **Optimistic UI + rollback (AC2):** on drop, the DOM is reordered immediately (before the PATCH resolves) and the pre-drop DOM order is snapshotted; if the PATCH rejects, the snapshot is restored and a toast with the exact text `"Stage order not saved — please try again"` is shown. This mirrors `_kbReorderWithinColumn`'s general shape in `kanban-view.js` but is a fresh implementation (kanban's own reorder is `localStorage`-persisted, client-only — this story's is server-persisted via a real PATCH, so the failure path is genuinely reachable here in a way it structurally isn't in the kanban precedent).
- **Keyboard alternative (AC3):** up/down move buttons rendered on every stage card when there are 2+ stages (no controls on a single-stage journey — nothing to reorder against), directly mirroring `kanban-view.js`'s own `s3.2` precedent (`kbMoveCard`, `AC4`) — first stage's "up" disabled, last stage's "down" disabled. Calls the same `stages-order` endpoint as the drag path, via the same submit function — proving one mechanism, not two (same pattern s3.2's own test explicitly asserts for its own two reorder paths).
- **AC4 (re-render in new order):** already satisfied by `handleGetJourneyCanvas`'s existing `ORDER BY position ASC` query (ep1-s1) — no server-side change needed beyond the fact that `position` values are now correctly updated by the new handler. Verified by a unit test that re-queries the canvas after a successful reorder.

---

**E2E/browser-layout detection (Step 3a):** AC1's own wording ("Given I drag a stage card... When I drop it") is an explicit trigger-pattern match ("Drag-and-drop — which element is the drop target depends on CSS layout") — flagged per this skill's own rule. **E2E tooling (Playwright) IS configured for this repo** and already has two real drag-and-drop specs (`tests/e2e/s3.1-drag-to-advance.spec.js`, `tests/e2e/s3.2-within-column-reorder.spec.js`) — **Option 1 (E2E browser test) is chosen**, reusing their own manual `page.mouse.move/down/move/up` sequence (documented in `s3.1`'s own spec as more reliable than Playwright's `dragTo()` for native HTML5 `draggable="true"` elements). AC2 (drop-failure rollback) also requires E2E — it needs a real drag gesture AND a real intercepted network failure (`page.route`), matching `s3.1`'s own AC2 precedent for network-interception-based assertions. AC3 (keyboard alternative) and AC4 (backend re-render) are **not** CSS-layout-dependent — matching `s3.2`'s own precedent, where its equivalent keyboard-alternative AC (AC4) needed no E2E coverage at all — so both are covered at the unit level only.

**Executability this session:** Same constraint as `ep1-s3`'s own test plan — no real `DATABASE_URL`/local Postgres available this session, so the new E2E spec will be written but not executed here (operator-runnable via `npx playwright test tests/e2e/ep1-s4-stage-reorder.spec.js` against a real database). All server-side unit tests use a mock pool/client and run in the standard `npm test` chain regardless.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 (backend) | Valid ordered stageIds array updates all positions in one transaction (BEGIN…COMMIT), scoped by journey/tenant | 1 test | — | — | — | — | 🟢 |
| AC1 (backend security) | A stageId not belonging to this journey is rejected before any UPDATE, zero BEGIN/COMMIT | 1 test | — | — | — | — | 🟢 |
| AC1 (backend security) | A stageIds array missing one of the journey's real stages is rejected (added during implementation — 12th unit test, beyond this plan's original count) | 1 test | — | — | — | — | 🟢 |
| AC1 (backend security) | CSRF missing/mismatched is rejected | 1 test | — | — | — | — | 🟢 |
| AC1 (backend security) | Cross-tenant journey id is rejected (404) | 1 test | — | — | — | — | 🟢 |
| AC1 (atomicity) | A mid-transaction DB failure triggers ROLLBACK — zero of the attempted position updates persist | 1 test | — | — | — | — | 🟢 |
| AC1 (interaction) | Dragging a stage card to a new position and dropping it PATCHes the new order and the canvas re-renders in that order | — | — | 1 spec (written, not run this session — no real DB) | — | written-but-unexecuted | 🟡 |
| AC1 (wiring shape) | Stage cards are `draggable="true"`; the stage list container wires `ondragover`/`ondrop` to the reorder handler | 1 test | — | — | — | — | 🟢 |
| AC2 (shape) | The drop handler's failure branch reverts the DOM to the pre-drop snapshot and shows the exact toast text | 1 test | — | — | — | — | 🟢 |
| AC2 (interaction) | A real drop whose PATCH fails (intercepted network error) rolls the cards back visually and shows the toast | — | — | 1 spec (written, not run this session) | — | written-but-unexecuted | 🟡 |
| AC3 | Up/down move buttons render on every stage card (2+ stages); first stage's "up" and last stage's "down" are disabled | 1 test | — | — | — | — | 🟢 |
| AC3 | A single-stage journey renders no reorder controls | 1 test | — | — | — | — | 🟢 |
| AC3 | Clicking a move button calls the same `stages-order` endpoint as the drag path, with the correctly recomputed order | 1 test | — | — | — | — | 🟢 |
| AC4 | After a successful reorder, re-querying the canvas renders stage cards in the new `position` order | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

AC1's interaction half and AC2's interaction half are written as a real Playwright spec but cannot be executed this session (no `DATABASE_URL`/local Postgres available) — logged honestly as "written-but-unexecuted," matching `ep1-s3`'s own precedent for the exact same constraint. Not a RISK-ACCEPT (which would mean "deliberately not writing a test") — the test exists and is operator/CI-runnable. All other ACs (backend transaction correctness, security, keyboard alternative, re-render order) are fully unit-testable server-side with a mock pool/client, following `tenant-admin-bootstrap.js`'s own established transactional-mock convention.

---

## Test Data Strategy

**Source:** Synthetic — extends `check-ep1-s3-stage-panel.js`'s own mock-pool/CSRF-fixture conventions, plus a transactional mock client (`pool.connect()` → `client.query('BEGIN'/'COMMIT'/'ROLLBACK')`) modeled directly on `check-tab-s1-tenant-admin-bootstrap.js`'s own fake-pool pattern — the only other transactional handler test in this codebase. The E2E spec uses real HTTP against a real Postgres via the `withAuth` fixture and the manual drag-gesture helper already established in `tests/e2e/s3.1-drag-to-advance.spec.js`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now for unit tests; E2E spec requires a real `DATABASE_URL` (not available this session).
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 (backend) | Mock pool: journey ownership SELECT succeeds; stage-set SELECT returns exactly the 3 ids being reordered; transactional client records BEGIN/UPDATE×3/COMMIT | Synthetic | None | Assert each UPDATE targets `position = index`, scoped by `id`/`journey_id`/`tenant_id`; assert COMMIT called, ROLLBACK not called |
| AC1 (backend security, foreign id) | Submitted `stageIds` includes one id not in the journey's real stage set | Synthetic | None | Assert 400, zero `client.connect()`/BEGIN calls at all (rejected before any transaction opens) |
| AC1 (backend security, CSRF) | No/mismatched `_csrf` | Synthetic | None | Assert 403, zero transaction opened |
| AC1 (backend security, cross-tenant) | Journey-ownership SELECT returns zero rows for this tenant | Synthetic | None | Assert 404, zero transaction opened |
| AC1 (atomicity) | Mock transactional client configured to throw on the 2nd of 3 UPDATEs | Synthetic | None | Assert `ROLLBACK` called, final mock-pool state shows ALL THREE stages still at their original `position` values (not just the failed one) |
| AC1 (wiring shape) | Mock pool returning 2 stage rows | Synthetic | None | Assert rendered stage card markup includes `draggable="true"` and `data-stage-id`; assert the rendered `<script>` wires `ondragover`/`ondrop` on the stages list container |
| AC2 (shape) | Rendered script's drop-handler function body | Synthetic | None | Extract the drop handler function body (mirroring `check-s3.2-within-column-reorder.js`'s own `extractFunctionBody` helper) and assert it calls a snapshot-restore function and sets a toast element's text to exactly `"Stage order not saved — please try again"` in its `.catch()` branch |
| AC3 (render) | Mock pool returning 3 stage rows | Synthetic | None | Assert up/down buttons present for all 3; first stage's up button has `disabled`, last stage's down button has `disabled`, middle stage's buttons do not |
| AC3 (single-stage) | Mock pool returning 1 stage row | Synthetic | None | Assert no reorder-control elements rendered at all |
| AC3 (click wiring) | Rendered script's move-button handler function body | Synthetic | None | Assert the handler computes the new order from current DOM position and calls the same `submitJson`/`stages-order` call path the drag handler uses (shared mechanism, not a duplicate) |
| AC4 | Mock pool with 3 stages whose `position` values were just updated by a prior reorder call | Synthetic | None | Re-invoke `handleGetJourneyCanvas` and assert the rendered stage card order (by DOM appearance order) matches the new `position` values, not the original insert order |

### PCI / sensitivity constraints

None.

### Gaps

AC1 (interaction)/AC2 (interaction) — see Coverage gaps above.

---

## Unit Tests

### Valid ordered stageIds array updates all positions in one transaction

- **Verifies:** AC1 (backend)
- **Action:** Call `handlePatchJourneyStagesOrder` with a matching CSRF token, a journey owned by the session's tenant, and `stageIds` containing exactly the journey's 3 existing stage ids in a new order
- **Expected result:** `client.connect()` called once; `BEGIN` then exactly 3 `UPDATE customer_journey_stages SET position = $1 ... WHERE id = $2 AND journey_id = $3 AND tenant_id = $4` calls (one per stage, `position` matching each id's new array index) then `COMMIT`; `ROLLBACK` never called; 200 response
- **Edge case:** No

### A stageId not belonging to this journey is rejected before any transaction opens

- **Verifies:** AC1 (backend security)
- **Action:** Call `handlePatchJourneyStagesOrder` with a `stageIds` array that includes one id belonging to a different journey
- **Expected result:** 400 response; `client.connect()` never called (no transaction opened at all)
- **Edge case:** Yes

### Missing or mismatched CSRF token is rejected

- **Verifies:** AC1 (backend security)
- **Action:** Call `handlePatchJourneyStagesOrder` with no/mismatched `_csrf`
- **Expected result:** 403 response; `client.connect()` never called
- **Edge case:** Yes — two sub-cases, mirroring every prior story's own CSRF test shape

### Cross-tenant journey id is rejected

- **Verifies:** AC1 (backend security)
- **Action:** Call `handlePatchJourneyStagesOrder` with a journey id belonging to a different tenant
- **Expected result:** 404 response; `client.connect()` never called
- **Edge case:** Yes

### A mid-transaction failure rolls back all position updates, not just the failed one

- **Verifies:** AC1 (atomicity)
- **Action:** Call `handlePatchJourneyStagesOrder` with 3 stageIds, using a mock transactional client configured to throw on the 2nd UPDATE call
- **Expected result:** `ROLLBACK` is called; the mock pool's underlying stage records show ALL THREE stages still at their pre-call `position` values (proves the 1st UPDATE's effect was also reverted, not just that the 2nd/3rd never ran) — this is the test that actually exercises the "single transaction" requirement, not just that `BEGIN`/`COMMIT` strings appear in the call log
- **Edge case:** Yes

### Stage cards are draggable and the list container wires drop handling

- **Verifies:** AC1 (wiring shape)
- **Action:** Call `handleGetJourneyCanvas` with a mock pool returning 2 stage rows
- **Expected result:** Rendered `bodyContent` contains `draggable="true"` on each `.sw-stage-card`, and the rendered `<script>` registers an `ondragover`-style listener (with `preventDefault`) and a drop listener on the stages list container that reads `event.dataTransfer`
- **Edge case:** No

### Drop-handler failure branch reverts the DOM snapshot and shows the exact toast text

- **Verifies:** AC2 (shape)
- **Action:** Extract the rendered client script's drop-handler function body (brace-counting extraction, mirroring `check-s3.2-within-column-reorder.js`'s own `extractFunctionBody` helper) from `handleGetJourneyCanvas`'s output
- **Expected result:** The function body's `.catch()` (or equivalent failure) branch calls a DOM-restore function using the pre-drop snapshot, and sets a toast/error element's text to exactly `"Stage order not saved — please try again"` — not a paraphrase
- **Edge case:** Yes

### Up/down move buttons render correctly, boundary-disabled

- **Verifies:** AC3
- **Action:** Call `handleGetJourneyCanvas` with a mock pool returning 3 stage rows
- **Expected result:** All 3 stage cards render an up and a down button; the first stage's up button has `disabled`, the last stage's down button has `disabled`, the middle stage's buttons do not
- **Edge case:** No

### A single-stage journey renders no reorder controls

- **Verifies:** AC3
- **Action:** Call `handleGetJourneyCanvas` with a mock pool returning exactly 1 stage row
- **Expected result:** No up/down button elements rendered anywhere in `bodyContent` (nothing to reorder against)
- **Edge case:** Yes

### Move-button click handler shares the same reorder call path as the drag handler

- **Verifies:** AC3 (click wiring)
- **Action:** Extract both the move-button click handler's and the drop handler's function bodies from the rendered script
- **Expected result:** Both call the same underlying submit function targeting `stages-order` (proves one shared mechanism, not two independently-maintained implementations — mirrors `check-s3.2-within-column-reorder.js`'s own equivalent assertion for `kbMoveCard`/`_kbReorderWithinColumn`)
- **Edge case:** No

### Canvas re-render reflects the new position order after a successful reorder

- **Verifies:** AC4
- **Action:** Call `handlePatchJourneyStagesOrder` to reorder 3 stages, then call `handleGetJourneyCanvas` against the same mock pool
- **Expected result:** The stage cards appear in `bodyContent` in the NEW order (matching the updated `position` values), not the original insert order
- **Edge case:** No

---

## E2E Spec (written, not executed this session — see Coverage gaps)

### File: `tests/e2e/ep1-s4-stage-reorder.spec.js`

- **Verifies:** AC1 (interaction), AC2 (interaction)
- **Not in npm test chain** (matches `ep1-s3-stage-panel-focus-management.spec.js`'s and `s3.1-drag-to-advance.spec.js`'s own precedent) — run with `npx playwright test tests/e2e/ep1-s4-stage-reorder.spec.js`, requires a real `DATABASE_URL`.
- **Scenario (AC1):** Create a journey with 3 stages via real HTTP (`withAuth` fixture). Navigate to the canvas. Using the manual `page.mouse.move/down/move/up` drag sequence already established in `s3.1-drag-to-advance.spec.js` (more reliable for native `draggable="true"` elements than Playwright's `dragTo()`), drag the first stage card to the position after the third. Assert a `PATCH .../stages-order` request fires and resolves 200. Reload the canvas and assert the stage cards now appear in the dropped-to order.
- **Scenario (AC2):** Create a journey with 2 stages. Intercept the `stages-order` PATCH via `page.route` to return a network error (matching `s3.1-drag-to-advance.spec.js`'s own AC2 interception pattern). Perform the same drag gesture. Assert the stage cards remain in (or visually revert to) their pre-drag order, and a toast element containing the exact text `"Stage order not saved — please try again"` is visible.

---

## AC Verification Script

Saved separately to `artefacts/2026-10-05-customer-journey-as-first-class/verification-scripts/ep1-s4-verification.md`.
