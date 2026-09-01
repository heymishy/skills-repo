## Story: Feature Discovery from Pipeline-State Index
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Discovery reference:** artefacts/new-feature-af17f555/discovery.md
**Benefit-metric reference:** artefacts/new-feature-af17f555/benefit-metric.md
## User Story
As a **Platform owner**,
So that [observable outcome].
## Benefit Linkage
[Not specified by the definition session]
## Architecture Constraints
ADR-023 (disk canonical), ADR-009 (injectable adapters), no new npm dependencies
## Dependencies
None
## Acceptance Criteria
**So that** I can see all in-progress features I've started in Claude Code, I need the web UI to read `.github/pipeline-state.json` and display them in the skill picker.

**Given** a connected repo with `.github/pipeline-state.json` containing at least one feature at stage ≠ [completed, archived, released],
**When** I open the web UI skill picker,
**Then** I see all non-terminal features listed with name, current stage badge, last modified date, and a "Continue" button.
## Out of Scope
- Two-way conflict resolution between surfaces
- Real-time sync or background polling
- Archive/release workflow automation
- Search or filtering by feature properties
## NFRs
Feature list fetch ≤2 seconds; graceful fallback if pipeline-state.json unreachable; terminal stages (completed, archived, released) excluded; stalled features included
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
