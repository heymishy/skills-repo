## Epic: A product-level guardrail/standard can be governed-propagated to org level

**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A tech lead who has proven a guardrail/standard works well at their product can request it be promoted to the tenant's org repo, and an admin (per this epic's own scope note, see `decisions.md`) reviews and approves or rejects that request — with the approval opening a real PR against the org repo (reusing Epic 2's write mechanism), not a silent write. This replaces `smug-s1`'s old DB-backed promote/opt-out concept entirely.

## Out of Scope

- **The underlying write mechanism** — reuses `wugs-s6`'s branch+PR adapter as-is, targeting the org repo instead of the product repo; this epic does not build a second write path.
- **Multi-level approval chains** — a single approval (by an admin) is sufficient; no multi-stage sign-off workflow.
- **Notifications on promotion approval** — per discovery's Out of Scope, unchanged here.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Product-to-org promotion-approval workflow usage | 0 | ≥1 real promotion request submitted and resolved within 4 weeks of release | This epic delivers the entire workflow the metric measures |

## Stories in This Epic

- [ ] Request a product-level entry be promoted to org level — story-slug: `wugs-s8`
- [ ] Admin approves or rejects a promotion request — story-slug: `wugs-s9`
- [ ] Audit-log promotion request/approval/rejection events — story-slug: `wugs-s10`

## Human Oversight Level

**Oversight:** High
**Rationale:** Approval writes to the tenant's org repo (via Epic 2's PR mechanism) and changes what's treated as an org-wide floor — same consequence class as Epic 2's write path.

## Complexity Rating

**Rating:** 2 — reuses Epic 2's write adapter and Epic 1's read views; the new work is the request/approval state machine and role-gating, not a new external-write mechanism.

## Scope Stability

**Stability:** Stable
