# Add a Playwright-recorded video walkthrough with machine-generated captions and transcript — Implementation Plan

> **For agent execution:** Single session — use /tdd task by task (no subagents dispatched this run).

**Goal:** Make every test in fpd-s2-test-plan.md pass. Extend `scripts/playback-capture.js` with video recording (Playwright `recordVideo`) and a D37 adapter for caption/transcript generation, wired separately from the handler task per CLAUDE.md's own D37 rule item 3.
**Branch:** `feature/fpd-s2`
**Worktree:** `.worktrees/fpd-s2`
**Test command:** `node scripts/run-all-tests.js` (unit/integration); `npx playwright test tests/e2e/fpd-s2-video-capture.spec.js` (E2E, RISK-ACCEPT for execution per test plan)

---

## File map

```
Create:
  src/web-ui/adapters/caption-transcript.js                — D37 adapter: generateCaptionsAndTranscript/set/get, real impl derives captions+transcript from the interaction-sequence text (no external STT provider -- see decisions.md)
  tests/check-fpd-s2-video-walkthrough-and-accessibility.js — unit + integration tests (AC1-AC6)
  tests/e2e/fpd-s2-video-capture.spec.js                    — real-recording E2E (RISK-ACCEPT execution)

Modify:
  scripts/playback-capture.js   — add captureVideoRecording, generateCaptionsForVideo, isPackageComplete, extend markPackageReviewed for video assets
  src/web-ui/server.js          — wire realGenerateCaptionsAndTranscript, guarded by NODE_ENV !== 'test' (separate task from the adapter itself, per D37 rule item 3)
```

---

## Task 1: D37 adapter module — stub throws when unwired (AC6, unwired case)

**Files:**
- Create: `src/web-ui/adapters/caption-transcript.js`
- Test: `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`

- [ ] **Step 1: Write the failing test** (must run FIRST, before any `setGenerateCaptionsAndTranscript` call in the file, so the module's own unwired default is still active — same ordering requirement as `jae-s4`'s own AC6 test)

```js
// AC6 (unit): unwired adapter throws the exact D37 stub error -- run FIRST
(function () {
  const { generateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  try {
    generateCaptionsAndTranscript('artefacts/f1/playback/video/clip.webm', 'step text');
    fail('AC6 (unit): unwired adapter throws the exact D37 stub error', new Error('expected it to throw'));
  } catch (e) {
    assert.strictEqual(e.message, 'Adapter not wired: generateCaptionsAndTranscript. Call setGenerateCaptionsAndTranscript() with a real implementation before use.');
    pass('AC6 (unit): unwired adapter throws the exact D37 stub error');
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `Error: Cannot find module '../src/web-ui/adapters/caption-transcript'`

- [ ] **Step 3: Write minimal implementation**

```js
'use strict';
// caption-transcript.js -- fpd-s2: D37 injectable adapter for machine-generated
// captions + a standalone transcript, generated for every video (including
// silent recordings -- AC4). Mirrors field-suggestion-ai.js's own
// throw-on-unwired stub default, set/get pair, separate "real" implementation
// wired in server.js as its own D37 task (CLAUDE.md's Injectable adapter rule).

let _generateCaptionsAndTranscript = function () {
  throw new Error('Adapter not wired: generateCaptionsAndTranscript. Call setGenerateCaptionsAndTranscript() with a real implementation before use.');
};

function generateCaptionsAndTranscript(videoPath, interactionSequenceText) {
  return getGenerateCaptionsAndTranscript()(videoPath, interactionSequenceText);
}

function setGenerateCaptionsAndTranscript(impl) {
  _generateCaptionsAndTranscript = impl;
}

function getGenerateCaptionsAndTranscript() {
  return _generateCaptionsAndTranscript;
}

