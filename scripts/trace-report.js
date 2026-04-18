#!/usr/bin/env node
// trace-report.js
// Generates a standalone audit trace report for a pipeline feature.
// Reads pipeline-state.json, pipeline-state-archive.json, artefact files,
// and workspace/traces/ JSONL to produce a Markdown report to stdout.
//
// Usage:
//   node scripts/trace-report.js --feature <slug>
//
// No external dependencies — Node.js built-ins only. Read-only.

'use strict';

const fs   = require('fs');
const path = require('path');

// Pipeline stages in order — used for stage-aware chain link display
const STAGE_ORDER = [
  'discovery',
  'benefit-metric',
  'definition',
  'review',
  'test-plan',
  'definition-of-ready',
  'subagent-execution',
  'verify-completion',
  'branch-complete',
  'definition-of-done'
];

// Chain link types and which stage they become expected at
const CHAIN_LINKS = [
  { key: 'artefact',         label: 'story',         requiredAt: 'definition' },
  { key: 'reviewArtefact',   label: 'review',        requiredAt: 'review' },
  { key: 'testPlanArtefact', label: 'test-plan',     requiredAt: 'test-plan' },
  { key: 'dorArtefact',      label: 'DoR',           requiredAt: 'definition-of-ready' },
  { key: 'dodArtefact',      label: 'DoD',           requiredAt: 'definition-of-done' }
];

function stageIndex(stage) {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx === -1 ? STAGE_ORDER.length : idx;
}

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadTraces(rootDir) {
  const tracesDir = path.join(rootDir, 'workspace', 'traces');
  if (!fs.existsSync(tracesDir)) return [];
  const entries = [];
  for (const file of fs.readdirSync(tracesDir)) {
    if (!file.endsWith('.jsonl')) continue;
    const lines = fs.readFileSync(path.join(tracesDir, file), 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch (_) { /* skip malformed lines */ }
    }
  }
  return entries;
}

function findGateEvidence(story, traces) {
  if (!story.commitSha && !story.prUrl) return null;
  const sha = story.commitSha;
  if (!sha) return null;
  const match = traces.find(t => t.status === 'completed' && t.commitSha === sha);
  return match || null;
}

function checkArtefact(rootDir, artefactPath) {
  if (!artefactPath) return 'not-set';
  return fs.existsSync(path.join(rootDir, artefactPath)) ? 'ok' : 'missing';
}

