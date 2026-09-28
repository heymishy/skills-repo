## Story: Signals aggregator module: read all 12 sources and normalize to Signal shape
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md

## User Story
As a **Solo operator (you, today)**,
I want **to see improvement opportunities surfaced from all 12 framework sources (capture-log, learnings, proposals, suite, traces, decisions, DoD, estimation, references, pipeline-state)**,
So that **I can discover what the platform itself has learned and what improvements are pending, without leaving the web UI**.

## Benefit Linkage
Parsing all 12 signal sources into a normalized shape is the foundational prerequisite for the benefit-metric's success measurement: "all 12 signal sources are parsed and at least 1 signal from each source type is displayed per active feature." This story delivers the aggregator module that makes source-visibility measurement possible. Without this aggregator, signals remain invisible to the dashboard.

## Architecture Constraints
No new npm runtime dependencies (tech-stack.md); use built-in Node.js `fs` and `path` only. Injectable file-read adapter (D37) with throwing stub for production isolation. Graceful error handling: parse failures on individual sources are surfaced as `signal-type: parse-error` entries, not silent drops, allowing the aggregator to continue parsing remaining sources. Canonical builder pattern (ADR-028): this module is the single source of truth for aggregating signals; no other code in the codebase re-derives aggregation logic. The aggregator returns a deterministic, sorted `Signal[]` array keyed by timestamp (most recent first).

## Dependencies
None (read-only from existing artefacts; no upstream stories). ep1-s2 depends on this story; both may run in parallel if the aggregator interface is frozen before either begins implementation.

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
- Per-source parsing details (capture-log YAML schema strict validation, proposals directory exact folder structure, DoD markdown regex patterns) — ep1-s1 uses basic string/JSON parsing tolerant of variations; per-source robustness and strict parsing are deferred to future stories if signal sources evolve
- Caching or memoization (acceptable <200ms for solo operator scale; deferred to Phase 5 performance story if scale inflection is hit)
- Multi-tenant workspace isolation (MVP assumes single workspace per deployment; per-tenant isolation is Phase 6)
- Signal filtering, sorting by operator preference, or dismissal logic (returned array is ready for dashboard to consume unfiltered; display and filtering are dashboard concerns)
- Automated signal generation or AI summarization (aggregator reads existing structured content only; proposal generation happens in `/improve` skill, not here)

## NFRs
- **Performance:** <200ms for solo operator scale (<2MB workspace files combined) on on-demand parsing. Measured: time from `getSignals()` invocation to return.
- **Graceful degradation:** Parse errors on individual sources do not block remaining sources. A completely unreadable source (permission denied, disk I/O error) is surfaced as one parse-error signal and parsing continues.
- **Robustness:** Invalid JSON (e.g., trailing comma in suite.json), malformed YAML (e.g., indentation errors in capture-log), missing files (proposals/ directory does not exist), and empty directories are handled without throwing an exception. Each is logged as a parse-error signal; the aggregator returns a complete array for all non-errored sources.
- **Deterministic output:** Given the same input files on two separate invocations, the aggregator returns the same `Signal[]` array in the same order (timestamp sort is stable).

## Complexity Rating
**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->

---

## Story: Signals panel route handler: `/api/signals` endpoint
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md

## User Story
As a **Solo operator (you, today)**,
I want **an HTTP endpoint that returns improvement signals as JSON so the dashboard can consume and display them**,
So that **I don't need to know how to parse 12 different file formats; the signals are ready to use**.

## Benefit Linkage
This story enables the dashboard to display signals without reimplementing the aggregation logic. It is the HTTP bridge between the aggregator (ep1-s1) and the web UI frontend, making signals visible to the operator. Without this endpoint, signals remain server-side-only; the benefit-metric's success measurement ("all 12 signal sources are...displayed per active feature") cannot be achieved.

## Architecture Constraints
Implement `GET /api/signals` as a JSON-only endpoint in `src/web-ui/routes/signals.js` following the codebase pattern (ADR-024: the journey-state GET response shape contract). Route handler calls the ep1-s1 aggregator module (`getSignals(repoPath)`) on every request (on-demand, no server-side caching). Returns JSON array only (no HTML rendering; dashboard JavaScript owns rendering the signals panel). Error handling: if the aggregator throws an exception, the endpoint returns HTTP 500 with error details in a structured response (do not return a partial 200). The endpoint must respect the injectable adapter pattern if it calls external modules (D37).

