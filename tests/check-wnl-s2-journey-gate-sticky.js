'use strict';
var assert = require('assert');
var path = require('path');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); return Promise.resolve();
  }
}

function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

var ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

function makeSession(overrides) {
  return Object.assign({
    skillName: 'discovery',
    sessionPath: '/tmp/wnl-s2-test.md',
    systemPrompt: 'test prompt',
    turns: [{ role: 'assistant', content: 'Hello' }],
    artefactContent: '# Discovery\n\nContent.',
    artefactPath: 'artefacts/test/discovery.md',
    done: true,
    journeyId: 'wnl-s2-test-journey'
  }, overrides || {});
}

function renderChatHtml(routes, skillName, sessionOverrides) {
  var sid = 'wnl-s2-' + skillName + '-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, makeSession(Object.assign({ skillName: skillName }, sessionOverrides)));
  var body = '';
  return routes.handleGetChatHtml(
    { params: { name: skillName, id: sid }, session: { accessToken: 'tok' } },
    { writeHead: function() {}, end: function(h) { body = h || ''; } }
  ).then(function() { return body; });
}

function sliceBetween(body, startAnchor, endAnchor, fromIndex) {
  var start = body.indexOf(startAnchor, fromIndex || 0);
  assert.ok(start !== -1, 'start anchor not found: ' + startAnchor + ' (body length ' + body.length + ')');
  var end = body.indexOf(endAnchor, start);
  assert.ok(end !== -1, 'end anchor not found: ' + endAnchor + ' (body length ' + body.length + ')');
  return { text: body.slice(start, end), start: start, end: end };
}

(async function main() {
  var routes = freshRequire(ROUTES_PATH);

  await test('gate-confirm-form-unchanged: action, CSRF field, and button text unchanged', async function() {
    var body = await renderChatHtml(routes, 'discovery', {});
    var gate = sliceBetween(body, '<div class="sw-journey-gate"', '</div>');
    assert.ok(gate.text.includes('action="/api/journey/wnl-s2-test-journey/gate-confirm"'), 'form action targets gate-confirm for this journey');
    assert.ok(/name="_csrf"|_csrf/.test(gate.text), 'CSRF field present');
    assert.ok(gate.text.includes('Continue to') && gate.text.includes('&#x2192;'), 'button text still reads "Continue to ... ->"');
    assert.ok(gate.text.includes('Artefact saved'), 'caption text unchanged');
  });

  await test('gate-confirm-form-unchanged: sticky positioning present on the wrapping div only', async function() {
    var body = await renderChatHtml(routes, 'discovery', {});
    var idx = body.indexOf('<div class="sw-journey-gate"');
    assert.ok(idx !== -1, 'the exact literal string \'<div class="sw-journey-gate"\' is present (lsbm-s1 slice-boundary dependency)');
    var tagEnd = body.indexOf('>', idx);
    var openTag = body.slice(idx, tagEnd + 1);
    assert.ok(openTag.includes('position:sticky'), 'position:sticky present on the gate div');
    assert.ok(openTag.includes('bottom:0'), 'anchored to bottom:0');
  });

  await test('substep-affordance-markup-unaffected: sw-gate-substeps content unchanged, sw-journey-gate anchor still findable', async function() {
    var body = await renderChatHtml(routes, 'discovery', {});
    var slice = sliceBetween(body, '<div class="sw-gate-substeps">', '<div class="sw-journey-gate"');
    assert.ok(slice.text.includes('sw-clarify-btn'), 'clarify sub-step button present for discovery stage');
    assert.ok(slice.text.includes('sw-estimate-btn'), 'estimate sub-step button present for discovery stage');
    assert.ok(body.includes('function swLaunchClarify(e)'), 'swLaunchClarify function definition present');
    assert.ok(body.includes('window.swToggleEstimate=function(){') || body.includes('window.swToggleEstimate = function ()'), 'swToggleEstimate wiring present');
  });

  console.log('\n[wnl-s2] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
