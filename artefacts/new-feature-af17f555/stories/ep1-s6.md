## Story: Audit Logging and PostHog Instrumentation
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Discovery reference:** artefacts/new-feature-af17f555/discovery.md
**Benefit-metric reference:** artefacts/new-feature-af17f555/benefit-metric.md
## User Story
As a **Platform owner**,
So that [observable outcome].
## Benefit Linkage
[Not specified by the definition session]
## Architecture Constraints
PostHog client already initialized (no new dependency), log format matches existing server conventions, no new npm dependencies
## Dependencies
ep1-s1 through ep1-s5
## Acceptance Criteria
**So that** the platform team can measure adoption, debug issues, and validate benefit metrics, I need all cross-channel continuity events logged and emitted to PostHog.

**Given** any event: feature discovered, feature selected, journey backfilled, artefact loaded, session started from CLI-progressed feature, stage navigation, error encountered,
**When** event occurs,
**Then** event logged to server stdout with [cross-channel] prefix and structured fields (featureSlug, stage, eventType, timestamp, operatorId if available), and emitted to PostHog with same fields plus event-specific details (artefactCount, loadTimeMs, errorType).
## Out of Scope
- Real-time analytics dashboard (PostHog for asynchronous analysis only)
- Operator-facing logging UI or trace view
- Retention policy or data deletion workflows
- Custom PostHog cohort or funnel definitions
## NFRs
All PostHog events include featureSlug, stage, eventType, timestamp, userId; server logs structured (JSON); PostHog calls fire-and-forget (errors in PostHog do not block session)
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
