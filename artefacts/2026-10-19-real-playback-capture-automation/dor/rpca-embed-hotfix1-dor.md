# Definition of Ready: rpca-embed-hotfix1 — embedScreenshotPaths scopes matches per story

**Date:** 2026-10-19
**Type:** Short-track fix (CLAUDE.md "Short-track" process — discovery through review skipped; test-plan → DoR → coding agent → DoD still apply)

---

## Contract

**What will be built:** `embedScreenshotPaths` in `scripts/playback-capture.js` tracks a cursor position and searches for each shot's own `## <acId>` heading starting from that cursor, advancing it past each insertion — fixing the cross-story AC-id collision found by running `/feature-playback` for real against `journey-cx-redesign`.
**What will NOT be built:** No change to `generateWalkthroughMarkdown`'s own heading format, no change to any other function's own signature.
**Touch points:** `scripts/playback-capture.js` (modify — `embedScreenshotPaths` only), `tests/check-rpca-embed-hotfix1-cross-story-ac-collision.js` (new)

## Hard blocks

| # | Check | Result |
|---|---|---|
| H3 | Every AC has ≥1 test | ✅ 2 tests (1 new, 1 pre-existing re-run) |
| H9 | Architecture constraints named | ✅ No new NFR surface; pure local string processing, same convention as the function's own existing shape |
| H-ADAPTER | D37 adapter | ✅ N/A — not a route handler I/O adapter |

**Oversight:** High (solo-operator posture).
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.

**Proceed: Yes.**
