'use strict';
// playback.js -- fpd-s3: read-only viewer route for a DoD-validated
// feature's own playback package (walkthrough doc + screenshots from
// fpd-s1, video + captions/transcript from fpd-s2). Lists features with a
// package, and renders one feature's own scope/benefit/per-story-AC
// traceability structure. No new persisted data (Architecture Constraints).

const fs = require('fs');
const path = require('path');

// AC1, AC5: "has a package" = artefacts/[slug]/playback/walkthrough.md
// exists on disk -- the one file every package is guaranteed to have, per
// fpd-s1's own AC1 (decisions.md / dor-contract assumption).
function listPlaybackFeatures(repoRoot, state, existsSyncFn) {
  const exists = existsSyncFn || fs.existsSync;
  return (state.features || [])
    .filter((f) => exists(path.join(repoRoot, 'artefacts', f.slug, 'playback', 'walkthrough.md')))
    .map((f) => ({ slug: f.slug, name: f.name || f.slug }));
}

// AC2: extracts one ## heading's own content verbatim, case-insensitive
// (real discovery.md files use "## Problem statement"; templates/discovery.md
// uses "## Problem Statement" -- confirmed case drift by direct comparison).
function extractMarkdownSection(markdown, headingText) {
  const lines = markdown.split('\n');
  const headingRe = new RegExp(`^##\\s+${headingText}\\s*$`, 'i');
  const startIdx = lines.findIndex((l) => headingRe.test(l.trim()));
  if (startIdx === -1) return '';
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i].trim())) { endIdx = i; break; }
  }
  return lines.slice(startIdx + 1, endIdx).join('\n').trim();
}

module.exports = { listPlaybackFeatures, extractMarkdownSection };
