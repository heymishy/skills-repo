# Contract Proposal: Drag-and-drop stage reorder with keyboard alternative (ep1-s4)

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md
**Test plan reference:** artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep1-s4-test-plan.md
**Date:** 2026-10-09

---

## What will be built

- **`handlePatchJourneyStagesOrder`** — new handler in `src/web-ui/routes/journeys.js`. CSRF-guarded first statement. Journey ownership check (404 for cross-tenant). Validates the submitted `stageIds` array is an exact set match against the journey's real stage ids (400 if any id is missing, extra, or from a different journey/tenant) — checked *before* opening any transaction. On success: `pool.connect()` → `client.query('BEGIN')` → one `UPDATE customer_journey_stages SET position = $1 ... WHERE id = $2 AND journey_id = $3 AND tenant_id = $4` per stage (position = array index) → `client.query('COMMIT')`; `ROLLBACK` in the catch branch; `client.release()` in `finally`. Exported from the module.
- **`server.js`** — one new dispatch entry: `pathname.match(/^\/journeys\/[^/]+\/stages-order$/) && req.method === 'PATCH'`, wrapped in `authGuard` + `requireNonViewer`, matching every other journeys route.
- **`handleGetJourneyCanvas` client script extensions:**
  - Stage cards get `draggable="true"` (already have `data-stage-id` from `ep1-s2`).
  - The stages list container (`#sw-journey-stages`) gets `ondragover` (`preventDefault`) and a drop handler, reading `event.dataTransfer` for the dragged stage id — mirroring `kanban-view.js`'s existing native-HTML5-drag convention.
  - Up/down move buttons rendered on each stage card when there are 2+ stages, with `disabled` on the first card's up button and the last card's down button — mirroring `kanban-view.js`'s own `s3.2`/`kbMoveCard` precedent.
  - One shared `submitOrder(newOrderIds)` function, called by both the drop handler and the move-button handler (proving one mechanism, not two) — PATCHes `stages-order`, and on success updates the DOM order in place.
  - Optimistic UI: on drop/move, the DOM reorders immediately; the pre-action order is snapshotted first. On a rejected/failed PATCH, the snapshot is restored and a small inline error element (reusing the `sw-stage-panel-saved`-style inline-indicator pattern already established in `ep1-s3`, not a new global toast subsystem) shows the exact text `"Stage order not saved — please try again"`.
- **`tests/check-ep1-s4-stage-reorder.js`** (new) — 11 unit tests per the test plan, using a transactional mock pool/client modeled on `check-tab-s1-tenant-admin-bootstrap.js`'s own fake-pool pattern.
- **`tests/e2e/ep1-s4-stage-reorder.spec.js`** (new) — 2 scenarios (AC1 interaction, AC2 interaction), using the manual `page.mouse.move/down/move/up` drag sequence from `s3.1-drag-to-advance.spec.js`. Written, not executed this session (no `DATABASE_URL`) — same honest gap as `ep1-s3`'s own spec.

## What will NOT be built

- Parallel/branching stage structures — explicit story Out of Scope.
- Any undo mechanism beyond the network-failure rollback — explicit story Out of Scope.
- Wiring the new E2E spec into `.github/workflows/e2e.yml`'s Scenario A/B blocking job lists — a separate CI-infrastructure decision, out of this story's scope (matching `ep1-s3`'s own `decisions.md` D5 precedent).
- Extending `fake-test-db.js` with `customer_journeys`/`customer_journey_stages` support — a pre-existing, already-logged follow-up, not this story's scope.
- A new reusable toast/notification component — the error message reuses the existing inline-indicator pattern; building a generic toast system is not required by any AC.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (backend: one transaction updates all positions) | `handlePatchJourneyStagesOrder` called directly against a transactional mock pool/client; assert `BEGIN`→UPDATE×n→`COMMIT`, `ROLLBACK` never called | unit |
| AC1 (interaction: real drag reorders and persists) | Real browser drag gesture via Playwright's manual mouse sequence; assert the PATCH fires and the reload reflects the new order | E2E (written, not executed this session) |
| AC2 (shape: failure branch reverts + exact toast text) | Extract the drop-handler function body from the rendered client script; assert it calls the restore function and sets the error text to the exact quoted string | unit (shape/source-text) |
| AC2 (interaction: real network failure rolls back visually) | Playwright `page.route` interception forces a PATCH failure during a real drag; assert the cards revert and the toast is visible | E2E (written, not executed this session) |
| AC3 (keyboard alternative, with boundary disabling) | `handleGetJourneyCanvas` called with a mock pool returning 2/3/1 stage rows; assert button presence, disabled states, and that the click handler shares `submitOrder` with the drop handler | unit |
| AC4 (canvas re-renders in new order) | `handlePatchJourneyStagesOrder` then `handleGetJourneyCanvas` against the same mock pool; assert stage card DOM order matches updated `position` values | unit |

## Assumptions

- The existing `data-stage-id` attribute and embedded `stageData` JSON blob (both from `ep1-s2`/`ep1-s3`) are sufficient to compute the dragged stage's identity and the drop target's new index — no new server-side data needs to be embedded in the canvas response for this story.
- "Position rebalancing... in a single transaction" (the story's own Architecture Constraints) is satisfied by rewriting every stage's `position` to its full new index on every reorder (not a sparse/partial diff) — the simplest approach that is trivially correct, and avoids edge cases a partial-renumbering scheme would introduce (e.g. gaps, duplicate positions from a half-applied diff).
- No new toast/notification component is needed — the existing inline-indicator visual pattern from `ep1-s3`'s side panel is reused for AC2's error message, scoped to the canvas rather than built as a new reusable subsystem (avoids a premature abstraction for a single use).

## Estimated touch points

**Files:** `src/web-ui/routes/journeys.js`, `src/web-ui/server.js`, `tests/check-ep1-s4-stage-reorder.js` (new), `tests/e2e/ep1-s4-stage-reorder.spec.js` (new)
**Services:** None external.
**APIs:** `PATCH /journeys/:id/stages-order` (new).
