## Story: Signals panel route handler: `/api/signals` endpoint
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **an HTTP endpoint that calls the signals aggregator and returns the normalized Signal array as JSON**,
So that **the dashboard can consume and render improvement signals without needing to know how to read 12 different file formats**.
## Benefit Linkage
Metric 2 — Improvement signal surfacing (benefit-metric.md): this story is the HTTP bridge between the aggregator (ep1-s1) and the web UI frontend, making signals visible to the operator. Without this endpoint, signals remain server-side-only; the metric's own success measurement ("all 12 signal sources are... displayed per active feature") cannot be achieved.
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
- Signal filtering by source, type, severity, or feature slug (aggregator returns all signals; filtering deferred to dashboard or Phase 5 enhancement)
- Caching or performance optimization
- HTML rendering of signals panel (dashboard JavaScript owns rendering; this is JSON-only)
- Multi-tenant signal isolation (returns all signals from current repo's workspace)
## NFRs
- Endpoint latency: <250ms for solo operator scale (aggregator <200ms + route overhead <50ms)
- Error handling: any exception from aggregator is caught and returned as a 500 response with error summary, not propagated to caller
- Response shape consistency: every Signal object follows the documented schema; no fields are null unless explicitly optional
- Repeatability: calling the endpoint twice with no file changes on disk returns identical responses in identical order
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
