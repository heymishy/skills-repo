## Story: Curate a Modules taxonomy for a product

**Epic reference:** `artefacts/2026-07-21-web-ui-experience-redesign/epics/epic-a-product-view-redesign.md`
**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`

## User Story

As **Hamish King (Founder/Operator, managing a product with dozens of epics)**,
I want to **create, rename, and delete named modules for a specific product**,
So that **I can organise a large product into the groupings that actually make sense for it, rather than being stuck with a flat list of epics**.

## Benefit Linkage

**Metric moved:** Time to identify the least-healthy area of a large product
**How:** Modules are the top-level grouping the operator scans first; without the ability to create and name them for a specific product, there is nothing to group epics into.

## Architecture Constraints

- ADR-025: multi-tenancy enforced at the application layer — module records must be scoped by `product_id` (and transitively `tenant_id` via the product), never a shared/global table with no tenant boundary.
- Mandatory constraint (this repo's own general practice, confirmed via architecture scan): no user-supplied content injected into rendered HTML without escaping — module names are operator-typed free text and must go through the same `_escapeHtml` convention already used throughout `products.js`.
- D37 injectable-adapter pattern (mandatory, per CLAUDE.md's own established rule): this story introduces new persistent module storage, requiring a new injectable adapter (e.g. `setModulesAdapter()`), reusing the existing `_pshPool` connection but as a genuinely new data-access layer, not an existing purpose being repurposed. Per D37: (1) the stub default must throw, not return null/empty; (2) production wiring in `server.js` is a separate implementation task from the handler itself; (3) the wiring test must assert real behavioural correctness (e.g. two different products' modules resolve to two different, correctly-isolated results), not just that a function reference was assigned. See AC6 below for the wiring AC this constraint requires.

## Dependencies

- **Upstream:** None
- **Downstream:** A2 (reassign epics between modules) and A4 (module-grouped rendering) both require this story's schema and CRUD API to exist first.

## Acceptance Criteria

**AC1:** Given a product with zero modules, When the operator creates a module named "Governance & Gate Enforcement", Then a new module record is persisted scoped to that product, and it appears in the product's module list on next page load.

**AC2:** Given a product with an existing module, When the operator renames it, Then the module's name updates in storage and every epic previously assigned to it remains assigned to the same underlying module record (rename does not create a new module or orphan assignments).

**AC3:** Given a product with an existing module that has epics assigned to it, When the operator deletes that module, Then the module record is removed, and every epic that was assigned to it is reassigned to an "Unassigned" bucket — no epic silently disappears from the product view.

**AC4:** Given a product with an existing module, When the operator attempts to create a second module with the exact same name, Then the creation is rejected with a clear message, and no duplicate module record is created.

**AC5:** Given two different products, When the operator creates modules for product A, Then those modules do not appear when viewing product B's module list — module scoping is per-product, not global.

**AC6 (D37 wiring):** Given the modules adapter (`setModulesAdapter`) is wired to a real Postgres-backed implementation in `server.js`, When two different products each have their own modules created, Then querying each product's modules independently resolves to two different, individually-correct result sets — not merely confirming that `setModulesAdapter` was called with some function, per this repo's own established D37 wiring-test standard.

## Out of Scope

- Reassigning epics between modules — that is story A2.
- Any default/starter module set seeded for new products — confirmed via /clarify as fully operator-curated, no defaults.
- Cross-product or shared module taxonomies.

## NFRs

- **Performance:** Module CRUD operations complete in under 500ms for a product with up to 200 epics.
- **Security:** Module create/rename/delete actions are scoped to the requesting session's `tenantId`, matching this repo's existing cross-tenant isolation pattern (verified by the existing `bri-s3.4` test suite's convention) — a request cannot create or modify a module for a product belonging to a different tenant.
- **Accessibility:** Module rename/delete controls are keyboard-operable and have visible focus states, matching the existing shared-shell convention.
- **Audit:** None identified beyond standard application logging — module CRUD is not security-sensitive in the way Epic D's impersonation is.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
