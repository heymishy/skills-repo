## Test Plan: Session-origin indicator on the org kanban board

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s3-org-kanban-indicator.md
**Epic reference:** artefacts/2026-09-08-session-origin-badge/epics/session-origin-visibility.md
**Test plan author:** Copilot
**Date:** 2026-09-08

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js`. New file: `tests/check-sob-s3-org-kanban-integration.js`, registered in `scripts/run-all-tests.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fully session-backed card → indicator shown | — | 1 test | — | — | — | 🟢 |
| AC2 | Mixed card → indicator shown | — | 1 test | — | — | — | 🟢 |
| AC3 | Reuses sob-s1's `_getSessionOriginBulk` via `_enrichColumnsWithSessionOrigin`, no second bulk function | — | 1 test | — | — | — | 🟢 |
| AC4 | Bulk-read failure degrades gracefully | — | 1 test | — | — | — | 🟢 |
| AC5 | "No session" state is structurally unreachable on this surface today | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. `deriveSessionOrigin` itself is covered in `sob-s1-test-plan.md`; this story's tests cover only the new org-kanban call site and its reuse of sob-s1's bulk seam.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A kanban-column fixture (per `buildOrgKanbanColumns`'s existing shape) with a card whose journey is fully session-backed | Synthetic | None | |
| AC2 | Same shape, mixed session coverage | Synthetic | None | |
| AC3 | A spy on `_getSessionOriginBulk` (the same seam sob-s1 introduces, via `setGetSessionOriginBulk`) | Synthetic + injected spy | None | |
| AC4 | Same spy, configured to throw | Synthetic + injected spy | None | |
| AC5 | The real, unmodified `handleGetOrgKanban` source (source-level assertion, not fixture data) | Real source file | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None for this story — see Coverage gaps above.

---

## Integration Tests

### Org kanban card shows "fully session-backed" for a fully session-backed journey

- **Verifies:** AC1
- **Components involved:** `handleGetOrgKanban`, `_enrichColumnsWithSessionOrigin`, `deriveSessionOrigin` (reused), `kanban-view.js` rendering
- **Precondition:** A `buildOrgKanbanColumns`-shaped fixture with one card's journey fully session-backed
- **Action:** Render the org kanban board with this fixture
- **Expected result:** That card's rendered HTML contains the "fully-session-backed" indicator, same markup as sob-s1/sob-s2

### Org kanban card shows "mixed" for a partially session-backed journey

- **Verifies:** AC2
- **Components involved:** Same as above
- **Precondition:** Fixture card with mixed session coverage
- **Action:** Render org kanban
- **Expected result:** That card shows the "mixed" indicator

### `_enrichColumnsWithSessionOrigin` calls the same `_getSessionOriginBulk` seam sob-s1 introduced — no second bulk function exists

- **Verifies:** AC3
- **Components involved:** `_enrichColumnsWithSessionOrigin`, `_getSessionOriginBulk`
- **Precondition:** `setGetSessionOriginBulk` (sob-s1's own test seam) injects a call-counting spy
- **Action:** Render org kanban with multiple products/cards
- **Expected result:** The spy captures the call — proving `_enrichColumnsWithSessionOrigin` calls through the identical injectable seam sob-s1 built, not a second, independently-implemented one (a source-level `grep`-style assertion that only one `_getXBulk`/`setGetXBulk` pair exists for session-origin, mirroring the "Shared-mechanism proof via source assertion" pattern already used elsewhere in this codebase, is an acceptable alternative implementation if the spy-based approach proves awkward for the multi-product loop shape)

### Org kanban board renders successfully with no indicators when the bulk lookup fails

- **Verifies:** AC4
- **Components involved:** `handleGetOrgKanban`, `_enrichColumnsWithSessionOrigin`
- **Precondition:** `setGetSessionOriginBulk` injects a throwing function
- **Action:** Render the org kanban board
- **Expected result:** The board renders with HTTP 200 and complete HTML; no session-origin indicator appears on any card; no unhandled exception propagates — matches `_enrichColumnsWithArtefactCounts`'s existing AC5 precedent exactly

### `handleGetOrgKanban`'s query never returns a zero-journey row (source-level regression guard)

- **Verifies:** AC5
- **Components involved:** `handleGetOrgKanban`'s own source (`src/web-ui/routes/products.js`)
- **Precondition:** None — reads the real source file directly
- **Action:** Assert that `handleGetOrgKanban`'s function body contains no call to `mergeFeatureSources` (or any other taxonomy-merge helper) — i.e. its per-product query (`SELECT journey_id, feature_slug, ... FROM journeys WHERE product_id = $1 AND tenant_id = $2`) remains the sole source of card data
- **Expected result:** Assertion passes on current code; if it ever fails, that's a deliberate signal that org kanban's data model changed and the "no session" state may now be reachable here — the limitation documented in `design.md`/`decisions.md` should be revisited at that point, not silently left stale

---

## NFR Tests

### Reuses sob-s1's bulk seam, no second query mechanism (Performance)

- **NFR addressed:** Performance
- **Measurement method:** Same test as the AC3 integration test above
- **Pass threshold:** Zero new bulk-fetch functions introduced; the existing seam is reused
- **Tool:** `node scripts/run-all-tests.js`

### Text-equivalent on every indicator (Accessibility)

- **NFR addressed:** Accessibility
- **Measurement method:** Reuses sob-s1's unchanged indicator markup — implicitly covered by the AC1/AC2 integration tests, which assert on the full rendered element including its `title`/`aria-label`
- **Pass threshold:** Same as sob-s1
- **Tool:** `node scripts/run-all-tests.js`

---

## Out of Scope for This Test Plan

- `deriveSessionOrigin`'s own logic and the bulk seam's own implementation — covered by `sob-s1-test-plan.md`.
- Adding a taxonomy merge to `handleGetOrgKanban` so zero-journey features become visible here — explicitly out of scope for this story (see story's Out of Scope section and `decisions.md`).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real multi-product loop behaviour of `_enrichColumnsWithSessionOrigin` against a live Postgres `journeys` table | No local `DATABASE_URL` in the standard test run | Verified against real staging data post-merge, same pattern as sob-s1 |
