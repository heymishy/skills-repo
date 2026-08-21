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
    // fix-forward: the separate /journey/:id/stage-review link page was
    // replaced by an inline, SSE-driven confirmation: showCommitLink() is a
    // function DEFINITION always present in the page's script (its
    // invocation is deferred to a live 'done' SSE event, which this
    // string-only unit test cannot simulate/observe -- that's E2E
    // territory). Verify the real current mechanism instead: GATE_CONFIRM_URL
    // is correctly computed from journeyId, and showCommitLink()'s own logic
    // correctly branches on it to build the real gate-confirm form.
    assert.ok(
      body.includes('GATE_CONFIRM_URL = "/api/journey/journey-abc/gate-confirm"'),
      'Expected GATE_CONFIRM_URL computed from journeyId, got body length: ' + body.length
    );
    var showCommitLinkStart = body.indexOf('function showCommitLink()');
    var showCommitLinkSrc = showCommitLinkStart !== -1 ? body.slice(showCommitLinkStart, showCommitLinkStart + 1200) : '';
    assert.ok(
      showCommitLinkSrc.includes('if(GATE_CONFIRM_URL)') &&
      showCommitLinkSrc.includes('action="') &&
      showCommitLinkSrc.includes('GATE_CONFIRM_URL'),
      'Expected showCommitLink() to conditionally build a real gate-confirm form from GATE_CONFIRM_URL'
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
    // fix-forward: no <form ...gate-confirm...> is EVER server-rendered
    // statically -- for done:true too (see T4.1), the form markup is only
    // ever constructed client-side inside showCommitLink(), itself only
    // invoked from the SSE stream's evt.done handler. So GATE_CONFIRM_URL
    // being present as a JS string literal is not a meaningful signal here
    // (it's derived from journeyId alone, per skills.js:2900, not from
    // done). The real, current signal of "is this session done" in the
    // static page is the SESSION_DONE JS variable (skills.js:2898), which
    // in turn gates whether the client auto-fires the initial __init__
    // turn (skills.js:2915) and whether a stray __init__ is a no-op
    // (skills.js:4480). Assert that instead of a form that never exists.
    assert.ok(
      body.includes('var SESSION_DONE   = false;'),
      'Expected SESSION_DONE = false in HTML when session.done is false, got body length: ' + body.length
    );
    assert.ok(
      !/<form[^>]*action="[^"]*gate-confirm[^"]*"/.test(body),
      'Expected no statically-rendered gate-confirm <form> markup'
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

// T4.6 — standalone journeyId:null + done:true → artefact-saved confirmation (no commit-preview step)
queue.push(function() {
  return test('T4.6: standalone done:true → artefact-saved confirmation shown, no dangling commit-preview link', async function() {
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
    // fix-forward: this assertion tested the wrong mechanism from the
    // start. "commit-preview" (GET /skills/:name/sessions/:id/commit-preview,
    // still real and covered by wuce24/wuce25/dsq3) belongs to the OLDER
    // guided-question-per-page flow, where an explicit review-then-commit
    // step was necessary because nothing was saved until the user
    // confirmed. The model-first SSE chat flow this handler renders
    // (handleGetChatHtml) auto-saves the artefact to disk the moment
    // `done` fires (skills.js:4901-4906, 'artefact_auto_saved' /
    // 'artefact_auto_amended' log event) -- there is nothing left to
    // preview-then-commit by the time this page can even render done:true.
    // A dead `commitUrl` local (skills.js:2877) is a leftover from before
    // that auto-save behaviour existed and is never embedded into the
    // script -- confirmed via `grep -n "commitUrl\\b"` returning only its
    // own declaration. So for a standalone session, showCommitLink()'s
    // real, current, correct behaviour is the plain-text confirmation
    // (its `else` branch, skills.js:3502-3504), not a link to a page that
    // no longer has a role in this flow. Assert that instead.
    var showCommitLinkStart = body.indexOf('function showCommitLink()');
    var showCommitLinkSrc = showCommitLinkStart !== -1 ? body.slice(showCommitLinkStart, showCommitLinkStart + 1200) : '';
    assert.ok(
      body.includes('var GATE_CONFIRM_URL = "";'),
      'Expected empty GATE_CONFIRM_URL for a standalone (no journeyId) session, body length: ' + body.length
    );
    assert.ok(
      showCommitLinkSrc.includes('Artefact saved'),
      'Expected showCommitLink() to render a plain "Artefact saved" confirmation for standalone sessions'
    );
    assert.ok(
      !body.includes('commit-preview'),
      'Expected no dangling commit-preview link in the model-first chat page — that flow no longer applies once the artefact auto-saves on done'
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
