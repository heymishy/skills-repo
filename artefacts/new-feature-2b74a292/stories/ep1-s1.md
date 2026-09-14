## Story: Create Pod UI and Backend
**Epic reference:** artefacts/new-feature-2b74a292/epics/pod-formation-product-assignment.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Organisation administrator**,
So that Synchronous team access — completing this story enables the first step: a pod exists and can be assigned to products..
## Benefit Linkage
Synchronous team access — completing this story enables the first step: a pod exists and can be assigned to products.
## Architecture Constraints
ADR-025 (multi-tenancy at application layer — pod is tenant-scoped); ADR-026 (reuse existing entity shape when possible); new schema fields added to pipeline-state.schema.json simultaneously.

Given an organisation admin is logged in and navigates to Pod Manager,
When they click "Create Pod", enter name "Core Platform", add members Hamish (conductor), Susan (engineer), Darren (engineer), and save,
Then the pod is created in the pods table, members are added to pod_members, and the admin sees "Pod created: Core Platform (3 members)".
## Dependencies
None (new schema, no upstream story)
## Acceptance Criteria
Given an organisation admin is logged in and navigates to Pod Manager,
When they click "Create Pod", enter name "Core Platform", add members Hamish (conductor), Susan (engineer), Darren (engineer), and save,
Then the pod is created in the pods table, members are added to pod_members, and the admin sees "Pod created: Core Platform (3 members)".
## Out of Scope
- Editing existing pods (create-only for MVP)
- Archiving pods
- Pod templates
## NFRs
- Pod names are unique per tenant
- Pod creation completes within 2s
- Role definitions are validated against org's known roles
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
