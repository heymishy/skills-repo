## Epic: Signals panel triage controls

**Discovery reference:** artefacts/2026-10-04-signals-panel-triage-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md
**Slicing strategy:** user-journey

## Goal

An operator can discover the `/signals` page from the main nav, filter out `parse-error` noise by type/source, see which order the list is actually sorted in, and dismiss handled signals so they stop resurfacing — closing the Phase 5 UX gap the `signal-seeding-improve-loop-closure` epic deliberately deferred, and fixing a real "shipped, never wired to nav" gap discovered during this feature's own `/definition` session (confirmed directly in `src/web-ui/utils/html-shell.js`'s `NAV_ITEMS` array — `/signals` has rendered with `active: 'signals'` since `ep2-s1`, but no nav row with that id has ever existed).

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    NAV[html-shell.js\\nNAV_ITEMS +signals row]\n    ROUTE[routes/signals-panel.js\\nhandleGetSignalsPanelHtml]\n    AGG[modules/signals-aggregator.js\\ngetSignals -- unchanged]\n    FILTER[utils/signal-filter.js\\nhideType/hideSource/dismissed filter]\n    PAGINATE[utils/paginate-signals.js\\npaginateSignals -- unchanged]\n    DISMISS[modules/dismissed-signals-store.js\\nD37 adapter: get/set dismissed keys]\n    FILE[(workspace/dismissed-signals.json)]\n    VIEW[views/signals-panel-view.js\\nrenderSignalsPanel + filter UI + sort label + dismiss controls]\n    NAV --> ROUTE\n    ROUTE --> AGG\n    AGG --> FILTER\n    DISMISS --> FILTER\n    DISMISS --> FILE\n    FILTER --> PAGINATE\n    PAGINATE --> VIEW"}}---

## Out of Scope

- Bulk actions, saved views, full-text search, multi-tenant dismiss-state isolation, and changes to `/improve`'s own downstream execution — all per `discovery.md`'s own Out of Scope section.
- Extending `signals-aggregator.js`'s source parsers to produce real timestamps for the 87% of signals that currently have none (confirmed via direct execution: 4,647 of 5,340 real signals carry no `timestamp`) — a larger, separate change to `ep1-s1`'s own parsers, not this feature's scope. See `decisions.md`, 2026-10-04 "Recency sort scope" entry.

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md]

## Stories in This Epic

- [ ] Add `/signals` to the main navigation — artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
- [ ] Type/source filter for the signals panel — artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s2.md
- [ ] Make the signals panel's existing sort order visible and explicit — artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s3.md
- [ ] Dismiss / mark-reviewed for the signals panel — artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s4.md

**Scope addition (2026-10-04):** `sptu-s1` was not in `discovery.md`'s original MVP scope. It was surfaced during this `/definition` session when the operator asked "I can't see a UI path to the feature — what's the nav flow?" Direct investigation confirmed `/signals` has never had a sidebar nav entry across `ep2-s1`/`ep2-s2`/`ep2-s3` — the exact "API shipped, UI never wired" anti-pattern already named and previously fixed twice in this repo (`pod-manager`/pmnv-s1, `admin-mock-gateway`/alrf-s7). Added as Story 1, sequenced first since it's the actual entry point the other three stories' own UX improvements depend on being reachable. See `decisions.md`, 2026-10-04 "Nav gap fix" entry.

## Human Oversight Level

**Oversight:** Low
**Rationale:** All four stories extend already-shipped, already-reviewed modules (`html-shell.js`, `signals-panel.js`, `signals-panel-view.js`, `signals-aggregator.js`'s existing `getSignals()` output) with additive, server-rendered query-param/file-based mechanisms. No new adapters, no new npm dependency, no regulated constraints. Risk is concentrated in getting the dismiss-state stable-key hash right (already resolved at `/clarify`) and in not regressing `ep2-s1`/`ep2-s3`'s own existing ACs.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
