'use strict';
// check-wugs-s11-remove-smug-s1-routes-and-tab.js — wugs-s11
//
// Confirms the old smug-s1 Standards tab and its DB-backed JSON API are
// fully removed (AC1: old routes 404), and the "Standards" nav link now
// points at the new repo-backed view (AC2), not duplicated.

var assert = require('assert');
var fs = require('fs');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try { fn(); console.log('PASS:', name); passed++; }
  catch (e) { console.error('FAIL:', name, '—', e.message); failed++; process.exitCode = 1; }
}

var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
var productsSrc = fs.readFileSync(require.resolve('../src/web-ui/routes/products.js'), 'utf8');

// ── AC1: old routes no longer registered (equivalent to a 404 at the
// dispatch layer -- this codebase's manual if/else-if router returns 404
// for any unmatched pathname by design, so "the route is not registered"
// IS "returns 404"; confirmed by reading the router's final else branch). ──
check('AC1: standardsTabRoute_removedFromServerJs', function () {
  assert.ok(
    !/\/products\/\[\^\/\]\+\/standards-tab/.test(serverSrc) && serverSrc.indexOf('standards-tab') === -1,
    'expected no remaining reference to the /standards-tab route in server.js'
  );
});
check('AC1: standardsPromoteRoute_removedFromServerJs', function () {
  assert.ok(
    serverSrc.indexOf('/standards/[^/]+/promote') === -1 && serverSrc.indexOf("standardsPromote") === -1,
    'expected no remaining reference to the PUT /standards/:id/promote route in server.js'
  );
});
check('AC1: standardsOptoutRoutes_removedFromServerJs', function () {
  assert.ok(
    serverSrc.indexOf('optoutPost') === -1 && serverSrc.indexOf('optoutDelete') === -1,
    'expected no remaining reference to the /standards/:id/optout routes in server.js'
  );
});

// ── AC2: nav link repointed, not duplicated ──────────────────────────────
check('AC2: standardsNavLink_repointedToGuardrailsView_exactlyOnce', function () {
  var matches = productsSrc.match(/>Standards<\/a>/g) || [];
  assert.strictEqual(matches.length, 1, 'expected exactly one "Standards"-labelled nav link, found ' + matches.length);
  assert.ok(productsSrc.indexOf("/guardrails' style") !== -1 || /\/products\/'[^']*productId[^']*'\/guardrails/.test(productsSrc),
    'expected the Standards link\'s href to point at the /guardrails route');
  assert.ok(productsSrc.indexOf('standards-tab') === -1, 'expected no remaining reference to the old /standards-tab href');
});

// ── Removed-function sanity: handleGetProductStandardsTab/_renderStandardsTab gone ──
check('AC1/AC4: oldHandlers_removedFromProductsJs', function () {
  assert.ok(productsSrc.indexOf('handleGetProductStandardsTab') === -1, 'expected handleGetProductStandardsTab to be fully removed');
  assert.ok(productsSrc.indexOf('_renderStandardsTab') === -1, 'expected _renderStandardsTab to be fully removed');
  assert.ok(productsSrc.indexOf("require('./standards')") === -1, 'expected the dead _standardsRoutes require to be removed');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
