## Implementation Plan: Signal-to-session seeding bridge — CTA creates a seeded skill session

**Story:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
**DoR:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep2-s2-dor.md
**Test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s2-test-plan.md

**Real architecture grounding (confirmed by direct code read this session, not assumed):**
- `signals-panel-view.js`'s real hidden field names are exactly `signalSource`/`signalType`/`signalText`/`signalTimestamp` (grep-confirmed against the merged `ep2-s1` file).
- `handlePostSkillSessionHtml` (`src/web-ui/routes/skills.js:1218-1248`) currently does not read `req.body` at all; `csrfGuard(req, res)` (`middleware/csrf.js:129-131`) already reads and sets `req.body` as a side effect, so the new field reads must happen after that call, not via a second body read.
- There are two injection layers for session creation, not one: the exported wrapper `createSession(skillName, token)` (`adapters/skills.js:85`) calls a module-private injectable `_createSession`, currently either `defaultCreateSession` (the non-throwing D37-non-conformant stub) or the real implementation wired via `setCreateSession`. `routes/skills.js`'s own `_createSession` (line 1096, initialised to `skillsAdapter.createSession`) is what the handler actually calls — both the adapter-level and route-level layers need their default/initial value kept compatible with a new 3rd `priorArtefacts` parameter, but only the adapter layer (`adapters/skills.js`) needs code changes; `routes/skills.js`'s own `_createSession` just needs to be *called* with the extra argument.
- `registerHtmlSession(sessionId, sessionPath, skillName, opts)` (`routes/skills.js:2467`) already accepts `opts.priorArtefacts` and threads it into `buildSystemPrompt`, which folds each entry's `content` into the generated system prompt (confirmed at `routes/skills.js:1897-1899`). The stored session object's `systemPrompt` field (`routes/skills.js:2492`) is therefore where injected signal content actually lands — this is what the AC6 wiring test inspects via the already-exported `_getHtmlSession(sessionId)` (`routes/skills.js:2552-2554`, "Expose a session entry for test inspection").
- The real production wiring (`server.js:359-369`) is gated: `if (process.env.NODE_ENV !== 'test' || process.env.WIRE_SKILL_ADAPTERS === 'true')`. Under plain `NODE_ENV=test` (every other test file in this repo), the real closure is never installed and `skillsAdapter._createSession` stays on its stub default — this is exactly why `tests/e2e/design-definition-canvas-render.spec.js`'s own comment calls the standalone `POST /api/skills/:name/sessions` endpoint "never wired to a real implementation outside the journey flow" in that spec's context. `WIRE_SKILL_ADAPTERS=true` is the real, already-established escape hatch (used by `playwright.local.config.js`) for exercising the real wiring while keeping `NODE_ENV=test`. The AC6 wiring test uses this same escape hatch.
- `require('../src/web-ui/server')` is already a precedented, safe pattern in this exact test tier — `tests/check-rcfc-s1-skills-sessions-csrf.js:60` already does `require('../src/web-ui/server').router` as a plain unit-style require (no `.listen()` call at require time; that only happens inside the `require.main === module` startup block at the bottom of `server.js`). `session-manager.js`'s `createSession()` writes to `os.tmpdir()/copilot-sessions/...`, never inside the repo — safe to exercise for real, no repo-pollution risk.
- `listAvailableSkills(repoPath)` + `validateSkillName(name, discoveredList)` (`src/adapters/skill-discovery.js`) and the route-local `_isAllowedSkillName(name)` (`routes/skills.js:298-303`, already combines path-traversal rejection + `validateSkillName`) are the real, already-existing mechanism for "named skill does not exist" — not something new to invent. It is currently module-private; this story exports it for test inspection, matching the `_getHtmlSession` convention.
- No new npm runtime dependency (discovery.md Constraints) — every piece above is already-wired, in-repo code.

---

## File map

| File | Change | Mirrors |
|------|--------|---------|
| `src/web-ui/utils/signal-context.js` | New — pure validation + formatting functions | `src/web-ui/views/signals-panel-view.js` (`ep2-s1` Task 2: new pure, independently-unit-testable module) |
| `src/web-ui/routes/skills.js` | Modified — `handlePostSkillSessionHtml` extended; `_isAllowedSkillName` exported for test inspection | Existing handler + existing `_checkSkillName`/`_isAllowedSkillName` convention |
| `src/web-ui/adapters/skills.js` | Modified — `createSession`/`_createSession`/`defaultCreateSession` gain a 3rd `priorArtefacts` param; stub default now throws (D37 fix) | `getNextQuestion`/`submitAnswer` adapters in the same file, which already throw |
| `src/web-ui/server.js` | Modified — ~1 line in the existing wiring closure (line 364-369) | Same wiring block |
| `tests/check-ep2-s2-signal-seeding-bridge.js` | New — unit + integration + D37 + AC6 wiring tests | `tests/check-ep2-s1-signals-panel.js`, `tests/check-rcfc-s1-skills-sessions-csrf.js` (the `require('../src/web-ui/server')` convention) |

