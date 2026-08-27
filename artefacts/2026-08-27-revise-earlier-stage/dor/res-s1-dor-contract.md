# Contract Proposal: Reopen a completed stage's live session from the step-nav

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s1-reopen-completed-stage-live-session.md
**Date:** 2026-08-28

---

## What will be built

In the step-nav's completed-stage rendering path (`journey.js`, currently the `isDone && !isViewing` branch that links to the static `/journey/:id/stage/:skillName` view), add a check before that fallback:

1. Read the stage's `sessionId` from its `journey.completedStages` entry (already populated by `completeStage()`, per `frsr-s1`).
2. Call `getGetHtmlSession()(sessionId)` — the same read-only lookup `handleGetJourneyStage` and `handleGetJourneyById` already use.
3. If it resolves to a live session: render a direct link to `/skills/:skillName/sessions/:sessionId/chat` instead of the static view URL.
4. If it resolves to `null` (session pruned/expired, or predates `frsr-s1`): create a fresh session via the existing session-creation path, injecting the stage's on-disk artefact content as `priorArtefacts` (via `buildSystemPrompt`'s existing parameter, read fresh via `fs.readFileSync` per ADR-023 disk canonicity) — and, per AC3's clarification, update that `completedStages` entry's `sessionId` to point at the new session so a future reopen can use the cheaper existing-session path.
5. Fire an `earlier_stage_reopened` audit event on either path, with `journeyId` and `stageName`.

## What will NOT be built

- Any change to the artefact-index page's "View" link, or any other entry point besides the step-nav — those stay pointed at the static read-only view.
- Any change to what happens to the artefact once a revision turn is sent inside the reopened session — that's res-s2.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `rendersDirectChatLinkForCompletedStageWithLiveSession` + `completedStageReopenEndToEndViaExistingSession` | unit / integration |
| AC2 | `createsFreshSessionWithPriorArtefactsWhenNoLiveSessionExists` + `completedStageReopenEndToEndViaFreshSession` | unit / integration |
| AC3 | `journeyStateShapeUnchangedAfterReopen` + `journeyStateShapeUnchangedAfterFreshSessionReopen` | integration |
| AC4 | `stepNavLinkForNotYetCompletedStageIsUnchangedByThisStory` | unit |

## Assumptions

- `journey.completedStages` entries reliably carry a `sessionId` field for stages completed after `frsr-s1` shipped; stages completed before that story may lack it — this is treated identically to the "session pruned" case (falls through to AC2's fresh-session path), not a separate error case.
- `getGetHtmlSession()` is already wired to a real implementation in `server.js` (existing adapter, reused — not new) — no new wiring task needed.

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (step-nav render function)
Services: none new
APIs: none new — reuses the existing `/skills/:skillName/sessions/:sessionId/chat` route
