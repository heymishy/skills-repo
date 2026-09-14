## Story: Sign-Off at a Stage (Approval Record & Advance)
**Epic reference:** artefacts/new-feature-2b74a292/epics/feature-collaboration-sign-off.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator with approval responsibility (product lead for discovery, tech lead for DoR, etc.)**,
I want **to formally sign off my stage of the feature with a reason**,
So that **there's a clear, attributable record of who approved what, and the feature advances**.
## Benefit Linkage
Sign-off and accountability — completing this story delivers formal approval and attribution.
## Architecture Constraints
New feature_approvals table (featureId, stageId, approverId, approvalTime, decision, reason); ADR-024 (GET /api/journey/:id response shape is canonical — approverId and approvalTime are added to the response); ADR-020 (authenticated user's token for write-back).
## Dependencies
ep2-s1 (presence/collaborators must be loaded); ep2-s2 (role-filtered visibility)
## Acceptance Criteria
**AC1:** Given Hamish (conductor) is at the discovery stage of Feature A1, When he clicks "Sign Off", Then a modal appears with a text field prompting for an approval reason and an "Approve" button.

**AC2:** Given the modal is open and Hamish enters a reason and clicks "Approve", When the approval is submitted, Then it is recorded in feature_approvals (approverId, approvalTime, reason) and the feature advances from discovery to benefit-metric stage.

**AC3:** Given the approval has been recorded, When decisions.md is inspected, Then a new entry has been auto-appended containing the date, approver, and the reason Hamish entered.
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
