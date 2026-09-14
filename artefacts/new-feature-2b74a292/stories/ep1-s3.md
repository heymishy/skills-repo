## Story: Feature Inherits Product Default Pod on Creation
**Epic reference:** artefacts/new-feature-2b74a292/epics/pod-formation-product-assignment.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Product owner**,
I want **a newly-created feature to automatically inherit its product's default pod**,
So that **I don't have to manually assign a team to every new feature**.
## Benefit Linkage
Synchronous team access — completing this story closes the foundation epic: a feature is now created with its team pre-assigned.
## Architecture Constraints
ADR-026 (canonical builder: getFeatureCollaborators() derives the effective collaborator list from pod assignments); ADR-025 (tenant scoping); new feature_collaborators table pre-populated at feature creation.
## Dependencies
ep1-s2 (product must have default pod set)
## Acceptance Criteria
**AC1:** Given "Payments" product has default pod "Core Platform Pod", When a product owner creates a new feature "Feature A1", Then the feature is created with podAssignments: [Core Platform Pod] recorded against it.

**AC2:** Given the feature has been created with podAssignments: [Core Platform Pod], When feature_collaborators is inspected, Then it is pre-populated with every member of Core Platform Pod (Hamish, Susan, Darren), each row referencing the pod as its source.

**AC3:** Given feature_collaborators has been pre-populated, When each collaborator's role is inspected, Then it matches their role in Core Platform Pod exactly (Hamish: conductor, Susan: engineer, Darren: engineer) — no role is dropped or defaulted incorrectly.
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
