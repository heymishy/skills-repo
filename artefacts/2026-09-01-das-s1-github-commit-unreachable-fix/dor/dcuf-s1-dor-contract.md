# Contract Proposal: Move das-s1's GitHub-commit dual-write to the point where a stage actually first completes

**Story reference:** artefacts/2026-09-01-das-s1-github-commit-unreachable-fix/stories/dcuf-s1-move-github-commit-to-real-completion-point.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-09-01

---

## What will be built

In `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml`, inside the existing `if (session.journeyId && !session._stageDone) { ... }` block:

1. Move the `_revisionJourney`/`_existingStageEntry` computation to run **before** `session._stageDone = true` is set (currently it runs after; no behavioural change to these two lines themselves, just reordering).
2. Insert, immediately after computing `_existingStageEntry` and before `session._stageDone = true`:
   ```js
   if (!_existingStageEntry) {
     var _dasOwnerRepo = null;
     try {
       _dasOwnerRepo = await require('../adapters/export-data-source')
         .ownerRepoForFeature(session.featureSlug || slug, req.session.accessToken);
     } catch (_dasResolveErr) {
       _dasOwnerRepo = null; // das-s1 AC4: no connected repo / unresolved -- proceed unchanged
     }
     if (_dasOwnerRepo) {
       try {
         var _dasDiskContent = fs.readFileSync(_autoAbsPath, 'utf8'); // ADR-023 disk canonicity
         await require('../adapters/artefact-commit-writer').commitArtefact(
           session.artefactPath, _dasDiskContent, req.session.accessToken,
           _dasOwnerRepo.owner, _dasOwnerRepo.repo
         );
       } catch (_dasCommitErr) {
         // das-s1 AC2: stage NOT marked complete -- _stageDone stays unset,
         // completeStage never runs, retry can re-attempt.
         res.write('data: ' + JSON.stringify({
           error: 'Could not commit this stage\'s artefact to the connected repository — please try again.'
         }) + '\n\n');
         clearInterval(_keepaliveInterval);
         res.end();
         return;
       }
     }
   }
   ```
3. `session._stageDone = true;` and everything below it (existing `completeStage`/materiality-hook/Postgres-save/etc. logic) remains exactly as-is, unmoved.

No change to `journey.js`, `export-data-source.js`, or `artefact-commit-writer.js` — this story only adds a second call site for two already-existing, already-tested functions.

## What will NOT be built

- No retroactive backfill for already-completed stages.
- No change to the local-only `_skillTurnGitCommit`/`stis-s1` call earlier in the same function.
- No new adapter, no new module.
- No change to `journey.js`'s own `handlePostGateConfirm` block — left in place, still correct for any path that reaches it with `_stageDone` genuinely unset.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mock DB pool + commitArtefact adapter, drive a turn, assert one commit call + local disk write | Unit |
| AC2 | Same, adapter throws, assert _stageDone unset, no completeStage call, SSE error event | Unit |
| AC3 | Mock pool with no matching rows, assert commitArtefact never called, unchanged completion | Unit |
| AC4 | Pre-seed a completedStages entry for the same skillName, assert commitArtefact never called | Unit |
| AC5 | Run tests/check-das-s1-commit-artefact-git-fallback.js unmodified | Regression |
| AC6 | Run the 4 other skills.js-touching story test files unmodified | Regression |

## Assumptions

- `session.featureSlug` is reliably populated for any journey-linked session reaching this point (set by `linkSessionToJourney` at journey-link time) — same assumption `journey.js`'s own call already makes via `journey.featureSlug`.
- `_autoAbsPath` (the just-written local disk file's absolute path) is valid and readable at this point in the function — it was written a few lines earlier in this same code path, unconditionally, before this block is reached.
- `_existingStageEntry`'s existing computation (unchanged, just moved earlier) remains a correct proxy for "is this a first completion or a revision" — this is `das-s1`'s own existing distinction, not a new one.

## Estimated touch points

Files: `src/web-ui/routes/skills.js` only. Services: none new (reuses `export-data-source.js` and `artefact-commit-writer.js` unchanged). New test file: `tests/check-dcuf-s1-github-commit-real-completion-point.js`.
