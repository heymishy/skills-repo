# Close the real-capture loop — Implementation Plan

> **For agent execution:** Single session — use /tdd task by task (no subagents dispatched this run).

**Goal:** Fix the AC-table-format gap (AC1) and the screenshot/video filename collision (AC2) that block the viewer's media-rendering code from ever firing against a real feature, fix the staging-deploy CX gap (AC3), then run the first real capture end to end and live-verify it (AC4).
**Branch:** `feature/fpd-s5`
**Worktree:** `.worktrees/fpd-s5`
**Test command:** `node scripts/run-all-tests.js`

---

## File map

```
Create:
  tests/check-fpd-s5-close-the-real-capture-loop.js   — unit + integration tests (AC1-AC3)

Modify:
  src/utils/dod-parsing.js                             — parseDodAcCoverage also parses "## AC Verification" tables
  src/web-ui/routes/playback.js                         — screenshot/video/media resolution namespaced by storySlug
  scripts/playback-capture.js                           — captureAcScreenshots/captureVideoRecording take storySlug
  .github/workflows/staging-deploy.yml                  — paths-ignore no longer skips artefacts/*/playback/**
  tests/check-fpd-s1-walkthrough-document-and-screenshots.js  — updated for the new storySlug param + path shape
  tests/check-fpd-s2-video-walkthrough-and-accessibility.js   — same, for captureVideoRecording

Real capture output (not a code change, a tracked artefact):
  artefacts/2026-06-14-web-ui-pm-flow/playback/**       — replaced with a real captured package (Task 5)
```

---

## Task 1: `parseDodAcCoverage` also parses `## AC Verification` tables (AC1)

**Files:**
- Modify: `src/utils/dod-parsing.js`
- Create: `tests/check-fpd-s5-close-the-real-capture-loop.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
// check-fpd-s5-close-the-real-capture-loop.js -- TDD tests for fpd-s5
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s5-close-the-real-capture-loop.md
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC1 (unit): parseDodAcCoverage parses an "## AC Verification" table into the same shape
(function () {
  const { parseDodAcCoverage } = require('../src/utils/dod-parsing');
  const fixture = [
    '## AC Verification', '',
    '| AC | Verified by | Result |',
    '|----|--------------|--------|',
    '| AC1 — Step 1 three named options | T3.1, T3.2 | ✅ PASS |',
  ].join('\n');
  try {
    const rows = parseDodAcCoverage(fixture);
    assert.strictEqual(rows.length, 1, 'expected exactly one parsed row');
    assert.strictEqual(rows[0].acId, 'AC1');
    assert.strictEqual(rows[0].description, 'Step 1 three named options');
    assert.strictEqual(rows[0].evidence, 'T3.1, T3.2', 'expected evidence sourced from the Verified by column');
    assert.strictEqual(rows[0].satisfied, '✅ PASS', 'expected satisfied sourced from the Result column');
    assert.strictEqual(rows[0].verificationMethod, '', 'no equivalent column in this table shape');
    assert.strictEqual(rows[0].deviation, '', 'no equivalent column in this table shape');
    pass('AC1 (unit): parseDodAcCoverage parses an "## AC Verification" table into the same shape');
  } catch (e) { fail('AC1 (unit): parseDodAcCoverage parses "## AC Verification"', e); }
})();

console.log(`\n[fpd-s5-close-the-real-capture-loop] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s5-close-the-real-capture-loop.js
```

Expected output: `[FAIL] AC1 (unit): parseDodAcCoverage parses "## AC Verification": AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 0 !== 1` (zero rows parsed, since `parseDodAcCoverage` only looks for `## AC Coverage` today)

- [ ] **Step 3: Write minimal implementation**

In `src/utils/dod-parsing.js`, replace `parseDodAcCoverage`:

```js
function parseDodAcCoverage(dodMarkdown) {
  let rows = parseMarkdownTable(dodMarkdown, 'AC Coverage');
  let isVerificationShape = false;
  if (rows.length === 0) {
    rows = parseMarkdownTable(dodMarkdown, 'AC Verification');
    isVerificationShape = rows.length > 0;
  }
  return rows.map(row => {
    const acCell = row['AC'] || '';
    const match = acCell.match(/^(AC\d+)\s*—\s*(.*)$/);
    return {
      acId: match ? match[1] : acCell,
      description: match ? match[2] : acCell,
      satisfied: isVerificationShape ? (row['Result'] || '') : (row['Satisfied?'] || ''),
      evidence: isVerificationShape ? (row['Verified by'] || '') : (row['Evidence'] || ''),
      verificationMethod: row['Verification method'] || '',
      deviation: row['Deviation'] || '',
    };
  });
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s5-close-the-real-capture-loop.js
```

