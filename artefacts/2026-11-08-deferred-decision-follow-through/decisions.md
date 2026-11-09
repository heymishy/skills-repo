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

## Architecture Decision Records

<!-- None yet for this feature. -->
