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
