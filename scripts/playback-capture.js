'use strict';
// scripts/playback-capture.js
// Reads a DoD-validated feature's own DoD artefact(s) and benefit-metric.md,
// generates artefacts/[feature-slug]/playback/walkthrough.md, and drives
// Playwright screenshot capture at each AC's stable UI state.
// Reuses Playwright as a plain function argument (ADR-018, ADR-026) -- not a
// D37 adapter: `page` is ordinary dependency injection, not a hidden
// module-level default.

const fs = require('fs');
const { generateCaptionsAndTranscript } = require('../src/web-ui/adapters/caption-transcript');

function checkDodGate(state, featureSlug) {
  const feature = (state.features || []).find(f => f.slug === featureSlug);
  if (!feature) {
    throw new Error(`Feature not found: ${featureSlug}`);
  }
  if (feature.dodStatus !== 'complete') {
    throw new Error(
      `Feature playback refused: dodStatus for "${featureSlug}" is "${feature.dodStatus}", not "complete". Run /definition-of-done first.`
    );
  }
  return { ok: true, feature };
}

function parseMarkdownTable(markdown, headingText) {
  const lines = markdown.split('\n');
  const headingIdx = lines.findIndex(l => l.trim() === `## ${headingText}`);
  if (headingIdx === -1) return [];
  let i = headingIdx + 1;
  while (i < lines.length && !lines[i].trim().startsWith('|')) i++;
  if (i >= lines.length) return [];
  const headerCells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
  i += 2; // skip header + separator row
  const rows = [];
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const cells = lines[i].split('|').map(c => c.trim()).filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
    const row = {};
    headerCells.forEach((h, idx) => { row[h] = cells[idx] || ''; });
    rows.push(row);
    i++;
  }
  return rows;
}

function parseDodAcCoverage(dodMarkdown) {
  return parseMarkdownTable(dodMarkdown, 'AC Coverage').map(row => {
    const acCell = row['AC'] || '';
    const match = acCell.match(/^(AC\d+)\s*—\s*(.*)$/);
    return {
      acId: match ? match[1] : acCell,
      description: match ? match[2] : acCell,
      satisfied: row['Satisfied?'] || '',
      evidence: row['Evidence'] || '',
      verificationMethod: row['Verification method'] || '',
      deviation: row['Deviation'] || '',
    };
  });
}

function parseDodMetricSignal(dodMarkdown) {
  return parseMarkdownTable(dodMarkdown, 'Metric Signal').map(row => ({
    metric: row['Metric'] || '',
    signal: row['Signal'] || '',
    evidence: row['Evidence'] || '',
    dateMeasured: row['Date measured'] || '',
  }));
}

function parseBenefitMetricTargets(benefitMetricContent) {
  const targets = {};
  const blocks = (benefitMetricContent || '').split(/^### /m).slice(1);
  for (const block of blocks) {
    const nameLine = block.split('\n')[0].trim();
    const name = nameLine.replace(/^Metric \d+:\s*/, '');
    const targetMatch = block.match(/\|\s*\*\*Target\*\*\s*\|\s*(.+?)\s*\|/);
    if (targetMatch) targets[name] = targetMatch[1].trim();
  }
  return targets;
}

function generateWalkthroughMarkdown({ featureSlug, storyDods, benefitMetricContent }) {
  const lines = [`# Playback Walkthrough: ${featureSlug}`, ''];
  for (const story of storyDods) {
    const acRows = parseDodAcCoverage(story.content);
    for (const ac of acRows) {
      lines.push(`## ${ac.acId} — ${ac.description}`, '');
      lines.push(ac.evidence, '');
    }
  }
  lines.push('## Metric Signal', '');
  const targets = parseBenefitMetricTargets(benefitMetricContent);
  for (const story of storyDods) {
    const metricRows = parseDodMetricSignal(story.content);
    for (const m of metricRows) {
      const metricName = m.metric.replace(/^M\d+\s*—\s*/, '');
      const target = targets[metricName] ? ` | Target: ${targets[metricName]}` : '';
      lines.push(`- **${m.metric}**: ${m.signal} — ${m.evidence} (measured ${m.dateMeasured})${target}`);
    }
  }
  return lines.join('\n');
}

async function captureAcScreenshots({ page, featureSlug, acList }) {
  const shots = [];
  for (const ac of acList) {
    const relPath = `artefacts/${featureSlug}/playback/screenshots/${ac.acId}.png`;
    await page.screenshot({ path: relPath, selector: ac.selector });
    shots.push({ acId: ac.acId, path: relPath });
  }
  return shots;
}

function embedScreenshotPaths(markdown, shots) {
  const path = require('path');
  let doc = markdown;
  for (const shot of shots) {
    const fileName = path.basename(shot.path);
    const sectionRe = new RegExp(`(## ${shot.acId}[^\\n]*\\n)`);
    doc = doc.replace(sectionRe, `$1\n![${shot.acId}](screenshots/${fileName})\n`);
  }
  return doc;
}

function getPackageStatus(statusPath, readFileFn) {
  const read = readFileFn || ((p) => fs.readFileSync(p, 'utf8'));
  return JSON.parse(read(statusPath));
}

function markPackageReviewed(statusPath, readFileFn, writeFileFn) {
  const read = readFileFn || ((p) => fs.readFileSync(p, 'utf8'));
  const write = writeFileFn || ((p, c) => fs.writeFileSync(p, c, 'utf8'));
  const current = JSON.parse(read(statusPath));
  current.status = 'complete';
  current.reviewedAt = new Date().toISOString();
  write(statusPath, JSON.stringify(current, null, 2));
}

// fpd-s2: Playwright recordVideo capture. One browser context per clip --
// the engineer's own choice of single combined walkthrough vs. several
// per-AC/per-flow clips (AC2) is just the length of `clips`, no branching
// logic difference.
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

// fpd-s2: generates captions + a standalone transcript for one video via the
// D37 adapter, writes both to disk, and marks them unreviewed until the
// engineer explicitly confirms (AC3) -- automated generation never sets
// reviewed: true itself.
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

module.exports = {
  checkDodGate, parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets,
  generateWalkthroughMarkdown, captureAcScreenshots, embedScreenshotPaths,
  getPackageStatus, markPackageReviewed,
  captureVideoRecording,
  generateCaptionsForVideo,
};
