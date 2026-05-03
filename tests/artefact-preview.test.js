'use strict';
/**
 * artefact-preview.test.js — AC verification for wuce.14
 * 18 tests: T1 (session state polling, 4), T2 (artefact extraction, 4),
 *           T3 (sanitisation, 4), T4 (commit button DOM, 3),
 *           NFR1-NFR3 (3 NFR), INT1-INT3 (integration)
 *
 * All tests FAIL until implementation exists (TDD entry condition).
 */
const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

let passed = 0, failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    process.stdout.write('  \u2713 ' + name + '\n');
  } catch (err) {
    failed++;
    failures.push({ name, err });
    process.stdout.write('  \u2717 ' + name + ': ' + err.message + '\n');
  }
}

// ---------------------------------------------------------------------------
// T1 — Session state polling endpoint (GET /api/skills/:name/sessions/:id/state)
// ---------------------------------------------------------------------------

async function runT1() {
  process.stdout.write('\nT1 — Session state polling\n');

  const { handleGetSessionState, sessionStore } = require('../src/web-ui/routes/skill-state');

  function makeReq(overrides) {
    return Object.assign({ session: { accessToken: 'ghp_test', userId: 'user-1' }, params: {}, body: {} }, overrides);
  }
  function makeRes() {
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    return res;
  }

  await test('T1.1 — returns status, currentQuestion, and partialArtefact for active session', async () => {
    const sid = 'test-t1-1';
    sessionStore.set(sid, {
      userId: 'user-1',
      skillName: 'discovery',
      status: 'running',
      currentQuestion: 'What problem are you solving?',
      events: [{ type: 'artefact', phase: 'partial', content: 'Partial discovery...' }]
    });
    const req = makeReq({ params: { id: sid } });
    const res = makeRes();
    handleGetSessionState(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert(res.body.status, 'no status in response');
    assert('currentQuestion' in res.body, 'no currentQuestion in response');
    assert('partialArtefact' in res.body, 'no partialArtefact in response');
    sessionStore.delete(sid);
  });

  await test('T1.2 — returns 404 for unknown session ID', async () => {
    const req = makeReq({ params: { id: 'nonexistent-session-xyz' } });
    const res = makeRes();
    handleGetSessionState(req, res);
    assert.strictEqual(res.statusCode, 404);
  });

  await test('T1.3 — returns 403 when session belongs to a different authenticated user', async () => {
    const sid = 'test-t1-3';
    sessionStore.set(sid, {
      userId: 'other-user',
      skillName: 'discovery',
      status: 'running',
      currentQuestion: null,
      events: []
    });
    const req = makeReq({ session: { accessToken: 'ghp_test', userId: 'user-1' }, params: { id: sid } });
    const res = makeRes();
    handleGetSessionState(req, res);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.error, 'SESSION_FORBIDDEN');
    sessionStore.delete(sid);
  });

  await test('T1.4 — returns 401 when not authenticated', async () => {
    const req = makeReq({ session: {}, params: { id: 'any-session' } });
    const res = makeRes();
    handleGetSessionState(req, res);
    assert.strictEqual(res.statusCode, 401);
  });
}

// ---------------------------------------------------------------------------
// T2 — Artefact extraction from JSONL output
// Module under test: src/artefact-extractor.js
// ---------------------------------------------------------------------------

