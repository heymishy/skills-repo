'use strict';
// check-ncdv-s2-local-postgres-ssl.js -- TDD test for a real gap found
// during jcx-s3's own branch-setup: journey-store-pg.js's own pg.Pool
// hardcoded ssl:{rejectUnauthorized:false} unconditionally, which a plain
// local Postgres rejects outright ("The server does not support SSL
// connections") -- root-caused during ic-s4's own DoD (workspace/
// learnings.md, 2026-10-11), blocking local E2E execution for ep1-s3/
// ic-s2/ic-s3/ic-s4/jcx-s3's own E2E specs ever since.
const assert = require('assert');
const fs = require('fs');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function() {
  const src = fs.readFileSync(require.resolve('../src/web-ui/adapters/journey-store-pg'), 'utf8');

  // -- source-shape assertions: the explicit ssl override must now be
  // conditional, never unconditional, so a real Neon/staging/production
  // DATABASE_URL's own existing behaviour is provably untouched --
  try {
    assert.ok(!/ssl: \{ rejectUnauthorized: false \},\s*\n\s*connectionTimeoutMillis/.test(src), 'expected the OLD unconditional ssl option to be gone');
    assert.ok(/if \(!_isLocalHost\(process\.env\.DATABASE_URL\)\) \{\s*\n\s*poolConfig\.ssl = \{ rejectUnauthorized: false \};/.test(src), 'expected ssl to be set conditionally, only for non-local hosts');
    pass('journey-store-pg.js no longer forces SSL unconditionally');
  } catch (e) { fail('journey-store-pg.js no longer forces SSL unconditionally', e); }

  // -- behavioral test: extract and directly exercise _isLocalHost's real
  // logic (not exported -- this module's own public surface is
  // intentionally narrow; matches this repo's own precedent of testing a
  // small internal pure function via its real source text rather than
  // widening a module's export surface just for a test, e.g.
  // check-ic-s1-canvas-render.js's own extractFirstScript technique).
  try {
    const match = src.match(/function _isLocalHost\(connectionString\) \{[\s\S]*?\n\}/);
    assert.ok(match, 'expected to extract the _isLocalHost function body from source');
    const fn = eval('(' + match[0].replace('function _isLocalHost', 'function') + ')');
    assert.strictEqual(fn('postgres://user:pass@localhost:5432/db'), true, 'expected localhost to be classified as local');
    assert.strictEqual(fn('postgres://user:pass@127.0.0.1:5432/db'), true, 'expected 127.0.0.1 to be classified as local');
    assert.strictEqual(fn('postgres://user:pass@[::1]:5432/db'), true, 'expected ::1 to be classified as local');
    assert.strictEqual(fn('postgres://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/db?sslmode=require'), false, 'expected a real Neon host to be classified as non-local');
    assert.strictEqual(fn('postgres://user:pass@wuce-staging.internal/db'), false, 'expected a real staging host to be classified as non-local');
    assert.strictEqual(fn('not a valid url'), false, 'expected an unparseable string to default to non-local (fail safe -- never accidentally drop SSL on a malformed string)');
    pass('_isLocalHost correctly distinguishes local Postgres targets from real Neon/staging/production hosts');
  } catch (e) { fail('_isLocalHost correctly distinguishes local Postgres targets from real Neon/staging/production hosts', e); }

  console.log(`\n[ncdv-s2-local-postgres-ssl] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
})();
