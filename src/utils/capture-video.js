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
    let resultPath;
    try {
      if (clip.run) await clip.run(page);
      await context.close();
      const video = page.video ? page.video() : null;
      resultPath = video ? await video.path() : null;
    } catch (err) {
      // Mirrors scripts/playback-capture.js's own captureVideoForClip cleanup
      // half (rpca-video-hotfix1): close and the subsequent video()/path()
      // lookup are each wrapped in their own try/catch so a SECONDARY failure
      // during cleanup can never replace or mask the ORIGINAL error -- and
      // cleanup is always best-effort, never required to succeed.
      try { await context.close(); } catch (_) { /* already closed or closing failed -- still attempt cleanup below */ }
      try {
        const video = page.video ? page.video() : null;
        const partialPath = video ? await video.path() : null;
        if (partialPath && fs.existsSync(partialPath)) fs.unlinkSync(partialPath);
      } catch (_) { /* best-effort cleanup -- never mask the original error */ }
      throw err;
    }
    results.push({ name: clip.name, path: resultPath });
  }
  return results;
}

module.exports = { captureVideoRecording };
