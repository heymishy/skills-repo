## Test Plan: Restructure the Delivery view from a per-stage card stack into a swimlane grid

**Story reference:** artefacts/2026-10-14-journey-authoring-experience/stories/jae-s5.md
**Epic reference:** artefacts/2026-10-14-journey-authoring-experience/epics/journey-authoring-delivery-view-grid.md
**Review reference:** artefacts/2026-10-14-journey-authoring-experience/review/jae-s5-review-2.md (PASS, run 2)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-10-15
**Test runner:** `node scripts/run-all-tests.js` (unit/integration); `npx playwright test` (E2E, ADR-018 — not in the `npm test` chain)

---

## Note on AC8 (E2E classification corrected from the story's own first draft)

AC8 is CSS-layout-dependent (column order, cell alignment, pinned-label horizontal scroll). Playwright is already configured (ADR-018) and `tests/e2e/jcx-s6-swimlane-grid.spec.js` already covers the structurally identical behaviour for the grid this story reuses — so this plan writes a real E2E test (`tests/e2e/jae-s5-delivery-swimlane-grid.spec.js`, modelled directly on that file) rather than treating AC8 as a RISK-ACCEPT. See the story's own AC8 note for the correction record.

---

## Note on the ADR-028 refactor safety check

This story refactors `buildCustomerExperienceSwimlaneGrid` (already-shipped, already-tested) to extract a canonical `buildSwimlaneGridShell` builder. Two safety nets, both mandatory, neither a story AC in its own right (they protect existing behaviour, not new behaviour):

1. **Pre-flight regression run:** `check-jcx-s6-swimlane-grid.js` (the CX grid's own existing unit suite) must pass unchanged, run BEFORE any Delivery-specific code is written — confirms the extraction is behaviour-preserving in isolation.
2. **Shared-mechanism source assertion** (Integration test below, matching the Approved Pattern already named in `architecture-guardrails.md`: *"Shared-mechanism proof via source assertion"*): a test asserting both `buildCustomerExperienceSwimlaneGrid` and the new `buildDeliverySwimlaneGrid` call the exact same exported `buildSwimlaneGridShell` function — proving ADR-028 compliance structurally, not just by reading the diff.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | One column per stage; header + 2 data rows share one `grid-template-columns` | 1 test | — | 1 test (alignment) | — | CSS-layout-dependent (alignment only) | 🟡 |
| AC2 | Zero-mapping stage shows the existing empty-state text, muted-empty cell styling | 1 test | — | — | — | — | 🟢 |
| AC3 | Map feature button reachable and wired identically inside the grid cell | 1 test | — | — | — | — | 🟢 |
| AC4 | Add placeholder form reachable and wired identically inside the grid cell | 1 test | — | — | — | — | 🟢 |
| AC5 | Reorder buttons render in the header cell; success reloads, failure shows the error banner (mechanism corrected at `/implementation-plan`) | 2 tests | — | — | — | — | 🟢 |
| AC6 | 0-stage journey shows the existing empty-state fallback, not an empty grid shell | 1 test | — | — | — | — | 🟢 |
| AC7 | One shared visually-hidden accessible list covers every stage | 1 test | — | — | — | — | 🟢 |
| AC8 | Column order, cell alignment, pinned-label horizontal scroll | — | — | 1 test | — | CSS-layout-dependent | 🟡 |
| ADR-028 compliance (not a story AC) | Both grids call the same canonical shell builder | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

No gaps. AC1's and AC8's CSS-layout-dependent portions are both covered by real Playwright E2E tests (tooling already configured, ADR-018) — not RISK-ACCEPTed.

---

## Test Data Strategy

**Source:** Synthetic — mocked route req/res and mocked Postgres pool for unit/integration tests (reusing `check-jcx-s6-swimlane-grid.js`'s own `stageRow`/`makeCanvasMockPool`/`withMockedPipelineState`/`renderCanvas` helpers unchanged); real seeded journeys via `seedJourneyWithStages` against a real local Postgres for E2E tests (reusing `tests/e2e/jcx-s6-swimlane-grid.spec.js`'s own fixture, same as every other `tests/e2e/*.spec.js` in this repo).
**PCI/sensitivity in scope:** No
**Availability:** Available now — no new fixtures or environment setup required.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 (unit) | 3 stages, no mappings | `stageRow` fixtures | None | Confirms the header row and both data rows share the identical `grid-template-columns` string |
| AC1 (E2E) | 3 named stages via `seedJourneyWithStages` | Real seeded journey | None | Confirms real on-screen left-to-right column order, mirroring `jcx-s6`'s own AC1 E2E test |
| AC2 | 1 stage, `mappingsByStage[stageId] = []` | Synthetic | None | |
| AC3 | 1 stage with one normal mapping | Synthetic | None | Asserts markup/wiring only — the mapping flow itself is already covered by `check-ep2-s2-feature-mapping-save.js` |
| AC4 | 1 stage, no mappings (placeholder form always present) | Synthetic | None | Asserts markup/wiring only — the placeholder flow itself is already covered by `check-jcx-s1-placeholder-feature.js`/`check-jcx-s2-placeholder-conversion.js` |
| AC5 | 2+ stages (reorder buttons only render when `stages.length > 1`) | Synthetic | None | Asserts markup/wiring only — the reorder endpoint itself is unchanged and already covered elsewhere |
| AC6 | 0 stages | Synthetic | None | |
| AC7 | 2 stages, mixed health states (one covered, one not) | Synthetic | None | |
| AC8 | 8 named stages via `seedJourneyWithStages`, 1280×800 viewport | Real seeded journey | None | Mirrors `jcx-s6`'s own AC7 E2E test exactly |
| ADR-028 compliance | None — source-level `require` + reference-identity check | Real module | None | No mocking; reads the actual exported functions |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): header and data rows share one `grid-template-columns`