Expected output: `[PASS] AC1 (unit): parseDodAcCoverage parses an "## AC Verification" table into the same shape`

- [ ] **Step 5: Run fpd-s1/fpd-s3's own tests — no regression** (both already call `parseDodAcCoverage` against real `## AC Coverage` fixtures; this change must not affect that path since it's checked first and only falls through to `## AC Verification` when zero rows are found)

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: all passing, unchanged

- [ ] **Step 6: Commit**

```bash
git add src/utils/dod-parsing.js tests/check-fpd-s5-close-the-real-capture-loop.js
git commit -m "feat(fpd-s5): parseDodAcCoverage also parses ## AC Verification tables"
```

---

## Task 2: Screenshot/video paths namespaced by story — `playback.js` (AC2, viewer side)

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Test: `tests/check-fpd-s5-close-the-real-capture-loop.js`

- [ ] **Step 1: Write the failing test**

Insert before the closing `console.log`/`process.exit()` block:

```js
// AC2 (unit): screenshot path is namespaced by story -- two stories' own same-numbered AC resolve to different files
(function () {
  const { resolveAcMedia } = require('../src/web-ui/routes/playback');
  const store = new Set();
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 's1', 'screenshots', 'AC1.png'));
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 's2', 'screenshots', 'AC1.png'));
  const fakeFs = {
    existsSync: (p) => store.has(p) || Array.from(store).some((f) => f.startsWith(p + path.sep)),
    readdirSync: (dir) => Array.from(store).filter((p) => path.dirname(p) === dir).map((p) => path.basename(p)),
  };
  try {
    const s1ac1 = resolveAcMedia('/repo', 'f1', 's1', 'AC1', fakeFs);
    const s2ac1 = resolveAcMedia('/repo', 'f1', 's2', 'AC1', fakeFs);
    assert.strictEqual(s1ac1.screenshotPath, 'artefacts/f1/playback/s1/screenshots/AC1.png');
    assert.strictEqual(s2ac1.screenshotPath, 'artefacts/f1/playback/s2/screenshots/AC1.png');
    assert.notStrictEqual(s1ac1.screenshotPath, s2ac1.screenshotPath, 'expected two independent, non-colliding paths');
    pass('AC2 (unit): screenshot path is namespaced by story -- no cross-story collision');
  } catch (e) { fail('AC2 (unit): screenshot path namespaced by story', e); }
})();

// AC2 (unit): video path is namespaced by story -- same collision check for the single-combined-file fallback
(function () {
  const { resolveAcMedia } = require('../src/web-ui/routes/playback');
  const store = new Set();
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 's1', 'video', 'walkthrough.webm'));
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 's2', 'video', 'other.webm'));
  const fakeFs = {
    existsSync: (p) => store.has(p) || Array.from(store).some((f) => f.startsWith(p + path.sep)),
    readdirSync: (dir) => Array.from(store).filter((p) => path.dirname(p) === dir).map((p) => path.basename(p)),
  };
  try {
    const s1ac1 = resolveAcMedia('/repo', 'f1', 's1', 'AC1', fakeFs);
    const s2ac1 = resolveAcMedia('/repo', 'f1', 's2', 'AC1', fakeFs);
    assert.strictEqual(s1ac1.videoPath, 'artefacts/f1/playback/s1/video/walkthrough.webm');
    assert.strictEqual(s2ac1.videoPath, 'artefacts/f1/playback/s2/video/other.webm');
    pass('AC2 (unit): video path is namespaced by story -- single-combined-file fallback does not collide');
  } catch (e) { fail('AC2 (unit): video path namespaced by story', e); }
})();

// AC2 (integration): buildFeaturePlaybackStructure attaches independent, non-colliding media to two stories
(function () {
  const { buildFeaturePlaybackStructure } = require('../src/web-ui/routes/playback');
  const store = {};
  const state = {
    features: [{ slug: 'f1', epics: [{ slug: 'e1', name: 'Epic One', stories: [
      { slug: 's1', name: 'Story One' },
      { slug: 's2', name: 'Story Two' },
    ] }] }],
  };
  store[path.join('/repo', '.github', 'pipeline-state.json')] = JSON.stringify(state);
  const dodTable = (storyLabel) => [
    '## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    `| AC1 — ${storyLabel} thing works | ✅ | proof | Automated test | None |`,
  ].join('\n');
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 's1-dod.md')] = dodTable('Story One');
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 's2-dod.md')] = dodTable('Story Two');
  const s1Screenshot = path.join('/repo', 'artefacts', 'f1', 'playback', 's1', 'screenshots', 'AC1.png');
  const s2Screenshot = path.join('/repo', 'artefacts', 'f1', 'playback', 's2', 'screenshots', 'AC1.png');
  const fakeFs = {
    existsSync: (p) => p === '/repo' || Object.prototype.hasOwnProperty.call(store, p) || p === s1Screenshot || p === s2Screenshot
      || p === path.join('/repo', 'artefacts', 'f1') || p === path.join('/repo', 'artefacts', 'f1', 'dod'),
    readdirSync: (dir) => {
      if (dir === path.join('/repo', 'artefacts', 'f1')) return [{ name: 'dod', isDirectory: () => true, isFile: () => false }];
      if (dir === path.join('/repo', 'artefacts', 'f1', 'dod')) return [
        { name: 's1-dod.md', isDirectory: () => false, isFile: () => true },
        { name: 's2-dod.md', isDirectory: () => false, isFile: () => true },
      ];
      return [];
    },
    readFileSync: (p) => { if (store[p] !== undefined) return store[p]; throw new Error('ENOENT: ' + p); },
  };
  try {
    const structure = buildFeaturePlaybackStructure('/repo', 'f1', fakeFs);
    const s1 = structure.stories.find((s) => s.slug === 's1');
    const s2 = structure.stories.find((s) => s.slug === 's2');
    assert.ok(s1.acRows[0].media.screenshotPath, 'expected story 1 own AC1 to resolve a screenshot');
    assert.ok(s2.acRows[0].media.screenshotPath, 'expected story 2 own AC1 to resolve a screenshot');
    assert.notStrictEqual(s1.acRows[0].media.screenshotPath, s2.acRows[0].media.screenshotPath, 'expected two different, non-colliding files');
    pass('AC2 (integration): buildFeaturePlaybackStructure attaches independent, non-colliding media to two stories');
  } catch (e) { fail('AC2 (integration): buildFeaturePlaybackStructure non-colliding media', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s5-close-the-real-capture-loop.js
```

