## Story: Dynamically Add/Remove Pod Members Mid-Feature (Feature-Level Override)
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Feature lead or team lead**,
I want **to add someone to the feature's team mid-flight, even if they aren't in any assigned pod**,
So that **the team can adapt as the feature's needs change, without having to restructure a pod**.
## Benefit Linkage
Synchronous team access — completing this story enables team flexibility.
## Architecture Constraints
New feature_collaborator_overrides table (featureId, userId, action: add|remove, reason, timestamp); getFeatureCollaborators() applies overrides on top of pod assignments (canonical builder pattern, ADR-026).
## Dependencies
ep2-s1 (presence); ep4-s1 (multi-pod foundation)
## Acceptance Criteria
**AC1:** Given Feature A1 is in the discovery stage, When the feature lead clicks "Add team member", Then a picker appears allowing selection of any org member, including those not in Core Platform Pod.

**AC2:** Given the feature lead selects Maya (designer, not in Core Platform Pod) and saves, When the addition completes, Then an override record is created and Maya is added to Feature A1's feature_collaborators, with immediate access to the feature.

**AC3:** Given Maya has been added, When another collaborator views the Team sidebar, Then Maya's presence appears there within 30 seconds of her joining.
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
