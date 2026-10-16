# Viewer renders the actual screenshot gallery and plays video per AC — Implementation Plan

> **For agent execution:** Single session — use /tdd task by task (no subagents dispatched this run).

**Goal:** Make every test in fpd-s4-test-plan.md pass. Extend `fpd-s3`'s own per-AC section rendering to embed a screenshot `<img>`, a native `<video>` (with a captions `<track>`), and a standalone transcript link per AC — reusing `fpd-s3`'s own canonical structure (ADR-028), not a second traversal. Also builds the media-serving route these embeds need (a real, previously-unestimated touchpoint — found during this plan's own design, logged in decisions.md, not scope creep: the DoR's "serves existing files directly" constraint implies *some* serving mechanism, which the original estimate omitted).
**Branch:** `feature/fpd-s4`
**Worktree:** `.worktrees/fpd-s4`
**Test command:** `node scripts/run-all-tests.js` (unit/integration); `npx playwright test tests/e2e/fpd-s4-caption-sync.spec.js` (E2E, RISK-ACCEPT for execution per test plan)

---

## File map

```
Create:
  src/utils/playback-paths.js                          — captionTranscriptPaths, moved out of scripts/ (deployment-safety, same lesson as the fpd-s3 hotfix)
  tests/check-fpd-s4-viewer-media-playback.js           — unit + integration tests (AC1-AC5, path-traversal guard)
  tests/e2e/fpd-s4-caption-sync.spec.js                 — real-playback caption-sync E2E (RISK-ACCEPT execution)

Modify:
  scripts/playback-capture.js                           — import captionTranscriptPaths from src/utils/playback-paths instead of defining it locally
  src/web-ui/routes/playback.js                          — media resolution + rendering, new handleGetPlaybackMedia route handler
  src/web-ui/server.js                                   — register GET /playback-media/*
```

---

## Task 1: Move `captionTranscriptPaths` into `src/utils/` (deployment-safety, before anything else needs it)

**Files:**
- Create: `src/utils/playback-paths.js`
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s4-viewer-media-playback.js`

- [ ] **Step 1: Write the failing test**

```js
// Deployment-safety (unit): captionTranscriptPaths lives under src/, not scripts/
(function () {
  const { captionTranscriptPaths } = require('../src/utils/playback-paths');
  try {
    const result = captionTranscriptPaths('artefacts/f1/playback/video/clip-0.webm');
    assert.strictEqual(result.captionPath, 'artefacts/f1/playback/video/clip-0.vtt');
    assert.strictEqual(result.transcriptPath, 'artefacts/f1/playback/video/clip-0.transcript.txt');
    pass('Deployment-safety (unit): captionTranscriptPaths lives under src/, not scripts/');
  } catch (e) { fail('Deployment-safety (unit): captionTranscriptPaths lives under src/', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `Error: Cannot find module '../src/utils/playback-paths'`

- [ ] **Step 3: Write minimal implementation**

```js
'use strict';
// playback-paths.js -- shared playback-package filename conventions.
// Moved out of scripts/playback-capture.js (fpd-s2) because fpd-s4's own
// production route handler also needs this: scripts/ is never copied into
// the production Docker image (same lesson as the fpd-s3 hotfix -- see
// artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/
// decisions.md, 2026-10-17 INCIDENT entry). Any filename/path convention a
// route handler needs at runtime must live under src/, not scripts/.
function captionTranscriptPaths(videoPath) {
  const base = videoPath.replace(/\.webm$/, '');
  return { captionPath: `${base}.vtt`, transcriptPath: `${base}.transcript.txt` };
}

module.exports = { captionTranscriptPaths };
```

Then in `scripts/playback-capture.js`, replace the local `captionTranscriptPaths` function definition with:
```js
const { captionTranscriptPaths } = require('../src/utils/playback-paths');
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `[PASS] Deployment-safety (unit): captionTranscriptPaths lives under src/, not scripts/`

- [ ] **Step 5: Run fpd-s2's own tests — no regression** (confirms `generateCaptionsForVideo`'s internal usage still works)

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: all passing, unchanged

- [ ] **Step 6: Commit**

```bash
git add src/utils/playback-paths.js scripts/playback-capture.js tests/check-fpd-s4-viewer-media-playback.js
git commit -m "feat(fpd-s4): move captionTranscriptPaths under src/ -- scripts/ is never deployed"
```

---

## Task 2: Resolve screenshot/video/caption/transcript paths per AC (AC1, AC2, AC4, AC5 foundation)

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Test: `tests/check-fpd-s4-viewer-media-playback.js`

- [ ] **Step 1: Write the failing test**

```js
// Media resolution (unit): screenshot, video (per-AC and single-combined-file cases), caption, transcript
(function () {
  const { resolveAcMedia } = require('../src/web-ui/routes/playback');
  const path = require('path');
  const store = new Set();
  const fakeFs = {
    existsSync: (p) => store.has(p),
    readdirSync: (dir) => Array.from(store).filter((p) => path.dirname(p) === dir).map((p) => path.basename(p)),
  };
  // AC1: screenshot exists for AC1
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'screenshots', 'AC1.png'));
  // AC2 (per-AC-named clip + caption + transcript, all present)
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'video', 'AC2.webm'));
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'video', 'AC2.vtt'));
  store.add(path.join('/repo', 'artefacts', 'f1', 'playback', 'video', 'AC2.transcript.txt'));
  try {
    const ac1 = resolveAcMedia('/repo', 'f1', 'AC1', fakeFs);
    assert.strictEqual(ac1.screenshotPath, 'artefacts/f1/playback/screenshots/AC1.png');
    assert.strictEqual(ac1.videoPath, null, 'expected no video for AC1 -- no per-AC file and not a single-combined-file case (2 files exist)');

    const ac2 = resolveAcMedia('/repo', 'f1', 'AC2', fakeFs);
    assert.strictEqual(ac2.videoPath, 'artefacts/f1/playback/video/AC2.webm');
    assert.strictEqual(ac2.captionPath, 'artefacts/f1/playback/video/AC2.vtt');
    assert.strictEqual(ac2.transcriptPath, 'artefacts/f1/playback/video/AC2.transcript.txt');

    const ac3 = resolveAcMedia('/repo', 'f1', 'AC3', fakeFs);
    assert.strictEqual(ac3.screenshotPath, null);
    assert.strictEqual(ac3.videoPath, null, 'expected no evidence for AC3 -- no file matches and 2 videos exist, not a single-combined-file case');
    pass('Media resolution (unit): screenshot, per-AC video, caption, transcript, and no-evidence cases');
  } catch (e) { fail('Media resolution (unit): screenshot, per-AC video, caption, transcript', e); }
})();

