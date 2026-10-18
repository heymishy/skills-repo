# DoR Contract — Add an at-a-glance coverage summary to the top of the playback review page

**Story:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s6-review-page-status-summary.md
**Date:** 2026-10-18

---

**What will be built:**
- `computeAcCoverageSummary(structure)` in `src/web-ui/routes/playback.js` — walks `structure.epics[].stories[]` and the flat `structure.stories[]` (same traversal `renderPlaybackReviewHtml` already does), counts total ACs and how many have `ac.media.screenshotPath` or `ac.media.videoPath` set, returns `{ total, captured }`.
- `renderCoverageSummaryHtml({ total, captured })` — produces the summary HTML with three text-distinct states: zero, partial, full coverage (per `MC-A11Y-02` — text-distinct, not colour-distinct).
- `renderPlaybackReviewHtml` modified to call both and insert the result between the existing Scope/Benefit card and the epic/story sections.

**What will NOT be built:**
- Automating the underlying capture mechanism — separate, already-scoped-elsewhere gap (tracked in `workspace/capture-log.md`, 2026-10-18, pending its own `/discovery` pass).
- A per-story or per-epic coverage breakdown — one feature-level "M of N" figure only.
- Any CSS/visual styling beyond a plain, readable text summary — no chart, no progress-bar widget.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on `computeAcCoverageSummary` (partial-coverage fixture) + integration test asserting the summary's string position precedes the first per-story section in `renderPlaybackReviewHtml`'s output | unit + integration |
| AC2 | Unit test on `computeAcCoverageSummary`/rendered text (zero-coverage fixture, exact wording "0 of N ACs have captured evidence yet") | unit |
| AC3 | Unit test asserting full-coverage wording is textually distinct from the partial-coverage wording (not a colour-only difference) | unit |
| AC4 | Integration test reusing `fpd-s4`'s own existing fixture (`tests/check-fpd-s4-viewer-media-playback.js`) to confirm per-story/per-AC markup is unchanged aside from the new summary block | integration |

**Assumptions:**
- "Captured" means `ac.media.screenshotPath` OR `ac.media.videoPath` is truthy — matches `renderAcMediaHtml`'s own existing check at `src/web-ui/routes/playback.js` line ~109.
- No change to `buildFeaturePlaybackStructure` itself — the count is derived entirely from data already present in the `structure` object it already returns.
- Per `.github/standards/web-ui/web-ui-patterns.md`'s "HTML render function unit test pattern," tests assert on specific string fragments, not full-snapshot equality — consistent with every prior `fpd-*` test file this cycle.

**Estimated touch points (locked — do not exceed without a DoR contract amendment):**
- `src/web-ui/routes/playback.js` (modify — add `computeAcCoverageSummary`, `renderCoverageSummaryHtml`, call both from `renderPlaybackReviewHtml`)
- `tests/check-fpd-s6-review-page-coverage-summary.js` (new)

Services: None | APIs: None
