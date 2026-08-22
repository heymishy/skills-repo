## Test Plan: Build the shared viewer-write-block gate and wire it to Products + Features/journeys routes

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s1-gate-and-products-features.md`
**Epic reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/epics/vrne-e1-viewer-write-blocking.md`
**Test plan author:** Copilot
**Date:** 2026-08-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Viewer denied on every Products-group write route | 15 tests | — | — | — | — | 🟢 |
| AC2 | Viewer denied on every Features/journeys-group write route | 18 tests | — | — | — | — | 🟢 |
| AC3 | engineer/product/admin roles unaffected (regression guard) | 3 tests | — | — | — | — | 🟢 |
| AC4 | Ambiguous/missing role denied (fail-closed) | 4 tests | — | — | — | — | 🟢 |
| AC5 | Denial is logged (person ID, tenant ID, timestamp, route) | 1 test | 1 test | — | — | — | 🟢 |

Per review finding `1-M2` (resolved via `/decisions`), AC1 and AC2 are covered by **one test per listed route**, not one bundled test per AC — every route named in the story's own AC text has its own dedicated test entry below, so partial coverage cannot silently pass as AC-complete.

---

## Coverage gaps

None. Every AC has full unit-test coverage; no CSS-layout, DOM-behaviour, external-dependency, or untestable-by-nature gaps — this is pure backend HTTP-response-code behaviour.

---

## Test Data Strategy

