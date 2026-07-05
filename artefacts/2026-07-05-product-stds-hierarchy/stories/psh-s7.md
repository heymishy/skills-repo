## Story: psh-s7 — Org-level kanban with product grouping and filter

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e4-kanban-boards.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **product owner/operator**,
I want **an org-level kanban that shows all features across all my products with product grouping and a product filter**,
So that **I can see delivery status across the entire org and drill into a specific product without leaving the board — contributing to M3a (100% render correctness) and M3b (≥50% weekly views)**.

## Benefit Linkage

**Metric moved:** M3a (Kanban render correctness) — automated CI test verifies the org kanban correctly renders all products and features with product grouping. M3b (Kanban weekly view rate) — `kanban_viewed` PostHog event with `view: 'org'` contributes to the 30-day view rate measurement.
**How:** The org kanban gives operators a single view across all products. Regular use drives M3b. The `kanban_viewed` event with `view: 'org'` is counted alongside `view: 'product'` events.

## Architecture Constraints

- **ADR-018 (Playwright for CSS-layout ACs):** Product group headers, filter dropdown, and responsive column layout are CSS-layout-dependent. Playwright E2E test or RISK-ACCEPT at DoR (same resolution as psh-s6).
- **MC-A11Y-01 (keyboard-accessible):** Product filter dropdown and all interactive kanban elements must be keyboard-accessible.
- **MC-A11Y-02 (colour not sole status indicator):** Same health indicator rule as psh-s6.
- **MC-SEC-01 (no raw innerHTML):** Product names and feature names in org kanban must be HTML-escaped.
- **Node.js CommonJS only. No new npm dependencies.**

## Dependencies

- **Upstream:** psh-s6 (per-product kanban establishes the rendering pattern and component structure the org kanban extends).
- **Downstream:** None within this feature.

## Acceptance Criteria

**AC1:** Given the operator is on the org kanban view, when the page loads with the "All products" filter selected (default), then all features across all products in the tenant are shown, grouped by product (each product is a labelled group) and within each group by pipeline stage.

**AC2 (product filter):** Given the operator selects a specific product from the product filter dropdown, when the filter is applied, then only features for that product are shown. The product grouping header remains visible. Other products and their features are hidden.

**AC3 (filter reset):** Given the operator has filtered to a specific product, when they select "All products" from the filter, then all products and their features are shown again.

**AC4 (feature navigation):** Given the operator clicks a feature card in the org kanban, when the navigation resolves, then the operator is taken to that feature's current pipeline stage view (the active stage for that journey).

**AC5 (PostHog event):** Given an authenticated operator views the org kanban, when the page loads, then a PostHog `kanban_viewed` event is emitted with properties: `view: 'org'`, `tenantId`, `productCount` (number of products shown), `featureCount` (total features shown).

**AC6 (CSS-layout — Playwright or RISK-ACCEPT at DoR):** [Testability: accepted by operator — CSS-layout-dependent. Playwright E2E test or RISK-ACCEPT + manual smoke test required at DoR sign-off. Not independently testable by unit test runner.]

## Out of Scope

- Cross-tenant visibility — the org kanban is scoped to `tenantId` from `req.session.tenantId`. No cross-tenant data.
- Sorting or prioritising features within stage columns — post-MVP.
- Export of org kanban state — post-MVP.

## NFRs

- **Performance:** Org kanban renders in < 3 seconds for tenants with ≤ 10 products and ≤ 100 features total.
- **Accessibility:** Product filter keyboard-accessible; health indicators use icon/text alongside colour.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

Extends psh-s6 rendering pattern. The main addition is the product grouping level and the filter dropdown. Query complexity is higher (join across products + journeys) but manageable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Upstream dependency (psh-s6) confirmed complete
- [ ] CSS-layout AC (AC6) flagged — Playwright or RISK-ACCEPT decision required at DoR
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic (Medium)
