'use strict';
// check-h-design-gate.js
// TDD tests for dsa-s5: H-DESIGN hard block in /definition-of-ready SKILL.md.
// 8 unit tests + 1 NFR. RED until DoR SKILL.md is extended.

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var SKILL_PATH = path.join(__dirname, '../skills/definition-of-ready/SKILL.md');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (err) {
    failed++;
    failures.push({ name: name, err: err });
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err));
  }
}

var skillContent = fs.existsSync(SKILL_PATH) ? fs.readFileSync(SKILL_PATH, 'utf8') : '';

console.log('\ncheck-h-design-gate.js');
console.log('========================');

// ---------------------------------------------------------------------------
// T1 — DoR SKILL.md contains H-DESIGN block identifier (AC3)
// ---------------------------------------------------------------------------
test('T1: DoR SKILL.md contains H-DESIGN block identifier', function() {
  assert.ok(/H-DESIGN/.test(skillContent),
    'T1: DoR SKILL.md must contain "H-DESIGN" block identifier');
});

// ---------------------------------------------------------------------------
// T2 — H-DESIGN block references hasDesignSystemTrack as trigger condition (AC3, AC5)
// ---------------------------------------------------------------------------
test('T2: H-DESIGN block references hasDesignSystemTrack as trigger condition', function() {
  assert.ok(
    /H-DESIGN[\s\S]{0,800}hasDesignSystemTrack/.test(skillContent) ||
    /hasDesignSystemTrack[\s\S]{0,400}H-DESIGN/.test(skillContent),
    'T2: SKILL.md must reference hasDesignSystemTrack in the H-DESIGN block context'
  );
});

// ---------------------------------------------------------------------------
// T3 — H-DESIGN is conditional — only fires when hasDesignSystemTrack is true (AC5)
// ---------------------------------------------------------------------------
test('T3: H-DESIGN is conditional — only fires when hasDesignSystemTrack is true', function() {
  assert.ok(
    /H-DESIGN[\s\S]{0,400}hasDesignSystemTrack.*true|H-DESIGN[\s\S]{0,400}(only when|skip.*hasDesignSystemTrack)/im.test(skillContent) ||
    /H-DESIGN[\s\S]{0,600}false.*skip|H-DESIGN[\s\S]{0,600}absent.*skip/im.test(skillContent) ||
    (/H-DESIGN/.test(skillContent) && /hasDesignSystemTrack.*false|false.*hasDesignSystemTrack/im.test(skillContent) && /skip/im.test(skillContent)),
    'T3: H-DESIGN must be documented as conditional on hasDesignSystemTrack: true; absent/false = skip'
  );
});

// ---------------------------------------------------------------------------
// T4 — H-DESIGN docs say it is skipped when hasDesignSystemTrack is absent/false (AC5)
// ---------------------------------------------------------------------------
test('T4: H-DESIGN docs say it is skipped when hasDesignSystemTrack is absent or false', function() {
  assert.ok(
    /H-DESIGN[\s\S]{0,600}(absent|not set|missing)/im.test(skillContent) ||
    (/H-DESIGN/.test(skillContent) && /hasDesignSystemTrack.*absent|absent.*hasDesignSystemTrack/im.test(skillContent)),
    'T4: H-DESIGN docs must state the block is skipped when hasDesignSystemTrack is absent or false'
  );
});

// ---------------------------------------------------------------------------
// T5 — H-DESIGN skip-when-absent text states existing hard blocks are unaffected (AC5)
// ---------------------------------------------------------------------------
test('T5: H-DESIGN skip text states existing hard blocks (H1-H13, H-GOV, H-ADAPTER, H-INF, H-MIG, H-NFR-profile) are unaffected', function() {
  assert.ok(
    /H-DESIGN[\s\S]{0,600}H1-H13[\s\S]{0,200}H-GOV[\s\S]{0,200}H-ADAPTER[\s\S]{0,200}H-INF[\s\S]{0,200}H-MIG[\s\S]{0,200}H-NFR-profile/im.test(skillContent) ||
    (/H-DESIGN/.test(skillContent) && /H1-H13/.test(skillContent) && /H-GOV/.test(skillContent) && /H-ADAPTER/.test(skillContent) && /H-INF/.test(skillContent) && /H-MIG/.test(skillContent) && /H-NFR-profile/.test(skillContent) && /unaffected/im.test(skillContent)),
    'T5: H-DESIGN docs must state that existing hard blocks (H1-H13, H-GOV, H-ADAPTER, H-INF, H-MIG, H-NFR-profile) are unaffected when H-DESIGN is skipped'
  );
});

// ---------------------------------------------------------------------------
// T6 — H-DESIGN FAIL message names the specific offending file and value,
// matching H-ADAPTER's own "H-ADAPTER FAIL: ..." convention (AC2, AC3)
// ---------------------------------------------------------------------------
test('T6: H-DESIGN FAIL message format names the offending file and value, matching H-ADAPTER FAIL convention', function() {
  assert.ok(
    /H-DESIGN FAIL[\s\S]{0,600}file[\s\S]{0,400}value|H-DESIGN FAIL[\s\S]{0,600}value[\s\S]{0,400}file/im.test(skillContent) ||
    (/H-DESIGN FAIL/.test(skillContent) && /H-ADAPTER FAIL/.test(skillContent)),
    'T6: H-DESIGN FAIL text must use the "H-DESIGN FAIL: ..." format and name the offending file + value, matching H-ADAPTER FAIL: ... convention'
  );
});

// ---------------------------------------------------------------------------
// T7 — H-DESIGN PASS message confirms no non-token colors found (AC4)
// ---------------------------------------------------------------------------
test('T7: H-DESIGN PASS message confirms no non-token colors found', function() {
  assert.ok(
    /H-DESIGN PASS[\s\S]{0,200}no.{0,20}non-token color/im.test(skillContent) ||
    (/H-DESIGN PASS/.test(skillContent) && /non-token color/im.test(skillContent)),
    'T7: H-DESIGN PASS text must confirm no non-token colors were found'
  );
});

// ---------------------------------------------------------------------------
// T8 — H-DESIGN references scripts/check-design-tokens.js as the real scan
// mechanism, not just prose (AC2, AC3, AC4)
// ---------------------------------------------------------------------------
test('T8: H-DESIGN references scripts/check-design-tokens.js as the actual scan mechanism', function() {
  assert.ok(
    /H-DESIGN[\s\S]{0,1500}scripts\/check-design-tokens\.js/im.test(skillContent) ||
    /scripts\/check-design-tokens\.js[\s\S]{0,600}H-DESIGN/im.test(skillContent),
    'T8: H-DESIGN block must name scripts/check-design-tokens.js by name as the real scan mechanism, not describe a purely manual eyeball process'
  );
});

// ---------------------------------------------------------------------------
// NFR — H-DESIGN references DESIGN.md's token table as the compliance source
// (Audit NFR)
// ---------------------------------------------------------------------------
test('NFR: H-DESIGN references DESIGN.md token table as compliance source', function() {
  assert.ok(
    /H-DESIGN[\s\S]{0,1500}DESIGN\.md/im.test(skillContent) ||
    /DESIGN\.md[\s\S]{0,600}H-DESIGN/im.test(skillContent),
    'NFR: H-DESIGN block must reference DESIGN.md as the source of the token table it scans against'
  );
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + (failed === 0 ? 'All ' + passed + ' tests passing' : passed + ' passing, ' + failed + ' failing'));
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(function(f) { console.log('  ' + f.name + '\n    ' + (f.err && f.err.message || f.err)); });
}
process.exit(failed > 0 ? 1 : 0);
