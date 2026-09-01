## Story: Journey Record Backfill from CLI
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Discovery reference:** artefacts/new-feature-af17f555/discovery.md
**Benefit-metric reference:** artefacts/new-feature-af17f555/benefit-metric.md
## User Story
As a **Platform owner**,
So that [observable outcome].
## Benefit Linkage
[Not specified by the definition session]
## Architecture Constraints
ADR-023 (pipeline-state.json authoritative for stage), journey-disk.js schema supports cliAdoptionTimestamp / cliAdoptionArtefactHashes, no new npm dependencies
## Dependencies
ep1-s2
## Acceptance Criteria
**So that** the web UI correctly understands which stages have been completed in Claude Code, I need the web UI to automatically create a journey record on first selection of a CLI-progressed feature.

**Given** a feature selected that has no existing journey record in journey-disk.js,
**When** the session starts,
**Then** a new journey record is created with journeyId, featureSlug, createdAt, updatedAt, completedStages (inferred from pipeline-state.json's stage field), and cliAdoptionTimestamp / cliAdoptionArtefactHashes baseline. PostHog event `journey_backfilled_from_cli` and server log are emitted. Process is idempotent — re-selecting never creates duplicate records.
## Out of Scope
- Conflict resolution if journey record exists with different stage markers
- Manual operator control over backfill (automatic, not gated by approval)
- Cross-surface provenance tracking
- Revision history of journey records
## NFRs
Backfill automatic and silent; idempotency check prevents duplicates; disclosure "Continuing from Claude Code — history before [date] reflects CLI sessions" shown once (non-blocking); audit trail via PostHog + server log
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
