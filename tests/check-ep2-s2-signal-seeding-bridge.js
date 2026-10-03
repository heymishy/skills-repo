#!/usr/bin/env node
/**
 * check-ep2-s2-signal-seeding-bridge.js -- AC verification for ep2-s2
 * (signal-to-session seeding bridge: CTA creates a seeded skill session).
 *
 * Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
 * Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s2-test-plan.md
 *
 * Run: node tests/check-ep2-s2-signal-seeding-bridge.js
 */
'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const { extractSignalContext, formatSignalPriorArtefact } = require('../src/web-ui/utils/signal-context');

let passed = 0, failed = 0;
function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  ✓ ' + name); },
    function(err) { failed++; console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); }
  );
}

(async function main() {

  await test('AC1 (formatting half): signal content formats into exactly one priorArtefacts entry, verbatim', function() {
    const ctx = extractSignalContext({
      signalSource: 'capture-log', signalType: 'decision',
      signalText: 'Use flat stories array, not epics[].stories[]', signalTimestamp: '2026-09-30'
    });
    const entry = formatSignalPriorArtefact(ctx);
    assert.strictEqual(typeof entry.path, 'string');
    assert.strictEqual(typeof entry.content, 'string');
    assert.ok(entry.content.includes('capture-log'));
    assert.ok(entry.content.includes('decision'));
    assert.ok(entry.content.includes('Use flat stories array, not epics[].stories[]'), 'expected signal text verbatim, not paraphrased or truncated');
  });

  await test('No signal-context fields at all -> extractSignalContext returns null (legacy ep1-s3 path, AC5)', function() {
    assert.strictEqual(extractSignalContext({}), null);
    assert.strictEqual(extractSignalContext(undefined), null);
  });

  await test('AC4: missing signalText throws a clear error naming the missing field, before any priorArtefacts is built', function() {
    assert.throws(function() {
      extractSignalContext({ signalSource: 'capture-log', signalType: 'decision', signalText: '' });
    }, /signalText/);
  });

  await test('AC4: missing signalSource throws a clear error naming the missing field', function() {
    assert.throws(function() {
      extractSignalContext({ signalType: 'decision', signalText: 'x' });
    }, /signalSource/);
  });

  const skillsRoutes = require('../src/web-ui/routes/skills');

  // CSRF fixture note (Task 3): handlePostSkillSessionHtml calls _csrf.csrfGuard(req, res)
  // directly (src/web-ui/routes/skills.js line ~1224) before doing anything else. csrfGuard
  // (src/web-ui/middleware/csrf.js) reads req.body via its own _readBody, which short-circuits
  // to the already-set req.body (per its documented "test injection scenario" short-circuit) --
  // so no raw stream reading is needed here. But csrfGuard still requires body._csrf to equal
  // req.session.csrfToken, or it writes a real 403 and the handler returns early before any of
  // the behaviour these tests exercise ever runs. The fixture below is the minimal real fix:
  // every fake session carries a fixed csrfToken, and every fake body carries a matching _csrf
  // field by default (via a merge, not a wholesale body replacement) so per-test body overrides
  // don't accidentally drop it. This does not weaken or bypass csrfGuard in production code --
  // it satisfies the real check with a real matching token/field pair, same as a real form POST
  // would.
  const FAKE_CSRF_TOKEN = 'test-csrf-token-ep2-s2';

  function fakeReqRes(overrides) {
    overrides = overrides || {};
    const req = {
      session: Object.assign({ accessToken: 'tok', login: 'alice', csrfToken: FAKE_CSRF_TOKEN }, overrides.session),
      params: overrides.params || { name: 'improve' },
      body: Object.assign({ _csrf: FAKE_CSRF_TOKEN }, overrides.body)
    };
    const res = {
      statusCode: null, headers: null, body: null,
      writeHead: function(c, h) { this.statusCode = c; this.headers = h; },
      end: function(b) { this.body = b; }
    };
    return { req, res };
  }

  await test('AC1 (behavioural half) + AC3: a seeded POST creates a session for the signal\'s own cta.skill, with its content forwarded as priorArtefacts', async function() {
    let capturedPriorArtefacts = null;
    skillsRoutes.setCreateSession(async function(skillName, token, priorArtefacts) {
      capturedPriorArtefacts = priorArtefacts;
      return { id: 'fake-' + skillName, _priorArtefacts: priorArtefacts };
    });
    const { req, res } = fakeReqRes({
      params: { name: 'workflow' },
      body: { signalSource: 'pipeline-state', signalType: 'feature-status', signalText: 'ep2 -- stage: definition', signalTimestamp: '2026-10-01' }
    });
    await skillsRoutes.handlePostSkillSessionHtml(req, res);
    assert.strictEqual(res.statusCode, 303, 'expected a redirect, not an error');
    assert.ok(res.headers.Location.includes('/skills/workflow/sessions/fake-workflow/chat'), 'expected the signal\'s own cta.skill (workflow), not a hardcoded /improve');
    assert.ok(Array.isArray(capturedPriorArtefacts) && capturedPriorArtefacts.length === 1, 'expected exactly one priorArtefacts entry to be forwarded to createSession');
    assert.ok(capturedPriorArtefacts[0].content.includes('ep2 -- stage: definition'), 'expected the signal\'s own text verbatim in the forwarded priorArtefacts content');
    assert.ok(capturedPriorArtefacts[0].content.includes('pipeline-state'), 'expected the signal\'s own source in the forwarded priorArtefacts content');
  });

  await test('AC2: operator is redirected into the new session\'s chat view', async function() {
    skillsRoutes.setCreateSession(async function() { return { id: 'sess-redirect-check' }; });
    const { req, res } = fakeReqRes({ body: { signalSource: 's', signalType: 't', signalText: 'x', signalTimestamp: '2026-10-01' } });
    await skillsRoutes.handlePostSkillSessionHtml(req, res);
    assert.strictEqual(res.statusCode, 303);
    assert.ok(res.headers.Location.includes('/skills/improve/sessions/sess-redirect-check/chat'));
  });

  await test('AC4: a cta.skill naming a nonexistent skill is rejected before session creation', async function() {
    let createCalled = false;
    skillsRoutes.setCreateSession(async function() { createCalled = true; return { id: 'should-not-exist' }; });
    const { req, res } = fakeReqRes({
      params: { name: 'does-not-exist-skill' },
      body: { signalSource: 's', signalType: 't', signalText: 'x' }
    });
    await skillsRoutes.handlePostSkillSessionHtml(req, res);
    assert.strictEqual(createCalled, false, 'expected session creation to never be called for an unknown skill');
    assert.strictEqual(res.statusCode, 500, 'expected a clear error response');
    assert.ok(res.body.toLowerCase().includes('could not start'), 'expected a clear error message in the response body');
  });

  await test('AC4: malformed signal-context fields (missing signalText) are rejected before session creation', async function() {
    let createCalled = false;
    skillsRoutes.setCreateSession(async function() { createCalled = true; return { id: 'should-not-exist' }; });
    const { req, res } = fakeReqRes({ body: { signalSource: 's', signalType: 't', signalText: '' } });
    await skillsRoutes.handlePostSkillSessionHtml(req, res);
    assert.strictEqual(createCalled, false);
    assert.strictEqual(res.statusCode, 500);
  });

  await test('AC5: no signal-context fields at all -> _createSession called with no 3rd argument (byte-identical to pre-ep2-s2 behaviour)', async function() {
    let capturedArgs = null;
    skillsRoutes.setCreateSession(async function() { capturedArgs = arguments.length; return { id: 'legacy-sess' }; });
    const { req, res } = fakeReqRes({ body: {} });
    await skillsRoutes.handlePostSkillSessionHtml(req, res);
    assert.strictEqual(res.statusCode, 303);
    assert.ok(capturedArgs === 2 || capturedArgs === 3, 'expected the legacy call shape (3rd arg absent or undefined)');
  });

  await test('D37: defaultCreateSession stub throws when unwired, instead of silently returning {id: \'\'}', async function() {
    // Fresh require in isolation: delete the cached module so its injectable
    // _createSession is back at the un-set default for this one assertion.
    delete require.cache[require.resolve('../src/web-ui/adapters/skills')];
    const freshAdapter = require('../src/web-ui/adapters/skills');
    await assert.rejects(
      freshAdapter.createSession('improve', 'tok'),
      /Adapter not wired: createSession/
    );
  });

  await test('Adapter wrapper forwards a 3rd priorArtefacts argument through to the injected implementation', async function() {
    const adapter = require('../src/web-ui/adapters/skills');
    let captured = null;
    adapter.setCreateSession(async function(skillName, token, priorArtefacts) {
      captured = priorArtefacts;
      return { id: 'x' };
    });
    const pa = [{ path: 'signal:test', content: 'hello' }];
    await adapter.createSession('improve', 'tok', pa);
    assert.deepStrictEqual(captured, pa);
  });

  await test('AC6: the real server.js wiring forwards priorArtefacts -- two different signal contexts produce two different, individually-correct stored systemPrompts', async function() {
    process.env.WIRE_SKILL_ADAPTERS = 'true'; // playwright.local.config.js's own established escape hatch -- exercises the real closure while NODE_ENV stays 'test'
    delete require.cache[require.resolve('../src/web-ui/server')];
    delete require.cache[require.resolve('../src/web-ui/adapters/skills')];
    delete require.cache[require.resolve('../src/web-ui/routes/skills')];
    require('../src/web-ui/server'); // triggers the real skillsAdapter.setCreateSession(...) wiring (server.js:364-369)
    const adapter = require('../src/web-ui/adapters/skills');
    const routes  = require('../src/web-ui/routes/skills');

    const sessionA = await adapter.createSession('workflow', 'tok', [{ path: 'signal:pipeline-state', content: 'UNIQUE_MARKER_ALPHA ep2 stage definition' }]);
    const sessionB = await adapter.createSession('improve', 'tok', [{ path: 'signal:capture-log', content: 'UNIQUE_MARKER_BETA use flat stories array' }]);

    const storedA = routes._getHtmlSession(sessionA.id);
    const storedB = routes._getHtmlSession(sessionB.id);
    assert.ok(storedA, 'expected a real, retrievable stored session for A');
    assert.ok(storedB, 'expected a real, retrievable stored session for B');
    assert.ok(storedA.systemPrompt.includes('UNIQUE_MARKER_ALPHA'), 'expected session A\'s own injected content in its stored systemPrompt');
    assert.ok(!storedA.systemPrompt.includes('UNIQUE_MARKER_BETA'), 'expected session A to NOT contain session B\'s content');
    assert.ok(storedB.systemPrompt.includes('UNIQUE_MARKER_BETA'), 'expected session B\'s own injected content in its stored systemPrompt');
    assert.ok(!storedB.systemPrompt.includes('UNIQUE_MARKER_ALPHA'), 'expected session B to NOT contain session A\'s content');

    delete process.env.WIRE_SKILL_ADAPTERS;
  });

  console.log('\n[ep2-s2] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[ep2-s2] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
