## Story: Assign Multiple Pods to a Feature (Subset Selection)
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Product owner or feature lead**,
So that Synchronous team access — completing this story enables flexible team assembly..
## Benefit Linkage
Synchronous team access — completing this story enables flexible team assembly.
## Architecture Constraints
pod_assignments supports multiple records per feature; feature_collaborators is derived from the union of all assigned pods (minus explicitly-removed members); ADR-026 (canonical builder: getFeatureCollaborators() handles multi-pod resolution).

Given Feature A2 needs Hamish, Susan, Darren from Core Platform Pod, plus Alice from Data Analytics Pod,
When a product owner navigates to Feature A2 settings and clicks "Assign pods", selects both Core Platform Pod and Data Analytics Pod, then removes Bob from Data Analytics Pod (for this feature only),
Then Feature A2's collaborators are: Hamish, Susan, Darren, Alice (Bob remains in the pod globally, just not assigned to this feature).
## Dependencies
ep1-s1 (pods must exist); ep1-s3 (feature creation)
## Acceptance Criteria
Given Feature A2 needs Hamish, Susan, Darren from Core Platform Pod, plus Alice from Data Analytics Pod,
When a product owner navigates to Feature A2 settings and clicks "Assign pods", selects both Core Platform Pod and Data Analytics Pod, then removes Bob from Data Analytics Pod (for this feature only),
Then Feature A2's collaborators are: Hamish, Susan, Darren, Alice (Bob remains in the pod globally, just not assigned to this feature).
## Out of Scope
- Creating a new pod as part of this story (create via ep1-s1)
- Dynamically changing pod members mid-feature (ep4-s2)
## NFRs
- Multi-pod assignment UI completes within 1s
- feature_collaborators is recalculated within 2s of change
## Complexity Rating
**Rating:** 2
**Scope stability:** Unstable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