// Media resolution (unit): single combined walkthrough video shared by every AC
(function () {
  const { resolveAcMedia } = require('../src/web-ui/routes/playback');
  const path = require('path');
  const store = new Set([path.join('/repo', 'artefacts', 'f2', 'playback', 'video', 'walkthrough.webm')]);
  const fakeFs = {
    existsSync: (p) => store.has(p),
    readdirSync: (dir) => Array.from(store).filter((p) => path.dirname(p) === dir).map((p) => path.basename(p)),
  };
  try {
    const ac1 = resolveAcMedia('/repo', 'f2', 'AC1', fakeFs);
    const ac2 = resolveAcMedia('/repo', 'f2', 'AC2', fakeFs);
    assert.strictEqual(ac1.videoPath, 'artefacts/f2/playback/video/walkthrough.webm', 'expected the single combined video shared with AC1');
    assert.strictEqual(ac2.videoPath, 'artefacts/f2/playback/video/walkthrough.webm', 'expected the SAME single combined video shared with AC2 too');
    pass('Media resolution (unit): a single combined walkthrough video is shared by every AC');
  } catch (e) { fail('Media resolution (unit): single combined walkthrough video', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `TypeError: resolveAcMedia is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
const { captionTranscriptPaths } = require('../../utils/playback-paths');

// AC1, AC5: screenshot path for one AC, if the file actually exists.
function resolveScreenshotPathForAc(repoRoot, featureSlug, acId, fsImpl) {
  const impl = fsImpl || fs;
  const relPath = `artefacts/${featureSlug}/playback/screenshots/${acId}.png`;
  return impl.existsSync(path.join(repoRoot, relPath)) ? relPath : null;
}

// AC2, AC5: video path for one AC -- a per-AC-named clip if one exists,
// else the single combined walkthrough file if the video/ directory
// contains exactly one .webm (AC2's own "or is covered by the feature's
// single combined walkthrough" case), else null (no evidence yet).
function resolveVideoPathForAc(repoRoot, featureSlug, acId, fsImpl) {
  const impl = fsImpl || fs;
  const videoDir = path.join(repoRoot, 'artefacts', featureSlug, 'playback', 'video');
  if (!impl.existsSync(videoDir)) return null;
  const perAcRel = `artefacts/${featureSlug}/playback/video/${acId}.webm`;
  if (impl.existsSync(path.join(repoRoot, perAcRel))) return perAcRel;
  const files = impl.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (files.length === 1) return `artefacts/${featureSlug}/playback/video/${files[0]}`;
  return null;
}

// AC3, AC4: given a resolved video path, derive caption/transcript paths
// (ADR-026 -- reuses fpd-s2's own naming convention) and confirm they
// actually exist on disk -- never render a reference to a file that isn't
// really there.
function resolveCaptionTranscriptForVideo(repoRoot, videoPath, fsImpl) {
  const impl = fsImpl || fs;
  if (!videoPath) return { captionPath: null, transcriptPath: null };
  const { captionPath, transcriptPath } = captionTranscriptPaths(videoPath);
  return {
    captionPath: impl.existsSync(path.join(repoRoot, captionPath)) ? captionPath : null,
    transcriptPath: impl.existsSync(path.join(repoRoot, transcriptPath)) ? transcriptPath : null,
  };
}

function resolveAcMedia(repoRoot, featureSlug, acId, fsImpl) {
  const screenshotPath = resolveScreenshotPathForAc(repoRoot, featureSlug, acId, fsImpl);
  const videoPath = resolveVideoPathForAc(repoRoot, featureSlug, acId, fsImpl);
  const { captionPath, transcriptPath } = resolveCaptionTranscriptForVideo(repoRoot, videoPath, fsImpl);
  return { screenshotPath, videoPath, captionPath, transcriptPath };
}
```

Add `resolveAcMedia` to the existing `module.exports` block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: both media-resolution tests `[PASS]`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s4-viewer-media-playback.js
git commit -m "feat(fpd-s4): resolve per-AC screenshot/video/caption/transcript paths"
```

---

## Task 3: Attach media to each AC row in the canonical structure (ADR-028 — no second traversal)

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Test: `tests/check-fpd-s4-viewer-media-playback.js`

- [ ] **Step 1: Write the failing test**

```js
// buildFeaturePlaybackStructure (unit): each AC row carries its own resolved media
(function () {
  const { buildFeaturePlaybackStructure } = require('../src/web-ui/routes/playback');
  const path = require('path');
  const store = {};
  const state = {
    features: [{ slug: 'f1', epics: [{ slug: 'e1', name: 'Epic One', stories: [{ slug: 's1', name: 'Story One' }] }] }],
  };
  store[path.join('/repo', '.github', 'pipeline-state.json')] = JSON.stringify(state);
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 's1-dod.md')] = [
    '## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — thing works | ✅ | proof | Automated test | None |',
  ].join('\n');
  const screenshotPath = path.join('/repo', 'artefacts', 'f1', 'playback', 'screenshots', 'AC1.png');
  const fakeFs = {
    existsSync: (p) => p === '/repo' || Object.prototype.hasOwnProperty.call(store, p) || p === screenshotPath || p === path.join('/repo', 'artefacts', 'f1') || p === path.join('/repo', 'artefacts', 'f1', 'dod'),
    readdirSync: (dir) => {
      if (dir === path.join('/repo', 'artefacts', 'f1')) return [{ name: 'dod', isDirectory: () => true, isFile: () => false }];
      if (dir === path.join('/repo', 'artefacts', 'f1', 'dod')) return [{ name: 's1-dod.md', isDirectory: () => false, isFile: () => true }];
      return [];
    },
    readFileSync: (p) => { if (store[p] !== undefined) return store[p]; throw new Error('ENOENT: ' + p); },
  };
  try {
    const structure = buildFeaturePlaybackStructure('/repo', 'f1', fakeFs);
    const ac1 = structure.stories[0].acRows[0];
    assert.strictEqual(ac1.media.screenshotPath, 'artefacts/f1/playback/screenshots/AC1.png');
    pass('buildFeaturePlaybackStructure (unit): each AC row carries its own resolved media');
  } catch (e) { fail('buildFeaturePlaybackStructure (unit): each AC row carries its own resolved media', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `AssertionError: expected undefined to equal 'artefacts/f1/playback/screenshots/AC1.png'` (or similar — `ac1.media` is `undefined`)

- [ ] **Step 3: Write minimal implementation**

In `buildFeaturePlaybackStructure`, change the `acRows` assignment:
```js
    let acRows = [];
    if (dodArtefact) {
      const content = impl.readFileSync(path.join(trace.resolvedDir, dodArtefact.path), 'utf8');
      acRows = parseDodAcCoverage(content).map((ac) => Object.assign({}, ac, {
        media: resolveAcMedia(repoRoot, featureSlug, ac.acId, impl),
      }));
    }
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `[PASS] buildFeaturePlaybackStructure (unit): each AC row carries its own resolved media`

- [ ] **Step 5: Run fpd-s3's own tests — no regression**

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: all passing, unchanged (the new `media` field is additive — `fpd-s3`'s own tests never asserted on the absence of this field)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s4-viewer-media-playback.js
git commit -m "feat(fpd-s4): attach resolved media to each AC row in the canonical structure"
```

---

## Task 4: Render the media into each AC section (AC1, AC2, AC4, AC5)

**Files:**
- Modify: `src/web-ui/routes/playback.js`
- Test: `tests/check-fpd-s4-viewer-media-playback.js`

- [ ] **Step 1: Write the failing test**

```js
// Rendering (unit): screenshot, video+captions track, transcript link, and empty-state all render correctly
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
  const structureNoEvidence = {
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{
      slug: 's1', name: 'Story One', epicSlug: 'e1',
      acRows: [{ acId: 'AC2', description: 'Nothing yet', evidence: 'n/a', media: {
        screenshotPath: null, videoPath: null, captionPath: null, transcriptPath: null,
      } }],
    }],
  };
  try {
    const htmlWithEvidence = renderPlaybackReviewHtml('f1', '', {}, structureWithEvidence);
    assert.ok(htmlWithEvidence.includes('<img') && htmlWithEvidence.includes('AC1.png'), 'expected an <img> referencing the screenshot');
    assert.ok(htmlWithEvidence.includes('<video') && htmlWithEvidence.includes('AC1.webm'), 'expected a native <video> referencing the clip');
    assert.ok(htmlWithEvidence.includes('<track') && htmlWithEvidence.includes('AC1.vtt'), 'expected a captions <track> wired to the caption file');
    assert.ok(htmlWithEvidence.includes('AC1.transcript.txt'), 'expected a standalone transcript link reachable without playback');
    assert.ok(!htmlWithEvidence.includes('third-party') , 'sanity: no third-party player markup');

    const htmlNoEvidence = renderPlaybackReviewHtml('f1', '', {}, structureNoEvidence);
    assert.ok(htmlNoEvidence.includes('No evidence captured for this AC yet'), 'expected an explicit empty-state message');
    assert.ok(!htmlNoEvidence.includes('<img'), 'expected no broken <img> for a no-evidence AC');
    pass('Rendering (unit): screenshot, video+captions, transcript link, and empty-state all render correctly');
  } catch (e) { fail('Rendering (unit): screenshot, video+captions, transcript link, empty-state', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: fails on the `<img>`/`<video>` assertions — current `renderStorySection` only renders the AC's own heading + evidence text, no media

- [ ] **Step 3: Write minimal implementation**

Replace the `acHtml` mapping inside `renderStorySection` (currently `story.acRows.map((ac) => ...)`):
```js
  const renderAcMediaHtml = (media) => {
    if (!media || (!media.screenshotPath && !media.videoPath)) {
      return '<p class="playback-ac__empty">No evidence captured for this AC yet.</p>';
    }
    const imgHtml = media.screenshotPath
      ? `<img class="playback-ac__screenshot" src="/playback-media/${encodeURIComponent(media.screenshotPath)}" alt="Screenshot evidence" style="max-width:100%;border-radius:6px;border:1px solid var(--line)">`
      : '';
    const trackHtml = media.captionPath
      ? `<track kind="captions" src="/playback-media/${encodeURIComponent(media.captionPath)}" default>`
      : '';
    const videoHtml = media.videoPath
      ? `<video class="playback-ac__video" controls style="max-width:100%;border-radius:6px"><source src="/playback-media/${encodeURIComponent(media.videoPath)}" type="video/webm">${trackHtml}</video>`
      : '';
    const transcriptHtml = media.transcriptPath
      ? `<p><a class="playback-ac__transcript-link" href="/playback-media/${encodeURIComponent(media.transcriptPath)}" target="_blank" rel="noopener">View transcript</a></p>`
      : '';
    return imgHtml + videoHtml + transcriptHtml;
  };

  const renderStorySection = (story) => {
    const acHtml = (story.acRows || []).length === 0
      ? '<p class="playback-story__no-acs">No AC Coverage data available for this story yet.</p>'
      : story.acRows.map((ac) =>
          `<div class="playback-ac"><h4>${escHtml(ac.acId)} — ${escHtml(ac.description)}</h4><p>${escHtml(ac.evidence)}</p>${renderAcMediaHtml(ac.media)}</div>`
        ).join('');
    return `<div class="sw-card playback-story"><h3 class="sw-section-title">${escHtml(story.name || story.slug)}</h3>${acHtml}</div>`;
  };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `[PASS] Rendering (unit): screenshot, video+captions, transcript link, and empty-state all render correctly`

- [ ] **Step 5: Run fpd-s3's own tests — no regression** (the existing rendering test there used fixture `acRows` with no `media` field at all — confirms the renderer degrades gracefully to the empty-state branch, not a crash)

```bash
node tests/check-fpd-s3-viewer-route-and-traceability-structure.js
```

Expected output: all passing, unchanged

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback.js tests/check-fpd-s4-viewer-media-playback.js
git commit -m "feat(fpd-s4): render screenshot/video/captions/transcript into each AC section"
```

---

## Task 5: Media-serving route, with the mandatory path-traversal guard

**Files:**
- Modify: `src/web-ui/routes/playback.js`, `src/web-ui/server.js`
- Test: `tests/check-fpd-s4-viewer-media-playback.js`

- [ ] **Step 1: Write the failing test**

```js
// Path traversal guard (unit, CLAUDE.md mandatory): a path outside artefacts/<slug>/playback/ is rejected with 400, nothing served
await (async function () {
  const { handleGetPlaybackMedia } = require('../src/web-ui/routes/playback');
  const repoRootModule = require('../src/web-ui/adapters/repo-root');
  const fsNode = require('fs');
  const os = require('os');
  const tmpRoot = fsNode.mkdtempSync(path.join(os.tmpdir(), 'fpd-s4-traversal-test-'));
  fsNode.mkdirSync(path.join(tmpRoot, 'artefacts', 'f1', 'playback', 'screenshots'), { recursive: true });
  fsNode.writeFileSync(path.join(tmpRoot, 'artefacts', 'f1', 'playback', 'screenshots', 'AC1.png'), 'fake-png-bytes');
  fsNode.writeFileSync(path.join(tmpRoot, 'secret.txt'), 'should never be servable');
  repoRootModule.setRepoRoot(tmpRoot);
  try {
    // Legitimate path: serves correctly
    const okRes = makeRes();
    await handleGetPlaybackMedia({ session: { accessToken: 'tok' } }, okRes, 'artefacts/f1/playback/screenshots/AC1.png');
    assert.strictEqual(okRes._get().status, 200, 'expected a legitimate media path to serve 200');

    // Traversal attempt: rejected
    const badRes = makeRes();
    await handleGetPlaybackMedia({ session: { accessToken: 'tok' } }, badRes, '../secret.txt');
    assert.strictEqual(badRes._get().status, 400, 'expected a traversal attempt to be rejected with 400');
    assert.ok(!badRes._get().body.includes('should never be servable'), 'expected the secret file content to never be served');

    // Wrong shape (not under playback/screenshots or playback/video): also rejected
    const badRes2 = makeRes();
    await handleGetPlaybackMedia({ session: { accessToken: 'tok' } }, badRes2, 'artefacts/f1/discovery.md');
    assert.strictEqual(badRes2._get().status, 400, 'expected a path outside the playback/ media shape to be rejected with 400');

    pass('Path traversal guard (unit): a path outside artefacts/<slug>/playback/ is rejected with 400, nothing served');
  } catch (e) { fail('Path traversal guard (unit)', e); }
  finally { repoRootModule.setRepoRoot(null); fsNode.rmSync(tmpRoot, { recursive: true, force: true }); }
})();
```

(Uses the same `makeRes()` helper pattern established in `fpd-s3`'s own test file — a `writeHead`/`end`/`_get()` fake response object. Copy that helper into this new test file too.)

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `TypeError: handleGetPlaybackMedia is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
const MEDIA_PATH_RE = /^artefacts\/[^/]+\/playback\/(screenshots|video)\/[^/]+\.(png|webm|vtt|txt)$/;
const MEDIA_CONTENT_TYPES = { '.png': 'image/png', '.webm': 'video/webm', '.vtt': 'text/vtt', '.txt': 'text/plain; charset=utf-8' };

async function handleGetPlaybackMedia(req, res, mediaPath) {
  const repoRoot = getRepoRoot(req);
  // Path traversal guard (CLAUDE.md mandatory): the path must match the
  // exact expected shape AND resolve to within artefacts/ -- rejects any
  // ../ segment or an unrelated artefact file, not just a resolved-outside-
  // repoRoot path (a shape check catches "artefacts/f1/discovery.md" too,
  // which path.resolve alone would not reject since it's still inside repoRoot).
  if (!MEDIA_PATH_RE.test(mediaPath)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }
  const resolved = path.resolve(repoRoot, mediaPath);
  const artefactsRoot = path.resolve(repoRoot, 'artefacts') + path.sep;
  if (!resolved.startsWith(artefactsRoot)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }
  if (!fs.existsSync(resolved)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  const contentType = MEDIA_CONTENT_TYPES[path.extname(resolved)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(resolved).pipe(res);
}
```

Add `handleGetPlaybackMedia` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s4-viewer-media-playback.js
```

Expected output: `[PASS] Path traversal guard (unit): a path outside artefacts/<slug>/playback/ is rejected with 400, nothing served`

- [ ] **Step 5: Register the route in `server.js`**

```js
const { handleGetPlaybackList, handleGetPlaybackReview, handleGetPlaybackMedia } = require('./routes/playback'); // fpd-s3, fpd-s4

// Near the /playback/:slug dispatch:
} else if (pathname.startsWith('/playback-media/') && req.method === 'GET') {
  // fpd-s4
  const mediaPath = decodeURIComponent(pathname.slice('/playback-media/'.length));
  authGuard(req, res, async () => {
    await handleGetPlaybackMedia(req, res, mediaPath);
  });
}
```

- [ ] **Step 6: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/playback.js src/web-ui/server.js tests/check-fpd-s4-viewer-media-playback.js
git commit -m "feat(fpd-s4): add media-serving route with mandatory path-traversal guard"
```

---

## Task 6: E2E spec — real caption sync during real playback (AC3, RISK-ACCEPT for execution)

**Files:**
- Create: `tests/e2e/fpd-s4-caption-sync.spec.js`

- [ ] **Step 1: Write the spec** (not executable in this sandbox — no reachable Postgres, `decisions.md` D5; confirmed syntactically valid only, per test plan's own RISK-ACCEPT)

```js
'use strict';
// fpd-s4-caption-sync.spec.js -- E2E for caption sync during real video
// playback (fpd-s4 AC3). jsdom cannot play media or render caption tracks
// over time -- this needs a real browser engine. RISK-ACCEPTed for
// execution in this sandbox -- no reachable Postgres (decisions.md D5),
// same gap as every other story this cycle.
const { expect } = require('@playwright/test');
const { withAuth } = require('./fixtures/auth');

withAuth('captions display, synced, when enabled via native player controls', async ({ page }) => {
  await page.goto('/playback/some-dod-complete-feature-with-a-real-package');
  const video = page.locator('.playback-ac__video').first();
  await expect(video).toBeVisible();
  const track = video.locator('track[kind="captions"]');
  await expect(track).toHaveCount(1);
  await video.evaluate((el) => { el.textTracks[0].mode = 'showing'; });
  await video.evaluate((el) => el.play());
  await page.waitForTimeout(1000);
  const activeCues = await video.evaluate((el) => el.textTracks[0].activeCues.length);
  expect(activeCues).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Confirm syntactic validity (cannot execute — RISK-ACCEPT)**

```bash
node --check tests/e2e/fpd-s4-caption-sync.spec.js
```

Expected output: no output, exit 0 (syntax valid)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/fpd-s4-caption-sync.spec.js
git commit -m "test(fpd-s4): add E2E caption-sync spec (RISK-ACCEPT for execution, decisions.md D5)"
```
