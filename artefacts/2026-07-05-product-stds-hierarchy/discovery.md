# Discovery: Product Hierarchy, Standards and Patterns Library

**Status:** Approved
**Feature slug:** 2026-07-05-product-stds-hierarchy
**Date:** 2026-07-05
**Skill version:** /discovery

## Attribution

| Field | Value |
|-------|-------|
| **Author** | Hamish King — Platform operator / product owner |
| **Approved By** | Hamish King — Platform operator / product owner |
| **Approval date** | 2026-07-05 |

---

## Problem statement

The platform currently has no concept of a **product** as a first-class entity. All features (journeys) are flat under an organisation with no product grouping, no product-level context files managed by the user, and no way to associate standards, architecture guardrails, or a patterns library with a specific product.

Three concrete gaps:

**P1 — Features have no product parent.** A team building multiple products simultaneously sees all features in a single undifferentiated list. There is no way to scope a feature to a product, no product-level kanban, and no product-aware navigation.

**P2 — Product context files are static and not user-managed.** The `product/` directory (mission.md, roadmap.md, tech-stack.md, constraints.md) exists as a single static set, manually maintained in the repo. There is no UI-driven product creation flow, no ability to create multiple products with independent context, and no injection of product-specific context into skill sessions at runtime.

**P3 — Architecture guardrails and standards/patterns are not product-scoped.** `architecture-guardrails.md` is a single repo-level file. There is no mechanism for a team to define reusable standards or patterns (e.g. "our React component approach", "our Spring microservice reference pattern") at the product level, promote them to org-level for use across products, or have them automatically injected into skill sessions (definition, review, test-plan, inner loop) when running stories for that product.

---

## Who it affects

### Primary: Product owner / operator
Creates and manages products within the org. Owns product context files (mission, roadmap, tech-stack, constraints), architecture guardrails, and standards definitions. Uses the product kanban to track feature progress. Primary beneficiary of product context inheritance into skill sessions.

### Primary: Developer / engineer
Runs skill sessions (definition, review, inner loop) for features within a product. Benefits from automatic injection of product standards, patterns, and architecture constraints into system prompts — without manually maintaining context files per feature.

### Secondary: Team member (non-owner)
Navigates the org and product hierarchy to find features in progress, understand status on the product kanban, and run pipeline stages for features they are assigned to.

---

## Why now

This is a pre-launch ordering dependency. Features 2 (organisation user management) and Feature 3 (repo wiring) both require a product entity to exist as a first-class object before they can be fully specified and built. Feature 2 needs to grant users access at the product level. Feature 3 needs to associate a git repo with a specific product. Building those features without product hierarchy in place would require retroactive data modelling.

Additionally, all three features share the same product-launch window — building them in the wrong order increases rework risk.

---

## MVP scope

### In scope for this feature

1. **Product entity** — a product belongs to an org (org-scoped), has a name and description, and multiple products can exist under one org.

2. **Product creation flow (hybrid)** — the operator fills a short structured form (product name, tech stack, key constraints), optionally uploads reference files (e.g. existing architecture docs, coding guides, pattern references). An AI step drafts the four product context files (`mission.md`, `roadmap.md`, `tech-stack.md`, `constraints.md`) from the form input plus any uploaded reference content. The operator reviews and edits the draft files inline before confirming creation. The AI draft is the starting point, not the final word.

3. **Product-aware navigation** — the dashboard, feature list, and session flows are product-scoped. An operator selects a product context before creating or resuming a feature. Org-level navigation shows all products.

4. **Product context inheritance** — skill sessions for features within a product automatically receive that product's `mission.md`, `tech-stack.md`, `constraints.md`, and `architecture-guardrails.md` in their system prompt. No manual maintenance per feature required.

5. **Kanban boards** — a per-product kanban shows all features for that product with their current pipeline stage and health. An org-level kanban aggregates features across all products with a product-group filter.

6. **Architecture guardrails as a product artefact** — `architecture-guardrails.md` is per-product (not repo-level). Stored alongside product context files. Injected into skill sessions alongside the other product context files.

7. **Standards and patterns library (product-level + org-level)** — operators can define or upload standards and patterns at the product level (e.g. "React component patterns reference", "Spring microservice template"). A defined standard can be promoted to org-level, making it available across all products in the org. Standards and patterns are injected into relevant skill sessions (definition, review, inner loop) when running stories for a product that has them configured. Cross-org sharing of standards is explicitly deferred to a later phase (see below).

