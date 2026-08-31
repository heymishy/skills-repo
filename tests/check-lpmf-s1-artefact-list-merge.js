#!/usr/bin/env node
// check-lpmf-s1-artefact-list-merge.js — AC verification for lpmf-s1
// (listArtefacts merges local-disk and Postgres artefact lists instead of
//  returning local unconditionally whenever it is non-empty. Closes the gap
//  alrf-s4 left open: a partial/stale local checkout no longer hides
//  artefacts that only exist in the durably-saved Postgres store. Live
//  symptom: /features/new-feature-af17f555 showed 3 artefacts locally while
//  completedStages recorded 8.)
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

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

async function run() {
  // ── AC1: partial local + fuller Postgres -> union of all distinct paths ──
  console.log('\n  AC1 -- partial local (3) + fuller Postgres (8, including those 3 paths) -> 8 distinct artefacts returned');
  {
    delete process.env.WUCE_REPOSITORIES;
    const slug = 'lpmf-s1-af17f555-repro';
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lpmf-s1-union-'));
    const featDir = path.join(root, 'artefacts', slug);
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'discovery.md'), '# Discovery', 'utf8');
    fs.mkdirSync(path.join(featDir, 'stories'), { recursive: true });
    fs.writeFileSync(path.join(featDir, 'stories', 's1-story.md'), '# Story', 'utf8');
    fs.mkdirSync(path.join(featDir, 'test-plans'), { recursive: true });
    fs.writeFileSync(path.join(featDir, 'test-plans', 's1-test-plan.md'), '# Test Plan', 'utf8');

    const pgRows = [
      { skill_name: 'discovery',          artefact_path: 'artefacts/' + slug + '/discovery.md' },
      { skill_name: 'definition',         artefact_path: 'artefacts/' + slug + '/stories/s1-story.md' },
      { skill_name: 'test-plan',          artefact_path: 'artefacts/' + slug + '/test-plans/s1-test-plan.md' },
      { skill_name: 'definition-of-ready', artefact_path: 'artefacts/' + slug + '/dor/s1-dor.md' },
      { skill_name: 'definition-of-ready', artefact_path: 'artefacts/' + slug + '/dor/s1-dor-contract.md' },
      { skill_name: 'branch-complete',    artefact_path: 'artefacts/' + slug + '/decisions.md' },
      { skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod/s1-dod.md' },
      { skill_name: 'review',             artefact_path: 'artefacts/' + slug + '/review.md' }
    ];

    const result = await listArtefacts(slug, 'fake-token', root, pgRows);
    eq(result.artefacts.length, 8, 'AC1: 8 distinct artefacts returned (3 local + 5 pg-only), matching the live af17f555 fix target');
    const paths = result.artefacts.map((a) => a.path);
    ok(paths.includes('artefacts/' + slug + '/discovery.md'), 'AC1: local discovery.md present');
    ok(paths.includes('artefacts/' + slug + '/dor/s1-dor.md'), 'AC1: pg-only dor artefact present');
    ok(paths.includes('artefacts/' + slug + '/dod/s1-dod.md'), 'AC1: pg-only dod artefact present');
    eq(new Set(paths).size, paths.length, 'AC1: no duplicate paths in the merged result');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC2: overlapping path -> local item wins ──
  console.log('\n  AC2 -- overlapping path -> local-derived fields win over the Postgres row at the same path');
  {
    const slug = 'lpmf-s1-overlap-feature';
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lpmf-s1-overlap-'));
    const featDir = path.join(root, 'artefacts', slug);
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'discovery.md'), '# Real local discovery', 'utf8');
    const pgRows = [{ skill_name: 'discovery', artefact_path: 'artefacts/' + slug + '/discovery.md', content: 'stale pg content' }];
    const result = await listArtefacts(slug, 'fake-token', root, pgRows);
    eq(result.artefacts.length, 1, 'AC2: exactly one artefact returned for the shared path (no duplication)');
    eq(result.artefacts[0].sha, null, 'AC2: returned artefact matches the local-derived shape (sha: null, as listLocalArtefacts always produces)');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC3: empty local dir + Postgres rows -> pg rows returned (regression, mirrors alrf-s4 AC3) ──
  console.log('\n  AC3 -- empty local dir + Postgres rows -> both returned (regression)');
  {
    const slug = 'lpmf-s1-empty-local-feature';
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lpmf-s1-emptylocal-'));
    fs.mkdirSync(path.join(root, 'artefacts', slug), { recursive: true });
    const pgRows = [
      { skill_name: 'discovery', artefact_path: 'artefacts/' + slug + '/discovery.md' },
      { skill_name: 'definition', artefact_path: 'artefacts/' + slug + '/stories/s1-story.md' }
    ];
    const result = await listArtefacts(slug, 'fake-token', root, pgRows);
    eq(result.noArtefacts, false, 'AC3: noArtefacts false -- Postgres content found despite empty local dir');
    eq(result.artefacts.length, 2, 'AC3: both Postgres rows returned');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC4: local only, no pg rows -> local returned (regression, mirrors alrf-s4 AC2) ──
  console.log('\n  AC4 -- local only, no Postgres rows -> local artefacts returned unchanged (regression)');
  {
    const slug = 'lpmf-s1-local-only-feature';
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lpmf-s1-localonly-'));
    const featDir = path.join(root, 'artefacts', slug);
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'discovery.md'), '# Local only', 'utf8');
    const result1 = await listArtefacts(slug, 'fake-token', root, []);
    eq(result1.artefacts.length, 1, 'AC4a: local artefact returned when pgArtefactRows is an empty array');
    const result2 = await listArtefacts(slug, 'fake-token', root, undefined);
    eq(result2.artefacts.length, 1, 'AC4b: local artefact returned when pgArtefactRows is omitted');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC5: merged multi-source list groups correctly, no duplicate/dropped paths ──
  console.log('\n  AC5 -- merged list groups correctly via groupArtefactsByStage');
  {
    const slug = 'lpmf-s1-grouping-feature';
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lpmf-s1-grouping-'));
    const featDir = path.join(root, 'artefacts', slug);
    fs.mkdirSync(path.join(featDir, 'dor'), { recursive: true });
    fs.writeFileSync(path.join(featDir, 'dor', 's1-dor.md'), '# DoR', 'utf8');
    const pgRows = [
      { skill_name: 'test-plan', artefact_path: 'artefacts/' + slug + '/test-plans/s1-test-plan.md' },
      { skill_name: 'test-plan', artefact_path: 'artefacts/' + slug + '/test-plans/s2-test-plan.md' }
    ];
    const result = await listArtefacts(slug, 'fake-token', root, pgRows);
    eq(result.artefacts.length, 3, 'AC5: 3 distinct artefacts (1 local dor + 2 pg test-plans)');
    const allGroupedPaths = Object.values(result.grouped).flat().map((a) => a.path);
    eq(new Set(allGroupedPaths).size, allGroupedPaths.length, 'AC5: no path appears in more than one stage group');
    eq(allGroupedPaths.length, 3, 'AC5: every returned artefact appears in exactly one stage group');
    fs.rmSync(root, { recursive: true, force: true });
  }

  console.log('\n[lpmf-s1-artefact-list-merge] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