async function runT2() {
  process.stdout.write('\nT2 — Artefact extraction\n');

  const { extractArtefactFromEvents } = require('../src/artefact-extractor');
  const successFixture = path.join(__dirname, 'fixtures/cli/copilot-cli-success.jsonl');

  await test('T2.1 — extracts content field from artefact event in success fixture', async () => {
    const events = fs.readFileSync(successFixture, 'utf8')
      .split('\n').filter(Boolean).map(JSON.parse);
    const result = extractArtefactFromEvents(events);
    assert(result.content, 'content should be non-null');
  });

  await test('T2.2 — phase:complete event marks artefact as complete:true', async () => {
    const events = fs.readFileSync(successFixture, 'utf8')
      .split('\n').filter(Boolean).map(JSON.parse);
    const result = extractArtefactFromEvents(events);
    assert.strictEqual(result.complete, true, 'complete should be true');
  });

  await test('T2.3 — no artefact events → content:null, complete:false', async () => {
    const events = [
      { type: 'skill_start', skillName: 'discovery' },
      { type: 'question', skillName: 'discovery', id: 'q1', text: 'What problem?' }
    ];
    const result = extractArtefactFromEvents(events);
    assert.strictEqual(result.content, null, 'content should be null');
    assert.strictEqual(result.complete, false, 'complete should be false');
  });

  await test('T2.4 — multiple artefact events → last one wins', async () => {
    const events = [
      { type: 'artefact', skillName: 'discovery', phase: 'partial', content: 'First draft' },
      { type: 'artefact', skillName: 'discovery', phase: 'partial', content: 'Second draft' },
      { type: 'artefact', skillName: 'discovery', phase: 'complete', content: 'Final artefact' }
    ];
    const result = extractArtefactFromEvents(events);
    assert.strictEqual(result.content, 'Final artefact');
    assert.strictEqual(result.complete, true);
  });
}

// ---------------------------------------------------------------------------
// T3 — Sanitisation before returning artefact content to browser
// Module under test: src/artefact-sanitiser.js
// ---------------------------------------------------------------------------

async function runT3() {
  process.stdout.write('\nT3 — Artefact sanitisation\n');

  const { sanitiseArtefactContent } = require('../src/artefact-sanitiser');

  await test('T3.1 — script injection in artefact content is stripped', async () => {
    const dirty = '## Discovery\n\n<script>alert("xss")</script>\n\nLegitimate content.';
    const clean = sanitiseArtefactContent(dirty);
    assert(!clean.includes('<script>'), '<script> tag not stripped');
    assert(clean.includes('Legitimate content.'), 'legitimate content removed');
  });

  await test('T3.2 — iframe injection stripped', async () => {
    const dirty = '## Section\n\n<iframe src="https://evil.example"></iframe>';
    const clean = sanitiseArtefactContent(dirty);
    assert(!clean.includes('<iframe'), '<iframe not stripped');
  });

  await test('T3.3 — clean markdown content returned intact (no over-sanitisation)', async () => {
    const clean_md = '## Discovery: AI Pipeline\n\n**Problem:** Manual effort.\n\n- Item 1\n- Item 2';
    const result = sanitiseArtefactContent(clean_md);
    assert(result.includes('Discovery: AI Pipeline'), 'heading removed');
    assert(result.includes('Problem:'), 'bold text removed');
    assert(result.includes('Item 1'), 'list item removed');
  });

  await test('T3.4 — raw CLI JSONL format never present in session state response', async () => {
    const { handleGetSessionState, sessionStore } = require('../src/web-ui/routes/skill-state');
    const sid = 'test-t3-4';
    sessionStore.set(sid, {
      userId: 'user-1',
      skillName: 'discovery',
      status: 'running',
      currentQuestion: null,
      events: [{ type: 'artefact', phase: 'partial', content: 'Safe content' }]
    });
    const req = { session: { accessToken: 'ghp_test', userId: 'user-1' }, params: { id: sid }, body: {} };
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    handleGetSessionState(req, res);
    const bodyStr = JSON.stringify(res.body);
    // Raw JSONL fields (type, phase as event keys) must not appear as raw event objects
    assert(!Array.isArray(res.body), 'response body should not be an array of events');
    assert(!bodyStr.includes('"events"'), 'raw events array in response');
    assert(res.body.partialArtefact !== undefined, 'partialArtefact not in response');
    sessionStore.delete(sid);
  });
}

// ---------------------------------------------------------------------------
// T4 — "Commit artefact" button activation (DOM state via preview-renderer)
// Module under test: src/preview-renderer.js
// ---------------------------------------------------------------------------

