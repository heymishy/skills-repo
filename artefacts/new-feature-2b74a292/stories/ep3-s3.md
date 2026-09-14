## Story: Re-Sign-Off After Regression (Approval Record with Prior Context)
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator with approval responsibility (same role as original sign-off)**,
So that Reversibility with audit trail — completing this story closes the regression loop: regress → revise → re-approve → move forward..
## Benefit Linkage
Reversibility with audit trail — completing this story closes the regression loop: regress → revise → re-approve → move forward.
## Architecture Constraints
New feature_approvals record with a reApprovalOf field linking back to the original approval being re-done; decisions.md entry is appended with re-approval context.

Given Susan has regressed Feature A1 to definition and made the necessary revisions,
When the revised definition is ready and she clicks "Sign Off" at the definition stage,
Then a new approval is recorded in feature_approvals with reApprovalOf: [original-approval-id], and a decisions.md entry is appended: "2025-01-30 — Definition re-approved by Susan (engineer) — updated: Architecture constraints for multi-tenancy added".
## Dependencies
ep3-s1 (regression must have occurred); ep3-s2 (decisions.md entry)
## Acceptance Criteria
Given Susan has regressed Feature A1 to definition and made the necessary revisions,
When the revised definition is ready and she clicks "Sign Off" at the definition stage,
Then a new approval is recorded in feature_approvals with reApprovalOf: [original-approval-id], and a decisions.md entry is appended: "2025-01-30 — Definition re-approved by Susan (engineer) — updated: Architecture constraints for multi-tenancy added".
## Out of Scope
- Requiring a different approver for re-approval (same as original for MVP)
- Approval workflow changes based on prior regression
## NFRs
- Re-approval is treated identically to a first approval in terms of state advance
- Prior approval and re-approval are linked in audit trail
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
