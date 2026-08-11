## Epic: Tenants can see every guardrail and standard that applies to their product, at both product and org level

**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Slicing strategy:** Walking skeleton

## Goal

A tech lead opens their product's guardrails/standards view in the web UI and sees the real, current content of `.github/architecture-guardrails.md` and the `standards/` folder from their connected repo — delineated clearly between what applies at their product's own repo and what applies at their tenant's designated org repo. This is the thinnest complete path through the feature: proves the read side end-to-end (adapter, tenant scoping, org/product delineation, no-repo fallback) before any write or approval capability is built on top of it.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    subgraph Read [Epic 1 -- read]\n        FETCH[adapters/artefact-fetcher.js\\nextended: fetchRepoPath]\n    end\n    subgraph Write [Epic 2 -- PR-gated write]\n        PRADAPT[adapters/guardrail-pr-adapter.js\\nnew, D37 injectable]\n    end\n    subgraph Routes [routes/products.js]\n        VIEW[handleGetGuardrailsView\\nproduct + org sections]\n        EDIT[handlePostGuardrailEdit]\n        PROMOTE[handlePostPromotionRequest\\nhandlePostPromotionResolve]\n    end\n    subgraph Removed [Epic 4 -- removed]\n        OLD[routes/standards.js\\nDELETED]\n    end\n    subgraph DB [schema]\n        TOR[(tenant_org_repo)]\n        GPR[(guardrail_promotion_requests)]\n        GPP[(guardrail_pending_prs)]\n        OLDDB[(standards / standard_product_optouts\\nDROPPED)]\n    end\n    VIEW --> FETCH\n    EDIT --> PRADAPT\n    PROMOTE --> PRADAPT\n    PROMOTE --> GPR\n    VIEW --> TOR\n    EDIT --> GPP\n    FETCH -->|GitHub Contents API| GH[(tenant's connected repo)]\n    PRADAPT -->|branch + commit + PR| GH"}}---

## Out of Scope

- **Add/edit capability** — this epic is read-only. Creating or editing a guardrail/standard is Epic 2.
- **Adherence/compliance status against the guardrails** — this epic surfaces *what applies*, not *whether it's being followed*. Compliance-status scoring (benefit-metric M1's fuller ambition) is a later refinement once the raw view is proven; not blocking for this epic.
- **`smug-s1`'s existing DB-backed Standards tab** — left running unchanged until Epic 4 migrates and removes it. This epic adds a new, separate view; it does not touch `standards.js`.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Guardrail/standard visibility in the web UI | 0% | 100% of active products render a populated, correctly-delineated org/product view | Delivers the entire read/render path this metric measures — the other three epics build on top of it but don't independently move this metric further |

## Stories in This Epic

- [ ] Extend the artefact-fetcher adapter to read arbitrary repo files — story-slug: `wugs-s1`
- [ ] Product-level guardrails/standards view from the connected repo — story-slug: `wugs-s2`
- [ ] Org-level guardrails/standards view from the tenant's designated org repo, with seeding — story-slug: `wugs-s3` — **cross-epic dependency:** also requires `wugs-s6` (Epic 2's write adapter) for its own AC1 seeding step; see `decisions.md`'s SLICE entry (2026-08-11, DoR stage)
- [ ] No-connected-repo fallback: org-level only, with a connect-repo prompt — story-slug: `wugs-s4`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches a new GitHub Contents API read path (external network dependency, token-scoped) and a new per-tenant "org repo" data-model concept — not experimental, but genuinely new infrastructure, not a routine CRUD story.

## Complexity Rating

**Rating:** 2 — known unknowns (GitHub Contents API path handling for a folder listing, not just a single file — `standards/` is a directory tree, which `artefactFetcher.fetchArtefact`'s single-file model doesn't yet handle) but builds on an already-proven adapter pattern (`pipeline-state-fetch-adapter.js`, `artefact-fetcher.js`).

## Scope Stability

**Stability:** Stable
