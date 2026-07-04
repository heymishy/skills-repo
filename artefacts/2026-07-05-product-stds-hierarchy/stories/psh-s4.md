## Story: psh-s4 — Product-aware dashboard and navigation

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e2-product-creation-navigation.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **product owner/operator**,
I want **my dashboard to show my products, let me select a product, and create new features within it**,
So that **features are always product-scoped from creation and I can track delivery within a product context — completing the M1 measurement path (product created → first feature within product)**.

## Benefit Linkage

**Metric moved:** M1 (Product setup completion rate) — M1 measures whether a new account completes product setup AND creates a first feature within a product in their first session. psh-s3 covers the product creation half; this story covers the "create feature within product" half. The `journey_created` PostHog event with `productId` set is the M1 completion signal.
**How:** When an operator creates a new feature from the product view, the journey is stored with `product_id` set. PostHog `journey_created` event with `productId` fires. M1 can now be computed from `product_created` → `journey_created with productId` within the same session.

## Architecture Constraints

- **ADR-024 (Journey GET shape):** If this story adds `productId` to the `GET /api/journey/:id` response, the full required shape fields (`turns`, `stages`, `completedStages`, `stage`, `ownerId`, `activeSkill`) must remain present. Verify with `node tests/check-wsm*.js` before PR open.
- **ADR-011 (artefact-first):** Any new `src/` module for product navigation requires this story artefact to exist first.
- **MC-SEC-01 (no raw innerHTML):** Product name displayed in the dashboard must be HTML-escaped before DOM insertion.
- **ADR-018 (Playwright / CSS-layout ACs):** AC for dashboard product card layout is CSS-layout-dependent. Playwright E2E test or RISK-ACCEPT required at DoR.
- **Node.js CommonJS only. No new npm dependencies.**

## Dependencies

- **Upstream:** psh-s1 (products table), psh-s3 (at least one product can be created before navigation makes sense).
- **Downstream:** psh-s5 (context injection requires `journeys.product_id` to be set at creation time).

## Acceptance Criteria

**AC1:** Given an authenticated operator with at least one product, when they load the dashboard, then their products are shown as cards with the product name, feature count (number of journeys with that `product_id`), and the date of the most recently updated journey in that product.

**AC2:** Given the operator clicks a product card, when the product view loads, then all features (journeys) associated with that `product_id` are listed with their current pipeline stage and health indicator.

**AC3:** Given the operator is in the product view, when they click "New feature", then: (a) a new journey row is inserted into `journeys` with `product_id` set to the current product's `product_id` and `tenant_id` matching `req.session.tenantId`; (b) the operator is taken to the discovery skill session for the new feature; (c) a `journey_created` PostHog event is emitted with `productId`, `tenantId`, and `journeyId`.

**AC4 (new account / no products):** Given an authenticated operator who has no products (new account, post-migration with no prior journeys), when they load the dashboard, then instead of an empty product list they see a "Create your first product" call-to-action. The previous flat journey list is not shown as the default view for accounts that have products.

**AC5 (accurate feature count):** Given a product has 3 features and the operator deletes one (if deletion exists) or one moves to a completed stage, when they return to the dashboard, then the product card shows the correct feature count — not a stale cached value.

## Out of Scope

- Product editing after creation — post-MVP.
- Product deletion — post-MVP.
- Sorting or filtering the product list — post-MVP.
- Displaying features from the flat (unassociated) journey list alongside product-scoped features — unassociated journeys (product_id IS NULL) are accessible via a legacy view if needed, not mixed into the product view.

## NFRs

- **Performance:** Dashboard product cards load in < 2 seconds for tenants with ≤ 20 products.
- **Security:** Product name is HTML-escaped before any DOM insertion.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

Dashboard update, product card component, product view with journey list, journey creation with product_id injection. No new AI calls. ADR-024 shape check is a verification task, not a new implementation.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Upstream dependencies (psh-s1, psh-s3) confirmed complete
- [ ] NFRs identified
- [ ] CSS-layout AC (dashboard card layout) flagged for Playwright or RISK-ACCEPT at DoR
- [ ] Human oversight level confirmed from parent epic (Medium)
