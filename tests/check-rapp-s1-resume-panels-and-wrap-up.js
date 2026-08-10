'use strict';
/**
 * check-rapp-s1-resume-panels-and-wrap-up.js
 *
 * Unit tests for rapp-s1 -- three fixes found via a live Chrome-driven
 * staging review of /ideate (after isc-s1/isc-s2's mock-gateway fix):
 *
 * 1. Resuming an in-progress /ideate session restored chat history and the
 *    canvas diagram correctly, but the CONDITIONS/ASSUMPTIONS side panels
 *    reset to empty even though the underlying markers were present in the
 *    resumed conversation text -- mergeRedisSessionData already correctly
 *    restores session.assumptionCards/conditionItems (it's denylist-based),
 *    but that restored data was never read back into the initial page HTML
 *    to seed the panels (exactly the same gap a4 already fixed for
 *    canvasBlocks specifically, never extended to these two fields).
 * 2. After all core lenses, the model just asks a conversational question
 *    ("Ready for me to write this up... ?") with no explicit UI control to
 *    signal "yes, finish this" -- an operator who reads that as "I've seen
 *    everything" has no discoverable way to trigger completion.
 * 3. The CANVAS panel had no min-height (min-height:0), while its siblings
 *    (CONDITIONS/ASSUMPTIONS) can grow up to 28%/42% max-height each --
 *    invisible while those siblings were always empty (before isc-s1),
 *    but once real content populates them, canvas can be squeezed to a
 *    small sliver.
 *
 * Run: node tests/check-rapp-s1-resume-panels-and-wrap-up.js
 */

const assert = require('assert');
const path   = require('path');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message ? err.message : String(err)));
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message ? err.message : String(err)));
  }
}

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function makeReq(skillName, sessionId) {
  return { session: { accessToken: 'tok', userId: 1, login: 'u' }, params: { name: skillName, id: sessionId } };
}

function makeRes() {
  let captured = '';
  return {
    _get: function() { return captured; },
    writeHead: function() {},
    end: function(body) { captured += (body || ''); }
  };
}