## Dependencies
ep1-s1 (signals aggregator module must be complete and callable). ep1-s1 and ep1-s2 may run in parallel if the aggregator interface is frozen and documented before implementation.

## Acceptance Criteria

**AC1 — Endpoint returns Signal array as JSON:**
Given the ep1-s1 aggregator module is available and the operator makes a request,
When `GET /api/signals` is called with no query parameters,
Then the endpoint returns HTTP 200 with a JSON array of `Signal` objects in the response body. The array is the direct output of the ep1-s1 aggregator (sorted by timestamp, all 12 sources parsed, parse-errors included).

**AC2 — Response includes all required Signal fields:**
Given the endpoint returns a JSON array,
When each Signal object in the array is inspected,
Then every object includes all required fields: `id`, `source`, `type`, `text`, `timestamp`, `cta.label`, `cta.skill`. Optional fields (`context.relatedStory`, `context.featureSlug`, `context.severity`, `context.metadata`) may be present or absent per signal; their presence does not cause a validation failure.

**AC3 — Endpoint gracefully handles aggregator exceptions:**
Given the aggregator throws an exception (e.g., disk I/O error, unexpected file format),
When `GET /api/signals` is called,
Then the endpoint returns HTTP 500 (not 200) with a JSON response including `error: '<error message>'` and `timestamp: <ISO8601>`. No partial response is returned; the client receives either a complete 200 with all signals or a 500 with error details, never a mix.

**AC4 — Endpoint latency is acceptable for solo operator scale:**
Given the aggregator completes parsing in <200ms,
When `GET /api/signals` is called,
Then the endpoint returns a response in <250ms (aggregator latency <200ms + route handler overhead <50ms). Measured end-to-end from HTTP request arrival to response transmission.

**AC5 — Endpoint is cacheable and repeatable:**
Given the endpoint is called twice in succession (with no file changes on disk between calls),
When the responses are compared,
Then both responses contain the same Signal array in the same order. The endpoint does not introduce non-determinism (no random IDs, no timestamp-based sorting variance).

