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
    assert(html.includes('data-hero="crypto-verification"'), 'expected a hero-card element for cryptographic verification');
    assert(/hero-card-example/.test(html.split('data-hero="crypto-verification"')[1] || ''), 'expected a concrete hash example inside this hero card');
    pass('cryptoVerificationCard_rendersHeadlineSentenceAndHashExample');
  } catch (e) { fail('cryptoVerificationCard_rendersHeadlineSentenceAndHashExample', e); }

  // AC2
  try {
    const cardMatch = html.match(/<section class="hero-card" data-hero="crypto-verification"[\s\S]*?<\/section>/);
    assert(cardMatch, 'expected to locate the crypto-verification hero card section');
    const cardHtml = cardMatch[0].toLowerCase();
    assert(cardHtml.includes('recomputable') || cardHtml.includes('independently verifiable'), 'expected the copy to assert provability concretely');
    // "trust us" is allowed only as a negated contrast (e.g. 'not "trust us"') -- an
    // un-negated occurrence would be the unfalsifiable claim this AC exists to avoid.
    const hasUnnegatedTrustUs = /trust us/i.test(cardHtml) && !/not\s+["']?trust us/i.test(cardHtml);
    assert(!hasUnnegatedTrustUs, 'copy should not use an unfalsifiable "trust us" claim (un-negated)');
    pass('cryptoVerificationCard_assertsRecomputable_notUnfalsifiableClaim');
  } catch (e) { fail('cryptoVerificationCard_assertsRecomputable_notUnfalsifiableClaim', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
