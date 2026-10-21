'use strict';
// capture-screenshots.js -- extracted from scripts/playback-capture.js (ppc-s1
// Task 0) because src/web-ui/routes/playback-evidence.js (a production route,
// added in a later task) also needs it, and scripts/ is never copied into the
// deployed Docker image (Dockerfile's own explicit COPY allowlist -- src/,
// skills/, product/, artefacts/, .github/ only). Mirrors the identical,
// already-proven fix for dod-parsing.js's parseDodAcCoverage (ic-hotfix1
// incident). Behaviour is byte-for-byte unchanged from the original.

async function captureAcScreenshots({ page, featureSlug, storySlug, acList }) {
  const shots = [];
  for (const ac of acList) {
    const relPath = `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${ac.acId}.png`;
    await page.screenshot({ path: relPath, selector: ac.selector });
    shots.push({ acId: ac.acId, path: relPath });
  }
  return shots;
}

module.exports = { captureAcScreenshots };
