# DoR Contract — Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage

**Story:** artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s2-selector-derivation-from-e2e-specs.md
**Date:** 2026-10-19

---

**What will be built:**
- `deriveSelectorFromSpec(specFileContent, acId)` in `scripts/playback-capture.js` — scans a `.spec.js` file's own text for a comment naming `acId` (matching the existing convention, e.g. `(fpd-s4 AC3)`) and the nearest following `page.locator(...)` call; returns `{acId, selector}` or `null` if no match.
- `loadManualFallback(featureSlug, storySlug, acId)` — reads `artefacts/[featureSlug]/playback/[storySlug]/selectors-manual.json` if it exists, returns the `{url, selector}` entry for `acId` or `null`.
- `buildCaptureList(featureSlug, storySlug, acIds, specFiles)` — for each `acId`, tries `deriveSelectorFromSpec` across all `specFiles` first, then `loadManualFallback`; if neither matches, logs a named warning (`console.warn`) identifying the specific AC and omits it from the returned list, rather than throwing.
- CLI summary output extended to state counts: `"N captured, M skipped"` once a run completes.

**What will NOT be built:**
- Any change to `rpca-s1`'s own hardcoded single-AC proof path — this story adds new functions alongside it, used by a new multi-AC call path; `rpca-s1`'s own existing call site is untouched.
- Self-healing or retry logic for a selector that no longer matches the live page — story's own Out of Scope item 3.
- A new governed artefact type for `selectors-manual.json` — it's a plain JSON sidecar, per the story's own Out of Scope item 1.
- Auto-generating E2E spec files for ACs lacking them — out of this epic entirely.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test — fixture `.spec.js` content with an AC-naming comment + `page.locator(...)`, asserts correct `{acId, selector}` extraction | unit |
| AC2 | Unit test — no spec match, fixture `selectors-manual.json` present, asserts fallback entry returned | unit |
| AC3 | Unit test — AC in neither source, asserts no entry returned, a named warning fires (spied `console.warn`), and the function does not throw | unit |
| AC4 | Integration test — fixture feature with 4 ACs (2 E2E-derived, 1 manual, 1 neither), asserts the full capture list and summary counts ("3 captured, 1 skipped") | integration |

**Assumptions:**
- `rpca-s1`'s own existing `authenticateStagingSession`/CLI auth flow is reused unchanged by any future caller of `buildCaptureList` — this story only builds the capture-list logic itself, it does not yet wire it into the CLI's own `runCaptureForFeature` call path (that wiring, if needed beyond this story's own integration test, is implicit groundwork for `rpca-s4`, not a new AC here).
- All 4 ACs are pure local file-parsing logic — no real secret or network access needed, confirmed in both the review (run 1, PASS) and the test plan.

**Estimated touch points (locked — do not exceed without a DoR contract amendment):**
- `scripts/playback-capture.js` (modify — add `deriveSelectorFromSpec`, `loadManualFallback`, `buildCaptureList`; no changes to existing exported functions' own signatures)
- `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` (new)

Services: None | APIs: None (pure local file-parsing, no network calls)
