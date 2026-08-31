# Contract Proposal: Align Web UI test-plan/DoR artefact save paths and Step-1 scanner with the canonical per-story convention

**Story reference:** artefacts/2026-08-31-webui-story-artefact-path-fix/stories/wsap-s1-align-webui-story-scoped-artefact-paths.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-31

---

## What will be built

- **`linkSessionToJourney`** (src/web-ui/routes/skills.js): after the existing `session.featureSlug` assignment, additionally read `journey.stories[journey.currentStoryIndex]` (guarding for missing/short arrays) and set `session.currentStoryId = currentStory.id || currentStory.slug || null` when a story is found.
- **New shared helper** `computeStoryScopedArtefactPath(slug, skillName, storyId)`:
  ```js
  var _STORY_SCOPED_ARTEFACT = {
    'test-plan':           { subdir: 'test-plans', suffix: '-test-plan.md' },
    'definition-of-ready': { subdir: 'dor',        suffix: '-dor.md' }
  };
  function computeArtefactSavePath(slug, skillName, storyId) {
    var scoped = _STORY_SCOPED_ARTEFACT[skillName];
    if (scoped && storyId) {
      return 'artefacts/' + slug + '/' + scoped.subdir + '/' + storyId + scoped.suffix;
    }
    return 'artefacts/' + slug + '/' + skillName + '.md';
  }
  ```
- **Both `session.artefactPath` construction sites** (`htmlSubmitTurn` ~line 2556, `handlePostTurnStreamHtml` ~line 5183) call this helper instead of the current inline `'artefacts/' + slug + '/' + session.skillName + '.md'`, passing `session.currentStoryId`.
- **`computeStep1Summary`**'s `test-plan`/`definition-of-ready` branches rewritten to scan `artefacts/[featureSlug]/test-plans/` and `artefacts/[featureSlug]/dor/` respectively for files ending in `-test-plan.md`/`-dor.md`, extracting the story ID as the filename prefix before that suffix. Path-traversal guard mirrors the existing `review` branch's `resolvedDir.startsWith(artefactsBase + path.sep)` check.
- **Prompt SLUG text** (test-plan and definition-of-ready protocol blocks): changed from instructing `[featureSlug]-tp-[story-id]`/`[featureSlug]-dor-[story-id]` to just the plain feature slug, with a note that the server determines the per-story save path automatically — matching the wording style already used by the `review`/`definition` blocks in the same file.

## What will NOT be built

- No change to `journey.js`'s `currentStoryIndex` advancement logic or its 8 `linkSessionToJourney` call sites.
- No `dor-contract.md` handling — confirmed never produced by this code path.
- No migration of already-written flat-path artefacts from earlier sessions.
- No change to `lpmf-s1`'s `listArtefacts` (separate story/file).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Real journey via journeyStore.createJourney/setJourneyFields, assert session.currentStoryId after linkSessionToJourney | Unit |
| AC2 | _setHtmlSession with currentStoryId, drive htmlSubmitTurn, assert per-story test-plan path | Unit |
| AC3 | Same for definition-of-ready | Unit |
| AC4 | No currentStoryId -> assert unchanged flat path (both skillNames) | Unit (regression) |
| AC5 | Real files in test-plans/ subdir, assert computeStep1Summary finds them | Unit |
| AC6 | Real file in dor/ subdir, assert computeStep1Summary finds it | Unit |
| AC7 | Same AC2/AC3 scenarios via handlePostTurnStreamHtml | Unit |
| AC8 | Run tests/check-alrf-s8-journey-slug-priority.js unmodified | Regression |

## Assumptions

- `journey.stories[].id` is the canonical story identifier used consistently across the codebase (already the pattern at `journey.js` line ~2374: `currentStory.id || currentStory.slug || null`).
- No other code path reads `slugMatch`'s captured value for any purpose other than constructing `session.artefactPath` (confirmed via grep — its only other use is buffering across multi-turn artefact accumulation, unaffected by this story).

## Estimated touch points

Files: `src/web-ui/routes/skills.js` only. Services: none. APIs: none. New test file: `tests/check-wsap-s1-story-scoped-artefact-paths.js`.
