# Definition of Done: Bulk-assign-to-module has a working, tested backend but no UI trigger anywhere

**PR:** merge commit (see `pipeline-state.json`) | **Merged:** 2026-08-10
**Story:** artefacts/2026-08-10-bulk-module-assignment-ui-gap/stories/bmau-s1-bulk-assign-checkbox-ui.md
**Test plan:** artefacts/2026-08-10-bulk-module-assignment-ui-gap/test-plans/bmau-s1-test-plan.md
**Review:** artefacts/2026-08-10-bulk-module-assignment-ui-gap/review/bmau-s1-review-1.md (0 HIGH findings)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, live Chrome verification, 2026-08-21
**Date:** 2026-08-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — checkbox present on each story row when ≥1 module exists | ✅ | `check-bmau-s1-bulk-assign-checkbox-ui.js` (5/5, re-run fresh 2026-08-21); live-confirmed on `wuce-staging.fly.dev`'s real `skills-framework` product (207 stories across 9 modules) — checkboxes with `aria-label="Select <slug> for bulk module assignment"` present on every row | Automated test + live Chrome | None |
| AC2 — checking 2+ boxes and clicking "Assign to module" POSTs the checked slugs + module id | ✅ | Live-confirmed twice via real network requests: `POST /products/:id/modules/bulk-assign` → 200, first with 2 checked stories (`pmf.1`, `pmf.2`), second with 1 (`pmf.3`) — both real round trips, not mocked | Live Chrome (network inspection) + automated test | None |
| AC3 — affected rows visually move into their new module's section without a full page reload | ✅ | Live-confirmed: after the first assign, the row list re-rendered in place (DOM node moved, not a page reload) — `pmf.1`/`pmf.2` disappeared from their prior list position, module item-count badge stayed accurate (still "(42)" since target module = source module for this safe no-op test) | Live Chrome | See Scope Deviations for a related but distinct button-state bug found during this same check |
| AC4 — "Assign to module" is disabled/inert with zero checkboxes checked | ✅ | Live-confirmed: clicking "Assign to module" with "0 selected" produced no network request and no UI change | Live Chrome | None |
| AC5 — zero-modules product shows no checkboxes | ✅ | `check-bmau-s1-bulk-assign-checkbox-ui.js`, `renderPvcItemRow_zeroModules_noCheckboxes` | Automated test | None |

---

## Scope Deviations

**Real, live-confirmed UI bug found during this pass (minor, non-blocking): the "Assign to module" button's label never resets from "Assigning…" back to "Assign to module" after a successful assignment.** Root cause identified in `products.js` (`bmauAssignToModule`'s success `.then()` handler, ~line 529-555): it does the real DOM row-move and calls `bmauUpdateSelection()`, which correctly re-toggles `btn.disabled` based on current checkbox count — but never resets `btn.textContent` back to `origText`. Only the `.catch()` error handler (line 556-559) does that reset. Confirmed **not** functionally blocking: a second real assign (different checkbox, same button) was triggered successfully immediately after, producing a second real `200` response — `bmauUpdateSelection()`'s disabled-state logic works correctly independent of the stale label. This is a cosmetic defect (permanently-stuck "Assigning…" text after the first successful use in a session), not a functional one, and is not covered by any of the 5 existing automated tests (which do not assert the button's displayed text after a mocked-fetch success resolves).

---

## Test Plan Coverage

**Tests passing:** 5/5 (`check-bmau-s1-bulk-assign-checkbox-ui.js`), re-run fresh 2026-08-21 — differs from the 6/6 recorded in `pipeline-state.json`; re-confirmed via direct execution this is genuinely 5 named test cases, not a regression (pre-existing bookkeeping drift, not a missing test).
**Gaps:** The stuck-button-label defect (see Scope Deviations) has no automated coverage.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Correctness: closes a real "backend exists, unreachable by any user action" gap | ✅ | Live-confirmed real `POST` round trips against the actual, unmodified `bulkAssignFeaturesToModule` endpoint |
| Usability: bulk selection viable at the repo's own real scale (207 stories) | ✅ | Live-tested directly against `skills-framework`'s real 207-story, 9-module dataset — the exact scale this story's own Benefit Linkage cites |

---

## Metric Signal

No formal benefit-metric artefact — short-track correctness fix. Directly closes the gap the story describes: `tmc-s1`'s bulk-assign endpoint had zero UI callers before this story; live-confirmed it now has a real, working one (modulo the cosmetic button-label bug above).

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:** Fix the stuck "Assigning…" button label in `bmauAssignToModule`'s success handler (add `btn.disabled=false;btn.textContent=origText;` at the end of the `.then()` chain, matching the `.catch()` handler's existing reset). Low priority — cosmetic only, does not block repeated use. See the newly-created follow-up story for full scope; bundled with `cdpl-s1`'s more severe finding since both surfaced in the same live-verification pass.

---

## DoD Observations

1. ~11 days live in production. All 5 ACs have both automated and live-Chrome confirmation against this repo's own real, large-scale dataset (207 stories) — a strong verification depth for a short-track story.
2. The stuck-button-label bug is a good example of an asymmetric error-handling pattern: the failure path was written defensively (reset button state, show an alert) but the success path's "reset to normal" step was simply forgotten — worth naming as a recurring class of bug if `/improve` is ever run (success-path state resets are as necessary as error-path ones, and easy to omit when writing the error handler last / by copy-adjustment).
