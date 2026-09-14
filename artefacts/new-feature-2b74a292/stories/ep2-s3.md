## Story: Sign-Off at a Stage (Approval Record & Advance)
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator with approval responsibility (product lead for discovery, tech lead for DoR, etc.)**,
So that Sign-off and accountability — completing this story delivers formal approval and attribution..
## Benefit Linkage
Sign-off and accountability — completing this story delivers formal approval and attribution.
## Architecture Constraints
New feature_approvals table (featureId, stageId, approverId, approvalTime, decision, reason); ADR-024 (GET /api/journey/:id response shape is canonical — approverId and approvalTime are added to the response); ADR-020 (authenticated user's token for write-back).

Given Hamish (conductor) is at the discovery stage of Feature A1 and clicks "Sign Off",
When a modal appears asking for approval reason and he enters "Discovery is complete; personas, pain points, and scope are locked" and clicks "Approve",
Then the approval is recorded in feature_approvals, the feature advances to benefit-metric stage, and a decisions.md entry is auto-generated: "2025-01-30 — Discovery approved by Hamish (conductor) — reason: Discovery is complete; personas, pain points, and scope are locked".
## Dependencies
ep2-s1 (presence/collaborators must be loaded); ep2-s2 (role-filtered visibility)
## Acceptance Criteria
Given Hamish (conductor) is at the discovery stage of Feature A1 and clicks "Sign Off",
When a modal appears asking for approval reason and he enters "Discovery is complete; personas, pain points, and scope are locked" and clicks "Approve",
Then the approval is recorded in feature_approvals, the feature advances to benefit-metric stage, and a decisions.md entry is auto-generated: "2025-01-30 — Discovery approved by Hamish (conductor) — reason: Discovery is complete; personas, pain points, and scope are locked".
## Out of Scope
- Approval workflows (e.g. require two sign-offs before advancing)
- Conditional approvals (approve with requested-revision, blocking advance)
- Email notifications on approval
## NFRs
- Approval modal appears within 500ms of "Sign Off" click
- Feature advances to next stage within 2s of approval
- decisions.md entry is auto-generated and committed to the feature branch
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
