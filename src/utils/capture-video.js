'use strict';
// capture-video.js -- extracted from scripts/playback-capture.js's own
// captureVideoRecording (ppc-s5 Task 1), because src/web-ui/routes/
// playback-evidence.js (a production route) also needs it, and scripts/ is
// never copied into the deployed Docker image (Dockerfile's own explicit
// COPY allowlist -- src/, skills/, product/, artefacts/, .github/ only).
// Mirrors the identical, already-proven fix for capture-screenshots.js
// (ppc-s1 Task 0) -- but NOT byte-for-byte unchanged, unlike that
// extraction. See AC5 and this file's own commit message for why.

const fs = require('fs');

async function captureVideoRecording({ browser, featureSlug, storySlug, clips }) {
  const dir = `artefacts/${featureSlug}/playback/${storySlug}/video/`;
  const results = [];
  for (const clip of clips) {
    const context = await browser.newContext({ recordVideo: { dir, size: { width: 1280, height: 720 } } });
    const page = await context.newPage();
    let runErr = null;
    try {
      if (clip.run) await clip.run(page);
    } catch (err) {
      runErr = err;
    } finally {
      await context.close();
    }
    const video = page.video ? page.video() : null;
    const resultPath = video ? await video.path() : null;
    if (runErr) {
      if (resultPath && fs.existsSync(resultPath)) fs.unlinkSync(resultPath);
      throw runErr;
    }
    results.push({ name: clip.name, path: resultPath });
  }
  return results;
}

module.exports = { captureVideoRecording };