Expected output: `TypeError: resolveAcMedia(...) called with 5 args where current signature only accepts 4` style failures — in practice, `resolveAcMedia('/repo', 'f1', 's1', 'AC1', fakeFs)` will silently misinterpret `'AC1'` as `fsImpl` under the *old* 4-arg signature (`repoRoot, featureSlug, acId, fsImpl`), so `fakeFs` (the real 5th arg) is dropped and real `fs` is used instead — producing `screenshotPath: null` for both, failing the `assert.ok` calls.

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback.js`, replace the three resolve functions and `buildFeaturePlaybackStructure`'s own call site:

```js
// AC1, AC5: screenshot path for one AC, if the file actually exists.
// fpd-s5: namespaced by storySlug -- artefacts/<featureSlug>/playback/<storySlug>/screenshots/<acId>.png
// -- fixes a real cross-story collision: AC numbering restarts per story, so
// two different stories' own "AC1" would otherwise share the same file.
function resolveScreenshotPathForAc(repoRoot, featureSlug, storySlug, acId, fsImpl) {
  const impl = fsImpl || fs;
  const relPath = `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${acId}.png`;
  return impl.existsSync(path.join(repoRoot, relPath)) ? relPath : null;
}

// AC2, AC5: video path for one AC -- a per-AC-named clip if one exists,
// else the single combined walkthrough file if the video/ directory
// contains exactly one .webm, else null. fpd-s5: namespaced by storySlug,
// same reasoning as resolveScreenshotPathForAc above.
function resolveVideoPathForAc(repoRoot, featureSlug, storySlug, acId, fsImpl) {
  const impl = fsImpl || fs;
  const videoDir = path.join(repoRoot, 'artefacts', featureSlug, 'playback', storySlug, 'video');
  if (!impl.existsSync(videoDir)) return null;
  const perAcRel = `artefacts/${featureSlug}/playback/${storySlug}/video/${acId}.webm`;
  if (impl.existsSync(path.join(repoRoot, perAcRel))) return perAcRel;
  const files = impl.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (files.length === 1) return `artefacts/${featureSlug}/playback/${storySlug}/video/${files[0]}`;
  return null;
}

