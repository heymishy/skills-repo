# Decision Log: 2026-07-16-product-rollup

**Feature:** Product Rollup & Aggregation Layer
**Discovery reference:** artefacts/2026-07-16-product-rollup/discovery.md
**Last updated:** 2026-07-17

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-07-17 | ARCH | discovery**
**Decision:** "Product" is unified with the existing SaaS `products` table rather than introduced as a new, separately-named primitive.
**Alternatives considered:** A net-new Product manifest entity referencing feature slugs, entirely separate from the `products` table.
**Rationale:** The `products` table already carries repo-association columns (`prc-s1.1`) and standards-hierarchy columns (`psh-s3`) mirroring this platform's own `product/*.md` files — a tenant's "product" already is a repo, and this platform's own dogfooding case is the degenerate case of that same entity.
**Made by:** Hamish King (operator correction of an earlier draft's naming-collision framing)
**Revisit trigger:** Never, unless a second, materially different "product" concept emerges that genuinely cannot share the same table.
---
**2026-07-17 | ARCH | discovery**
**Decision:** The rollup sync mechanism is ordinary application code in `src/web-ui/` (a route handler using GitHub's Contents API), not a governed SKILL.md skill.
**Alternatives considered:** A new `/product-sync` SKILL.md skill reading a locally-checked-out `pipeline-state.json`.
**Rationale:** A tenant viewing their own product's rollup is a live SaaS feature for any authenticated browser user, not an agent workflow invoked in a pipeline session. `sign-off.js`'s `handleArtefactRead` already proves the exact mechanism needed (Contents API + user's own OAuth token), and the `standards` table already shows the per-product DB-caching convention to follow.
**Made by:** Hamish King (operator review questioned the skill framing given the platform's real Postgres persistence layer)
**Revisit trigger:** If a future need arises for an agent-invoked, conversational rollup-authoring flow distinct from the live web UI view.
---
**2026-07-17 | SCOPE | discovery**
**Decision:** Aggregate health and aggregate AC coverage are added as explicit MVP rollup dimensions (discovery MVP scope item 4).
**Alternatives considered:** Leaving health and AC coverage as fetched-but-unused fields, deferring both to a fast-follow.
**Rationale:** Health was already named as an operator need in the Problem Statement/Who It Affects sections but never actually specified as a rollup dimension — a real gap found on review, not a new ask. `acTotal`/`acVerified` were already listed as fetched fields for the same reason. Closing both now avoids re-opening this discovery a third time for a gap that was already partially visible.
**Made by:** Hamish King
**Revisit trigger:** Never — these are core to what "product shape" means for this feature.
---
**2026-07-17 | DESIGN | definition**
**Decision:** Slicing strategy is vertical slice — each story is an independently demo-able complete slice through all layers.
**Alternatives considered:** Walking skeleton (thinnest end-to-end path first, then flesh out); user journey; risk-first.
**Rationale:** Operator's explicit choice. Walking skeleton was flagged as the recommended default given this is new integration territory, but the operator chose vertical slice — each rollup dimension (health, test coverage, AC coverage, taxonomy) is independently valuable and demoable once the Epic 1 sync mechanism exists, without requiring every dimension to ship together.
**Made by:** Hamish King
**Revisit trigger:** If Epic 2's stories turn out to share more implementation surface than expected, such that "independent" slices in practice require coordinated changes — reconsider whether walking-skeleton sequencing would have reduced rework.
---
**2026-07-17 | SCOPE | definition**
**Decision:** Meta Metric 1 (dogfooding validates the mechanism against a small product) has no story that directly moves it — it is validated post-ship by testing the shipped mechanism against a smaller synthetic/early-tenant product fixture, not by any individual story's ACs.
**Alternatives considered:** (1) Write a synthetic story whose sole purpose is running this validation; (2) descope the meta-metric entirely; (3) mark it post-MVP.
**Rationale:** All 7 stories collectively enable this validation (there's nothing to validate the mechanism against until the rollup exists) — forcing a synthetic story into existence just to show coverage would be artefact theatre, not real work. This mirrors the `2026-07-14-product-repo-config` feature's own precedent for exactly this shape of metric-gap (see that feature's `benefit-metric.md`, Meta Metric 1 resolution note).
**Made by:** Hamish King (agent-proposed resolution, consistent with prior precedent, accepted)
**Revisit trigger:** If beta launch approaches and this validation still hasn't happened informally, convert it into an explicit story rather than letting it remain an assumed side-effect.
---

## Architecture Decision Records

None promoted to repo-level ADR status yet. The two ARCH entries above (Product/`products`-table unification; rollup-as-app-code-not-skill) are feature-scoped decisions for now — if a future feature needs to make the same call again (e.g. a second cross-cutting rollup mechanism), consider promoting the second entry to `.github/architecture-guardrails.md` as a repo-level ADR.
