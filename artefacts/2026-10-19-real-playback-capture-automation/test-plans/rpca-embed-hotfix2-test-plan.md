## Test Plan: rpca-embed-hotfix2 — embedScreenshotPaths matches on (storySlug, acId), not position heuristics

**Story reference:** Short-track fix (CLAUDE.md "Short-track" process) — found running the real `rpca-embed-hotfix1` fix against the real, full `journey-cx-redesign` walkthrough. That fix (cursor-based) was itself insufficient: traced precisely and found `jcx-s3`'s own AC1 screenshot landed on an unrelated, earlier `hotfix2/3/4` story's own generic "AC1" heading, while `jcx-s6`'s own AC1 screenshot landed on `jcx-s3`'s real heading instead — every heading got exactly one image (looking correct), but misattributed, a harder-to-notice failure than the original duplicate-pile-up bug.
**Date:** 2026-10-19
**Test runner:** `node scripts/run-all-tests.js`

---

## Root cause and fix

AC headings in the generated walkthrough (`## <acId> — <description>`) carry no story-identifying information at all. A position-based cursor only produces correct results if every single story in the document is processed in lock-step, including ones with no screenshots of their own — not how `/feature-playback` is actually called in practice (only stories with new screenshots get shots in the `shots` array; stories without any are simply absent, and the cursor has no way to "skip past" their own same-labelled headings).

The fix: `generateWalkthroughMarkdown` emits an HTML comment marker (`<!-- story: <storySlug> -->`, invisible in rendered markdown) immediately before each AC heading. `embedScreenshotPaths` derives each shot's own `storySlug` from its `path` (`artefacts/<feature>/playback/<storySlug>/screenshots/<acId>.png` — the story slug is already positionally encoded there, no new field needed, keeping every existing caller unchanged). It then tries a scoped match on `(storySlug, acId)` together first. Only when no story marker is present at all (hand-written fixture markdown predating this fix, e.g. the existing single-story `embedScreenshotPaths` test) does it fall back to the old positional-cursor behaviour, preserving that test's own existing pass result.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Screenshots land in their own story's section even when an earlier, unrelated story shares the same AC id and comes first in the document | 1 test | — | — | — | — | 🟢 |
| AC2 | `generateWalkthroughMarkdown`'s own output includes a story marker immediately before each AC heading | 1 test | — | — | — | — | 🟢 |
| AC3 | The pre-existing single-story `embedScreenshotPaths` test (no story markers in its own fixture markdown) still passes via the fallback path | 1 test (pre-existing, re-run) | — | — | — | — | 🟢 |
| AC4 | Full regeneration of the real `journey-cx-redesign` walkthrough places every one of the 11 real screenshots under its own correct story's own correct AC heading | — | 1 test | — | — | — | 🟢 |

## Test Data Strategy

**Source:** Synthetic fixtures (AC1-AC3) modelling the exact real collision found; the real `journey-cx-redesign` feature's own DoD artefacts and committed screenshots (AC4, a real-data integration check) | **PCI/sensitivity:** No | **Availability:** Now | **Owner:** Self-contained

## Unit Tests

### AC1: a shot lands on its own story's section, not an earlier same-labelled one

- **Verifies:** AC1
- **Precondition:** Fixture markdown with 3 story sections in document order — story "early" (AC1, no screenshot), story "target" (AC1, has a screenshot), story "later" (AC1, no screenshot) — each with its own `<!-- story: ... -->` marker
- **Action:** Call `embedScreenshotPaths(markdown, [{ acId: 'AC1', path: 'artefacts/f1/playback/target/screenshots/AC1.png' }])`
- **Expected result:** The image appears only under "target"'s own AC1 section — not "early"'s own earlier AC1 section
- **Edge case:** Yes — this is exactly the real collision found

### AC2: `generateWalkthroughMarkdown` emits a story marker before each heading

- **Verifies:** AC2
- **Precondition:** A fixture DoD with one AC
- **Action:** Call `generateWalkthroughMarkdown({ featureSlug, storyDods: [{ storySlug: 'sX', content: fixtureDod }], benefitMetricContent: '' })`
- **Expected result:** Output contains `<!-- story: sX -->` immediately before the `## AC1` heading

### AC3: the pre-existing single-story test still passes (regression)

- **Verifies:** AC3
- **Action:** Run `tests/check-fpd-s1-walkthrough-document-and-screenshots.js` unchanged
- **Expected result:** Same pass result as before — its own fixture markdown has no story markers, exercised via the fallback path

## Integration Tests

### AC4: regenerating the real journey-cx-redesign walkthrough places every screenshot correctly

- **Verifies:** AC4
- **Precondition:** The real `artefacts/2026-10-11-journey-cx-redesign/dod/*.md` files and the real, already-corrected screenshots under `artefacts/2026-10-11-journey-cx-redesign/playback/{jcx-s3,jcx-s4,jcx-s6}/screenshots/`
- **Action:** Run the full real `generateWalkthroughMarkdown` + `embedScreenshotPaths` pipeline against this real feature
- **Expected result:** `jcx-s3`'s own AC1 image appears directly under `jcx-s3`'s own real AC1 heading ("connected curve tracks emotion position"), not any `hotfix*` story's own generic AC1 heading; `jcx-s6`'s own AC1 image appears under `jcx-s6`'s own real AC1 heading ("Stages render left-to-right as columns"), not `jcx-s3`'s

## Out of Scope

- Changing `captureAcScreenshots`'s or any other function's own signature — only `generateWalkthroughMarkdown`'s own heading-emission logic and `embedScreenshotPaths`'s own matching logic change.

## Test Gaps and Risks

None.
