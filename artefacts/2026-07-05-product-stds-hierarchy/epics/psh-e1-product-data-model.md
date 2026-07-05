# Epic: psh-e1 — Product Data Model

**Feature:** 2026-07-05-product-stds-hierarchy
**Epic slug:** psh-e1-product-data-model
**Status:** Not started
**Slicing strategy:** User journey — data model is the foundation layer; must ship first before any navigation, context injection, or kanban story can be built.
**Guardrails availability:** Architecture guardrails checked. Active ADRs in `.github/architecture-guardrails.md` apply. Relevant constraints: ADR-003 (schema-first — any new pipeline-state.json fields must be in schema first), ADR-011 (artefact-first), ADR-017 (flat story nesting in pipeline-state.json), Node.js CommonJS only, no new npm dependencies.

## Rationale

All product-aware features depend on a `products` table in Postgres and on `journeys.product_id` FK being set. Without this schema, no product can be created, selected, or referenced. The existing-journey migration (psh-s2) must also run so that current users are not left with orphaned journeys after the feature ships.

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| psh-s1 | Products and standards Postgres tables and schema | 2 |
| psh-s2 | Existing journey migration — auto-assign to Default product | 2 |

## Out of scope for this epic

- Product creation UI — Epic 2
- Any API routes reading or writing product data — Epic 2 and 3
- Standards content — Epic 5

## Metric linkage

- **M1** (Product setup completion rate): schema is the prerequisite — without it the creation flow cannot be built
- **M2** (Context injection rate): `journeys.product_id` FK is required before context injection can query product context
