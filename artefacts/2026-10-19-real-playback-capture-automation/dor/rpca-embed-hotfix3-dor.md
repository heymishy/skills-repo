# Definition of Ready: rpca-embed-hotfix3 — embedScreenshotPaths writes a story-prefixed relative image path

**Date:** 2026-10-20
**Type:** Short-track fix (CLAUDE.md "Short-track" process — discovery through review skipped; test-plan → DoR → coding agent → DoD still apply)

---

## Contract

**What will be built:** `embedScreenshotPaths` writes the embedded image path as `${storySlug}/screenshots/${fileName}` (reusing the `storySlug` it already derives from `shot.path` for heading-matching), falling back to the pre-existing bare `screenshots/${fileName}` only when no `storySlug` can be derived.
**What will NOT be built:** No change to heading-matching logic (scoped-marker or cursor fallback — unchanged from hotfix2); no change to `captureAcScreenshots`'s own `path` field shape.
**Touch points:** `scripts/playback-capture.js` (modify `embedScreenshotPaths`), `tests/check-rpca-embed-hotfix3-story-prefixed-image-path.js` (new), `tests/check-fpd-s1-walkthrough-document-and-screenshots.js` (update AC3's positive path assertion), `tests/check-rpca-embed-hotfix1-cross-story-ac-collision.js` (update AC1's image-count regex to per-story paths), `tests/check-rpca-embed-hotfix2-story-scoped-matching.js` (update AC1/AC4 positive path assertions)

## Hard blocks

| # | Check | Result |
|---|---|---|
| H3 | Every AC has ≥1 test | ✅ 4 tests (2 unit, 1 real-data integration, 1 regression re-run across 3 updated files) |
| H9 | Architecture constraints named | ✅ No new NFR surface; path format change only, confined to the markdown's own embedded link text — no change to what is captured, stored, or to any other function's signature |
| H-ADAPTER | D37 adapter | ✅ N/A |

**Oversight:** High (solo-operator posture).
**Signed off by:** Hamish King (Platform Owner) — 2026-10-20.

**Proceed: Yes.**
