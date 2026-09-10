## Test Plan: No-product, CLI-authored features are reachable within one click from the /dashboard landing page

**Story reference:** artefacts/2026-08-31-web-ui-navigation-legibility/stories/wnl-s3-dashboard-no-product-discoverability.md
**Epic reference:** artefacts/2026-08-31-web-ui-navigation-legibility/epics/web-ui-navigation-legibility.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-09-10

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Entry point appears when a Postgres no-product journey exists | — | 1 test | — | — | — | 🟢 |
| AC2 | Entry point appears for a CLI-only, not-yet-backfilled feature (zero Postgres rows) | — | 1 test | — | — | — | 🟢 |
| AC3 | Entry point links to `/journey`'s existing no-product list | — | 1 test | — | — | — | 🟢 |
| AC4 | No entry point when there's genuinely no no-product work | — | 1 test | — | — | — | 🟢 |
| AC5 | Existing product cards unaffected (regression guard) | — | 1 test | — | — | — | 🟢 |
| AC6 | Sidebar's own existing "No product" link unaffected (regression guard) | — | 1 test | — | — | — | 🟢 |

None of this story's ACs trigger Step 3a's `CSS-layout-dependent` patterns — every AC is about whether a link/element is present in the rendered HTML body and where it points, not about on-screen position, scroll, or pointer coordinates. Testable via the same raw-HTML-string/mocked-pool assertion convention already used by the pre-existing `tests/check-pan-s1-product-aware-navigation.js` and `tests/check-bvnd-s1-board-view-products-nav.js` (both confirmed by reading them directly before writing this plan). No E2E tooling gap, none needed.

---

## Coverage gaps

None. All 6 ACs have a real automated integration test.

---

## Test Data Strategy

