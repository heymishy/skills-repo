# Contract Proposal: Act on a materiality suggestion without auto-triggering downstream changes

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s4-operator-acts-on-materiality-suggestion.md
**Date:** 2026-08-28

---

## What will be built

This contract resolves the two open items from review finding 1-M1 (RISK-ACCEPT res-s4-1-M1) explicitly:

1. **Downstream ordering:** "Downstream stages" is computed by finding the revised stage's index in `journey-store.js`'s single `STAGE_SEQUENCE` constant and taking every stage after it. No second, local hardcoded ordering list is introduced anywhere — this directly avoids the anti-pattern named in `architecture-guardrails.md` (`STAGE_ORDER` vs `STAGE_SEQUENCE` drift, previously caught in `dtra-s1`/`dspw-s1`).
2. **Flag persistence:** flag state is a new array field on the journey object (e.g. `journey.flaggedStages: string[]`, storing stage skillNames), persisted through the exact same path `journey-store.js` already uses for `completedStages` (`_diskAdapter.updateStage`-equivalent write, `_pgWrite`) — not in-memory-only.
3. A visible marker (text label or icon glyph — not colour alone) renders on each flagged stage's step-nav entry.
4. The operator's choice (flag / leave-as-is) is logged paired with res-s3's original suggestion ID.
5. When a flagged stage is reopened via res-s1's mechanism, its flag is cleared/acknowledged as part of that same reopen action.

## What will NOT be built

- Automatic regeneration of any downstream artefact.
- Any new skill or UI for "handling it differently" — the operator's free-text chat response covers that.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `flaggingDownstreamStagesSetsVisibleMarkerNoArtefactChange` + `flagMarkerUsesTextOrIconNotColourAlone` + `flagStatePersistsAcrossServerRestart` | unit / integration |
| AC2 | `leavingAsIsAppliesNoFlagTouchesNoArtefact` | unit |
| AC3 | `operatorChoicePairedWithOriginalSuggestionInLog` + `suggestionAndChoiceJoinYieldsCorrectAcceptanceSignal` | unit / integration |
| AC4 | `flagClearsWhenFlaggedStageIsReopened` + `flagDoesNotClearOnUnrelatedStageReopen` + `reopenClearFlagFlowEndToEnd` | unit / integration |

## Assumptions

- `journey.flaggedStages` is a reasonable field name; the coding agent may choose a different name but must follow the same persistence path as `completedStages` and must not introduce a second stage-ordering source.

## Estimated touch points

**CORRECTED 2026-08-28 (implementation-plan investigation).** The original text below undercounted the real touch points in three ways found by direct code investigation, each verified against the actual current codebase (not assumed):

1. **The "chat-turn handler for the flag-choice" is not a chat-turn handler at all.** The operator's flag/leave-as-is choice needs a dedicated, deterministic action — not a free-text message the model has to interpret (the story's own Out-of-Scope note, "the operator's free-text response... covers that," applies only to the *third* "handle it differently" path, not to flag/leave-as-is). This codebase already has an exact precedent for "operator clicks a button attached to a rendered card to record an explicit choice": assumption cards (`src/web-ui/routes/skills.js`, `handlePostAssumptionConfirm` + its client-side `attachCardHandlers`/`doAction` wiring, route `POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm`). res-s4 follows the same pattern: two buttons added to the materiality-suggestion bubble res-s3's Task 5 already renders (`appendBubble` in `skills.js`'s inlined client script), wired to a new `handlePostMaterialityAction`-shaped endpoint in `skills.js` (NOT `journey.js`) that looks up `session.journeyId` server-side — the client never needs direct access to `journeyId`.
2. **Two separate step-nav render functions exist in `journey.js`, not one, and both build near-duplicate markup independently:** `handleGetStageReview` (~line 657, the gate-confirm review page) and `handleGetJourneyStageView` (~line 894, the static completed-stage view). AC1's "each downstream stage's step-nav entry displays a visible flag/marker" is only genuinely true if BOTH render sites show the marker consistently — a flag that only appears on one of the two pages an operator might be viewing is a real, user-visible gap, not a cosmetic omission.
3. **`journey.flaggedStages` needs a different persistence call than `completedStages` uses, on both storage backends:**
   - **Postgres:** `src/web-ui/adapters/journey-store-pg.js`'s `_sanitise(journey)` is an *explicit field allowlist* (its own comment: "the only thing standing between a field working in-memory/on-disk and silently vanishing after a Postgres-backed restart — must be added explicitly, not inferred"). `flaggedStages` MUST be added to this allowlist or it silently fails to survive a PG-backed restart — exactly the failure mode `flagStatePersistsAcrossServerRestart` (this story's own integration test) is designed to catch, but only if it's actually run against a PG-backed adapter, not just the in-memory/disk path.
   - **Disk:** `completedStages` writes go through `_diskAdapter.updateStage(featureSlug, stageName, stageUpdate)` — a *per-stage* nested-field merge (`journey.stages[stageName]`), the wrong mechanism for a *top-level* array field like `flaggedStages`. The correct disk call for a top-level field mutation is `_diskAdapter.saveJourney(journey)` (whole-object overwrite), the same pattern `journey-store.js` already uses elsewhere for top-level fields (e.g. around line 88).

Files: `src/web-ui/routes/skills.js` (new `handlePostMaterialityAction` handler + client-side button rendering/wiring, following the `handlePostAssumptionConfirm`/`attachCardHandlers` precedent), `src/web-ui/routes/journey.js` (BOTH step-nav render sites — `handleGetStageReview` and `handleGetJourneyStageView` — plus `handleGetJourneyStageReopen` for AC4's flag-clear-on-reopen, placed so it fires on both the early-return "existing live session" path and the fresh-session-creation path, not only the latter), `src/web-ui/modules/journey-store.js` (new `flaggedStages` field, `saveJourney`-based persistence not `updateStage`, reused `STAGE_SEQUENCE`), `src/web-ui/adapters/journey-store-pg.js` (`_sanitise()` allowlist addition), `src/web-ui/server.js` (new route registration for the flag-action endpoint)
Services: none new
APIs: one new endpoint — `POST /api/skills/:name/sessions/:id/materiality-action` (or equivalent), following the assumption-confirm route's exact shape (`authGuard` + `requireNonViewer` wraps)

## Schema dependency (H8-ext)

This story's Dependencies block names res-s3 as upstream.
`schemaDepends: ["prStatus", "dodStatus"]` — confirm res-s3's fields before assuming its materiality-suggestion logging is available to pair against.
