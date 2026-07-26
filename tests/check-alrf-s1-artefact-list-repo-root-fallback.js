#!/usr/bin/env node
// check-alrf-s1-artefact-list-repo-root-fallback.js — AC verification for alrf-s1
// (Artefact-list local-filesystem fallback, closing the artefact-listing mismatch
//  found on staging 2026-07-26: /features/:slug showed "No artefacts found" for a
//  feature the kanban board correctly showed as "design · 3 artefacts". Root cause:
//  listArtefacts() only checked the GitHub-API path, gated on WUCE_REPOSITORIES,
//  which is never set on staging -- so it always returned noArtefacts:true regardless
//  of real content. listLocalArtefacts() already existed as a correct, working
//  filesystem-based alternative but was dead code, never called from anywhere.)
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

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

const { listArtefacts } = require('../src/web-ui/adapters/artefact-list');

function makeTempRepo(featureSlug, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s1-'));
  const featDir = path.join(root, 'artefacts', featureSlug);
  Object.keys(files).forEach((relPath) => {
    const full = path.join(featDir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, files[relPath], 'utf8');
  });
  return root;
}

async function run() {
  // ── AC1: with a repoRoot whose artefacts/<slug> dir has real files, listArtefacts
  //         returns them via the local-filesystem path, not GitHub API, even when
  //         WUCE_REPOSITORIES is unset (matches staging's actual configuration) ──
  console.log('\n  AC1 -- local artefacts found via repoRoot when WUCE_REPOSITORIES is unset');
  {
    delete process.env.WUCE_REPOSITORIES;
    const slug = 'alrf-s1-fixture-feature';
    const root = makeTempRepo(slug, {
      'discovery.md': '# Discovery',
      'stories/alrf.1-story.md': '# Story alrf.1'
    });
    const result = await listArtefacts(slug, 'fake-token', root);
    eq(result.noArtefacts, false, 'AC1: noArtefacts is false when local files exist');
    eq(result.artefacts.length, 2, 'AC1: both artefact files found');
    const paths = result.artefacts.map((a) => a.path).sort();
    ok(paths.includes('artefacts/' + slug + '/discovery.md'), 'AC1: repo-relative path uses forward slashes, matches the artefactPath convention used elsewhere (skills.js, as-built-system-architecture.js)');
    ok(paths.includes('artefacts/' + slug + '/stories/alrf.1-story.md'), 'AC1: nested story file found with correct repo-relative path');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC2: directory exists locally but genuinely has no .md files -> noArtefacts:true,
  //         not a fall-through to the (also-empty) GitHub path ──
  console.log('\n  AC2 -- empty local artefacts directory -> noArtefacts:true');
  {
    const slug = 'alrf-s1-empty-feature';
    const root = makeTempRepo(slug, {});
    fs.mkdirSync(path.join(root, 'artefacts', slug), { recursive: true });
    const result = await listArtefacts(slug, 'fake-token', root);
    eq(result.noArtefacts, true, 'AC2: noArtefacts true for an existing-but-empty directory');
    eq(result.artefacts.length, 0, 'AC2: artefacts array empty');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC3: no local directory for this feature (repoRoot given, but slug absent) ->
  //         falls through to the GitHub-API path, preserving existing behaviour ──
  console.log('\n  AC3 -- no local artefacts dir -> falls through to GitHub-API path unchanged');
  {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s1-nodir-'));
    process.env.WUCE_REPOSITORIES = ''; // still unset/empty -> GitHub path also finds nothing
    const result = await listArtefacts('alrf-s1-nonexistent-feature', 'fake-token', root);
    eq(result.noArtefacts, true, 'AC3: no local dir + no configured repos -> noArtefacts true (unchanged prior behaviour)');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC4: called without a repoRoot at all (back-compat) behaves exactly as before ──
  console.log('\n  AC4 -- omitting repoRoot preserves prior (GitHub-API-only) behaviour');
  {
    process.env.WUCE_REPOSITORIES = '';
    const result = await listArtefacts('any-feature-slug', 'fake-token');
    eq(result.noArtefacts, true, 'AC4: no repoRoot argument -> same as calling with zero configured repos, as before this fix');
  }

  console.log('\n[alrf-s1-artefact-list-repo-root-fallback] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
