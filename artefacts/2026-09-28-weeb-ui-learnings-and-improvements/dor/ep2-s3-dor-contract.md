# Contract Proposal: Paginate the signals panel to handle real-world signal volume

**Story:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s3.md
**Date:** 2026-10-04

---

## What will be built

- New pure module `src/web-ui/utils/paginate-signals.js`, exporting `paginateSignals(signals, rawPage)` and the `SIGNALS_PAGE_SIZE` constant (set to 50). Pure function: no I/O, no adapter calls — slices the input array, computes `currentPage`/`totalPages`/`totalCount`/`startIndex`/`endIndex`/`hasPrevious`/`hasNext`, and clamps `rawPage` (string or `undefined`) to a valid integer range.
- `src/web-ui/routes/signals-panel.js`'s `handleGetSignalsPanelHtml` extended to read `req.query.page`, call `paginateSignals(signals, req.query.page)`, and pass the paginated slice plus pagination metadata to `renderSignalsPanel`.
- `src/web-ui/views/signals-panel-view.js`'s `renderSignalsPanel` extended to accept an optional 3rd `pagination` parameter. When present, renders Previous/Next links (`/signals?page=N`) and a count/position indicator. When `pagination` is omitted (as every one of `ep2-s1`'s own 7 existing test calls do), the function renders exactly as it does today — no pagination controls, no behavior change — the empty-state short-circuit and per-signal rendering logic are untouched.
- New test file `tests/check-ep2-s3-signals-pagination.js` (10 unit, 7 integration, 1 dedicated NFR-Performance test — all per the test plan).
- New Playwright E2E spec `tests/e2e/ep2-s3-signals-pagination.spec.js` (AC7, deliberately against real unseeded `getSignals()` data).

## What will NOT be built

- Any operator-interactive sort/filter/dismissal control — explicitly out of scope, deferred to Phase 5.
- Any change to `getSignals()`'s own ordering or aggregation logic — pagination slices the existing order as-is.
- A rewrite of `ep2-s1`'s own existing `/test/seed-signals`-based Accessibility E2E test — AC7 adds a new, additional test; it does not touch the existing one.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — bounded page, preserved order | `paginateSignals` unit tests (item count, order-preservation) + real route-dispatch integration test | unit, integration |
| AC2 — Next/Previous, bookmarkable | `paginateSignals` unit test (middle-page math) + real route-dispatch test confirming page-2 content and a real `?page=1` Previous link | unit, integration |
| AC3 — unambiguous boundaries | `paginateSignals` unit tests (`hasPrevious`/`hasNext` flags at both boundaries) + real route-dispatch test confirming absent link markup | unit, integration |
| AC4 — graceful invalid-page handling | `paginateSignals` unit tests (non-numeric, negative/zero, beyond-range) + real route-dispatch test confirming `200` (never an error) at all four invalid inputs | unit, integration |
| AC5 — total count/position visible | `paginateSignals` unit test (count/range math) + real route-dispatch test confirming the rendered text matches a known fixture size | unit, integration |
| AC6 — `ep2-s1`'s own behaviour preserved | Empty-array unit test (feeds the empty-state requirement) + two real route-dispatch tests (parse-error marker within a page; zero-signal empty state) — plus re-running `ep2-s1`'s own 11 existing tests unmodified | unit, integration |
| AC7 — real-data accessibility | Real Playwright E2E test, no fixture seeding, real `getSignals()` data, Tab-order walk across one bounded page | E2E |

## Assumptions

- `req.query.page` arrives as a plain string or `undefined` (confirmed via direct read of `server.js:2030-2036`'s `parseQuery` — never an array, never pre-parsed to a number).
- `renderSignalsPanel`'s 3rd parameter must be optional with a safe default (confirmed only one production caller exists, and `ep2-s1`'s own 7 existing test call sites all omit it — any design that makes it required would break those tests).
- `SIGNALS_PAGE_SIZE = 50` is a fixed constant, not operator-configurable, per the story's own Out of Scope section.
- No new npm dependency (discovery.md Constraints) — pagination math is trivial arithmetic, no library needed.

## Estimated touch points

**Files:** `src/web-ui/utils/paginate-signals.js` (new), `src/web-ui/routes/signals-panel.js` (modified), `src/web-ui/views/signals-panel-view.js` (modified), `tests/check-ep2-s3-signals-pagination.js` (new), `tests/e2e/ep2-s3-signals-pagination.spec.js` (new)
**Services:** none (no new adapter, no new npm dependency)
**APIs:** `GET /signals` (existing route, extended with an optional `?page=` query parameter — no new route)

---

## Contract Review

Cross-checked against the story's own 7 ACs and the test plan's AC Coverage table — every AC maps to a specific, named test approach matching exactly what the test plan already specifies. No mismatch found.

**Verdict:** ✅ PASSED — proposed implementation aligns with all ACs.
