## Test Plan: rpca-embed-hotfix3 — embedScreenshotPaths writes a story-prefixed relative image path

**Story reference:** Short-track fix (CLAUDE.md "Short-track" process) — found regenerating the real `journey-cx-redesign` walkthrough after `rpca-embed-hotfix2` merged. `embedScreenshotPaths` writes every image link as `![<acId>](screenshots/<fileName>)` — a bare basename with no story-directory prefix. `walkthrough.md` lives at `artefacts/<feature>/playback/walkthrough.md`, one directory above each story's own screenshots (`artefacts/<feature>/playback/<storySlug>/screenshots/<acId>.png`). A relative link of `screenshots/AC1.png` therefore resolves to `artefacts/<feature>/playback/screenshots/AC1.png`, which does not exist for any multi-story feature — confirmed by listing the real directory tree for `journey-cx-redesign`. Every embedded image in the real walkthrough is a broken link.

This defect predates both prior hotfixes: it was present in the original `embedScreenshotPaths` and untouched by the heading-matching fixes in hotfix1/hotfix2, which only changed WHICH heading an image lands under, not the image path string itself. It was visible in hotfix1's own code comment ("the story context lives only in the directory, which embedScreenshotPaths' own output format never includes") but was treated as an acceptable simplification for that test's own purpose (proving no duplicate pile-up via image count), not recognised as a real broken-link defect until the full walkthrough was actually rendered end-to-end against real multi-story data and the directory tree checked.

**Date:** 2026-10-20
**Test runner:** `node scripts/run-all-tests.js`

---

## Root cause and fix

`embedScreenshotPaths`'s insertion line hardcodes the image path as `screenshots/${fileName}` (basename only), discarding the `storySlug` segment it already derives from `shot.path` for heading-matching purposes (introduced in hotfix2). The fix: reuse that same derived `storySlug` to build the image path as `${storySlug}/screenshots/${fileName}` when a `storySlug` is available, falling back to the old bare `screenshots/${fileName}` only when `storySlug` cannot be derived (defensive — in practice always derivable given the established `artefacts/<feature>/playback/<storySlug>/screenshots/<acId>.png` convention).

This also corrects three pre-existing tests whose own assertions enshrined the broken path as "expected": `check-fpd-s1-walkthrough-document-and-screenshots.js` (AC3), `check-rpca-embed-hotfix1-cross-story-ac-collision.js` (AC1), and `check-rpca-embed-hotfix2-story-scoped-matching.js` (AC1, AC4 positive assertions). Their negative ("no image embedded here") assertions are unaffected since absence-of-substring checks remain valid regardless of path format.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `embedScreenshotPaths` writes a story-prefixed relative path (`<storySlug>/screenshots/<fileName>`), not a bare basename | 1 test | — | — | — | — | 🟢 |
| AC2 | Two different stories sharing an identical screenshot basename (e.g. both named `AC1.png`) each get their own, distinctly-resolvable path | 1 test | — | — | — | — | 🟢 |
| AC3 | Regenerating the real `journey-cx-redesign` walkthrough produces image links that actually resolve to real files on disk | — | 1 test | — | — | — | 🟢 |
| AC4 | Three pre-existing tests' own positive path assertions are corrected to the new, correct path format and still pass | 1 test (re-run, updated) x3 | — | — | — | — | 🟢 |

## Test Data Strategy

**Source:** Synthetic fixtures (AC1-AC2) modelling the exact real layout; the real `journey-cx-redesign` feature's own committed screenshots (AC3, a real-data integration check that stats each resolved path on disk) | **PCI/sensitivity:** No | **Availability:** Now | **Owner:** Self-contained

## Unit Tests

### AC1: embedScreenshotPaths writes a story-prefixed relative path

- **Verifies:** AC1
- **Precondition:** Single-story markdown fixture with one `## AC1` heading, no story marker
- **Action:** Call `embedScreenshotPaths(markdown, [{ acId: 'AC1', path: 'artefacts/f1/playback/s1/screenshots/AC1.png' }])`
- **Expected result:** Output contains `![AC1](s1/screenshots/AC1.png)`, not `![AC1](screenshots/AC1.png)`

### AC2: two stories sharing an identical screenshot basename each get their own resolvable path

- **Verifies:** AC2
- **Precondition:** Two-story markdown fixture, each with its own `## AC1` heading and story marker
- **Action:** Call `embedScreenshotPaths` with shots `{ storySlug: 'story-one', acId: 'AC1', path: '.../story-one/screenshots/AC1.png' }` and `{ storySlug: 'story-two', acId: 'AC1', path: '.../story-two/screenshots/AC1.png' }`
- **Expected result:** `story-one`'s own section contains `story-one/screenshots/AC1.png`; `story-two`'s own section contains `story-two/screenshots/AC1.png` — the two paths are different strings, each resolvable to a distinct real file

## Integration Tests

### AC3: regenerated real walkthrough's image links resolve to real files on disk

- **Verifies:** AC3
- **Precondition:** The real `artefacts/2026-10-11-journey-cx-redesign/` DoD, benefit-metric, and screenshot files
- **Action:** Regenerate the real walkthrough via `generateWalkthroughMarkdown` + `embedScreenshotPaths`; parse every `![...](...)` link out of the result; resolve each relative to `artefacts/2026-10-11-journey-cx-redesign/playback/` and `fs.existsSync` it
- **Expected result:** Every resolved path exists on disk — zero broken links

## Regression

### AC4: pre-existing tests' positive path assertions corrected

- **Verifies:** AC4
- **Action:** Update and re-run `check-fpd-s1-walkthrough-document-and-screenshots.js` AC3, `check-rpca-embed-hotfix1-cross-story-ac-collision.js` AC1, `check-rpca-embed-hotfix2-story-scoped-matching.js` AC1/AC4 — change only the expected path strings in positive ("image present") assertions to include the story-slug prefix
- **Expected result:** All four files pass

## Out of Scope

- Changing `captureAcScreenshots`'s own `path` field shape (already correct — it already encodes the full `artefacts/<feature>/playback/<storySlug>/screenshots/<acId>.png` path; only the derived relative link written into the markdown changes).
- Any heading-matching behaviour — unchanged from hotfix2.

## Test Gaps and Risks

None.
