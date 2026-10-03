## Story: Paginate the signals panel to handle real-world signal volume
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signal-seeding-improve-loop-closure.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **the signals panel (`/signals`, from `ep2-s1`) to render a bounded number of signals per page, with real Previous/Next navigation, instead of attempting to render every real signal at once**,
So that **the page remains usable and keyboard/screen-reader accessible at this repo's own real data volume, not just at the small illustrative scale the panel was originally designed and tested against**.
## Benefit Linkage
Metric 3 — Self-improvement loop accessibility (benefit-metric.md): `ep2-s1` already contributes the "visibility half" of this metric's target, but a confirmed, real finding during `ep2-s1`'s own Task 5 (E2E Accessibility NFR test) showed the unpaginated page cannot actually be used end-to-end at this repo's real scale — a real keyboard/screen-reader user faces the identical sequential-focus-traversal problem the automated test hit. This story closes that gap so Metric 3's visibility contribution is genuinely, not just nominally, delivered.
## Architecture Constraints
**Real, measured scale (confirmed by direct code execution, not estimated):** this repo's own `getSignals()` (`src/web-ui/modules/signals-aggregator.js`) currently aggregates **5,293 real signals** from this repo's own workspace history (`dod-follow-up`: 3,732; `decisions`: 564; `capture-log`: 365; `pipeline-state`: 308; `learnings`: 160; and 9 smaller sources). This is the number that caused `ep2-s1`'s own Accessibility E2E test to time out walking Tab order across every real CTA — found and documented in `decisions.md`, 2026-10-01 entry, during `ep2-s1`'s own implementation.
**Pagination mechanism:** query-param-based, server-rendered (e.g. `GET /signals?page=2`), matching this app's own established zero-client-JS convention — no existing pagination pattern exists anywhere else in this web UI to follow exactly (confirmed by repo-wide search), but the closest analog is `dashboard-view.js`'s own `(data.skills || []).slice(0, 6)` hard-cap-with-separate-full-list-elsewhere pattern; this story's own pagination is the first real multi-page server-rendered list in this app. Page size: a fixed constant (not operator-configurable this story — see Out of Scope), named clearly in the route handler (e.g. `SIGNALS_PAGE_SIZE = 50`) so it is easy to find and tune later.
**Deliberately preserves `getSignals()`'s own existing natural order — does not introduce a new sort policy.** The epic's own Out of Scope explicitly defers "signal filtering, sorting, dismissal, or bulk actions" to Phase 5; this story reads that as covering *operator-interactive* sort/filter choices, not an internal pagination-chunking decision, but to avoid any ambiguity it makes no change to signal ordering at all — pagination simply slices `getSignals()`'s own existing output in its existing order, PAGE_SIZE at a time. A future Phase-5 story remains free to add real sorting/filtering on top of this.
**Extends, does not replace, `ep2-s1`'s own `src/web-ui/routes/signals-panel.js` and `src/web-ui/views/signals-panel-view.js`.** The existing empty-state, parse-error distinguishing marker, and per-signal CTA-form rendering (all already shipped by `ep2-s1`) must continue to work unchanged within a single page's worth of signals.
No new npm runtime dependencies (discovery.md Constraints).
## Dependencies
`ep2-s1` (signals panel) — merged and the story this one extends. Does not depend on `ep2-s2` (seeding bridge) — pagination is orthogonal to seeding; both stories independently extend `ep2-s1`'s own output.
## Acceptance Criteria

**AC1 — Signals render in bounded pages, not all at once:**
Given more than `SIGNALS_PAGE_SIZE` signals exist (a real, already-confirmed condition — this repo's own real count is 5,293),
When the operator loads `/signals` with no `page` parameter,
Then only the first `SIGNALS_PAGE_SIZE` signals render (page 1), in `getSignals()`'s own existing order — not the full real list, and not re-ordered.

**AC2 — Next/Previous navigation works and is bookmarkable:**
Given the operator is on a page with further pages before or after it,
When they click a "Next" or "Previous" link,
Then the adjacent page's own `SIGNALS_PAGE_SIZE` signals render, the URL reflects the real page number (e.g. `/signals?page=2`), and reloading that URL directly returns the same page.

**AC3 — Boundary pages are visually unambiguous:**
Given the operator is on page 1,
Then no "Previous" link renders.
Given the operator is on the last real page,
Then no "Next" link renders, and the page states that it is the last page (e.g. as part of the position indicator in AC5).

**AC4 — Invalid page parameters degrade gracefully:**
Given the operator requests an invalid `page` value (non-numeric, negative, zero, or a number beyond the real last page),
When the page is requested,
Then it clamps to the nearest valid page (1, or the real last page) and renders normally — never an error response, a blank page, or a confusing empty state with no explanation.

**AC5 — Total count and current position are visible:**
Given the operator is on any page,
Then the page states the real total signal count and the current page's range (e.g. "Signals 1–50 of 5,293"), so the real scale is transparent rather than hidden by the pagination itself.

**AC6 — ep2-s1's own existing per-signal behaviour is preserved within a page:**
Given a rendered page includes a `parse-error` signal, or the real total is smaller than one page (e.g. in a future, smaller-history deployment),
Then `ep2-s1`'s own existing distinguishing marker and empty-state handling still apply exactly as before — this story must not regress any of `ep2-s1`'s own 5 ACs.

**AC7 — The Accessibility NFR is verifiable against real data, not only a seeded fixture:**
Given `ep2-s1`'s own Accessibility E2E test had to seed a small fixture via a test-only `/test/seed-signals` endpoint specifically because pagination did not yet exist (documented in `ep2-s1`'s own Task 5 commit history),
When this story ships,
Then a Tab-order walk across a single real page of `/signals` (using this repo's own real, unmodified `getSignals()` data, no fixture seeding) completes within a reasonable E2E test timeout — demonstrating the real, production fix, not just a test-side workaround.
## Out of Scope
- User-interactive filtering, sorting, dismissal, or bulk actions — remains deferred to Phase 5 per the epic's own existing scope; this story paginates the existing default order only, introducing no new sort/filter capability
- Changing the default signal order (e.g. to recency-first) — explicitly not done here, to keep this story's own boundary unambiguous relative to the Phase-5 sorting deferral above
- Operator-configurable page size — a fixed constant for this story; revisit in Phase 5 if real usage shows a different size is needed
- Rewriting `ep2-s1`'s own existing Accessibility E2E test to remove its `/test/seed-signals` fixture seam now that real pagination exists — optional future polish, not required by this story (AC7 adds a new, additional real-data E2E assertion; it does not mandate modifying the existing, already-shipped one)
- Caching or performance optimization beyond what pagination itself provides — matches the epic's own existing Phase-5 deferral on this topic
## NFRs
- Performance: paginated render stays well within the established <100ms budget (trivially true at ≤`SIGNALS_PAGE_SIZE` items per render, down from the unbounded 5,293 `ep2-s1` discovered)
- Accessibility: Tab order within a single real page must be verifiable end-to-end against real (not fixture) data (AC7)
- No new attack surface: `page` query parameter is validated/clamped server-side before use (AC4); no new npm dependency
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
