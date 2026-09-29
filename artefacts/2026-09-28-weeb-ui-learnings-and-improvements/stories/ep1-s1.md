## Story: Signals aggregator module: read all 12 sources and normalize to Signal shape
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **a server-side module that reads all 12 signal sources (capture-log, learnings, proposals, suite, traces, decisions, DoD, estimation, archived references, pipeline-state), parses each into a normalized `Signal` object shape, and returns a complete, sorted array of signals ready for dashboard consumption**,
So that **I can see improvement opportunities surfaced from across the entire framework**.
## Benefit Linkage
Metric 2 — Improvement signal surfacing (benefit-metric.md): moves the metric from 0% (0 workspace signals surfaced in web UI, CLI-only today) toward the target (all 12 sources parsed, ≥1 signal per active source type displayed per active feature). This story delivers the aggregator module that makes source-visibility measurement possible — without it, signals remain invisible to the dashboard.
## Architecture Constraints
No new npm runtime dependencies (tech-stack.md); use built-in Node.js `fs` and `path` only. Injectable file-read adapter (D37) with throwing stub. Graceful error handling: parse failures on individual sources are surfaced as `signal-type: parse-error` entries, not silent drops. Canonical builder pattern (ADR-028): this module is the single source of truth for aggregating signals; no other code re-derives this logic.
## Dependencies
None (read-only from existing artefacts; no upstream stories)
## Acceptance Criteria

**AC1 — All 12 sources are parsed:**
Given the operator has made at least one delivery cycle (so workspace contains capture-log entries, learnings, proposals, suite.json, results.tsv, traces, decisions, DoD observations, estimation norms, archived references, and pipeline-state.json),
When the aggregator module is invoked (via `getSignals(repoPath)` function call),
Then it returns a `Signal[]` array with entries parsed from all 12 sources. A missing source file (e.g., no proposals directory exists) does not block parsing of remaining sources; it is logged as a parse-error signal instead.

**AC2 — Signals are normalized to a common shape:**
Given the aggregator has parsed all 12 sources,
When the returned `Signal[]` array is inspected,
Then every entry has all required fields: `id`, `source`, `type`, `text`, `timestamp`, `cta` (with `label` and `skill` fields), and optionally `context` (with `relatedStory`, `featureSlug`, `severity`, `metadata`). No source-specific fields leak into the normalized shape.

**AC3 — Parse errors are surfaced as signals, not thrown:**
Given a signal source contains invalid JSON (e.g., malformed suite.json), missing file, or unparseable YAML,
When the aggregator processes that source,
Then it catches the exception, logs the error, and returns a signal entry with `source: 'parse-error'`, `type: 'parse-error'`, and `text: '<source name>: <error message>'`. The aggregator continues parsing remaining sources and returns a complete array for all non-errored sources.

**AC4 — Signals are sorted by timestamp, most recent first:**
Given the aggregator has parsed all 12 sources and some sources have timestamps,
When the returned `Signal[]` array is inspected,
Then entries are sorted in descending order by `timestamp` (most recent first). Sources without a timestamp (e.g., static reference documents) are placed at the end of the array in a stable order.

**AC5 — The aggregator guarantees no silent data loss:**
Given a signal source exists and is readable,
When the aggregator processes it,
Then every parseable entry from that source appears in the returned `Signal[]` array. If a single entry within a source fails to parse, that entry is logged as a parse-error signal; remaining entries from that source are included in the array.
## Out of Scope
- Per-source parsing details (capture-log YAML schema validation, proposals directory structure, DoD markdown regex) — ep1-s1 uses basic string/JSON parsing; robustness per source is ep2-s1 and successors
- Caching or memoization (acceptable <200ms for solo operator scale; deferred to Phase 5 performance story if scale inflection is hit)
- Multi-tenant workspace isolation (MVP assumes single workspace; deferred)
- Signal filtering, sorting, or display logic (returned array is ready for dashboard to consume; display is separate concern)
- Automated signal generation or AI summarization (aggregator reads existing structured content only; proposal generation happens in `/improve` skill, not here)
## NFRs
- Performance: <200ms for solo operator scale (<2MB workspace) on on-demand parsing
- Graceful degradation: parse errors on individual sources do not block remaining sources; failed sources appear as `signal-type: parse-error` entries
- Robustness: invalid JSON, malformed YAML, missing files, and empty directories are handled without exception throw (logged as parse-error signals instead)
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
