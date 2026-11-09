# Decision Log: deferred-decision-follow-through

**Feature:** Deferred Decision Follow-Through
**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
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
**2026-11-08 | ARCH | discovery (/clarify)**
**Decision:** Story 1's deferred-item record schema generalizes initiative 4's incident-record schema (its own story 1) with a `type` field (`incident` | `deferred-item`), rather than building a separate, parallel record store.
**Alternatives considered:** (A) A fully separate deferred-item store, independent of initiative 4's incident records — rejected due to duplication risk, same reasoning already applied to initiative 4's own story-3 web UI decision. (B) Wait until initiative 4 ships its schema, then retrofit — rejected because nothing is built yet for either feature, so designing them together now is strictly cheaper than a later retrofit.
**Rationale:** Neither initiative 4 nor initiative 5 has any implementation yet. Generalizing the schema now, before either is built, is additive by construction — there is nothing existing to break. Doing it later, after initiative 4 ships a narrower schema, would require a real migration.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** When initiative 4 reaches its own `/definition`, confirm its story 1 is scoped to design the schema with this `type` field from day 1, informed by this decision — if that discipline slips and initiative 4 ships a narrower schema first, this becomes a real retrofit instead of a clean extension.
---
**2026-11-08 | RISK-ACCEPT | discovery (/clarify)**
**Decision:** Accept that PostHog's pipeline-telemetry instrumentation (`stage_completed`, `stage_started`, `artefact_commit_succeeded`/`failed`) fires too sparsely today to be a reliable signal, rather than blocking story 3 on first fixing the instrumentation.
**Alternatives considered:** (A) Block story 3 until the sparse-firing root cause is investigated and fixed — rejected as a scope expansion beyond this initiative's own job; investigating why tracking calls aren't firing consistently is itself a separate, real piece of work. (B) Drop story 3 entirely until volume improves — rejected because supplementary, gracefully-degrading use of real telemetry (even sparse) is still better than the zero real signal that exists today, and the sparsity finding itself becomes useful input to the mechanism.
**Rationale:** Queried real event volume directly during /clarify: `stage_completed` fired once in 60 days; `artefact_commit_succeeded`/`failed` once each in 3 months; `stage_started` (25 events) and `kanban_viewed` (55 events) over 3 months were healthier but still thin. This is real telemetry, not fabricated, but not yet mature enough to be a primary source. Treating it as supplementary context, with graceful degradation when absent, captures real value without overclaiming reliability.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** Once this mechanism ships, its own first real deferred-item record should be "pipeline telemetry events fire too sparsely to rely on — investigate whether tracking calls are wired into real skill execution." If that investigation resolves and real volume improves, revisit whether story 3's data can be promoted from supplementary to primary.
---

---
**2026-11-09 | ARCH | definition — surface correction (cross-reference)**
**Decision:** Story 5's "the shared surface alongside incident records" is confirmed to mean `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`) — the surface initiative 4's story 3 builds against, itself corrected from an original (incorrect) `kanban-view.js` citation inherited from initiative 1.
**Alternatives considered:** None separately evaluated here — this entry cross-references the full ARCH decision and rationale logged in `artefacts/2026-11-08-unified-reactive-proactive-visibility/decisions.md` (2026-11-09), where the code-level audit was actually performed.
**Rationale:** This story was never designed against a named file directly — it inherits "the shared surface" from initiative 4's story 3. Logging this cross-reference so a future reader of this decisions.md doesn't need to independently re-derive which surface that phrase actually resolves to.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition session, 2026-11-09
**Revisit trigger:** None — factual cross-reference, not an independent design choice.
---
**2026-11-09 | RISK-ACCEPT | benefit-metric**
**Decision:** Metric owner on `benefit-metric.md` is self-assigned to Hamish King (Platform Owner). Reviewers remains `[Pending]` rather than self-assigned.
**Alternatives considered:** (A) Self-assign Hamish King as both owner and reviewer — rejected, since the point of an independent reviewer is a second perspective on whether a metric is honest and measurable, which self-review cannot provide. (B) Fabricate a placeholder reviewer role to satisfy the skill's completion check — rejected, contradicts this pipeline's "never invent" discipline for unfilled fields.
**Rationale:** Metric owner is a genuine accountability role this operator already holds across every delivery artefact in this repo; self-assigning it reflects reality rather than inventing a role. The Reviewers field is left honestly unfilled because no second contributor exists in this personal-scope team to fill it.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), 2026-11-09
**Revisit trigger:** If a second contributor ever joins this project, assign them as Reviewer on this and every other open benefit-metric artefact rather than continuing to leave the field pending.
---

