# DoR Contract: Free node positioning persisted across reloads

**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s2.md
**Date:** 2026-10-10

---

## What will be built

- `position_x`/`position_y` columns (nullable `DOUBLE PRECISION`) added to `customer_journey_stages` via `scripts/migrate-schema-journeys.js` (`ADD COLUMN IF NOT EXISTS`, idempotent, no backfill).
- A new `PATCH /journeys/:id/stages/:stageId/position` route (or equivalent) in `journeys.js`: ownership check before mutation, 404 (not 403) for a cross-tenant stage id, single-statement `UPDATE` (no transaction), matching D13/D6 exactly.
- Client-side drag handler on each drawflow node: on drop, calls the new route with the node's new coordinates. **On success, the node simply stays where it was dropped — no `window.location.reload()`.** (See Architecture Constraints below — this is a live-dragging interaction, not a static form submit; `web-ui-patterns.md`'s own "Client-side DOM patch vs. full page reload" rule applies, not `ep3-s2`'s D18 reload-after-save pattern, which was for a different page shape.)
- On save failure, a visible error toast (reusing `ep1-s4`'s own toast styling/mechanism), not a silent failure.
- When `position_x`/`position_y` are `NULL`, the canvas falls back to `ic-s1`'s own deterministic auto-layout — this fallback logic already exists from `ic-s1`; this story only adds the "is it NULL" branch.

## What will NOT be built

- Pan/zoom — `ic-s3`.
- Keyboard-accessible movement — `ic-s4` (reuses this story's route).
- Backfilling positions for existing stages — not needed, `NULL` is a valid, handled state.
- Any change to the underlying `position` (sequence-order) field — dragging changes visual position only.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real browser drag via Playwright, confirm persistence across reload | E2E (`tests/e2e/ic-s2-canvas-drag-position.spec.js`) |
| AC2 | Mock-pool render test with `NULL` position, assert `ic-s1`'s fallback layout used | Unit |
| AC3 | Direct handler call with cross-tenant stage id, assert 404 + zero `UPDATE` calls | Integration |
| AC4 | Run the migration script twice against a test DB, assert idempotent + no error | Integration |
| AC5 | Direct handler call updating stage A, assert stage B's mock-pool state unchanged | Unit |
| AC6 | Mocked failing `fetch`, assert toast DOM element with correct text appears | Unit |

## Assumptions

- The position-update route is a new, dedicated route (not folded into the existing general stage-attribute PATCH route from `ep1-s3`) — keeps the ownership-check/response shape simple and matches this file's own one-concern-per-route convention.
- `web-ui-patterns.md`'s "Client-side DOM patch vs. full page reload" rule applies here, NOT `ep3-s2`'s D18 reload pattern — explicitly confirmed in Architecture Constraints below, since this is a genuinely different page-interaction shape (live drag vs. static form submit) and a reviewer or coding agent could otherwise reasonably but incorrectly assume D18 applies.

## Estimated touch points

**Files:** `src/web-ui/routes/journeys.js`, `scripts/migrate-schema-journeys.js`, `tests/check-ic-s2-position-persist.js` (new), `tests/e2e/ic-s2-canvas-drag-position.spec.js` (new)
**Services:** None
**APIs:** `PATCH /journeys/:id/stages/:stageId/position` (new, authenticated, tenant-scoped)
