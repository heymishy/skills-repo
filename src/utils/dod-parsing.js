'use strict';
// dod-parsing.js -- shared DoD AC Coverage / benefit-metric target parsing.
// Extracted from scripts/playback-capture.js (fpd-s1) because
// src/web-ui/routes/playback.js (fpd-s3) also needs it, and scripts/ is
// never copied into the production Docker image (Dockerfile's own explicit
// COPY allowlist -- src/, skills/, product/, artefacts/, .github/ only).
// A production route requiring ../../../scripts/playback-capture crashed
// staging on boot with MODULE_NOT_FOUND -- the same class of gap already
// documented for schema-migration scripts (ic-hotfix1). src/ is always
// deployed, so logic any route needs at runtime must live under src/, not
// scripts/ -- scripts/ is operator/CI tooling only.

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

module.exports = { parseMarkdownTable, parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets };
