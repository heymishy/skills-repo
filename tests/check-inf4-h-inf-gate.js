'use strict';
// check-inf4-h-inf-gate.js
// TDD tests for inf.4: H-INF hard block in /definition-of-ready SKILL.md.
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

console.log('\ncheck-inf4-h-inf-gate.js');
console.log('=========================');

// ---------------------------------------------------------------------------
// T1 — DoR SKILL.md contains H-INF block identifier (AC1)
// ---------------------------------------------------------------------------
test('T1: DoR SKILL.md contains H-INF block identifier', function() {
  assert.ok(/H-INF/.test(skillContent),
    'T1: DoR SKILL.md must contain "H-INF" block identifier');
});

// ---------------------------------------------------------------------------
// T2 — H-INF block references hasInfraTrack as the trigger condition (AC1)
// ---------------------------------------------------------------------------
test('T2: H-INF block references hasInfraTrack as trigger condition', function() {
  assert.ok(
    /H-INF[\s\S]{0,800}hasInfraTrack/.test(skillContent) ||
    /hasInfraTrack[\s\S]{0,400}H-INF/.test(skillContent),
    'T2: SKILL.md must reference hasInfraTrack in the H-INF block context'
  );
});

// ---------------------------------------------------------------------------
// T3 — H-INF specifies FAIL when infraPlanPath is absent (AC2)
// ---------------------------------------------------------------------------
test('T3: H-INF specifies FAIL when infraPlanPath is absent or not set', function() {
  assert.ok(
    /H-INF[\s\S]{0,1200}infraPlanPath[\s\S]{0,600}absent|H-INF[\s\S]{0,1200}infraPlanPath[\s\S]{0,600}not set|H-INF[\s\S]{0,1200}infraPlanPath[\s\S]{0,600}missing/im.test(skillContent) ||
    /infraPlanPath[\s\S]{0,600}absent[\s\S]{0,400}H-INF/im.test(skillContent) ||
    (/H-INF/.test(skillContent) && /infraPlanPath[\s\S]{0,200}FAIL|FAIL[\s\S]{0,200}infraPlanPath/im.test(skillContent)),
    'T3: H-INF block must specify FAIL when infraPlanPath is absent or not set'
  );
});

// ---------------------------------------------------------------------------
// T4 — H-INF specifies FAIL when artefact does not contain PASS status (AC2)
// ---------------------------------------------------------------------------
test('T4: H-INF specifies FAIL when artefact lacks PASS status', function() {
  assert.ok(
    /H-INF[\s\S]{0,2000}[Nn]o.*PASS|H-INF[\s\S]{0,2000}does not contain.*PASS|H-INF[\s\S]{0,2000}without.*PASS|H-INF[\s\S]{0,2000}artefact.*[Ff]ail/m.test(skillContent) ||
    (/H-INF/.test(skillContent) && /Status.*PASS|PASS.*status/im.test(skillContent) && /FAIL/i.test(skillContent)),
    'T4: H-INF block must specify FAIL when the artefact at infraPlanPath does not contain a PASS status'
  );
});

// ---------------------------------------------------------------------------
// T5 — H-INF specifies PASS when artefact contains PASS status (AC3)
// ---------------------------------------------------------------------------
test('T5: H-INF specifies PASS when artefact contains Status: PASS', function() {
  assert.ok(
    /H-INF[\s\S]{0,2000}PASS.*artefact|H-INF[\s\S]{0,2000}artefact.*PASS|H-INF[\s\S]{0,2000}Status.*PASS/m.test(skillContent) ||
    (/H-INF/.test(skillContent) && /Status: PASS|Status:\s*PASS|\*\*Status: PASS\*\*/i.test(skillContent)),
    'T5: H-INF block must specify PASS when artefact at infraPlanPath contains a PASS status line'
  );
});

// ---------------------------------------------------------------------------
// T6 — H-INF PASS/FAIL output references the artefact path (AC3, Audit NFR)
// ---------------------------------------------------------------------------
test('T6: H-INF output references the infra-plan artefact path', function() {
  assert.ok(
    /H-INF[\s\S]{0,2000}infraPlanPath/m.test(skillContent),
    'T6: H-INF block must reference infraPlanPath in its output (PASS or FAIL) so the operator knows which artefact was checked'
  );
});

// ---------------------------------------------------------------------------
// T7 — H-INF does not appear when hasInfraTrack is false (AC4)
// ---------------------------------------------------------------------------
test('T7: H-INF is conditional — only fires when hasInfraTrack is true', function() {
  assert.ok(
    /H-INF[\s\S]{0,400}hasInfraTrack.*true|H-INF[\s\S]{0,400}only when.*hasInfraTrack|H-INF[\s\S]{0,400}skip.*hasInfraTrack|hasInfraTrack.*false[\s\S]{0,600}skip[\s\S]{0,600}H-INF/im.test(skillContent) ||
    /H-INF[\s\S]{0,600}absent.*false.*skip|H-INF[\s\S]{0,600}false.*absent.*skip/im.test(skillContent) ||
    (/H-INF/.test(skillContent) && /hasInfraTrack.*false|false.*hasInfraTrack/im.test(skillContent) && /skip/im.test(skillContent)),
    'T7: H-INF must be documented as conditional on hasInfraTrack: true; absent/false = skip'
  );
});

// ---------------------------------------------------------------------------
// T8 — H-INF absent when hasInfraTrack is missing: existing blocks unaffected (AC4)
// ---------------------------------------------------------------------------
test('T8: H-INF docs say it is skipped when hasInfraTrack is absent (existing H1-H9 unaffected)', function() {
  assert.ok(
    /H-INF[\s\S]{0,600}absent|H-INF[\s\S]{0,600}not set|H-INF[\s\S]{0,600}missing/im.test(skillContent) ||
    (/H-INF/.test(skillContent) && /hasInfraTrack.*absent|absent.*hasInfraTrack/im.test(skillContent)),
    'T8: H-INF docs must state the block is skipped when hasInfraTrack is absent (so existing H1-H9 are unaffected)'
  );
});

// ---------------------------------------------------------------------------
// NFR — H-INF FAIL text names the expected artefact path (Audit NFR)
// ---------------------------------------------------------------------------
test('NFR: H-INF FAIL text names the expected infraPlanPath artefact path', function() {
  assert.ok(
    /H-INF[\s\S]{0,3000}infraPlanPath[\s\S]{0,600}FAIL|FAIL[\s\S]{0,400}infraPlanPath/im.test(skillContent) ||
    (/H-INF/.test(skillContent) && /infraPlanPath/i.test(skillContent) && /FAIL/i.test(skillContent)),
    'NFR: H-INF FAIL message must name the expected infraPlanPath so operator knows exactly what is missing'
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
