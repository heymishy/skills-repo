## Test Plan: Feature picker: read pipeline-state.json and render feature list in modal

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
**Epic reference:** feature-mapping-and-delivery-view
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-09

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-09):**

- **Entry point:** the only concrete trigger for this story (`ep2-s3`'s own Delivery view does not exist yet) is a new "Map feature" button rendered per stage card in `handleGetJourneyCanvas` (`src/web-ui/routes/journeys.js`), alongside the existing "Edit stage" affordance and `ep1-s4`'s reorder controls (`sw-stage-card` markup, confirmed at `journeys.js:319-327`). The button opens the picker modal client-side — no new route, no round trip on click.
- **Reading `pipeline-state.json` (AC1, AC3):** the established local-read pattern in this codebase (`products.js:1550-1558`, used by `handleGetProductView`'s roadmap section) is `_repoRootAdapter.getRepoRoot(req)` (`src/web-ui/adapters/repo-root.js` — a plain function, not a D37 injectable; no throw-by-default stub, so no adapter-wiring AC applies) → `path.join(repoRoot, '.github', 'pipeline-state.json')` → `fs.readFileSync` wrapped in try/catch. **Critical deviation from that existing precedent:** `products.js`'s own convention silently falls back to `{ features: [] }` on any read/parse error — that is explicitly wrong for this story, since AC3 requires a distinct, visible error state ("Features could not be loaded...") rather than a silently-empty list that looks like "no features exist." The new handler must distinguish "read succeeded, zero features" from "read failed" and carry that distinction into the rendered modal markup.
- **Modal UI precedent:** `products.js`'s own GitHub repo-picker modal (`rpc-picker-search` input, `oninput="rpcFilterRepoPicker()"`, `<ul role="listbox" aria-label="...">` of `<li data-fullname="...">` items, an empty-state `<p id="rpc-picker-empty" role="status">` toggled by the same client-side filter function, confirmed at `products.js:1283-1292`) is the direct, reusable precedent for this story's filterable feature list: fully server-rendered at page-load time (all features embedded, satisfying "read at request time"), filtered entirely client-side via `oninput` with no further server round trip, matching ADR-029's "do not cache or duplicate" — nothing is cached, the full list re-reads fresh on every canvas page load.
- **AC4 (close without selecting):** this story introduces no save/mapping mechanism at all (`ep2-s2`'s own scope) — the picker's "Close" control and Escape-key handling are pure client-side visibility toggles. The test asserts there is no `fetch`/`POST` call anywhere in the modal's close path, by source-text shape check, since no save endpoint exists yet to accidentally call.
- **fs mocking convention:** monkey-patch `fs.readFileSync` directly (save the original, restore in `finally`), matching the existing precedent at `tests/check-ep1-s5-error-handling.js:159-171` for a different feature's own simulated file-read failure.

---

**E2E/browser-layout detection (Step 3a):** No AC matches any CSS-layout-dependent trigger pattern (no drag-and-drop, no pointer coordinates, no `getBoundingClientRect`, no visual-rendering assertion). AC2's "filter/search input is available" is a DOM-presence check, not a layout check. No E2E spec required, no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Feature picker modal displays features from `pipeline-state.json` (name + slug) when "Map feature" is clicked | 2 tests | — | — | — | — | 🟢 |
| AC2 | A filter/search input is present and client-side filters the rendered list | 1 test | — | — | — | — | 🟢 |
| AC3 | `pipeline-state.json` unreadable/unparseable → explicit error state shown, no crash | 2 tests | — | — | — | — | 🟢 |
| AC4 | Closing the modal without selecting creates no mapping, canvas unchanged | 1 test | — | — | — | — | 🟢 |
| (shape) | `handleGetJourneyCanvas` reads `pipeline-state.json` via `_repoRootAdapter.getRepoRoot(req)` and `fs.readFileSync`, not a hardcoded path | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. All ACs are fully unit-testable by calling `handleGetJourneyCanvas` directly with a mocked pool (reusing `makeCanvasMockPool` from `tests/check-ep1-s4-stage-reorder.js`) and a monkey-patched `fs.readFileSync`, then asserting on the rendered HTML.

---

## Test Data Strategy

**Source:** Synthetic — mocked `pipeline-state.json` content via a monkey-patched `fs.readFileSync`, matching `tests/check-ep1-s5-error-handling.js`'s own existing convention; mocked journey/stage rows via `makeCanvasMockPool`, matching `tests/check-ep1-s4-stage-reorder.js`'s own existing convention.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked `pipeline-state.json` JSON string with ≥2 `features[]` entries (`slug`, `name`) | Synthetic | None | Monkey-patch `fs.readFileSync` to return this JSON string only when called with a path ending in `pipeline-state.json` |
| AC2 | Same mocked feature list as AC1 | Synthetic | None | Assert a `<input ... oninput="...">` filter element and `data-slug`/`data-name` attributes exist on each rendered feature item, enabling client-side filtering |
| AC3 | `fs.readFileSync` monkey-patched to throw (simulating both "file not found" and a JSON parse failure separately) | Synthetic | None | Two tests: one with the patched function throwing `ENOENT`, one returning invalid JSON (triggering `JSON.parse` to throw) |
| AC4 | Mocked feature list (any) | Synthetic | None | Shape check: no `fetch(`/`POST` string anywhere in the modal's close-handling script |
| (shape) | Mocked feature list (any) | Synthetic | None | Source-text assertion on `handleGetJourneyCanvas` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Feature picker modal lists features from pipeline-state.json with name and slug

- **Verifies:** AC1
- **Precondition:** `fs.readFileSync` monkey-patched to return a JSON string with `features: [{ slug: 'feat-a', name: 'Feature A' }, { slug: 'feat-b', name: 'Feature B' }]` when called for `pipeline-state.json`
- **Action:** Call `handleGetJourneyCanvas` with a mocked pool (via `makeCanvasMockPool`) for an existing journey/stage
- **Expected result:** Rendered HTML contains the feature picker modal markup with both `Feature A` / `feat-a` and `Feature B` / `feat-b` present
- **Edge case:** No

### Feature picker modal renders correctly when pipeline-state.json has zero features

- **Verifies:** AC1
- **Precondition:** `fs.readFileSync` monkey-patched to return `{ "features": [] }`
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** Modal renders with an empty list state, distinct from the AC3 error state (no "could not be loaded" text present) — confirms the "zero features" and "read failed" cases are not conflated
- **Edge case:** Yes

### Feature picker modal includes a filter/search input wired to the rendered list

- **Verifies:** AC2
- **Precondition:** Mocked feature list with ≥2 entries
- **Action:** Call `handleGetJourneyCanvas`; inspect the modal markup
- **Expected result:** A text `<input>` with an `oninput` handler is present, and each feature list item carries a `data-slug`/`data-name` (or equivalent) attribute the filter function can match against
- **Edge case:** No

### Feature picker shows an explicit error state when pipeline-state.json cannot be found

- **Verifies:** AC3
- **Precondition:** `fs.readFileSync` monkey-patched to throw an `ENOENT`-style error for the `pipeline-state.json` path
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** Rendered HTML contains the exact text "Features could not be loaded. Check that pipeline-state.json exists." and the handler does not throw (canvas page still renders, no 500)
- **Edge case:** Yes

### Feature picker shows the same explicit error state when pipeline-state.json contains invalid JSON

- **Verifies:** AC3
- **Precondition:** `fs.readFileSync` monkey-patched to return a non-JSON string (e.g. `"{not valid json"`) for the `pipeline-state.json` path
- **Action:** Call `handleGetJourneyCanvas`
- **Expected result:** Same exact error text as the ENOENT case; `JSON.parse`'s thrown error is caught, not propagated
- **Edge case:** Yes

### Closing the picker without selecting a feature issues no write and leaves the canvas unchanged

- **Verifies:** AC4
- **Precondition:** Mocked feature list with ≥1 entry
- **Action:** Inspect the rendered modal's close-handling script source (the "Close" button's `onclick` and any Escape-key handler)
- **Expected result:** No `fetch(` or `POST` string appears in the close-handling code path — confirms closing is a pure client-side visibility toggle with no server call, so no mapping can be created by closing
- **Edge case:** Yes

### handleGetJourneyCanvas reads pipeline-state.json via the repo-root adapter, not a hardcoded path

- **Verifies:** (shape)
- **Action:** Read `handleGetJourneyCanvas`'s own source text
- **Expected result:** Contains a call to `_repoRootAdapter.getRepoRoot(req)` and joins its result with `.github/pipeline-state.json` — confirms ADR-029 compliance (local filesystem, per-tenant repo root) and that the path is not hardcoded to the platform's own repo
- **Edge case:** No

---

## Out of Scope for This Test Plan

- Saving a feature-to-stage mapping, metric key selection (`ep2-s2`'s own scope — no Postgres write exists yet for this story to test)
- Delivery view annotation rows (`ep2-s3`'s own scope)
- The GitHub-API-based `pipeline-state-fetch-adapter.js` path (used by the unrelated multi-repo fleet dashboard feature) — this story reads the local checkout only, per ADR-029 and the story's own explicit constraint

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All 4 ACs are fully coverable with existing mocking conventions already proven in this codebase (`fs.readFileSync` monkey-patch, `makeCanvasMockPool`) | — |
