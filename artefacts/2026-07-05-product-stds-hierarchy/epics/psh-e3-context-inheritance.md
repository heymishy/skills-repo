# Epic: psh-e3 — Product Context Inheritance

**Feature:** 2026-07-05-product-stds-hierarchy
**Epic slug:** psh-e3-context-inheritance
**Status:** Not started
**Slicing strategy:** User journey — after a product exists and features are created within it, skill sessions should automatically receive product context. This is the core value-delivery step.
**Guardrails availability:** Architecture guardrails checked. Relevant constraints: ADR-022 (Option B — one session per skill stage; product context injected at session init, not across sessions), ADR-023 (B-iii — context files read from disk/Postgres, not from session memory), ADR-024 (any changes to journey GET response must preserve required shape fields), D37 (injectable adapter for product context lookup must throw on stub), path traversal guard (ougl) for any context file reads from product-derived paths, Node.js CommonJS only.
**Human oversight level:** Medium

## Rationale

Once a feature is associated with a product (via `journeys.product_id`), every skill session initiated for that feature must automatically inject the product's context files into the system prompt. This is the metric-moving step for M2 (100% injection rate). Architecture guardrails (`architecture-guardrails.md`) are treated as a fifth product context file and injected alongside mission, tech-stack, constraints, and roadmap.

## Stories

| Story | Title | Complexity |
|-------|-------|------------|
| psh-s5 | Product context injection into skill sessions | 2 |

## Out of scope for this epic

- Standards injection — Epic 5 (separate injection pathway for standards)
- Editing product context files post-creation — post-MVP UI; operators edit Postgres directly or via re-creation
- Context injection for features with no product (unassociated features) — no injection; fallback to static global product/ directory as before

## Metric linkage

- **M2** (Product context injection rate): psh-s5 is the sole story moving this metric — 100% injection rate target
