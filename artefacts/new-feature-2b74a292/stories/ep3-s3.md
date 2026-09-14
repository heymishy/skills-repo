## Story: Re-Sign-Off After Regression (Approval Record with Prior Context)
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator with approval responsibility (same role as original sign-off)**,
I want **to re-approve a stage after revising it post-regression, with the record linked to the original approval**,
So that **the audit trail shows the full regress → revise → re-approve cycle, not just a fresh unrelated approval**.
## Benefit Linkage
Reversibility with audit trail — completing this story closes the regression loop: regress → revise → re-approve → move forward.
## Architecture Constraints
New feature_approvals record with a reApprovalOf field linking back to the original approval being re-done; decisions.md entry is appended with re-approval context.
## Dependencies
ep3-s1 (regression must have occurred); ep3-s2 (decisions.md entry)
## Acceptance Criteria
**AC1:** Given Susan has regressed Feature A1 to definition and made her revisions, When she clicks "Sign Off" at the definition stage, Then a new approval record is created in feature_approvals with reApprovalOf pointing at the original approval's id.

**AC2:** Given the re-approval has been recorded, When the feature's state is checked, Then it has advanced past the definition stage again — the same state transition a first-time approval would trigger.

**AC3:** Given the re-approval is complete, When decisions.md is inspected, Then a new entry has been appended describing the re-approval and what changed, distinct from (not overwriting) the original regression entry.
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
