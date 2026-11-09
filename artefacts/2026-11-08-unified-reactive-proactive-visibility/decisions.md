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

---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — products.js pre-existing design-token debt**
**Decision:** Accept, rather than resolve, the H-DESIGN hard block's finding against `src/web-ui/routes/products.js` for `urpv-s2`, `urpv-s3`, and `urpv-s4` (and, by the same shared finding, `itar-s3` and `ddft-s5` in their own features' decisions — see cross-reference entries there). `node scripts/check-design-tokens.js` run directly against the file found ~40 hardcoded, non-token color values (`#fff`, `#ef4444`, `#22c55e`, `#b00020`, `#c33`, `#a4262c`, `#c0392b`, and others) scattered throughout the file, none of which were introduced by, or related to, any of these five stories.
**Alternatives considered:** (A) Hard-block all five design-system-tracked stories' DoR sign-off until `products.js` is fully retrofitted to `DESIGN.md`'s token set — rejected by the operator as disproportionate: none of these stories caused this debt, and blocking five unrelated feature stories on a full legacy-file retrofit would stall real delivery work behind pre-existing tech debt with no relation to it. (B) Have each story's own implementation silently work around the pre-existing colors without flagging them — rejected, this would hide the finding rather than making it visible and actionable later. (C, chosen) RISK-ACCEPT the pre-existing debt explicitly, with each of the five stories' own DoR contracts still required to use real `DESIGN.md` tokens for any line they themselves add or change — H-DESIGN is treated as passed-with-accepted-exception for the pre-existing colors, not silently skipped.
**Rationale:** `scripts/check-design-tokens.js` scans the entire declared touched file, not just a story's own diff — a design limitation of the check itself, not evidence these five stories are non-compliant. This is structurally the same situation as the pre-existing `tfhc-s1` pipeline-state-integrity finding that has fired on every integrity check this session: a confirmed, pre-existing, out-of-scope gap, correctly handled by RISK-ACCEPT rather than by expanding scope to fix it inside an unrelated story.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready, 2026-11-09
**Revisit trigger:** Run a dedicated retrofit story — scoped explicitly to bringing `products.js`'s existing inline colors into `DESIGN.md`'s token table (or adding the missing-but-legitimate values to `DESIGN.md` as new tokens where appropriate) — as a follow-up from this 2026-11-08 tranche's own work, flagged here so it is not lost once this tranche's five stories ship. Until that retrofit lands, every future story that declares `products.js` as a touched file will hit the same H-DESIGN finding and should cite this entry rather than re-discovering it.
---

---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — verification script domain-expert review (W4, all 4 stories)**
**Decision:** Acknowledge, rather than resolve, warning W4 ("verification script reviewed by a domain expert") for all 4 stories in this feature (urpv-s1, urpv-s2, urpv-s3, urpv-s4). No second contributor exists in this personal-scope project to independently review any of the 4 AC verification scripts against the behaviour they describe.
**Alternatives considered:** (A) Block DoR sign-off on all 4 stories until an independent reviewer is found — rejected, no such person exists on this project; this would permanently block every story in a solo-operator repo. (B, chosen) RISK-ACCEPT once, covering all 4 stories together (rather than 4 near-identical entries), since the underlying fact — no second contributor exists — is identical across all of them and does not need restating per story.
**Rationale:** Hamish King, as story author and Platform Owner, is the only available reviewer. This is a structural fact of a personal-scope project, not a quality gap specific to any one of these 4 stories' verification scripts.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready, 2026-11-09
**Revisit trigger:** If a second contributor joins this project, have them formally review all 4 of this feature's verification scripts (and any others still open at that time) before the next time any of these stories' scope changes.
---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — urpv-s3 NFR baseline due-date re-targeted (W5)**
**Decision:** `nfr-profile.md`'s Gaps table set a due date of "Before urpv-s3 reaches /definition-of-ready" for measuring real `decisions.md` per-feature fetch latency. That measurement was not performed, and DoR is being signed off without it. The obligation is re-targeted, not dropped: measure real latency against this repo's own connected product (post urpv-s1) and update `nfr-profile.md` before urpv-s3's PR is opened for merge — a concrete, checkable pre-PR gate rather than an open-ended "someday" deferral.
**Alternatives considered:** (A) Block urpv-s3's DoR sign-off until the measurement happens — rejected: the measurement genuinely requires urpv-s1 to have shipped and synced real data first (this repo's own connected-product data), which hasn't happened yet at DoR time for a story in the same tranche: a strict "before DoR" reading of the original due date was unachievable by construction, not a missed deadline through negligence. (B, chosen) Move the checkpoint to "before PR merge," which is achievable (urpv-s1 will exist by then) and is already named explicitly in this story's own Coding Agent Instructions as a merge-blocking action, not a soft suggestion.
**Rationale:** The original due date assumed the measurement could happen at /definition-of-ready time, but the data needed to take that measurement (this repo as a real, multi-feature connected product with synced `pipeline-state.json`) only exists after urpv-s1 ships — a sequencing fact missed when the due date was first written in the NFR profile. Re-targeting to pre-merge is the earliest point the measurement is actually possible, not a weakening of the obligation.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready, 2026-11-09
**Revisit trigger:** If the measurement is not recorded in `nfr-profile.md` by the time urpv-s3's PR is opened, `/branch-complete` or `/verify-completion` should block on this explicitly rather than let it slide a second time.
---

## Architecture Decision Records

<!-- None yet for this feature. -->
