'use strict';
// tests/check-ep2-s3-approval.js — Part 1
const assert = require('assert');
const journeyRoute = require('../src/web-ui/routes/journey');

async function testApprovalHandlerExists() {
  assert.strictEqual(typeof journeyRoute.handlePostJourneyApprove, 'function');
}
testApprovalHandlerExists()
  .then(() => console.log('  ok - approval handler exported'))
  .catch((err) => { console.error('  FAIL - testApprovalHandlerExists:', err.message); process.exitCode = 1; });
