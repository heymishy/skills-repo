## Test Plan: Type/source filter for the signals panel

**Story reference:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
**Epic reference:** artefacts/2026-10-04-signals-panel-triage-ux/epics/signals-panel-triage-controls.md
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read):**
- `handleGetSignalsPanelHtml` (`src/web-ui/routes/signals-panel.js:28-32`) currently: `getSignals()` → `paginateSignals(signals, rawPage)` → `renderSignalsPanel(pagination.pageSignals, csrfToken, pagination)`. The filter must insert between the first two calls.
- New pure module `src/web-ui/utils/filter-signals.js` (matching `paginate-signals.js`'s own precedent: no I/O, independently unit-testable), exporting `filterSignals(signals, { hideTypes, hideSources })`.
- Toggle controls render as plain `<a href="/signals?...">` links — matching `ep2-s3`'s own Previous/Next precedent and this app's zero-client-JS convention — so keyboard operability (AC5) is native link-focus behaviour, not a custom widget needing a real sequential-focus-order test.
- **Corrected at DoR (2026-10-04):** `hideType`/`hideSource` arrive as a single comma-separated string each, not a repeated query key — confirmed via direct read of `server.js`'s own `parseQuery` (last-wins on repeated keys, never an array) and a repo-wide grep confirming no route anywhere treats `req.query.*` as array-shaped. Added one dedicated integration test below for this real parsing behaviour.

**E2E/browser-layout detection (Step 3a):** No AC in this story depends on CSS layout, drag-drop, or pointer coordinates. AC5's "individually focusable and operable" is satisfied by plain `<a>` elements — a DOM-structure assertion, not a real browser Tab-order walk. No E2E test required.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Hiding a type removes matches from the full list | 2 tests | 2 tests | — | — | — | 🟢 |
| AC2 | Hiding a source behaves the same; filters combine | 1 test | 2 tests | — | — | — | 🟢 |
| AC3 | Filter state is visible and bookmarkable | — | 1 test | — | — | — | 🟢 |
| AC4 | Filtering to zero results shows a clear empty state | 1 test | 1 test | — | — | — | 🟢 |
| AC5 | Filter controls are keyboard-accessible | 1 test | — | — | — | — | 🟢 |
| AC6 | Unfiltered behaviour preserved (no regression) | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — real-shaped `Signal` fixture arrays with deliberately varied `type`/`source` combinations (matching the real observed value set documented in the story's own Architecture Constraints).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A multi-page array including several `parse-error` signals interleaved across pages | Synthetic | None | Confirms filtering happens before pagination, not per-page |
| AC2 | Same array, with signals from ≥2 distinct `source` values | Synthetic | None | |
| AC3 | Any filtered fixture | Synthetic | None | Confirms query-string round-trip |
| AC4 | A fixture where a combined filter matches zero signals | Synthetic | None | |
| AC5 | The rendered filter-control markup | Synthetic | None | |
| AC6 | `ep2-s1`/`ep2-s3`'s own existing fixtures, unfiltered | Synthetic | None | Regression check only |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### filterSignals removes all signals of a hidden type from the full array, not a page slice

- **Verifies:** AC1
- **Precondition:** An array of 120 synthetic signals, 15 of type `parse-error` scattered across what would be pages 1-3
- **Action:** Call `filterSignals(signals, { hideTypes: ['parse-error'], hideSources: [] })`
- **Expected result:** Returned array has `105` items; zero have `type === 'parse-error'`
- **Edge case:** No

### filterSignals is a no-op when hideTypes/hideSources are both empty

- **Verifies:** AC1 (baseline correctness underlying AC6)
- **Precondition:** Any fixture array
- **Action:** Call `filterSignals(signals, { hideTypes: [], hideSources: [] })`
- **Expected result:** Returned array is identical (same length, same order, same items) to the input
- **Edge case:** Yes

### filterSignals combines hideTypes and hideSources with AND-of-NOT semantics (hide if either matches)

- **Verifies:** AC2
- **Precondition:** A fixture with signals spanning `type ∈ {parse-error, gap}` and `source ∈ {capture-log, decisions}`
- **Action:** Call `filterSignals(signals, { hideTypes: ['parse-error'], hideSources: ['capture-log'] })`
- **Expected result:** Returned array excludes every signal that is EITHER `type === 'parse-error'` OR `source === 'capture-log'` — a signal matching both is excluded once, not duplicated-excluded or double-counted
- **Edge case:** Yes — overlapping match

### The rendered filter toggle controls are plain <a> elements with no tabindex override

- **Verifies:** AC5
- **Precondition:** Rendered filter-bar HTML for a fixture with ≥2 distinct types and ≥2 distinct sources
- **Action:** Inspect each toggle control's tag and attributes
- **Expected result:** Each is an `<a href="/signals?...">` element, no `tabindex` override — same native focusability as `ep2-s3`'s own Previous/Next links
- **Edge case:** No

---

## Integration Tests

### Real route dispatch: GET /signals?hideType=parse-error excludes parse-error from every page, total count drops

- **Verifies:** AC1 (behavioural half)
- **Components involved:** `handleGetSignalsPanelHtml`, `filterSignals`, `paginateSignals`, `renderSignalsPanel`
- **Precondition:** `setSignalsSource` returns 120 signals, 15 `parse-error`, spanning 3 pages
- **Action:** Dispatch GET `/signals?hideType=parse-error`
- **Expected result:** Response `200`; rendered position text reflects `105` total (not `120`); zero `data-signal-type="parse-error"` markers anywhere in the rendered page

### Real route dispatch: GET /signals?hideType=parse-error,decision hides both comma-separated values

- **Verifies:** AC1/AC2 (real query-parsing correctness, the corrected mechanism)
- **Components involved:** `handleGetSignalsPanelHtml`'s comma-split parsing, `filterSignals`
- **Precondition:** A fixture including signals of type `parse-error`, `decision`, and at least one other type
- **Action:** Dispatch GET `/signals?hideType=parse-error,decision`
- **Expected result:** Response `200`; zero signals of either `parse-error` or `decision` type appear on any page; signals of the third type still appear — proves the comma-split, not a repeated-key assumption, is what's actually implemented

### Real route dispatch: GET /signals?hideType=parse-error&hideSource=capture-log combines both filters

- **Verifies:** AC2
- **Components involved:** Same as above
- **Precondition:** Same fixture, mixed type/source combinations
- **Action:** Dispatch GET `/signals?hideType=parse-error&hideSource=capture-log`
- **Expected result:** Rendered total count equals the real count of signals matching NEITHER condition; no signal from either excluded group appears on any page

### Real route dispatch: applied filters are visible on the page and survive a reload of the same URL

- **Verifies:** AC3
- **Components involved:** Same as above
- **Precondition:** Any fixture
- **Action:** Dispatch GET `/signals?hideType=parse-error` twice (simulating reload)
- **Expected result:** Both responses are identical; both contain visible text naming the active filter (e.g. "Hiding: parse-error") — not a silent, invisible filter state

### Real route dispatch: a combined filter matching zero signals shows a distinct "no matches" empty state

- **Verifies:** AC4
- **Components involved:** Same as above
- **Precondition:** A fixture where `hideType=X&hideSource=Y` matches every signal
- **Action:** Dispatch GET `/signals?hideType=X&hideSource=Y`
- **Expected result:** Response `200`; rendered HTML contains a "no signals match the current filters" message (distinct string from `ep2-s1`'s own "No signals yet" empty state) and a visible "clear filters" link

### Real route dispatch: no filter params renders identically to pre-sptu-s2 behaviour

- **Verifies:** AC6
- **Components involved:** Same as above
- **Precondition:** `ep2-s3`'s own existing fixtures (oversized array, boundary-page array, zero-signal array)
- **Action:** Dispatch GET `/signals` and GET `/signals?page=2` with no filter params, reusing `ep2-s3`'s own existing test assertions
- **Expected result:** All of `ep2-s3`'s own existing AC1-AC7 assertions still pass unchanged

---

## NFR Tests

### Filtering the real ~5,340-signal array stays within the established <100ms budget

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock timing of `filterSignals` + `paginateSignals` called together on a 5,340-item synthetic array, matching `ep1-s3`/`ep2-s1`/`ep2-s3`'s own render-time NFR precedent
- **Pass threshold:** <100ms
- **Tool:** `node tests/check-sptu-s2-signals-filter.js` — a real, dedicated `test()` call, not merely named here (per the `ep2-s2` DoD lesson on named-but-unimplemented NFR tests)

### Security — hideType/hideSource values are validated against the real observed value set

- **NFR addressed:** Security
- **Measurement method:** No separate dedicated test — satisfied by a unit test asserting an unrecognized `hideType` value (not present in the real data) is ignored rather than causing an error or matching nothing unexpectedly
- **Pass threshold:** An unrecognized filter value never throws and never hides signals it has no real match for
- **Tool:** Covered by a dedicated unit test in `node tests/check-sptu-s2-signals-filter.js` (cross-referenced, not a separate file)

---

## Out of Scope for This Test Plan

- Full-text search, saved presets — not in this story's scope
- `sptu-s4`'s own dismiss-filter composition — tested in that story's own test plan, reusing this story's integration point

---

## Test Gaps and Risks

None.
