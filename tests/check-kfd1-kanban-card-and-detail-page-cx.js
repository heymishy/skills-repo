#!/usr/bin/env node
// check-kfd1-kanban-card-and-detail-page-cx.js — AC verification tests for kfd1
// (Kanban card title truncation/encoding, artefact-count indicator, design-system
//  styled feature/artefact detail pages, ideation-stage lane fix, recursive local
//  artefact listing)
// Tests FAIL until the corresponding implementation changes land.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

function mockRes() {
  return {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead(code, hdrs) { this.statusCode = code; if (hdrs) Object.assign(this.headers, hdrs); },
    end(body) { this.body = (body != null ? String(body) : ''); }
  };
}

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'alice' },
    headers: { accept: 'text/html' },
    query:   {}
  }, overrides || {});
}

async function run() {

// ════════════════════════════════════════════════════════════════════════════
// AC1 — Kanban card title truncation, tooltip, and source-data encoding fix
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[kfd1] AC1 — card title truncation, tooltip, and encoding fix');
{
  const { renderKanban } = require('../src/web-ui/views/kanban-view');

  const longTitle = 'A very long feature title that definitely exceeds forty eight characters in length';
  const html = renderKanban({
    features: [{ slug: 'feat-long', title: longTitle, stage: 'discovery', health: 'green' }],
    ideas: []
  });

  // Note: full title WILL appear in title= attribute (that's AC1e) — check only visible span text
  const titleSpanMatch = html.match(/<span class="kb-card-title"[^>]*>([^<]*)<\/span>/);
  assert(!titleSpanMatch || titleSpanMatch[1] !== longTitle, 'AC1a: full untruncated title is not the visible text of the kb-card-title span');
  assert(!!titleSpanMatch, 'AC1b: kb-card-title span found');
  if (titleSpanMatch) {
    assert(titleSpanMatch[1].length <= 49, 'AC1c: displayed title text is 49 chars or fewer (48 + ellipsis)');
    assert(titleSpanMatch[1].endsWith('…'), 'AC1d: displayed title ends with an ellipsis character');
  }
  assert(html.includes('title="' + longTitle.replace(/"/g, '&quot;') + '"') || html.includes('title="' + longTitle + '"'),
    'AC1e: full title present in a title= attribute for hover');

  // Mojibake correction in source data
  const pipelineStatePath = path.join(ROOT, '.github', 'pipeline-state.json');
  const state = JSON.parse(fs.readFileSync(pipelineStatePath, 'utf8'));
  const mojibakeSlugs = [
    '2026-04-19-skills-platform-phase4-opus',
    '2026-04-14-skills-platform-phase3',
    '2026-04-23-non-technical-channel'
  ];
  mojibakeSlugs.forEach((slug) => {
    const feature = state.features.find((f) => f.slug === slug);
    assert(!!feature, `AC1f: feature ${slug} present in pipeline-state.json`);
    if (feature) {
      const name = feature.name || '';
      assert(!name.includes('Ã') && !name.includes('â€'), `AC1g: ${slug} name has no mojibake byte sequence`);
      assert(name.includes('—'), `AC1h: ${slug} name contains a real em dash`);
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════
// AC2 — Artefact-count indicator on Kanban cards
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[kfd1] AC2 — artefact-count indicator');
{
  const { renderKanban } = require('../src/web-ui/views/kanban-view');

  const htmlWithCount = renderKanban({
    features: [{ slug: 'feat-a', title: 'Feature A', stage: 'discovery', health: 'green', artefactCount: 4 }],
    ideas: []
  });
  assert(htmlWithCount.includes('kb-artefact-badge'), 'AC2a: artefact-count badge class rendered');
  assert(/4\s*artefacts/.test(htmlWithCount), 'AC2b: count text "4 artefacts" rendered');

  const htmlNoArtefacts = renderKanban({
    features: [{ slug: 'feat-b', title: 'Feature B', stage: 'discovery', health: 'green', artefactCount: 0 }],
    ideas: []
  });
  assert(/no artefacts yet/i.test(htmlNoArtefacts), 'AC2c: explicit "no artefacts yet" indicator for zero-artefact feature');
}

// ════════════════════════════════════════════════════════════════════════════
// AC2 (integration) — handleGetFeatures board view wires real artefact counts
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[kfd1] AC2 (integration) — board view attaches artefactCount per feature');
{
  const {
    handleGetFeatures,
    setListArtefacts,
    setAuditLogger
  } = require('../src/web-ui/routes/features');
  const { setConfiguredRepositories, setValidateRepositoryAccess, setFetchPipelineState } = require('../src/web-ui/adapters/feature-list');

  setAuditLogger({ info: () => {}, warn: () => {} });
  setConfiguredRepositories(() => ['test-owner/test-repo']);
  setValidateRepositoryAccess(async () => true);
  setFetchPipelineState(async () => ({
    features: [{ slug: 'feat-board-1', name: 'Board Feature One', stage: 'discovery', updatedAt: '2026-06-01' }]
  }));
  setListArtefacts(async (slug) => {
    assert(slug === 'feat-board-1', 'AC2d: listArtefacts called with the feature slug');
    return { artefacts: [{ type: 'Discovery' }, { type: 'Stories' }], grouped: {}, noArtefacts: false };
  });

  const req = mockReq({ query: { view: 'board' } });
  const res = mockRes();
  await handleGetFeatures(req, res);

  assert(res.statusCode === 200, 'AC2e: board view returns 200');
  assert(/2\s*artefacts/.test(res.body), 'AC2f: rendered board shows 2-artefact count for feat-board-1');
}

// ════════════════════════════════════════════════════════════════════════════
// AC5 — 'ideation' stage features are not silently dropped from every lane
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[kfd1] AC5 — ideation-stage features appear in Discovery lane');
{
  const { renderKanban, LANES } = require('../src/web-ui/views/kanban-view');
  const discoveryLane = LANES.find((l) => l.id === 'discovery');
  assert(!!discoveryLane && discoveryLane.stages.indexOf('ideation') !== -1, 'AC5a: discovery lane stages include "ideation"');

  const html = renderKanban({
    features: [{ slug: 'feat-ideation', title: 'Ideation Stage Feature', stage: 'ideation', health: 'green' }],
    ideas: []
  });
  const discoveryLaneMatch = html.match(/data-lane="discovery"[\s\S]*?data-lane="definition"/);
  assert(!!discoveryLaneMatch && discoveryLaneMatch[0].includes('feat-ideation'), 'AC5b: ideation-stage card rendered inside the Discovery lane');
}

// ════════════════════════════════════════════════════════════════════════════
// AC6 — Recursive local-first artefact listing
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[kfd1] AC6 — recursive local-first artefact listing');
{
  let listLocalArtefacts;
  try {
    ({ listLocalArtefacts } = require('../src/web-ui/adapters/artefact-list'));
  } catch (e) { /* assert below will fail */ }

  assert(typeof listLocalArtefacts === 'function', 'AC6a: listLocalArtefacts exported from artefact-list adapter');

  if (typeof listLocalArtefacts === 'function') {
    const tmpDir = fs.mkdtempSync(path.join(ROOT, '.tmp-test-kfd1-'));
    try {
      const slug = 'tmp-feature';
      const featDir = path.join(tmpDir, 'artefacts', slug);
      fs.mkdirSync(path.join(featDir, 'dor'), { recursive: true });
      fs.mkdirSync(path.join(featDir, 'stories'), { recursive: true });
      fs.writeFileSync(path.join(featDir, 'discovery.md'), '# Discovery\n');
      fs.writeFileSync(path.join(featDir, 'dor', 'x-dor.md'), '# DoR\n');
      fs.writeFileSync(path.join(featDir, 'stories', 'x-story.md'), '# Story\n');

      const items = listLocalArtefacts(tmpDir, slug);
      assert(Array.isArray(items), 'AC6b: returns an array');
      const paths = (items || []).map((i) => i.path);
      assert(paths.some((p) => p.endsWith('discovery.md')), 'AC6c: root-level file included');
      assert(paths.some((p) => p.endsWith('dor/x-dor.md') || p.endsWith('dor\\x-dor.md')), 'AC6d: nested dor/ file included');
      assert(paths.some((p) => p.endsWith('stories/x-story.md') || p.endsWith('stories\\x-story.md')), 'AC6e: nested stories/ file included');
      assert((items || []).every((i) => i.type === 'file'), 'AC6f: every item has type "file"');

      const missing = listLocalArtefacts(tmpDir, 'does-not-exist-slug');
      assert(missing === null || (Array.isArray(missing) && missing.length === 0), 'AC6g: missing directory returns null/empty (triggers fallback)');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AC3 — /features/:slug detail page follows design system (grouped layout)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[kfd1] AC3 — feature detail page design-system styling');
{
  const { handleGetFeatureArtefacts, setListArtefacts, setAuditLogger } = require('../src/web-ui/routes/features');
  setAuditLogger({ info: () => {}, warn: () => {} });

  setListArtefacts(async () => ({
    artefacts: [
      { type: 'discovery', createdAt: '2026-04-01', path: 'artefacts/feat/discovery.md' },
      { type: 'dor',        createdAt: '2026-04-03', path: 'artefacts/feat/dor/story-dor.md' }
    ],
    grouped: {},
    noArtefacts: false
  }));

  const req = mockReq();
  const res = mockRes();
  await handleGetFeatureArtefacts(req, res, 'feat');

  assert(res.statusCode === 200, 'AC3a: status 200');
  // Note: bare substring checks would false-positive against the CSS rule
  // definitions (.sw-card { ... }) always present in renderShell's <style>
  // block — require an actual class= usage in the markup instead.
  assert(res.body.includes('class="sw-card"') || /class="[^"]*\bsw-card\b[^"]*"/.test(res.body),
    'AC3b: design-system .sw-card class actually applied to an element (not just defined in <style>)');
  assert(res.body.includes('class="sw-section-title"') || /class="[^"]*\bsw-section-title\b[^"]*"/.test(res.body),
    'AC3c: design-system .sw-section-title class actually applied to an element (not just defined in <style>)');
  assert(res.body.includes('Discovery'), 'AC3d: "Discovery" group label present');
  assert(res.body.includes('Ready Check'), 'AC3e: "Ready Check" group label present');
  assert(!res.body.includes('>discovery<'), 'AC3f: raw lowercase type not rendered as visible text');
  assert(res.body.includes('href="/artefact/feat/discovery"'), 'AC3g: artefact link href preserved');
  assert(res.body.includes('2026-04-01'), 'AC3h: artefact date preserved');
}

// ════════════════════════════════════════════════════════════════════════════
// AC4 — /artefact/:slug/:type follows design system and renders markdown styled
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[kfd1] AC4 — single artefact page design-system styling');
{
  const { handleArtefactRoute, setLogger, setFetcher } = require('../src/web-ui/routes/artefact');

  setLogger({ info: () => {}, warn: () => {} });
  setFetcher(async () => '# Heading\n\nSome paragraph text.\n');

  const req = mockReq();
  const res = mockRes();
  await handleArtefactRoute(req, res, 'feat', 'discovery');

  assert(res.statusCode === 200, 'AC4a: status 200');
  assert(res.body.includes('<!doctype html'), 'AC4b: response uses the shared HTML shell (renderShell), not a bare document');
  assert(res.body.includes('<nav aria-label="Main navigation">'), 'AC4c: nav from renderShell present');
  assert(res.body.includes('class="sw-doc"') || /class="[^"]*\bsw-doc\b[^"]*"/.test(res.body),
    'AC4d: markdown content actually wrapped in an element with the design-system .sw-doc prose class (not just defined in <style>)');
  assert(res.body.includes('<h1>Heading</h1>'), 'AC4e: rendered markdown heading present');

  // 404 path also uses the shell
  setFetcher(async () => { const { ArtefactNotFoundError } = require('../src/web-ui/adapters/artefact-fetcher'); throw new ArtefactNotFoundError('feat', 'discovery'); });
  const res404 = mockRes();
  await handleArtefactRoute(req, res404, 'feat', 'discovery');
  assert(res404.statusCode === 404, 'AC4f: 404 status preserved');
  assert(res404.body.toLowerCase().includes('artefact not found'), 'AC4g: "artefact not found" message preserved');
  assert(res404.body.includes('<!doctype html'), 'AC4h: 404 page also uses the shared HTML shell');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[kfd1] ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.exitCode = 1;
}

} // end run()

run().catch((err) => {
  console.error('Unhandled error in test run:', err);
  process.exitCode = 1;
});
