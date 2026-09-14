## Story: Load Feature with Pod Collaborators and Present Presence Sidebar
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator (any role)**,
I want **to see who else is actively working on this feature, and their role**,
So that **I know who's involved before I start contributing**.
## Benefit Linkage
Synchronous team access — completing this story enables real-time awareness; the first step in collaborative delivery.
## Architecture Constraints
ADR-026 (canonical builder: getFeatureCollaborators() resolves the effective team); new feature_presence table with heartbeat logic; SSE stream for presence updates.
## Dependencies
ep1-s3 (feature must have collaborators assigned)
## Acceptance Criteria
**AC1:** Given Hamish is logged in and loads Feature A1, When the page renders, Then a "Team" sidebar appears listing every collaborator on the feature (Hamish, Susan, Darren) with their role.

**AC2:** Given the Team sidebar is showing Darren as online, When Darren's session goes 30+ seconds without a heartbeat, Then the sidebar updates Darren's status to offline within the next presence broadcast, without a page refresh.

**AC3:** Given Darren's status has changed to offline, When Hamish views the sidebar, Then it shows "Darren (engineer, offline — last seen 10m ago)" with a live-updating last-seen timestamp.
## Out of Scope
- Presence-based locking (preventing edits if another user is editing the same artefact)
- Notifications when a team member comes online
- Do-Not-Disturb or custom status per user
## NFRs
- Presence updates within 30s (SSE heartbeat)
- Sidebar is always visible, not hidden behind a menu
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
