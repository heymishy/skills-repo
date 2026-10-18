# Definition of Ready: rpca-s1-hotfix1 — path-traversal guard on the capture CLI

**Date:** 2026-10-19
**Type:** Short-track fix (CLAUDE.md "Short-track" process — discovery through review skipped; test-plan → DoR → coding agent → DoD still apply)

---

## Contract

**What will be built:** A path-traversal guard in `scripts/playback-capture.js`, applied to the CLI's own `featureSlug` argument before it's used to construct any file path — same pattern as `src/web-ui/routes/playback.js`'s own existing guard (`path.resolve` + `startsWith(repoRoot + path.sep)`).
**What will NOT be built:** Any change to `buildScreenshotPath`'s own signature or the existing `captureAcScreenshots` convention it mirrors — the guard wraps the CLI's own new call site only.
**Touch points:** `scripts/playback-capture.js` (modify), `tests/check-rpca-s1-hotfix1-path-guard.js` (new)

## Hard blocks

| # | Check | Result |
|---|---|---|
| H3 | Every AC has ≥1 test | ✅ 2 tests |
| H9 | Architecture constraints named | ✅ Cites `web-ui-patterns.md`'s existing path-traversal guard pattern (ADR-026 reuse) |
| H-ADAPTER | D37 adapter | ✅ N/A — not a route handler I/O adapter |

**Oversight:** High (solo-operator posture).
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.

**Proceed: Yes.**
