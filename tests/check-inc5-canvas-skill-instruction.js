// check-inc5-canvas-skill-instruction.js — unit tests for inc5 SKILL.md instruction
// Tests: T1 cluster-tree marker tied to Lens A, T2 table marker tied to Lens D,
//        T3 text marker tied to narrative lens output, T4 schema fields + one
//        well-formed example per type, T5 one-marker-per-lens cadence guidance.
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('[inc5] PASS: ' + label);
    passed++;
  } else {
    console.error('[inc5] FAIL: ' + label);
    failed++;
  }
}

const skillMdPath = path.join(__dirname, '../.github/skills/ideate/SKILL.md');
const skillMd = fs.readFileSync(skillMdPath, 'utf8');

// ---------------------------------------------------------------------------
// T1 — AC1: cluster-tree CANVAS-JSON instruction tied to Lens A
// ---------------------------------------------------------------------------
var lensAIdx = skillMd.indexOf('Lens A');
var clusterTreeIdx = skillMd.indexOf('cluster-tree');
assert('T1: "Lens A" present in SKILL.md', lensAIdx !== -1);
assert('T1: "cluster-tree" present in SKILL.md', clusterTreeIdx !== -1);
assert(
  'T1: cluster-tree instruction appears within 1500 chars of a Lens A reference',
  lensAIdx !== -1 && clusterTreeIdx !== -1 && Math.abs(clusterTreeIdx - lensAIdx) < 1500
);

// ---------------------------------------------------------------------------
// T2 — AC2: table CANVAS-JSON instruction tied to Lens D
// ---------------------------------------------------------------------------
var lensDIdx = skillMd.indexOf('Lens D');
var tableTypeRe = /"type"\s*:\s*"table"|`table`|"table"/;
var tableMatch = tableTypeRe.exec(skillMd);
assert('T2: "Lens D" present in SKILL.md', lensDIdx !== -1);
assert('T2: "table" type referenced in SKILL.md', !!tableMatch);
assert(
  'T2: table instruction appears within 1500 chars of a Lens D reference',
  lensDIdx !== -1 && !!tableMatch && Math.abs(tableMatch.index - lensDIdx) < 1500
);

// ---------------------------------------------------------------------------
// T3 — AC3: text CANVAS-JSON instruction for narrative lens output
// ---------------------------------------------------------------------------
var textTypeRe = /"type"\s*:\s*"text"|`text`\s*type/;
assert('T3: "text" type referenced in SKILL.md', textTypeRe.test(skillMd));
assert(
  'T3: text-type instruction scoped to narrative/prose output',
  /narrative|prose/i.test(skillMd)
);

// ---------------------------------------------------------------------------
// T4 — AC4: schema fields documented + one well-formed example per type
// ---------------------------------------------------------------------------
assert('T4: field "type" documented', skillMd.indexOf('"type"') !== -1 || skillMd.indexOf('`type`') !== -1);
assert('T4: field "title" documented', skillMd.indexOf('"title"') !== -1 || skillMd.indexOf('`title`') !== -1);
assert('T4: field "content" documented', skillMd.indexOf('"content"') !== -1 || skillMd.indexOf('`content`') !== -1);

var markerRe = /---CANVAS-JSON:\s*\{[^}]+\}---/g;
var markerExamples = skillMd.match(markerRe) || [];
assert('T4: at least 3 well-formed CANVAS-JSON examples present', markerExamples.length >= 3);
assert('T4: one example uses type "cluster-tree"', markerExamples.some(function(m) { return m.indexOf('"cluster-tree"') !== -1; }));
assert('T4: one example uses type "table"', markerExamples.some(function(m) { return m.indexOf('"table"') !== -1; }));
assert('T4: one example uses type "text"', markerExamples.some(function(m) { return m.indexOf('"text"') !== -1; }));

// ---------------------------------------------------------------------------
// T5 — AC6: one-marker-per-lens-output cadence guidance
// ---------------------------------------------------------------------------
var cadenceRe = /exactly one|a single CANVAS-JSON marker|one CANVAS-JSON marker per/i;
assert('T5: one-marker-per-lens cadence guidance present', cadenceRe.test(skillMd));

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[inc5] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
