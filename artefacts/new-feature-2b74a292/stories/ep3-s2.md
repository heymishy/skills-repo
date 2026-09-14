## Story: Auto-Generate decisions.md Entry on Regression
**Epic reference:** artefacts/new-feature-2b74a292/epics/reversibility-audit-trail.md
**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Domain:** software-engineering
## User Story
As a **Audit / compliance (implicit; entry is auto-generated)**,
I want **every regression to be automatically documented with who, why, and when**,
So that **there's a durable, auditable record without relying on someone remembering to write it manually**.
## Benefit Linkage
Reversibility with audit trail — completing this story ensures the regression is documented.
## Architecture Constraints
decisions.md is already the canonical decisions register for the feature (created at discovery); new entries are appended with regression context (date, user, reason, stage reverted to); ADR-029 (disk is canonical — regression entry is written to disk, not just pipeline-state.json).
## Dependencies
ep3-s1 (regression must occur); requires decisions.md to exist on the feature
## Acceptance Criteria
**AC1:** Given Susan requests a regression (ep3-s1), When the regression is processed, Then a new entry is appended to artefacts/[feature]/decisions.md.

**AC2:** Given the entry has been appended, When it is inspected, Then it contains date, session-phase: regression, decision, reason, actor, and stageReverted fields, all populated from the actual regression request (not placeholders).

**AC3:** Given the regression has just completed, When decisions.md is read from disk, Then the new entry is present within 2 seconds of the regression completing — no delayed/batched write.
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
