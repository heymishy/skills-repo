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
    sessionPath: '/tmp/ougl4-test.md',
    systemPrompt: 'test prompt',
    turns: [{ role: 'assistant', content: 'Hello' }],
    artefactContent: '# Discovery\n\nContent.',
    artefactPath: 'artefacts/test/discovery.md',
    done: false,
    journeyId: null
  }, overrides || {});
}

var queue = [];

// T4.1 — journeyId + done:true → gate-confirm form present
queue.push(function() {
  return test('T4.1: journeyId + done:true → gate-confirm form in HTML', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var sid = 'ougl4-t1-' + Date.now();
    routes._setHtmlSession(sid, makeSession({
      done: true,
      journeyId: 'journey-abc',
      skillName: 'discovery'
    }));
    var body = '';
    await routes.handleGetChatHtml(
      { params: { name: 'discovery', id: sid }, session: { accessToken: 'tok' } },
      { writeHead: function() {}, end: function(h) { body = h || ''; } }
    );
    assert.ok(
      body.includes('/journey/journey-abc/stage-review'),
      'Expected stage-review link in HTML, got body length: ' + body.length
    );
  });
});

// T4.2 — journeyId + done:true + skillName:discovery → button text includes benefit-metric
queue.push(function() {
  return test('T4.2: gate-confirm button text includes next skill name (benefit-metric)', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var sid = 'ougl4-t2-' + Date.now();
    routes._setHtmlSession(sid, makeSession({
      done: true,
      journeyId: 'journey-abc',
      skillName: 'discovery'
    }));
    var body = '';
    await routes.handleGetChatHtml(
      { params: { name: 'discovery', id: sid }, session: { accessToken: 'tok' } },
      { writeHead: function() {}, end: function(h) { body = h || ''; } }
    );
    assert.ok(
      body.includes('benefit-metric'),
      'Expected "benefit-metric" in gate-confirm button/label, body length: ' + body.length
    );
  });
});

// T4.3 — journeyId:null + done:true → no /api/journey/ link
queue.push(function() {
  return test('T4.3: journeyId:null + done:true → no /api/journey/ in HTML', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var sid = 'ougl4-t3-' + Date.now();
    routes._setHtmlSession(sid, makeSession({
      done: true,
      journeyId: null,
      skillName: 'discovery'
    }));
    var body = '';
    await routes.handleGetChatHtml(
      { params: { name: 'discovery', id: sid }, session: { accessToken: 'tok' } },
      { writeHead: function() {}, end: function(h) { body = h || ''; } }
    );
    assert.ok(
      !body.includes('/api/journey/'),
      'Expected no /api/journey/ in standalone session HTML'
    );
  });
});

// T4.4 — journeyId + done:false → gate button NOT rendered
queue.push(function() {
  return test('T4.4: journeyId + done:false → gate-confirm form NOT in HTML', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var sid = 'ougl4-t4-' + Date.now();
    routes._setHtmlSession(sid, makeSession({
      done: false,
      journeyId: 'journey-abc',
      skillName: 'discovery'
    }));
    var body = '';
    await routes.handleGetChatHtml(
      { params: { name: 'discovery', id: sid }, session: { accessToken: 'tok' } },
      { writeHead: function() {}, end: function(h) { body = h || ''; } }
    );
    assert.ok(
      !body.includes('/api/journey/journey-abc/gate-confirm'),
      'Expected no gate-confirm form when done:false'
    );
  });
});

// T4.5 — definition-of-ready + done:true → link to /journey/:id/complete
queue.push(function() {
  return test('T4.5: definition-of-ready + done:true → link to /journey/:id/complete', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var sid = 'ougl4-t5-' + Date.now();
    routes._setHtmlSession(sid, makeSession({
      done: true,
      journeyId: 'journey-abc',
      skillName: 'definition-of-ready'
    }));
    var body = '';
    await routes.handleGetChatHtml(
      { params: { name: 'definition-of-ready', id: sid }, session: { accessToken: 'tok' } },
      { writeHead: function() {}, end: function(h) { body = h || ''; } }
    );
    assert.ok(
      body.includes('/journey/journey-abc/complete'),
      'Expected /journey/:id/complete link for definition-of-ready stage, body length: ' + body.length
    );
  });
});

// T4.6 — standalone journeyId:null + done:true → commit-preview link still present
queue.push(function() {
  return test('T4.6: standalone done:true → commit-preview link still present', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var sid = 'ougl4-t6-' + Date.now();
    routes._setHtmlSession(sid, makeSession({
      done: true,
      journeyId: null,
      skillName: 'discovery',
      artefactContent: '# Discovery artefact'
    }));
    var body = '';
    await routes.handleGetChatHtml(
      { params: { name: 'discovery', id: sid }, session: { accessToken: 'tok' } },
      { writeHead: function() {}, end: function(h) { body = h || ''; } }
    );
    assert.ok(
      body.includes('commit-preview'),
      'Expected commit-preview URL in standalone done:true HTML'
    );
  });
});

// T4.7 — journeyId XSS → encoded in HTML
queue.push(function() {
  return test('T4.7: journeyId XSS input → encoded in HTML output', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var sid = 'ougl4-t7-' + Date.now();
    routes._setHtmlSession(sid, makeSession({
      done: true,
      journeyId: '<script>alert(1)</script>',
      skillName: 'discovery'
    }));
    var body = '';
    await routes.handleGetChatHtml(
      { params: { name: 'discovery', id: sid }, session: { accessToken: 'tok' } },
      { writeHead: function() {}, end: function(h) { body = h || ''; } }
    );
    assert.ok(
      !body.includes('<script>alert(1)</script>'),
      'Expected raw <script> tag to be absent (should be HTML-encoded)'
    );
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
