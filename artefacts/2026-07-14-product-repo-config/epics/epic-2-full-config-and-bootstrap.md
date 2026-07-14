## Epic: Full repo configuration, new-repo bootstrap, and remaining write paths

**Discovery reference:** artefacts/2026-07-14-product-repo-config/discovery.md
**Benefit-metric reference:** artefacts/2026-07-14-product-repo-config/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A tenant admin can create a brand-new GitHub repo directly from product creation (not just connect an existing one), that new repo is automatically seeded with the skills framework so it's usable immediately, and every remaining write path (annotation, local outer-loop artefact writes) resolves to the product's own repo the same way sign-off now does after Epic 1.

## Out of Scope

- Standards conversion to git-tracked files (Epic 3).
- Product edit/delete UX (Epic 4).
- Multi-repo-per-product and non-GitHub providers — out of scope per discovery, not revisited here.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|--------------------------|
| Metric 1 — Time from idea to DoR-ready, git-committed artefact | Established for sign-off only (post-Epic 1) | Full artefact pipeline achievable | Completes write-path coverage — annotation and the bulk of outer-loop artefact writes (`journey.js`) still went to the shared/ephemeral path before this epic |
| Metric 2 — Products with a configured repo | Existing-repo path only (post-Epic 1) | 100% including newly-created repos | Adds the create-new-repo path |

## Stories in This Epic

- [ ] prc-s2.1 — Create a new GitHub repo directly from product creation
- [ ] prc-s2.2 — Bootstrap a newly created repo with the skills framework
- [ ] prc-s2.3 — Resolve annotation write-back to the product's own repo
- [ ] prc-s2.4 — Resolve journey.js's local artefact writes to the product's own repo

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Same ADR-020 identity-guarantee and real-GitHub-API rationale as Epic 1, plus prc-s2.2 implements the bootstrap-mechanism decision resolved at `/clarify` (Contents/Git Data API primary, local-clone fallback) — genuinely new implementation territory within this codebase.

## Complexity Rating

**Rating:** 3
<!-- prc-s2.2 specifically carries real ambiguity: multi-file batch commits via the Git Data API are more involved than the single-file Contents API pattern every other write path in this codebase uses. -->

## Scope Stability

**Stability:** Unstable
