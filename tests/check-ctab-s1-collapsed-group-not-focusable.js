'use strict';

// tests/check-ctab-s1-collapsed-group-not-focusable.js -- ctab-s1
// Story: artefacts/2026-11-20-collapsed-group-tab-order/stories/ctab-s1-collapsed-group-not-focusable.md
// Test plan: artefacts/2026-11-20-collapsed-group-tab-order/test-plans/ctab-s1-test-plan.md
//
// A collapsed group on the product view used to be hidden only by
// grid-template-rows: 0fr + overflow: hidden, which clips its content to zero
// height but leaves every link and button in it in the tab order and the
// accessibility tree. This check renders the real section, loads it in jsdom,
// and asserts that a collapsed body resolves to visibility:hidden and an
// expanded one does not, and that the visibility change is delayed by the
// length of the collapse animation so the animation itself is unchanged.
// The behavioural proof (real Tab traversal) is the Playwright spec
// tests/e2e/ctab-s1-collapsed-group-tab-order.spec.js.

var assert = require('assert');
var path = require('path');
var { JSDOM } = require('jsdom');

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS] ' + name);
  } catch (err) {
    failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err));
  }
}

var productsRoute = require(path.resolve(__dirname, '../src/web-ui/routes/products.js'));

function render() {
  var items = [
    { slug: 'a-feature', name: 'A Feature', health: 'green', stage: 'discovery' }
  ];
  return productsRoute._renderConsolidatedFeaturesSection(items, [], null, 'prod-1', 'csrf-tok', null, {});
}

function ruleBody(css, selector) {
  // The body of the first rule whose selector is exactly `selector`.
  var escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  var m = css.match(new RegExp('(?:^|[}>\\s])' + escaped + '\\s*\\{([^}]*)\\}'));
  assert.ok(m, 'expected a rule for ' + selector + ' in the emitted stylesheet');
  return m[1];
}

(function() {
  var html = render();
  var css = (html.match(/<style>([\s\S]*?)<\/style>/g) || []).join('\n');
  assert.ok(css.length > 0, 'expected the section to emit a stylesheet');

  test('T1 (AC4): a collapsed group body is visibility:hidden, hidden only after the 0.25s collapse animation', function() {
    var collapsed = ruleBody(css, '.a4-module-body--collapsed');
    assert.ok(/visibility\s*:\s*hidden/.test(collapsed),
      'ctab-s1: a collapsed group body must be visibility:hidden so its links and buttons leave the tab order and the accessibility tree; rule was: ' + collapsed.trim());
    assert.ok(/transition\s*:[^;]*visibility\s+0s\s+linear\s+0\.25s/.test(collapsed),
      'ctab-s1: the visibility change must be delayed by the 0.25s of the grid-template-rows animation, so the collapse animation is unchanged; rule was: ' + collapsed.trim());
    assert.ok(/grid-template-rows\s+0\.25s/.test(collapsed),
      'ctab-s1: the collapsed rule must keep the grid-template-rows 0.25s transition');
  });

  test('T2 (AC4): an expanded group body is visible at once (no visibility delay) and is not hidden', function() {
    var base = ruleBody(css, '.a4-module-body');
    assert.ok(!/visibility\s*:\s*hidden/.test(base), 'ctab-s1: the base .a4-module-body rule must not hide the body');
    assert.ok(/visibility\s+0s\s+linear\s+0s/.test(base),
      'ctab-s1: expanding must show the content at once, so the base transition must give visibility a 0s delay; rule was: ' + base.trim());

    var dom = new JSDOM('<!DOCTYPE html><html><body>' + html + '</body></html>', { url: 'http://localhost/products/prod-1' });
    var win = dom.window;
    var body = win.document.querySelector('.a4-module-body');
    assert.ok(body, 'expected at least one group body');
    assert.ok(body.classList.contains('a4-module-body--collapsed'), 'sanity: groups start collapsed');
    assert.strictEqual(win.getComputedStyle(body).visibility, 'hidden', 'a collapsed body must resolve to visibility:hidden');
    body.classList.remove('a4-module-body--collapsed');
    assert.notStrictEqual(win.getComputedStyle(body).visibility, 'hidden', 'an expanded body must not resolve to visibility:hidden');
  });

  test('T3 (AC4): the group header is outside the hidden body, so it stays focusable', function() {
    var dom = new JSDOM('<!DOCTYPE html><html><body>' + html + '</body></html>', { url: 'http://localhost/products/prod-1' });
    var doc = dom.window.document;
    var header = doc.querySelector('.a4-module-header');
    assert.ok(header, 'expected a group header');
    assert.strictEqual(header.closest('.a4-module-body'), null, 'the header must not sit inside the collapsible body');
    assert.strictEqual(header.getAttribute('aria-expanded'), 'false', 'sanity: header starts aria-expanded=false');
    assert.ok(doc.getElementById(header.getAttribute('aria-controls')), 'aria-controls must still point at the body');
  });

  console.log('\n[ctab-s1-collapsed-group-not-focusable] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
