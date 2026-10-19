## Test Plan: rpca-embed-hotfix1 — embedScreenshotPaths scopes matches per story, not globally by AC id

**Story reference:** Short-track fix (CLAUDE.md "Short-track" process) — found while running `/feature-playback` for real, for the first time, against a real multi-story feature (`2026-10-11-journey-cx-redesign`) as part of validating the `2026-10-19-real-playback-capture-automation` epic's own real mechanism end to end.
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js`

---

## Root cause and fix

`embedScreenshotPaths` (originally `fpd-s1`, unchanged by the `rpca-*` epic) matches `## <acId>` by text alone, using a non-global `String.replace()` that always searches from the start of the document. When two different stories in the same feature both have, say, an "AC1" section (a common, legitimate situation — AC numbering restarts per story), every screenshot whose `acId` is `AC1` gets inserted into the *first* `## AC1` heading found anywhere in the whole document, regardless of which story it actually belongs to. Confirmed directly: running the real walkthrough generation against `journey-cx-redesign` (12 stories, several sharing AC numbers) put both `jcx-s3`'s and `jcx-s6`'s own AC1 screenshots under `jcx-hotfix2`'s unrelated AC1 section, while `jcx-s3`'s and `jcx-s6`'s own real AC1 sections got no image at all.

The fix: track a cursor position in the document. Each shot's heading search starts from the cursor (not document start), and the cursor advances past each insertion. As long as the `shots` array is provided in the same relative order the AC sections appear in the document (true for every existing caller — `captureAcScreenshots` already returns shots in `acList` order, and the walkthrough is generated from the same ordered `storyDods` array), this correctly scopes each screenshot to its own story's section, including when AC ids repeat across stories.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Two stories sharing the same AC id each get their own screenshot in their own section, not one story's shots landing in another's | 1 test | — | — | — | — | 🟢 |
| AC2 | The existing single-story, non-duplicate-AC-id case is unaffected | 1 test (pre-existing, re-run) | — | — | — | — | 🟢 |

No gaps. Pure local string-processing logic, no real secret/network needed.

## Test Data Strategy

**Source:** Synthetic (a two-story fixture markdown document with a deliberately repeated `## AC1` heading, modelled on the real cross-story collision found against `journey-cx-redesign`) | **PCI/sensitivity:** No | **Availability:** Now | **Owner:** Self-contained

## Unit Tests

### AC1: screenshots land in their own story's section when AC ids repeat across stories

- **Verifies:** AC1
- **Precondition:** Fixture markdown with two `## AC1 — ...` headings (one per story, in document order) and two shots both with `acId: 'AC1'` but different `path` values, passed in the same order the headings appear
- **Action:** Call `embedScreenshotPaths(markdown, shots)`
- **Expected result:** The first shot's image appears directly under the first `## AC1` heading; the second shot's image appears directly under the second `## AC1` heading — not both images under the first heading
- **Edge case:** Yes — this is specifically the cross-story AC-id collision found via real execution

### AC2: the existing single-story case is unaffected (regression)

- **Verifies:** AC2
- **Precondition:** None — reuses the existing `check-fpd-s1-walkthrough-document-and-screenshots.js` own AC3 test case unchanged (two unique AC ids, AC1/AC2, one story)
- **Action:** Run the existing test file
- **Expected result:** Same pass result as before this fix — `embedScreenshotPaths`'s own output for the non-duplicate case is unchanged

## Out of Scope

- Changing `generateWalkthroughMarkdown`'s own heading format (e.g. prefixing headings with the story slug) — the cursor-based fix solves the collision without needing a format change, and a format change would be a larger, separate decision with its own consumers to check.

## Test Gaps and Risks

None.
