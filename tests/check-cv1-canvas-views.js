'use strict';
// Governance tests: CV.1 — Canvas artefact relationship views (dashboards/canvas.html)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;

function pass(id, msg) { console.log(`  PASS  [${id}] ${msg}`); passed++; }
function fail(id, msg) { console.error(`  FAIL  [${id}] ${msg}`); failed++; }

// ── T1 — dashboards/canvas.html exists ──────────────────────────────────────
const canvasPath = path.join(ROOT, 'dashboards', 'canvas.html');
if (fs.existsSync(canvasPath)) {
  pass('CV.T1', 'dashboards/canvas.html exists');
} else {
  fail('CV.T1', 'dashboards/canvas.html not found');
  process.exit(1);
}

const html = fs.readFileSync(canvasPath, 'utf8');

// ── T2 — React 18 CDN ───────────────────────────────────────────────────────
if (html.includes('react@18')) {
  pass('CV.T2', 'React 18 CDN reference present');
} else {
  fail('CV.T2', 'react@18 CDN reference missing from canvas.html');
}

// ── T3 — Dual-URL pipeline-state loader ─────────────────────────────────────
if (html.includes('pipeline-state.json') && html.includes('../.github/pipeline-state.json')) {
  pass('CV.T3', 'Dual-URL pipeline-state.json loader present');
} else {
  fail('CV.T3', 'Dual-URL loader missing: need both pipeline-state.json and ../.github/pipeline-state.json');
}

// ── T4 — Story Map view ──────────────────────────────────────────────────────
if (html.includes('Story Map')) {
  pass('CV.T4', '"Story Map" tab label present');
} else {
  fail('CV.T4', '"Story Map" label missing from canvas.html');
}

// ── T5 — Artefact Tree view ──────────────────────────────────────────────────
if (html.includes('Artefact Tree')) {
  pass('CV.T5', '"Artefact Tree" tab label present');
} else {
  fail('CV.T5', '"Artefact Tree" label missing from canvas.html');
}

// ── T6 — Timeline view ───────────────────────────────────────────────────────
if (html.includes('Timeline')) {
  pass('CV.T6', '"Timeline" tab label present');
} else {
  fail('CV.T6', '"Timeline" label missing from canvas.html');
}

// ── T7 — Dependency Graph view ───────────────────────────────────────────────
if (html.includes('Dependency')) {
  pass('CV.T7', '"Dependency" (graph) tab label present');
} else {
  fail('CV.T7', '"Dependency" label missing from canvas.html');
}

// ── T8 — renderMarkdown call ─────────────────────────────────────────────────
if (html.includes('renderMarkdown')) {
  pass('CV.T8', 'renderMarkdown call present (side panel)');
} else {
  fail('CV.T8', 'renderMarkdown call missing from canvas.html');
}

// ── T9 — artefact-fetcher.js script tag ─────────────────────────────────────
if (html.includes('artefact-fetcher.js')) {
  pass('CV.T9', 'artefact-fetcher.js script reference present');
} else {
  fail('CV.T9', 'artefact-fetcher.js script reference missing from canvas.html');
}

// ── T10 — Link back to index.html ────────────────────────────────────────────
if (html.includes('index.html')) {
  pass('CV.T10', 'index.html nav link present');
} else {
  fail('CV.T10', 'Link back to index.html missing from canvas.html');
}

// ── T11 — SVG used for dependency graph ─────────────────────────────────────
if (html.includes('<svg') || html.includes('createElementNS')) {
  pass('CV.T11', 'SVG element or createElementNS present (dependency graph)');
} else {
  fail('CV.T11', 'No SVG element found — dependency graph must use pure SVG');
}

// ── T12 — Filter bar component ───────────────────────────────────────────────
if (html.includes('FilterBar') && html.includes('filter-chip')) {
  pass('CV.T12', 'FilterBar component and filter-chip CSS class present');
} else {
  fail('CV.T12', 'FilterBar component or filter-chip class missing from canvas.html');
}

// ── T13 — inferProgramme helper ──────────────────────────────────────────────
if (html.includes('inferProgramme')) {
  pass('CV.T13', 'inferProgramme helper present (programme grouping from slug)');
} else {
  fail('CV.T13', 'inferProgramme helper missing from canvas.html');
}

// ── T14 — Story Map release bands (SM_BANDS) ─────────────────────────────────
if (html.includes('SM_BANDS')) {
  pass('CV.T14', 'SM_BANDS release-slice band definitions present');
} else {
  fail('CV.T14', 'SM_BANDS missing from canvas.html (Shipped / In Flight / Backlog bands required)');
}

// ── T15 — Patton backbone structure ─────────────────────────────────────────
if (html.includes('sm-activity-cell')) {
  pass('CV.T15', 'sm-activity-cell present (Patton Activity/backbone row)');
} else {
  fail('CV.T15', 'sm-activity-cell class missing — Patton two-axis backbone structure required');
}

// ── T16 — Filter persistence via localStorage ────────────────────────────────
if (html.includes('localStorage')) {
  pass('CV.T16', 'canvas.html uses localStorage (filter state persistence)');
} else {
  fail('CV.T16', 'canvas.html missing localStorage — filter state is not persisted');
}

// ── T17 — Filter overflow dropdown ──────────────────────────────────────────
if (html.includes('filter-select')) {
  pass('CV.T17', 'canvas.html contains filter-select (overflow dropdown mode for >8 features)');
} else {
  fail('CV.T17', 'canvas.html missing filter-select — overflow dropdown not implemented');
}

// ── T18 — Server integration for save ────────────────────────────────────────
if (html.includes('REVIEW_SERVER')) {
  pass('CV.T18', 'canvas.html contains REVIEW_SERVER (server integration for save)');
} else {
  fail('CV.T18', 'canvas.html missing REVIEW_SERVER — server integration not added');
}

// ── T19 — Site-wide nav bar ──────────────────────────────────────────────────
if (html.includes('site-nav')) {
  pass('CV.T19', 'canvas.html contains site-nav (cross-page navigation bar)');
} else {
  fail('CV.T19', 'canvas.html missing site-nav — cross-page navigation not added');
}

// ── T20 — MdEditorOverlay in SidePanel ──────────────────────────────────────
if (html.includes('md-editor-overlay')) {
  pass('CV.T20', 'canvas.html contains md-editor-overlay (MdEditorOverlay in SidePanel)');
} else {
  fail('CV.T20', 'canvas.html missing md-editor-overlay — edit functionality not added to SidePanel');
}

console.log(`\nCV.1 canvas-views: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
