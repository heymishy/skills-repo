## Epic: Pod Formation & Product Assignment

**Discovery reference:** artefacts/new-feature-2b74a292/discovery.md
**Benefit-metric reference:** artefacts/new-feature-2b74a292/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

An organisation administrator can create reusable team pods and assign them as the default for a product, so all features in that product automatically inherit the team without per-feature setup. This foundation enables features to be born with their team already assigned.

## Out of Scope

- Multi-pod assignment per feature (deferred to Epic 4)
- Dynamic pod membership changes mid-feature (deferred to Epic 4)
- Pod templates or pre-built team structures (deferred)
- Editing or archiving existing pods (deferred)

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/new-feature-2b74a292/benefit-metric.md]

## Stories in This Epic

- [ ] Create Pod UI and Backend — artefacts/new-feature-2b74a292/stories/ep1-s1.md
- [ ] Assign Pod to Product as Default — artefacts/new-feature-2b74a292/stories/ep1-s2.md
- [ ] Feature Inherits Product Default Pod on Creation — artefacts/new-feature-2b74a292/stories/ep1-s3.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** New schema and admin UI, but straightforward CRUD semantics; no complex merging or state machines yet.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
