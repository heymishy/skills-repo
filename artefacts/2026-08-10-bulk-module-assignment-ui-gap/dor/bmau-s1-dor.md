## Definition of Ready: bmau-s1 — Bulk-assign-to-module has a working, tested backend but no UI trigger anywhere

**Story:** artefacts/2026-08-10-bulk-module-assignment-ui-gap/stories/bmau-s1-bulk-assign-checkbox-ui.md
**Review artefact:** artefacts/2026-08-10-bulk-module-assignment-ui-gap/review/bmau-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-10-bulk-module-assignment-ui-gap/test-plans/bmau-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/routes/products.js` — `_renderPvcItemRow`: add a checkbox per row when modules exist. `_renderConsolidatedFeaturesSection`: add a selection-bar control ("Assign to module" + dropdown), client-side JS for selection state and the POST call, and success re-render handling.
- New test file: `tests/check-bmau-s1-bulk-assign-checkbox-ui.js`.
- New E2E spec: `tests/e2e/bmau-s1-bulk-assign-rerender.spec.js`.

**Files explicitly out of scope (must not be touched):**
- `handlePostBulkAssignFeatureModules`/`bulkAssignFeaturesToModule` — the backend, reused as-is.
- `handlePutEpicModule` — separate story, not this one.

### Architecture Constraints

No new architectural decision — reuses the existing vanilla-JS client-side pattern already present in this section for the health/search filter chips (`pvc-s1`). No ADR required.

### Human oversight

**Medium** — new UI surface touching client-side selection state in a section that already has some existing client-side behaviour (filter chips) — care needed not to conflict, matching the story's own stated complexity concern.

### Coding Agent Instructions

1. In `_renderPvcItemRow` (`products.js:298`), add a checkbox `<input type="checkbox" data-slug="...">` to each row, gated on the section having ≥1 module (mirror the existing zero-modules fallback check already used elsewhere in this file).
2. In `_renderConsolidatedFeaturesSection`, add a selection bar: a module `<select>`, an "Assign to module" `<button>` (disabled with zero checked), and a small vanilla-JS handler tracking checked `data-slug` values, POSTing to `/products/:id/modules/bulk-assign` on click, and re-rendering (or reloading the affected section) on success.
3. Write the 3 unit tests + 1 integration test per the test plan.
4. Write the Playwright E2E spec per the test plan (AC3) — do not RISK-ACCEPT this; E2E tooling is already configured in this repo.
5. Run the new tests plus existing `products.js`/`pvc-s1` test suites unmodified — zero regression.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified (AC3 classified: Playwright E2E required, not RISK-ACCEPTed, per B2)

**PROCEED: Yes**
