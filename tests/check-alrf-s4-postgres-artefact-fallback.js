#!/usr/bin/env node
// check-alrf-s4-postgres-artefact-fallback.js — AC verification for alrf-s4
// (Postgres artefact-content fallback for listArtefacts/handleGetFeatureArtefacts.
//  routes/skills.js already durably saves artefact content to Postgres --
//  journey-store-pg.js's saveArtefact(), via journeyStore's own comment
//  "Persist artefact content to Postgres so cross-device / post-deploy
//  resume works" -- but nothing read it back for the feature-index page
//  until now. Local disk is not durable across a redeploy on this
//  deployment topology (see decisions.md D3/D4), so on a fresh container
//  with an empty or absent local artefacts/ dir, Postgres is the real
//  source of truth.)
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
  // ── AC1: pgArtefactRows used when no local dir exists and no GitHub config ──
  console.log('\n  AC1 -- Postgres rows used when local disk and GitHub API both find nothing');
  {
    delete process.env.WUCE_REPOSITORIES;
    const pgRows = [
      { skill_name: 'discovery', artefact_path: 'artefacts/pg-feature/discovery.md', content: '# Discovery' },
      { skill_name: 'definition', artefact_path: 'artefacts/pg-feature/stories/pg.1-story.md', content: '# Story' }
    ];
    const noLocalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s4-nolocal-'));
    const result = await listArtefacts('pg-feature', 'fake-token', noLocalRoot, pgRows);
    eq(result.noArtefacts, false, 'AC1: noArtefacts is false when Postgres has rows');
    eq(result.artefacts.length, 2, 'AC1: both Postgres rows returned as artefacts');
    ok(result.artefacts.some((a) => a.path === 'artefacts/pg-feature/discovery.md'), 'AC1: artefact path matches the pg row artefact_path');
    ok(result.artefacts.some((a) => a.type === 'Stories'), 'AC1: nested story row correctly labelled via deriveTypeFromPath');
    fs.rmSync(noLocalRoot, { recursive: true, force: true });
  }

  // ── AC2: local disk takes priority over Postgres when local has real content ──
  console.log('\n  AC2 -- local disk wins over Postgres rows when local has real content');
  {
    const slug = 'alrf-s4-local-wins-feature';
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s4-local-'));
    const featDir = path.join(root, 'artefacts', slug);
    fs.mkdirSync(featDir, { recursive: true });
    fs.writeFileSync(path.join(featDir, 'discovery.md'), '# Real local discovery', 'utf8');
    const pgRows = [{ skill_name: 'discovery', artefact_path: 'artefacts/' + slug + '/discovery.md', content: 'stale pg content' }];
    const result = await listArtefacts(slug, 'fake-token', root, pgRows);
    eq(result.artefacts.length, 1, 'AC2: exactly one artefact returned (from disk, not duplicated with pg)');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC3: local dir exists but is empty -> Postgres rows still checked ──
  console.log('\n  AC3 -- Postgres rows used when local artefacts dir exists but is empty');
  {
    const slug = 'alrf-s4-empty-local-feature';
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alrf-s4-emptylocal-'));
    fs.mkdirSync(path.join(root, 'artefacts', slug), { recursive: true }); // exists, no .md files
    const pgRows = [{ skill_name: 'discovery', artefact_path: 'artefacts/' + slug + '/discovery.md', content: '# From Postgres' }];
    const result = await listArtefacts(slug, 'fake-token', root, pgRows);
    eq(result.noArtefacts, false, 'AC3: noArtefacts false -- Postgres content found despite empty local dir');
    eq(result.artefacts.length, 1, 'AC3: the Postgres row is returned');
    fs.rmSync(root, { recursive: true, force: true });
  }

  // ── AC4: no repoRoot, no pgArtefactRows, no GitHub config -> still noArtefacts (unchanged) ──
  console.log('\n  AC4 -- absent/empty pgArtefactRows falls through exactly as before (no regression)');
  {
    process.env.WUCE_REPOSITORIES = '';
    const result1 = await listArtefacts('some-feature', 'fake-token');
    eq(result1.noArtefacts, true, 'AC4a: omitting pgArtefactRows entirely -- unchanged behaviour');
    const result2 = await listArtefacts('some-feature', 'fake-token', undefined, []);
    eq(result2.noArtefacts, true, 'AC4b: empty pgArtefactRows array -- unchanged behaviour');
  }

  // ── AC5: route-level wiring -- handleGetFeatureArtefacts fetches pg rows via
  //         journeyStore.getArtefactsForJourney using the journey's journeyId ──
  console.log('\n  AC5 -- handleGetFeatureArtefacts fetches Postgres rows via the resolved journey and passes them through');
  {
    const { handleGetFeatureArtefacts, setJourneyStoreModule, setListArtefacts } = require('../src/web-ui/routes/features');
    let capturedArgs = null;
    setListArtefacts(async (featureSlug, token, repoRoot, pgArtefactRows) => {
      capturedArgs = { featureSlug, repoRoot, pgArtefactRows };
      return { artefacts: [], grouped: {}, noArtefacts: true };
    });
    setJourneyStoreModule({
      getJourneyByFeatureSlug: (slug) => ({ journeyId: 'journey-abc-123', featureSlug: slug, displayName: null, completedStages: [] }),
      getArtefactsForJourney: async (journeyId) => {
        eq(journeyId, 'journey-abc-123', 'AC5: getArtefactsForJourney called with the resolved journey\'s journeyId');
        return [{ skill_name: 'discovery', artefact_path: 'artefacts/route-feature/discovery.md', content: '# X' }];
      }
    });
    const req = { session: { accessToken: 'tok', userId: 1 }, headers: { accept: 'application/json' } };
    const res = { writeHead() {}, end() {} };
    await handleGetFeatureArtefacts(req, res, 'route-feature');
    ok(capturedArgs !== null, 'AC5: listArtefacts adapter was invoked');
    ok(Array.isArray(capturedArgs.pgArtefactRows) && capturedArgs.pgArtefactRows.length === 1, 'AC5: pgArtefactRows correctly passed through to listArtefacts');
  }

  // ── AC6: journeyStore.getArtefactsForJourney throwing does not crash the route ──
  console.log('\n  AC6 -- a throwing getArtefactsForJourney degrades gracefully (no crash, empty rows)');
  {
    const { handleGetFeatureArtefacts, setJourneyStoreModule, setListArtefacts } = require('../src/web-ui/routes/features');
    let capturedArgs = null;
    setListArtefacts(async (featureSlug, token, repoRoot, pgArtefactRows) => {
      capturedArgs = { pgArtefactRows };
      return { artefacts: [], grouped: {}, noArtefacts: true };
    });
    setJourneyStoreModule({
      getJourneyByFeatureSlug: () => ({ journeyId: 'journey-throws', featureSlug: 'x', displayName: null, completedStages: [] }),
      getArtefactsForJourney: async () => { throw new Error('pg unavailable'); }
    });
    const req = { session: { accessToken: 'tok', userId: 1 }, headers: { accept: 'application/json' } };
    const res = { writeHead() {}, end() {} };
    let threw = false;
    try { await handleGetFeatureArtefacts(req, res, 'throw-feature'); } catch (_) { threw = true; }
    ok(!threw, 'AC6: route does not throw when getArtefactsForJourney rejects');
    ok(Array.isArray(capturedArgs.pgArtefactRows) && capturedArgs.pgArtefactRows.length === 0, 'AC6: pgArtefactRows falls back to [] on error');
  }

  console.log('\n[alrf-s4-postgres-artefact-fallback] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
