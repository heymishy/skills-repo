# Contract Proposal: Default to all stories from /definition when starting the per-story review sequence

**What will be built:**
A new, narrow server-side function (e.g. `extractStoryIdsFromDefinitionArtefact(md)` in a new small module, `src/web-ui/modules/definition-story-extractor.js`) that returns `string[]` of story IDs, mirroring (not reusing verbatim, since the client-side version is an embedded string literal, not a requirable module) the same regex patterns as `parseDefinitionArtefact`'s H1-format and flat-story-fallback branches (`journey.js`, ~line 847 onward) — cross-referenced via code comments in both places. `handleGetStories` calls this against the journey's completed definition artefact and pre-fills the story-list textarea; `handlePostStories`'s existing logic is otherwise unchanged. If extraction returns zero results, the page falls back to today's empty-textarea behaviour.

**What will NOT be built:**
A refactor of `parseDefinitionArtefact` into a shared client+server module. Any change to `PER_STORY_SEQ`'s progression logic.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Integration: GET stories page, confirm pre-filled | Integration |
| AC2 | Integration: submit pre-filled list, drive per-story sequence | Integration |
| AC3 | E2E: edit the pre-filled list in a real browser | E2E |
| AC4 | Unit: extractor returns empty on malformed input, page falls back | Unit |
| AC5 | Unit: extractor output matches client-side parser's own story IDs, both formats | Unit |

**Assumptions:**
The two formats already documented in `parseDefinitionArtefact` (H1 epic/story headers "Format C", and a flat-story fallback) are the only formats real definition artefacts currently use — confirmed by reading the client-side parser's own comments, which name exactly these two branches with no others currently implemented.

**Estimated touch points:**
Files: New `src/web-ui/modules/definition-story-extractor.js`, `src/web-ui/routes/journey.js` (`handleGetStories` extended to call it).
Services: None new — reads an artefact already reachable via the journey's existing `completedStages`/`artefactPath`.
APIs: None new — same `GET /journey/:id/stories` route, richer response body.
