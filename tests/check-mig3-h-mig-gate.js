'use strict';
// check-mig3-h-mig-gate.js
// TDD tests for mig.3: H-MIG hard block in /definition-of-ready SKILL.md.
// 9 unit tests + 1 NFR. RED until DoR SKILL.md is extended.

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

console.log('\ncheck-mig3-h-mig-gate.js');
console.log('==========================');

// ---------------------------------------------------------------------------
// T1 — DoR SKILL.md contains H-MIG block identifier (AC1)
// ---------------------------------------------------------------------------
test('T1: DoR SKILL.md contains H-MIG block identifier', function() {
  assert.ok(/H-MIG/.test(skillContent),
    'T1: DoR SKILL.md must contain "H-MIG" block identifier');
});

// ---------------------------------------------------------------------------
// T2 — H-MIG block references hasMigrationTrack as trigger condition (AC1)
// ---------------------------------------------------------------------------
test('T2: H-MIG block references hasMigrationTrack as trigger condition', function() {
  assert.ok(
    /H-MIG[\s\S]{0,800}hasMigrationTrack/.test(skillContent) ||
    /hasMigrationTrack[\s\S]{0,400}H-MIG/.test(skillContent),
    'T2: SKILL.md must reference hasMigrationTrack in the H-MIG block context'
  );
});

// ---------------------------------------------------------------------------
// T3 — H-MIG specifies FAIL when migrationReviewPath is absent (AC2)
// ---------------------------------------------------------------------------
test('T3: H-MIG specifies FAIL when migrationReviewPath is absent or not set', function() {
  assert.ok(
    /H-MIG[\s\S]{0,1200}migrationReviewPath[\s\S]{0,400}(absent|not set|missing)/im.test(skillContent) ||
    /H-MIG[\s\S]{0,1200}migrationReviewPath[\s\S]{0,400}FAIL/im.test(skillContent) ||
    (/H-MIG/.test(skillContent) && /migrationReviewPath/i.test(skillContent) && /FAIL/i.test(skillContent)),
    'T3: H-MIG block must specify FAIL when migrationReviewPath is absent or not set'
  );
});

// ---------------------------------------------------------------------------
// T4 — H-MIG specifies FAIL when artefact does not contain PASS status (AC2)
// ---------------------------------------------------------------------------
test('T4: H-MIG specifies FAIL when artefact lacks PASS status', function() {
  assert.ok(
    /H-MIG[\s\S]{0,2000}(does not contain.*PASS|no.*PASS|without.*PASS|artefact.*[Ff]ail)/m.test(skillContent) ||
    (/H-MIG/.test(skillContent) && /Status.*PASS|PASS.*status/im.test(skillContent) && /FAIL/i.test(skillContent)),
    'T4: H-MIG block must specify FAIL when the artefact at migrationReviewPath does not contain a PASS status'
  );
});

// ---------------------------------------------------------------------------
// T5 — H-MIG specifies PASS when artefact contains PASS status (AC3)
// ---------------------------------------------------------------------------
test('T5: H-MIG specifies PASS when artefact contains Status: PASS', function() {
  assert.ok(
    /H-MIG[\s\S]{0,2000}PASS.*artefact|H-MIG[\s\S]{0,2000}Status.*PASS/m.test(skillContent) ||
    (/H-MIG/.test(skillContent) && /Status: PASS|Status:\s*PASS|\*\*Status.*PASS\*\*/i.test(skillContent)),
    'T5: H-MIG block must specify PASS when migrationReviewPath artefact contains a PASS status'
  );
});

// ---------------------------------------------------------------------------
// T6 — H-MIG output references artefact path (AC3, Audit NFR)
// ---------------------------------------------------------------------------
test('T6: H-MIG output references the migrationReviewPath artefact path', function() {
  assert.ok(
    /H-MIG[\s\S]{0,2000}migrationReviewPath/m.test(skillContent),
    'T6: H-MIG block must reference migrationReviewPath in its output so the operator knows which artefact was checked'
  );
});

// ---------------------------------------------------------------------------
// T7 — H-MIG does not appear when hasMigrationTrack is false (AC4)
// ---------------------------------------------------------------------------
test('T7: H-MIG is conditional — only fires when hasMigrationTrack is true', function() {
  assert.ok(
    /H-MIG[\s\S]{0,400}hasMigrationTrack.*true|H-MIG[\s\S]{0,400}(only when|skip.*hasMigrationTrack)/im.test(skillContent) ||
    /H-MIG[\s\S]{0,600}false.*skip|H-MIG[\s\S]{0,600}absent.*skip/im.test(skillContent) ||
    (/H-MIG/.test(skillContent) && /hasMigrationTrack.*false|false.*hasMigrationTrack/im.test(skillContent) && /skip/im.test(skillContent)),
    'T7: H-MIG must be documented as conditional on hasMigrationTrack: true; absent/false = skip'
  );
});

// ---------------------------------------------------------------------------
// T8 — H-MIG skipped when hasMigrationTrack absent; existing blocks unaffected (AC4)
// ---------------------------------------------------------------------------
test('T8: H-MIG docs say it is skipped when hasMigrationTrack is absent', function() {
  assert.ok(
    /H-MIG[\s\S]{0,600}(absent|not set|missing)/im.test(skillContent) ||
    (/H-MIG/.test(skillContent) && /hasMigrationTrack.*absent|absent.*hasMigrationTrack/im.test(skillContent)),
    'T8: H-MIG docs must state the block is skipped when hasMigrationTrack is absent'
  );
});

// ---------------------------------------------------------------------------
// T9 — H-MIG FAIL for breaking migration without CI rollback evidence (AC5)
// ---------------------------------------------------------------------------
test('T9: H-MIG specifies FAIL for breaking migration without CI-tier rollback execution evidence', function() {
  assert.ok(
    /H-MIG[\s\S]{0,3000}breaking[\s\S]{0,600}(CI.tier|CI tier|rollback evidence|rollback.*evidence)/im.test(skillContent) ||
    /H-MIG[\s\S]{0,3000}rollback.*evidence[\s\S]{0,400}breaking/im.test(skillContent) ||
    (/H-MIG/.test(skillContent) && /breaking/i.test(skillContent) && /CI.tier.*rollback|rollback.*CI.tier/i.test(skillContent)),
    'T9: H-MIG must specify that breaking migrations require CI-tier rollback execution evidence, and FAIL without it'
  );
});

// ---------------------------------------------------------------------------
// NFR — H-MIG FAIL text names expected artefact path and field(s) (Audit NFR)
// ---------------------------------------------------------------------------
test('NFR: H-MIG FAIL text names the expected migrationReviewPath and missing field(s)', function() {
  assert.ok(
    /H-MIG[\s\S]{0,3000}migrationReviewPath[\s\S]{0,600}FAIL|FAIL[\s\S]{0,400}migrationReviewPath/im.test(skillContent) ||
    (/H-MIG/.test(skillContent) && /migrationReviewPath/i.test(skillContent) && /FAIL/i.test(skillContent)),
    'NFR: H-MIG FAIL message must name the expected migrationReviewPath so operator knows exactly what is missing'
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
