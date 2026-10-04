#!/usr/bin/env node
/**
 * check-sptu-s1-signals-nav.js -- AC verification for sptu-s1
 * (add /signals to the main navigation).
 *
 * Story: artefacts/2026-10-04-signals-panel-triage-ux/stories/sptu-s1.md
 * Test plan: artefacts/2026-10-04-signals-panel-triage-ux/test-plans/sptu-s1-test-plan.md
 *
 * Run: node tests/check-sptu-s1-signals-nav.js
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_SHELL_PATH = path.join(ROOT, 'src/web-ui/utils/html-shell.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++; console.log('  ✓ ' + name);
  } catch (err) {
    failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err));
  }
}

// Mirrors check-b2-account-nav.js's own pathRegisteredInServer helper exactly
// (kept local rather than extracted into a shared module, matching that
// file's own precedent of not touching an already-merged, working test file).
function pathRegisteredInServer(pathname, serverSrc) {
  return serverSrc.indexOf("pathname === '" + pathname + "'") !== -1 ||
         serverSrc.indexOf('pathname === "' + pathname + '"') !== -1;
}

function extractMainNav(html) {
  const start = html.indexOf('<nav aria-label="Main navigation">');
  const end = html.indexOf('</nav>', start);
  return html.slice(start, end);
}

(function main() {
  const shell = require(HTML_SHELL_PATH);

  test('AC1: renderShell includes a "Signals" nav row linking to /signals, in the main section', function() {
    const html = shell.renderShell({ title: 'T', bodyContent: '<p>x</p>', user: { login: 'testuser' }, active: 'org-kanban' });
    const mainNav = extractMainNav(html);
    assert.ok(mainNav.includes('href="/signals"'), 'expected href="/signals" inside the main navigation section');
    assert.ok(mainNav.includes('>Signals<'), 'expected visible "Signals" text inside the main navigation section');
  });

  test('AC2: the Signals row (and only the Signals row) is active when active="signals"', function() {
    const html = shell.renderShell({ title: 'T', bodyContent: '<p>x</p>', user: { login: 'testuser' }, active: 'signals' });
    const signalsLinkMatch = html.match(/<a href="\/signals"[^>]*>/);
    assert.ok(signalsLinkMatch, 'expected a /signals link in the rendered sidebar');
    assert.ok(signalsLinkMatch[0].includes('sw-nav-item--active'), 'expected the /signals link to carry sw-nav-item--active');

    const orgKanbanMatch = html.match(/<a href="\/org\/kanban"[^>]*>/);
    assert.ok(orgKanbanMatch, 'expected an /org/kanban link in the rendered sidebar');
    assert.ok(!orgKanbanMatch[0].includes('sw-nav-item--active'), 'expected /org/kanban to NOT be active when active="signals"');
  });

  test('AC3: zero dangling NAV_ITEMS entries after the new Signals row is added', function() {
    const serverSrc = fs.readFileSync(path.join(ROOT, 'src/web-ui/server.js'), 'utf8');
    const unresolved = shell.NAV_ITEMS.filter(function(item) {
      return !pathRegisteredInServer(item.href.split('?')[0], serverSrc);
    });
    assert.strictEqual(unresolved.length, 0,
      'unresolved NAV_ITEMS hrefs: ' + unresolved.map(function(i) { return i.href; }).join(', '));
  });

  test('AC4: the Signals nav link has no tabindex override', function() {
    const html = shell.renderShell({ title: 'T', bodyContent: '<p>x</p>', user: { login: 'testuser' }, active: 'org-kanban' });
    const signalsLinkMatch = html.match(/<a href="\/signals"[^>]*>/);
    assert.ok(signalsLinkMatch, 'expected a /signals link in the rendered sidebar');
    assert.ok(!signalsLinkMatch[0].includes('tabindex'), 'expected no tabindex override on the Signals nav link');
  });

  console.log('\n[sptu-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
