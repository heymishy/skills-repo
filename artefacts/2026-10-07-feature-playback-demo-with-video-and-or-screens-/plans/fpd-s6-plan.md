# Add an at-a-glance coverage summary to the top of the playback review page — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Add a feature-level "M of N ACs have captured evidence" coverage summary to `/playback/:slug`, positioned after the existing Scope/Benefit card and before any per-story section, with distinct wording for the zero, partial, and full coverage cases. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/fpd-s6`
**Worktree:** `.worktrees/fpd-s6`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-fpd-s6-review-page-coverage-summary.js`

---

## File map

```
Create:
  tests/check-fpd-s6-review-page-coverage-summary.js  — unit + integration tests for the coverage summary

Modify:
  src/web-ui/routes/playback.js  — add computeAcCoverageSummary, renderCoverageSummaryHtml; wire both into renderPlaybackReviewHtml; export both new functions
```

---

## Task 1: `computeAcCoverageSummary` — counts total/captured ACs across a playback structure

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Create: `tests/check-fpd-s6-review-page-coverage-summary.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-fpd-s6-review-page-coverage-summary.js` with this content:

```javascript
'use strict';
// check-fpd-s6-review-page-coverage-summary.js -- TDD tests for fpd-s6
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s6-review-page-status-summary.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly
(function () {
  const { computeAcCoverageSummary } = require('../src/web-ui/routes/playback');
  const structure = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [
      { slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
        { acId: 'AC1', description: 'a', evidence: 'e', media: { screenshotPath: 'artefacts/f1/playback/s1/screenshots/AC1.png' } },
        { acId: 'AC2', description: 'b', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
      ] },
      { slug: 's2', name: 'Story Two', epicSlug: 'e1', acRows: [
        { acId: 'AC1', description: 'c', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
      ] },
    ],
  };
  try {
    const result = computeAcCoverageSummary(structure);
    assert.deepStrictEqual(result, { total: 3, captured: 1 }, 'expected 1 of 3 ACs counted as captured');
    pass('AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly');
  } catch (e) { fail('AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly', e); }
})();

// AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted
(function () {
  const { computeAcCoverageSummary } = require('../src/web-ui/routes/playback');
  const structure = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
      { acId: 'AC1', description: 'a', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
      { acId: 'AC2', description: 'b', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
      { acId: 'AC3', description: 'c', evidence: 'e', media: null },
    ] }],
  };
  try {
    const result = computeAcCoverageSummary(structure);
    assert.deepStrictEqual(result, { total: 3, captured: 0 }, 'expected 0 of 3 ACs counted as captured');
    pass('AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted');
  } catch (e) { fail('AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted', e); }
})();

// AC3 (unit): computeAcCoverageSummary reports full-coverage correctly
(function () {
  const { computeAcCoverageSummary } = require('../src/web-ui/routes/playback');
  const structure = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
      { acId: 'AC1', description: 'a', evidence: 'e', media: { screenshotPath: 'artefacts/f1/playback/s1/screenshots/AC1.png' } },
      { acId: 'AC2', description: 'b', evidence: 'e', media: { videoPath: 'artefacts/f1/playback/s1/video/AC2.webm' } },
    ] }],
  };
  try {
    const result = computeAcCoverageSummary(structure);
    assert.deepStrictEqual(result, { total: 2, captured: 2 }, 'expected 2 of 2 ACs counted as captured');
    pass('AC3 (unit): computeAcCoverageSummary reports full-coverage correctly');
  } catch (e) { fail('AC3 (unit): computeAcCoverageSummary reports full-coverage correctly', e); }
})();