async function runT4() {
  process.stdout.write('\nT4 — Preview panel DOM state\n');

  const { JSDOM } = require('jsdom');
  const { renderPreviewPanel } = require('../src/preview-renderer');

  await test('T4.1 — commit button has disabled attribute when complete:false', async () => {
    const doc = new JSDOM('<div id="root"></div>').window.document;
    renderPreviewPanel(doc, { content: 'Partial content...', complete: false });
    const btn = doc.querySelector('[data-action="commit-artefact"]');
    assert(btn !== null, 'commit button not rendered');
    assert.strictEqual(btn.disabled, true, 'button should be disabled');
  });

  await test('T4.2 — commit button does NOT have disabled attribute when complete:true', async () => {
    const doc = new JSDOM('<div id="root"></div>').window.document;
    renderPreviewPanel(doc, { content: 'Final artefact content', complete: true });
    const btn = doc.querySelector('[data-action="commit-artefact"]');
    assert.strictEqual(btn.disabled, false, 'button should not be disabled');
  });

  await test('T4.3 — preview panel has aria-live="polite" attribute', async () => {
    const doc = new JSDOM('<div id="root"></div>').window.document;
    renderPreviewPanel(doc, { content: 'Some content', complete: false });
    const panel = doc.querySelector('[data-role="artefact-preview"]');
    assert(panel !== null, 'preview panel not rendered');
    assert.strictEqual(panel.getAttribute('aria-live'), 'polite', 'aria-live not set');
  });
}

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

