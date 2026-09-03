#!/usr/bin/env node
// check-aada-s1-archived-directory-fallback.js — AC verification for aada-s1
// (Feature artefact lookup falls back to the archived directory when the
//  primary path is gone. Found while designing a redesign of the feature
//  artefact page for 2026-04-14-skills-platform-phase3: that feature was
//  moved to artefacts/archived/2026-04-14-skills-platform-phase3/ by the
//  already-shipped archival story, but listLocalArtefacts only ever
//  checked artefacts/<slug>/, never artefacts/archived/<slug>/ --
//  scripts/validate-trace.sh/.ps1 already carry this exact fallback for
//  trace-validation purposes; this brings the web UI's own artefact-
//  serving path in line with that established convention.)
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const assert = require('assert');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

const { listLocalArtefacts } = require('../src/web-ui/adapters/artefact-list');

function makeTempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aada-s1-'));
}

function writeFile(root, relPath, content) {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

(function run() {
  // ── AC1: primary path exists -- archived path never checked, behaviour unchanged ──
  console.log('\n  AC1 -- primary path exists: behaviour unchanged, no archived dir needed');
  {
    const slug = 'aada-s1-primary-feature';
    const root = makeTempRepo();
    writeFile(root, `artefacts/${slug}/discovery.md`, '# Discovery');
    const result = listLocalArtefacts(root, slug);
    ok(result !== null, 'AC1: result is not null');
    eq(result.length, 1, 'AC1: exactly one file found');
    ok(result[0].path.endsWith(path.join('artefacts', slug, 'discovery.md')), 'AC1: file found at the primary (non-archived) path');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC2: primary path absent, archived path exists -- real files returned, not null ──
  console.log('\n  AC2 -- primary path absent, archived path exists: real files returned');
  {
    const slug = 'aada-s1-archived-feature';
    const root = makeTempRepo();
    writeFile(root, `artefacts/archived/${slug}/discovery.md`, '# Discovery');
    writeFile(root, `artefacts/archived/${slug}/stories/x.1-story.md`, '# Story x.1');
    const result = listLocalArtefacts(root, slug);
    ok(result !== null, 'AC2: result is not null -- the exact case this story fixes');
    eq(result.length, 2, 'AC2: both real archived files found');
    const paths = result.map((f) => f.path).sort();
    ok(paths.some((p) => p.endsWith(path.join('artefacts', 'archived', slug, 'discovery.md'))), 'AC2: discovery.md found at the archived path');
    ok(paths.some((p) => p.endsWith(path.join('artefacts', 'archived', slug, 'stories', 'x.1-story.md'))), 'AC2: nested story file found at the archived path');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC3: neither path exists -- still returns null (regression guard) ──
  console.log('\n  AC3 -- neither path exists: still returns null (regression guard)');
  {
    const slug = 'aada-s1-nonexistent-feature';
    const root = makeTempRepo();
    const result = listLocalArtefacts(root, slug);
    eq(result, null, 'AC3: null returned for a genuinely nonexistent feature, unchanged from before this fix');
    fs.rmSync(root, { recursive: true, force: true });
  }

  console.log('\n[check-aada-s1-archived-directory-fallback] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
})();
