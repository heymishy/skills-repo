'use strict';
// check-rpca-s5-automatic-capture-trigger-at-definition-of-done.js -- TDD tests for rpca-s5
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s5-automatic-capture-trigger-at-definition-of-done.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

// AC1 (unit): checkDodGate returns ok when every story is complete, regardless of feature.dodStatus
(function () {
  const { checkDodGate } = require('../scripts/playback-capture');
  try {
    const state = { features: [{
      slug: 'fixture-feature',
      epics: [{ slug: 'fixture-epic', stories: [
        { slug: 'fixture-s1', dodStatus: 'complete' },
        { slug: 'fixture-s2', dodStatus: 'complete' },
      ] }],
    }] };
    const result = checkDodGate(state, 'fixture-feature');
    assert.strictEqual(result.ok, true, 'expected ok:true when every story is complete');
    pass('AC1 (unit): checkDodGate returns ok when every story is complete, regardless of feature.dodStatus');
  } catch (e) { fail('AC1 (unit): checkDodGate returns ok when every story is complete, regardless of feature.dodStatus', e); }
})();

// AC1 (unit): checkDodGate returns ok even when a stale feature.dodStatus field disagrees
(function () {
  const { checkDodGate } = require('../scripts/playback-capture');
  try {
    const state = { features: [{
      slug: 'fixture-feature',
      dodStatus: 'in-progress',
      epics: [{ slug: 'fixture-epic', stories: [
        { slug: 'fixture-s1', dodStatus: 'complete' },
        { slug: 'fixture-s2', dodStatus: 'complete' },
      ] }],
    }] };
    const result = checkDodGate(state, 'fixture-feature');
    assert.strictEqual(result.ok, true, 'expected ok:true -- the stale feature.dodStatus field must be ignored');
    pass('AC1 (unit): checkDodGate returns ok even when a stale feature.dodStatus field disagrees');
  } catch (e) { fail('AC1 (unit): checkDodGate returns ok even when a stale feature.dodStatus field disagrees', e); }
})();

// AC2 (unit): checkDodGate throws naming the specific incomplete story
(function () {
  const { checkDodGate } = require('../scripts/playback-capture');
  try {
    const state = { features: [{
      slug: 'fixture-feature',
      epics: [{ slug: 'fixture-epic', stories: [
        { slug: 'fixture-s1', dodStatus: 'complete' },
        { slug: 'fixture-s2', dodStatus: 'in-progress' },
      ] }],
    }] };
    let threw = null;
    try { checkDodGate(state, 'fixture-feature'); } catch (e) { threw = e; }
    assert.ok(threw, 'expected checkDodGate to throw');
    assert.ok(threw.message.includes('fixture-s2'), 'expected the error to name the specific incomplete story');
    pass('AC2 (unit): checkDodGate throws naming the specific incomplete story');
  } catch (e) { fail('AC2 (unit): checkDodGate throws naming the specific incomplete story', e); }
})();

console.log(`\n[rpca-s5-automatic-capture-trigger-at-definition-of-done] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
