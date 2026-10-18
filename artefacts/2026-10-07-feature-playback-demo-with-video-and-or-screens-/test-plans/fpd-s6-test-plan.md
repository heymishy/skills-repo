## Test Plan: Add an at-a-glance coverage summary to the top of the playback review page

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s6-review-page-status-summary.md
**Epic reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/epics/feature-playback-web-viewer.md
**Review reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/review/fpd-s6-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5
**Date:** 2026-10-18
**Test runner:** `node scripts/run-all-tests.js` (confirmed from `package.json`'s own `test` script — no stack deviation)

---

## Note on Step 2 (test context) and Step 3 (test data strategy)

**Test context:** Option 1 — this repo's own configured runner, no stack deviation.
**Test data strategy:** Option 1 — Synthetic. All 4 ACs are pure server-side rendering logic over an in-memory `structure` object (the same shape `renderPlaybackReviewHtml` already consumes in `fpd-s1`–`fpd-s5`'s own test files) — no real feature, deploy, or browser session is required, unlike `fpd-s5`'s own AC4.

---

## Note on Step 3a (E2E / browser-layout detection)

No AC in this story triggers any CSS-layout-dependent pattern (no drag-drop, no coordinate/`getBoundingClientRect` dependency, no stacking-context claim). AC3's "visibly different state/treatment" is implemented and verified as a **text-level** distinction (different wording, e.g. "Full coverage" vs. "M of N ACs have captured evidence"), per `MC-A11Y-02` (story Architecture Constraints, added at `/review` finding 1-M2) — not a colour/CSS-position claim, so it is fully testable at the string/DOM level, not a browser-rendering claim. All 4 ACs are covered by Unit/Integration tests only; no E2E tooling question applies.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Summary shows "M of N ACs have captured evidence", positioned after Scope/Benefit and before any per-story section | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Zero-coverage case states "0 of N ACs have captured evidence yet" plainly, not omitted | 1 test | — | — | — | — | 🟢 |
| AC3 | Full-coverage case (N of N) is visibly/textually distinct from the partial case | 1 test | — | — | — | — | 🟢 |
| AC4 | Existing per-story/per-AC sections are unchanged in structure and content | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are pure server-side rendering logic, fully coverable by this repo's own unit/integration runner.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now — no dependency
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fixture `structure` with 2 stories, 3 total ACs across them, 1 AC with `media.screenshotPath` set | Synthetic | None | Mirrors the shape `fpd-s3`/`fpd-s4`/`fpd-s5`'s own fixtures already use |
| AC2 | Fixture `structure` with N ACs, none having `media.screenshotPath`/`media.videoPath` set | Synthetic | None | The common real-world case per `fpd-s6`'s own capture-coverage findings this session |
| AC3 | Fixture `structure` where every AC has media set | Synthetic | None | |
| AC4 | Fixture `structure` identical to an existing `fpd-s4`-style fixture, rendered through the updated `renderPlaybackReviewHtml` | Synthetic | None | Regression check — confirms the new summary doesn't alter existing per-story output |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### AC1 (unit): coverage count reflects partial coverage correctly

- **Verifies:** AC1
- **Precondition:** Fixture `structure` with 2 stories totalling 3 ACs, 1 of which has `media.screenshotPath` set
- **Action:** Call the new coverage-counting helper (e.g. `computeAcCoverageSummary(structure)`) directly
- **Expected result:** Returns `{ total: 3, captured: 1 }` — exact counts, not a percentage-only value
- **Edge case:** No

### AC2 (unit): zero-coverage case is reported plainly, not omitted

- **Verifies:** AC2
- **Precondition:** Fixture `structure` with 3 total ACs, none with `media.screenshotPath`/`media.videoPath` set
- **Action:** Call `computeAcCoverageSummary(structure)`, then render the summary HTML from its result
- **Expected result:** `computeAcCoverageSummary` returns `{ total: 3, captured: 0 }`; the rendered summary HTML contains the literal text "0 of 3 ACs have captured evidence" — not blank, not omitted, not a misleading "complete" state
- **Edge case:** Yes — this is the zero-coverage boundary, the most common real case per this story's own benefit linkage

### AC3 (unit): full-coverage case renders a textually distinct treatment

- **Verifies:** AC3
- **Precondition:** Fixture `structure` with 3 total ACs, all 3 with `media.screenshotPath` or `media.videoPath` set
- **Action:** Call `computeAcCoverageSummary(structure)`, then render the summary HTML
- **Expected result:** `computeAcCoverageSummary` returns `{ total: 3, captured: 3 }`; the rendered summary HTML text differs from the partial-coverage wording (e.g. contains "Full coverage" or equivalent distinct phrase) — not simply the same "M of N" template with matching numbers silently blending into the partial case's own visual treatment. Per `MC-A11Y-02`, the distinction must be in the text, not a CSS class alone — the test asserts on the rendered text content, not a class name.
- **Edge case:** Yes — this is the full-coverage boundary

---

## Integration Tests

### AC1 (integration): summary appears in `renderPlaybackReviewHtml`'s own output, positioned correctly

- **Verifies:** AC1
- **Components involved:** `renderPlaybackReviewHtml`, `computeAcCoverageSummary`
- **Precondition:** Fixture `structure` with 2 epics-worth of stories (mirroring `fpd-s3`'s own existing fixture shape)
- **Action:** Call `renderPlaybackReviewHtml(featureSlug, problemStatement, metricTargets, structure)`
- **Expected result:** The returned HTML string contains the coverage summary text, and `html.indexOf(coverageSummaryMarker) < html.indexOf(firstStorySectionMarker)` — the summary appears after the existing Scope/Benefit card and before any per-story section, confirmed by string position, not just presence

### AC4 (integration): existing per-story/per-AC sections are byte-identical to pre-change output aside from the new summary

- **Verifies:** AC4
- **Components involved:** `renderPlaybackReviewHtml`, `renderStorySection`, `renderAcMediaHtml`
- **Precondition:** The same fixture `structure` already used by `fpd-s4`'s own existing test file (`tests/check-fpd-s4-viewer-media-playback.js`), reused verbatim — not a new fixture, to directly prove no regression against the story that established this markup
- **Action:** Call `renderPlaybackReviewHtml` with and without the coverage-summary feature isolated (i.e. strip the summary block from the new output via its own marker, then diff against the pre-change fixture's expected per-story HTML)
- **Expected result:** With the summary block stripped out, the remaining HTML is identical to what `fpd-s4`'s own existing assertions already expect — same `<img>`/`<video>`/`<track>`/transcript-link markup, same per-AC structure, same per-story headings

---

## NFR Tests

### Accessibility: coverage summary is readable in document order before per-story content

- **NFR addressed:** Accessibility
- **Measurement method:** String-position assertion on the HTML output (same mechanism as AC1's integration test, but asserting the NFR's own distinct claim — screen-reader document order — not AC1's visual-placement claim)
- **Pass threshold:** Coverage summary's own opening tag appears at a lower string index than any per-story section's opening tag, for every fixture structure tested (partial, zero, full coverage)
- **Tool:** `node scripts/run-all-tests.js` (string-index assertion, no axe/browser tool needed — plain semantic HTML, no ARIA override required)

---

## Out of Scope for This Test Plan

- Automating the underlying capture itself — story's own Out of Scope item 1; no test asserts on `scripts/playback-capture.js`'s own behaviour
- Per-epic or per-story coverage breakdown — story's own Out of Scope item 2; no test asserts on anything beyond one feature-level count
- Visual/CSS regression testing of the summary element's appearance — story's own Out of Scope item 3; text-content assertions only, no screenshot-diff tooling

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All 4 ACs are pure server-side string-rendering logic, fully coverable by this repo's own unit/integration runner with synthetic fixtures | N/A |