(async function() {

  // ── AC1 — assumption cards init script present when session has cards ──

  await checkAsync('AC1: assumptionCardsInitScript_present_whenSessionHasAssumptionCards', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t1-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'ideate');
    const session = routes._getHtmlSession(sid);
    session.assumptionCards = {
      a1: { id: 'a1', text: 'Test assumption', type: 'desirability', risk: 'medium', knowness: 'known-unknown', cardId: 'a1', state: 'default' }
    };

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('ideate', sid), res);
    const html = res._get();

    assert.ok(html.includes('__SW_INITIAL_ASSUMPTION_CARDS__'), 'init script variable must be present');
    assert.ok(html.includes('Test assumption'), 'the actual restored assumption text must be embedded in the init script');
  });

  // ── AC2 — condition items init script present when session has conditions ─

  await checkAsync('AC2: conditionItemsInitScript_present_whenSessionHasConditionItems', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t2-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'ideate');
    const session = routes._getHtmlSession(sid);
    session.conditionItems = {
      c1: { id: 'c1', text: 'Test condition', type: 'constraint', source: 'model' }
    };

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('ideate', sid), res);
    const html = res._get();

    assert.ok(html.includes('__SW_INITIAL_CONDITION_ITEMS__'), 'init script variable must be present');
    assert.ok(html.includes('Test condition'), 'the actual restored condition text must be embedded in the init script');
  });

  // ── AC3 — neither init script present when the session has no cards/items ─

  await checkAsync('AC3: noInitScripts_whenSessionHasNoAssumptionsOrConditions', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t3-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'ideate');

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('ideate', sid), res);
    const html = res._get();

    // The client-side hydration code always references these globals in a
    // typeof check (see AC5) -- assert on the actual assignment statement
    // the server only emits when there's real data, not the bare name
    // (which the always-present client script also contains).
    assert.ok(!html.includes('window.__SW_INITIAL_ASSUMPTION_CARDS__='), 'no assumption init assignment when session has no assumptionCards');
    assert.ok(!html.includes('window.__SW_INITIAL_CONDITION_ITEMS__='), 'no condition init assignment when session has no conditionItems');
  });

  // ── AC4 — non-ideate skills never get assumption/condition init scripts ──

  await checkAsync('AC4: nonIdeateSkill_neverGetsAssumptionOrConditionInitScripts', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t4-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'discovery');
    const session = routes._getHtmlSession(sid);
    // Even if these fields were somehow present on a non-ideate session,
    // the panels themselves only render for isIdeate (chat-view.js) -- the
    // init scripts must stay gated the same way.
    session.assumptionCards = { a1: { id: 'a1', text: 'x', type: 'desirability', risk: 'low', knowness: 'known-unknown', cardId: 'a1', state: 'default' } };
    session.conditionItems  = { c1: { id: 'c1', text: 'y', type: 'constraint', source: 'model' } };

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('discovery', sid), res);
    const html = res._get();

    assert.ok(!html.includes('window.__SW_INITIAL_ASSUMPTION_CARDS__='), 'discovery session must never get the assumption init assignment');
    assert.ok(!html.includes('window.__SW_INITIAL_CONDITION_ITEMS__='), 'discovery session must never get the condition init assignment');
  });

  // ── AC5 — client-side hydration calls appendAssumptionCard/appendConditionItem ─

  await checkAsync('AC5: clientScript_hydratesInitialAssumptionsAndConditions_onLoad', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t5-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'ideate');

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('ideate', sid), res);
    const html = res._get();

    assert.ok(html.includes('__SW_INITIAL_ASSUMPTION_CARDS__.forEach(function(card) { appendAssumptionCard(card); })'), 'client script must hydrate assumption cards from the init script on load');
    assert.ok(html.includes('__SW_INITIAL_CONDITION_ITEMS__.forEach(function(item) { appendConditionItem(item); })'), 'client script must hydrate condition items from the init script on load');
  });

  // ── AC6 — "Wrap up ideation" button present for an in-progress ideate session ─

  await checkAsync('AC6: wrapUpButton_present_forInProgressIdeateSession', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t6-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'ideate');

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('ideate', sid), res);
    const html = res._get();

    assert.ok(html.includes('<button type="button" id="sw-wrap-ideation-btn"'), 'the actual button element must render for an in-progress ideate session');
  });

  // ── AC7 — "Wrap up ideation" button absent once the session is done ──────

  await checkAsync('AC7: wrapUpButton_absent_onceSessionIsDone', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t7-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'ideate');
    const session = routes._getHtmlSession(sid);
    session.done = true;
    session.artefactContent = '# Ideation Artefact\n\nDone.';

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('ideate', sid), res);
    const html = res._get();

    assert.ok(!html.includes('<button type="button" id="sw-wrap-ideation-btn"'), 'the button element must not render once the ideate session is done');
  });

  // ── AC8 — "Wrap up ideation" button never appears for a non-ideate skill ──

  await checkAsync('AC8: wrapUpButton_neverAppears_forNonIdeateSkill', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t8-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'discovery');

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('discovery', sid), res);
    const html = res._get();

    // The client-side lookup code (document.getElementById(...)) is emitted
    // unconditionally for every skill (see AC6/AC7) -- assert on the actual
    // button element, which is the only part that's genuinely ideate-gated.
    assert.ok(!html.includes('<button type="button" id="sw-wrap-ideation-btn"'), 'a non-ideate skill session must never render the actual wrap-up button element');
  });

  // ── AC9 — canvas-section has a real min-height for the ideate 3-panel layout ─

  await checkAsync('AC9: canvasSection_hasNonZeroMinHeight_forIdeateLayout', async () => {
    const routes = freshRequire(ROUTES_PATH);
    const sid = 'rapp-s1-t9-' + Math.random().toString(36).slice(2);
    routes.registerHtmlSession(sid, null, 'ideate');

    const res = makeRes();
    await routes.handleGetChatHtml(makeReq('ideate', sid), res);
    const html = res._get();

    const match = html.match(/id="canvas-section" style="[^"]*min-height:(\d+)px/);
    assert.ok(match, 'canvas-section must declare a pixel min-height (not min-height:0)');
    assert.ok(parseInt(match[1], 10) > 0, 'canvas-section min-height must be greater than 0');
  });

  console.log('\n=== check-rapp-s1-resume-panels-and-wrap-up results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failed > 0) process.exit(1);

})();