module.exports = { generateCaptionsAndTranscript, setGenerateCaptionsAndTranscript, getGenerateCaptionsAndTranscript };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `[PASS] AC6 (unit): unwired adapter throws the exact D37 stub error`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/adapters/caption-transcript.js tests/check-fpd-s2-video-walkthrough-and-accessibility.js
git commit -m "feat(fpd-s2): add caption/transcript D37 adapter, unwired stub throws"
```

---

## Task 2: Real implementation — interaction-sequence-derived captions/transcript (AC6, behavioural wiring)

**Files:**
- Modify: `src/web-ui/adapters/caption-transcript.js`
- Test: `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`

**Architecture note (logged in decisions.md):** no external speech-to-text provider is confirmed available in this delivery environment (same D2-platform caution that dropped `ffmpeg` for `fpd-s2`'s own video format). The real implementation derives captions/transcript directly from the same interaction-sequence text `fpd-s1` already produces per AC (its own DoD-row evidence), timed sequentially into WebVTT — deterministic, no external dependency, and a correct literal reading of AC4's own wording ("sourced from the scripted interaction sequence ... not from spoken audio").

- [ ] **Step 1: Write the failing test**

```js
// AC6 (integration): behavioural wiring -- two different fixture inputs produce two different, individually-traceable outputs
(function () {
  const { setGenerateCaptionsAndTranscript, realGenerateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  setGenerateCaptionsAndTranscript(realGenerateCaptionsAndTranscript);
  const { generateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');
  try {
    const a = generateCaptionsAndTranscript('artefacts/f1/playback/video/clip-a.webm', 'Step 1: open the dashboard.\nStep 2: click Export.');
    const b = generateCaptionsAndTranscript('artefacts/f1/playback/video/clip-b.webm', 'Step 1: sign in.\nStep 2: view the report.');
    assert.notStrictEqual(a.transcript, b.transcript, 'expected two different inputs to produce two different transcripts');
    assert.ok(a.transcript.includes('click Export'), 'expected transcript a traceable to its own input');
    assert.ok(b.transcript.includes('view the report'), 'expected transcript b traceable to its own input');
    assert.ok(a.captions.startsWith('WEBVTT'), 'expected valid WebVTT captions');
    pass('AC6 (integration): behavioural wiring -- two different inputs produce two different, traceable outputs');
  } catch (e) { fail('AC6 (integration): behavioural wiring', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `TypeError: realGenerateCaptionsAndTranscript is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function formatVttTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  return `${h}:${m}:${s}.000`;
}

const SECONDS_PER_STEP = 4;

/**
 * Real implementation -- derives captions + a standalone transcript directly
 * from the scripted interaction-sequence text (the same per-AC evidence text
 * fpd-s1's own capture already scripts from), not from audio transcription.
 * A silent recording still produces a real, traceable transcript (AC4) since
 * nothing here depends on an audio track existing.
 * @param {string} videoPath
 * @param {string} [interactionSequenceText]
 * @returns {{captions: string, transcript: string}}
 */
function realGenerateCaptionsAndTranscript(videoPath, interactionSequenceText) {
  const steps = (interactionSequenceText || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (steps.length === 0) {
    return { captions: 'WEBVTT\n', transcript: `No narration or interaction-sequence text available for ${videoPath}.` };
  }
  const vttLines = ['WEBVTT', ''];
  steps.forEach((step, i) => {
    vttLines.push(`${formatVttTime(i * SECONDS_PER_STEP)} --> ${formatVttTime((i + 1) * SECONDS_PER_STEP)}`, step, '');
  });
  return { captions: vttLines.join('\n'), transcript: steps.join('\n\n') };
}

module.exports = { generateCaptionsAndTranscript, setGenerateCaptionsAndTranscript, getGenerateCaptionsAndTranscript, realGenerateCaptionsAndTranscript };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `[PASS] AC6 (integration): behavioural wiring -- two different inputs produce two different, traceable outputs`

- [ ] **Step 5: Commit**

```bash
git add src/web-ui/adapters/caption-transcript.js tests/check-fpd-s2-video-walkthrough-and-accessibility.js
git commit -m "feat(fpd-s2): derive real captions/transcript from interaction-sequence text"
```

---

## Task 3: Wire the real implementation in server.js (separate task, D37 rule item 3)

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1: Add the wiring** (mirrors `field-suggestion-ai.js`'s own exact wiring pattern)

```js
// Near the other adapter requires, e.g. after the field-suggestion-ai require:
const { setGenerateCaptionsAndTranscript, realGenerateCaptionsAndTranscript } = require('./adapters/caption-transcript'); // fpd-s2

// Near the other `if (process.env.NODE_ENV !== 'test')` wiring blocks:
// caption-transcript adapter. Never wired in NODE_ENV=test (tests call
// setGenerateCaptionsAndTranscript() themselves with a mock), matching
// every other D37 adapter in this file.
if (process.env.NODE_ENV !== 'test') {
  setGenerateCaptionsAndTranscript(realGenerateCaptionsAndTranscript);
}
```

- [ ] **Step 2: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (server.js is required by many existing tests; wiring must not break them)

- [ ] **Step 3: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat(fpd-s2): wire caption-transcript adapter in server.js outside NODE_ENV=test"
```

---

## Task 4: Video capture — context options, output path (AC1, script-logic portion)

**Files:**
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`

- [ ] **Step 1: Write the failing test**

```js
// AC1 (unit): recording script's own logic -- correct context options, correct output path
(async function () {
  const { captureVideoRecording } = require('../scripts/playback-capture');
  const calls = [];
  const fakeBrowser = {
    newContext: async (opts) => {
      calls.push(opts);
      return {
        newPage: async () => ({ video: () => ({ path: async () => `${opts.recordVideo.dir}clip-0.webm` }) }),
        close: async () => {},
      };
    },
  };
  try {
    const results = await captureVideoRecording({ browser: fakeBrowser, featureSlug: 'f1', clips: [{ name: 'walkthrough' }] });
    assert.strictEqual(calls.length, 1, 'expected newContext called once');
    assert.strictEqual(calls[0].recordVideo.dir, 'artefacts/f1/playback/video/');
    assert.ok(calls[0].recordVideo.size && calls[0].recordVideo.size.width, 'expected a recordVideo size option');
    assert.strictEqual(results[0].path, 'artefacts/f1/playback/video/clip-0.webm');
    pass("AC1 (unit): recording script's own logic -- correct context options, correct output path");
  } catch (e) { fail("AC1 (unit): recording script's own logic", e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `TypeError: captureVideoRecording is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
async function captureVideoRecording({ browser, featureSlug, clips }) {
  const dir = `artefacts/${featureSlug}/playback/video/`;
  const results = [];
  for (const clip of clips) {
    const context = await browser.newContext({ recordVideo: { dir, size: { width: 1280, height: 720 } } });
    const page = await context.newPage();
    if (clip.run) await clip.run(page);
    await context.close();
    const video = page.video ? page.video() : null;
    const path = video ? await video.path() : null;
    results.push({ name: clip.name, path });
  }
  return results;
}
```

Add to the existing `module.exports` block in `scripts/playback-capture.js`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `[PASS] AC1 (unit): recording script's own logic -- correct context options, correct output path`

- [ ] **Step 5: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s2-video-walkthrough-and-accessibility.js
git commit -m "feat(fpd-s2): add Playwright recordVideo capture to playback-capture.js"
```

---

## Task 5: Single-file vs multi-file shapes, same mechanism (AC2)

**Files:**
- Test: `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`

- [ ] **Step 1: Write the failing test**

```js
// AC2 (unit): single-file and multi-file shapes both work via the same mechanism
(async function () {
  const { captureVideoRecording } = require('../scripts/playback-capture');
  function makeFakeBrowser() {
    const calls = [];
    return {
      calls,
      newContext: async (opts) => {
        calls.push(opts);
        return { newPage: async () => ({ video: () => ({ path: async () => `${opts.recordVideo.dir}c${calls.length}.webm` }) }), close: async () => {} };
      },
    };
  }
  try {
    const single = makeFakeBrowser();
    const singleResults = await captureVideoRecording({ browser: single, featureSlug: 'f1', clips: [{ name: 'walkthrough' }] });
    assert.strictEqual(singleResults.length, 1, 'expected exactly 1 output file for the single-file shape');

    const multi = makeFakeBrowser();
    const multiResults = await captureVideoRecording({ browser: multi, featureSlug: 'f1', clips: [{ name: 'ac1' }, { name: 'ac2' }, { name: 'ac3' }] });
    assert.strictEqual(multiResults.length, 3, 'expected exactly 3 output files for the multi-file shape');
    assert.strictEqual(multi.calls.length, 3, 'expected one context/recording per sequence, no branching logic difference beyond count');
    pass('AC2 (unit): single-file and multi-file shapes both work via the same mechanism');
  } catch (e) { fail('AC2 (unit): single-file and multi-file shapes', e); }
})();
```

- [ ] **Step 2: Run test — expect pass** (Task 4's implementation already handles any `clips.length`; if this fails, the bug is in that loop, not a missing branch)

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `[PASS] AC2 (unit): single-file and multi-file shapes both work via the same mechanism`

- [ ] **Step 3: Commit**

```bash
git add tests/check-fpd-s2-video-walkthrough-and-accessibility.js
git commit -m "test(fpd-s2): verify single-file and multi-file video shapes use the same mechanism"
```

---

## Task 6: Captions/transcript generation step — files exist, reviewed:false (AC3)

**Files:**
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`

- [ ] **Step 1: Write the failing test**

```js
// AC3 (unit): captions and transcript exist alongside every video, marked human-reviewable
(async function () {
  const { generateCaptionsForVideo, setGenerateCaptionsAndTranscript } = require('../scripts/playback-capture');
  const written = {};
  const writeFile = (p, c) => { written[p] = c; };
  setGenerateCaptionsAndTranscript(() => ({ captions: 'WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nStep one.\n', transcript: 'Step one.' }));
  try {
    const result = await generateCaptionsForVideo('artefacts/f1/playback/video/clip-0.webm', 'Step one.', writeFile);
    assert.strictEqual(result.captionPath, 'artefacts/f1/playback/video/clip-0.vtt');
    assert.strictEqual(result.transcriptPath, 'artefacts/f1/playback/video/clip-0.transcript.txt');
    assert.strictEqual(result.reviewed, false, 'expected newly-generated captions/transcript to be unreviewed');
    assert.ok(written[result.captionPath].startsWith('WEBVTT'), 'expected caption file written');
    assert.strictEqual(written[result.transcriptPath], 'Step one.', 'expected transcript file written');
    pass('AC3 (unit): captions and transcript exist alongside every video, marked human-reviewable');
  } catch (e) { fail('AC3 (unit): captions and transcript exist alongside every video', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `TypeError: generateCaptionsForVideo is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
const { generateCaptionsAndTranscript, setGenerateCaptionsAndTranscript, getGenerateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');

function captionTranscriptPaths(videoPath) {
  const base = videoPath.replace(/\.webm$/, '');
  return { captionPath: `${base}.vtt`, transcriptPath: `${base}.transcript.txt` };
}

async function generateCaptionsForVideo(videoPath, interactionSequenceText, writeFileFn) {
  const write = writeFileFn || ((p, c) => fs.writeFileSync(p, c, 'utf8'));
  const { captionPath, transcriptPath } = captionTranscriptPaths(videoPath);
  const result = await generateCaptionsAndTranscript(videoPath, interactionSequenceText);
  write(captionPath, result.captions);
  write(transcriptPath, result.transcript);
  return { captionPath, transcriptPath, reviewed: false };
}
```

Add `generateCaptionsForVideo, setGenerateCaptionsAndTranscript` to `module.exports` (re-exported so tests and the skill can wire the adapter through `playback-capture.js`'s own surface, matching how `fpd-s1`'s tests already import everything from this one module).

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `[PASS] AC3 (unit): captions and transcript exist alongside every video, marked human-reviewable`

- [ ] **Step 5: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s2-video-walkthrough-and-accessibility.js
git commit -m "feat(fpd-s2): generate captions/transcript per video, marked unreviewed until confirmed"
```

---

## Task 7: Silent recording still produces a transcript (AC4)

**Files:**
- Test: `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`

- [ ] **Step 1: Write the failing test**

```js
// AC4 (unit): silent recording still produces a transcript, sourced from the interaction sequence
(async function () {
  const { generateCaptionsForVideo, setGenerateCaptionsAndTranscript, realGenerateCaptionsAndTranscript } = require('../scripts/playback-capture');
  setGenerateCaptionsAndTranscript(realGenerateCaptionsAndTranscript);
  const written = {};
  const writeFile = (p, c) => { written[p] = c; };
  const silentInteractionSequence = 'Step 1: open the Canvas view (no narration).\nStep 2: drag a node into place (no narration).';
  try {
    const result = await generateCaptionsForVideo('artefacts/f1/playback/video/silent-clip.webm', silentInteractionSequence, writeFile);
    const transcript = written[result.transcriptPath];
    assert.ok(transcript && transcript.length > 0, 'expected a non-empty transcript even with no narration audio');
    assert.ok(transcript.includes('drag a node into place'), 'expected transcript sourced from the interaction sequence, not left empty');
    pass('AC4 (unit): silent recording still produces a transcript, sourced from the interaction sequence');
  } catch (e) { fail('AC4 (unit): silent recording still produces a transcript', e); }
})();
```

- [ ] **Step 2: Run test — expect pass** (Task 2's `realGenerateCaptionsAndTranscript` and Task 6's `generateCaptionsForVideo` already implement this; if it fails, the bug is in one of those, not a missing silent-case branch)

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `[PASS] AC4 (unit): silent recording still produces a transcript, sourced from the interaction sequence`

- [ ] **Step 3: Commit**

```bash
git add tests/check-fpd-s2-video-walkthrough-and-accessibility.js
git commit -m "test(fpd-s2): verify a silent recording still produces a real transcript"
```

---

## Task 8: Package incomplete while captions/transcript unreviewed (AC5)

**Files:**
- Modify: `scripts/playback-capture.js`
- Test: `tests/check-fpd-s2-video-walkthrough-and-accessibility.js`

- [ ] **Step 1: Write the failing test**

```js
// AC5 (unit): package not complete while captions/transcript unreviewed for any video
(function () {
  const { isPackageComplete, markPackageReviewed } = require('../scripts/playback-capture');
  const store = {};
  const readFile = (p) => store[p];
  const writeFile = (p, c) => { store[p] = c; };
  const statusPath = 'artefacts/f1/playback/package-status.json';
  writeFile(statusPath, JSON.stringify({ status: 'complete', videos: [{ name: 'walkthrough', reviewed: false }] }));
  try {
    assert.strictEqual(isPackageComplete(JSON.parse(readFile(statusPath))), false, 'expected incomplete while a video is unreviewed, even if status says complete');
    markPackageReviewed(statusPath, readFile, writeFile);
    assert.strictEqual(isPackageComplete(JSON.parse(readFile(statusPath))), true, 'expected complete once markPackageReviewed confirms every video');
    pass('AC5 (unit): package not complete while captions/transcript unreviewed for any video');
  } catch (e) { fail('AC5 (unit): package not complete while captions/transcript unreviewed', e); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `TypeError: isPackageComplete is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
function isPackageComplete(statusObj) {
  if (statusObj.status !== 'complete') return false;
  if (Array.isArray(statusObj.videos) && statusObj.videos.some(v => !v.reviewed)) return false;
  return true;
}

// Extend the existing markPackageReviewed (from fpd-s1) to also confirm every video entry:
function markPackageReviewed(statusPath, readFileFn, writeFileFn) {
  const read = readFileFn || ((p) => fs.readFileSync(p, 'utf8'));
  const write = writeFileFn || ((p, c) => fs.writeFileSync(p, c, 'utf8'));
  const current = JSON.parse(read(statusPath));
  current.status = 'complete';
  current.reviewedAt = new Date().toISOString();
  if (Array.isArray(current.videos)) {
    current.videos = current.videos.map(v => Object.assign({}, v, { reviewed: true }));
  }
  write(statusPath, JSON.stringify(current, null, 2));
}
```

Replace the existing (fpd-s1) `markPackageReviewed` definition with this extended version; add `isPackageComplete` to `module.exports`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-fpd-s2-video-walkthrough-and-accessibility.js
```

Expected output: `[PASS] AC5 (unit): package not complete while captions/transcript unreviewed for any video`

- [ ] **Step 5: Run full suite — no regressions** (confirms the `markPackageReviewed` extension didn't break `fpd-s1`'s own AC4 test)

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-fpd-s2-video-walkthrough-and-accessibility.js
git commit -m "feat(fpd-s2): gate package completion on every video's own captions/transcript review"
```

---

## Task 9: E2E spec — real recording against a running app (AC1, RISK-ACCEPT for execution)

**Files:**
- Create: `tests/e2e/fpd-s2-video-capture.spec.js`

- [ ] **Step 1: Write the spec** (not executable in this sandbox — no reachable Postgres, `decisions.md` D5; confirmed syntactically valid only, per test plan's own RISK-ACCEPT)

```js
'use strict';
// fpd-s2-video-capture.spec.js -- E2E for Feature Playback video capture (fpd-s2)
// Real end-to-end: a real DoD-validated feature, real Playwright recordVideo,
// real .webm file on disk. RISK-ACCEPTed for execution in this sandbox --
// no reachable Postgres (decisions.md D5), same gap as fpd-s1 this cycle.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { withAuth } = require('./fixtures/auth');

withAuth('real recording produces a .webm file on disk', async ({ page, context }) => {
  const { captureVideoRecording } = require('../../scripts/playback-capture');
  const results = await captureVideoRecording({
    browser: context.browser(),
    featureSlug: 'fpd-s2-e2e-check',
    clips: [{ name: 'walkthrough', run: async (p) => { await p.goto('/'); } }],
  });
  expect(fs.existsSync(results[0].path)).toBe(true);
});
```

- [ ] **Step 2: Confirm syntactic validity (cannot execute — RISK-ACCEPT)**

```bash
node --check tests/e2e/fpd-s2-video-capture.spec.js
```

Expected output: no output, exit 0 (syntax valid)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/fpd-s2-video-capture.spec.js
git commit -m "test(fpd-s2): add E2E video-capture spec (RISK-ACCEPT for execution, decisions.md D5)"
```