---

## Task 1 — Write failing unit tests for signal-context extraction/formatting (AC1 formatting-half, AC4 validation) [RED]

**File:** `tests/check-ep2-s2-signal-seeding-bridge.js` (new)

```javascript
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

  console.log('\n[ep2-s2] Results: ' + passed + ' passed, ' + failed + ' failed (partial run -- tasks 3/5/7 append more)');
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[ep2-s2] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
```

**Run:** `node tests/check-ep2-s2-signal-seeding-bridge.js`
**Expected output:** `Cannot find module '../src/web-ui/utils/signal-context'` (RED — module does not exist yet).

**Commit message:** `test(ep2-s2): add failing unit tests for signal-context extraction/formatting`

---

## Task 2 — Implement signal-context.js to make Task 1's tests pass [GREEN]

**File:** `src/web-ui/utils/signal-context.js` (new)

```javascript
'use strict';
// signal-context.js -- ep2-s2: pure functions turning a signal's hidden form
// fields (ep2-s1's own signalSource/signalType/signalText/signalTimestamp
// convention) into a single priorArtefacts-shaped entry (ADR-023). No I/O,
// no adapter calls -- independently unit-testable in isolation, matching
// ep2-s1's own views/signals-panel-view.js precedent.

const REQUIRED_FIELDS = ['signalSource', 'signalType', 'signalText'];

/**
 * @param {object} body — req.body after csrfGuard's own body-read side effect
 * @returns {{source:string,type:string,text:string,timestamp:?string}|null}
 *   null when no signal-context field is present at all (the existing ep1-s3
 *   non-seeded CTA shape -- AC5 byte-identical path).
 * @throws {Error} when some but not all required fields are present/non-empty
 */
function extractSignalContext(body) {
  body = body || {};
  const hasAny = !!(body.signalSource || body.signalType || body.signalText || body.signalTimestamp);
  if (!hasAny) return null;

  const missing = REQUIRED_FIELDS.filter(function(f) { return !body[f]; });
  if (missing.length > 0) {
    throw new Error('Missing required signal field(s): ' + missing.join(', '));
  }

  return {
    source:    body.signalSource,
    type:      body.signalType,
    text:      body.signalText,
    timestamp: body.signalTimestamp || null
  };
}

/**
 * @param {{source:string,type:string,text:string,timestamp:?string}} ctx
 * @returns {{path:string,content:string}} a single priorArtefacts entry (ADR-023)
 */
function formatSignalPriorArtefact(ctx) {
  const content = [
    'Signal source: ' + ctx.source,
    'Signal type: ' + ctx.type,
    'Signal timestamp: ' + (ctx.timestamp || 'unknown'),
    '',
    ctx.text
  ].join('\n');
  return { path: 'signal:' + ctx.source, content: content };
}

module.exports = { extractSignalContext, formatSignalPriorArtefact };
```

**Run:** `node tests/check-ep2-s2-signal-seeding-bridge.js`
**Expected output:** `[ep2-s2] Results: 4 passed, 0 failed (partial run -- tasks 3/5/7 append more)`

**Commit message:** `feat(ep2-s2): add signal-context extraction/formatting helper (AC1, AC4)`

---

## Task 3 — Write failing integration tests for the extended POST handler (AC1 behavioural-half, AC2, AC3, AC4 skill-not-found, AC5 regression) [RED]

**File:** append to `tests/check-ep2-s2-signal-seeding-bridge.js`, replacing the `console.log('\n[ep2-s2] Results...')` footer each time (shown once at the end of Task 7, not repeated per task below):