---
**2026-11-09 | ARCH | review — ddft-s4 hook-point correction**
**Decision:** Swap `ddft-s4`'s third self-registration hook from `/benefit-metric` to `/definition-of-done` (Step 6, "Metric signal"). The hook count stays at 3; only which third skill is hooked changes.
**Alternatives considered:** (A) Keep `/benefit-metric` as the third hook and redesign its AC around something that skill's own State-update section can observe at authoring time (e.g. a metric defined with no baseline or measurement plan at all) — rejected for this fix pass: it would answer a narrower question than the story's own stated intent ("still-unmeasured metrics at DoD"), and introducing it alongside the DoD hook would be scope expansion during a fix, not a fix. (B, chosen) Retarget to `/definition-of-done`'s Step 6, which already determines and records exactly the "still not-yet-measured at DoD" condition this story's intent describes, confirmed by reading `skills/definition-of-done/SKILL.md:184-288` in full.
**Rationale:** `/review` (2026-11-09, finding 1-H1 on `ddft-s4`) found AC3's named hook point could not structurally observe its own stated trigger condition — `/benefit-metric`'s State-update section runs once, at authoring time, when every metric is unmeasured by construction. `/definition-of-done`'s own Step 6 is the real, already-standardized place this fact becomes knowable.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /review fix-and-rerun, 2026-11-09
**Revisit trigger:** None — factual correction of which skill's hook point matches the story's own stated intent, not a new design choice that could independently reverse.
---

---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — products.js pre-existing design-token debt (cross-reference)**
**Decision:** `ddft-s5`'s H-DESIGN finding against `src/web-ui/routes/products.js` (~40 pre-existing non-token colors, none introduced by this story) is accepted on the same basis as the full RISK-ACCEPT logged in `artefacts/2026-11-08-unified-reactive-proactive-visibility/decisions.md` (2026-11-09).
**Alternatives considered:** None separately evaluated here — this entry cross-references the full decision and rationale logged where the finding was first evaluated.
**Rationale:** Same shared file, same pre-existing debt, same operator decision — logging the cross-reference so a future reader of this feature's own decisions.md doesn't need to re-derive it.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready, 2026-11-09
**Revisit trigger:** Same as the full entry — resolved when the `products.js` retrofit story referenced there lands.
---

---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — verification scripts not independently reviewed (W4)**
**Decision:** Acknowledge, rather than resolve, W4 ("verification script reviewed by a domain expert") for all 5 of this feature's stories (ddft-s1 through ddft-s5) at DoR sign-off. No independent domain-expert review of the 5 AC verification scripts has happened — Hamish King, as both story author and Platform Owner, is the only available reviewer in this personal-scope project.
**Alternatives considered:** (A) Block DoR sign-off until an independent reviewer is found — rejected, no second contributor exists in this project to serve that role; blocking on an unavailable resource is not a real resolution. (B, chosen) Acknowledge the risk explicitly, proceed, and set a concrete revisit trigger tied to a real future event rather than an indefinite deferral.
**Rationale:** Same self-review limitation already acknowledged for benefit-metric ownership (2026-11-09 RISK-ACCEPT, metric owner self-assignment) — the honest constraint of a solo-operator project, not a process failure to paper over.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready, 2026-11-09
**Revisit trigger:** If a second contributor ever joins this project, have them formally review these 5 verification scripts before the next time any of these stories' scope changes.
---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — ddft-s5 fetch-latency NFR baseline (due now, per nfr-profile.md)**
**Decision:** `nfr-profile.md`'s own Gaps table flagged the `workspace/incidents.json` web-UI fetch-latency baseline as "Due: Before ddft-s5 reaches /definition-of-ready." At that point now reached, accept the gap rather than inventing a baseline with no real traffic to measure it against.
**Alternatives considered:** (A) Invent a placeholder latency threshold now so the NFR table shows a number — rejected, this pipeline's own "never invent" discipline (already applied to benefit-metric Reviewers field) rules this out; a fabricated number is worse than an honestly-flagged gap. (B, chosen) Accept explicitly, matching the same treatment already given to the identical gap on `urpv-s3` and `itar-s3`'s own fetch paths.
**Rationale:** No implementation exists yet for any of the three stories sharing this fetch path (`urpv-s3`, `itar-s3`, `ddft-s5`) — there is no real traffic to measure a baseline against. Setting a number now would be guessing, not measuring.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready, 2026-11-09
**Revisit trigger:** Once any of the three stories sharing this fetch path ships and real traffic exists, measure an actual baseline and update all three NFR profiles together (they share one open gap, not three independent ones).
---

## Architecture Decision Records

<!-- None yet for this feature. -->
