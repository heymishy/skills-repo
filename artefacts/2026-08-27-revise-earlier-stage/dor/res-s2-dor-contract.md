# Contract Proposal: Overwrite a reopened stage's artefact in place on revision

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s2-overwrite-artefact-in-place-on-revision.md
**Date:** 2026-08-28

---

## What will be built

In the chat-turn handler for a reopened session (res-s1), when the model's response signals a revised artefact (reusing the same "this turn produced an artefact" signal the initial stage-completion flow already detects):

1. Read the pre-revision content from the existing file at the stage's `artefactPath` and hold it in memory.
2. Validate the resolved write path: `path.resolve(artefactPath)` must `startsWith(repoRoot + path.sep)` — reject and return HTTP 400 without writing if not (CLAUDE.md path traversal guard).
3. Overwrite the file at that path with the new content — no new file, no dated copy.
4. Hand the in-memory pre-revision content forward, within the same turn-handling flow, as an input to res-s3's materiality check.
5. On any write failure: surface an explicit error turn to the operator; leave the original file untouched (no partial write).
6. Log the overwrite event with `journeyId`, `stageName`, `timestamp`.

## What will NOT be built

- Any versioning, diffing, or dated-copy mechanism.
- The materiality judgment itself — that's res-s3, which only consumes the handoff this story produces.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `overwritesArtefactFileInPlaceOnRevision` + integration end-to-end | unit / integration |
| AC2 | `downstreamReadOfArtefactPathReturnsNewContentAfterOverwrite` + `noStaleReadEvenWhenDownstreamReadIsImmediate` | integration |
| AC3 | `noArtefactChangeWhenReopenedSessionSendsNoRevision` | unit |
| AC4 | `writeFailureSurfacesExplicitErrorNoPartialFile` + `writeFailureDoesNotAdvanceCompletedStagesEntry` | unit |
| AC5 | `preRevisionContentCapturedBeforeWriteExecutes` + `preRevisionContentReachesRes-s3MaterialityCheckInput` | unit / integration |

## Assumptions

- The chat-turn handler already has a clear "this turn produced an artefact" signal (the same mechanism the initial stage-completion flow uses) — this story reuses it rather than inventing new detection logic.
- `path.resolve`/`startsWith(repoRoot)` guard follows the exact pattern established in the `ougl` decisions.md path-traversal ADR.

## Estimated touch points

Files: `src/web-ui/routes/journey.js` (chat-turn handler — same file res-s1 touches)
Services: none new
APIs: none new

## Schema dependency (H8-ext)

This story's Dependencies block names res-s1 as upstream (not "None").
`schemaDepends: ["prStatus", "dodStatus"]` — the coding agent should confirm res-s1's `prStatus` and `dodStatus` fields in `pipeline-state.json` before assuming res-s1's reopen mechanism is available to build on.