> **Deferred — Phase 2 (signposted for later, not forgotten):** Cross-org standards sharing — the ability to publish standards to a public or shared library that other organisations can browse and adopt. The data model for this phase must be designed in now: standards must carry an `org_id` + `visibility` field from the start so that Phase 2 does not require a schema migration.

---

## Out of scope

1. **Cross-org standards sharing** — explicitly deferred to Phase 2 (signposted above). Standards are available within an org only in this feature.
2. **Rich in-browser document editor** — product artefact files and standards are viewable and editable as plain-text markdown; a WYSIWYG editor is out of scope.
3. **Product archiving or deletion** — products can be created; removal flows are deferred (data/audit implications require separate design).
4. **Standards versioning and approval workflow** — standards are stored and injectable; change management, diff history, and formal approval gates on standards changes are deferred.
5. **Product-level analytics and metrics dashboards** — pipeline performance aggregation or benefit metric rollup per product is deferred.

---

## Assumptions

> **RESOLVED:** At migration time, a "Default product" is auto-created per org and all existing journeys are assigned to it. Users see existing work under "Default product" immediately after migration and can move features to new products at any time thereafter. No manual reassignment gate required.

> **RESOLVED:** Feature 3 (repo wiring) is a soft dependency. Product context files and standards are stored in Postgres only in this feature — no git versioning yet. Feature 3 adds git storage later. Standards will not be versioned until Feature 3 lands; this is accepted scope for the MVP.

> **RESOLVED:** Solo users on a personal plan are limited to one product max. Attempting to create a second product triggers an upgrade prompt (team plan required for multiple products). The single product is org-scoped to their personal `tenantId`.

> **RESOLVED:** Org-level standards apply to all products in the org by default. A product can explicitly opt out of a specific org-level standard. Products without an opt-out inherit all org-level standards automatically.

---

## Success indicators

| Indicator | Baseline | Target | Measured via |
|-----------|----------|--------|--------------|
| New operator creates a product and creates their first feature within it | No product concept — features created flat | Operator completes product setup and creates first feature within it in a single session | Session event logs (`product_created` → `journey_created` with `productId` set) |
| Feature skill sessions inherit product context automatically | Static `product/` directory, manually maintained | 100% of new features created within a product receive product context (tech-stack, constraints, architecture guardrails) in their system prompt | System prompt content check on session creation |
| Org kanban shows all features across all products with current pipeline stage | Per-org board has no product grouping | Board renders product groups with stage columns; product filter works | Manual verification + automated rendering test |
| A team can promote a standard to org-level and have it available in all product skill sessions | No standards library | Standard defined at product level → promoted to org → visible in all product sessions | Manual walkthrough on staging |

---

## Constraints

- Postgres schema changes required: `products` table, FK from `journeys.product_id` to `products`, `standards` table with `org_id` + `visibility` (for Phase 2 readiness)
- Existing journeys without a `product_id` must not break — migration path required
- Node.js CommonJS only, no new npm dependencies (hard platform constraint)
- Feature 3 (repo wiring) is a soft dependency — product context files and standards are stored in Postgres for this feature; git versioning added by Feature 3 later
- Existing `tenantId` / `ownerId` access model remains the auth boundary; product access is scoped within tenant

---

## Reference materials

None uploaded at discovery time.

---

## Clarification log

[2026-07-05] Clarified via /clarify:
- Q: How should existing journeys (created before this feature lands) be treated at migration time?  A: Auto-assign all existing journeys to a "Default product" created per org. Users see old work under "Default product" immediately and can move features to new products at any time.
- Q: What is the product creation flow UX?  A: Hybrid — short structured form (name, tech stack, constraints) + optional reference file upload → AI drafts 4 product context files → operator reviews and edits inline before confirming.
- Q: Is Feature 3 (repo wiring) a hard or soft dependency?  A: Soft. Product context files and standards stored in Postgres only for this feature. Git versioning added by Feature 3 later. Accepted scope for MVP.
- Q: How are solo / personal-plan users handled in the product model?  A: Personal plan limited to 1 product max. Attempting to create a second product triggers an upgrade prompt. Product is org-scoped to their personal tenantId.
- Q: When a standard is promoted to org-level, how does it apply to products?  A: Applies to all products in the org by default. Per-product opt-out is supported. No opt-out = all org-level standards inherited automatically.
