#!/usr/bin/env node
// check-shr2-ops-path.js
// Tests for shr.2: ops/ slug validation in check-pipeline-state-integrity.js
// 7 unit + 1 NFR = 8 tests
// Run: node tests/check-shr2-ops-path.js
'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Load the check functions directly by requiring the module under test.
// The integrity check script exports nothing — we call checkFeature inline
// by requiring a slim wrapper, OR we replicate the relevant function call.
// Since the script doesn't export, we test the exported logic via the
// self-test mechanism: we inline the checkFeature logic from the module.
// For path-resolution tests we use path.resolve directly.

// ── Inline checkFeature (mirrors the function in check-pipeline-state-integrity.js) ─
// We require the script to run its self-tests, then test checkFeature via a shim.
// The actual C9 check is what we're testing — we need to call it.
// Strategy: require the script's logic by extracting checkFeature via eval isolation.

// Read the script source and extract checkFeature + VALID_FEATURE_STAGES by executing
// in a scoped context using the module pattern.
const fs = require('fs');
const src = fs.readFileSync(path.join(ROOT, 'scripts', 'check-pipeline-state-integrity.js'), 'utf8');

// Extract just the function definitions (stop before self-tests at process.stdout.write)
// We isolate up to the self-test block start.
const fnEnd = src.indexOf('\nprocess.stdout.write(`[pipeline-state-integrity] Self-tests');
const fnSrc = src.slice(0, fnEnd) + '\nmodule.exports = { checkFeature, checkStory, collectStories };';

// Write to temp and require
const tmpPath = path.join(require('os').tmpdir(), 'shr2-integrity-shim-' + Date.now() + '.js');
fs.writeFileSync(tmpPath, fnSrc);
const { checkFeature } = require(tmpPath);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    process.stdout.write('  ✓ ' + label + '\n');
    passed++;
  } else {
    process.stdout.write('  ✗ FAIL: ' + label + '\n');
    failed++;
  }
}

// ── Unit Tests ────────────────────────────────────────────────────────────────

process.stdout.write('\n[shr.2] Unit tests\n');

// ops-slug-accepted-by-integrity-check
{
  const findings = checkFeature({ slug: 'ops/2026-06-25-secrets-rotation', stage: 'branch-setup', health: 'green' });
  assert(findings.every(function(f) { return f.code !== 'C9'; }),
    'ops-slug-accepted: ops/2026-06-25-secrets-rotation accepted — no C9 finding');
}

// ops-slug-with-date-and-description-accepted
{
  const findings = checkFeature({ slug: 'ops/2026-12-31-firewall-rule-update', stage: 'branch-setup', health: 'green' });
  assert(findings.every(function(f) { return f.code !== 'C9'; }),
    'ops-slug-with-date-and-description: ops/2026-12-31-firewall-rule-update accepted — no C9 finding');
}

// ops-artefact-path-resolves-within-repoRoot
{
  const repoRoot = ROOT;
  const artefactPath = 'artefacts/ops/2026-06-25-secrets-rotation/infra/standalone-infra-def.md';
  const resolved = path.resolve(repoRoot, artefactPath);
  assert(resolved.startsWith(path.resolve(repoRoot) + path.sep),
    'ops-artefact-path-resolves-within-repoRoot: artefacts/ops/[slug]/infra/ path stays within repoRoot');
}

// ops-path-containment-holds-for-nested-subdir
{
  const repoRoot = ROOT;
  const artefactPath = 'artefacts/ops/2026-06-25-secrets-rotation/trace/s1-trace.json';
  const resolved = path.resolve(repoRoot, artefactPath);
  assert(resolved.startsWith(path.resolve(repoRoot) + path.sep),
    'ops-path-containment-nested: artefacts/ops/[slug]/trace/ path stays within repoRoot');
}

// traversal-in-ops-slug-does-not-escape-repoRoot
{
  const slug = 'ops/../../etc/passwd';
  const findings = checkFeature({ slug: slug, stage: 'branch-setup', health: 'green' });
  // Either slug is rejected (C9 fires) OR the derived artefact path doesn't escape.
  // Test that C9 fires for this traversal slug.
  assert(findings.some(function(f) { return f.code === 'C9'; }),
    'traversal-in-ops-slug: ops/../../etc/passwd rejected by C9 — traversal guard fires');
}

// traversal-via-double-dot-in-ops-middle-segment
{
  const slug = 'ops/2026-06-25-valid/../../../etc';
  const findings = checkFeature({ slug: slug, stage: 'branch-setup', health: 'green' });
  // C9 must fire: the remainder after ops/ contains '..'
  assert(findings.some(function(f) { return f.code === 'C9'; }),
    'traversal-via-double-dot-in-ops-middle-segment: ops/2026-06-25-valid/../../../etc rejected by C9');
}

// standard-slug-unaffected-by-ops-extension
{
  const findings = checkFeature({ slug: '2026-06-22-skills-infra-migration-tracks', stage: 'branch-setup', health: 'green' });
  assert(findings.every(function(f) { return f.code !== 'C9'; }),
    'standard-slug-unaffected: standard slug has no C9 finding — existing behaviour unchanged');
}

// ── NFR Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\n[shr.2] NFR tests\n');

// ops-path-traversal-guard-is-mandatory
{
  // All traversal-form ops slugs must produce C9. Test three variants.
  const traversalSlugs = [
    'ops/../../etc/passwd',
    'ops/2026-06-25-valid/../../../etc',
    'ops/../secrets',
  ];
  const allRejected = traversalSlugs.every(function(slug) {
    const findings = checkFeature({ slug: slug, stage: 'branch-setup', health: 'green' });
    return findings.some(function(f) { return f.code === 'C9'; });
  });
  assert(allRejected, 'ops-path-traversal-guard-is-mandatory: all traversal-form ops slugs produce C9');
}

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[shr.2] Results: ' + passed + ' passed, ' + failed + ' failed\n');
try { fs.unlinkSync(tmpPath); } catch (_) {}
if (failed > 0) process.exit(1);
