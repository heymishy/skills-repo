## Story: Auto-Generate decisions.md Entry on Regression
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** software-engineering
## User Story
As a **Audit / compliance (implicit; entry is auto-generated)**,
So that Reversibility with audit trail — completing this story ensures the regression is documented..
## Benefit Linkage
Reversibility with audit trail — completing this story ensures the regression is documented.
## Architecture Constraints
decisions.md is already the canonical decisions register for the feature (created at discovery); new entries are appended with regression context (date, user, reason, stage reverted to); ADR-029 (disk is canonical — regression entry is written to disk, not just pipeline-state.json).

Given Susan requests regression (see ep3-s1),
When the regression is processed,
Then a new entry is appended to artefacts/[feature]/decisions.md: date: 2025-01-30, session-phase: regression, decision: Regress to definition, reason: Definition is missing architecture constraints for multi-tenancy, actor: Susan (engineer), stageReverted: definition, timestamp: 2025-01-30T14:23:00Z
## Dependencies
ep3-s1 (regression must occur); requires decisions.md to exist on the feature
## Acceptance Criteria
Given Susan requests regression (see ep3-s1),
When the regression is processed,
Then a new entry is appended to artefacts/[feature]/decisions.md: date: 2025-01-30, session-phase: regression, decision: Regress to definition, reason: Definition is missing architecture constraints for multi-tenancy, actor: Susan (engineer), stageReverted: definition, timestamp: 2025-01-30T14:23:00Z
## Out of Scope
- Editing decisions.md entries (append-only for MVP)
- Signing off regression (no approval gate for MVP)
## NFRs
- Entry is written to disk within 2s of regression
- Entry is immediately visible in decisions.md without refresh
## Complexity Rating
**Rating:** 1
**Scope stability:** Stable
## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
