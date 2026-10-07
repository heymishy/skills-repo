#!/usr/bin/env node
/**
 * check-tpux-s1-turn-progress-ux.js -- AC verification for tpux-s1 (visible
 * progress during hidden continuation turns, and auto-recovery from the
 * in-flight "still processing" guard instead of a manual-refresh dead end --
 * see artefacts/2026-10-08-turn-progress-ux/).
 *
 * The behaviour under test lives in the client-side sendTurn() script that
 * handleGetChatHtml renders into the chat page -- it is never executed in
 * Node, so verification follows this repo's own established convention
 * (srar-s1 AC6/AC7, sch-s1 AC1) of asserting against the real rendered
 * script text rather than introducing a new DOM/browser test harness.
 *
 * Run: node tests/check-tpux-s1-turn-progress-ux.js
 */
'use strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret-minimum32chars!!';

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}
function eq(a, b, label) {
  if (a === b) { console.log('  ✓ ' + label); passed++; }
  else {
    console.log('  ✗ ' + label + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');
    failed++;
  }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

const _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tpux-s1-'));
process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

async function run() {
  const routes = freshRequire(ROUTES_PATH);
  const sid = 'test-tpux-s1-render-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'review', sessionPath: '/tmp/t', systemPrompt: '# review', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'tpux-repro-feature'
  });
  let capturedHtml = null;
  const mockReq = { session: { accessToken: 'tok', userId: 1, login: 'user' }, params: { name: 'review', id: sid } };
  const mockResPage = { writeHead: function() {}, end: function(h) { capturedHtml = h; } };
  await routes.handleGetChatHtml(mockReq, mockResPage);
  const html = capturedHtml || '';

  // Isolate sendTurn()'s own body so matches below can't accidentally hit
  // unrelated code elsewhere on the page.
  const fnStart = html.indexOf('function sendTurn(');
  ok(fnStart !== -1, 'precondition: sendTurn() found in rendered script');
  const fnEnd = html.indexOf('SKILL_NAME_ENC', fnStart);
  ok(fnEnd !== -1 && fnEnd > fnStart, 'precondition: sendTurn() body isolated (found trailing SKILL_NAME_ENC marker)');
  const fnBody = html.slice(fnStart, fnEnd);

  // ── AC1: thinkingDiv survives the first content event on a continuation turn ──
  console.log('\n  AC1 -- thinkingDiv is not removed on the first reasoningChunk/chunk/draftChunk event for a continuation turn');
  {
    ok(fnBody.indexOf('_isContinuation, _attemptId, _isRetry, _inFlightRetryCount') !== -1,
      'AC1 precondition: sendTurn signature threads a retry-count parameter');
    const guardedRemovals = (fnBody.match(/thinkingDiv\s*&&\s*!_isContinuation\)\s*\{\s*thinkingDiv\.remove\(\)/g) || []).length;
    eq(guardedRemovals, 3, 'AC1: all 3 content-event handlers (reasoningChunk/chunk/draftChunk) guard thinkingDiv removal on !_isContinuation');
  }

  // Isolate the evt.error handling block for AC3/AC4/AC5 -- it runs from
  // "if(evt.error) {" up to the "} catch(_) {}" that always directly
  // follows it in the real source.
  const errStart = fnBody.indexOf('if(evt.error)');
  ok(errStart !== -1, 'precondition: evt.error handler found');
  const errEnd = fnBody.indexOf('catch(_)', errStart);
  ok(errEnd !== -1 && errEnd > errStart, 'precondition: evt.error handler body isolated');
  const errBlock = fnBody.slice(errStart, errEnd);

  // Further isolate just the evt.inFlight sub-branch within that block, so
  // AC3's "no red bubble on this path" check can't be satisfied by the
  // fallback branch below it.
  const inFlightStart = errBlock.indexOf('if(evt.inFlight)');
  ok(inFlightStart !== -1, 'precondition: evt.inFlight branch found inside evt.error handler');
  // The "return;" inside the inFlight branch is unique to it -- the fallback
  // branch below falls off the end of the function's try block instead, so
  // this is a safe, unambiguous split point between the two branches.
  const returnIdx = errBlock.indexOf('return;', inFlightStart);
  ok(returnIdx !== -1 && returnIdx > inFlightStart, 'precondition: evt.inFlight branch\'s own return; found');
  const inFlightEnd = returnIdx + 'return;'.length;
  const inFlightBlock = errBlock.slice(inFlightStart, inFlightEnd);
  const fallbackBlock = errBlock.slice(inFlightEnd);

  // ── AC3: quiet retry scheduled under the cap, no dead-end UI shown ──
  console.log('\n  AC3 -- evt.inFlight under the retry cap: quiet retry scheduled, no red bubble, submit button left untouched');
  {
    ok(inFlightBlock.indexOf('(_inFlightRetryCount || 0) < 12') !== -1,
      'AC3: retry counter compared against a cap of 12');
    ok(inFlightBlock.indexOf('setTimeout(function(){ sendTurn(answer, _isContinuation, _attId, _isRetry, (_inFlightRetryCount || 0) + 1); }, 5000);') !== -1,
      'AC3: a new sendTurn call is scheduled 5000ms later, reusing the same attemptId (_attId), with the retry counter incremented');
    ok(inFlightBlock.indexOf('appendBubble') === -1, 'AC3: no red error bubble appended on the quiet-retry path');
    ok(inFlightBlock.indexOf('submitBtn.disabled = false') === -1, 'AC3: submit button is not re-enabled on the quiet-retry path');
  }

  // ── AC4: retry cap reached triggers reload instead of another retry ──
  console.log('\n  AC4 -- evt.inFlight at the retry cap: window.location.reload() called instead of a 13th retry');
  {
    ok(inFlightBlock.indexOf('window.location.reload();') !== -1,
      'AC4: window.location.reload() is called on the branch reached once the retry cap is hit');
    const reloadIdx = inFlightBlock.indexOf('window.location.reload();');
    const capIdx = inFlightBlock.indexOf('(_inFlightRetryCount || 0) < 12');
    ok(capIdx !== -1 && reloadIdx > capIdx, 'AC4: the reload call is reached only via the cap comparison\'s else branch, not unconditionally');
  }

  // ── AC5: non-inFlight errors are unchanged ──
  console.log('\n  AC5 -- a genuine (non-inFlight) evt.error keeps its existing dead-simple behaviour');
  {
    ok(fallbackBlock.indexOf('appendBubble("assistant", \'<em style="color:var(--error,red)">\'') !== -1,
      'AC5: the red error bubble is still appended for a non-inFlight error');
    ok(fallbackBlock.indexOf('submitBtn.disabled = false') !== -1,
      'AC5: the submit button is still re-enabled for a non-inFlight error');
    ok(fallbackBlock.indexOf('thinkingDiv.remove()') !== -1 && fallbackBlock.indexOf('streamDiv.remove()') !== -1,
      'AC5: thinkingDiv/streamDiv are still cleared for a non-inFlight error');
  }

  delete process.env.COPILOT_REPO_PATH;
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });

  console.log('\n[tpux-s1-turn-progress-ux] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();
