## Benefit Metric: Signals Panel Triage UX

**Discovery reference:** artefacts/2026-10-04-signals-panel-triage-ux/discovery.md
**Date defined:** 2026-10-04
**Metric owner:** Hamish King — Operator / Product Owner
**Reviewers:** Hamish King — Operator / Product Owner

**Product context:** `product/mission.md`'s own success outcomes include "a platform consumer... can trust the governance output" and the self-improving-harness vision this feature's own parent epic (`signal-seeding-improve-loop-closure`) already serves. `product/roadmap.md` confirms Phase 5 is the active roadmap phase ("🟡 Active — Web UI workstreams delivered"), and this feature is squarely a Phase 5 web-UI workstream — the parent epic's own discovery.md explicitly named "Phase 5 UX enhancements" as the deferred scope this feature now delivers.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

This is a straightforward product UX improvement — it does not test a hypothesis about tooling, process, or team capability. Standard Tier 1 product metrics only.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Time-to-triage

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock time for an operator to filter out `parse-error` noise, sort by recency, and dismiss 10 real signals via the `/signals` UI — the exact sequence named in discovery's own MVP "first-use bar." |
| **Baseline** | Not yet established in minutes — today the task is not completable at all in any bounded time, since no filter/sort/dismiss mechanism exists (an operator cannot "dismiss" anything today, only page through). Will measure the implemented flow's real timing at `/definition-of-done`. |
| **Target** | Under 2 minutes. |
| **Minimum validation signal** | Under 5 minutes — still a clear, meaningful improvement over "impossible," even if the UI isn't yet maximally efficient. |
| **Measurement method** | A real, timed operator run (or an E2E test timing the full filter→sort→dismiss×10 interaction sequence) against real signal data, performed at `/definition-of-done`, matching this feature's own established practice of live-verified evidence over mocked/estimated claims. |
| **Feedback loop** | If the minimum signal is missed (>5 min), review whether the filter/sort/dismiss controls need fewer clicks or clearer affordances before considering any further Phase 5 UX additions (bulk actions, saved views) — those are explicitly deferred in discovery's own Out of Scope and should not be pulled forward to compensate for a basic usability miss. |

### Metric 2: Page-1 signal-to-noise ratio

| Field | Value |
|-------|-------|
| **What we measure** | The proportion of visible signals on page 1 of `/signals` that are `parse-error` type, with the type filter applied vs. not applied. |
| **Baseline** | Not yet precisely established — qualitatively observed as a majority of visible page-1 entries on real `wuce-staging` at discovery time (2026-10-04), not counted exactly. Will be measured precisely at implementation time via a real DOM/content count against real data, before the filter exists (the "before" state). |
| **Target** | 0% `parse-error` signals visible on page 1 after applying the "hide parse-error" filter — a correctly-implemented boolean filter should fully eliminate them, not just reduce them. |
| **Minimum validation signal** | At least 90% reduction in visible `parse-error` entries after filtering — allows for a reasonable implementation edge case (e.g. a `type` field inconsistency from one aggregator source) without blocking on a single straggler. |
| **Measurement method** | A real DOM/content count on both real `wuce-staging` and local dev, before and after applying the filter, as part of `/verify-completion`'s own live-evidence check — matching this session's own established practice (Claude-in-Chrome or direct HTTP against a real running server, with real staging confirmation where available). |
| **Feedback loop** | If filtering doesn't fully eliminate `parse-error` visibility, investigate whether `signal.type` values are inconsistent across the real aggregator sources (`src/web-ui/modules/signals-aggregator.js`'s own multiple parse paths) before assuming the filter UI itself is broken. |

### Metric 3: Dismiss retention

| Field | Value |
|-------|-------|
| **What we measure** | Whether a dismissed signal reappears after a page reload or a new browser session. |
| **Baseline** | 0% — no dismiss mechanism exists today; every signal resurfaces on every visit, unconditionally. |
| **Target** | 100% of dismissed signals stay dismissed across reloads and new sessions, within the same workspace/environment. |
| **Minimum validation signal** | Same as target (100%) — this is a binary correctness property of a deterministic, file-backed mechanism (per `decisions.md`'s own derived-stable-key + dedicated-JSON-file design), not a gradual one; a partial-retention result indicates a real bug, not a tolerable shortfall. |
| **Measurement method** | A dedicated automated test (dismiss a signal via its derived stable key, reload, confirm absence) — verified against both local dev and, where practical, real `wuce-staging`, matching this session's own established live-verification discipline for this feature family. |
| **Feedback loop** | If dismissed signals reappear, investigate whether the stable-key hash function is colliding (two different signals hashing to the same key) or whether `workspace/dismissed-signals.json` isn't being read correctly on every `getSignals()`-adjacent render — not a UI bug, a data-layer one. |

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Time-to-triage | `sptu-s1` (enables reaching the page at all), `sptu-s2` (filter step), `sptu-s3` (sort step), `sptu-s4` (dismiss step) — the full timed flow is filter→sort→dismiss×10, starting from nav discovery | Covered |
| Metric 2 — Page-1 signal-to-noise ratio | `sptu-s2` (type/source filter) | Covered |
| Metric 3 — Dismiss retention | `sptu-s4` (dismiss / mark-reviewed) | Covered |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts, written at `/definition`
- Implementation approach — the dismiss-state keying and persistence mechanism are already decided (`decisions.md`, 2026-10-04), but how that's broken into stories/tasks is `/definition`'s and `/implementation-plan`'s job
- Sprint targets or velocity — these metrics are outcome-based, not output-based
