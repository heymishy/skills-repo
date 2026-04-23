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
const crypto = require('crypto');

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

// ── collect logic (AC1–AC6) ──────────────────────────────────────────────────

// Blocked paths — these must never appear in the staging dir (security NFR)
const BLOCKED_FILES = ['pipeline-state.json', 'context.yml'];

/**
 * Resolve the active feature slug.
 * AC3: auto-resolves when exactly one non-archived feature exists.
 * AC4: throws with the required stderr message when no feature can be resolved.
 *
 * @param {string|undefined} explicitSlug  Value of --feature flag (may be undefined)
 * @param {string}           rootDir       Repo root
 * @returns {string}                       Resolved feature slug
 */
function resolveActiveFeature(explicitSlug, rootDir) {
  const stateFile = path.join(rootDir, '.github', 'pipeline-state.json');
  const state = loadJSON(stateFile) || { features: [] };
  const features = state.features || [];

  if (explicitSlug) {
    const found = features.find(f => f.slug === explicitSlug);
    if (!found) {
      const err = new Error(
        `[trace-report --collect] No feature resolved. Pass --feature=<slug> or ensure exactly one active feature in pipeline-state.json.`
      );
      err.isCollectError = true;
      throw err;
    }
    return found.slug;
  }

  // AC3: auto-resolve when exactly one non-archived feature exists
  const active = features.filter(f => f.stage !== 'archived');
  if (active.length === 1) return active[0].slug;

  const err = new Error(
    `[trace-report --collect] No feature resolved. Pass --feature=<slug> or ensure exactly one active feature in pipeline-state.json.`
  );
  err.isCollectError = true;
  throw err;
}

/**
 * Classify a collected artefact file by its pipeline stage type and derive a human-readable display name.
 * Classification is driven by directory structure conventions.
 *
 * @param {string} sourcePath  e.g. "artefacts/my-feature/stories/caa.1-collect-flag.md"
 * @returns {{ type: string, typeOrder: number, displayName: string }}
 */
function classifyArtefact(sourcePath) {
  const normalized = sourcePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  // parts[0]='artefacts', parts[1]=slug, parts[2]=subdir-or-toplevel-file, parts[3+]=filename
  const isTopLevel = parts.length === 3;
  const subdir = isTopLevel ? null : parts[2];
  const basename = path.basename(normalized, '.md');

  const SUBDIR_TYPES = {
    'epics':                { type: 'Epic',                   order: 3 },
    'stories':              { type: 'Story',                  order: 4 },
    'test-plans':           { type: 'Test Plan',              order: 5 },
    'review':               { type: 'Review',                 order: 6 },
    'verification-scripts': { type: 'Verification Script',    order: 7 },
    'dor':                  { type: 'Definition of Ready',    order: 8 },
    'plans':                { type: 'Implementation Plan',    order: 9 },
    'dod':                  { type: 'Definition of Done',     order: 10 },
    'reference':            { type: 'Reference',              order: 11 },
    'trace':                { type: 'Trace',                  order: 12 },
  };

  const TOPLEVEL_TYPES = {
    'discovery':      { type: 'Discovery',      order: 1 },
    'benefit-metric': { type: 'Benefit Metric', order: 2 },
    'decisions':      { type: 'Decisions',       order: 13 },
    'nfr-profile':    { type: 'NFR Profile',     order: 14 },
  };

  let type, order;
  if (isTopLevel) {
    const match = TOPLEVEL_TYPES[basename];
    type  = match ? match.type  : 'Other';
    order = match ? match.order : 99;
    return { type, typeOrder: order, displayName: type === 'Other' ? basename : type };
  }

  const subdirMatch = SUBDIR_TYPES[subdir];
  type  = subdirMatch ? subdirMatch.type  : 'Other';
  order = subdirMatch ? subdirMatch.order : 99;

  // Derive human-readable name by stripping well-known type suffixes, then humanizing
  let displayName = basename
    .replace(/-dor-contract$/, '')   // strip before -dor so -dor-contract → base name + " (Contract)" below
    .replace(/-test-plan$/, '')
    .replace(/-dor$/, '')
    .replace(/-dod$/, '')
    .replace(/-review-\d+$/, '')
    .replace(/-verification$/, '');

  // Mark contracts
  if (basename.endsWith('-dor-contract')) displayName += ' (Contract)';

  // Humanize: replace hyphens and underscores with spaces (preserve dots — used in story IDs like caa.1)
  displayName = displayName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();

  return { type, typeOrder: order, displayName };
}

