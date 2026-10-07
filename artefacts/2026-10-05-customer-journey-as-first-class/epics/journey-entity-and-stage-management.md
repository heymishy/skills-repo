## Epic: Journey Entity and Stage Management

**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Slicing strategy:** walking-skeleton

## Goal

Operators can create a journey, define its stages with full attribute richness, reorder stages via drag-and-drop, and edit individual stage attributes via a side panel. This epic establishes the foundational journey entity and the stage authoring experience — everything needed for a practitioner to build the skeleton of a journey before features or metrics are attached.

## Out of Scope

- Feature-to-stage mapping (Epic 2)
- Health indicators and customer experience annotation views (Epic 3)
- Navigation links and journey list page (Epic 4)
- Database migration (Epic 5)

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md]

## Stories in This Epic

- [ ] Create journey entity: POST route, Postgres insert, and journey canvas shell — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s1.md
- [ ] Add and name stages: POST route, inline name entry, and stage card rendering — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s2.md
- [ ] Stage side panel: edit all optional attributes — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s3.md
- [ ] Drag-and-drop stage reorder with keyboard alternative — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep1-s4.md

## Human Oversight Level

**Oversight:** High
**Rationale:** First epic of a net-new entity type; establishes data model, route handlers, and stage authoring UX patterns that all subsequent epics depend on.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
