#!/usr/bin/env node
// record-benefit-comparison.js
// Records a platform-vs-traditional benefit comparison artefact.
// No external dependencies — Node.js built-ins only.
// Security (MC-SEC-02): no credentials, no hardcoded org names.
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────────────

function parseNormsHours(normsPath, featureSlug) {
  if (!normsPath || !fs.existsSync(normsPath)) return null;
  try {
    const lines = fs.readFileSync(normsPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.includes(featureSlug)) {
        // Find the last column (E3 actuals): look for an hours value like 12.5h
        const match = line.match(/([\d.]+)\s*h\s*\|?\s*$/);
        if (match) return parseFloat(match[1]);
        // Try any column: find all hour values and take the last
        const allHours = line.match(/([\d.]+)\s*h/g);
        if (allHours && allHours.length > 0) {
          return parseFloat(allHours[allHours.length - 1]);
        }
      }
    }
  } catch (_) {
    // file read error
  }
  return null;
}

function deltaPercent(platform, traditional) {
  if (!traditional || traditional === 0) return null;
  return Math.round((platform - traditional) / traditional * 100);
}

function countCompleted(state, featureSlug) {
  const f = (state.features || []).find(f => f.slug === featureSlug);
  if (!f) return 0;
  return (f.stories || []).filter(s => s.dodStatus === 'complete').length;
}

function sumTestCount(state, featureSlug) {
  const f = (state.features || []).find(f => f.slug === featureSlug);
  if (!f) return 0;
  let total = 0;
  for (const s of (f.stories || [])) {
    if (s.testPlan) total += s.testPlan.totalTests || 0;
  }
  return total;
}

// ── recordComparison ─────────────────────────────────────────────

function recordComparison(inputs, state, opts) {
  opts = opts || {};

  const featureSlug      = inputs.featureSlug;
  const workspaceDir     = opts.workspaceDir || path.join(process.cwd(), 'workspace');
  const normsPath        = opts.normsPath != null
    ? opts.normsPath
    : path.join(workspaceDir, 'estimation-norms.md');

  const platformCycleDays   = inputs.platformCycleDays   != null ? inputs.platformCycleDays   : null;
  const traditionalCycleDays = inputs.traditionalCycleDays != null ? inputs.traditionalCycleDays : null;
  const platformStoryCount  = inputs.platformStoryCount  != null ? inputs.platformStoryCount  : countCompleted(state, featureSlug);
  const platformTestCount   = inputs.platformTestCount   != null ? inputs.platformTestCount   : sumTestCount(state, featureSlug);
  const tradOpHours         = inputs.traditionalOperatorHours != null ? inputs.traditionalOperatorHours : null;

  const platOpHours    = parseNormsHours(normsPath, featureSlug);
  const experimentRef  = inputs.experimentRef != null ? inputs.experimentRef : null;
  const reportDate     = new Date().toISOString().slice(0, 10);
  const delta          = platformCycleDays != null && traditionalCycleDays != null
    ? deltaPercent(platformCycleDays, traditionalCycleDays)
    : null;
  const deltaStr       = delta != null ? delta + '%' : 'n/a';
  const hoursStr       = platOpHours != null ? String(platOpHours) : 'null';

  // ── Build YAML front-matter ──────────────────────────────────
  const fm = [
    '---',
    'feature_slug: '                       + featureSlug,
    'report_date: '                        + reportDate,
    'platform_cycle_days: '               + (platformCycleDays  != null ? platformCycleDays  : 'null'),
    'traditional_cycle_days: '            + (traditionalCycleDays != null ? traditionalCycleDays : 'null'),
    'platform_operator_hours: '           + hoursStr,
    'traditional_operator_hours_estimate: ' + (tradOpHours != null ? tradOpHours : 'null'),
    'platform_story_count: '              + (platformStoryCount != null ? platformStoryCount : 'null'),
    'platform_test_count: '               + (platformTestCount  != null ? platformTestCount  : 'null'),
    'experiment_ref: '                    + (experimentRef != null ? experimentRef : 'null'),
    'delta_percent: '                     + (delta != null ? delta : 'null'),
    '---'
  ].join('\n');

  // ── Build body ───────────────────────────────────────────────
  const body = [
    '',
    '# Benefit Comparison: ' + featureSlug,
    '',
    '## Cycle Time Comparison',
    '',
    '| Metric | Platform | Traditional |',
    '|--------|----------|-------------|',
    '| Cycle days | ' + (platformCycleDays != null ? platformCycleDays : 'n/a') + ' | ' + (traditionalCycleDays != null ? traditionalCycleDays : 'n/a') + ' |',
    '| Delta | ' + deltaStr + ' | — |',
    '| Stories completed | ' + (platformStoryCount != null ? platformStoryCount : 'n/a') + ' | — |',
    '| Tests | ' + (platformTestCount != null ? platformTestCount : 'n/a') + ' | — |',
    '| Operator hours | ' + hoursStr + ' | ' + (tradOpHours != null ? tradOpHours : 'n/a') + ' |',
    ''
  ].join('\n');

  const content = fm + body;

  // ── Write to disk ────────────────────────────────────────────
  const expDir   = path.join(workspaceDir, 'experiments');
  if (!fs.existsSync(expDir)) fs.mkdirSync(expDir, { recursive: true });
  const outPath  = path.join(expDir, 'benefit-comparison-' + featureSlug + '.md');
  fs.writeFileSync(outPath, content, 'utf8');

  return outPath;
}

