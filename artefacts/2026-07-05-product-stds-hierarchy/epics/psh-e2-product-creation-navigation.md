# Epic: psh-e2 — Product Creation and Navigation

**Feature:** 2026-07-05-product-stds-hierarchy
**Epic slug:** psh-e2-product-creation-navigation
**Status:** Not started
**Slicing strategy:** User journey — operator creates a product then navigates to it; this is the first user-facing interaction in the product hierarchy flow.
**Guardrails availability:** Architecture guardrails checked. Relevant constraints: ADR-011 (artefact-first — new src/ modules require story artefact), ADR-020 (req.session.accessToken canonical), D37 (injectable adapters must throw on stub), MC-SEC-01 (user-supplied content sanitised before innerHTML), ADR-018 (CSS-layout-dependent ACs need Playwright or RISK-ACCEPT), path traversal guard (ougl) for any file writes derived from form input, Node.js CommonJS only, no new npm dependencies.
**Human oversight level:** Medium

## Rationale

Operator creates a product using the hybrid form + AI draft + inline review flow. Completion triggers `product_created` PostHog event and persists the product to Postgres. The second story adds product-aware navigation so the operator can select a product and create features within it. Solo plan enforcement (1 product maximum) is an AC on the creation flow story.

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| psh-s3 | Product creation flow (hybrid form + AI draft + review) | 3 |
| psh-s4 | Product-aware dashboard and navigation | 2 |

## Out of scope for this epic

- AI skill session (separate from product creation) — Epic 3
- Kanban boards — Epic 4
- Standards library — Epic 5
- Product deletion or archiving — post-MVP

## Metric linkage

- **M1** (Product setup completion rate): psh-s3 is the creation flow; psh-s4 is the first-feature-within-product step
- **M3b** (Kanban weekly view rate): psh-s4 includes PostHog `product_navigated` event emission