console.log(`\n[fpd-s6-review-page-coverage-summary] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s6-review-page-coverage-summary.js
```

Expected output: a `TypeError: computeAcCoverageSummary is not a function` (or equivalent "not exported") thrown from the first test, all 3 tests FAIL.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback.js`, insert this function immediately before `function renderPlaybackReviewHtml(featureSlug, problemStatement, metricTargets, structure) {` (currently line 90):

```javascript
// fpd-s6: counts total ACs across every story in a playback structure, and
// how many already have captured evidence (screenshot or video). Walks
// structure.stories directly -- that array already holds every story once
// (epicSlug is grouping metadata consumed separately by
// renderPlaybackReviewHtml, not a second data source), so no double-count
// risk from also walking structure.epics.
function computeAcCoverageSummary(structure) {
  let total = 0;
  let captured = 0;
  (structure.stories || []).forEach((story) => {
    (story.acRows || []).forEach((ac) => {
      total += 1;
      const media = ac.media;
      if (media && (media.screenshotPath || media.videoPath)) captured += 1;
    });
  });
  return { total, captured };
}
```

Add `computeAcCoverageSummary` to `module.exports` (currently at line 258):

```javascript
module.exports = {
  listPlaybackFeatures, extractMarkdownSection, buildFeaturePlaybackStructure,
  renderPlaybackListHtml, renderPlaybackReviewHtml,
  handleGetPlaybackList, handleGetPlaybackReview,
  resolveAcMedia, handleGetPlaybackMedia,
  computeAcCoverageSummary,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s6-review-page-coverage-summary.js
```

Expected output:
```
  [PASS] AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly
  [PASS] AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted
  [PASS] AC3 (unit): computeAcCoverageSummary reports full-coverage correctly

[fpd-s6-review-page-coverage-summary] Results: 3 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: `760` (or more, once the new file is counted) files run, `0` failed.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s6-review-page-coverage-summary.js
git commit -m "feat(fpd-s6): add computeAcCoverageSummary for AC coverage counting"
```

---

## Task 2: `renderCoverageSummaryHtml` — distinct wording for zero/partial/full coverage

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Modify: `tests/check-fpd-s6-review-page-coverage-summary.js`

- [ ] **Step 1: Write the failing test**

Append these three test blocks to `tests/check-fpd-s6-review-page-coverage-summary.js`, inserted immediately before the closing `console.log(`\n[fpd-s6-review-page-coverage-summary] ...` line:

```javascript
// AC1 (unit): renderCoverageSummaryHtml renders the exact partial-coverage wording
(function () {
  const { renderCoverageSummaryHtml } = require('../src/web-ui/routes/playback');
  try {
    const html = renderCoverageSummaryHtml({ total: 3, captured: 1 });
    assert.ok(html.includes('1 of 3 ACs have captured evidence'), 'expected exact "M of N" wording');
    pass('AC1 (unit): renderCoverageSummaryHtml renders the exact partial-coverage wording');
  } catch (e) { fail('AC1 (unit): renderCoverageSummaryHtml renders the exact partial-coverage wording', e); }
})();

// AC2 (unit): renderCoverageSummaryHtml states the zero-coverage case plainly, not omitted
(function () {
  const { renderCoverageSummaryHtml } = require('../src/web-ui/routes/playback');
  try {
    const html = renderCoverageSummaryHtml({ total: 3, captured: 0 });
    assert.ok(html.includes('0 of 3 ACs have captured evidence yet'), 'expected exact zero-coverage wording');
    pass('AC2 (unit): renderCoverageSummaryHtml states the zero-coverage case plainly, not omitted');
  } catch (e) { fail('AC2 (unit): renderCoverageSummaryHtml states the zero-coverage case plainly, not omitted', e); }
})();

// AC3 (unit): renderCoverageSummaryHtml's full-coverage wording is textually distinct from partial, not colour-only (MC-A11Y-02)
(function () {
  const { renderCoverageSummaryHtml } = require('../src/web-ui/routes/playback');
  try {
    const fullHtml = renderCoverageSummaryHtml({ total: 2, captured: 2 });
    const partialHtml = renderCoverageSummaryHtml({ total: 3, captured: 1 });
    assert.ok(fullHtml.includes('Full coverage'), 'expected full-coverage wording to say "Full coverage"');
    assert.ok(!partialHtml.includes('Full coverage'), 'expected partial-coverage wording to NOT say "Full coverage"');
    pass("AC3 (unit): renderCoverageSummaryHtml's full-coverage wording is textually distinct from partial, not colour-only (MC-A11Y-02)");
  } catch (e) { fail("AC3 (unit): renderCoverageSummaryHtml's full-coverage wording is textually distinct from partial, not colour-only (MC-A11Y-02)", e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s6-review-page-coverage-summary.js
```

Expected output: the 3 new tests FAIL with a `TypeError: renderCoverageSummaryHtml is not a function` (the 3 Task 1 tests still PASS).

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback.js`, insert this function immediately after `computeAcCoverageSummary` (added in Task 1), still before `function renderPlaybackReviewHtml(...)`:

```javascript
// fpd-s6: renders the coverage summary with three text-distinct states.
// Per MC-A11Y-02 (architecture-guardrails.md), the full-vs-partial
// distinction is carried by wording ("Full coverage" prefix), not by a
// CSS class or colour alone.
function renderCoverageSummaryHtml({ total, captured }) {
  if (captured === total && total > 0) {
    return `<p class="playback-coverage-summary playback-coverage-summary--full">Full coverage — ${captured} of ${total} ACs have captured evidence.</p>`;
  }
  if (captured === 0) {
    return `<p class="playback-coverage-summary playback-coverage-summary--none">0 of ${total} ACs have captured evidence yet.</p>`;
  }
  return `<p class="playback-coverage-summary playback-coverage-summary--partial">${captured} of ${total} ACs have captured evidence.</p>`;
}
```

Add `renderCoverageSummaryHtml` to `module.exports`:

```javascript
module.exports = {
  listPlaybackFeatures, extractMarkdownSection, buildFeaturePlaybackStructure,
  renderPlaybackListHtml, renderPlaybackReviewHtml,
  handleGetPlaybackList, handleGetPlaybackReview,
  resolveAcMedia, handleGetPlaybackMedia,
  computeAcCoverageSummary, renderCoverageSummaryHtml,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s6-review-page-coverage-summary.js
```

Expected output:
```
  [PASS] AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly
  [PASS] AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted
  [PASS] AC3 (unit): computeAcCoverageSummary reports full-coverage correctly
  [PASS] AC1 (unit): renderCoverageSummaryHtml renders the exact partial-coverage wording
  [PASS] AC2 (unit): renderCoverageSummaryHtml states the zero-coverage case plainly, not omitted
  [PASS] AC3 (unit): renderCoverageSummaryHtml's full-coverage wording is textually distinct from partial, not colour-only (MC-A11Y-02)

[fpd-s6-review-page-coverage-summary] Results: 6 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, `0` failed.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s6-review-page-coverage-summary.js
git commit -m "feat(fpd-s6): add renderCoverageSummaryHtml with text-distinct coverage states"
```

---

## Task 3: Wire the summary into `renderPlaybackReviewHtml` — placement (AC1) and no-regression (AC4)

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Modify: `tests/check-fpd-s6-review-page-coverage-summary.js`

- [ ] **Step 1: Write the failing test**

Append these test blocks to `tests/check-fpd-s6-review-page-coverage-summary.js`, before the final `console.log` line:

```javascript
// AC1 (integration): summary appears in renderPlaybackReviewHtml's own output, positioned before any per-story section
(function () {
  const { renderPlaybackReviewHtml } = require('../src/web-ui/routes/playback');
  const structure = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
      { acId: 'AC1', description: 'a', evidence: 'e', media: { screenshotPath: 'artefacts/f1/playback/s1/screenshots/AC1.png' } },
      { acId: 'AC2', description: 'b', evidence: 'e', media: { screenshotPath: null, videoPath: null } },
    ] }],
  };
  try {
    const html = renderPlaybackReviewHtml('f1', 'A problem statement', {}, structure);
    assert.ok(html.includes('1 of 2 ACs have captured evidence'), 'expected the coverage summary text to appear in the rendered page');
    const summaryIndex = html.indexOf('1 of 2 ACs have captured evidence');
    const firstStoryIndex = html.indexOf('Story One');
    assert.ok(summaryIndex > -1 && firstStoryIndex > -1 && summaryIndex < firstStoryIndex, 'expected the summary to appear before the first per-story section');
    pass('AC1 (integration): summary appears in renderPlaybackReviewHtml\'s own output, positioned before any per-story section');
  } catch (e) { fail('AC1 (integration): summary appears in renderPlaybackReviewHtml\'s own output, positioned before any per-story section', e); }
})();

// AC4 (integration): existing per-story/per-AC markup is unchanged -- reuses fpd-s4's own fixture shape verbatim
(function () {
  const { renderPlaybackReviewHtml } = require('../src/web-ui/routes/playback');
  const structureWithEvidence = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{
      slug: 's1', name: 'Story One', epicSlug: 'e1',
      acRows: [{ acId: 'AC1', description: 'Thing works', evidence: 'proof', media: {
        screenshotPath: 'artefacts/f1/playback/screenshots/AC1.png',
        videoPath: 'artefacts/f1/playback/video/AC1.webm',
        captionPath: 'artefacts/f1/playback/video/AC1.vtt',
        transcriptPath: 'artefacts/f1/playback/video/AC1.transcript.txt',
      } }],
    }],
  };
  try {
    const html = renderPlaybackReviewHtml('f1', '', {}, structureWithEvidence);
    assert.ok(html.includes('<img') && html.includes('AC1.png'), 'expected an <img> referencing the screenshot, unchanged from fpd-s4');
    assert.ok(html.includes('<video') && html.includes('AC1.webm'), 'expected a native <video> referencing the clip, unchanged from fpd-s4');
    assert.ok(html.includes('<track') && html.includes('AC1.vtt'), 'expected a captions <track>, unchanged from fpd-s4');
    assert.ok(html.includes('AC1.transcript.txt'), 'expected the standalone transcript link, unchanged from fpd-s4');
    pass('AC4 (integration): existing per-story/per-AC markup is unchanged -- reuses fpd-s4\'s own fixture shape verbatim');
  } catch (e) { fail('AC4 (integration): existing per-story/per-AC markup is unchanged -- reuses fpd-s4\'s own fixture shape verbatim', e); }
})();

