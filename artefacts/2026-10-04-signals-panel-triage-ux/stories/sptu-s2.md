## Story: Type/source filter for the signals panel
**Epic reference:** artefacts/2026-10-04-signals-panel-triage-ux/epics/signals-panel-triage-controls.md
**Discovery reference:** artefacts/2026-10-04-signals-panel-triage-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md
**Domain:** [web-ui]
## User Story
As a **Solo operator (you, today)**,
I want **to hide signals by `type` (e.g. hide all `parse-error`) and by `source` (e.g. `capture-log`, `decisions`, `pipeline-state`) on `/signals`**,
So that **page 1 stops being dominated by non-actionable noise, moving Metric 2 (Page-1 signal-to-noise ratio) toward its 0%-visible-parse-error target**.
## Benefit Linkage
Metric 2 — Page-1 signal-to-noise ratio (benefit-metric.md): target is 0% `parse-error` signals visible on page 1 after applying the filter; minimum validation signal is ≥90% reduction. This story is the only mechanism in this feature that moves that metric.
## Architecture Constraints
**Extends, does not replace, `ep2-s3`'s own pagination.** Filtering must apply to the full `getSignals()` output *before* `paginateSignals()` slices it — filtering a page of 50 after the fact would produce inconsistent page counts and a wrong `totalCount`. `src/web-ui/routes/signals-panel.js`'s `handleGetSignalsPanelHtml` is the correct integration point: filter the real `signals` array, then pass the filtered array into the existing `paginateSignals(signals, rawPage)` call unchanged.
**Query-param convention, consistent with `ep2-s3`'s own `?page=`:** **Corrected 2026-10-04, at /definition-of-ready** — the original design assumed a repeatable query param (`?hideType=parse-error&hideType=decision`) would arrive as an array. Confirmed wrong by direct code read: `server.js`'s own `parseQuery` (`server.js:2030-2036`) does `result[key] = val` per entry — a repeated key is last-wins, not an array — and zero existing route anywhere in this app treats any `req.query.*` field as anything but a scalar string (confirmed by a repo-wide grep of `req.query.` across `src/web-ui/routes/`). The real mechanism is a single comma-separated value per param: `?hideType=parse-error,decision&hideSource=capture-log`, split on `,` server-side. Validate/allowlist each split value against the real, currently-observed `type`/`source` values the aggregator produces — do not accept arbitrary strings into the filter without at least normalizing them (case, trim), to avoid a filter control that silently never matches due to a casing mismatch.
**Real type/source universe (confirmed via direct execution against this repo's own real 5,340 signals, 2026-10-04):** sources include `capture-log`, `learnings`, `estimation-norms`, `architecture-guardrails`, `suite`, `results` (watermark-row), `decisions`, `pipeline-state`, `dod-follow-up`, and others; types include `parse-error`, `feature-status`, `pattern`, `gap`, `decision`, `assumption-invalidated`, `assumption-validated`, `note`, `watermark-row`. The filter control's own options must be derived live from the real data (distinct `type`/`source` values present), not a hardcoded list — a hardcoded list would silently go stale as `signals-aggregator.js` gains sources over time.
**No new npm runtime dependency** (discovery.md Constraints).
## Dependencies
`ep2-s1` (signals panel), `ep2-s3` (pagination) — both merged; this story extends their output. `[External: ep2-s1/ep2-s3 are stories in the sibling feature artefacts/2026-09-28-weeb-ui-learnings-and-improvements, both merged and DoD-complete — confirmed by operator on 2026-10-04]`. `sptu-s1` (nav entry) is not a functional dependency but should land first per the epic's own story ordering.
## Acceptance Criteria

**AC1 — Hiding a type removes matching signals from the full list, not just the current page:**
Given the operator applies a "hide `parse-error`" filter,
When `/signals` re-renders,
Then no `parse-error` signal appears on any page (confirmed via the real total count and real position text both dropping to reflect the filtered total — not just page 1 looking clean while page 2 still has them).

**AC2 — Hiding a source behaves the same way as hiding a type:**
Given the operator applies a "hide `capture-log`" filter,
When `/signals` re-renders,
Then no signal with `source === 'capture-log'` appears on any page, and multiple hidden types/sources can be combined (e.g. hide `parse-error` AND hide `capture-log` simultaneously).

**AC3 — The filter state is visible and bookmarkable:**
Given a filter is applied,
When the operator reloads the same URL or shares it,
Then the same filter is re-applied (state lives in the query string, matching `?page=`'s own existing convention) and the applied filters are visibly listed on the page (not a hidden/invisible state).

**AC4 — Filtering to zero results shows a clear empty state, not a blank or error page:**
Given the operator's combined filters match zero real signals,
When `/signals` renders,
Then it shows an explicit "no signals match the current filters" message distinct from `ep2-s1`'s own existing "no signals in the workspace at all" empty state, with a visible way to clear the filters.

**AC5 — The filter control itself is keyboard-accessible:**
Given an operator navigating by keyboard only,
When they Tab to the filter controls,
Then each control (type checkboxes/toggles, source checkboxes/toggles) is individually focusable and operable (space/enter), and colour alone is never the only indicator of which filters are currently active — matching `product/constraints.md` #9 and this repo's own Accessibility NFR precedent (`ep2-s1`/`ep2-s3`'s Tab-order E2E coverage).

**AC6 — `ep2-s1`/`ep2-s3`'s own existing behaviour is preserved when no filter is applied:**
Given the operator loads `/signals` with no `hideType`/`hideSource` parameters,
Then the page renders identically to today's unfiltered behaviour — this story must not regress any existing AC from `ep2-s1` or `ep2-s3`.
## Out of Scope
- Full-text search across signal content — per `discovery.md`'s own Out of Scope
- Saved filter presets / named views — per `discovery.md`'s own Out of Scope
- Multi-select "show only" semantics beyond hide/show toggles (e.g. a dedicated "show only X" shortcut) — hide-based filtering alone satisfies the first-use bar; an explicit show-only affordance can be added later if real usage shows it's wanted
- Server-side caching of the distinct type/source list — recomputed live from `getSignals()` each render, matching this app's own existing no-cache convention for this page
## NFRs
- Performance: filtering the real ~5,340-signal array stays within the established <100ms render budget (filter is a single array `.filter()` pass before the already-measured pagination slice)
- Accessibility: filter controls fully keyboard-operable, colour never the sole indicator (AC5)
- No new attack surface: `hideType`/`hideSource` values are validated against the real observed value set before use in any comparison or rendering (AC1/AC2); no new npm dependency
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
