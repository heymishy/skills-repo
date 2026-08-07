## Epic: Every completed stage's artefact survives a redeploy, for every repo-connected product

**Discovery reference:** artefacts/2026-08-06-durable-artefact-storage/discovery.md
**Benefit-metric reference:** artefacts/2026-08-06-durable-artefact-storage/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

Every completed stage's artefact, for any product connected to a GitHub repo, survives any number of subsequent redeploys and remains retrievable via "Resume conversation" — because it is committed to the product's own repo at stage-completion time, not left solely on the hosting container's ephemeral local disk. Every newly created product is guided to connect a repo before it can start relying on this guarantee, closing the gap at its source rather than leaving new products silently exposed to the same failure mode.

## Out of Scope

- Recovering already-orphaned journeys (e.g. `new-feature-808781bb`) — pre-launch staging data, not real customer artefacts.
- Attaching a persistent Fly volume as an alternative durability layer — explicitly rejected per discovery's MVP decision (git-as-source-of-truth, not platform-side storage).
- Multi-repo-per-product support — stays out of scope, consistent with `mtrr-s1`/`mtrr-s2`.
- Changing the in-progress conversation durability model (Redis/Postgres via `dsh-s1`–`dsh-s4`) — already solved, not touched by this epic.
- Retrofitting this fix onto other SaaS-hosted deployment patterns beyond the `wuce-staging` model, if any exist — deferred to a follow-on.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Cross-redeploy artefact durability | 0% | 100% | Story 1 commits each completed stage's artefact to the product's connected repo, alongside the existing local-disk write, and adds a git-fallback to the "Resume conversation" read path. |
| Repo-connection-required coverage | 0% | 100% of new products | Story 2 blocks a newly created product from starting its first journey until a repo is connected. |
| Orphaned-journey rate going forward | `[UNKNOWN BASELINE]` | 0% | Both stories together close the mechanism that produces orphaned journeys for any product created after this epic ships; the health-check (nice-to-have, not a story) measures the outcome. |

## Stories in This Epic

- [ ] Story 1: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation — artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
- [ ] Story 2: Require a connected repo before a new product can start its first journey — artefacts/2026-08-06-durable-artefact-storage/stories/das-s2-require-connected-repo-for-new-products.md

## Human Oversight Level

**Oversight:** High
**Rationale:** Story 1 introduces a new write-then-verify sequencing pattern around `completeStage()` that directly affects data-durability guarantees for real (future beta) customer artefacts — the exact class of risk that warranted High oversight for `mtrr-s1`. Story 2 is lower-risk UI/policy work (comparable to `mtrr-s2`'s Medium) but the epic-level ceiling reflects Story 1's risk; Story 2 may be assessed independently at Medium at its own DoR.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity (the write-then-verify sequencing needs care), but /clarify already resolved the biggest unknowns (OAuth scope, dual-write safety for existing read call sites) and the pattern to follow (ADR-023's disk-canonicity precedent) already exists in this codebase. -->

## Scope Stability

**Stability:** Stable

<!-- MVP boundary was narrowed and confirmed via /clarify before this epic was written; no open scope questions remain. -->
