## Story: Assign Pod to Product as Default
**Epic reference:** artefacts/new-feature-2b74a292/epics/pod-formation-product-assignment.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Product owner**,
I want **to assign an existing pod as the default team for a product**,
So that **all new features in that product automatically inherit the team without per-feature setup**.
## Benefit Linkage
Synchronous team access — completing this story enables pod reuse across multiple features; the second step in the walking skeleton.
## Architecture Constraints
ADR-026 (canonical builders — getProductDefaultPod() is the single builder for this derived structure); ADR-025 (tenant scoping); new pod_assignments table with assignmentType: inherit-to-all-features.
## Dependencies
ep1-s1 (pod must exist before assignment)
## Acceptance Criteria
**AC1:** Given a product owner is in Product settings for "Payments", When they select "Set default pod" and choose "Core Platform Pod", Then the assignment is saved to pod_assignments (assignmentType: inherit-to-all-features), and Product settings shows "Default pod: Core Platform Pod (3 members)" immediately, with no page refresh needed.

**AC2:** Given "Payments" now has default pod "Core Platform Pod", When a product owner creates a new feature under "Payments", Then the new feature shows "Assigned pods: Core Platform Pod (3 members)" automatically, with no manual assignment step.

**AC3:** Given "Payments" already has existing features created before any default pod was set, When a product owner sets "Core Platform Pod" as the new default, Then none of those existing features' pod assignments change — only features created after this point inherit the new default.
## Out of Scope
- Changing a product's default pod after features are created (deferred to Epic 4)
- Unassigning a product's default pod (deferred)
## NFRs
- Default pod assignment is visible immediately in product settings (no refresh needed)
- Feature creation detects product default and auto-assigns within the feature-create flow
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
