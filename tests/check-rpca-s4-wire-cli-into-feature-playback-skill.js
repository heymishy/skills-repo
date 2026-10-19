'use strict';
// check-rpca-s4-wire-cli-into-feature-playback-skill.js -- TDD tests for rpca-s4
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s4-wire-cli-into-feature-playback-skill.md
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(function () {

const skillMdPath = path.join(__dirname, '..', 'skills', 'feature-playback', 'SKILL.md');
const skillMd = fs.readFileSync(skillMdPath, 'utf8');

// AC1 (unit): SKILL.md's own Step 2/3 describe the real CLI accurately
(function () {
  try {
    assert.ok(skillMd.includes('authenticateStagingSession'), 'expected Step 2-3 to name the real auth function');
    assert.ok(skillMd.includes('buildCaptureList'), 'expected Step 2-3 to name the real AC/selector derivation function');
    assert.ok(!skillMd.includes("Record video -- a separate story (fpd-s2), not this skill's own capture step"), 'expected the stale "video is a separate story" line to be gone -- video capture is now real');
    pass("AC1 (unit): SKILL.md's own Step 2/3 describe the real CLI accurately");
  } catch (e) { fail("AC1 (unit): SKILL.md's own Step 2/3 describe the real CLI accurately", e); }
})();

// AC2 (unit): "What this skill does NOT do" is accurately scoped
(function () {
  try {
    const notDoSectionMatch = skillMd.match(/## What this skill does NOT do([\s\S]*?)(\n---|\n## )/);
    assert.ok(notDoSectionMatch, 'expected a "What this skill does NOT do" section to exist');
    const notDoSection = notDoSectionMatch[1];
    assert.ok(/production/i.test(notDoSection), 'expected the section to name production capture as still manual');
    assert.ok(/bulk|retrofit/i.test(notDoSection), 'expected the section to name bulk retrofitting as still manual');
    assert.ok(/video/i.test(notDoSection) && /embed/i.test(notDoSection), 'expected the section to name automatic video-embedding into the walkthrough as a known gap');
    pass('AC2 (unit): "What this skill does NOT do" is accurately scoped');
  } catch (e) { fail('AC2 (unit): "What this skill does NOT do" is accurately scoped', e); }
})();

console.log(`\n[rpca-s4-wire-cli-into-feature-playback-skill] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
