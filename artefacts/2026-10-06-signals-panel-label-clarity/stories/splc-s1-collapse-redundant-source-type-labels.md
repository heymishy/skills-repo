# Story: Signals panel must not render redundant/meaningless source and type labels on every card

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the real, operator-observed UX defect below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator reading the `/signals` panel**,
I want **each signal card to show one meaningful label, not two stacked raw internal codes that are sometimes identical and never explained**,
So that **I can tell at a glance what a signal actually is, instead of misreading repeated "parse-error / parse-error" text as a sign of a much larger problem than actually exists**.

## Benefit Linkage

**Metric moved:** None formally tracked — this is a short-track readability fix, not a metric-bearing feature. Direct benefit: eliminates a real, demonstrated misreading. In this session's own live investigation (2026-10-06), the operator looked at the production `/signals` panel and reported "hundreds of those Parse error signals," prompting a multi-step investigation. The real count was 8, not hundreds — the perception came from `parse-error` signals always sorting to the top of the list (fresh timestamp every request) combined with every card unconditionally rendering two label lines, which for `parse-error` signals are the literal identical string twice (`_makeSignal('parse-error', 'parse-error', ...)` in `signals-aggregator.js:60`), and for other signals (e.g. `pipeline-state` / `feature-status`) are two bare internal taxonomy codes with no explanation. The operator's own words once shown the real breakdown: "maybe it's the labels then... labels that mean nothing."
**How:** Collapsing the redundant/unexplained label rendering removes the specific visual pattern that caused this session's misreading, for every future reader of this panel — not just this one incident.

## Architecture Constraints

**Root cause, fully confirmed (not speculative) — read directly, not guessed:**
- `src/web-ui/views/signals-panel-view.js`, `_signalItem()` (lines 61-62), unconditionally renders two separate stacked `<div>` elements for every signal: `.signal-source` (`signal.source`) and `.signal-type` (`signal.type`).
- `src/web-ui/modules/signals-aggregator.js:60`, `_safeParse()`'s catch branch calls `_makeSignal('parse-error', 'parse-error', ...)` — source and type are passed as the identical literal string `'parse-error'`. This is the only signal-producing path in the aggregator where source and type are always equal by construction (confirmed by reading all `_makeSignal(...)` call sites in `signals-aggregator.js`).
- Verified live against production (`https://skills-framework.fly.dev/signals`, 2026-10-06, authenticated session): every one of the 8 real parse-error signals renders as two identical "parse-error" lines; `pipeline-state`/`feature-status` entries (the next-most-common type) render two different but equally unexplained internal codes.

**Scope decision — collapse, don't relabel:** The fix changes `_signalItem()`'s own rendering only. When `signal.source === signal.type`, render exactly one label line instead of two identical ones. When they differ, render both values on a single combined line (e.g. `pipeline-state · feature-status`) instead of two separate full-width stacked divs, reducing the two labels' visual weight relative to `signal.text` (the actually-informative line). This story does **not** introduce a human-readable name-mapping table for every current and future source/type code — that is a larger, open-ended maintenance surface (every new source/type added to `signals-aggregator.js` would need a matching entry) and is not needed to fix the specific defect found: the redundancy/noise, not the technical vocabulary itself.

**Explicitly NOT the fix:**
- Renaming or remapping any `source`/`type` value inside `signals-aggregator.js` — those are stable, test-asserted identifiers (`data-signal-type="parse-error"` is asserted by `tests/check-ep2-s1-signals-panel.js`, `check-sptu-s2-signals-filter.js`, and `check-sptu-s3-signals-sort-visibility.js`) and must not change.
- A human-readable label-mapping dictionary for every source/type — out of scope, see above.
- The filter-compose behaviour — investigated during this same session and confirmed **not** to be a bug (ground-truthed via direct `window.location.href` checks: `Hide feature-status` then `Hide note` correctly composed to `?hideType=feature-status%2Cnote`). No fix needed; not part of this story.

## Dependencies

- **Upstream:** `sptu-s2` (filter bar, `data-signal-type` attribute), `sptu-s3` (sort/visibility markers) — both already merged; this story must not change the `data-signal-type` attribute or marker HTML those stories' own tests assert on.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a signal where `signal.source === signal.type` (e.g. every current `parse-error` signal), When the signals panel renders that card, Then exactly one label line is shown for source/type — not two identical lines.

**AC2:** Given a signal where `signal.source !== signal.type` (e.g. a `pipeline-state`/`feature-status` signal), When the signals panel renders that card, Then both values are shown together on a single line (not two separate stacked divs).

**AC3:** Given any signal of any source/type, When the signals panel renders that card, Then the existing `data-signal-type="[type]"` attribute on the outer `.signal-item` card element is unchanged in value and position — `sptu-s2`'s filter tests and `sptu-s3`'s sort/visibility-marker tests must continue to pass unmodified.

**AC4:** Given the existing `tests/check-ep2-s1-signals-panel.js`, `tests/check-sptu-s2-signals-filter.js`, `tests/check-sptu-s3-signals-sort-visibility.js`, and `tests/check-sptu-s4-signals-dismiss.js` suites (pre-existing, currently passing), When this fix is applied, Then all pre-existing tests in those files still pass unchanged.

## Out of Scope

- A human-readable label-mapping dictionary for every source/type code (see Architecture Constraints).
- Any change to `signals-aggregator.js`'s `source`/`type` values.
- The filter-compose behaviour — investigated this session, confirmed not a bug (see Architecture Constraints).
- A broader visual/design pass on the signals panel beyond this one redundant-label defect.

## NFRs

- **Performance:** None — pure string-concatenation change in an existing render path, no new I/O or loop added.
- **Security:** None identified — no new input surface; `escHtml` is already applied to both `source` and `type` before this change and remains applied after.
- **Accessibility:** The combined single-line label must remain in the DOM as readable text (not an image or icon-only representation) — no change to the zero-client-JS, keyboard-native convention this view already follows.
- **Audit:** N/A — no new loggable event.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
