# Contract Proposal — Group a story's own bare-slug definition file into its own accordion section

**Story:** artefacts/2026-09-05-bare-slug-story-grouping-fix/stories/bsgm-s1-fix-bare-slug-story-file-grouping.md
**Date:** 2026-09-05

---

## What will be built

`groupArtefactsByStory` (`src/web-ui/adapters/feature-story-structure.js`) matching predicate extended from:
```js
const matchedSlug = allSlugs.find((slug) => basename.indexOf(slug + '-') === 0);
```
to:
```js
const matchedSlug = allSlugs.find((slug) => basename.indexOf(slug + '-') === 0 || basename === slug + '.md');
```
No other line changes.

## What will NOT be built

- No change to `deriveTypeFromPath` or any other type/label derivation logic.
- No renaming of any existing story file.
- No change to epic-level artefact placement.
- No new E2E test infrastructure — this is a pure data-layer fix verified by unit tests plus a manual live-page check.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests: bare `<slug>.md` groups into its own flat story and its own epic-nested story | Unit |
| AC2 | Unit test: existing descriptive-suffix filename behaviour unchanged | Unit (regression guard) |
| AC3 | Unit tests: `p3.1`/`p3.1a` prefix disambiguation preserved for both the new bare case and the existing hyphenated case | Unit (regression guard) |
| AC4 | Manual verification scenario against the real, already-affected `2026-09-02-product-dashboard-triage` page, post-merge | Manual |

## Assumptions

- All story artefact files in this repo use the `.md` extension (confirmed — this is a repo-wide, unbroken convention across every artefact type).
- The existing longest-first slug sort (`allSlugs.sort((a, b) => b.length - a.length)`) is sufficient to disambiguate the new exact-match case too, since exact string equality carries no substring-ambiguity risk regardless of iteration order — confirmed by direct reasoning, verified by AC3's own test.

## Estimated touch points

**Files:** `src/web-ui/adapters/feature-story-structure.js` (1-line change), new `tests/check-bsgm-s1-bare-slug-story-grouping.js`
**Services:** None
**APIs:** None
