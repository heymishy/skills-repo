## Epic: Operators can read a large product's health, scale, and organisation at a glance

**Discovery reference:** `artefacts/2026-07-21-web-ui-experience-redesign/discovery.md`
**Benefit-metric reference:** `artefacts/2026-07-21-web-ui-experience-redesign/benefit-metric.md`
**Slicing strategy:** Vertical slice

## Goal

An operator opens any product's view — including one with 100+ stories across dozens of epics — and within seconds sees: which curated module is least healthy, roughly how big the product is, and whether health and test coverage agree or disagree for any given area. Work that only exists as a discovery or ideation artefact and hasn't become a tracked story shows up in its own Roadmap view instead of being invisible.

## Out of Scope

- Building a platform-wide default module taxonomy shared across products — confirmed via /clarify as fully operator-curated per product, no defaults.
- Grouping the AC-coverage breakdown by module (only test-coverage is grouped in this epic) — a natural follow-on, explicitly deferred.
- The Roadmap tab's full sync/cache pipeline as a `product_rollups` column computed by an extended `/product-sync` — this epic ships the Roadmap tab reading discovery/ideate artefacts directly at render time; wiring it into the cached sync pipeline is deferred.
- Cross-product or cross-tenant module taxonomies.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Time to identify the least-healthy area of a large product | Not yet established (qualitatively "hard to understand" at 115-story scale) | Under 10 seconds | Modules + dual health/coverage signal + scale gauge give an at-a-glance summary instead of a flat list |

## Stories in This Epic

- [ ] A1 — Curate and manage a Modules taxonomy for a product
- [ ] A2 — Reassign epics between modules
- [ ] A3 — Compute per-feature health as a signal distinct from test coverage
- [ ] A4 — Render the product view grouped by module with dual health/coverage indicators and a scale gauge
- [ ] A5 — Surface discovery-only and ideation-only work in a Roadmap tab

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches the core product-rollup rendering and aggregation logic (`product-rollup.js`, `products.js`) that 7 prior stories (`pr-s1`–`pr-s7`) and 3 follow-on hotfixes already depend on — a coding agent should pause for human review at PR given the blast radius, but this is ordinary application UI work, not a security-sensitive surface.

## Complexity Rating

**Rating:** 2
**Rationale:** Modules CRUD and rendering are well-understood (a working mockup already exists and was confirmed). The genuine unknown is A3 — tracing `computeHealthCounts`'s actual per-feature inputs, which hasn't been investigated yet at the code level.

## Scope Stability

**Stability:** Stable