- **Verifies:** AC1
- **Precondition:** 3 stages, no mappings, Delivery view selected
- **Action:** Render the canvas (`handleGetJourneyCanvas`), extract the Delivery grid markup
- **Expected result:** The header row, the "Coverage status" row, and the "Mapped features" row each have a `style="grid-template-columns:repeat(3, minmax(200px, 1fr))"` cell-wrapper with the identical string — not independently computed per row
- **Edge case:** No

### AC2 (unit): zero-mapping stage shows the existing empty state

- **Verifies:** AC2
- **Precondition:** 1 stage, `mappingsByStage['s1'] = []`
- **Action:** Render the Delivery grid
- **Expected result:** The Mapped features cell for that stage contains the exact text "No features mapped" (byte-identical to `buildDeliveryAnnotations`'s own existing output) inside a muted empty-state class
- **Edge case:** No

### AC3 (unit): Map feature button is reachable and identically wired inside the grid cell

- **Verifies:** AC3
- **Precondition:** 1 stage with one normal (non-placeholder, resolved) mapping
- **Action:** Render the Delivery grid
- **Expected result:** A `<button class="sw-stage-map-feature" data-stage-id="s1">Map feature</button>` is present inside that stage's Mapped features cell — same class and data attribute as today's card-stack markup, so the existing document-delegated `fpOpen` handler finds it unchanged
- **Edge case:** No

### AC4 (unit): Add placeholder form is reachable and identically wired inside the grid cell

- **Verifies:** AC4
- **Precondition:** 1 stage, no mappings
- **Action:** Render the Delivery grid
- **Expected result:** A `<button class="sw-stage-add-placeholder" data-stage-id="s1">Add placeholder</button>` and its sibling `.sw-placeholder-add-form[data-stage-id="s1"]` are both present inside that stage's Mapped features cell, same classes/attributes as today
- **Edge case:** No

### AC5 (unit): reorder buttons render in the header cell, unchanged wiring

- **Verifies:** AC5
- **Precondition:** 2 stages
- **Action:** Render the Delivery grid
- **Expected result:** Each header cell contains `.sw-stage-reorder-controls` with its existing up/down `<button data-stage-id data-direction aria-label>` markup, byte-identical to today's card-stack version; the first stage's "up" button and the last stage's "down" button are `disabled`
- **Edge case:** Yes — single-stage case (no reorder controls render at all, matching today's `stages.length > 1` guard)

### AC5 (unit, added at `/implementation-plan` — corrects the reorder mechanism, `decisions.md` 2026-10-15): reorder success reloads, failure does not

- **Verifies:** AC5's corrected behaviour (reload-on-success, not in-place DOM move)
- **Precondition:** Rendered canvas HTML (source text, not executed in a browser)
- **Action:** Extract the client `<script>` block's own reorder-submit handler
- **Expected result:** The success branch of the reorder PATCH's `.then(...)` calls `window.location.reload()`; it does NOT call `reorderDom`/`list.appendChild` for the Delivery grid's own stage columns (that mechanism is removed, not merely unused). The failure branch's `.catch(...)` still shows `sw-stage-reorder-error` and does NOT call `window.location.reload()`
- **Edge case:** Yes — the failure path is the edge case, asserted in the same test

### AC6 (unit): 0-stage journey shows the existing empty-state fallback

- **Verifies:** AC6
- **Precondition:** 0 stages
- **Action:** Render the Delivery grid
- **Expected result:** The exact text "No stages yet. Add your first stage." renders; no grid shell (no `.sw-delivery-grid-row` elements) is present
- **Edge case:** No

### AC7 (unit): one shared accessible list covers every stage

- **Verifies:** AC7
- **Precondition:** 2 stages, one `covered`, one `no-coverage`, one with a mapped feature and one without
- **Action:** Render the Delivery grid
- **Expected result:** A single `sw-delivery-a11y-list` (class `sw-visually-hidden`) `<ul>` exists with exactly 2 `<li>` entries, each naming its stage, coverage status, and mapped-feature summary in document order
- **Edge case:** No

---

## Integration Tests

### ADR-028 compliance (integration): both grids call the same canonical shell builder

- **Verifies:** Architecture Constraints (not a story AC) — the ADR-028 requirement this story's `/review` run 1 finding 1-H2 was raised and resolved against
- **Precondition:** Real `require('../src/web-ui/routes/journeys')` with its internal functions exposed for testing (matching this file's own existing pattern of testing internal render functions via `handleGetJourneyCanvas`'s output, or a dedicated test-only export if internals are not otherwise reachable)
- **Action:** Render a Delivery-view canvas and a Customer-experience-view canvas for the same stage data; inspect each grid's own rendered `grid-template-columns` computation path
- **Expected result:** Both grids' header rows and data rows use the identical `gridTemplateColumns` formula output for the same stage count (same string, independently computed per grid would still coincidentally match on value — so this test additionally asserts, via a source-level check of `journeys.js`, that only one function in the file computes `'repeat(' + n + ', minmax(200px, 1fr))'`, not two separately-written copies) — matching `architecture-guardrails.md`'s own named "Shared-mechanism proof via source assertion" pattern
- **Edge case:** No

---

## NFR Tests

### Performance — no new query; confirmed by code read, not a dedicated test

- **NFR addressed:** Performance
- **Measurement method:** Code review confirms `buildDeliverySwimlaneGrid` takes the same already-loaded `stages`/`mappingsByStage`/`featuresBySlug` arguments `buildDeliveryAnnotations` and the old card-stack loop already received — no new query added
- **Pass threshold:** Zero new `pool.query` call sites introduced by this story
- **Tool:** Manual code read at DoR / implementation review

### Security — no new input surface; confirmed by code read

- **NFR addressed:** Security
- **Measurement method:** Code review confirms no new route, no new request parameter, no new database query shape
- **Pass threshold:** Zero new route handlers or query strings introduced by this story
- **Tool:** Manual code read at DoR / implementation review

---

## Gap table

No gaps.