// NFR (Accessibility): coverage summary appears before per-story content in every coverage state, for document order
(function () {
  const { renderPlaybackReviewHtml } = require('../src/web-ui/routes/playback');
  const makeStructure = (media) => ({
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [
      { acId: 'AC1', description: 'a', evidence: 'e', media },
    ] }],
  });
  try {
    [
      { media: { screenshotPath: null, videoPath: null }, label: 'zero coverage' },
      { media: { screenshotPath: 'artefacts/f1/playback/s1/screenshots/AC1.png' }, label: 'full coverage' },
    ].forEach(({ media, label }) => {
      const html = renderPlaybackReviewHtml('f1', '', {}, makeStructure(media));
      const summaryIndex = html.indexOf('playback-coverage-summary');
      const storyIndex = html.indexOf('Story One');
      assert.ok(summaryIndex > -1 && storyIndex > -1 && summaryIndex < storyIndex, `expected summary before story content for ${label}`);
    });
    pass('NFR (Accessibility): coverage summary appears before per-story content in every coverage state, for document order');
  } catch (e) { fail('NFR (Accessibility): coverage summary appears before per-story content in every coverage state, for document order', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s6-review-page-coverage-summary.js
```

Expected output: the AC1 (integration) test FAILs with an assertion error (`summaryIndex` is `-1`, the summary text does not yet appear in `renderPlaybackReviewHtml`'s output) — AC4 and the NFR test currently PASS by coincidence (nothing has changed yet that would break them), but will be re-verified again in Step 4 alongside the fix.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback.js`, inside `renderPlaybackReviewHtml`, change the final `return` statement from:

```javascript
  return `<h1>${escHtml(featureSlug)}</h1>${summaryHtml}${epicSections}${flatSections}`;
```

to:

```javascript
  const coverageSummaryHtml = renderCoverageSummaryHtml(computeAcCoverageSummary(structure));

  return `<h1>${escHtml(featureSlug)}</h1>${summaryHtml}${coverageSummaryHtml}${epicSections}${flatSections}`;
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s6-review-page-coverage-summary.js
```

Expected output:
```
  [PASS] AC1 (unit): computeAcCoverageSummary reflects partial coverage correctly
  [PASS] AC2 (unit): computeAcCoverageSummary reports zero-coverage correctly, not omitted
  [PASS] AC3 (unit): computeAcCoverageSummary reports full-coverage correctly
  [PASS] AC1 (unit): renderCoverageSummaryHtml renders the exact partial-coverage wording
  [PASS] AC2 (unit): renderCoverageSummaryHtml states the zero-coverage case plainly, not omitted
  [PASS] AC3 (unit): renderCoverageSummaryHtml's full-coverage wording is textually distinct from partial, not colour-only (MC-A11Y-02)
  [PASS] AC1 (integration): summary appears in renderPlaybackReviewHtml's own output, positioned before any per-story section
  [PASS] AC4 (integration): existing per-story/per-AC markup is unchanged -- reuses fpd-s4's own fixture shape verbatim
  [PASS] NFR (Accessibility): coverage summary appears before per-story content in every coverage state, for document order

[fpd-s6-review-page-coverage-summary] Results: 9 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, `0` failed (confirms `fpd-s3`'s and `fpd-s4`'s own existing playback tests are unaffected by this change).

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s6-review-page-coverage-summary.js
git commit -m "feat(fpd-s6): wire coverage summary into renderPlaybackReviewHtml"
```
