## Story: Request Regression to Earlier Stage
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator (any role)**,
I want **to send the feature back to an earlier stage with a reason**,
So that **the team can revisit and fix something without losing the audit trail of what was already approved**.
## Benefit Linkage
Reversibility with audit trail — completing this story enables the regression flow.
## Architecture Constraints
Feature stage is reset to the target stage; all downstream stages are marked as incomplete; prior feature_approvals records remain (not deleted, for audit); ADR-025 (tenant scoping — regression is a tenant-scoped operation).
## Dependencies
ep2-s3 (approval records exist)
## Acceptance Criteria
**AC1:** Given Susan is at the DoR stage of Feature A1, When she clicks "Request Regression", Then she is presented with a stage selector and a reason field, and submits her choice ("definition") with a reason.

**AC2:** Given the regression request has been submitted, When it is processed, Then the feature's stage resets to "definition" and every stage between definition and DoR (inclusive of DoR) is marked "incomplete".

**AC3:** Given the feature has regressed, When feature_approvals is inspected, Then the approval records for DoR and the stages after it still exist (not deleted) — preserved for audit even though those stages are now marked incomplete.
## Out of Scope
- Approval gate for regression (auto-accept for MVP)
- Partial regression (all-or-nothing per stage)
- Reverting specific edits (stage-level only)
## NFRs
- Regression completes within 1s
- Prior approvals are preserved (not deleted)
- Stage marks are immediately updated (no refresh needed)
## Complexity Rating
**Rating:** 2
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
