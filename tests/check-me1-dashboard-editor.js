/**
 * check-me1-dashboard-editor.js
 * Governance check: verifies the full-screen markdown editor overlay (me.1)
 * is wired correctly in dashboards/pipeline.html and dashboards/extra-views.css.
 *
 * Tests T1–T9 per artefacts/2026-04-22-dashboard-md-editor/test-plans/me.1-test-plan.md
 * Run: node tests/check-me1-dashboard-editor.js
 * Story: me.1-dashboard-md-editor  Feature: 2026-04-22-dashboard-md-editor
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const SUITE = '[check-me1-dashboard-editor]';

let passed = 0;
let failed = 0;

function pass(id, msg) {
  console.log('  \u2714 ' + id + ' ' + msg);
  passed++;
}

function fail(id, msg) {
  console.error('  \u2716 ' + id + ' ' + msg);
  failed++;
}

const pipelinePath = path.resolve('dashboards', 'pipeline.html');
const indexPath    = path.resolve('dashboards', 'index.html');
const cssPath      = path.resolve('dashboards', 'extra-views.css');

const pipelineHtml = fs.existsSync(pipelinePath) ? fs.readFileSync(pipelinePath, 'utf8') : '';
const indexHtml    = fs.existsSync(indexPath)    ? fs.readFileSync(indexPath,    'utf8') : '';
const cssContent   = fs.existsSync(cssPath)      ? fs.readFileSync(cssPath,      'utf8') : '';

// ── T1 — pipeline.html exists ────────────────────────────────────────────────
if (fs.existsSync(pipelinePath)) {
  pass('T1', 'dashboards/pipeline.html exists');
} else {
  fail('T1', 'dashboards/pipeline.html not found');
}

// ── T2 — editor overlay marker ───────────────────────────────────────────────
if (pipelineHtml.includes('md-editor-overlay')) {
  pass('T2', 'pipeline.html contains md-editor-overlay marker');
} else {
  fail('T2', 'pipeline.html is missing md-editor-overlay marker — MdEditorOverlay not wired');
}

// ── T3 — Copy button present ─────────────────────────────────────────────────
if (pipelineHtml.includes('Copy')) {
  pass('T3', 'pipeline.html contains Copy button text');
} else {
  fail('T3', 'pipeline.html is missing Copy button text');
}

// ── T4 — Download button present ─────────────────────────────────────────────
if (pipelineHtml.includes('Download')) {
  pass('T4', 'pipeline.html contains Download button text');
} else {
  fail('T4', 'pipeline.html is missing Download button text');
}

// ── T5 — Escape key handler ──────────────────────────────────────────────────
if (pipelineHtml.includes('Escape')) {
  pass('T5', "pipeline.html contains 'Escape' key handler");
} else {
  fail('T5', "pipeline.html is missing Escape key handler for editor close");
}

// ── T6 — CSS rule for overlay ────────────────────────────────────────────────
if (cssContent.includes('.md-editor-overlay')) {
  pass('T6', 'extra-views.css contains .md-editor-overlay rule');
} else {
  fail('T6', 'extra-views.css is missing .md-editor-overlay CSS rule');
}

// ── T7 — editorOpen state variable ───────────────────────────────────────────
if (pipelineHtml.includes('editorOpen')) {
  pass('T7', 'pipeline.html contains editorOpen state variable');
} else {
  fail('T7', 'pipeline.html is missing editorOpen state — Edit button not wired');
}

// ── T8 — clipboard API usage ─────────────────────────────────────────────────
if (pipelineHtml.includes('navigator.clipboard')) {
  pass('T8', 'pipeline.html uses navigator.clipboard for copy');
} else {
  fail('T8', 'pipeline.html is missing navigator.clipboard — Copy button not implemented');
}

// ── T9 — download implementation ─────────────────────────────────────────────
if (pipelineHtml.includes('createObjectURL')) {
  pass('T9', 'pipeline.html uses createObjectURL for file download');
} else {
  fail('T9', 'pipeline.html is missing createObjectURL — Download button not implemented');
}

// ── T10 — index.html has MdEditorOverlay ─────────────────────────────────────
if (fs.existsSync(indexPath)) {
  pass('T10', 'dashboards/index.html exists');
} else {
  fail('T10', 'dashboards/index.html not found');
}

if (indexHtml.includes('md-editor-overlay')) {
  pass('T11', 'index.html contains md-editor-overlay marker');
} else {
  fail('T11', 'index.html is missing md-editor-overlay marker — MdEditorOverlay not wired');
}

if (indexHtml.includes('editorOpen')) {
  pass('T12', 'index.html contains editorOpen state variable');
} else {
  fail('T12', 'index.html is missing editorOpen state in MdViewer');
}

if (indexHtml.includes('navigator.clipboard')) {
  pass('T13', 'index.html uses navigator.clipboard for copy');
} else {
  fail('T13', 'index.html is missing navigator.clipboard — Copy button not implemented');
}

if (indexHtml.includes('createObjectURL')) {
  pass('T14', 'index.html uses createObjectURL for file download');
} else {
  fail('T14', 'index.html is missing createObjectURL — Download button not implemented');
}

// ── Summary ───────────────────────────────────────────────────────────────────
if (failed > 0) {
  console.error(SUITE + ' ' + passed + ' passed, ' + failed + ' failed');
  process.exit(1);
} else {
  console.log(SUITE + ' PASS: all ' + passed + ' check(s) passed');
}
