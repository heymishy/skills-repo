## Epic: Standards become git-tracked files, not DB-only rows

**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A product's standards live as real files in its repo, editable from either the web UI or an IDE, with the database serving only as a rebuilt read cache rather than the source of record — closing the last category of "associated files and standards" named in the discovery's MVP scope that Epic 1 and Epic 2 didn't yet touch.

## Out of Scope

- Migrating existing DB-only standards from already-created products — out of scope per discovery (applies to newly-configured products going forward).
- Any change to the visibility-tier/opt-out logic itself (`standard_product_optouts`) — only where the content lives changes, not the access-control model layered on top of it.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|--------------------------|
| Metric 1 — Time from idea to DoR-ready, git-committed artefact | Partial (post-Epic 2 — artefacts and framework are git-tracked, standards are not) | Complete | Standards are the last "associated files" category named in discovery's MVP scope item 4 |

## Stories in This Epic

- [ ] prc-s3.1 — Write standards to the product's repo as the source of truth
- [ ] prc-s3.2 — Rebuild the standards DB cache from git content
- [ ] prc-s3.3 — Wire standardsList to read from the git-backed cache, with promote/opt-out proven unaffected

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Reworks existing, already-shipped routes (`standards.js`) — real risk of regressing `admin-role-panel`'s opt-out/promote behaviour if not implemented carefully.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Unstable
