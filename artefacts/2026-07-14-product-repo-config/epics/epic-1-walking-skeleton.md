## Epic: One product, one real write, proven end-to-end before any UI polish

**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A single product can be linked to an existing GitHub repo the operator already owns, and the platform's existing sign-off write-back lands a real, correctly-attributed commit in that specific repo — proving the fundamental mechanism (per-product repo resolution replacing the single global `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` env var) works end-to-end before any additional write path or UI polish is built on top of it.

## Out of Scope

- Creating a brand-new GitHub repo — this epic only covers connecting an existing one (Epic 2).
- Bootstrapping/seeding a repo with the skills framework (Epic 2).
- Any write path other than sign-off — annotation and local artefact writes come in Epic 2.
- Product management UX beyond the minimum needed to set the repo link (Epic 4).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|--------------------------|
| Metric 1 — Time from idea to DoR-ready, git-committed artefact | Impossible today | Achievable via web UI | Proves the foundational per-product write path this metric depends on |
| Metric 2 — Products with a configured repo | 0% | 100% of new products | Introduces the `repo_provider`/`repo_owner`/`repo_name` schema this metric measures |

## Stories in This Epic

- [ ] prc-s1.1 — Add repo association columns to the products table
- [ ] prc-s1.2 — Connect an existing GitHub repo to a product
- [ ] prc-s1.3 — Resolve sign-off write-back to the product's own repo
- [ ] prc-s1.4 — Prove the walking skeleton end-to-end with a real commit

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches the write-back mechanism governed by ADR-020 (identity/attribution guarantee), makes real GitHub API calls, and is the first time per-product repo resolution exists anywhere in the codebase.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Unstable — this is the epic most likely to reveal real surprises, since it's genuinely new integration surface rather than an extension of existing patterns.
