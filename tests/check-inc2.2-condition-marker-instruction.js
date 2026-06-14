// check-inc2.2-condition-marker-instruction.js — unit tests for inc2.2 SKILL.md instruction
// Tests: T1 instruction present, T2 all four fields documented, T3 all three type values,
//        T4 concrete example present, T5 when-to-emit guidance present.

'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('[inc2.2] PASS: ' + label);
    passed++;
  } else {
    console.error('[inc2.2] FAIL: ' + label);
    failed++;
  }
}

const skillMdPath = path.join(__dirname, '../.github/skills/ideate/SKILL.md');
const skillMd = fs.readFileSync(skillMdPath, 'utf8');

// ---------------------------------------------------------------------------
// T1 — AC1: condition marker instruction section is present
// ---------------------------------------------------------------------------
assert('T1: CONDITION-JSON text present in SKILL.md', skillMd.indexOf('CONDITION-JSON') !== -1);
assert('T1: condition marker section heading present', skillMd.indexOf('Condition marker') !== -1 || skillMd.indexOf('Condition markers') !== -1);

// ---------------------------------------------------------------------------
// T2 — AC2: all four fields (id, text, type, source) documented
// ---------------------------------------------------------------------------
assert('T2: field "id" documented', skillMd.indexOf('"id"') !== -1 || skillMd.indexOf('`id`') !== -1);
assert('T2: field "text" documented', skillMd.indexOf('"text"') !== -1 || skillMd.indexOf('`text`') !== -1);
assert('T2: field "type" documented', skillMd.indexOf('"type"') !== -1 || skillMd.indexOf('`type`') !== -1);
assert('T2: field "source" documented', skillMd.indexOf('"source"') !== -1 || skillMd.indexOf('`source`') !== -1);

// ---------------------------------------------------------------------------
// T3 — AC3: all three type values named
// ---------------------------------------------------------------------------
assert('T3: type "constraint" named', skillMd.indexOf('constraint') !== -1);
assert('T3: type "dependency" named', skillMd.indexOf('dependency') !== -1);
assert('T3: type "outcome" named', skillMd.indexOf('outcome') !== -1);

// ---------------------------------------------------------------------------
// T4 — AC4: concrete example present (contains a full ---CONDITION-JSON: ... --- block)
// ---------------------------------------------------------------------------
var exampleRe = /---CONDITION-JSON:\s*\{[^}]+\}---/;
assert('T4: concrete CONDITION-JSON example present in SKILL.md', exampleRe.test(skillMd));

// ---------------------------------------------------------------------------
// T5 — AC5: "when to emit" guidance present
// ---------------------------------------------------------------------------
assert('T5: "when to emit" guidance present', skillMd.toLowerCase().indexOf('when to emit') !== -1);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[inc2.2] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
