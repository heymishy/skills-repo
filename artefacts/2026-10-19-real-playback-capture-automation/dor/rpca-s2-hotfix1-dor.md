# Definition of Ready: rpca-s2-hotfix1 — deriveSelectorFromSpec anchors on the AC-specific inline mention

**Date:** 2026-10-19
**Type:** Short-track fix (CLAUDE.md "Short-track" process — discovery through review skipped; test-plan → DoR → coding agent → DoD still apply)

---

## Contract

**What will be built:** Tighten `deriveSelectorFromSpec`'s own anchor regex from `\b<acId>\b` to `\b<acId>\)` — requiring the AC id to be immediately followed by a closing parenthesis, matching every real per-AC inline convention sampled (`(fpd-s4 AC3)`, `(AC1)`), while correctly skipping a shared multi-AC header listing (`AC1, AC2, AC3 of story`) that lacks the trailing `)`.
**What will NOT be built:** Any change to `loadManualFallback` or `buildCaptureList`'s own signatures — `buildCaptureList` calls `deriveSelectorFromSpec` unchanged and inherits the fix automatically, with no code change needed there.
**Touch points:** `scripts/playback-capture.js` (modify — `deriveSelectorFromSpec` only), `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` (modify — add 2 regression tests)

## Hard blocks

| # | Check | Result |
|---|---|---|
| H3 | Every AC has ≥1 test | ✅ 2 tests |
| H9 | Architecture constraints named | ✅ Same convention `buildScreenshotPath`'s own path-traversal guard precedent used (rpca-s1-hotfix1) — a found gap, fixed via short-track, same file |
| H-ADAPTER | D37 adapter | ✅ N/A — not a route handler I/O adapter |

**Oversight:** High (solo-operator posture).
**Signed off by:** Hamish King (Platform Owner) — 2026-10-19.

**Proceed: Yes.**
