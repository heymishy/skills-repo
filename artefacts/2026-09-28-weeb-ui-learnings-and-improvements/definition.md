Slicing strategy: walking-skeleton

## Epic 1 — Signals foundation & launcher redesign

Goal: Operators can see improvement signals surfaced from 12 workspace/framework sources in the web UI dashboard, navigate to them, and the skill launcher shows only 5 valid entry-point skills (discovery, ideate, reverse-engineer, spike, improve) as primary CTAs, with all 27+ chained skills hidden from the primary launcher view. The walking skeleton establishes end-to-end signal visibility and rationalized entry points; subsequent epics will add signal seeding and `/improve` execution.

Out of scope:
- Per-source parsing robustness (capture-log YAML, proposals directory, DoD markdown details) — deferred to Epic 2
- Signal-to-session seeding bridge (CTA → skill launch with signal injected as priorArtefacts) — deferred to Epic 2
- `/improve` skill execution via web UI — deferred to Epic 2
- Signal filtering, sorting, dismissal, or bulk actions — deferred to Phase 5 enhancements
- Multi-tenant signal isolation or cross-repo aggregation — out of scope; MVP assumes single workspace per deployment
- Caching or performance optimization (acceptable <200ms for solo operator scale) — deferred to Phase 5 performance story

Oversight: Medium
Oversight rationale: The signals aggregator touches 12 different file types and formats across the workspace, requiring robust parsing and error handling. The launcher redesign is high-visibility (operator's first interaction with the web UI). Medium oversight ensures parsing fidelity and launcher clarity before seeding logic depends on it.

Complexity: 2
Scope stability: Stable

### ep1-s1 — Signals aggregator module: read all 12 sources and normalize to Signal shape

Persona: Solo operator (you, today)

So that I can see improvement opportunities surfaced from across the entire framework (capture-log, learnings, proposals, suite, traces, decisions, DoD, estimation, archived references, pipeline-state), I need a server-side module that reads all 12 signal sources, parses each into a normalized `Signal` object shape, and returns a complete, sorted array of signals ready for dashboard consumption.

Benefit linkage: Self-improvement loop accessibility — moves the metric "improvement loop is accessible from web UI" from 0% (CLI-only) to 50% (signals visible, seeding deferred).

Architecture constraints: No new npm runtime dependencies (tech-stack.md); use built-in Node.js `fs` and `path` only. Injectable file-read adapter (D37) with throwing stub. Graceful error handling: parse failures on individual sources are surfaced as `signal-type: parse-error` entries, not silent drops. Canonical builder pattern (ADR-028): this module is the single source of truth for aggregating signals; no other code re-derives this logic.

Given the operator has made deliveries and the workspace contains capture-log entries, learnings, proposals, suite.json, results.tsv, traces, decisions, DoD observations, estimation norms, archived references, and pipeline-state.json updates,
When the aggregator module is invoked (on-demand, no caching),
Then it returns a `Signal[]` array with all 12 sources parsed into a normalized shape, sorted by timestamp (most recent first), with parse errors on any source surfaced as signal entries rather than blocking the entire aggregation.

Out of scope:
- Per-source parsing details (capture-log YAML schema validation, proposals directory structure, DoD markdown regex) — ep1-s1 uses basic string/JSON parsing; robustness per source is ep2-s1 and successors
- Caching or memoization (acceptable <200ms for solo operator scale; deferred to Phase 5 performance story if scale inflection is hit)
- Multi-tenant workspace isolation (MVP assumes single workspace; deferred)
- Signal filtering, sorting, or display logic (returned array is ready for dashboard to consume; display is separate concern)
- Automated signal generation or AI summarization (aggregator reads existing structured content only; proposal generation happens in `/improve` skill, not here)

Dependencies: None (read-only from existing artefacts; no upstream stories)

NFR:
- Performance: <200ms for solo operator scale (<2MB workspace) on on-demand parsing
- Graceful degradation: parse errors on individual sources do not block remaining sources; failed sources appear as `signal-type: parse-error` entries
- Robustness: invalid JSON, malformed YAML, missing files, and empty directories are handled without exception throw (logged as parse-error signals instead)

Complexity: 2
Scope stability: Stable

### ep1-s2 — Signals panel route handler: `/api/signals` endpoint

Persona: Solo operator (you, today)

So that the dashboard can consume and render improvement signals without needing to know how to read 12 different file formats, I need an HTTP endpoint that calls the signals aggregator and returns the normalized Signal array as JSON.

Benefit linkage: Self-improvement loop accessibility — signals visible in web UI (prerequisite for seeding and `/improve` execution).

Architecture constraints: `GET /api/signals` JSON endpoint following the codebase pattern (ADR-024: journey-state GET response shape contract). Route handler calls `signals-aggregator.js` on every request (on-demand, no caching). Returns JSON only (no HTML rendering; dashboard JavaScript consumes and renders the signals panel). Graceful error handling: if the aggregator throws an exception, the endpoint returns a 500 with error summary, not a partial 200. Error responses include a `signal-type: endpoint-error` entry for visibility.

Given the signals aggregator module is available and the operator accesses the dashboard,
When `GET /api/signals` is called,
Then the route handler calls the aggregator, receives a `Signal[]` array, and returns it as JSON with 200 status code. If aggregator throws, the endpoint returns 500 with error details.

Out of scope:
- Signal filtering by source, type, severity, or feature slug (aggregator returns all signals; filtering deferred to dashboard or Phase 5 enhancement)
- Caching or performance optimization
- HTML rendering of signals panel (dashboard JavaScript owns rendering; this is JSON-only)
- Multi-tenant signal isolation (returns all signals from current repo's workspace)

Dependencies: ep1-s1 (signals aggregator must exist and be callable)

NFR:
- Endpoint latency: <250ms for solo operator scale (aggregator <200ms + route overhead <50ms)
- Error handling: any exception from aggregator is caught and returned as a 500 response with error summary, not propagated to caller

Complexity: 1
Scope stability: Stable

### ep1-s3 — Skill launcher redesign: show 5 primary CTAs, hide chained skills

Persona: Solo operator (you, today)

So that I can see at a glance which skills are valid entry points to a new pipeline run (not chained stages), I need the skill launcher to show only 5 primary CTAs (discovery, ideate, reverse-engineer, spike, improve) and hide all 27+ chained skills from the primary launcher view while preserving backward-compatible access for advanced operators.

Benefit linkage: Self-improvement loop accessibility + skill launcher clarity — moves "skill entry points are rationalized and clear" from 0% (all 41+ skills shown equally) to 100% (5 primary CTAs shown; chained skills hidden; advanced access preserved).

Architecture constraints: Launcher must preserve backward compatibility (advanced operators can still run any skill directly via `/skills` or direct skill links). No new npm dependencies. The entry-point skill list (discovery, ideate, reverse-engineer, spike, improve) is hardcoded in the launcher; deferred to Phase 5 for config.yml parameterization if this list changes frequently.

Given the operator opens the skill launcher in the dashboard,
When the launcher renders,
Then only 5 primary CTA buttons are shown (discovery, ideate, reverse-engineer, spike, improve), all other skills are hidden, and an advanced affordance (e.g., "View all skills" link or a separate "Advanced" section) allows operators to access the full skill list if needed.

Out of scope:
- Config.yml parameterization of entry-point skill list (hardcoded for MVP; deferred to Phase 5)
- Skill search or filtering within the advanced access path (all skills shown in a flat list or scrollable view)
- Grouping or categorization of chained skills (hidden entirely; no internal organization)
- Sorting or re-ordering of primary CTAs (fixed order: discovery → ideate → reverse-engineer → spike → improve)

Dependencies: None (standalone launcher redesign; does not depend on signals aggregator or route handler)

NFR:
- Visual clarity: primary CTAs are immediately prominent; advanced access is discoverable but not distracting
- Accessibility: all CTA buttons are keyboard-navigable and screen-reader accessible

Complexity: 1
Scope stability: Stable

## Epic 2 — Signal seeding & `/improve` loop closure

Goal: Operators can click a signal's CTA, seed a skill session with that signal as context, and run the full `/improve` skill execution path from the web UI to completion, producing improvement proposals. The improvement loop (signal → seed → session → proposal) is fully accessible end-to-end without CLI or IDE access.

Out of scope:
- Signal filtering, sorting, dismissal, or bulk actions (deferred to Phase 5 UX enhancements)
- Automated scheduling or CI-triggered `/improve` runs (MVP is operator-triggered only)
- Cross-repo or cross-team signal aggregation (single-repo only; Phase 6 enterprise federation)
- Caching or performance optimization beyond the walking skeleton (Phase 5 performance story)
- Multi-tenant per-tenant signal isolation (deferred; MVP assumes single workspace per deployment)

Oversight: Medium
Oversight rationale: Signal seeding requires correct injection of signal context into the skill session model (ADR-023 artefact-content injection); `/improve` execution may have multi-turn or multi-file-read patterns not yet tested in the web UI. Medium oversight ensures the session model handles signal seeds correctly before full closure.

Complexity: 2
Scope stability: Unstable (depends on `/improve` skill's actual execution model in web UI, which is unconfirmed)