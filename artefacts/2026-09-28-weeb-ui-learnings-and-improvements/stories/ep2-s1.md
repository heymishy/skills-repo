## Story: Signals panel — render real signals in a web UI page
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signal-seeding-improve-loop-closure.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **a web UI page that lists the real improvement signals returned by `GET /api/signals`, with each signal's text, source, type, and CTA label visible**,
So that **I can discover improvement signals without CLI or IDE access — closing the visibility half of the self-improvement loop (Metric 3)**.
## Benefit Linkage
Metric 2 — Improvement signal surfacing (benefit-metric.md): this story is the "displayed per active feature" half of Metric 2's own full target, explicitly not yet delivered by any Epic 1 story (confirmed gap, see decisions.md 2026-10-01 entry in this feature's own decisions log — `ep1-s2`'s own DoD had assumed `ep1-s3` would be this dashboard; `ep1-s3` became the skill-launcher redesign instead).
Metric 3 — Self-improvement loop accessibility (benefit-metric.md): this story alone satisfies Metric 3's own minimum validation signal ("the visibility half of the loop works end-to-end — signal appears, is legible, and is traceable to its source"), independent of `ep2-s2`'s seeding bridge.
## Architecture Constraints
New route/view under `src/web-ui/` — follow the same server-side string-concatenation HTML rendering pattern already established by `ep1-s3`'s skill launcher (`renderShell({title, bodyContent, ...})` from `src/web-ui/utils/html-shell.js`, per-page view module under `src/web-ui/views/`, `escHtml` for all interpolated values — confirmed real pattern by direct code read this session). No client-side JS framework; a plain GET page is sufficient for a read-only list. Consume the real `GET /api/signals` endpoint (`ep1-s2`, already merged) — do not re-implement signal aggregation or call `signals-aggregator.js` directly from this new route; fetch through the existing endpoint's own HTTP contract (or its underlying handler function, matching this codebase's general the-route-already-exists reuse convention) so this story has exactly one source of truth for signal data. No new npm runtime dependencies (discovery.md Constraints). The real `Signal` shape (confirmed by direct code read, `src/web-ui/modules/signals-aggregator.js` `_makeSignal`) is `{id, source, type, text, timestamp, cta: {label, skill}}` — `cta` is always present with a default of `{label: 'Review', skill: '/improve'}`.
## Dependencies
`ep1-s1` (signals aggregator) and `ep1-s2` (`GET /api/signals` endpoint) — both merged and DoD-complete. This story consumes `ep1-s2`'s real endpoint contract; per `ep1-s2`'s own DoR, its response shape must not be modified by this story.
## Acceptance Criteria

**AC1 — Real signals render on page load:**
Given the operator navigates to the signals panel page,
When the page loads,
Then every signal returned by `GET /api/signals` is rendered as a list item showing its `text`, `source`, and `type` fields, using real (not mocked) data from the endpoint.

**AC2 — Each signal's CTA label is visible:**
Given a signal has a non-empty `cta` field,
When it renders,
Then the signal's own `cta.label` text (e.g. "Review") is shown as a visible button or link on that signal's list item. This story renders the CTA's label only — clicking it to actually launch a seeded session is `ep2-s2`'s own scope, out of scope here (see Out of Scope).

**AC3 — Empty state when no signals exist:**
Given `GET /api/signals` returns an empty array,
When the page loads,
Then a clear, non-error empty state is shown (e.g. "No signals yet"), not a blank page or a rendering error.

**AC4 — Parse-error signals are visually distinguished:**
Given the aggregator produced one or more `type: 'parse-error'` signals (a real, already-observed condition — confirmed live this session that `ep1-s1`'s aggregator emits these under real workspace conditions),
When they render,
Then they are visually distinguished from normal signals (e.g. a warning style), so the operator can immediately tell a parse failure from genuine improvement content.

**AC5 — Page requires authentication, matching every other web UI page:**
Given an unauthenticated request to the signals panel page,
When it is made,
Then the existing auth guard redirects to sign-in, matching the behaviour of every other authenticated web UI page in this app (e.g. `/skills`).
## Out of Scope
- Actually launching a seeded session when a CTA is clicked — `ep2-s2`'s own scope
- Signal filtering, sorting, dismissal, or bulk actions (epic's own explicit out-of-scope, deferred to Phase 5)
- Real-time/live-updating signal list (polling or websockets) — static page load only for this walking-skeleton story
- Pagination for very large signal counts — acceptable to render the full list for MVP/solo-operator scale (matches epic's own out-of-scope note on caching/performance optimization, deferred to Phase 5)
- Grouping signals by source or type — a flat list is sufficient for this story
## NFRs
- Performance: page renders within the same budget as `ep1-s3`'s own launcher NFR (<100ms server-side render time) — signal counts at solo-operator scale are small enough that this is not expected to be a stretch
- Accessibility: signal list items and CTA buttons are keyboard-navigable, matching the established pattern from `ep1-s3`
- No new attack surface: read-only page, no new npm dependency, consumes only the already-existing `/api/signals` contract
