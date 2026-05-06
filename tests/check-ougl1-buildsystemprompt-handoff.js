'use strict';
var assert = require('assert');
var path = require('path');
var os = require('os');

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
var tmpdir = os.tmpdir();

var queue = [];

// T1.1 — No 4th arg → no HANDOFF block
queue.push(function() {
  return test('T1.1: No 4th arg → no HANDOFF block', function() {
    var routes = freshRequire(ROUTES_PATH);
    var result = routes.buildSystemPrompt('discovery', path.join(tmpdir, 'sess'), tmpdir);
    assert.ok(!result.includes('--- HANDOFF CONTEXT ---'), 'Expected no HANDOFF CONTEXT block without 4th arg');
  });
});

// T1.2 — With priorArtefacts → contains HANDOFF block
queue.push(function() {
  return test('T1.2: priorArtefacts provided → contains HANDOFF CONTEXT', function() {
    var routes = freshRequire(ROUTES_PATH);
    var prior = [{ path: 'artefacts/test/discovery.md', content: 'Content.' }];
    var result = routes.buildSystemPrompt('benefit-metric', path.join(tmpdir, 'sess'), tmpdir, prior);
    assert.ok(result.includes('--- HANDOFF CONTEXT ---'), 'Expected --- HANDOFF CONTEXT --- in result');
  });
});

// T1.3 — Prior artefact path appears in header
queue.push(function() {
  return test('T1.3: Prior artefact path in PRIOR ARTEFACT header', function() {
    var routes = freshRequire(ROUTES_PATH);
    var prior = [{ path: 'artefacts/test/discovery.md', content: 'X' }];
    var result = routes.buildSystemPrompt('benefit-metric', path.join(tmpdir, 'sess'), tmpdir, prior);
    assert.ok(result.includes('--- PRIOR ARTEFACT: artefacts/test/discovery.md ---'), 'Expected path in PRIOR ARTEFACT header');
  });
});

// T1.4 — Content between header and END marker
queue.push(function() {
  return test('T1.4: Content appears between PRIOR ARTEFACT header and END PRIOR ARTEFACT', function() {
    var routes = freshRequire(ROUTES_PATH);
    var content = 'Discovery content — 7x3y unique.';
    var prior = [{ path: 'artefacts/test/discovery.md', content: content }];
    var result = routes.buildSystemPrompt('benefit-metric', path.join(tmpdir, 'sess'), tmpdir, prior);
    var headerStr = '--- PRIOR ARTEFACT: artefacts/test/discovery.md ---';
    var endStr = '--- END PRIOR ARTEFACT ---';
    var headerIdx = result.indexOf(headerStr);
    var endIdx = result.indexOf(endStr, headerIdx);
    assert.ok(headerIdx >= 0, 'Expected PRIOR ARTEFACT header');
    assert.ok(endIdx > headerIdx, 'Expected END PRIOR ARTEFACT after header');
    var slice = result.slice(headerIdx, endIdx);
    assert.ok(slice.includes(content), 'Expected content between header and END marker');
  });
});

// T1.5 — HANDOFF block appears before WEB UI PROTOCOL
queue.push(function() {
  return test('T1.5: HANDOFF CONTEXT appears before WEB UI PROTOCOL', function() {
    var routes = freshRequire(ROUTES_PATH);
    var prior = [{ path: 'artefacts/test/discovery.md', content: 'x' }];
    var result = routes.buildSystemPrompt('benefit-metric', path.join(tmpdir, 'sess'), tmpdir, prior);
    var handoffIdx = result.indexOf('--- HANDOFF CONTEXT ---');
    var protocolIdx = result.indexOf('--- WEB UI PROTOCOL ---');
    assert.ok(handoffIdx >= 0, 'Expected HANDOFF CONTEXT in result');
    assert.ok(protocolIdx >= 0, 'Expected WEB UI PROTOCOL in result');
    assert.ok(handoffIdx < protocolIdx, 'HANDOFF CONTEXT must appear before WEB UI PROTOCOL');
  });
});

// T1.6 — Two prior artefacts → two distinct PRIOR ARTEFACT blocks
queue.push(function() {
  return test('T1.6: Two prior artefacts → two PRIOR ARTEFACT blocks', function() {
    var routes = freshRequire(ROUTES_PATH);
    var prior = [
      { path: 'artefacts/test/discovery.md', content: 'Discovery content' },
      { path: 'artefacts/test/benefit-metric.md', content: 'Benefit metric content' }
    ];
    var result = routes.buildSystemPrompt('definition', path.join(tmpdir, 'sess'), tmpdir, prior);
    var headerCount = (result.match(/--- PRIOR ARTEFACT:/g) || []).length;
    var endCount = (result.match(/--- END PRIOR ARTEFACT ---/g) || []).length;
    assert.strictEqual(headerCount, 2, 'Expected 2 PRIOR ARTEFACT headers, got ' + headerCount);
    assert.strictEqual(endCount, 2, 'Expected 2 END PRIOR ARTEFACT markers, got ' + endCount);
    assert.ok(result.includes('Discovery content'), 'Expected first artefact content');
    assert.ok(result.includes('Benefit metric content'), 'Expected second artefact content');
  });
});

// T1.7 — Empty array → no HANDOFF block
queue.push(function() {
  return test('T1.7: Empty priorArtefacts array → no HANDOFF block', function() {
    var routes = freshRequire(ROUTES_PATH);
    var result = routes.buildSystemPrompt('discovery', path.join(tmpdir, 'sess'), tmpdir, []);
    assert.ok(!result.includes('--- HANDOFF CONTEXT ---'), 'Expected no HANDOFF CONTEXT for empty array');
  });
});

// T1.8 — Existing 3-arg call still produces WEB UI PROTOCOL
queue.push(function() {
  return test('T1.8: 3-arg call still produces WEB UI PROTOCOL section', function() {
    var routes = freshRequire(ROUTES_PATH);
    var result = routes.buildSystemPrompt('discovery', path.join(tmpdir, 'sess'), tmpdir);
    assert.ok(result.includes('--- WEB UI PROTOCOL ---'), 'Expected WEB UI PROTOCOL in 3-arg result');
  });
});

var chain = Promise.resolve();
queue.forEach(function(fn) { chain = chain.then(fn); });
chain.then(function() {
  console.log('\n--- Results ---');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
  }
  process.exit(failed > 0 ? 1 : 0);
});
