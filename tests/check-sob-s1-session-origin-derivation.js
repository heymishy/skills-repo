// tests/check-sob-s1-session-origin-derivation.js
'use strict';
const assert = require('assert');
const { deriveSessionOrigin } = require('../src/web-ui/routes/features.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}

console.log('\n[sob-s1] AC1 -- fully session-backed');
test('all completedStages carry sessionId returns fully-session-backed', function() {
  const result = deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: 's1' }, { sessionId: 's2' }] });
  assert.strictEqual(result, 'fully-session-backed');
});

console.log('\n[sob-s1] AC2 -- mixed');
test('some completedStages carry sessionId, some do not, returns mixed', function() {
  const result = deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: 's1' }, { sessionId: null }] });
  assert.strictEqual(result, 'mixed');
});

console.log('\n[sob-s1] AC3 -- no session (real journey, no sessionIds)');
test('real journey with zero sessionId-bearing stages returns no-session', function() {
  const result = deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: null }, { sessionId: undefined }] });
  assert.strictEqual(result, 'no-session');
});

console.log('\n[sob-s1] AC5 -- zero completed stages returns null');
test('real journey with zero completed stages returns null', function() {
  const result = deriveSessionOrigin({ hasJourney: true, completedStages: [] });
  assert.strictEqual(result, null);
});

console.log('\n[sob-s1] AC9 -- hasJourney contract');
test('hasJourney false always returns no-session regardless of completedStages content', function() {
  assert.strictEqual(deriveSessionOrigin({ hasJourney: false, completedStages: [] }), 'no-session');
  assert.strictEqual(deriveSessionOrigin({ hasJourney: false, completedStages: [{ sessionId: 's1' }] }), 'no-session');
});
test('hasJourney true + empty array (null) is distinguishable from hasJourney false + empty array (no-session)', function() {
  const withJourney = deriveSessionOrigin({ hasJourney: true, completedStages: [] });
  const withoutJourney = deriveSessionOrigin({ hasJourney: false, completedStages: [] });
  assert.strictEqual(withJourney, null);
  assert.strictEqual(withoutJourney, 'no-session');
});

console.log('\n--- sob-s1 derivation results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
