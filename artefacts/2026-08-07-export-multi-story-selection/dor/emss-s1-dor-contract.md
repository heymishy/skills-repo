# Contract Proposal: Let a --from-saas export request specify which DoR-approved story to fetch

**Story reference:** artefacts/2026-08-07-export-multi-story-selection/stories/emss-s1-select-story-for-saas-export.md
**Date:** 2026-08-07

## What will be built

`export-data-source.js`'s `findDorApprovedStory(feature)` gains an optional second parameter (`storySlug`); when supplied, it filters `collectStories(feature)` to the matching, signed-off story instead of taking the first match. `routes/export.js`'s `handleExportRoute` reads an optional `?story=` query parameter and threads it through. The CLI (`cli/bin/init.js`, `cli/lib/saas-fetch.js`) gains a `--story <story-slug>` companion flag to `--from-saas`, appended as the query parameter on the constructed request URL.

## What will NOT be built

- Any change to the default (no-selector) behaviour.
- A way to export multiple stories in one request.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fixture feature, no selector, assert first story returned | Unit |
| AC2 | Fixture feature, selector = second story, assert that story returned | Unit |
| AC3 | Selector matching no story / an unapproved story, assert not-found error | Unit |
| AC4 | Mocked HTTP layer, run CLI with `--story`, assert URL includes selector | Integration |

## Assumptions

- `collectStories(feature)`'s existing story-slug field (`s.slug`) is the correct, stable identifier to match a `?story=` selector against — same field already used elsewhere in this codebase for story identification.

## Estimated touch points

- **Files:** `src/web-ui/adapters/export-data-source.js`, `src/web-ui/routes/export.js`, `cli/bin/init.js`, `cli/lib/saas-fetch.js`
- **Services:** none new
- **APIs:** none new — additive query parameter on the existing endpoint

## Schema dependency declaration (H8-ext)

**schemaDepends:** `[]`

Dependencies block states "None" — no upstream story dependency.

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.
