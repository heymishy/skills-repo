## Story: Bulk-assign-to-module has a working, tested backend but no UI trigger anywhere

**Epic reference:** None — short-track (missing-UI gap, found via source tracing + live confirmation on the operator's real `skills-framework` product page)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **product owner organizing many stories into architectural modules**,
I want **to select several stories at once and assign them all to a module in one action**,
So that **I don't have to classify 100+ stories one at a time via a direct API call — the only way this is currently possible**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — `tmc-s1` (taxonomy-module-classification) shipped `POST /products/:id/modules/bulk-assign` (`bulkAssignFeaturesToModule`, `products.js:2364`), well-tested and correct, but no client-side caller exists anywhere in the codebase. Confirmed live on 2026-08-10: `skills-framework`'s real module-grouped story list (624 rows across ~15 modules) has zero checkboxes, zero multi-select affordance, and zero "assign to module" control on any row. The only way this endpoint has ever been invoked in this repo's own history is a direct script/API call (used to classify skills-framework's own 160 real features). A real product owner with a large story list has no way, by clicking anything, to do what this endpoint already does correctly.

**How:** A related, smaller gap in the same area: `handlePutEpicModule` (`products.js:2313`, reassign a single epic/journey to a different module) is ALSO unreachable — no single-item "change module" control exists either, so even the smaller, non-bulk case has no UI path.

## Architecture Constraints

- **Reuse the existing `POST /products/:id/modules/bulk-assign` endpoint as-is** — this story adds the UI trigger; it does not change the endpoint's contract or request shape.
- **Checkbox affordance lives on `_renderPvcItemRow`'s existing `<li>` row** (`products.js:298`) — add a checkbox input to each row (only when at least one module exists on the product, matching `_renderConsolidatedFeaturesSection`'s existing zero-modules fallback convention), plus a "Assign selected to module" control that appears once ≥1 item is checked.
- **Client-side selection state is vanilla JS**, matching this repo's existing pattern for the health/search filter chips already present in the same section (`pvc-s1`) — no new framework/dependency.

## Dependencies

- **Upstream:** `tmc-s1` (shipped, `dodStatus: complete`) — this story is a UI-completion follow-up, not new backend design.
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a product with ≥1 module and ≥1 story in the module-grouped view, When the operator views a story row, Then a checkbox is present on that row.

**AC2:** Given the operator checks 2+ story checkboxes, When they select a target module from a dropdown and click "Assign to module", Then `POST /products/:id/modules/bulk-assign` is called with exactly the checked story slugs and the selected module id.

**AC3:** Given the bulk-assign call succeeds, When the response returns, Then the affected rows visually move into (or re-render under) their new module's section without a full page reload requirement.

**AC4:** Given zero checkboxes are checked, When the operator looks for the "Assign to module" control, Then it is disabled or hidden — it cannot be triggered with an empty selection.

**AC5:** Given a product with zero modules, When the module-grouped view renders, Then no checkboxes appear (matching the existing zero-modules simple-fallback rendering — this story does not change that path).

## Out of Scope

- **`handlePutEpicModule`'s single-item UI** — named as a related gap in Benefit Linkage but not built in this story; a natural fast-follow, not bundled here to keep this story bounded.
- **Any change to `bulkAssignFeaturesToModule`'s backend contract** — reused as-is.
- **Drag-and-drop assignment** — checkbox + dropdown only, matching the story's minimal-viable framing.

## NFRs

- **Correctness:** Closes a real "backend exists, unreachable by any user action" gap on a well-tested endpoint that has, until now, only ever been invoked by a one-off script.
- **Usability:** At 100+ stories (this repo's own real scale), a per-item-only assignment path is not viable — bulk selection is the point of the fix, not a nice-to-have.

## Complexity Rating

**Rating:** 2 — the backend is proven and unchanged; the UI work (checkbox state, selection bar, re-render on success) is bounded but touches client-side JS in a section that already has some (the existing filter chips), requiring care not to conflict with that existing behaviour.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
