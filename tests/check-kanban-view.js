#!/usr/bin/env node
// check-kanban-view.js — structural tests for the Kanban board view
// Tests: renderer output, LANES definition, ideas API helpers

'use strict';

const path = require('path');
const fs   = require('fs');

const ROOT        = path.join(__dirname, '..');
const KANBAN_VIEW = path.join(ROOT, 'src', 'web-ui', 'views', 'kanban-view.js');
const IDEAS_JSON  = path.join(ROOT, 'workspace', 'ideas.json');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  ✓ ' + label); passed++; }
  else           { console.log('  ✗ ' + label); failed++; }
}

// ── T1 — kanban-view.js exists ────────────────────────────────────────────────
console.log('\n[kanban-view] T1 — kanban-view.js exists');
{
  assert(fs.existsSync(KANBAN_VIEW), 'T1: src/web-ui/views/kanban-view.js exists');
}

// ── T2 — LANES definition is correct ─────────────────────────────────────────
console.log('\n[kanban-view] T2 — LANES definition');
{
  let mod;
  try { mod = require(KANBAN_VIEW); } catch (e) { assert(false, 'T2: require failed: ' + e.message); }
  if (mod) {
    const { LANES } = mod;
    assert(Array.isArray(LANES) && LANES.length === 6, 'T2a: six lanes defined');
    const ids = LANES.map(function(l) { return l.id; });
    assert(ids[0] === 'idea',       'T2b: first lane is idea');
    assert(ids[1] === 'discovery',  'T2c: second lane is discovery');
    assert(ids[5] === 'done',       'T2d: last lane is done');
  }
}

// ── T3 — renderKanban is exported and callable ────────────────────────────────
console.log('\n[kanban-view] T3 — renderKanban function');
{
  let mod;
  try { mod = require(KANBAN_VIEW); } catch (e) { assert(false, 'T3: require failed'); }
  if (mod) {
    assert(typeof mod.renderKanban === 'function', 'T3a: renderKanban exported');
    let html;
    try { html = mod.renderKanban({ features: [], ideas: [] }); } catch (e) { assert(false, 'T3b: renderKanban threw: ' + e.message); }
    if (html !== undefined) {
      assert(typeof html === 'string' && html.length > 0, 'T3b: renderKanban returns non-empty string');
    }
  }
}

// ── T4 — board HTML contains all six lane columns ─────────────────────────────
console.log('\n[kanban-view] T4 — board HTML structure');
{
  let mod;
  try { mod = require(KANBAN_VIEW); } catch (e) {}
  if (mod) {
    const html = mod.renderKanban({ features: [], ideas: [] });
    assert(html.includes('data-lane="idea"'),       'T4a: idea lane rendered');
    assert(html.includes('data-lane="discovery"'),  'T4b: discovery lane rendered');
    assert(html.includes('data-lane="definition"'), 'T4c: definition lane rendered');
    assert(html.includes('data-lane="review"'),     'T4d: review lane rendered');
    assert(html.includes('data-lane="delivery"'),   'T4e: delivery lane rendered');
    assert(html.includes('data-lane="done"'),       'T4f: done lane rendered');
  }
}

// ── T5 — feature cards are placed in the correct lane ────────────────────────
console.log('\n[kanban-view] T5 — feature card placement');
{
  let mod;
  try { mod = require(KANBAN_VIEW); } catch (e) {}
  if (mod) {
    const features = [
      { slug: 'feat-a', title: 'Feature A', stage: 'discovery',  health: 'green', updated: '' },
      { slug: 'feat-b', title: 'Feature B', stage: 'definition', health: 'amber', updated: '' },
      { slug: 'feat-c', title: 'Feature C', stage: 'done',       health: 'green', updated: '' },
    ];
    const html = mod.renderKanban({ features, ideas: [] });
    assert(html.includes('feat-a'), 'T5a: feat-a card rendered');
    assert(html.includes('feat-b'), 'T5b: feat-b card rendered');
    assert(html.includes('feat-c'), 'T5c: feat-c card rendered');
  }
}

// ── T6 — idea cards and add-form rendered in Ideas lane ───────────────────────
console.log('\n[kanban-view] T6 — idea cards in Ideas lane');
{
  let mod;
  try { mod = require(KANBAN_VIEW); } catch (e) {}
  if (mod) {
    const ideas = [
      { id: 'idea-001', title: 'Integrate Slack alerts', notes: '', createdAt: new Date().toISOString() }
    ];
    const html = mod.renderKanban({ features: [], ideas });
    assert(html.includes('Integrate Slack alerts'), 'T6a: idea title rendered');
    assert(html.includes('kb-add-idea-form'),       'T6b: add-idea form rendered');
    assert(html.includes('Start Discovery'),        'T6c: Start Discovery link rendered');
    assert(html.includes('kb-idea-del'),            'T6d: delete button rendered');
  }
}

// ── T7 — escaping of XSS characters in titles ─────────────────────────────────
console.log('\n[kanban-view] T7 — HTML escaping');
{
  let mod;
  try { mod = require(KANBAN_VIEW); } catch (e) {}
  if (mod) {
    const ideas = [{ id: 'xss-1', title: '<script>alert(1)</script>', notes: '', createdAt: '' }];
    const html  = mod.renderKanban({ features: [], ideas });
    assert(!html.includes('<script>alert'), 'T7a: <script> tag not injected via idea title');
    assert(html.includes('&lt;script&gt;'), 'T7b: title properly escaped as &lt;script&gt;');
  }
}

// ── T8 — view-toggle links rendered ───────────────────────────────────────────
console.log('\n[kanban-view] T8 — view toggle links');
{
  let mod;
  try { mod = require(KANBAN_VIEW); } catch (e) {}
  if (mod) {
    const html = mod.renderKanban({ features: [], ideas: [] });
    assert(html.includes('href="/features"'),           'T8a: list view link present');
    assert(html.includes('href="/features?view=board"'),'T8b: board view link present');
    assert(html.includes('kb-toggle-btn--active'),      'T8c: active toggle class rendered');
  }
}

// ── T9 — workspace/ideas.json exists with correct structure ───────────────────
console.log('\n[kanban-view] T9 — workspace/ideas.json');
{
  assert(fs.existsSync(IDEAS_JSON), 'T9a: workspace/ideas.json exists');
  if (fs.existsSync(IDEAS_JSON)) {
    let parsed;
    try { parsed = JSON.parse(fs.readFileSync(IDEAS_JSON, 'utf8')); } catch (e) {}
    assert(parsed && Array.isArray(parsed.ideas), 'T9b: ideas.json has { ideas: [] } structure');
  }
}

// ── T10 — features route exports ideas handlers ───────────────────────────────
console.log('\n[kanban-view] T10 — features route exports ideas API handlers');
{
  const routePath = path.join(ROOT, 'src', 'web-ui', 'routes', 'features.js');
  let mod;
  try { mod = require(routePath); } catch (e) { assert(false, 'T10: require features.js failed: ' + e.message); }
  if (mod) {
    assert(typeof mod.handleGetIdeas    === 'function', 'T10a: handleGetIdeas exported');
    assert(typeof mod.handlePostIdea    === 'function', 'T10b: handlePostIdea exported');
    assert(typeof mod.handleDeleteIdea  === 'function', 'T10c: handleDeleteIdea exported');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n[kanban-view] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