**Source:** Synthetic — in-memory `req`/`res` mock objects, matching the existing pattern in `tests/check-arl-s2-admin-middleware.js` (this repo's own `requireAdmin` test file). No database, no fixtures, no real session store.
**PCI/sensitivity in scope:** No — `req.session.role`/`tenantId`/`login` are synthetic string values in every test, never real production data.
**Availability:** Available now — no dependency.
**Owner:** Self-contained — tests generate their own mock `req`/`res` in setup.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock `req` with `session.role: 'viewer'`, mock `res` capturing status/body | Synthetic | None | One req/res pair per route under test |
| AC2 | Same as AC1 | Synthetic | None | |
| AC3 | Mock `req` with `session.role` set to `'engineer'`/`'product'`/`'admin'` in turn | Synthetic | None | |
| AC4 | Mock `req` with `session.role` missing/null/an unrecognised string | Synthetic | None | |
| AC5 | Injectable test logger (mirrors `require-admin.js`'s `setLogger`) | Synthetic | None | Asserts logger called with expected fields, not real log output |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Refactor precondition (implementation task, not a test — recorded here for traceability)

Per `decisions.md` (ARCH entry, 2026-08-22): `src/web-ui/middleware/require-admin.js` must export a shared `resolveRole(req)` helper before this story's gate can reuse it. This is a coding-agent implementation task, verified indirectly by test `resolver-reuse-not-duplicated` below — not a standalone test of its own.

### resolver-reuse-not-duplicated

- **Verifies:** Architecture Constraint (require-admin.js refactor)
- **Precondition:** Both `requireAdmin` and the new gate (`requireNonViewer`) are loaded fresh.
- **Action:** Assert `require-admin.js` exports a `resolveRole` function, and that the new gate module's source does not contain its own independent copy of the session-role-read + live-role-check logic (a static source-inspection test, mirroring `check-p3.5-validate-trace.js`'s own `sh-script-unmodified-when-ps1-present`-style structural check).
- **Expected result:** `resolveRole` is exported from `require-admin.js`; the new gate's source calls it rather than re-implementing role resolution.
- **Edge case:** No.

### AC1 — Products-group routes (one test per route, viewer denied)

| Test name | Route | Method | Expected |
|-----------|-------|--------|----------|
| viewer-denied-products-new | `/products/new` | POST | 403, no product draft generated |
| viewer-denied-products-confirm | `/products/confirm` | POST | 403, no product persisted |
| viewer-denied-products-sync | `/products/:id/sync` | POST | 403, no sync triggered |
| viewer-denied-products-repo | `/products/:id/repo` | POST | 403, no repo connected |
| viewer-denied-products-delete | `/products/:id` | DELETE | 403, product not deleted |
| viewer-denied-products-edit | `/products/:id` | PUT | 403, product not edited |
| viewer-denied-products-repo-create | `/products/:id/repo/create` | POST | 403, no repo created |
| viewer-denied-board-advance | `/api/board/journey/:journeyId/advance` | POST | 403, journey not advanced |
| viewer-denied-guardrails-form | `/products/:id/guardrails/form` | POST | 403, no GitHub PR opened |
| viewer-denied-guardrails-promote | `/products/:id/guardrails/promote` | POST | 403, no promotion requested |
| viewer-denied-modules-create | `/products/:id/modules` | POST | 403, module not created |
| viewer-denied-modules-edit | `/products/:id/modules/:moduleId` | PUT | 403, module not renamed |
| viewer-denied-modules-delete | `/products/:id/modules/:moduleId` | DELETE | 403, module not deleted |
| viewer-denied-epic-module | `/products/:id/epics/:epicId/module` | PUT | 403, epic not reassigned |
| viewer-denied-modules-bulk-assign | `/products/:id/modules/bulk-assign` | POST | 403, no bulk assignment made |

- **Verifies:** AC1
- **Precondition (each test):** Mock `req.session = { userId: 'u1', role: 'viewer', tenantId: 't1', login: 'viewer@test' }`.
- **Action:** Call the route's handler (or the gate directly, wired the same way `server.js` wires it) with the mock req/res.
- **Expected result:** `res._status === 403`; the underlying write function (product/module/etc. persistence call) is never invoked — asserted via a spy, not just the status code, so the test proves the write was actually blocked, not just that a response was sent.
- **Edge case:** No.

### AC2 — Features/journeys-group routes (one test per route, viewer denied)

| Test name | Route | Method | Expected |
|-----------|-------|--------|----------|
| viewer-denied-products-features | `/products/:id/features` | POST | 403, no feature created |
| viewer-denied-journey-create | `/api/journey` | POST | 403, no journey created |
| viewer-denied-gate-confirm | `/api/journey/:id/gate-confirm` | POST | 403, journey stage not advanced |
| viewer-denied-journey-stories | `/api/journey/:id/stories` | POST | 403, story list not set |
| viewer-denied-stage-artefact | `/api/journey/:id/stage/:stage/artefact` | POST | 403, artefact not saved |
| viewer-denied-reference | `/api/journey/:id/reference` | POST | 403, reference not saved |
| viewer-denied-reference-upload | `/api/journey/:id/reference-upload` | POST | 403, file not uploaded |
| viewer-denied-reference-modal-skip | `/api/journey/:id/reference-modal/skip` | POST | 403, modal state not changed |
| viewer-denied-side-trip-clarify | `/api/journey/:id/side-trip/clarify` | POST | 403, side-trip not opened |
| viewer-denied-decisions | `/api/journey/:id/decisions` | POST | 403, decision entry not appended |
| viewer-denied-estimate | `/api/journey/:id/estimate` | POST | 403, estimate not posted |
| viewer-denied-spikes-create | `/api/journey/:id/spikes` | POST | 403, spike not created |
| viewer-denied-spikes-patch | `/api/journey/:id/spikes/:spikeSlug` | PATCH | 403, spike outcome not recorded |
| viewer-denied-side-trip-delete | `/api/journey/:id/side-trip` | DELETE | 403, side-trip not closed |
| viewer-denied-journey-delete | `/api/journey/:id` | DELETE | 403, journey NOT hard-deleted |
| viewer-denied-display-name | `/api/journey/:id/display-name` | PUT | 403, display name not renamed |
| viewer-denied-ideas-create | `/api/ideas` | POST | 403, idea not created |
| viewer-denied-ideas-delete | `/api/ideas/:id` | DELETE | 403, idea not deleted |

- **Verifies:** AC2
- **Precondition (each test):** Same mock `req.session` as AC1.
- **Action:** Same pattern as AC1.
- **Expected result:** `res._status === 403`; underlying write function never invoked (spy-verified).
- **Edge case:** `viewer-denied-journey-delete` is flagged as a priority edge case — a hard-delete route where a false negative (viewer not actually denied) would be irreversible data loss, not just an incorrect read.

### AC3 — Non-viewer roles unaffected (regression guard)

- **engineer-role-products-confirm-succeeds**
  - **Verifies:** AC3
  - **Precondition:** Mock `req.session = { role: 'engineer', ... }`.
  - **Action:** Call `/products/confirm` handler.
  - **Expected result:** Gate calls `next()`; request proceeds exactly as it did before this story (no 403, no behaviour change).
  - **Edge case:** No.
- **product-role-journey-create-succeeds** — same pattern for `role: 'product'` on `/api/journey`.
- **admin-role-journey-delete-succeeds** — same pattern for `role: 'admin'` on `/api/journey/:id` DELETE (the highest-stakes route, explicitly regression-tested for the role that must retain full access).

### AC4 — Ambiguous/missing role denied (fail-closed)

- **missing-role-denied** — `req.session = { userId: 'u1', tenantId: 't1' }` (no `role` field) → 403.
- **null-role-denied** — `req.session = { userId: 'u1', role: null, tenantId: 't1' }` → 403.
- **unrecognised-role-denied** — `req.session = { userId: 'u1', role: 'contractor', tenantId: 't1' }` (a value outside the 4 valid roles) → 403.
- **no-session-denied** — `req.session = null` → 403 (mirrors `requireAdmin`'s own unauthenticated handling).

### AC5 — Denial logging

- **denial-logged-with-required-fields**
  - **Verifies:** AC5
  - **Precondition:** Injectable test logger wired via the gate's own `setLogger` (mirroring `require-admin.js`'s pattern).
  - **Action:** Trigger a viewer denial on any gated route.
  - **Expected result:** Logger's `warn` called once with an event name (e.g. `viewer_write_denied`) and a payload containing `personId`, `tenantId`, `timestamp`, and `route` — all non-null.
  - **Edge case:** No.

---

## Integration Tests

### gate-wired-in-server-js

- **Verifies:** AC5 (and implicitly AC1/AC2 — confirms the gate is actually reachable via the real route dispatch, not just unit-testable in isolation)
- **Components involved:** `server.js` route dispatch, the new gate module, `require-admin.js`'s shared `resolveRole`.
- **Precondition:** Real `server.js` module loaded (not mocked), with the credits/DB adapters stubbed as this repo's existing test harness already does for other route tests.
- **Action:** Issue a real HTTP request (via the existing test harness pattern used elsewhere in `tests/`) to one representative Products route and one representative Features/journeys route with a viewer-role session.
- **Expected result:** Both return 403 through the real dispatch path, confirming the gate is actually wired into `server.js` and not just defined in isolation.

---

## NFR Tests

### audit-log-format-matches-require-admin-convention

- **NFR addressed:** Audit
- **Measurement method:** Structural assertion on the logged payload shape, comparing field names against `require-admin.js`'s existing `admin_access_denied` log call.
- **Pass threshold:** Logged payload contains `personId`, `tenantId`, `timestamp` — same field names as the existing convention (no drift in log schema between the two gates).
- **Tool:** Node `assert`, part of `tests/check-vrne-s1-*.js`.

No Performance or Accessibility NFR tests — story's own NFR section states "no new query pattern" and "not applicable" respectively; confirmed no test needed for either.

---

## Out of Scope for This Test Plan

- Skill session, Credits/billing, and edge-case routes — covered by `vrne-s2`/`vrne-s3`/`vrne-s4`'s own test plans.
- Team-management routes — already fully `requireAdmin`-gated; no test needed, confirmed at `/definition`.
- Browser-based/E2E testing — no AC in this story depends on CSS layout or rendered position; all ACs are backend HTTP-response-code assertions, fully coverable at the unit/integration level.

---

## Test Gaps and Risks

None. Every AC has full automated coverage with no manual-only fallback required.