function resolveAcMedia(repoRoot, featureSlug, storySlug, acId, fsImpl) {
  const screenshotPath = resolveScreenshotPathForAc(repoRoot, featureSlug, storySlug, acId, fsImpl);
  const videoPath = resolveVideoPathForAc(repoRoot, featureSlug, storySlug, acId, fsImpl);
  const { captionPath, transcriptPath } = resolveCaptionTranscriptForVideo(repoRoot, videoPath, fsImpl);
  return { screenshotPath, videoPath, captionPath, transcriptPath };
}
```

And in `buildFeaturePlaybackStructure`, update the call site:

```js
      acRows = parseDodAcCoverage(content).map((ac) => Object.assign({}, ac, {
        media: resolveAcMedia(repoRoot, featureSlug, story.slug, ac.acId, impl),
      }));
```

And update `MEDIA_PATH_RE` to match the new shape:

```js
const MEDIA_PATH_RE = /^artefacts\/[^/]+\/playback\/[^/]+\/(screenshots|video)\/[^/]+\.(png|webm|vtt|txt)$/;
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s5-close-the-real-capture-loop.js
```

Expected output: both AC2 unit tests and the AC2 integration test `[PASS]`

- [ ] **Step 5: Run fpd-s3/fpd-s4's own tests — expect and confirm a known, deliberate break**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `resolveAcMedia`'s own fpd-s4 fixtures call it with the *old* 4-arg signature — this WILL fail now. This is expected, not a regression to silently work around: fix forward in the same commit by updating `tests/check-fpd-s4-viewer-media-playback.js`'s own fixtures to pass a `storySlug` (e.g. `'s1'`) and expect the new path shape (`artefacts/f1/playback/s1/screenshots/AC1.png`), matching this story's own Architecture Constraints ("modified together, not left to drift").

- [ ] **Step 6: Run full suite — confirm only the expected, now-fixed fpd-s4 test file changed**

```bash
node scripts/run-all-tests.js
```

Expected output: all passing (758/759 baseline + this story's own new tests)

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s5-close-the-real-capture-loop.js tests/check-fpd-s4-viewer-media-playback.js
git commit -m "feat(fpd-s5): namespace screenshot/video paths by story -- fixes cross-story AC-id collision"
```

---

## Task 3: Screenshot/video paths namespaced by story — capture script side (AC2, companion)

**Files:**
- Modify: `scripts/playback-capture.js`, `tests/check-fpd-s1-walkthrough-document-and-screenshots.js`, `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`

