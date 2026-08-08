'use strict';
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(async function() {
  // AC1
  try {
    const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
    const count = getLearningsCount();
    assert(Number.isInteger(count) && count > 0, `expected a real positive integer, got ${count}`);
    const fs = require('fs');
    const path = require('path');
    const raw = fs.readFileSync(path.join(__dirname, '..', 'workspace', 'learnings.md'), 'utf8');
    const independentCount = (raw.match(/^## /gm) || []).length;
    assert.strictEqual(count, independentCount, `getLearningsCount() (${count}) disagrees with an independent recount (${independentCount})`);
    pass('selfImprovingCard_displaysRealNonZeroLearningsCount');
  } catch (e) { fail('selfImprovingCard_displaysRealNonZeroLearningsCount', e); }

  // AC1 (integration) + AC2 + AC3
  try {
    delete require.cache[require.resolve('../src/web-ui/routes/public')];
    const { handleRoot } = require('../src/web-ui/routes/public');
    const { getLearningsCount } = require('../src/web-ui/content/learnings-count');
    const req = { session: {} };
    let body = null;
    const res = { setHeader: function() {}, writeHead: function() {}, end: function(data) { body = data; } };
    await handleRoot(req, res);

    const cardMatch = body.match(/<section class="hero-card" data-hero="self-improving"[\s\S]*?<\/section>/);
    assert(cardMatch, 'expected to locate the self-improving-harness hero card section');
    const cardHtml = cardMatch[0].toLowerCase();

    const realCount = getLearningsCount();
    assert(cardHtml.includes(String(realCount)), `expected the card to display the real count (${realCount})`);

    assert(!/\blive\b|\bright now\b|\bupdating as you read\b/.test(cardHtml), 'copy should not imply real-time live updating');

    assert(cardHtml.includes('human review') || cardHtml.includes('gated by'), 'expected the copy to explicitly name the human-review gate');

    pass('selfImprovingCard_wiredToRealCount_andCorrectCopy');
  } catch (e) { fail('selfImprovingCard_wiredToRealCount_andCorrectCopy', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
