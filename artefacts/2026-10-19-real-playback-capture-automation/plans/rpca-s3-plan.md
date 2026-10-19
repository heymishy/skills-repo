# Video capture wired for real, reusing the existing caption/transcript adapter — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every automatable test in the test plan pass (AC2, AC3). AC1's own "a real `.webm` file is produced" claim is RISK-ACCEPTed for automated execution — verified manually by the operator with the real secret, same shared dependency already used for `rpca-s1`.
**Branch:** `feature/rpca-s3`
**Worktree:** `.worktrees/rpca-s3`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-rpca-s3-video-capture-wired-for-real.js`

---

## File map

```
Create:
  tests/check-rpca-s3-video-capture-wired-for-real.js  — unit tests (AC2, AC3)

Modify:
  scripts/playback-capture.js  — add captureVideoForClip; export it; no change to
                                   captureVideoRecording, generateCaptionsForVideo,
                                   or authenticateStagingSession's own signatures
```

---

## Task 1: `captureVideoForClip`'s success path wires a real capture to `generateCaptionsForVideo`

**Files:**
- Modify: `scripts/playback-capture.js`
- Create: `tests/check-rpca-s3-video-capture-wired-for-real.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-rpca-s3-video-capture-wired-for-real.js` with this content:

```javascript
'use strict';
// check-rpca-s3-video-capture-wired-for-real.js -- TDD tests for rpca-s3
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s3-video-capture-wired-for-real.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC2 (unit): a successful video capture wires generateCaptionsForVideo, marked unreviewed
await (async function () {
  const { captureVideoForClip } = require('../scripts/playback-capture');
  const { setGenerateCaptionsAndTranscript, getGenerateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  const fs = require('fs');
  const path = require('path');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-s3-test-fixture-ac2', 'playback', 'rpca-fixture-story', 'video');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const fixtureVideoPath = path.join(fixtureDir, 'fixture.webm');
  fs.writeFileSync(fixtureVideoPath, 'fake recorded video bytes');
  const originalImpl = getGenerateCaptionsAndTranscript();
  let receivedArgs = null;
  setGenerateCaptionsAndTranscript(async (videoPath, interactionSequenceText) => {
    receivedArgs = { videoPath, interactionSequenceText };
    return { captions: 'FIXTURE CAPTIONS', transcript: 'FIXTURE TRANSCRIPT' };
  });
  const mockPage = { video: () => ({ path: async () => fixtureVideoPath }) };
  const mockContext = { newPage: async () => mockPage, close: async () => {} };
  const mockBrowser = { newContext: async () => mockContext };
  const clip = { name: 'fixture', interactionSequenceText: 'fixture sequence', run: async () => {} };
  try {
    const result = await captureVideoForClip({ browser: mockBrowser, featureSlug: 'rpca-s3-test-fixture-ac2', storySlug: 'rpca-fixture-story', clip });
    assert.strictEqual(receivedArgs.videoPath, fixtureVideoPath, 'expected generateCaptionsForVideo to be called with the real captured video path');
    assert.strictEqual(receivedArgs.interactionSequenceText, 'fixture sequence', 'expected the clip\'s own interaction sequence text to be passed through');
    assert.strictEqual(result.reviewed, false, 'expected the result to be marked unreviewed until explicit confirmation');
    assert.strictEqual(result.path, fixtureVideoPath, 'expected the real video path in the result');
    assert.ok(fs.existsSync(result.captionPath), 'expected a real caption file to be written');
    assert.ok(fs.existsSync(result.transcriptPath), 'expected a real transcript file to be written');
    pass('AC2 (unit): a successful video capture wires generateCaptionsForVideo, marked unreviewed');
  } catch (e) { fail('AC2 (unit): a successful video capture wires generateCaptionsForVideo, marked unreviewed', e); }
  finally {
    setGenerateCaptionsAndTranscript(originalImpl);
    fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-s3-test-fixture-ac2'), { recursive: true, force: true });
  }
})();

console.log(`\n[rpca-s3-video-capture-wired-for-real] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s3-video-capture-wired-for-real.js
```

Expected output: `TypeError: captureVideoForClip is not a function` (or equivalent)

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`, add after `generateCaptionsForVideo` (before the `rpca-s1: authenticates against a real deployed wuce-staging instance` comment block):

```javascript
// rpca-s3: wires a single clip's own real Playwright recording (reusing
// captureVideoRecording's own existing directory convention and size) to
// generateCaptionsForVideo on success. On a mid-capture failure, closes the
// context to flush whatever Playwright already wrote, deletes that partial
// file if it exists, and re-throws the original error -- a failed run
// leaves no partial/corrupt file behind (AC3). Does not modify
// captureVideoRecording or generateCaptionsForVideo themselves.
async function captureVideoForClip({ browser, featureSlug, storySlug, clip }) {
  const dir = `artefacts/${featureSlug}/playback/${storySlug}/video/`;
  const context = await browser.newContext({ recordVideo: { dir, size: { width: 1280, height: 720 } } });
  const page = await context.newPage();
  try {
    if (clip.run) await clip.run(page);
    await context.close();
    const video = page.video ? page.video() : null;
    const videoPath = video ? await video.path() : null;
    const captionResult = await generateCaptionsForVideo(videoPath, clip.interactionSequenceText || '');
    return Object.assign({ path: videoPath }, captionResult);
  } catch (err) {
    try { await context.close(); } catch (_) { /* already closed or closing failed -- still attempt cleanup below */ }
    try {
      const video = page.video ? page.video() : null;
      const partialPath = video ? await video.path() : null;
      if (partialPath && fs.existsSync(partialPath)) fs.unlinkSync(partialPath);
    } catch (_) { /* best-effort cleanup -- never mask the original error */ }
    throw err;
  }
}
```

Add `captureVideoForClip` to the `module.exports` block.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s3-video-capture-wired-for-real.js
```

Expected output:
```
  [PASS] AC2 (unit): a successful video capture wires generateCaptionsForVideo, marked unreviewed

[rpca-s3-video-capture-wired-for-real] Results: 1 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add scripts/playback-capture.js tests/check-rpca-s3-video-capture-wired-for-real.js
git commit -m "rpca-s3: captureVideoForClip wires a successful capture to generateCaptionsForVideo (AC2)"
```

---

## Task 2: `captureVideoForClip`'s failure path leaves no partial file behind

**Files:**
- Modify: `tests/check-rpca-s3-video-capture-wired-for-real.js` (no further `scripts/playback-capture.js` change — Task 1's own implementation already includes the failure-cleanup branch)

- [ ] **Step 1: Write the failing test**

Insert into `tests/check-rpca-s3-video-capture-wired-for-real.js`, directly after the AC2 test and before the `console.log` summary line:

```javascript
// AC3 (unit): a mid-capture failure leaves no partial file on disk
await (async function () {
  const { captureVideoForClip } = require('../scripts/playback-capture');
  const fs = require('fs');
  const path = require('path');
  const fixtureDir = path.join(__dirname, '..', 'artefacts', 'rpca-s3-test-fixture-ac3', 'playback', 'rpca-fixture-story', 'video');
  fs.mkdirSync(fixtureDir, { recursive: true });
  const partialVideoPath = path.join(fixtureDir, 'partial-fixture.webm');
  fs.writeFileSync(partialVideoPath, 'fake partial video bytes written by Playwright before the failure');
  const mockPage = { video: () => ({ path: async () => partialVideoPath }) };
  const mockContext = { newPage: async () => mockPage, close: async () => {} };
  const mockBrowser = { newContext: async () => mockContext };
  const clip = { name: 'fixture', run: async () => { throw new Error('simulated mid-recording failure'); } };
  try {
    let threw = null;
    try {
      await captureVideoForClip({ browser: mockBrowser, featureSlug: 'rpca-s3-test-fixture-ac3', storySlug: 'rpca-fixture-story', clip });
    } catch (e) { threw = e; }
    assert.ok(threw, 'expected the failure to be surfaced, not swallowed');
    assert.strictEqual(threw.message, 'simulated mid-recording failure', 'expected the original error to propagate unmasked');
    assert.strictEqual(fs.existsSync(partialVideoPath), false, 'expected the partial file to be deleted, not left behind');
    pass('AC3 (unit): a mid-capture failure leaves no partial file on disk');
  } catch (e) { fail('AC3 (unit): a mid-capture failure leaves no partial file on disk', e); }
  finally { fs.rmSync(path.join(__dirname, '..', 'artefacts', 'rpca-s3-test-fixture-ac3'), { recursive: true, force: true }); }
})();
```

- [ ] **Step 2: Run test — expect it to pass immediately** (Task 1's own implementation already includes the failure-cleanup branch; this task proves it)

```bash
node tests/check-rpca-s3-video-capture-wired-for-real.js
```

Expected output: if it fails, Task 1's own cleanup logic has a real bug — fix it in `scripts/playback-capture.js` directly before proceeding. If it passes immediately, that confirms Task 1's own implementation already handles this case correctly.

- [ ] **Step 3: Commit**

```bash
git add tests/check-rpca-s3-video-capture-wired-for-real.js
git commit -m "rpca-s3: prove the failure-cleanup path leaves no partial file behind (AC3)"
```

---

## Final step: full regression suite

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, 0 failed (baseline was 764 files / 0 failed at `/branch-setup`; this story adds 1 new test file).
