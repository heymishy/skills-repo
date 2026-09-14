## Epic: Reversibility & Audit Trail

**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A team member can request to regress a feature to an earlier stage (e.g. "we need to revise the definition"), make changes, re-sign-off, and have the entire flow recorded in the audit trail and decisions.md. This closes the MVP feedback loop: move forward, realise a mistake, move back and fix it, then forward again.

## Out of Scope

- Partial regression (reverting only some stages while keeping others complete)
- Approval gates for regression requests (request → auto-accept for MVP)
- Reverting specific edits within a stage (only stage-level regression)
- Approval workflows for regression

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/new-feature-2b74a292/benefit-metric.md]

## Stories in This Epic

- [ ] Request Regression to Earlier Stage — artefacts/new-feature-2b74a292/stories/ep3-s1.md
- [ ] Auto-Generate decisions.md Entry on Regression — artefacts/new-feature-2b74a292/stories/ep3-s2.md
- [ ] Re-Sign-Off After Regression (Approval Record with Prior Context) — artefacts/new-feature-2b74a292/stories/ep3-s3.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** State machine for regression, audit trail updates, and decisions.md entry generation are straightforward; no real-time or concurrent complexity.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
