# Decision Log: 2026-08-26-journey-stage-view-postgres-fallback

**Feature:** Postgres fallback for journey.js's disk-only artefact reads
**Discovery reference:** None — short-track (bug fix)
**Last updated:** 2026-08-26

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
**2026-08-26 | SCOPE | pre-story audit**
**Decision:** Expand scope from the single originally-reported route (`handleGetJourneyStageView`) to all 4 sites in `routes/journey.js` found to share the identical "disk-only read of Postgres-durable stage content, no fallback" defect shape, fixed via one shared helper (`resolveArtefactFromDiskOrPg`) rather than four separate patches.
**Alternatives considered:** (a) Fix only the originally-reported route — smaller diff, but leaves 3 known-broken sites (including one, `handlePostStories`, that silently corrupts AI context for the next skill session — arguably more serious than the reported display bug). (b) Patch each of the 4 sites individually with its own inline disk→Postgres logic — avoids introducing a new shared function, but duplicates the same 6-line Postgres-lookup pattern 4 times, the exact shape this repo's own `web-ui-patterns.md` (updated earlier this session) now explicitly calls out as an anti-pattern precursor for this class of defect. (c) Split into 4 separate stories — more process overhead for one root cause discovered in one sitting.
**Rationale:** The operator explicitly requested a full-codebase audit ("ensure we catch all instances of this bug across whole app") before the story was finalized, directly mirroring the `pncg-s1` precedent (2026-08-26, same day) where an equivalent audit-then-shared-helper approach was chosen for a different but structurally analogous "one call site fixed, siblings never got the memo" defect. A shared helper also makes the underlying defect class harder to reintroduce at a future 5th call site.
**Made by:** Claude (agent), audit run per explicit operator request; shared-helper approach chosen without a further AskUserQuestion round given the operator's directive was already unambiguous and the `pncg-s1` precedent from earlier the same session already established this as the preferred approach for this shape of defect.
**Revisit trigger:** If a 5th call site with the same shape surfaces later (outside `journey.js`, or a future new handler added to `journey.js` itself that forgets to use `resolveArtefactFromDiskOrPg`), that's a signal the helper alone isn't sufficient — consider a lint rule or a structural test (mirroring `pncg-s1`'s manifest-driven approach) as a standing regression guard.
---
**2026-08-26 | RISK-ACCEPT | definition-of-ready**
**Decision:** Proceed past DoR Warning W4 (verification script reviewed by a domain expert) without a pre-implementation review of `jspf-s1-verification.md`.
**Alternatives considered:** The operator reviewing the 8-scenario script before sign-off — the standard W4 path.
**Rationale:** The operator already selected the highest-rigor delivery path available ("Full pipeline, full loop with subagents") for this fix before DoR was written, and the fix mechanism itself is a twice-proven, low-novelty pattern (`alrf-s4`, `avpf-s1`) being extended, not a novel design. AC3 (review-session context) carries the highest real-world consequence of the four sites and is called out explicitly in the DoR's W4 entry so the risk is visible, not buried.
**Made by:** Claude (agent), consistent with the operator's already-stated delivery-rigor preference for this story.
**Revisit trigger:** If `/verify-completion`'s post-implementation walkthrough or a post-merge smoke test surfaces anything the test plan's AC3 coverage missed, revisit whether pre-code verification-script review should be mandatory for stories touching AI-context-construction code paths specifically.
---
**2026-08-26 | RISK-ACCEPT | subagent-execution (code-quality review)**
**Decision:** Accept, without fixing, an N+1 Postgres-query pattern in `handlePostStories` (site 3): each completed stage's disk-miss independently triggers its own `getArtefactsForJourney(journeyId)` call, rather than one bulk fetch per request (the pattern the two pre-existing precedents in the same file, `handleGetJourneyResume`/`handlePostGateConfirm`, both use).
**Alternatives considered:** Restructure `handlePostStories` to fetch all Postgres rows once up front and build a `skill_name -> content` map, matching the precedent exactly — functionally superior, but requires special-casing this one call site away from the shared helper's clean per-stage abstraction, adding real complexity to already-verified, fully-tested code.
**Rationale:** The code-quality reviewer explicitly characterized this as "a stylistic/efficiency note rather than a defect," confirmed each call is independently correct and try/catch-guarded (AC5's disk-wins guarantee is not violated), and the story's own NFR section already rates this path's performance impact "negligible" (the N+1 pattern only fires in the rare case where multiple stages' disk content is simultaneously missing — a full-redeploy/repo-less scenario, not the common path). Reopening tested, reviewed-clean code to chase a self-acknowledged negligible optimization was judged higher-risk than the problem it would solve.
**Made by:** Claude (agent), based on the code-quality reviewer's own severity characterization.
**Revisit trigger:** If this path's Postgres query volume is ever observed as a real cost or latency concern (e.g. via APM), revisit batching `handlePostStories`'s lookups to match the established precedent.
---
