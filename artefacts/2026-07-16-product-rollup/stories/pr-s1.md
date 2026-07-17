## Story: Designate Product as a named primitive and register skills-framework as a product

**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e1-foundation.md
**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md

## User Story

As the **Founder/Operator (Hamish King)**,
I want **skills-framework itself to exist as a real product row, with "Product" formally documented as a named primitive**,
So that **the rollup mechanism has a consistent single code path for both this platform's own repo and any tenant's connected repo, and the platform's own primitives list accurately reflects what already exists in code**.

## Benefit Linkage

**Metric moved:** Product shape visible in the web UI
**How:** Completing this story means the operator can navigate to `/products/:id` and see skills-framework itself as a real, first-class product in the platform's own UI for the first time — a genuine, demoable outcome on its own, and the specific product row every subsequent rollup dimension in this feature renders against.

## Architecture Constraints

- ADR-011 (Artefact-first): this discovery→benefit-metric→story chain satisfies the requirement for the structural `pipeline-state.json`/DB changes this story introduces.
- ADR-025 (Tenant scoping): the new product row must carry the same `tenant_id` scoping convention already used by every other row in the `products` table — no new isolation mechanism.
- "Product" is added to the canonical primitives list (`docs/concepts/README.md`) as a documentation change only — no new schema, per discovery MVP scope item 1.
- ADR-018 (Playwright E2E): AC2 is browser-facing; an E2E spec confirming the product page renders for skills-framework's own product row should exist in `tests/e2e/` before DoR (H-E2E gate).

## Dependencies

- **Upstream:** None — this is the first story in the feature.
- **Downstream:** pr-s2 through pr-s7 all require this product row to exist as their sync target for the dogfooding case.

## Acceptance Criteria

**AC1:** Given the operator's tenant has no product row for skills-framework yet, When the migration/seed step for this story runs, Then a `products` row is created with `repo_owner`/`repo_name` pointing at this repository, scoped to the operator's own `tenant_id`.

**AC2:** Given the product row exists, When the operator navigates to `/products/:id` for skills-framework's product, Then the page returns HTTP 200 and renders the product name and feature list exactly as it does for any other existing product.

**AC3:** Given `docs/concepts/README.md`'s primitives list, When this story is complete, Then the list contains an eighth entry for "Product," documented as an existing entity (the `products` table + its web UI), not a new schema.

**AC4:** Given two different tenants each have their own product rows, When either tenant's product row is queried, Then no cross-tenant data is returned — the existing `tenant_id`-scoped query pattern already used elsewhere in `products.js` is followed unchanged.

## Out of Scope

- The sync mechanism itself (fetching and caching the connected repo's `pipeline-state.json`) — that is pr-s2.
- Any new UI beyond what `/products/:id` already renders for a product with no rollup yet — this story only ensures the row and primitives-list entry exist.

## NFRs

- **Performance:** Not applicable — a one-time row creation, not a runtime hot path.
- **Security:** No credentials or tokens are stored on the product row itself — `repo_owner`/`repo_name` only, matching the existing `prc-s1.1` column convention.
- **Accessibility:** Not applicable — no new UI in this story.
- **Audit:** The product-row creation should be logged the same way other product creations are (existing `products.js` creation path), no new logging mechanism needed.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
