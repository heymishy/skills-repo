# Definition of Ready: rpca-embed-hotfix2 — embedScreenshotPaths matches on (storySlug, acId)

**Date:** 2026-10-19
**Type:** Short-track fix (CLAUDE.md "Short-track" process — discovery through review skipped; test-plan → DoR → coding agent → DoD still apply)

---

## Contract

**What will be built:** `generateWalkthroughMarkdown` emits `<!-- story: <storySlug> -->` immediately before each `## <acId>` heading. `embedScreenshotPaths` derives `storySlug` from each shot's own `path` (already positionally encoded, no new field), tries a `(storySlug, acId)`-scoped match first, falls back to the pre-existing positional-cursor behaviour only when no story marker is found in the target markdown at all (keeps the pre-existing single-story test passing unchanged).
**What will NOT be built:** No change to any other function's own signature; no change to the visible, rendered heading text (the marker is an HTML comment, invisible when rendered).
**Touch points:** `scripts/playback-capture.js` (modify — `generateWalkthroughMarkdown`, `embedScreenshotPaths`), `tests/check-rpca-embed-hotfix2-story-scoped-matching.js` (new)

## Hard blocks

| # | Check | Result |
|---|---|---|
| H3 | Every AC has ≥1 test | ✅ 4 tests (3 unit, 1 real-data integration) |
| H9 | Architecture constraints named | ✅ No new NFR surface; HTML-comment marker is invisible in rendered markdown, no visual/behavioural change to the document's own human-readable content |
| H-ADAPTER | D37 adapter | ✅ N/A |

**Oversight:** High (solo-operator posture).
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.

**Proceed: Yes.**