- [ ] **Step 1: Update the two existing tests first (TDD red step, since the functions they call haven't changed yet)**

In `tests/check-fpd-s1-walkthrough-document-and-screenshots.js`, the AC3 test block:
```js
    const shots = await captureAcScreenshots({ page: fakePage, featureSlug: 'f1', storySlug: 's1', acList });
    assert.strictEqual(calls.length, 2, 'expected page.screenshot() called once per AC');
    assert.strictEqual(shots[0].path, 'artefacts/f1/playback/s1/screenshots/AC1.png');
    assert.strictEqual(shots[1].path, 'artefacts/f1/playback/s1/screenshots/AC2.png');
```

In `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`, update all three `captureVideoRecording(...)` calls to pass `storySlug: 's1'`, and update the two path assertions:
```js
    assert.strictEqual(calls[0].recordVideo.dir, 'artefacts/f1/playback/s1/video/');
    assert.strictEqual(results[0].path, 'artefacts/f1/playback/s1/video/clip-0.webm');
```

- [ ] **Step 2: Run both — must fail**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: path assertions fail — `captureAcScreenshots`/`captureVideoRecording` don't use `storySlug` yet, so the produced paths still lack the new segment.

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`:

```js
async function captureAcScreenshots({ page, featureSlug, storySlug, acList }) {
  const shots = [];
  for (const ac of acList) {
    const relPath = `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${ac.acId}.png`;
    await page.screenshot({ path: relPath, selector: ac.selector });
    shots.push({ acId: ac.acId, path: relPath });
  }
  return shots;
}
```

```js
async function captureVideoRecording({ browser, featureSlug, storySlug, clips }) {
  const dir = `artefacts/${featureSlug}/playback/${storySlug}/video/`;
  const results = [];
  for (const clip of clips) {
    const context = await browser.newContext({ recordVideo: { dir, size: { width: 1280, height: 720 } } });
    const page = await context.newPage();
    if (clip.run) await clip.run(page);
    await context.close();
    const video = page.video ? page.video() : null;
    const resultPath = video ? await video.path() : null;
    results.push({ name: clip.name, path: resultPath });
  }
  return results;
}
```

(Note: the inner local variable is renamed `resultPath` — the original shadowed the required `path` module import with a local `const path = video ? ... : null`, which happened to work only because `embedScreenshotPaths` does its own separate `require('path')` inside its own function body. Renaming removes the shadowing without changing behaviour.)

- [ ] **Step 4: Run both tests — must pass**

```bash
node tests/check-fpd-s1-walkthrough-document-and-screenshots.js
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: both files fully passing

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s1-walkthrough-document-and-screenshots.js tests/check-fpd-s2-video-walkthrough-and-accessibility.js
git commit -m "feat(fpd-s5): thread storySlug through captureAcScreenshots/captureVideoRecording"
```

---

## Task 4: `staging-deploy.yml` still deploys for an `artefacts/*/playback/**`-only push (AC3)

**Files:**
- Modify: `.github/workflows/staging-deploy.yml`
- Test: `tests/check-fpd-s5-close-the-real-capture-loop.js`

- [ ] **Step 1: Write the failing test**

```js
// AC3 (unit): staging-deploy.yml's own paths-ignore carves out artefacts/*/playback/**
(function () {
  const fs = require('fs');
  try {
    const yaml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'staging-deploy.yml'), 'utf8');
    const artefactsIdx = yaml.indexOf("- 'artefacts/**'");
    const negationIdx = yaml.indexOf("- '!artefacts/*/playback/**'");
    assert.ok(artefactsIdx !== -1, 'expected artefacts/** still present in paths-ignore');
    assert.ok(negationIdx !== -1, 'expected the negation pattern to be present');
    assert.ok(negationIdx > artefactsIdx, 'expected the negation pattern to appear AFTER artefacts/** (GitHub Actions evaluates path filters in order -- a later pattern wins)');
    pass("AC3 (unit): staging-deploy.yml's own paths-ignore carves out artefacts/*/playback/**");
  } catch (e) { fail("AC3 (unit): staging-deploy.yml paths-ignore", e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s5-close-the-real-capture-loop.js
```

Expected output: `AssertionError: expected the negation pattern to be present` (`negationIdx === -1`)

- [ ] **Step 3: Write minimal implementation**

In `.github/workflows/staging-deploy.yml`, change:
```yaml
    paths-ignore:
      - 'workspace/**'
      - 'artefacts/**'
      - '.github/pipeline-state.json'
```
to:
```yaml
    paths-ignore:
      - 'workspace/**'
      - 'artefacts/**'
      - '!artefacts/*/playback/**'
      - '.github/pipeline-state.json'
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s5-close-the-real-capture-loop.js
```

Expected output: `[PASS] AC3 (unit): staging-deploy.yml's own paths-ignore carves out artefacts/*/playback/**`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/staging-deploy.yml tests/check-fpd-s5-close-the-real-capture-loop.js
git commit -m "feat(fpd-s5): staging-deploy.yml still deploys for an artefacts/*/playback/**-only push"
```

---

## Task 5: Real capture, real deploy, real live-observed rendering (AC4)

**Not a TDD task** — AC4 is manual/live by nature (see test plan's own Coverage gaps). Steps, in order, once Tasks 1-4 are merged to master and deployed:

- [ ] **Step 1:** Delete the earlier hand-authored `artefacts/2026-06-14-web-ui-pm-flow/playback/` package (it predates this story's fix and does not exercise the real capture mechanism — see story's own Out of Scope).
- [ ] **Step 2:** Using the operator's own authenticated Chrome session, take a real screenshot of the live `wuce-staging.fly.dev/dashboard?view=board` page (the real UI `pmf.3`'s own AC1 — "Step 1 three named options" — wait, confirm against `pmf.3-dod.md`'s real AC text before selecting which page/AC to screenshot).
- [ ] **Step 3:** Write a real `walkthrough.md` for `2026-06-14-web-ui-pm-flow`, and save the real screenshot at the new, story-namespaced path: `artefacts/2026-06-14-web-ui-pm-flow/playback/pmf.3/screenshots/<matching-acId>.png`.
- [ ] **Step 4:** Commit and push directly to master (artefact-only change, no PR required per CLAUDE.md's bookkeeping-path rule) — confirm the commit touches ONLY `artefacts/2026-06-14-web-ui-pm-flow/playback/**`.
- [ ] **Step 5:** Watch the triggered Staging Deploy run to completion — confirm it was NOT skipped (this is the real AC3 proof).
- [ ] **Step 6:** In Chrome, logged in, navigate to `/playback` — confirm `web-ui-pm-flow` now appears in the list.
- [ ] **Step 7:** Click into `/playback/2026-06-14-web-ui-pm-flow` — confirm `pmf.3`'s own AC section renders the real screenshot inline (an actual `<img>`, not the empty-state message) — this is the real AC1+AC4 proof together.
- [ ] **Step 8:** Record the outcome (pass/fail, screenshot/URL evidence) in `artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/verification-scripts/fpd-s5-verification.md`'s own Scenario 4.
