# Decision Log: unified-reactive-proactive-visibility

**Feature:** Unified Reactive + Proactive Visibility
**Discovery reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/discovery.md
**Last updated:** 2026-11-08

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
**2026-11-08 | ASSUMPTION | discovery (/clarify) — retroactively logged 2026-11-08**
**Decision:** Drop the "Fork-relationship reference value" Directional Success Indicator entirely, rather than keeping it as a measured post-ship indicator. Carry the underlying "legible reference" concern forward as writing guidance for `/definition` instead.
**Alternatives considered:** The discovery draft's original assumption — that the enterprise-fork steward persona would consult the live UI surface, making UI reference-worthiness a measurable success indicator for this feature specifically.
**Rationale:** Confirmed by the operator during /clarify that the fork-steward persona's actual consumption path is the discovery/definition text artefacts, not the live UI (consistent with the corrected fork-maintenance model established earlier this session: the fork references this repo's outer-loop artefacts and runs the outer loop independently, rather than consuming UI/code directly). Measuring "fork-worthiness" as a UI success indicator would have measured the wrong thing — artefact clarity is a cross-cutting documentation-quality bar that applies to every feature's discovery/definition writing, not evidence this specific feature succeeded or failed.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** If a real enterprise-fork consumer is ever observed actually using the live UI (not just the referenced artefacts) to inform their own re-derivation, revisit whether a UI-facing success indicator should be reinstated.
**Note:** This entry was logged retroactively on 2026-11-08, after a cross-tranche consistency audit found this feature was approved without a `decisions.md`, despite its own Clarification log recording a materially-changed assumption (a success indicator removed, not just confirmed) — the same trigger condition that produced a `decisions.md` for every other initiative in this tranche (2, 3, 4, 5). Logged now for consistency with the rest of the tranche, not at the time of the original /clarify session.
---

---
**2026-11-09 | ARCH | definition — surface correction**
**Decision:** Replace every citation of `src/web-ui/views/kanban-view.js` in this discovery with the real target surface: `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`), rendered inside `_renderProductView` (`:1122`) via `handleGetProductView` (`:2877`) — the per-product detail page for a product with a connected GitHub repo.
**Alternatives considered:** (A) Keep `kanban-view.js` as the target and build a new rendering path onto it from scratch — rejected: it is fed exclusively by a Postgres `journeys` table (in-flight skill sessions) with zero path to `.github/pipeline-state.json`, confirmed by reading `buildProductKanbanColumns`/`buildTenantKanbanColumns`/`buildOrgKanbanColumns` in `products.js` and their own code comments. Building reactive-work rendering there would mean inventing a second, parallel pipeline-state.json ingestion path alongside the one that already exists for the correct surface. (B, chosen) Correct the target to `_renderConsolidatedFeaturesSection`, which already merges a connected repo's GitHub-synced taxonomy (covering every feature regardless of `track`) with journeys via `product-rollup.js`'s `mergeFeatureSources` — the actual gap is narrower than originally scoped: `feature.track` is computed and available but dropped before rendering, not a missing data path.
**Rationale:** A code-level audit (dispatched as a fork during /definition, 2026-11-09) read the real route handlers and confirmed this definitively. The original discovery's citation was never verified against the actual code at discovery or /clarify time — a repeat of this session's recurring lesson (see `feedback_narrow_negative_search` pattern): an assumed architecture was carried through approval without checking the real implementation. Confirmed with the operator that this repo is a real, intentionally-connected product in the multi-tenant web-ui (via `platform-self-registration.js`'s dogfooded product row), so this surface genuinely is reachable and applicable, not hypothetical.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition session, 2026-11-09
**Revisit trigger:** If `_renderConsolidatedFeaturesSection` is itself later superseded or restructured, re-verify this citation again before building against it.
---
**2026-11-09 | SCOPE | definition — sync-on-connect addition**
**Decision:** Add a 4th MVP item: wire an automatic `triggerProductSync` call into `product-repo.js`'s `_applyRepoChange`, immediately after a repo connection succeeds, so a newly-connected product's `pipeline-state.json` data is pulled in without requiring a manual "Refresh" click first.
**Alternatives considered:** (A) Leave sync entirely manual, as today — rejected: every other story in this initiative renders data from `product_rollups`, which is empty or stale for any product that was connected but never manually refreshed; building reactive-work visibility on top of that gap would mean the feature silently fails to demonstrate anything for a newly-connected product until an unrelated manual action happens first. (B) Add a full periodic/scheduled background resync — considered and deferred: the operator's request was specifically about sync *on connection*, not an always-on polling mechanism; a scheduled resync is a distinct, larger capability (cron infrastructure, staleness policy) that belongs in its own discovery if the sync-on-connect fix proves insufficient in practice. (C, chosen) Auto-trigger sync once, at the moment a repo connection succeeds, reusing the existing `triggerProductSync`/`isSyncInProgress` mechanism exactly as the manual Refresh button already does.
**Rationale:** Confirmed in code: `_applyRepoChange` (`product-repo.js`) updates `repo_provider`/`repo_owner`/`repo_name` and backfills local journey data *out* to the repo, but never calls `triggerProductSync` — the only call site found is the manual Refresh route (`handlePostProductSync`, `products.js:3022`). Raised directly by the operator during /definition ("ensure state files are synced into appropriate place in web UI when product configured to repo") after the surface-correction finding above.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition session, 2026-11-09
**Revisit trigger:** If a connected product's data still goes stale between connections in practice (e.g. the repo's `pipeline-state.json` changes after connect-time sync and nothing refreshes it), revisit whether a periodic resync (deferred under alternative B above) is now justified by real evidence.
---
**2026-11-09 | RISK-ACCEPT | benefit-metric**
**Decision:** Metric owner on `benefit-metric.md` is self-assigned to Hamish King (Platform Owner). Reviewers remains `[Pending]` rather than self-assigned.
**Alternatives considered:** (A) Self-assign Hamish King as both owner and reviewer — rejected, since the point of an independent reviewer is a second perspective on whether a metric is honest and measurable, which self-review cannot provide. (B) Fabricate a placeholder reviewer role to satisfy the skill's completion check — rejected, contradicts this pipeline's "never invent" discipline for unfilled fields.
**Rationale:** Metric owner is a genuine accountability role this operator already holds across every delivery artefact in this repo; self-assigning it reflects reality rather than inventing a role. The Reviewers field is left honestly unfilled because no second contributor exists in this personal-scope team to fill it.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), 2026-11-09
**Revisit trigger:** If a second contributor ever joins this project, assign them as Reviewer on this and every other open benefit-metric artefact rather than continuing to leave the field pending.
---

---

## Architecture Decision Records

<!-- None yet for this feature. -->
