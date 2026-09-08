# Decisions — Session-Origin Badge

## Decision: Tri-state counts all completed stages, not only outer-loop stages

**Date:** 2026-09-08

**Context:** The badge's tri-state (fully session-backed / mixed / no session) is derived by comparing a feature's completed stages against which of them carry a real `sessionId`. This pipeline splits stages into an outer loop (discovery through definition-of-ready — currently the only stages a live chat session can produce) and an inner loop (branch-setup through definition-of-done — currently always CLI/agent-driven, never expected to have a session). Counting all stages means most fully-implemented features will show "mixed" or "no session" once inner-loop stages complete, since those stages never carry a `sessionId` in today's build.

**Decision:** Count every completed stage, outer-loop and inner-loop alike. Do not special-case inner-loop stages out of the calculation.

**Rationale:** A future managed-agent inner loop driven from the web UI is plausible, at which point inner-loop stages could carry real sessions too. Hard-coding an outer-loop-only calculation would bake today's CLI-driven inner loop in as a permanent assumption, requiring a follow-up change if that changes. Counting all stages keeps the indicator a direct, literal reflection of real session presence rather than an assumption about which stages are "supposed to" have one — accepting that most finished features will read as "mixed" today as a known, expected consequence, not a defect.

---

## Decision: Reuse the existing "Bulk per-board-render lookup seam" pattern, not a raw SQL widening

**Date:** 2026-09-08

**Context:** `/design`'s own Key Technical Decisions proposed simply widening the two existing per-product SQL queries (product page, org kanban) to select `completedStages` directly. At `/definition`'s Step 1.5 architecture-constraints scan, `.github/architecture-guardrails.md`'s Approved Patterns section was found to already name an established convention for exactly this shape of problem — "Bulk per-board-render lookup seam" — used twice (`_getHtmlSessionsBulk`, `_getArtefactCountsBulk`) and explicitly naming "session-readiness" as a candidate third use.

**Decision:** sob-s1 adds a proper injectable `_getSessionOriginBulk`/`setGetSessionOriginBulk` seam in `products.js`, backed by a new `getSessionOriginForJourneys(journeyIds)` in `journey-store-pg.js` (a sibling to the existing `getArtefactCountsForJourneys`), rather than widening the raw SQL SELECT strings as `design.md` originally proposed. sob-s3 reuses the same seam rather than building a second one.

**Rationale:** Matches an existing, twice-proven convention in this codebase exactly, including its test-injection seam (`setGetSessionOriginBulk`) and its graceful-degradation contract — consistent with this repo's own guardrail note that "a future third use should reuse this named pattern rather than reinventing it." Supersedes the raw-SQL-widening approach in `design.md`'s Key Technical Decisions table; `design.md` is not being edited retroactively — this decisions.md entry is the record of the refinement.

---

## Decision: `deriveSessionOrigin` takes `hasJourney` as an explicit input, not inferred from an empty `completedStages` array

**Date:** 2026-09-08

**Context:** Found while writing sob-s2: `/journey`'s synthesized (non-real-journey) entries from `_mergeStateFeaturesIntoJourneyList` carry no `completedStages` array at all, despite representing a feature with real pipeline progress. An empty-array-only signature would be unable to distinguish "no real journey" (should show "no session") from "real journey exists, zero stages completed yet" (should show no indicator at all) — both would present as an empty/missing array to the function.

**Decision:** `deriveSessionOrigin({ hasJourney, completedStages })` takes `hasJourney` as a separate, explicit boolean input. `hasJourney: false` always yields "no session" regardless of `completedStages`; `hasJourney: true` with an empty array yields no indicator; `hasJourney: true` with entries yields the tri-state from sessionId presence.

**Rationale:** Prevents collapsing two genuinely different, visually distinct states into one ambiguous "empty" case — a mistake that would only have surfaced once sob-s2 was implemented against real `/journey` data, not from sob-s1's own product-page tests alone. Verified via sob-s1's own AC9 (a direct unit test of both branches of this contract).
