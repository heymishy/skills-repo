'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

(function() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-ui', 'templates', 'landing.html'), 'utf8');

  // AC1
  try {
    assert(html.includes('class="hero-card"') && html.includes('scope-contract'), 'expected a hero-card element for scope-contract enforcement');
    assert(/hero-card-example/.test(html), 'expected a concrete example element inside the hero card');
    pass('scopeContractCard_rendersHeadlineSentenceAndExample');
  } catch (e) { fail('scopeContractCard_rendersHeadlineSentenceAndExample', e); }

  // AC2
  try {
    const cardMatch = html.match(/<section class="hero-card" data-hero="scope-contract"[\s\S]*?<\/section>/);
    assert(cardMatch, 'expected to locate the scope-contract hero card section');
    const cardHtml = cardMatch[0].toLowerCase();
    assert(cardHtml.includes('dor') || cardHtml.includes('definition of ready'), 'expected the copy to name the real mechanism (DoR)');
    assert(cardHtml.includes('assurance gate'), 'expected the copy to name the assurance gate');
    assert(!/\bsafe ai\b/.test(cardHtml), 'copy should not use generic "safe AI" marketing language');
    pass('scopeContractCard_copyNamesRealMechanism_notGenericClaim');
  } catch (e) { fail('scopeContractCard_copyNamesRealMechanism_notGenericClaim', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
