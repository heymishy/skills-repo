## Epic: A product's rollup shows its full shape, not just one dimension

**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md
**Slicing strategy:** Vertical slice

## Goal

Building on Epic 1's sync mechanism and first rollup dimension (DoD status), the product rollup view on `/products/:id` shows the product's full shape: aggregate health, aggregate test coverage, aggregate AC coverage, and discovery scope with epic/feature taxonomy grouping. An operator can answer "how healthy is this product overall, and what does it actually do" from one screen.

## Out of Scope

- The sync mechanism itself, freshness/refresh UX, and the DoD status dimension — delivered in Epic 1; this epic only adds new rollup dimensions on top of that plumbing.
- A weighted or percentage-based product-health score — MVP uses the simpler red-takes-precedence rule (see pr-s5); a more nuanced score is a later refinement if the simple rule proves misleading in practice.
- Multi-repo products or cross-product comparison — out of scope for the whole feature (see discovery).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Product shape visible in the web UI | 0% — bare feature list only | 100% of rollup fields (health, test coverage, AC coverage, discovery scope, taxonomy) render correctly | Each story in this epic delivers one additional rollup dimension |

## Stories in This Epic

- [ ] Render aggregate health on the product rollup view — pr-s4
- [ ] Render aggregate test coverage on the product rollup view — pr-s5
- [ ] Render aggregate AC coverage on the product rollup view — pr-s6
- [ ] Render discovery scope and feature/epic taxonomy grouping — pr-s7

## Human Oversight Level

**Oversight:** High
**Rationale:** Solo-operator posture (W4, `.github/architecture-guardrails.md`) — the operator is also the reviewer and final approver for every story in this repo.

## Complexity Rating

**Rating:** 1

<!-- Well understood once Epic 1's plumbing exists — each story is an additive computation + render on the same established path. -->

## Scope Stability

**Stability:** Stable
