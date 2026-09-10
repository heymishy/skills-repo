'use strict';

// check-jgls-s1-live-gate-sticky.js
// Tests for jgls-s1 -- showCommitLink()'s live-completion gate control must
// carry the same sticky positioning as journeyPanel's server-rendered path
// (wnl-s2). All output lines are prefixed with [jgls-s1].

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function assertTrue(condition, label) {
  if (condition) {
    console.log('[jgls-s1] PASS:', label);
    passed++;
  } else {
    console.error('[jgls-s1] FAIL:', label);
    failed++;
  }
}

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
const STICKY_SUBSTRING = 'position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);z-index:500';

function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

function makeSession(overrides) {
  return Object.assign({
    skillName: 'discovery',
    sessionPath: '/tmp/jgls-s1-test.md',
    systemPrompt: 'test prompt',
    turns: [],
    artefactContent: '# Discovery\n\nContent.',
    artefactPath: 'artefacts/test/discovery.md',
    done: false,
    journeyId: 'jgls-s1-test-journey'
  }, overrides || {});
}

function renderChatHtml(routes, skillName, sessionOverrides) {
  const sid = 'jgls-s1-' + skillName + '-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, makeSession(Object.assign({ skillName: skillName }, sessionOverrides)));
  let body = '';
  return routes.handleGetChatHtml(
    { params: { name: skillName, id: sid }, session: { accessToken: 'tok' } },
    { writeHead: function() {}, end: function(h) { body = h || ''; } }
  ).then(function() { return body; });
}

function extractShowCommitLinkBody(html) {
  const start = html.indexOf('function showCommitLink()');
  assert.ok(start !== -1, 'showCommitLink function definition not found in rendered page');
  const end = html.indexOf('function sendTurn(', start);
  assert.ok(end !== -1, 'sendTurn function definition (end boundary) not found after showCommitLink');
  return html.slice(start, end);
}

(async function main() {
  const routes = freshRequire(ROUTES_PATH);

  await (async function() {
    const body = await renderChatHtml(routes, 'discovery', {});
    const fnBody = extractShowCommitLinkBody(body);
    const wrapAssignMatch = fnBody.match(/wrap\.style\.cssText\s*=\s*"([^"]*)"/);
    assert.ok(wrapAssignMatch, 'wrap.style.cssText assignment not found inside showCommitLink()');
    const cssText = wrapAssignMatch[1];

    // AC1: sticky positioning present
    assertTrue(cssText.indexOf('position:sticky') !== -1, 'AC1: wrap.style.cssText contains position:sticky');
    assertTrue(cssText.indexOf('bottom:0') !== -1, 'AC1: wrap.style.cssText contains bottom:0');
    assertTrue(cssText.indexOf('background:var(--bg)') !== -1, 'AC1: wrap.style.cssText contains background:var(--bg)');
    assertTrue(cssText.indexOf('border-top:1px solid var(--line)') !== -1, 'AC1: wrap.style.cssText contains border-top:1px solid var(--line)');
    assertTrue(cssText.indexOf('z-index:500') !== -1, 'AC1: wrap.style.cssText contains z-index:500');

    // AC2: existing layout properties unchanged
    assertTrue(cssText.indexOf('padding:10px 12px 2px') !== -1, 'AC2: wrap.style.cssText still contains padding:10px 12px 2px');
    assertTrue(cssText.indexOf('display:flex') !== -1, 'AC2: wrap.style.cssText still contains display:flex');
    assertTrue(cssText.indexOf('align-items:center') !== -1, 'AC2: wrap.style.cssText still contains align-items:center');
    assertTrue(cssText.indexOf('gap:10px') !== -1, 'AC2: wrap.style.cssText still contains gap:10px');
    assertTrue(cssText.indexOf('flex-wrap:wrap') !== -1, 'AC2: wrap.style.cssText still contains flex-wrap:wrap');
  })();

  await (function() {
    // AC3: consistency guard -- both the server-rendered journeyPanel gate
    // (skills.js ~line 4593, built via string concatenation with a ternary,
    // so not matchable as a single literal attribute) and the live-injection
    // showCommitLink() wrap must carry the identical positioning substring.
    // Counting occurrences (rather than isolating each container's full
    // style string) is robust to that concatenation and still catches
    // exactly the class of bug this story fixes: one path updated, the
    // other silently left behind.
    const source = fs.readFileSync(ROUTES_PATH, 'utf8');
    const occurrences = source.split(STICKY_SUBSTRING).length - 1;

    assertTrue(
      occurrences >= 2,
      'AC3: canonical sticky positioning substring appears at least twice in source (journeyPanel + showCommitLink) -- found ' + occurrences
    );
    return Promise.resolve();
  })();

  console.log('\n[jgls-s1] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
