## Story: Dynamically Add/Remove Pod Members Mid-Feature (Feature-Level Override)
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Feature lead or team lead**,
So that Synchronous team access — completing this story enables team flexibility..
## Benefit Linkage
Synchronous team access — completing this story enables team flexibility.
## Architecture Constraints
New feature_collaborator_overrides table (featureId, userId, action: add|remove, reason, timestamp); getFeatureCollaborators() applies overrides on top of pod assignments (canonical builder pattern, ADR-026).

Given Feature A1 is in the discovery stage and the team realises a designer is needed,
When the feature lead clicks "Add team member", selects "Maya (designer)" who is not in the Core Platform Pod, and saves,
Then Maya is added to Feature A1's collaborators (override record created), and she can immediately access the feature. Her presence appears in the team sidebar.
## Dependencies
ep2-s1 (presence); ep4-s1 (multi-pod foundation)
## Acceptance Criteria
Given Feature A1 is in the discovery stage and the team realises a designer is needed,
When the feature lead clicks "Add team member", selects "Maya (designer)" who is not in the Core Platform Pod, and saves,
Then Maya is added to Feature A1's collaborators (override record created), and she can immediately access the feature. Her presence appears in the team sidebar.
## Out of Scope
- Approval gates for mid-feature member changes (deferred)
- Notifying newly-added members (deferred)
## NFRs
- Member addition is visible within 30s (SSE update)
- Removed members lose access immediately (session invalidation check on next request)
## Complexity Rating
**Rating:** 2
**Scope stability:** Unstable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
