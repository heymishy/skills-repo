## Story: psh-s6 — Per-product kanban board

**Epic reference:** artefacts/2026-07-05-product-stds-hierarchy/epics/psh-e4-kanban-boards.md
**Discovery reference:** artefacts/2026-07-05-product-stds-hierarchy/discovery.md
**Benefit-metric reference:** artefacts/2026-07-05-product-stds-hierarchy/benefit-metric.md

## User Story

As a **product owner/operator**,
I want **a kanban board for each product showing all its features grouped by pipeline stage with health indicators**,
So that **I can see at a glance which features are in flight, what stage they are at, and where delivery is healthy or blocked — contributing to M3a (100% render correctness) and M3b (≥50% weekly views)**.

## Benefit Linkage

**Metric moved:** M3a (Kanban render correctness) — automated CI test verifies the product kanban renders all features with correct stage grouping on every deploy. M3b (Kanban weekly view rate) — `kanban_viewed` PostHog event with `view: 'product'` is the measurement signal.
**How:** An operator who views the per-product kanban triggers a `kanban_viewed` event. Over 30 days, M3b is computed as: count of tenants with ≥1 weekly kanban view / count of active tenants.

## Architecture Constraints

- **ADR-018 (Playwright for CSS-layout ACs):** AC for column layout and responsive breakpoints is CSS-layout-dependent. A Playwright screenshot comparison test must be added in `tests/e2e/`, or a RISK-ACCEPT entry logged in `decisions.md` with a manual smoke test step in the verification script. This must be resolved at DoR — not deferred.
- **MC-A11Y-01 (keyboard-accessible):** Stage column navigation must be keyboard-accessible.
- **MC-A11Y-02 (colour not sole status indicator):** Health indicators (green/yellow/red) must use icons or text labels in addition to colour.
- **MC-SEC-01 (no raw innerHTML):** Feature names rendered in kanban cards must be HTML-escaped.
- **ADR-003 (schema-first):** If any new field is added to `pipeline-state.json` to support kanban rendering, it must be added to `pipeline-state.schema.json` in the same commit.
- **Node.js CommonJS only. No new npm dependencies.**

## Dependencies

- **Upstream:** psh-s1 (products table), psh-s4 (features have product_id set; product navigation exists so the user can reach the kanban).
- **Downstream:** psh-s7 (org kanban extends this work).

## Acceptance Criteria

**AC1:** Given the operator is on a product's kanban view, when the page loads, then all features (journeys) with `product_id = current product` are shown in columns corresponding to their current pipeline stage. The stages shown as columns are: Discovery, Benefit Metric, Definition, Review, Test Plan, Definition of Ready, Implementation, Definition of Done.

**AC2 (stage accuracy):** Given a feature's pipeline stage is updated (e.g. review completes and stage advances), when the kanban refreshes (page reload or polling), then the feature card appears in the updated column with the correct stage label. It does not appear in its previous column.

**AC3 (health indicator):** Given a feature has `health: 'red'` in pipeline-state.json, when its card is rendered in the kanban, then the card shows a visible error indicator — not colour alone. An icon (e.g. ⚠) or text label ("Blocked") must be present alongside any colour treatment.

**AC4 (empty stage column):** Given a product has no features currently in the "Benefit Metric" stage, when the kanban renders, then the "Benefit Metric" column is still visible with an empty state label (e.g. "No features at this stage") — it is not hidden or collapsed.

**AC5 (PostHog event):** Given an authenticated operator views the product kanban, when the page loads, then a PostHog `kanban_viewed` event is emitted with properties: `view: 'product'`, `productId`, `tenantId`, `featureCount` (count of features shown).

**AC6 (CSS-layout — Playwright or RISK-ACCEPT at DoR):** [Testability: accepted by operator — CSS-layout-dependent. Playwright E2E test or RISK-ACCEPT + manual smoke test required at DoR sign-off. Not independently testable by unit test runner.]

## Out of Scope

- Drag-and-drop reordering of feature cards — post-MVP.
- Sprint or milestone grouping within stage columns — post-MVP.
- Filtering by health or story-level status within the board — post-MVP.
- Org-level kanban — psh-s7.

## NFRs

- **Performance:** Kanban renders in < 2 seconds for products with ≤ 50 features.
- **Accessibility:** All interactive elements keyboard-accessible; health status conveyed by icon/text in addition to colour.
- **No new npm dependencies.**

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

New route + view for the product kanban. Stage grouping query is a straightforward SQL GROUP BY (or client-side grouping from the journey list). Health indicator rendering is a presentation concern. ADR-018 compliance (Playwright or RISK-ACCEPT) is a DoR task, not additional implementation.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Upstream dependencies (psh-s1, psh-s4) confirmed complete
- [ ] CSS-layout AC (AC6) flagged — Playwright or RISK-ACCEPT decision required at DoR
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic (Medium)