// ── generateSummary ──────────────────────────────────────────────

function generateSummary(experimentsDir) {
  if (!fs.existsSync(experimentsDir)) return '| Feature | Platform cycle (days) | Traditional estimate (days) | Delta % | Platform tests | Operator hours saved |\n|---------|----------------------|-----------------------------|---------|----------------|---------------------|\n';

  const files = fs.readdirSync(experimentsDir)
    .filter(f => f.startsWith('benefit-comparison-') && f.endsWith('.md'))
    .sort();

  const rows = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(experimentsDir, file), 'utf8');
    const parts   = content.split('---');
    if (parts.length < 2) continue;
    const fm      = parts[1];
    const data    = {};
    for (const line of fm.split('\n')) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      data[key] = val;
    }
    const slug         = data['feature_slug']                    || '';
    const platCycle    = data['platform_cycle_days']             || 'n/a';
    const tradCycle    = data['traditional_cycle_days']          || 'n/a';
    const delta        = data['delta_percent'] != null ? data['delta_percent'] + '%' : 'n/a';
    const tests        = data['platform_test_count']             || 'n/a';
    const platOpH      = data['platform_operator_hours']         || 'n/a';
    const tradOpH      = data['traditional_operator_hours_estimate'] || 'n/a';
    const hoursSaved   = (platOpH !== 'n/a' && tradOpH !== 'n/a' && platOpH !== 'null' && tradOpH !== 'null')
      ? String(parseFloat(tradOpH) - parseFloat(platOpH))
      : 'n/a';
    rows.push(`| ${slug} | ${platCycle} | ${tradCycle} | ${delta} | ${tests} | ${hoursSaved} |`);
  }

  const header = '| Feature | Platform cycle (days) | Traditional estimate (days) | Delta % | Platform tests | Operator hours saved |';
  const sep    = '|---------|----------------------|-----------------------------|---------|----------------|---------------------|';
  return [header, sep, ...rows].join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────

if (require.main === module) {
  const args    = process.argv.slice(2);
  const summIdx = args.indexOf('--summary');
  if (summIdx !== -1) {
    const expDir = args[summIdx + 1] || path.join(process.cwd(), 'workspace', 'experiments');
    console.log(generateSummary(expDir));
    process.exit(0);
  }
  console.error('Usage: node record-benefit-comparison.js --summary [experimentsDir]');
  process.exit(1);
}

module.exports = { recordComparison, generateSummary };
