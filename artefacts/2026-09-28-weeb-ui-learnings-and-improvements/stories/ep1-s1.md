## Story: Signals aggregator module: read all 12 sources and normalize to Signal shape
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **learnings, proposals, suite, traces, decisions, DoD, estimation, archived references, pipeline-state), I need a server-side module that reads all 12 signal sources, parses each into a normalized `Signal` object shape, and returns a complete, sorted array of signals ready for dashboard consumption**,
So that **I can see improvement opportunities surfaced from across the entire framework (capture-log**.
## Benefit Linkage
Self-improvement loop accessibility — moves the metric "improvement loop is accessible from web UI" from 0% (CLI-only) to 50% (signals visible, seeding deferred).
## Architecture Constraints
No new npm runtime dependencies (tech-stack.md); use built-in Node.js `fs` and `path` only. Injectable file-read adapter (D37) with throwing stub. Graceful error handling: parse failures on individual sources are surfaced as `signal-type: parse-error` entries, not silent drops. Canonical builder pattern (ADR-028): this module is the single source of truth for aggregating signals; no other code re-derives this logic.
## Dependencies
None (read-only from existing artefacts; no upstream stories)
## Acceptance Criteria
Given the operator has made deliveries and the workspace contains capture-log entries, learnings, proposals, suite.json, results.tsv, traces, decisions, DoD observations, estimation norms, archived references, and pipeline-state.json updates,
When the aggregator module is invoked (on-demand, no caching),
Then it returns a `Signal[]` array with all 12 sources parsed into a normalized shape, sorted by timestamp (most recent first), with parse errors on any source surfaced as signal entries rather than blocking the entire aggregation.
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
