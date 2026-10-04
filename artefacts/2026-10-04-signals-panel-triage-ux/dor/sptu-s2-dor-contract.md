# Contract Proposal: Type/source filter for the signals panel

**Story:** artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
**Date:** 2026-10-04

---

## What will be built

- New pure module `src/web-ui/utils/filter-signals.js`, exporting `filterSignals(signals, { hideTypes, hideSources })` — no I/O, matching `paginate-signals.js`'s own precedent.
- `handleGetSignalsPanelHtml` extended to read `req.query.hideType`/`req.query.hideSource` (each a single comma-separated string, **corrected at DoR** from an originally-assumed repeated-key design — see `decisions.md`, 2026-10-04 correction entry), split on `,`, and call `filterSignals` on the real `signals` array *before* `paginateSignals`.
- `renderSignalsPanel`/`signals-panel-view.js` extended with a filter-toggle bar (plain `<a>` links, matching `ep2-s3`'s Previous/Next precedent) and a distinct "no signals match the current filters" empty state.
- New test file `tests/check-sptu-s2-signals-filter.js` (12 tests per the corrected test plan).

## What will NOT be built

- Full-text search, saved filter presets, or a "show only X" shortcut — all per `discovery.md`'s own Out of Scope.
- Any caching of the distinct type/source value list — recomputed live each render, matching this app's existing no-cache convention for this page.
- Any change to `server.js`'s shared `parseQuery` function — the comma-split happens entirely within `signals-panel.js`'s own handler, not in the shared parser.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — hiding a type removes from the full list | `filterSignals` unit tests + real route-dispatch tests (single value and comma-separated multi-value) | unit, integration |
| AC2 — hiding a source; filters combine | `filterSignals` unit test (AND-of-NOT combination) + real route-dispatch test combining `hideType`+`hideSource` | unit, integration |
| AC3 — filter state visible and bookmarkable | Real route-dispatch test confirming visible active-filter text and reload-stability | integration |
| AC4 — zero-match empty state | Real route-dispatch test confirming a distinct "no signals match" message + clear-filters link | integration |
| AC5 — keyboard-accessible controls | Unit test confirming plain `<a>` elements, no `tabindex` override | unit |
| AC6 — unfiltered behaviour preserved | Real route-dispatch test reusing `ep2-s3`'s own existing fixtures/assertions unchanged | integration |

## Assumptions

- **Corrected during this DoR run:** `req.query.hideType`/`hideSource` are each a single scalar string (comma-separated for multiple values), never an array — confirmed via direct read of `server.js:2030-2036`'s `parseQuery` and a repo-wide grep of `req.query.` across every route in `src/web-ui/routes/`.
- The real, observed `type`/`source` value universe (documented in the story's own Architecture Constraints) is used only to validate/normalize incoming filter values — not hardcoded as the only ever-possible set.

## Estimated touch points

**Files:** `src/web-ui/utils/filter-signals.js` (new), `src/web-ui/routes/signals-panel.js` (modified), `src/web-ui/views/signals-panel-view.js` (modified), `tests/check-sptu-s2-signals-filter.js` (new)
**Services:** none (no new adapter, no new npm dependency)
**APIs:** `GET /signals` (existing route, extended with `?hideType=` / `?hideSource=` query parameters — no new route)

---

## Contract Review

Cross-checked against the story's own 6 ACs and the corrected test plan's AC Coverage table — every AC maps to a specific, named test approach. The one real mismatch found during this review (repeated-key vs. comma-separated query params) was corrected in the story, test plan, and this contract before sign-off — not left as a latent implementation surprise.

**Verdict:** ✅ PASSED — proposed implementation aligns with all ACs (post-correction).
