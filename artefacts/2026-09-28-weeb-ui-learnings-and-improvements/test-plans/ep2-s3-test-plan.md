## Test Plan: Paginate the signals panel to handle real-world signal volume

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signal-seeding-improve-loop-closure.md
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-04

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js` (read directly from `package.json`'s own `scripts.test` entry — not assumed).

**Real architecture grounding (confirmed by direct code read, not assumed):**
- `handleGetSignalsPanelHtml(req, res)` (`src/web-ui/routes/signals-panel.js:20`) currently calls `getSignals(repoPath)`, then `renderSignalsPanel(signals, csrfToken)` directly — no pagination, no `req.query` read at all.
- `req.query` is populated by the router (`server.js:2047`, `parseQuery`) as a plain object of string values from the URL's search params — `req.query.page` will be a string (e.g. `"2"`) or `undefined` if absent, never an array or number.
- `renderSignalsPanel(signals, csrfToken)` (`src/web-ui/views/signals-panel-view.js:51`) is a pure function. Its existing empty-state branch (`if (!signals || signals.length === 0) return '<div class="sw-empty">...'`) must stay the first check — a paginated render with 0 real signals must still hit this branch, not a "page 1 of 1, 0–0 of 0" pagination bar.
- No existing pagination pattern exists anywhere else in this web UI (confirmed by the story's own repo-wide search, re-confirmed here) — closest analog is `dashboard-view.js`'s `(data.skills || []).slice(0, 6)` hard-cap pattern, cited in the story's own Architecture Constraints.

**E2E/browser-layout detection (Step 3a):** AC1–AC6 describe server-rendered DOM presence/text-content outcomes only (bounded item count, link presence/absence, URL/query-param behaviour, count/position text) — none depend on CSS layout, pointer coordinates, or `getBoundingClientRect`, and are fully jsdom-safe. **AC7 is CSS-layout-dependent** (sequential keyboard Tab-order / focus movement across multiple elements — jsdom cannot reproduce real sequential focus traversal, by direct analogy to `ep1-s3`'s and `ep2-s1`'s own established precedent for this exact class of AC). E2E tooling (Playwright) is already configured in this repo — **Option 1 (E2E browser test)** selected for AC7, not blocking.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Signals render in bounded pages, not all at once | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | Next/Previous navigation works and is bookmarkable | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Boundary pages are visually unambiguous | 2 tests | 1 test | — | — | — | 🟢 |
| AC4 | Invalid page parameters degrade gracefully | 3 tests | 1 test | — | — | — | 🟢 |
| AC5 | Total count and current position are visible | 1 test | 1 test | — | — | — | 🟢 |
| AC6 | `ep2-s1`'s own existing per-signal behaviour preserved within a page | 1 test | 2 tests | — | — | — | 🟢 |
| AC7 | Accessibility NFR verifiable against real data, not only a seeded fixture | — | — | 1 test | — | CSS-layout-dependent | 🟢 (E2E tooling already configured) |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest-equivalent (jsdom) | Handling |
|-----|----|----------|--------------------------|---------|
| Real sequential keyboard Tab-order across a rendered page | AC7 | CSS-layout-dependent | jsdom does not reproduce real sequential focus-movement across multiple elements (confirmed precedent: `ep1-s3`, `ep2-s1`) | Real Playwright E2E test — see E2E Tests section below. Not manual; tooling already configured. |

---

## Test Data Strategy

**Source:** Synthetic — real-shaped `Signal` fixture arrays of varying sizes (small, exactly-one-page, multi-page) for unit/integration tests; AC7's own E2E test deliberately uses this repo's own real, unmodified `getSignals()` output (no `/test/seed-signals` fixture seam) to prove the real production fix, not a test-side workaround — matching the story's own explicit intent.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An array of >`SIGNALS_PAGE_SIZE` synthetic signals | Synthetic | None | Confirms only the first page-worth renders |
| AC2 | Same array, requesting `page=2` | Synthetic | None | Confirms page-2 content and a real `?page=1`-targeting Previous link |
| AC3 | A 1-page array (boundary: no Next) and a multi-page array at page 1 (boundary: no Previous) | Synthetic | None | Two distinct boundary fixtures |
| AC4 | The same multi-page array, requested with `page=abc`, `page=0`, `page=-1`, `page=9999` | Synthetic | None | Confirms clamping, never an error response |
| AC5 | Any array with a known total count | Synthetic | None | Confirms the rendered count/range text is accurate |
| AC6 | A page-1 slice containing a real `parse-error`-type signal; a zero-signal array | Synthetic | None | Confirms `ep2-s1`'s own marker/empty-state logic is unaffected by the new pagination wrapper |
| AC7 | This repo's own real, unmodified `getSignals()` output — no fixture | Real workspace data | None | Deliberately NOT seeded — proves the real fix at real scale |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All unit tests target a new, pure pagination helper — `src/web-ui/utils/paginate-signals.js` (new module, matching `ep2-s2`'s own `signal-context.js` precedent: no I/O, no adapter calls, independently unit-testable) — exporting `paginateSignals(signals, rawPage)` and the `SIGNALS_PAGE_SIZE` constant.

### paginateSignals returns exactly SIGNALS_PAGE_SIZE items for page 1 when more signals exist than one page

- **Verifies:** AC1
- **Precondition:** An array of `SIGNALS_PAGE_SIZE + 10` synthetic signals
- **Action:** Call `paginateSignals(signals, undefined)` (no page param — defaults to page 1)
- **Expected result:** `result.pageSignals.length === SIGNALS_PAGE_SIZE`
- **Edge case:** No

### paginateSignals page 1 preserves the input array's own existing order, no re-sort

- **Verifies:** AC1
- **Precondition:** Same oversized array, with distinguishable `id` values in a known order
- **Action:** Call `paginateSignals(signals, 1)`
- **Expected result:** `result.pageSignals` is byte-for-byte the input array's own first `SIGNALS_PAGE_SIZE` entries, in the same order — not re-sorted by any field
- **Edge case:** No

### paginateSignals computes correct startIndex/endIndex and slice content for an arbitrary middle page

- **Verifies:** AC2
- **Precondition:** An array spanning 3 full pages
- **Action:** Call `paginateSignals(signals, 2)`
- **Expected result:** `result.pageSignals` equals the input's own items at index `[SIGNALS_PAGE_SIZE, SIGNALS_PAGE_SIZE*2)`; `result.currentPage === 2`
- **Edge case:** No

### paginateSignals reports hasPrevious=false, hasNext=true on page 1 of a multi-page result

- **Verifies:** AC3
- **Precondition:** A multi-page array, requesting page 1
- **Action:** Call `paginateSignals(signals, 1)`
- **Expected result:** `result.hasPrevious === false`, `result.hasNext === true`
- **Edge case:** Yes — the first-page boundary

### paginateSignals reports hasPrevious=true, hasNext=false on the real last page

- **Verifies:** AC3
- **Precondition:** The same multi-page array, requesting its own real last page number
- **Action:** Call `paginateSignals(signals, result.totalPages)` (computed from a first call, or a known fixture size)
- **Expected result:** `result.hasPrevious === true`, `result.hasNext === false`
- **Edge case:** Yes — the last-page boundary

### paginateSignals clamps a non-numeric page value to page 1

- **Verifies:** AC4
- **Precondition:** A multi-page array, `rawPage = "abc"`
- **Action:** Call `paginateSignals(signals, "abc")`
- **Expected result:** `result.currentPage === 1` — never throws, never returns `NaN`
- **Edge case:** Yes

### paginateSignals clamps a negative or zero page value to page 1

- **Verifies:** AC4
- **Precondition:** A multi-page array, `rawPage = "0"` and separately `rawPage = "-5"`
- **Action:** Call `paginateSignals(signals, "0")` and `paginateSignals(signals, "-5")`
- **Expected result:** Both calls return `result.currentPage === 1`
- **Edge case:** Yes

### paginateSignals clamps a page value beyond the real last page to the real last page

- **Verifies:** AC4
- **Precondition:** A multi-page array with a known `totalPages` (e.g. 3), `rawPage = "9999"`
- **Action:** Call `paginateSignals(signals, "9999")`
- **Expected result:** `result.currentPage === 3` (the real last page, not 9999) — `result.pageSignals` is the real last page's own content, not empty
- **Edge case:** Yes

### paginateSignals returns correct totalCount/totalPages for the position indicator

- **Verifies:** AC5
- **Precondition:** An array of a known, specific size (e.g. 134 signals, `SIGNALS_PAGE_SIZE = 50`)
- **Action:** Call `paginateSignals(signals, 2)`
- **Expected result:** `result.totalCount === 134`, `result.totalPages === 3`, `result.startIndex === 51` (1-indexed display value), `result.endIndex === 100`
- **Edge case:** No

### paginateSignals returns totalPages=1, hasPrevious=false, hasNext=false, pageSignals=[] for an empty input array

- **Verifies:** AC6 (edge case feeding the empty-state preservation requirement)
- **Precondition:** `signals = []`
- **Action:** Call `paginateSignals([], undefined)`
- **Expected result:** `result.totalCount === 0`, `result.totalPages === 1`, `result.pageSignals.length === 0`, `result.hasPrevious === false`, `result.hasNext === false` — never throws, never computes a negative or `NaN` page
- **Edge case:** Yes

---

## Integration Tests

### Real route dispatch: GET /signals with no page param renders only the first SIGNALS_PAGE_SIZE signals

- **Verifies:** AC1 (behavioural half)
- **Components involved:** `handleGetSignalsPanelHtml`, `paginateSignals`, `renderSignalsPanel` (extended to accept pagination metadata)
- **Precondition:** `setSignalsSource` (existing `ep2-s1` test seam) returns an array of `SIGNALS_PAGE_SIZE + 10` synthetic signals
- **Action:** Dispatch a real GET to `/signals` with no query string
- **Expected result:** Response is `200`; the rendered HTML contains exactly `SIGNALS_PAGE_SIZE` `.signal-item` occurrences, matching the first `SIGNALS_PAGE_SIZE` signals' own content

### Real route dispatch: GET /signals?page=2 renders page 2's own content with a real Previous link targeting page 1

- **Verifies:** AC2
- **Components involved:** Same as above
- **Precondition:** Same oversized fixture
- **Action:** Dispatch a real GET to `/signals?page=2`
- **Expected result:** Rendered HTML contains page 2's own distinguishable signal content (not page 1's); contains a real `<a href="/signals?page=1">`-style Previous link

### Real route dispatch: boundary pages render no Previous (page 1) / no Next (last page) link

- **Verifies:** AC3
- **Components involved:** Same as above
- **Precondition:** The oversized fixture
- **Action:** Dispatch GET `/signals` (page 1) and GET `/signals?page=<real-last-page>` separately
- **Expected result:** Page-1 response contains no "Previous" link markup; last-page response contains no "Next" link markup

### Real route dispatch: invalid page params never produce an error response

- **Verifies:** AC4
- **Components involved:** Same as above
- **Precondition:** The oversized fixture
- **Action:** Dispatch GET `/signals?page=abc`, `/signals?page=0`, `/signals?page=-1`, `/signals?page=9999` — four separate requests
- **Expected result:** All four return `200` with normal rendered content (clamped to page 1 or the real last page respectively) — never `400`/`500`, never a blank body

### Real route dispatch: position indicator shows the real total count and current range

- **Verifies:** AC5
- **Components involved:** Same as above
- **Precondition:** A fixture of a known specific size (not a round multiple of `SIGNALS_PAGE_SIZE`, to catch off-by-one errors)
- **Action:** Dispatch a real GET to `/signals?page=2`
- **Expected result:** Rendered HTML contains the real total count and the real current-page range (e.g. "51–100 of 134"), not a placeholder or an unbounded-list-era value

### Real route dispatch: a parse-error signal within a single paginated page still carries ep2-s1's own distinguishing marker

- **Verifies:** AC6
- **Components involved:** Same as above, reusing `ep2-s1`'s own `data-signal-type="parse-error"` convention
- **Precondition:** A page-1-sized fixture (≤ `SIGNALS_PAGE_SIZE` items) including one `parse-error`-type signal
- **Action:** Dispatch a real GET to `/signals`
- **Expected result:** The rendered page-1 HTML still contains `data-signal-type="parse-error"` on that item, and the parse-error-only inline styling still does not leak onto normal signals — identical assertion shape to `ep2-s1`'s own existing AC4 test, now exercised through the new pagination wrapper

### Real route dispatch: zero signals still renders ep2-s1's own empty state, not a pagination bar

- **Verifies:** AC6 (edge case)
- **Components involved:** Same as above
- **Precondition:** `setSignalsSource` returns `[]`
- **Action:** Dispatch a real GET to `/signals`
- **Expected result:** Rendered HTML contains "No signals yet" (the existing `ep2-s1` empty-state message) and contains no Previous/Next links, no "0 of 0" position text — the empty-state branch must short-circuit before any pagination-bar markup is considered

---

## E2E Tests

### AC7: Tab-order across a single real page of /signals completes within a reasonable timeout, using real unseeded data

- **Verifies:** AC7
- **Tool:** Playwright (already configured in this repo)
- **Precondition:** **No `/test/seed-signals` fixture call** — this test deliberately exercises this repo's own real, unmodified `getSignals()` output (the real 5,293+ signals, or whatever the real count is at test-run time), to prove the production fix at real scale rather than a test-side workaround. The webServer must boot without the `WIRE_SKILL_ADAPTERS`-equivalent fixture override `ep2-s1`'s own Accessibility test needed.
- **Action:** Navigate to `/signals` (page 1, no `page` param); Tab through every rendered CTA button and pagination control on that single bounded page.
- **Expected result:** The walk completes within the test's own configured timeout (the real point of this AC — `ep2-s1`'s own Task 5 test timed out attempting this across the full unbounded 5,293-signal list; this test must complete in normal time against a single, `SIGNALS_PAGE_SIZE`-bounded page of that same real data) — not a fixed numeric assertion beyond "did not time out," matching the qualitative-bar precision level `ep2-s1`'s own Accessibility NFR used (`NFR: signal list items and CTA buttons are keyboard-navigable`, no explicit millisecond threshold).
- **Edge case:** No — this is the AC's own primary scenario, not an edge case within it.

---

## NFR Tests

### Paginated render stays within the established <100ms budget

- **NFR addressed:** Performance
- **Measurement method:** Wall-clock render-time measurement of `renderSignalsPanel` given a full `SIGNALS_PAGE_SIZE`-sized page — matching `ep1-s3`'s and `ep2-s1`'s own established render-time NFR test precedent (server-side render time, not full browser navigation)
- **Pass threshold:** <100ms
- **Tool:** `node tests/check-ep2-s3-signals-pagination.js` — **this must be a real, dedicated `test()` call in the implemented test file, not merely named here and left unimplemented.** (Explicit callout per the lesson from `ep2-s2`'s own `/definition-of-done`: that story's test plan named a dedicated Performance NFR test with a tool reference, but no such test was ever actually written across any implementation task — confirmed only at DoD time by grep, and RISK-ACCEPTed after the fact. This plan names the exact test file and test name now, at test-plan time, specifically so `/subagent-execution` has no ambiguity about whether this test is optional.)

### Security — `page` query parameter is validated/clamped server-side before use

- **NFR addressed:** Security
- **Measurement method:** **No separate dedicated test is written for this NFR — it is satisfied by the AC4 unit and integration tests above** (non-numeric/negative/zero/beyond-range `page` values are clamped server-side before any array slicing occurs; never reach an unvalidated `Array.prototype.slice` call with attacker-influenced bounds). Stated explicitly here, rather than naming a separate unimplemented test file reference, to avoid repeating `ep2-s2`'s own DoD-time finding (a named-but-never-written NFR test).
- **Pass threshold:** 100% of malformed/out-of-range `page` values rejected-by-clamping before reaching the slice operation
- **Tool:** Covered by `node tests/check-ep2-s3-signals-pagination.js`'s own AC4 tests (see Unit Tests / Integration Tests above — cross-referenced, not a separate test)

---

## Out of Scope for This Test Plan

- Any test of operator-interactive sort/filter/dismissal behaviour — explicitly out of this story's own scope (deferred to Phase 5)
- Any test of `ep2-s1`'s own rendering logic beyond confirming it survives unchanged within a single paginated page — `ep2-s1`'s own test plan already covers that logic's correctness in full; this plan only confirms non-regression
- Any test of `ep2-s2`'s own seeding-bridge behaviour — orthogonal story, not touched by this diff
- Rewriting `ep2-s1`'s own existing Accessibility E2E test (its `/test/seed-signals` fixture seam) — explicitly out of this story's own scope per its own Out of Scope section (AC7 adds a new, additional test; it does not mandate modifying the already-shipped one)

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC7's own real-data E2E test depends on this repo's own actual, live signal count at test-run time (not a fixed fixture) — the exact Tab-stop count will drift over time as this repo's own workspace history grows | The test's purpose is specifically to prove the production fix holds at whatever the real, current scale is — a fixed fixture would defeat that purpose | Assert only that the walk completes within a reasonable timeout and that the Tab order reaches every CTA/pagination control present on the one real rendered page — never assert an exact Tab-stop count tied to a specific real signal total |
