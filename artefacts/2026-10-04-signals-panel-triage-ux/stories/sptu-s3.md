## Story: Make the signals panel's existing sort order visible and explicit
**Epic reference:** artefacts/2026-10-04-signals-panel-triage-ux/epics/signals-panel-triage-controls.md
**Discovery reference:** artefacts/2026-10-04-signals-panel-triage-ux/discovery.md
**Benefit-metric reference:** artefacts/2026-10-04-signals-panel-triage-ux/benefit-metric.md
**Domain:** [web-ui]
## User Story
As a **Solo operator (you, today)**,
I want **the signals panel to visibly state that it's sorted newest-first (for signals that have a date) and to clearly mark signals that have no date at all**,
So that **I can trust what order I'm looking at without reading source code, moving Metric 1 (Time-to-triage) by removing the "wait, what order is this?" uncertainty from the triage flow**.
## Benefit Linkage
Metric 1 — Time-to-triage (benefit-metric.md): the first-use bar names "sort by recency" as one of the three steps in the timed flow. This story delivers that step honestly, given the real data shape.
## Architecture Constraints
**Real, corrected finding (2026-10-04, superseding `discovery.md`'s own framing — see `decisions.md`):** `src/web-ui/modules/signals-aggregator.js`'s `getSignals()` already applies `_sortSignals()` — a stable descending sort by `timestamp` — and has done so since `ep1-s1`'s first commit (`e396e67b`, #932). Confirmed live against this repo's own real data (2026-10-04): of 5,340 real signals, **693 (13%) carry a real timestamp and are already rendered newest-first**; **4,647 (87%) have no timestamp at all** (the large majority of these are `learnings`-sourced `note` signals) and fall back to plain source-aggregation order, since there is nothing to sort them by.
**Operator decision (RISK-ACCEPT, `decisions.md` 2026-10-04):** this story does NOT extend `signals-aggregator.js`'s parsers to produce more real timestamps — that is a larger change to `ep1-s1`'s own territory, out of scope here. This story makes the *existing* behaviour visible and honest instead of silently relying on an undocumented default.
**No change to `getSignals()`'s own sort function or output order** — this is a presentation-only story. It adds a visible label/indicator to the existing view, it does not re-sort anything.
**No new npm runtime dependency** (discovery.md Constraints).
## Dependencies
`ep2-s1` (signals panel), `ep1-s1` (signals-aggregator's existing `_sortSignals`) — both merged; this story adds visibility only, no functional dependency on `sptu-s2`. `[External: ep2-s1/ep1-s1 are stories in the sibling feature artefacts/2026-09-28-weeb-ui-learnings-and-improvements, both merged and DoD-complete — confirmed by operator on 2026-10-04]`.
## Acceptance Criteria

**AC1 — The page states its own sort order explicitly:**
Given the operator loads `/signals` (any page, filtered or not),
When the page renders,
Then a visible label states the current sort behaviour (e.g. "Sorted by most recent first — signals with no date shown last"), so the ordering is never left implicit.

**AC2 — Signals with no timestamp are visually distinguished from dated ones:**
Given a rendered page includes a signal with `timestamp === null`,
When it renders,
Then it carries a visible "no date" indicator (text, not colour-only, per the Accessibility NFR), distinct from `ep2-s1`'s own existing `parse-error` marker styling — these are two independent, possibly-overlapping conditions (a signal can be both `parse-error` type and have no timestamp).

**AC3 — The stated sort order matches the real, measured behaviour — not an aspirational claim:**
Given the real split confirmed above (13% dated/sorted, 87% undated/unordered-by-date),
When the label/copy is written,
Then it must not claim the page is "sorted by recency" without qualification — the copy must reflect that this applies only to signals that have a date, matching this story's own Architecture Constraints finding. A reviewer check: the shipped copy must not contradict the real data shape measured in this story.

**AC4 — No functional change to signal order or content:**
Given any existing `ep2-s1`/`ep2-s3` test asserting signal order or count,
When this story ships,
Then those tests pass unchanged — this story adds a label and a per-item marker; it does not call `_sortSignals` differently or change `paginateSignals`'s own slicing.
## Out of Scope
- Extending `signals-aggregator.js` to parse real timestamps for the currently-undated 87% — a separate, larger change to `ep1-s1`'s own source parsers (see Architecture Constraints RISK-ACCEPT)
- A user-selectable alternate sort order (e.g. oldest-first, alphabetical) — `discovery.md`'s own MVP scope names only "recency sort," which this story delivers as the existing, now-visible default; a true multi-option sort selector is a natural Phase-6 follow-up if real usage shows it's wanted
- Grouping or re-ordering undated signals among themselves — they keep their existing stable aggregation order, unchanged
## NFRs
- Performance: no measurable change — no new computation beyond a per-item boolean check (`timestamp == null`) already available on the existing signal object
- Accessibility: "no date" indicator uses text/icon, not colour alone (AC2)
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
