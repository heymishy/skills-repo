'use strict';
// Governance tests: DR.1 — Pipeline review dashboard (dashboards/review.html + scripts/review-server.js)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;

function pass(id, msg) { console.log(`  PASS  [${id}] ${msg}`); passed++; }
function fail(id, msg) { console.error(`  FAIL  [${id}] ${msg}`); failed++; }

// ── T1 — dashboards/review.html exists ──────────────────────────────────────
const reviewHtmlPath = path.join(ROOT, 'dashboards', 'review.html');
if (fs.existsSync(reviewHtmlPath)) {
  pass('DR.T1', 'dashboards/review.html exists');
} else {
  fail('DR.T1', 'dashboards/review.html not found');
  process.exit(1); // subsequent tests depend on this
}

const html = fs.readFileSync(reviewHtmlPath, 'utf8');

// ── T2 — React 18 CDN ───────────────────────────────────────────────────────
if (html.includes('react@18')) {
  pass('DR.T2', 'React 18 CDN reference present');
} else {
  fail('DR.T2', 'react@18 CDN reference missing from review.html');
}

// ── T3 — Dual-URL pipeline-state loader ─────────────────────────────────────
if (html.includes('pipeline-state.json') && html.includes('../.github/pipeline-state.json')) {
  pass('DR.T3', 'Dual-URL pipeline-state.json loader present');
} else {
  fail('DR.T3', 'Dual-URL loader missing: need both pipeline-state.json and ../.github/pipeline-state.json');
}

// ── T4 — /advance endpoint referenced ───────────────────────────────────────
if (html.includes('/advance')) {
  pass('DR.T4', '/advance endpoint reference present');
} else {
  fail('DR.T4', '/advance endpoint reference missing from review.html');
}

// ── T5 — /health endpoint referenced ────────────────────────────────────────
if (html.includes('/health')) {
  pass('DR.T5', '/health endpoint reference present');
} else {
  fail('DR.T5', '/health endpoint reference missing from review.html');
}

// ── T6 — md-renderer.js script tag ──────────────────────────────────────────
if (html.includes('md-renderer.js')) {
  pass('DR.T6', 'md-renderer.js script reference present');
} else {
  fail('DR.T6', 'md-renderer.js script reference missing from review.html');
}

// ── T7 — artefact-fetcher.js script tag ─────────────────────────────────────
if (html.includes('artefact-fetcher.js')) {
  pass('DR.T7', 'artefact-fetcher.js script reference present');
} else {
  fail('DR.T7', 'artefact-fetcher.js script reference missing from review.html');
}

// ── T8 — scripts/review-server.js exists ────────────────────────────────────
const serverPath = path.join(ROOT, 'scripts', 'review-server.js');
if (fs.existsSync(serverPath)) {
  pass('DR.T8', 'scripts/review-server.js exists');
} else {
  fail('DR.T8', 'scripts/review-server.js not found');
  console.error(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

const server = fs.readFileSync(serverPath, 'utf8');

// ── T9 — No external framework dependencies ──────────────────────────────────
if (!server.includes("require('express')") && !server.includes('require("express")') &&
    !server.includes("require('axios')")   && !server.includes('require("axios")')) {
  pass('DR.T9', 'review-server.js uses no external npm dependencies (no express/axios)');
} else {
  fail('DR.T9', 'review-server.js must not require express or axios');
}

// ── T10 — Atomic write via renameSync ────────────────────────────────────────
if (server.includes('renameSync')) {
  pass('DR.T10', 'review-server.js uses renameSync for atomic write');
} else {
  fail('DR.T10', 'review-server.js does not use renameSync — state write may not be atomic');
}

// ── T11 — Path traversal prevention ─────────────────────────────────────────
if (server.includes('startsWith')) {
  pass('DR.T11', 'review-server.js has path traversal guard (startsWith)');
} else {
  fail('DR.T11', 'review-server.js lacks path traversal prevention (startsWith check)');
}

// ── T12 — CORS headers ───────────────────────────────────────────────────────
if (server.includes('Access-Control-Allow-Origin')) {
  pass('DR.T12', 'review-server.js sets Access-Control-Allow-Origin header');
} else {
  fail('DR.T12', 'review-server.js does not set CORS headers');
}
// ── T13 — Save endpoint ────────────────────────────────────────────────
if (server.includes('/save') && html.includes('callSave')) {
  pass('DR.T13', '/save endpoint registered in review-server.js and callSave helper present in review.html');
} else {
  fail('DR.T13', '/save endpoint or callSave helper missing');
}

// ── T14 — Site-wide navigation bar ────────────────────────────────────────
if (html.includes('site-nav')) {
  pass('DR.T14', 'review.html contains site-nav (cross-page navigation bar)');
} else {
  fail('DR.T14', 'review.html missing site-nav — cross-page navigation not added');
}

console.log(`\nDR.1 dashboard-review: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
