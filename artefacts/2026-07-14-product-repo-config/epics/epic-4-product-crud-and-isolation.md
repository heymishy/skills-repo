## Epic: Product management UX and cross-tenant isolation proof

**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A tenant admin can edit or remove a product through the web UI (not just create one), and an automated test proves — not just asserts by code inspection — that two tenants' products can never write to each other's repos.

## Out of Scope

- Deleting the underlying GitHub repo itself — out of scope per discovery; detach only.
- Any bulk/multi-product management UI.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|--------------------------|
| Metric 2 — Products with a configured repo | 100% at creation only (post-Epic 2) | Durable over time, not just at creation | Edit path lets a mis-configured or skipped repo association be fixed after the fact |
| Metric 3 — Cross-tenant repo isolation | Untested | 100%, automated E2E proof | This epic's terminal story is exactly this metric's measurement mechanism |

## Stories in This Epic

- [ ] prc-s4.1 — Edit a product's name, description, and repo association
- [ ] prc-s4.2 — Delete (detach) a product
- [ ] prc-s4.3 — Automated cross-tenant repo isolation E2E spec

## Human Oversight Level

**Oversight:** Medium
**Rationale:** prc-s4.3 is security-relevant, matching the existing `bri-s3.4` cross-tenant isolation spec's own Medium-oversight rationale ("given its security-critical scope").

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable — this epic mostly wires together mechanisms already proven in Epics 1-3.
