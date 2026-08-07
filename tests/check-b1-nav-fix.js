#!/usr/bin/env node
// check-b1-nav-fix.js — AC verification tests for b1 (Remove dead nav links and add
// the missing Org board and Home List/Board toggle), story
// artefacts/2026-07-21-web-ui-experience-redesign/stories/b1-remove-dead-links-add-missing-nav.md
//
// Tests AC1, AC3, AC4 (and AC4's own meta-requirement: the resolution check must
// genuinely fail against the pre-fix NAV_ITEMS shape, not just pass trivially).
// AC2 (List/Board toggle) is covered by tests/e2e/b1-nav-toggle.spec.js (Playwright,
// not part of npm test — ADR-018 convention).
//
// No external dependencies — Node.js built-ins only.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

function eq(actual, expected, label) {
  if (actual === expected) { console.log(`  ✓ ${label}`); passed++; }
  else {
    console.log(`  ✗ ${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    failed++;
  }
}

// ── Load module ──────────────────────────────────────────────────────────────
const { NAV_ITEMS } = require('../src/web-ui/utils/html-shell');

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Features/Actions/Status entries no longer exist in NAV_ITEMS
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nAC1 — dead nav links removed');
{
  ok(!NAV_ITEMS.find(function(i) { return i.id === 'features'; }), 'AC1.1: no features entry');
  ok(!NAV_ITEMS.find(function(i) { return i.id === 'actions'; }),  'AC1.2: no actions entry');
  ok(!NAV_ITEMS.find(function(i) { return i.id === 'status'; }),   'AC1.3: no status entry');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — an Org board entry exists, pointing to /org/kanban
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nAC3 — Org board nav entry present');
{
  const orgItem = NAV_ITEMS.find(function(i) { return i.href === '/org/kanban'; });
  ok(!!orgItem, 'AC3.1: an entry with href /org/kanban exists');
  ok(orgItem && /board/i.test(orgItem.label), 'AC3.2: its label mentions "board"');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — every remaining NAV_ITEMS href resolves to a route registered in server.js
// (matching this repo's own established dangling-reference-sweep convention from
// kbc-s1's AC5)
// ─────────────────────────────────────────────────────────────────────────────
function pathRegisteredInServer(pathname, serverSrc) {
  return serverSrc.indexOf("pathname === '" + pathname + "'") !== -1 ||
         serverSrc.indexOf('pathname === "' + pathname + '"') !== -1;
}

console.log('\nAC4 — every NAV_ITEMS href resolves to a registered route in server.js');
{
  const serverSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
  const unresolved = NAV_ITEMS.filter(function(item) {
    return !pathRegisteredInServer(item.href.split('?')[0], serverSrc);
  });
  ok(unresolved.length === 0, 'AC4.1: zero dangling NAV_ITEMS entries (unresolved: ' +
    unresolved.map(function(i) { return i.href; }).join(', ') + ')');
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4 (test validity, not the story's own behaviour) — running this same
// resolution check against a snapshot of the pre-fix NAV_ITEMS array (containing
// Features/Actions/Status) confirms it catches the real kbc-s1 gap, not just
// passing trivially against whatever shape it's given.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nAC4 (test validity) — resolution check catches the pre-fix dead links');
{
  const preFixNavItems = [
    { id: 'dashboard', href: '/dashboard' },
    { id: 'journey',   href: '/journey' },
    { id: 'skills',    href: '/skills' },
    { id: 'features',  href: '/features' },
    { id: 'actions',   href: '/actions' },
    { id: 'status',    href: '/status' }
  ];
  const serverSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
  const unresolved = preFixNavItems.filter(function(item) {
    return !pathRegisteredInServer(item.href, serverSrc);
  });
  eq(unresolved.length, 3, 'AC4.validity: pre-fix array has exactly 3 unresolved (dead) entries');
  ok(unresolved.every(function(i) { return ['features', 'actions', 'status'].indexOf(i.id) !== -1; }),
    'AC4.validity: the 3 unresolved entries are exactly features/actions/status');
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n── Summary ──`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
