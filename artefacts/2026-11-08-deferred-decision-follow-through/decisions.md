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

## Architecture Decision Records

<!-- None yet for this feature. -->