```javascript
  const skillsRoutes = require('../src/web-ui/routes/skills');

  function fakeReqRes(overrides) {
    const req = Object.assign({
      session: { accessToken: 'tok', login: 'alice' },
      params: { name: 'improve' },
      body: {}
    }, overrides);
    const res = {
      statusCode: null, headers: null, body: null,
      writeHead: function(c, h) { this.statusCode = c; this.headers = h; },
      end: function(b) { this.body = b; }
    };
    return { req, res };
  }

  await test('AC1 (behavioural half) + AC3: a seeded POST creates a session for the signal\'s own cta.skill, with its content in the stored systemPrompt', async function() {
    skillsRoutes.setCreateSession(async function(skillName, token, priorArtefacts) {
      return { id: 'fake-' + skillName, _priorArtefacts: priorArtefacts };
    });
    const { req, res } = fakeReqRes({
      params: { name: 'workflow' },
      body: { signalSource: 'pipeline-state', signalType: 'feature-status', signalText: 'ep2 -- stage: definition', signalTimestamp: '2026-10-01' }
    });
    await skillsRoutes.handlePostSkillSessionHtml(req, res);
    assert.strictEqual(res.statusCode, 303, 'expected a redirect, not an error');
    assert.ok(res.headers.Location.includes('/skills/workflow/sessions/fake-workflow/chat'), 'expected the signal\'s own cta.skill (workflow), not a hardcoded /improve');
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
    assert.strictEqual(res.statusCode, 500);
    assert.ok(res.body.includes('does-not-exist-skill') === false || res.body.toLowerCase().includes('could not start'), 'expected a clear error page, not a partial session');
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
```

**Run:** `node tests/check-ep2-s2-signal-seeding-bridge.js`
**Expected output:** First new test fails with `TypeError` or an assertion mismatch — `handlePostSkillSessionHtml` does not yet read `req.body`'s signal fields, does not yet validate skill existence for the seeded path, and `_createSession` is not yet called with a 3rd argument (RED).

**Commit message:** `test(ep2-s2): add failing integration tests for the extended POST /api/skills/:name/sessions handler`

---

## Task 4 — Extend handlePostSkillSessionHtml to make Task 3's tests pass [GREEN]

**File:** `src/web-ui/routes/skills.js` — replace the body of `handlePostSkillSessionHtml` (lines 1218-1248):

```javascript
async function handlePostSkillSessionHtml(req, res) {
  if (!req.session || !req.session.accessToken) {
    res.writeHead(302, { Location: '/auth/github' });
    res.end();
    return;
  }
  const csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;
  const skillName = (req.params && req.params.name) || '';
  try {
    const token = req.session.accessToken;
    // ep2-s2: when ep2-s1's signal CTA form submits signal-context hidden
    // fields, seed the new session with that content as a single named
    // priorArtefacts entry (ADR-023). Absent fields -> undefined priorArtefacts
    // -> byte-identical to ep1-s3's own pre-ep2-s2 behaviour (AC5).
    const signalContext = extractSignalContext(req.body);
    let priorArtefacts;
    if (signalContext) {
      if (!_isAllowedSkillName(skillName)) {
        throw new Error('Unknown skill: ' + skillName);
      }
      priorArtefacts = [formatSignalPriorArtefact(signalContext)];
    }
    const session = await _createSession(skillName, token, priorArtefacts);
    const id      = session && session.id;
    res.writeHead(303, { Location: '/skills/' + encodeURIComponent(skillName) + '/sessions/' + encodeURIComponent(id) + '/chat' });
    res.end();
  } catch (err) {
    _logger.error('handlePostSkillSessionHtml: ' + err.message);
    // npwe-s1: session creation failed, so there's no sessionId to resolve a
    // journey/product from -- same "no session context" case as the skills list.
    const _nav = await _getSkillsNavContext(req, null);
    const html = renderShell({
      title:       'Error',
      bodyContent: '<p>Could not start skill session: ' + escHtml(err.message) + '</p>',
      user:        { login: (req.session && req.session.login) || '' },
      active:      'skills',
      products: _nav.products, activeProductId: _nav.activeProductId, noProductJourneyCount: _nav.noProductJourneyCount
    });
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}
```

Add the require near the top of `routes/skills.js` (alongside the other internal module requires):
```javascript
const { extractSignalContext, formatSignalPriorArtefact } = require('../utils/signal-context'); // ep2-s2
```

Export `_isAllowedSkillName` for test inspection — add to the existing `module.exports` block (alongside `_getHtmlSession`, matching the same "test inspection" comment convention):
```javascript
  // ep2-s2 — test inspection seam for the skill-existence check used by the
  // signal-seeded POST path's AC4 validation.
  _isAllowedSkillName,
```

**Run:** `node tests/check-ep2-s2-signal-seeding-bridge.js`
**Expected output:** `[ep2-s2] Results: 9 passed, 0 failed (partial run -- task 7 appends more)`

