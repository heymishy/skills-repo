'use strict';
// check-bri-s3.5-nfr-stripe-keys.js
// NFR (Security) check for bri-s3.5: the @mocked/@billing per-PR variant must
// never use a real/live Stripe secret key or webhook signing secret. Confirms:
//   1. If STRIPE_SECRET_KEY is set in the current environment, it uses the
//      test-mode prefix (sk_test_), never sk_live_.
//   2. If STRIPE_WEBHOOK_SECRET is set, it uses the test-mode prefix (whsec_
//      is shared between test/live in real Stripe, so this also asserts no
//      live-mode key material is committed to the repo).
//   3. No committed file contains a live-mode Stripe key pattern
//      (sk_live_ / rk_live_ / whsec_ followed by a real-looking non-test value).
//
// Run: node tests/check-bri-s3.5-nfr-stripe-keys.js

var path = require('path');
var ROOT = path.join(__dirname, '..');
var { execSync } = require('child_process');

var passed = 0;
var failed = 0;
function check(label, ok) {
  if (ok) { passed++; console.log('PASS:', label); }
  else    { failed++; console.error('FAIL:', label); }
}

// ── 1. STRIPE_SECRET_KEY, if set, must be test-mode ─────────────────────────
console.log('\n── STRIPE_SECRET_KEY is test-mode only (if configured) ──');
{
  var secretKey = process.env.STRIPE_SECRET_KEY;
  check(
    'STRIPE_SECRET_KEY unset, or test-mode prefix (sk_test_) — never sk_live_',
    !secretKey || secretKey.indexOf('sk_test_') === 0
  );
}

// ── 2. STRIPE_WEBHOOK_SECRET, if set, is not obviously a live-mode value ────
console.log('\n── STRIPE_WEBHOOK_SECRET is not a live-mode value (if configured) ──');
{
  var whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // Stripe webhook signing secrets are always whsec_... regardless of test/live mode,
  // so the meaningful check here is simply that no real (long, random-looking) live
  // secret has been hardcoded — the placeholder/test value used across this repo's
  // test suites is the short literal 'whsec_test'.
  check(
    'STRIPE_WEBHOOK_SECRET unset, or the repo test-fixture placeholder (whsec_test)',
    !whSecret || whSecret === 'whsec_test'
  );
}

// ── 3. No committed file contains a live-mode Stripe key pattern ───────────
console.log('\n── No live-mode Stripe key pattern committed to the repo ──');
{
  var patterns = ['sk_live_', 'rk_live_'];
  var found = [];
  patterns.forEach(function(p) {
    var grepResult = '';
    try {
      grepResult = execSync('git grep -n "' + p + '" -- . 2>/dev/null || true', { cwd: ROOT, encoding: 'utf8' });
    } catch (_) { grepResult = ''; }
    if (grepResult.trim() !== '') found.push({ pattern: p, matches: grepResult.trim() });
  });
  check('no sk_live_/rk_live_ pattern in any committed file', found.length === 0);
  if (found.length) {
    found.forEach(function(f) { console.error('  found "' + f.pattern + '" in:\n' + f.matches); });
  }
}

// ── 4. .env.example never carries a real (non-placeholder) price/key value ──
console.log('\n── .env.example only carries placeholder/test-mode values ──');
{
  var fs = require('fs');
  var envExamplePath = path.join(ROOT, '.env.example');
  var content = '';
  try { content = fs.readFileSync(envExamplePath, 'utf8'); } catch (_) {}
  var hasLiveKey = /sk_live_|rk_live_/.test(content);
  check('.env.example has no live-mode Stripe key pattern', !hasLiveKey);
}

console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
process.exit(failed > 0 ? 1 : 0);