async function runNFR() {
  process.stdout.write('\nNFR\n');

  await test('NFR1 — session state endpoint responds within 500ms', async () => {
    const { handleGetSessionState, sessionStore } = require('../src/web-ui/routes/skill-state');
    const sid = 'test-nfr1';
    sessionStore.set(sid, {
      userId: 'user-1', skillName: 'discovery', status: 'running', currentQuestion: null,
      events: [{ type: 'artefact', phase: 'partial', content: 'Content' }]
    });
    const req = { session: { accessToken: 'ghp_test', userId: 'user-1' }, params: { id: sid }, body: {} };
    const res = { statusCode: 200, headers: {}, body: null };
    res.writeHead = function(code, hdrs) { res.statusCode = code; Object.assign(res.headers, hdrs || {}); };
    res.end = function(data) { try { res.body = JSON.parse(data); } catch(_) { res.body = data; } };
    const start = Date.now();
    handleGetSessionState(req, res);
    const elapsed = Date.now() - start;
    assert(elapsed < 500, 'Response took ' + elapsed + 'ms (>500ms)');
    assert.strictEqual(res.statusCode, 200);
    sessionStore.delete(sid);
  });

  await test('NFR2 — aria-live is a real DOM attribute (not CSS class or data attribute)', async () => {
    const { JSDOM } = require('jsdom');
    const { renderPreviewPanel } = require('../src/preview-renderer');
    const doc = new JSDOM('<div id="root"></div>').window.document;
    renderPreviewPanel(doc, { content: 'Content', complete: false });
    const panel = doc.querySelector('[data-role="artefact-preview"]');
    assert(panel.hasAttribute('aria-live'), 'aria-live attribute missing');
    assert.strictEqual(panel.getAttribute('aria-live'), 'polite', 'aria-live value wrong');
  });

  await test('NFR3 — preview panel heading is a heading element (h2 or h3)', async () => {
    const { JSDOM } = require('jsdom');
    const { renderPreviewPanel } = require('../src/preview-renderer');
    const doc = new JSDOM('<div id="root"></div>').window.document;
    renderPreviewPanel(doc, { content: 'Content', complete: false });
    const heading = doc.querySelector('[data-role="artefact-preview"] h2, [data-role="artefact-preview"] h3');
    assert(heading !== null, 'no heading element in preview panel');
  });
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

async function runINT() {
  process.stdout.write('\nINT — Integration\n');

  await test('INT1 — answer submission → poll state → preview content updated (full round-trip)', async () => {
    const { handleGetSessionState, sessionStore } = require('../src/web-ui/routes/skill-state');
    const { extractArtefactFromEvents } = require('../src/artefact-extractor');
    const sid = 'test-int1';
    // Initial state — no artefact yet
    sessionStore.set(sid, {
      userId: 'user-1', skillName: 'discovery', status: 'waiting_for_input',
      currentQuestion: 'What problem are you solving?', events: []
    });
    const makeReq2 = () => ({ session: { accessToken: 'ghp_test', userId: 'user-1' }, params: { id: sid }, body: {} });
    const makeRes2 = () => {
      const r = { statusCode: 200, headers: {}, body: null };
      r.writeHead = function(code, hdrs) { r.statusCode = code; Object.assign(r.headers, hdrs || {}); };
      r.end = function(data) { try { r.body = JSON.parse(data); } catch(_) { r.body = data; } };
      return r;
    };
    const res1 = makeRes2(); handleGetSessionState(makeReq2(), res1);
    assert.strictEqual(res1.statusCode, 200);
    assert.strictEqual(res1.body.partialArtefact, null, 'no artefact before answer');
    // Simulate answer arriving and partial artefact event
    const entry = sessionStore.get(sid);
    entry.events.push({ type: 'artefact', phase: 'partial', content: 'Partial discovery...' });
    entry.status = 'running'; entry.currentQuestion = null;
    const res2 = makeRes2(); handleGetSessionState(makeReq2(), res2);
    assert.strictEqual(res2.statusCode, 200);
    assert(res2.body.partialArtefact, 'artefact content should be present after answer');
    sessionStore.delete(sid);
  });

  await test('INT2 — complete artefact event → complete:true in state → commit button enabled', async () => {
    const { extractArtefactFromEvents } = require('../src/artefact-extractor');
    const { JSDOM } = require('jsdom');
    const { renderPreviewPanel } = require('../src/preview-renderer');
    const events = [{ type: 'artefact', phase: 'complete', content: 'Final artefact' }];
    const { content, complete } = extractArtefactFromEvents(events);
    assert.strictEqual(complete, true, 'complete should be true');
    const doc = new JSDOM('<div id="root"></div>').window.document;
    renderPreviewPanel(doc, { content, complete });
    const btn = doc.querySelector('[data-action="commit-artefact"]');
    assert(btn !== null, 'commit button not rendered');
    assert.strictEqual(btn.disabled, false, 'commit button should be enabled for complete artefact');
  });

  await test('INT3 — sanitisation pipeline: injection attempt in artefact event → clean state response', async () => {
    const { extractArtefactFromEvents } = require('../src/artefact-extractor');
    const { sanitiseArtefactContent }   = require('../src/artefact-sanitiser');
    const events = [{
      type: 'artefact', phase: 'complete',
      content: 'Clean content<script>alert("xss")</script> more text'
    }];
    const { content, complete } = extractArtefactFromEvents(events);
    assert(content, 'content should be extracted');
    const clean = sanitiseArtefactContent(content);
    assert(!clean.includes('<script>'), '<script> injection not sanitised');
    assert(clean.includes('Clean content'), 'legitimate content was removed');
    assert.strictEqual(complete, true, 'should be marked complete');
  });
}

// ---------------------------------------------------------------------------
// Fixture guard
// ---------------------------------------------------------------------------

function checkFixtures() {
  const successFixture = path.join(__dirname, 'fixtures/cli/copilot-cli-success.jsonl');
  if (!fs.existsSync(successFixture)) {
    throw new Error('Required fixture missing: tests/fixtures/cli/copilot-cli-success.jsonl (created by wuce.9)');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  process.stdout.write('artefact-preview.test.js — wuce.14\n');
  checkFixtures();
  await runT1();
  await runT2();
  await runT3();
  await runT4();
  await runNFR();
  await runINT();

  process.stdout.write('\n');
  if (failures.length) {
    failures.forEach(f => process.stdout.write('  FAIL: ' + f.name + '\n    ' + f.err.message + '\n'));
  }
  process.stdout.write('\nResults: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
})();
