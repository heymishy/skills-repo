## Story: Error Handling and Graceful Degradation
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Discovery reference:** artefacts/new-feature-af17f555/discovery.md
**Benefit-metric reference:** artefacts/new-feature-af17f555/benefit-metric.md
## User Story
As a **Platform owner**,
So that [observable outcome].
## Benefit Linkage
[Not specified by the definition session]
## Architecture Constraints
ADR-009 (error handling preserves injectable adapter pattern; errors caught, not propagated), no new npm dependencies
## Dependencies
ep1-s2, ep1-s3, ep1-s4
## Acceptance Criteria
**So that** transient file I/O errors, encoding issues, or missing artefacts do not block feature continuation, I need the web UI to log errors and gracefully degrade.

**Given** any error: pipeline-state.json unreachable, artefact file missing, artefact file unreadable, journey backfill fails, stage routing indeterminate,
**When** error occurs,
**Then** web UI logs error to server stdout and PostHog, excludes affected component, allows session to start. Operator receives minimal, non-blocking disclosure if critical data missing (e.g., "Feature history incomplete — some prior artefacts could not be loaded").
## Out of Scope
- Automatic retry logic or exponential backoff
- User-initiated "reload artefacts" button within active session
- Admin dashboard for error monitoring
- Email alerts or Slack notifications
## NFRs
No error blocks session start (graceful degradation); all errors logged with context (featureSlug, stage, errorType, timestamp); PostHog events: `artefact_load_error`, `journey_backfill_error`, `stage_routing_error`; operator messages one-liners, non-blocking, in session header
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
