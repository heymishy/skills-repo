## Test Plan: Bulk-assign-to-module has a working, tested backend but no UI trigger anywhere

**Story reference:** artefacts/2026-08-10-bulk-module-assignment-ui-gap/stories/bmau-s1-bulk-assign-checkbox-ui.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Checkbox present on each row when ≥1 module exists | 1 test | — | — | — | — | 🟢 |
| AC2 | Bulk-assign calls the real endpoint with checked slugs + selected module | 1 test | — | — | — | — | 🟢 |
| AC3 | Rows re-render under new module after success | — | — | 🔴 CSS/DOM-dependent | 1 scenario | Playwright | 🟡 |
| AC4 | Assign control disabled/hidden with zero checked | 1 test | — | — | — | — | 🟢 |
| AC5 | Zero-modules view unaffected (no checkboxes) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

AC3 (visual re-render behaviour) is CSS/DOM-interaction-dependent — classified per CLAUDE.md's B2 rule. Playwright E2E tooling is configured and used elsewhere in this repo (per `bri-s3.4`/existing `tests/e2e/`), so per B2's condition-for-blocking rule, this passes without needing a RISK-ACCEPT — an E2E spec must be written, not waived.

---

## Test Data Strategy

**Source:** Hand-authored fixtures matching `_renderPvcItemRow`/`_renderConsolidatedFeaturesSection`'s existing input shapes.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | ≥1 module, ≥2 story items | Hand-authored | None | |
| AC2 | Same, plus a mock bulk-assign endpoint | Hand-authored | None | |
| AC3 | Live server + Playwright | Existing E2E harness | None | |
| AC4 | Same fixture as AC1, zero checked | Hand-authored | None | |
| AC5 | Zero modules | Hand-authored | None | |

### PCI / sensitivity constraints

None.

### Gaps

None blocking — AC3's E2E requirement is tracked, not waived.

---

## Unit Tests

### renderPvcItemRow_withModulesPresent_includesCheckbox (AC1)

- **Verifies:** AC1
- **Precondition:** `_renderConsolidatedFeaturesSection` called with `modules.length >= 1`.
- **Action:** Render.
- **Expected result:** Each `<li class="pvc-item">` contains a `<input type="checkbox">` with a `data-slug` attribute matching the item's slug.

### bulkAssignControl_disabledWithZeroChecked (AC4)

- **Verifies:** AC4
- **Precondition:** Same fixture, no checkboxes checked (initial render state).
- **Action:** Inspect the rendered "Assign to module" control's initial markup.
- **Expected result:** The control is rendered `disabled` (or absent, per implementation choice) in its initial state.

### renderPvcItemRow_zeroModules_noCheckboxes (AC5)

- **Verifies:** AC5
- **Precondition:** `_renderConsolidatedFeaturesSection` called with `modules.length === 0`.
- **Action:** Render.
- **Expected result:** No checkbox markup anywhere in the output — byte-identical structure to before this story for the zero-modules path.

## Integration Tests

### handlePostBulkAssign_calledWithCheckedSlugsAndModule (AC2)

- **Verifies:** AC2
- **Precondition:** A mock/spy on `bulkAssignFeaturesToModule`; 3 story checkboxes checked, one module selected.
- **Action:** Simulate the client-side "Assign to module" submit (POST to the real route with the checked slugs + module id).
- **Expected result:** `bulkAssignFeaturesToModule` (or the route wrapping it) is called with exactly the 3 checked slugs and the selected module id — no more, no fewer.

## E2E Tests

### bmau-s1-bulk-assign-rerender.spec.js (AC3)

- **Verifies:** AC3
- **Scenario:** Check 2 story checkboxes on a live product page, select a module, click "Assign to module", wait for the response, confirm both rows now render under the new module's section (or the page reflects the new assignment) without a full navigation/reload.
- **Tooling:** Playwright, following this repo's existing `tests/e2e/*.spec.js` pattern.

---

## NFR Tests

None beyond the ACs above.

---

## Out of Scope for This Test Plan

- `handlePutEpicModule`'s single-item UI — separate story, not covered here.
- Live confirmation against real staging beyond the Playwright spec above.

---

## Test Gaps and Risks

None identified as blocking — AC3's E2E requirement is a real task, not a waived risk.
