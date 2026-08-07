#!/usr/bin/env node
// check-seedtestsession-allow-outside-test.js — regression test for the
// bslb-s2/rlld-s2-follow-up fix: seedTestSession() previously had no way to
// be called outside NODE_ENV=test at all, even by a caller (server.js's
// GET /test/session route) that had already independently validated the
// request through an equivalent staging-safe gate (_isTestEndpointAllowed).
// This left the route's own staging bypass dead in practice -- the route
// gate passed, but seedTestSession's own hardcoded check always threw
// anyway. This test verifies both the preserved default (strict) behaviour
// and the new, explicit allowOutsideTest escape hatch.

'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const { seedTestSession, getSession, _clearForTesting } = require('../src/web-ui/middleware/session');

let passed = 0;
let failed = 0;

function ok(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}

console.log('\nT1 — default behaviour unchanged: works normally under NODE_ENV=test');
{
  _clearForTesting();
  seedTestSession('abc123', { accessToken: 'tok', login: 'u' });
  ok(getSession('abc123') && getSession('abc123').login === 'u', 'T1.1: session seeded correctly under NODE_ENV=test');
}

console.log('\nT2 — default behaviour unchanged: throws outside NODE_ENV=test with no options');
{
  _clearForTesting();
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'staging';
  let threw = false;
  let message = null;
  try {
    seedTestSession('def456', { accessToken: 'tok', login: 'u' });
  } catch (e) {
    threw = true;
    message = e.message;
  }
  process.env.NODE_ENV = original;
  ok(threw, 'T2.1: throws outside NODE_ENV=test when no options are passed (unchanged from before this fix)');
  ok(message === 'seedTestSession is only available in NODE_ENV=test', 'T2.2: exact error message preserved');
  ok(!getSession('def456'), 'T2.3: no session was seeded when the call threw');
}

console.log('\nT3 — new escape hatch: allowOutsideTest:true permits seeding outside NODE_ENV=test');
{
  _clearForTesting();
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'staging';
  let threw = false;
  try {
    seedTestSession('ghi789', { accessToken: 'tok', login: 'u2' }, { allowOutsideTest: true });
  } catch (e) {
    threw = true;
  }
  process.env.NODE_ENV = original;
  ok(!threw, 'T3.1: does not throw outside NODE_ENV=test when allowOutsideTest:true is passed');
  ok(getSession('ghi789') && getSession('ghi789').login === 'u2', 'T3.2: session is correctly seeded via the escape hatch');
}

console.log('\nT4 — allowOutsideTest:false (explicit) behaves identically to omitting it');
{
  _clearForTesting();
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'staging';
  let threw = false;
  try {
    seedTestSession('jkl012', { accessToken: 'tok', login: 'u3' }, { allowOutsideTest: false });
  } catch (e) {
    threw = true;
  }
  process.env.NODE_ENV = original;
  ok(threw, 'T4.1: explicit allowOutsideTest:false still throws outside NODE_ENV=test');
}

_clearForTesting();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