**Commit message:** `feat(ep2-s2): extend POST /api/skills/:name/sessions to seed sessions from signal context (AC1-AC5)`

---

## Task 5 — Write failing D37 adapter tests (stub-throw fix, 3-arg signature) [RED]

**File:** append to `tests/check-ep2-s2-signal-seeding-bridge.js`:

```javascript
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
```

**Run:** `node tests/check-ep2-s2-signal-seeding-bridge.js`
**Expected output:** The first new test fails — the current stub returns `{id: ''}` instead of rejecting (RED).

**Commit message:** `test(ep2-s2): add failing D37 tests for the createSession adapter stub and 3-arg signature`

---

## Task 6 — Fix the adapter to make Task 5's tests pass [GREEN]

**File:** `src/web-ui/adapters/skills.js`

Replace the stub default (lines 19-24):
```javascript
/** @type {function(string, string, Array=): Promise<{id:string}>} */
let _createSession = async function defaultCreateSession(skillName, token, priorArtefacts) {
  void skillName; void token; void priorArtefacts;
  throw new Error('Adapter not wired: createSession. Call setCreateSession() with a real implementation before use.');
};
```

Replace the exported wrapper (lines 79-87):
```javascript
/**
 * Create a new skill session.
 * @param {string} skillName
 * @param {string} token — GitHub access token
 * @param {Array<{path:string,content:string}>} [priorArtefacts] — ep2-s2: optional signal context to seed the session with (ADR-023)
 * @returns {Promise<{id:string}>}
 */
async function createSession(skillName, token, priorArtefacts) {
  return _createSession(skillName, token, priorArtefacts);
}
```

**Run:** `node tests/check-ep2-s2-signal-seeding-bridge.js`
**Expected output:** `[ep2-s2] Results: 11 passed, 0 failed (partial run -- task 7 appends more)`

**Commit message:** `fix(ep2-s2): createSession adapter stub now throws when unwired (D37); thread priorArtefacts through the wrapper`

---

## Task 7 — Write the failing AC6 wiring behavioural-correctness test [RED]

Per D37 rule 3, this is a separate task from Task 3/4's handler work — it exercises the *real* `server.js` wiring closure, not a re-implementation of it.

**File:** append to `tests/check-ep2-s2-signal-seeding-bridge.js`:

```javascript
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
```

(This replaces the Task-1 footer — the final `console.log`/`process.exit`/`.catch` block appears exactly once, at the true end of the file.)

**Run:** `node tests/check-ep2-s2-signal-seeding-bridge.js`
**Expected output:** Fails — `server.js`'s real wiring closure does not yet forward a 3rd argument to `registerHtmlSession`, so both sessions' `systemPrompt` lack the injected markers (RED).

**Commit message:** `test(ep2-s2): add failing AC6 behavioural-correctness test for the real server.js wiring`

---

## Task 8 — Wire the real implementation to forward priorArtefacts (AC6) [GREEN]

Per D37 rule 3, a separate task from the handler work in Task 3/4.

**File:** `src/web-ui/server.js` — replace the existing closure at lines 364-369:

```javascript
  skillsAdapter.setCreateSession(async function(skillName, _token, priorArtefacts) {
    const sessionPath = sessionManager.createSession('html-' + skillName);
    const id = _path.basename(sessionPath);
    registerHtmlSession(id, sessionPath, skillName, priorArtefacts ? { priorArtefacts: priorArtefacts } : undefined);
    return { id };
  });
```

**Run:** `node tests/check-ep2-s2-signal-seeding-bridge.js`
**Expected output:** `[ep2-s2] Results: 12 passed, 0 failed`

**Commit message:** `feat(ep2-s2): wire the real createSession implementation to forward priorArtefacts (AC6)`

---

## Task 9 — Full regression + verification pass

**Run:** `npm test`
**Expected output:** No new failures beyond the already-acknowledged pre-existing `tests/check-p3.5-validate-trace.js` failure (confirmed clean baseline at `/branch-setup`: 709/710).

**Run:** `node tests/check-ep1-s3-skill-launcher.js`
**Expected output:** All 9 of `ep1-s3`'s own existing tests still pass unmodified — confirms this story's extension to the same endpoint is additive only (AC5).

**Run:** `node tests/check-ep2-s1-signals-panel.js`
**Expected output:** All still pass unmodified — confirms no regression to the signals panel this story's own form fields originate from.

**Commit message:** `chore(ep2-s2): final regression pass`
