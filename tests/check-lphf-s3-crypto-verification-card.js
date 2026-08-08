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

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
