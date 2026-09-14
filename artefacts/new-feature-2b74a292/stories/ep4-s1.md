## Story: Assign Multiple Pods to a Feature (Subset Selection)
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Product owner or feature lead**,
I want **to assign more than one pod to a feature, and remove individual members from that combined selection for this feature only**,
So that **a feature can pull in people from multiple teams without needing a brand-new pod just for it**.
## Benefit Linkage
Synchronous team access — completing this story enables flexible team assembly.
## Architecture Constraints
pod_assignments supports multiple records per feature; feature_collaborators is derived from the union of all assigned pods (minus explicitly-removed members); ADR-026 (canonical builder: getFeatureCollaborators() handles multi-pod resolution).
## Dependencies
ep1-s1 (pods must exist); ep1-s3 (feature creation)
## Acceptance Criteria
**AC1:** Given Feature A2 needs members from both Core Platform Pod and Data Analytics Pod, When a product owner navigates to Feature A2 settings and clicks "Assign pods", Then they see a selector listing all of the organisation's pods, allowing more than one to be selected.

**AC2:** Given both pods have been selected, When the product owner removes Bob from Data Analytics Pod for this feature only, Then Bob is excluded from Feature A2's collaborators while remaining a member of Data Analytics Pod globally, unaffected in the pod itself.

**AC3:** Given the assignment has been saved, When feature_collaborators is inspected, Then it contains exactly the union of both pods' members minus Bob (Hamish, Susan, Darren, Alice).
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
