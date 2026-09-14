## Story: Archive a Pod and Preserve Audit Trail
**Epic reference:** artefacts/new-feature-2b74a292/epics/advanced-pod-operations.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Organisation administrator**,
I want **to mark a pod as archived instead of deleting it**,
So that **unused pods stop cluttering active dropdowns, without losing the historical record of which features used them**.
## Benefit Linkage
Operational housekeeping (no direct metric linkage)
## Architecture Constraints
pods.status field is updated to "archived"; archived pods remain in pod_members and pod_assignments (not deleted); new pods are not offered in dropdowns if archived.
## Dependencies
ep1-s1 (pods exist)
## Acceptance Criteria
**AC1:** Given the "Legacy Platform Pod" is no longer used, When an org admin navigates to Pod Manager and clicks "Archive" on that pod, Then the action completes without requiring confirmation beyond the click (per NFR: archival is immediate).

**AC2:** Given the pod has been archived, When its status is inspected, Then pods.status is "archived", and it no longer appears in the "Assign pod" dropdown for new assignments.

**AC3:** Given features that were already using this pod before archival, When those features' collaborator/audit views are inspected, Then the pod's members are still listed there — archival does not remove or hide historical usage.
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
