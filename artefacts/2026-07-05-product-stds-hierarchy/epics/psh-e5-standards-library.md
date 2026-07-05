# Epic: psh-e5 — Standards and Patterns Library

**Feature:** 2026-07-05-product-stds-hierarchy
**Epic slug:** psh-e5-standards-library
**Status:** Not started
**Slicing strategy:** User journey — after products exist, operator defines standards, promotes them to org level, and the platform injects them into skill sessions.
**Guardrails availability:** Architecture guardrails checked. Relevant constraints: ADR-011 (artefact-first — new src/ modules for standards management), ADR-022/023 (standards injection follows same B-iii pattern as product context injection), ADR-003 (schema-first — visibility field must be in pipeline-state.schema.json before use), D37 (injectable adapter for standards lookup must throw on stub), MC-SEC-01 (standard names and content sanitised before innerHTML), path traversal guard (ougl) for any standards file writes, Node.js CommonJS only, no new npm dependencies.
**Human oversight level:** Medium

## Rationale

The standards library completes the product hierarchy feature. Operators define product-level standards (reference patterns, coding guides), promote them to org-level for use across all products, and the platform injects applicable standards into skill sessions automatically. Org-level standards apply to all products by default with per-product opt-out. Cross-org sharing is explicitly deferred and signposted.

## Standards table design note (Phase 2 readiness):

The `standards` table created in psh-s1 must include `org_id` and `visibility` columns (`'product'` | `'org'` | `'public'`) from the start. The `'public'` visibility value is reserved for cross-org sharing (Phase 2) and is not exposed in the UI in this feature, but the column and enum value must exist so Phase 2 does not require a schema migration.

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| psh-s8 | Standards definition and management per product | 2 |
| psh-s9 | Org-level standard promotion and per-product opt-out | 2 |
| psh-s10 | Standards injection into skill sessions | 2 |

## Out of scope for this epic

- Cross-org standards sharing — Phase 2 (signposted in discovery and psh-s9)
- Standards versioning, change history, or approval workflow — post-MVP
- Standards import from external URLs — post-MVP
- Standards validation or linting — post-MVP

## Metric linkage

- **M4a** (Standards library adoption rate): psh-s8 emits `standard_created` events; adoption measured in PostHog over 60 days
- **M4b** (Standards injection rate): psh-s10 is the sole story moving this metric — 100% injection rate target
