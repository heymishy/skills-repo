## Epic: A product's connected repo becomes a synced, visible entity in the web UI

**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Benefit-metric reference:** artefacts/2026-07-16-product-rollup/benefit-metric.md
**Slicing strategy:** Vertical slice

## Goal

An operator opens `/products/:id` for a product with a connected repo and sees a live, syncable rollup — not a bare feature count. skills-framework itself has a product row, so the operator can see this working against real, familiar data before any beta tenant relies on it. Triggering "Refresh" fetches the connected repo's current `pipeline-state.json` via GitHub's Contents API and shows at least the product's aggregate DoD status, with a visible last-synced timestamp.

## Out of Scope

- Every other rollup dimension (health, test coverage, AC coverage, discovery scope, taxonomy grouping) — covered in Epic 2, not this epic.
- Automatic or scheduled sync — this epic is on-demand only, per discovery MVP scope item 6.
- Multi-repo products or cross-product comparison — out of scope for the whole feature (see discovery).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Product shape visible in the web UI | 0% — bare feature list only | Rollup renders for skills-framework's own product | Establishes the product row, the sync mechanism, and the first real rollup dimension (DoD status) |
| Freshness is visible and refreshable, never silently stale | 0% — no rollup exists | 100% of rollup views show last-synced timestamp + working Refresh | Delivers the timestamp + Refresh action directly |

## Stories in This Epic

- [ ] Designate Product as a named primitive and register skills-framework as a product — pr-s1
- [ ] Sync a product's connected repo and show aggregate DoD status — pr-s2
- [ ] Show last-synced freshness and a manual refresh action — pr-s3

## Human Oversight Level

**Oversight:** High
**Rationale:** Solo-operator posture (W4, `.github/architecture-guardrails.md`) — the operator is also the reviewer and final approver for every story in this repo.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity: the GitHub Contents API + Postgres caching pattern is proven elsewhere (sign-off.js, standards table) but has not been combined for this specific purpose before. -->

## Scope Stability

**Stability:** Stable
