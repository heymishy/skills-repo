## Story: Archive a Pod and Preserve Audit Trail
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Organisation administrator**,
So that Operational housekeeping (no direct metric linkage).
## Benefit Linkage
Operational housekeeping (no direct metric linkage)
## Architecture Constraints
pods.status field is updated to "archived"; archived pods remain in pod_members and pod_assignments (not deleted); new pods are not offered in dropdowns if archived.

Given the "Legacy Platform Pod" is no longer used,
When an org admin navigates to Pod Manager and clicks "Archive" on that pod,
Then the pod status is set to "archived", it no longer appears in the "Assign pod" dropdown, but existing features using it remain unchanged (members still listed for audit).
## Dependencies
ep1-s1 (pods exist)
## Acceptance Criteria
Given the "Legacy Platform Pod" is no longer used,
When an org admin navigates to Pod Manager and clicks "Archive" on that pod,
Then the pod status is set to "archived", it no longer appears in the "Assign pod" dropdown, but existing features using it remain unchanged (members still listed for audit).
## Out of Scope
- Bulk archival
- Un-archiving a pod (deferred)
- Merging archived pods
## NFRs
- Archival is immediate (no background job)
- Archived pods remain visible in feature audit trail
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
