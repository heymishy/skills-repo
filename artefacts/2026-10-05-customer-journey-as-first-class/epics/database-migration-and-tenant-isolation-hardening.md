## Epic: Database Migration and Tenant Isolation Hardening

**Discovery reference:** artefacts/2026-10-05-customer-journey-as-first-class/discovery.md
**Benefit-metric reference:** artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md
**Slicing strategy:** walking-skeleton

## Goal

The three new Postgres tables (`journeys`, `journey_stages`, `feature_journey_stage_mappings`) are created via an idempotent migration script, and all journey routes are covered by adversarial tenant isolation tests verifying that cross-tenant access is structurally impossible. This epic is the foundational prerequisite for all other epics and the security backstop for the entire feature.

## Out of Scope

- All journey canvas functionality (Epics 1–4)
- Rollback scripts (deferred)
- Performance/load testing of isolation guards

## Benefit Metrics Addressed

[See benefit-metric artefact: artefacts/2026-10-05-customer-journey-as-first-class/benefit-metric.md]

## Stories in This Epic

- [ ] Database migration: create journeys, journey_stages, and feature_journey_stage_mappings tables — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s1.md
- [ ] Tenant isolation hardening: adversarial path and cross-tenant guard tests for journey routes — artefacts/2026-10-05-customer-journey-as-first-class/stories/ep5-s2.md

## Human Oversight Level

**Oversight:** High
**Rationale:** Database migration and security hardening — any error here has structural consequences for all other epics.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
