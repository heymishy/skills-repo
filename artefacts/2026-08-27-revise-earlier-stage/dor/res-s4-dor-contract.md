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

Files: `src/web-ui/routes/journey.js` (step-nav render, chat-turn handler for the flag-choice), `src/web-ui/modules/journey-store.js` (new `flaggedStages` field + persistence, reused `STAGE_SEQUENCE`)
Services: none new
APIs: none new

## Schema dependency (H8-ext)

This story's Dependencies block names res-s3 as upstream.
`schemaDepends: ["prStatus", "dodStatus"]` — confirm res-s3's fields before assuming its materiality-suggestion logging is available to pair against.