**Source:** Mixed — Postgres interactions mocked via this repo's existing injectable pool pattern (`setValidateRepositoryAccess`/`setFetchPipelineState`-style seams already established in `feature-list.js`/`products.js`; `getProductsNavSummary` takes a `pool` directly, mockable with a stub `{ query: async () => ({ rows: [...] }) }`), `pipeline-state.json` reads via a temporary fixture directory (same `fs.mkdtempSync` pattern `daga-s1`'s own test plan used this session).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked `pool.query` returning ≥1 row for the no-product-journeys query | Stub pool object | None | |
| AC2 | An empty Postgres no-product result, plus a temp-dir `pipeline-state.json` fixture with ≥1 non-terminal feature whose slug has no matching journey-store record | Stub pool + `fs.mkdtempSync` fixture dir | None | The exact `jasb-s1`/`web-ui-navigation-legibility` scenario this story exists to fix — must be reproduced precisely, not approximated |
| AC3 | Either of the above | Same as AC1/AC2 | None | |
| AC4 | Empty Postgres result AND no unmatched pipeline-state features | Stub pool + empty/matching-only fixture | None | |
| AC5 | A mocked pool returning ≥1 real product row | Stub pool | None | |
| AC6 | Same as AC1, checked via the sidebar-rendering path (`renderShellWithNav`/`renderProductsSection`) rather than the dashboard body | Stub pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — this story's logic (deciding whether to show the entry point) is a small, dashboard-route-integrated computation, not an isolable pure function distinct from what the integration tests below already cover directly. If implementation extracts a genuinely standalone helper (e.g. `hasAnyNoProductWork(pool, tenantId, repoRoot)`), add a unit test for it at that time — not prescribed here since the story's own Architecture Constraints leave the exact extraction shape open (see Complexity Rating's own note on the `repoRoot`-vs-`pool` signature reconciliation).

---

## Integration Tests

New file: `tests/check-wnl-s3-dashboard-no-product-entry.js`.

### entry-point-shown-for-postgres-no-product-journey

- **Verifies:** AC1
- **Components involved:** `handleGetDashboard`, `getProductsNavSummary` (`src/web-ui/routes/products.js`).
- **Precondition:** Mocked `pool.query` returns 1 row for the `journeys WHERE product_id IS NULL` query, 0 products.
- **Action:** Call `handleGetDashboard` with the mocked pool; inspect the returned HTML body.
- **Expected result:** A no-product entry point (link) is present in the body, distinct from the product-cards section.

### entry-point-shown-for-cli-only-unbackfilled-feature

- **Verifies:** AC2 (the story's own primary root-cause fix)
- **Components involved:** `handleGetDashboard`, and whichever function is used to reuse `_mergeStateFeaturesIntoJourneyList`'s logic (`journey.js`) or an extracted equivalent.
- **Precondition:** Mocked `pool.query` returns 0 rows for the no-product-journeys query (Postgres says zero). A temp `pipeline-state.json` fixture (via `fs.mkdtempSync`) contains 1 non-terminal feature whose slug has no corresponding journey-store record.
- **Action:** Call `handleGetDashboard` with the mocked pool and the fixture `repoRoot`; inspect the returned HTML body.
- **Expected result:** The no-product entry point is still present — **this is the test that would have caught the exact bug this story fixes**: a naive Postgres-only implementation fails this test (shows nothing), confirming the fix genuinely reuses the canonical CLI-feature-aware logic rather than just the SQL count.

### entry-point-links-to-existing-journey-no-product-list

- **Verifies:** AC3
- **Components involved:** `handleGetDashboard`.
- **Precondition:** Either AC1 or AC2's fixture (entry point present).
- **Action:** Extract the entry point's `href` attribute.
- **Expected result:** `href="/journey"` (or the exact existing sidebar-link destination) — not a new route.

### no-entry-point-when-genuinely-empty

- **Verifies:** AC4
- **Components involved:** `handleGetDashboard`.
- **Precondition:** Mocked pool returns 0 no-product rows; fixture `pipeline-state.json` has 0 features, or every feature already has a matching journey-store record.
- **Action:** Call `handleGetDashboard`; inspect the body.
- **Expected result:** No no-product entry point present in the body.

### existing-product-cards-unaffected

- **Verifies:** AC5 (regression guard)
- **Components involved:** `_renderProductDashboard`.
- **Precondition:** Mocked pool returns ≥2 real product rows with `journeyCount`/`lastUpdated` values.
- **Action:** Call `handleGetDashboard`; inspect the body.
- **Expected result:** Each product card's name, feature count, last-updated date, and `href="/products/:id"` link render byte-identically to the pre-existing `_renderProductDashboard` output for the same input (diff against the function's own current, unmodified output for the same fixture).

### sidebar-no-product-link-unaffected

- **Verifies:** AC6 (regression guard)
- **Components involved:** `renderShellWithNav`/`renderProductsSection` (`html-shell.js`).
- **Precondition:** Same fixture as AC1.
- **Action:** Call `handleGetDashboard`; inspect the sidebar-rendering portion of the output (the `products`/`noProductJourneyCount` values passed into `renderShell`).
- **Expected result:** The sidebar's own "No product" link and count are present and unchanged from today's existing behaviour — confirms this story adds a second path to the same destination without touching the first.

---

## NFR Tests

### dashboard-load-no-material-timing-regression

- **NFR addressed:** Performance
- **Measurement method:** Rough before/after timing check (per the story's own NFR section) — not a formal load test; wrap the relevant portion of `handleGetDashboard` in a timer during manual verification and compare against a baseline capture taken before this story's change.
- **Pass threshold:** No user-perceptible regression (qualitative, per the story's own explicitly-acknowledged NFR gap — see `nfr-profile.md`'s Gaps table).
- **Tool:** Manual timing during the AC verification script's own walkthrough, not an automated test.

---

## Out of Scope for This Test Plan

- Fixing or testing the sidebar's own `noProductJourneyCount` undercount — explicitly out of scope for the story itself (see Out of Scope section); AC6 only confirms the *existing* sidebar behaviour is unchanged, not that it's correct.
- A formal, automated performance/load test — the story's own NFR section already accepts a rough manual check as sufficient given this repo has no formal performance SLO elsewhere.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Dashboard-load timing check is manual, not automated | Matches this repo's own existing practice — no formal performance SLO or load-testing tool configured anywhere else in this codebase | Acceptable per NFR profile's own explicit gap acknowledgement; revisit if a real slowdown is reported post-ship |
