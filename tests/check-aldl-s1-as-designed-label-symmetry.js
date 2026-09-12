// check-aldl-s1-as-designed-label-symmetry.js
//
// Tests for aldl-s1: /design and /definition SKILL.md instructions must emit
// diagram titles prefixed "As designed: ", symmetric with csd-s5's as-built
// diagram title convention ("As-built: ") -- closing csd-s2's own
// DoD-recorded AC3 deviation.
//
// Follows the same static-content-assertion pattern as
// tests/check-csd-s3-design-definition-diagram-instructions.js: these tests
// check the SKILL.md instruction TEXT, not a live session simulation,
// matching this story's scope (skill-instruction change only, no
// src/web-ui/ production code touched).
//
// Test names mirror artefacts/2026-09-12-as-designed-label-symmetry/test-plans/aldl-s1-test-plan.md:
//   U1 systemArchitectureFieldDocsInstructPrefix                (AC1)
//   U2 systemArchitectureWorkedExampleShowsPrefix                (AC1, AC4)
//   U3 dataModelFieldDocsInstructPrefix                          (AC2)
//   U4 programDesignFieldDocsInstructPrefix                      (AC3)
//   U5 programDesignWorkedExampleShowsPrefix                     (AC3, AC4)
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log('[aldl-s1] PASS: ' + label);
    passed++;
  } else {
    console.error('[aldl-s1] FAIL: ' + label + (detail ? ' -- ' + detail : ''));
    failed++;
  }
}

const designSkillMdPath     = path.join(__dirname, '../skills/design/SKILL.md');
const definitionSkillMdPath = path.join(__dirname, '../skills/definition/SKILL.md');
const designSkillMd     = fs.readFileSync(designSkillMdPath, 'utf8');
const definitionSkillMd = fs.readFileSync(definitionSkillMdPath, 'utf8');

const CANVAS_MARKER_RE = /---CANVAS-JSON:\s*(\{[\s\S]*?\})\s*---/g;

/** Extract all well-formed CANVAS-JSON marker payload objects from a SKILL.md text blob. */
function extractMarkers(text) {
  var out = [];
  var m;
  CANVAS_MARKER_RE.lastIndex = 0;
  while ((m = CANVAS_MARKER_RE.exec(text)) !== null) {
    try { out.push(JSON.parse(m[1])); } catch (_) { /* skip malformed */ }
  }
  return out;
}

function isRealExample(marker, type) {
  return !!marker && marker.type === type && !!marker.content &&
    typeof marker.content.mermaid === 'string' && marker.content.mermaid.indexOf('<') === -1;
}

// ---------------------------------------------------------------------------
// U1 -- AC1: systemArchitectureFieldDocsInstructPrefix
// ---------------------------------------------------------------------------
(function () {
  assert(
    'U1: design/SKILL.md\'s System Architecture field docs instruct the "As designed: " prefix',
    /title[\s\S]{0,200}As\s+designed:/.test(designSkillMd)
  );
})();

// ---------------------------------------------------------------------------
// U2 -- AC1, AC4: systemArchitectureWorkedExampleShowsPrefix
// ---------------------------------------------------------------------------
(function () {
  var saExample = extractMarkers(designSkillMd).find(function (m) { return isRealExample(m, 'system-architecture'); });
  assert('U2: a well-formed system-architecture worked example is present', !!saExample);
  assert(
    'U2: the worked example\'s own title carries the "As designed: " prefix',
    !!saExample && typeof saExample.title === 'string' && saExample.title.indexOf('As designed: ') === 0
  );
})();

// ---------------------------------------------------------------------------
// U3 -- AC2: dataModelFieldDocsInstructPrefix
// ---------------------------------------------------------------------------
(function () {
  var dataModelSectionIdx = designSkillMd.indexOf('## Data Model diagram markers');
  var afterSection = dataModelSectionIdx !== -1 ? designSkillMd.slice(dataModelSectionIdx) : '';
  assert(
    'U3: design/SKILL.md\'s Data Model field docs instruct the "As designed: " prefix',
    /title[\s\S]{0,200}As\s+designed:/.test(afterSection)
  );
})();

// ---------------------------------------------------------------------------
// U4 -- AC3: programDesignFieldDocsInstructPrefix
// ---------------------------------------------------------------------------
(function () {
  var progDesignSectionIdx = definitionSkillMd.indexOf('## Canvas markers — Program Design diagram');
  var afterSection = progDesignSectionIdx !== -1 ? definitionSkillMd.slice(progDesignSectionIdx) : '';
  assert(
    'U4: definition/SKILL.md\'s Program Design field docs instruct the "As designed: " prefix',
    /title[\s\S]{0,200}As\s+designed:/.test(afterSection)
  );
})();

// ---------------------------------------------------------------------------
// U5 -- AC3, AC4: programDesignWorkedExampleShowsPrefix
// ---------------------------------------------------------------------------
(function () {
  var pdExample = extractMarkers(definitionSkillMd).find(function (m) { return isRealExample(m, 'program-design'); });
  assert('U5: a well-formed program-design worked example is present', !!pdExample);
  assert(
    'U5: the worked example\'s own title carries the "As designed: " prefix',
    !!pdExample && typeof pdExample.title === 'string' && pdExample.title.indexOf('As designed: ') === 0
  );
})();

console.log('\n[aldl-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
