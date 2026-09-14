## Story: Load Feature with Pod Collaborators and Present Presence Sidebar
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator (any role)**,
So that Synchronous team access — completing this story enables real-time awareness; the first step in collaborative delivery..
## Benefit Linkage
Synchronous team access — completing this story enables real-time awareness; the first step in collaborative delivery.
## Architecture Constraints
ADR-026 (canonical builder: getFeatureCollaborators() resolves the effective team); new feature_presence table with heartbeat logic; SSE stream for presence updates.

Given Hamish is logged in and loads Feature A1,
When the page renders,
Then a "Team" sidebar appears showing: "Hamish (conductor, online)", "Susan (engineer, online)", "Darren (engineer, offline — last seen 10m ago)". Hamish sees a heartbeat indicator updating Darren's status every 30s.
## Dependencies
ep1-s3 (feature must have collaborators assigned)
## Acceptance Criteria
Given Hamish is logged in and loads Feature A1,
When the page renders,
Then a "Team" sidebar appears showing: "Hamish (conductor, online)", "Susan (engineer, online)", "Darren (engineer, offline — last seen 10m ago)". Hamish sees a heartbeat indicator updating Darren's status every 30s.
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
