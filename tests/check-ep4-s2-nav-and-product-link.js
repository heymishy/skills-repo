'use strict';
// check-ep4-s2-nav-and-product-link.js -- TDD tests for ep4-s2 (Epic 4,
// customer-journey feature). Story:
// artefacts/2026-10-05-customer-journey-as-first-class/stories/ep4-s2.md
// Test plan: artefacts/2026-10-05-customer-journey-as-first-class/test-plans/ep4-s2-test-plan.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function() {
  const { renderShell, NAV_ITEMS } = require('../src/web-ui/utils/html-shell');

  // ── AC1 ─────────────────────────────────────────────────────────────────
  try {
    const entry = NAV_ITEMS.find(function(item) { return item.id === 'journeys'; });
    assert.ok(entry, 'expected a NAV_ITEMS entry with id "journeys"');
    assert.strictEqual(entry.label, 'Journeys');
    assert.strictEqual(entry.href, '/customer-journeys');
    assert.notStrictEqual(entry.section, 'account', 'expected the Journeys entry in the main section, not account');

    // Render on an unrelated active page -- confirm it's persistent, not conditional.
    const html = renderShell({ active: 'org-kanban', bodyContent: '<p>test</p>', user: { login: 'tester' } });
    assert.ok(html.includes('href="/customer-journeys"'), 'expected the Journeys link to render on an unrelated active page');
    assert.ok(html.includes('>Journeys<'), 'expected the visible "Journeys" label');
    pass('AC1: "Journeys" nav link renders on every page with the correct target');
  } catch (e) { fail('AC1: "Journeys" nav link renders on every page with the correct target', e); }

  // ── AC4 ─────────────────────────────────────────────────────────────────
  try {
    const html = renderShell({ active: 'org-kanban', bodyContent: '<p>test</p>', user: { login: 'tester' } });
    const m = html.match(/<a href="\/customer-journeys"[^>]*class="sw-nav-item[^>]*>/);
    assert.ok(m, 'expected the Journeys entry to render as a real <a href> element');
    pass('AC4: the "Journeys" nav link is a real keyboard-focusable anchor');
  } catch (e) { fail('AC4: the "Journeys" nav link is a real keyboard-focusable anchor', e); }

  // ── AC2 ─────────────────────────────────────────────────────────────────
  try {
    const { _renderProductView } = require('../src/web-ui/routes/products');
    const html = _renderProductView(
      'Test Product', 'prod-1', [], 'tester', null, false, null, null,
      [], 'CSRFTOKEN', {}, {}, [], 0, null, false, {}, null,
      'journey-abc'
    );
    assert.ok(/href="\/journeys\/journey-abc"/.test(html), 'expected a "View journey" link targeting /journeys/journey-abc');
    assert.ok(/View journey/.test(html), 'expected the visible "View journey" label');
    pass('AC2: "View journey" link renders for a product with an associated journey');
  } catch (e) { fail('AC2: "View journey" link renders for a product with an associated journey', e); }

  // ── AC2 (ordering, shape) ───────────────────────────────────────────────
  try {
    const src = fs.readFileSync(path.join(__dirname, '../src/web-ui/routes/products.js'), 'utf8');
    assert.ok(/FROM customer_journeys WHERE product_id = \$1\s*\n?\s*ORDER BY created_at ASC\s*\n?\s*LIMIT 1/.test(src) ||
      /FROM customer_journeys WHERE product_id = \$1[\s\S]{0,40}ORDER BY created_at ASC[\s\S]{0,20}LIMIT 1/.test(src),
      'expected the new query to select the earliest journey (ORDER BY created_at ASC LIMIT 1)');
    pass('AC2 (ordering): the link targets the earliest journey, not an arbitrary one');
  } catch (e) { fail('AC2 (ordering): the link targets the earliest journey, not an arbitrary one', e); }

  // ── AC3 ─────────────────────────────────────────────────────────────────
  try {
    const { _renderProductView } = require('../src/web-ui/routes/products');
    const html = _renderProductView(
      'Test Product', 'prod-1', [], 'tester', null, false, null, null,
      [], 'CSRFTOKEN', {}, {}, [], 0, null, false, {}, null,
      null
    );
    assert.ok(!/View journey/.test(html), 'expected no "View journey" text when the product has no associated journey');
    assert.ok(!/href="\/journeys\//.test(html), 'expected no link targeting /journeys/ at all');
    pass('AC3: no "View journey" link when the product has no associated journeys');
  } catch (e) { fail('AC3: no "View journey" link when the product has no associated journeys', e); }

  // ── wiring shape ────────────────────────────────────────────────────────
  try {
    const src = fs.readFileSync(path.join(__dirname, '../src/web-ui/routes/products.js'), 'utf8');
    const callMatch = src.match(/_renderProductView\(productName,[\s\S]{0,600}?\);/);
    assert.ok(callMatch, 'expected to find the real _renderProductView(...) call in handleGetProductView');
    const call = callMatch[0];
    // The new argument must be the LAST one before the closing paren, not
    // inserted mid-call (which would silently misalign all 17 other args).
    assert.ok(/,\s*\w*[Jj]ourney\w*\s*\)\s*;\s*$/.test(call), 'expected the new journey-id argument to be the LAST positional argument passed to _renderProductView, got: ' + call.slice(-80));
    pass('(wiring shape): handleGetProductView wires the new query and passes its result through correctly');
  } catch (e) { fail('(wiring shape): handleGetProductView wires the new query and passes its result through correctly', e); }

  console.log(`\n[ep4-s2-nav-and-product-link] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
