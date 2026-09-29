## Story: Signals panel route handler: `/api/signals` endpoint
**Epic reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/epics/signals-foundation-launcher-redesign.md
**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/benefit-metric.md
## User Story
As a **Solo operator (you, today)**,
I want **an HTTP endpoint that calls the signals aggregator and returns the normalized Signal array as JSON**,
So that **the dashboard can consume and render improvement signals without needing to know how to read 12 different file formats**.
## Benefit Linkage
Self-improvement loop accessibility — signals visible in web UI (prerequisite for seeding and `/improve` execution).
## Architecture Constraints
`GET /api/signals` JSON endpoint following the codebase pattern (ADR-024: journey-state GET response shape contract). Route handler calls `signals-aggregator.js` on every request (on-demand, no caching). Returns JSON only (no HTML rendering; dashboard JavaScript consumes and renders the signals panel). Graceful error handling: if the aggregator throws an exception, the endpoint returns a 500 with error summary, not a partial 200. Error responses include a `signal-type: endpoint-error` entry for visibility.
## Dependencies
ep1-s1 (signals aggregator must exist and be callable)
## Acceptance Criteria
Given the signals aggregator module is available and the operator accesses the dashboard,
When `GET /api/signals` is called,
Then the route handler calls the aggregator, receives a `Signal[]` array, and returns it as JSON with 200 status code. If aggregator throws, the endpoint returns 500 with error details.
## Out of Scope
- Signal filtering by source, type, severity, or feature slug (aggregator returns all signals; filtering deferred to dashboard or Phase 5 enhancement)
- Caching or performance optimization
- HTML rendering of signals panel (dashboard JavaScript owns rendering; this is JSON-only)
- Multi-tenant signal isolation (returns all signals from current repo's workspace)
## NFRs
- Endpoint latency: <250ms for solo operator scale (aggregator <200ms + route overhead <50ms)
- Error handling: any exception from aggregator is caught and returned as a 500 response with error summary, not propagated to caller
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
