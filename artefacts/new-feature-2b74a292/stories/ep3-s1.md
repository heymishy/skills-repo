## Story: Request Regression to Earlier Stage
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** web-ui
## User Story
As a **Team collaborator (any role)**,
So that Reversibility with audit trail — completing this story enables the regression flow..
## Benefit Linkage
Reversibility with audit trail — completing this story enables the regression flow.
## Architecture Constraints
Feature stage is reset to the target stage; all downstream stages are marked as incomplete; prior feature_approvals records remain (not deleted, for audit); ADR-025 (tenant scoping — regression is a tenant-scoped operation).

Given Susan is at the DoR stage of Feature A1 and realises the definition needs revision,
When she clicks "Request Regression" and selects "definition" stage, enters reason "Definition is missing architecture constraints for multi-tenancy", and submits,
Then the feature regresses to definition stage, DoR and later stages show "incomplete", the feature_approvals records for DoR and later are preserved (not deleted), and a new decisions.md entry is created: "2025-01-30 — Regression to definition requested by Susan (engineer) — reason: Definition is missing architecture constraints for multi-tenancy".
## Dependencies
ep2-s3 (approval records exist)
## Acceptance Criteria
Given Susan is at the DoR stage of Feature A1 and realises the definition needs revision,
When she clicks "Request Regression" and selects "definition" stage, enters reason "Definition is missing architecture constraints for multi-tenancy", and submits,
Then the feature regresses to definition stage, DoR and later stages show "incomplete", the feature_approvals records for DoR and later are preserved (not deleted), and a new decisions.md entry is created: "2025-01-30 — Regression to definition requested by Susan (engineer) — reason: Definition is missing architecture constraints for multi-tenancy".
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