/**
 * Collect governance input files (skills, instructions) with SHA-256 hashes.
 * These are the active governing documents — the rules the agent was required to follow.
 *
 * @param {string} rootDir
 * @returns {Array<{ sourcePath: string, sha256: string }>}
 */
function collectGovernanceInputs(rootDir) {
  const candidates = [
    path.join(rootDir, '.github', 'copilot-instructions.md'),
    path.join(rootDir, '.github', 'architecture-guardrails.md'),
  ];

  // All SKILL.md files under .github/skills/
  const skillsDir = path.join(rootDir, '.github', 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const skill of fs.readdirSync(skillsDir).sort()) {
      const skillMd = path.join(skillsDir, skill, 'SKILL.md');
      if (fs.existsSync(skillMd)) candidates.push(skillMd);
    }
  }

  const inputs = [];
  for (const full of candidates) {
    if (!fs.existsSync(full)) continue;
    const rel = path.relative(rootDir, full).replace(/\\/g, '/');
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    inputs.push({ sourcePath: rel, sha256 });
  }
  return inputs;
}

/**
 * Collect all artefact files for a feature into a flat staging dir.
 * AC1: sequentially prefixed copies of every .md file under artefacts/[slug]/
 * AC2: writes manifest.json alongside
 * AC5: clears and rebuilds on second run
 * AC6: uses only Node.js built-ins
 *
 * @param {string} featureSlug
 * @param {string} rootDir
 * @returns {{ stagingDir: string, fileCount: number }}
 */
function collectArtefacts(featureSlug, rootDir) {
  const artefactsDir = path.join(rootDir, 'artefacts', featureSlug);
  if (!fs.existsSync(artefactsDir)) {
    throw new Error(`[trace-report --collect] Artefacts directory not found: artefacts/${featureSlug}/`);
  }

  const stagingDir = path.join(rootDir, '.ci-artefact-staging', featureSlug);

  // AC5: clear on second run
  if (fs.existsSync(stagingDir)) {
    for (const entry of fs.readdirSync(stagingDir)) {
      fs.unlinkSync(path.join(stagingDir, entry));
    }
  } else {
    fs.mkdirSync(stagingDir, { recursive: true });
  }

  // Recursively collect .md files, excluding blocked paths
  const collected = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      // AC1/Security: never include blocked files
      if (BLOCKED_FILES.includes(entry)) continue;
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.md')) {
        // AC1/Security: must be under artefacts/[slug]/
        const rel = path.relative(path.join(rootDir, 'artefacts', featureSlug), full);
        collected.push({ sourcePath: path.join('artefacts', featureSlug, rel).replace(/\\/g, '/'), full, basename: entry });
      }
    }
  })(artefactsDir);

  // Write sequentially prefixed copies
  const files = [];
  collected.forEach((item, i) => {
    const prefix = String(i + 1).padStart(2, '0');
    const filename = `${prefix}-${item.basename}`;
    fs.copyFileSync(item.full, path.join(stagingDir, filename));
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(item.full)).digest('hex');
    const { type, typeOrder, displayName } = classifyArtefact(item.sourcePath);
    files.push({ filename, sourcePath: item.sourcePath, sha256, type, typeOrder, displayName });
  });

  // Collect governance inputs (skills, instructions) with SHA-256 hashes
  const governanceInputs = collectGovernanceInputs(rootDir);

  // AC2: write manifest.json
  const manifest = {
    featureSlug,
    collectedAt: new Date().toISOString(),
    fileCount: files.length,
    files,
    governanceInputs
  };
  fs.writeFileSync(path.join(stagingDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  return { stagingDir, fileCount: files.length };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const isCollect = args.includes('--collect');
  const featureIdx = args.indexOf('--feature');
  const feature = featureIdx !== -1 ? args[featureIdx + 1] : undefined;

  if (isCollect) {
    try {
      const rootDir = process.cwd();
      const slug = resolveActiveFeature(feature, rootDir);
      const { stagingDir, fileCount } = collectArtefacts(slug, rootDir);
      process.stdout.write(`[trace-report --collect] Collected ${fileCount} file(s) to ${stagingDir}\n`);
    } catch (e) {
      process.stderr.write(e.message + '\n');
      process.exit(1);
    }
  } else {
    try {
      const report = generateReport({ feature });
      process.stdout.write(report);
    } catch (e) {
      process.stderr.write(e.message + '\n');
      process.exit(1);
    }
  }
}

module.exports = { generateReport, collectArtefacts, resolveActiveFeature, collectGovernanceInputs, classifyArtefact };
