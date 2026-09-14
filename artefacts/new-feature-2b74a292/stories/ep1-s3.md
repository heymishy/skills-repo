## Story: Feature Inherits Product Default Pod on Creation
**Epic reference:** artefacts/new-feature-2b74a292/epics/pod-formation-product-assignment.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Product owner**,
So that Synchronous team access — completing this story closes the foundation epic: a feature is now created with its team pre-assigned..
## Benefit Linkage
Synchronous team access — completing this story closes the foundation epic: a feature is now created with its team pre-assigned.
## Architecture Constraints
ADR-026 (canonical builder: getFeatureCollaborators() derives the effective collaborator list from pod assignments); ADR-025 (tenant scoping); new feature_collaborators table pre-populated at feature creation.

Given "Payments" product has default pod "Core Platform Pod",
When a product owner creates a new feature "Feature A1",
Then the feature automatically has podAssignments: [Core Platform Pod], and feature_collaborators is pre-populated with Hamish, Susan, Darren (all marked as pod members from Core Platform Pod).
## Dependencies
ep1-s2 (product must have default pod set)
## Acceptance Criteria
Given "Payments" product has default pod "Core Platform Pod",
When a product owner creates a new feature "Feature A1",
Then the feature automatically has podAssignments: [Core Platform Pod], and feature_collaborators is pre-populated with Hamish, Susan, Darren (all marked as pod members from Core Platform Pod).
## Out of Scope
- Allowing the product owner to override the pod assignment during feature creation (deferred to Epic 2)
- Listing pod members in the feature creation UI (deferred to Epic 2 UI stories)
## NFRs
- Feature creation completes in ≤2s
- Collaborators are visible in feature settings immediately after creation
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