## Out of Scope
- Signal filtering by source, type, severity, or feature slug (endpoint returns all signals unfiltered; filtering is a dashboard/frontend concern or deferred to Phase 5 enhancement)
- Caching or memoization on the server side (on-demand parsing acceptable for solo operator scale; caching deferred to Phase 5 performance story if scale inflection is hit)
- HTML rendering or template generation (endpoint is JSON-only; rendering owned by dashboard JavaScript)
- Multi-tenant signal isolation or per-tenant signal filtering (endpoint returns all signals from current repo's workspace; per-tenant isolation is Phase 6)
- OpenAPI/Swagger documentation (API is internal; documentation deferred or handled via code comments)

## NFRs
- **Endpoint latency:** <250ms for solo operator scale (aggregator <200ms + route overhead <50ms). Measured: HTTP request arrival to response transmission completion.
- **Error handling:** Any exception from the aggregator is caught and returned as HTTP 500 with error summary in JSON format. No exceptions propagate to the HTTP handler; the client always receives a valid HTTP response.
- **Response shape consistency:** Every `Signal` object in the response follows the documented schema. No fields are null unless explicitly optional; required fields are always present.
- **Repeatability:** Calling the endpoint twice with no file changes on disk returns identical responses in identical order.

## Complexity Rating
**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->

---

## Story: Skill launcher redesign: show 5 primary CTAs, hide chained skills
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md

## User Story
As a **Solo operator (you, today)**,
I want **the skill launcher to show only 5 valid entry-point skills (discovery, ideate, reverse-engineer, spike, improve) as primary CTAs and hide all 27+ chained skills**,
So that **I can quickly see which skills start a new pipeline run, rather than wading through 41+ equally-presented options**.

## Benefit Linkage
Rationalizing the skill launcher directly addresses the benefit-metric's success measurement: "Skill entry points are rationalized and clear" moves from 0% (all 41+ skills shown as equal CTAs, current state) to 100% (5 primary CTAs shown prominently, chained skills hidden or de-emphasized, advanced access preserved). This story increases operator clarity and reduces cognitive load on the dashboard's primary entry point.

## Architecture Constraints
Modify `src/web-ui/skill-launcher.js` (the skill picker component) to conditionally render only 5 primary CTAs and hide chained skills. The entry-point skill list (discovery, ideate, reverse-engineer, spike, improve) is hardcoded in the launcher as a constant (`const PRIMARY_SKILLS = [...]`); parameterization via context.yml is deferred to Phase 5. Preserve backward compatibility: advanced operators must still be able to run any skill directly via a secondary affordance (an "Advanced" or "All skills" link/button) that displays all 41+ skills. No new npm dependencies. The advanced affordance is implemented as a collapsible "Advanced skills" section below the primary CTAs, labeled distinctly and visually de-emphasized (smaller text, lower contrast, or collapsed state by default).

## Dependencies
None (standalone launcher redesign). This story does not depend on ep1-s1 or ep1-s2, though its own benefit is maximized when signals are visible (ep1-s1 + ep1-s2) so operators understand why `/improve` is now a primary CTA.

## Acceptance Criteria

**AC1 — Primary CTAs are rendered and prominently displayed:**
Given the operator opens the skill launcher on the dashboard,
When the launcher component renders,
Then exactly 5 CTA buttons are displayed in the primary section: discovery, ideate, reverse-engineer, spike, improve. Each button includes a label (skill name) and is keyboard-navigable (Tab order, Enter to activate). Primary CTAs occupy the top 50% of the launcher panel and use larger text/button sizing compared to the advanced section.

**AC2 — Chained skills are hidden by default:**
Given the launcher has rendered the primary section,
When the page is loaded and the operator views the launcher,
Then all 27+ chained skills (clarify, estimate, definition, test-plan, review, dor, implementation-plan, tdd, subagent-execution, verify-completion, trace, decisions, benefit-metric, modernisation-decompose, and all others not in the 5 primary list) are NOT displayed in the primary section. No chained skill is visible unless the operator accesses the advanced affordance.

**AC3 — Advanced affordance provides access to all skills:**
Given the primary skills section is displayed,
When the operator clicks the "Advanced skills" affordance (a collapsible section, link, or toggle button),
Then all 41+ skills (including the 5 primary skills and all 27+ chained skills) are displayed in a complete, unfiltered list. The list is readable and navigable (scrollable if needed, or paginated). Advanced access preserves the backward-compatible ability to run any skill directly.

**AC4 — Advanced affordance is visually de-emphasized:**
Given the advanced affordance is present on the page,
When the page is viewed in a standard browser at normal viewport width,
Then the advanced section is visually distinct from primary CTAs: it uses smaller text size, lower contrast, indentation, or a collapsed state (not expanded by default). An operator reading the launcher first sees the 5 primary CTAs; discovering the advanced affordance requires explicit action (clicking, scrolling, or expanding).

**AC5 — Backward compatibility is preserved:**
Given an advanced operator wants to run a chained skill directly (e.g., `/clarify` or `/estimate` as a standalone session, not chained),
When they click the skill in the advanced affordance,
Then a new skill session launches for that skill. The launcher does not block access to any skill; it only rationalizes the default view.

**AC6 — Entry-point skill list is stable:**
Given the story is implemented and tested,
When the launcher renders in a clean state (no localStorage, no session overrides),
Then the 5 primary CTAs are always discovery, ideate, reverse-engineer, spike, improve. The list does not change based on prior sessions, operator history, or feature state. (Parameterization of this list via context.yml is deferred to Phase 5.)

## Out of Scope
- Parameterization of the entry-point skill list via context.yml (hardcoded for MVP; deferred to Phase 5 if the list changes frequently)
- Skill search or filtering within the advanced access path (all skills shown in a flat list; search is deferred)
- Grouping or categorization of chained skills by stage (discovery → definition → coding, etc.) — advanced section shows all skills unorganized or in a simple scroll list
- Re-ordering or customization of primary CTA sequence (fixed order: discovery → ideate → reverse-engineer → spike → improve)
- Skill descriptions or help text on launcher buttons (labels only; detailed help is deferred)
- Caching or persistence of advanced-section expanded/collapsed state (starts collapsed on every page load)

## NFRs
- **Visual clarity:** Primary CTAs are immediately prominent and discoverable without any additional interaction. Advanced access is accessible but visually de-emphasized so it does not distract from the primary entry points.
- **Accessibility:** All CTA buttons are keyboard-navigable (Tab order, Enter/Space to activate). Screen readers announce button labels and the distinction between primary and advanced sections. Color is not the sole indicator of visual hierarchy; size, contrast, or layout (e.g., indentation) also conveys the distinction.
- **Performance:** Launcher renders in <100ms (no significant latency from the redesign). Advanced section renders on-demand when expanded (lazy-load acceptable).
- **Backward compatibility:** No existing skill workflows are broken. An operator with bookmarks or direct links to any skill can still access and run that skill.

## Complexity Rating
**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->