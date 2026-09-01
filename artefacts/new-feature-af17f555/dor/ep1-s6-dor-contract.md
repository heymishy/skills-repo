# Contract Proposal: Audit Logging and PostHog Instrumentation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s6.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-01

---

## What will be built

A unified instrumentation layer covering 6 named success-path events (feature discovered, feature selected, journey backfilled, artefact loaded, session started from CLI-progressed feature, stage navigation) plus ep1-s5's 3 named error events under one consistent shape:

1. Every event logs to server stdout with a `[cross-channel]` prefix and structured JSON fields: `featureSlug`, `stage`, `eventType`, `timestamp`, `operatorId` (when available).
2. Every event also emits to PostHog with the same base fields plus event-specific details (`artefactCount`, `loadTimeMs`, `errorType` where relevant).
3. PostHog calls are fire-and-forget — a PostHog-side failure is caught and logged, never propagated to block the caller.

## What will NOT be built

- A real-time analytics dashboard — PostHog is for asynchronous analysis only
- An operator-facing logging UI or trace view
- Retention policy or data deletion workflows for these events
- Custom PostHog cohort or funnel definitions

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 (6 success events + 3 error events, consistent shape, fire-and-forget PostHog) | Unit tests per event type + integration tests for full-lifecycle event sequencing and instrumentation-transparency (does not alter observed behaviour) | Unit + Integration |

## Assumptions

- The PostHog client is already initialized elsewhere in the codebase (per Architecture Constraints) — this story wires new event emission calls, it does not set up the client itself.
- ep1-s5's 3 error event types (`artefact_load_error`, `journey_backfill_error`, `stage_routing_error`) are the complete set of error events this story needs to bring into the unified shape — no new error conditions are introduced by this story.
- This story is purely observational — it must not change the behaviour of ep1-s1 through ep1-s5, only observe and report on it (verified explicitly by the "Instrumentation does not alter the behaviour it observes" integration test).

## Estimated touch points

Files: instrumentation module (exact path TBD at `/implementation-plan`, likely a shared logging helper called from each of ep1-s1–s5's implementations in `src/web-ui/routes/skills.js`). Services: PostHog client (existing). Depends on: ep1-s1 through ep1-s5 (instruments all of them; is the last story in the epic).