function generateReport(opts) {
  opts = opts || {};
  if (!opts.feature) {
    throw new Error('Usage: node scripts/trace-report.js --feature <slug>\n\nRequired flag: --feature <slug>');
  }

  const rootDir = opts.rootDir || path.join(__dirname, '..');
  const ghDir   = path.join(rootDir, '.github');
  const activeState  = loadJSON(path.join(ghDir, 'pipeline-state.json')) || { features: [] };
  const archiveState = loadJSON(path.join(ghDir, 'pipeline-state-archive.json'));

  // Merge active + archive
  let allFeatures = [...(activeState.features || [])];
  let archiveSlugs = new Set();
  if (archiveState && archiveState.features) {
    for (const af of archiveState.features) {
      archiveSlugs.add(af.slug);
      if (!allFeatures.find(f => f.slug === af.slug)) {
        allFeatures.push(af);
      }
    }
  }

  const feature = allFeatures.find(f => f.slug === opts.feature);
  if (!feature) {
    const available = allFeatures.map(f => f.slug);
    throw new Error(`Feature not found: "${opts.feature}"\n\nAvailable feature slugs:\n${available.map(s => `  - ${s}`).join('\n')}`);
  }

  const isArchived = archiveSlugs.has(feature.slug) && !(activeState.features || []).find(f => f.slug === feature.slug);
  const traces = loadTraces(rootDir);
  const stories = feature.stories || [];
  const featureStageIdx = stageIndex(feature.stage);

  // Build report
  const lines = [];
  lines.push(`# Audit Trace Report: ${feature.slug}${isArchived ? ' [archived]' : ''}`);
  lines.push('');
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| **Feature** | ${feature.name || feature.slug} |`);
  lines.push(`| **Slug** | ${feature.slug} |`);
  lines.push(`| **Stage** | ${feature.stage} |`);
  lines.push(`| **Health** | ${feature.health || '—'} |`);
  lines.push(`| **Stories** | ${stories.length} |`);
  if (isArchived) lines.push(`| **Source** | pipeline-state-archive.json |`);
  lines.push('');

  // Feature-level artefacts
  lines.push('## Feature-Level Artefacts');
  lines.push('');
  lines.push('| Artefact | Status | Path |');
  lines.push('|----------|--------|------|');
  const featureArtefacts = [
    { key: 'discoveryArtefact', label: 'discovery' },
    { key: 'benefitMetricArtefact', label: 'benefit-metric' }
  ];
  for (const fa of featureArtefacts) {
    const p = feature[fa.key];
    if (!p) {
      lines.push(`| ${fa.label} | — | not set |`);
    } else {
      const status = checkArtefact(rootDir, p);
      const emoji = status === 'ok' ? '✅' : '❌ MISSING';
      lines.push(`| ${fa.label} | ${emoji} | ${p} |`);
    }
  }
  lines.push('');

  // Story sections
  for (const story of stories) {
    lines.push(`## Story: ${story.slug} — ${story.name || story.slug}`);
    lines.push('');
    lines.push(`**Stage:** ${story.stage || '—'}`);
    lines.push('');
    const storyStageIdx = stageIndex(story.stage);

    lines.push('| Chain Link | Status | Path |');
    lines.push('|------------|--------|------|');

    for (const link of CHAIN_LINKS) {
      const requiredIdx = stageIndex(link.requiredAt);
      const artefactPath = story[link.key];

      if (storyStageIdx < requiredIdx) {
        // Story hasn't reached this stage yet
        lines.push(`| ${link.label} | — not yet reached | — |`);
      } else if (!artefactPath) {
        lines.push(`| ${link.label} | ❌ MISSING | not set |`);
      } else {
        const status = checkArtefact(rootDir, artefactPath);
        const emoji = status === 'ok' ? '✅' : '❌ MISSING';
        lines.push(`| ${link.label} | ${emoji} | ${artefactPath} |`);
      }
    }
    lines.push('');

    // Gate evidence
    if (story.prUrl) {
      const evidence = findGateEvidence(story, traces);
      lines.push('### Gate Evidence');
      lines.push('');
      if (evidence) {
        lines.push(`| Field | Value |`);
        lines.push(`|-------|-------|`);
        lines.push(`| **Verdict** | ${evidence.verdict} |`);
        lines.push(`| **Trace Hash** | ${evidence.traceHash} |`);
        lines.push(`| **PR** | ${story.prUrl} |`);
        if (evidence.checks && evidence.checks.length > 0) {
          const passCount = evidence.checks.filter(c => c.passed).length;
          lines.push(`| **Checks** | ${passCount}/${evidence.checks.length} passed |`);
          for (const check of evidence.checks) {
            lines.push(`| | ${check.passed ? '✅' : '❌'} ${check.name} |`);
          }
        }
        lines.push('');
      } else {
        lines.push('Gate evidence: not found — no matching trace entry in workspace/traces/');
        lines.push('');
      }
    }
  }

  // Footer
  lines.push('---');
  lines.push(`*Report generated at ${new Date().toISOString()}*`);
  lines.push('');

  return lines.join('\n');
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const featureIdx = args.indexOf('--feature');
  const feature = featureIdx !== -1 ? args[featureIdx + 1] : undefined;

  try {
    const report = generateReport({ feature });
    process.stdout.write(report);
  } catch (e) {
    process.stderr.write(e.message + '\n');
    process.exit(1);
  }
}

module.exports = { generateReport };
