## Epic: Feature Mapping and Delivery View

**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Slicing strategy:** walking-skeleton

## Goal

Operators can map existing features (from `pipeline-state.json`) to journey stages, select which DoD metric keys from each feature are relevant to that stage, and view a Delivery annotation row on the canvas showing mapped features and metric values. This epic closes the loop between the pipeline's existing delivery evidence and the journey canvas.

## Out of Scope

- Customer experience annotation rows (Epic 3)
- Health indicators (Epic 3)
- Journey list and navigation (Epic 4)
- Database migration (Epic 5)

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md]

## Stories in This Epic

- [ ] Feature picker: read pipeline-state.json and render feature list in modal — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s1.md
- [ ] Feature-to-stage mapping: save mapping with metric key selection — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s2.md
- [ ] Delivery view: feature and metric annotation rows on stage cards — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s3.md

## Human Oversight Level

**Oversight:** High
**Rationale:** Bridges two previously independent data sources (`pipeline-state.json` and the journey Postgres tables); requires correct tenant scoping of all mapping records and read-only handling of `pipeline-state.json`.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
