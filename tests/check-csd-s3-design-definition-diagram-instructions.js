// check-csd-s3-design-definition-diagram-instructions.js
//
// Tests for csd-s3: /design and /definition SKILL.md instructions must emit
// `system-architecture` and `program-design` CANVAS-JSON diagram content-blocks
// using csd-s2's existing rendering mechanism (ADR-026 -- no parallel path).
//
// Follows the same static-content-assertion pattern as
// tests/check-inc5-canvas-skill-instruction.js: these tests check the SKILL.md
// instruction TEXT, not a live session simulation, matching this story's scope
// (skill-instruction change only, no src/web-ui/ production code touched).
//
// NOTE: SKILL.md prose in this repo is hard-wrapped at ~80 columns (unlike
// artefacts/, which forbids hard-wrapping). Every multi-word phrase regex
// below uses \s+ between words rather than a literal space, so a match is not
// broken by an incidental line-wrap landing between two words.
//
// Test names mirror artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s3-test-plan.md:
//   U1 systemArchitectureSectionCompletionProducesDiagramBlock      (AC1)
//   U2 programDesignSectionCompletionProducesDiagramBlock           (AC2)
//   U3 diagramSetGeneratedOnceForFirstStoryOfAFeature                (AC3)
//   U4 diagramSetRefreshedNotDuplicatedForSecondStoryOfSameFeature   (AC3)
//   I1 diagramBlockSavedAsPartOfDorArtefactAlongsideProse            (AC1, AC2)
//   I2 featureGranularityHoldsAcrossAThreeStoryFeature               (AC3)
'use strict';

const fs   = require('fs');
const path = require('path');

const { parseCanvasBlock } = require('../src/web-ui/routes/skills.js');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log('[csd-s3] PASS: ' + label);
    passed++;
  } else {
    console.error('[csd-s3] FAIL: ' + label + (detail ? ' -- ' + detail : ''));
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

/** A crude but real mermaid-syntax sanity check: must open with a known diagram
 *  keyword and contain at least one connection/arrow -- matches the shape used
 *  by csd-s2's own hand-authored fixtures (tests/fixtures/csd-s2/*.js), which
 *  are all `flowchart` diagrams with `-->` connections. */
function looksLikeValidMermaid(src) {
  if (typeof src !== 'string' || src.length === 0) { return false; }
  var hasKeyword = /^(flowchart|graph|sequenceDiagram|erDiagram)\b/.test(src.trim());
  var hasConnection = /-->|->>|--\|>|\.\.>/.test(src);
  return hasKeyword && hasConnection;
}

/** A real worked example (not the `<placeholder>` format line) never contains
 *  an angle bracket inside its mermaid source. */
function isRealExample(marker, type) {
  return !!marker && marker.type === type && !!marker.content &&
    typeof marker.content.mermaid === 'string' && marker.content.mermaid.indexOf('<') === -1;
}

// ---------------------------------------------------------------------------
// U1 -- AC1: systemArchitectureSectionCompletionProducesDiagramBlock
// ---------------------------------------------------------------------------
(function () {
  var solutionArchIdx = designSkillMd.indexOf('## Step 2 — Solution architecture');
  var step3Idx = designSkillMd.indexOf('## Step 3');
  var sysArchMarkerIdx = designSkillMd.indexOf('"type":"system-architecture"');
  assert('U1: design/SKILL.md documents "Step 2 — Solution architecture"', solutionArchIdx !== -1);
  assert('U1: design/SKILL.md documents a system-architecture CANVAS-JSON marker', sysArchMarkerIdx !== -1);
  // Checked structurally (marker falls within the Step 2 section, before Step 3
  // begins) rather than by raw character distance -- a fixed-count threshold
  // breaks whenever a sibling section (e.g. csd-s4's Data Model marker docs)
  // also lives inside Step 2, pushing this marker further from the heading
  // while it remains correctly placed inside Step 2, just later in it.
  assert(
    'U1: system-architecture marker instruction is documented within the Step 2 section',
    solutionArchIdx !== -1 && step3Idx !== -1 && sysArchMarkerIdx !== -1 &&
      sysArchMarkerIdx > solutionArchIdx && sysArchMarkerIdx < step3Idx
  );

  var saExample = extractMarkers(designSkillMd).find(function (m) { return isRealExample(m, 'system-architecture'); });
  assert('U1: at least one well-formed system-architecture worked example is present (excluding the placeholder format line)', !!saExample);
  assert(
    'U1: the worked example content.mermaid is syntactically plausible mermaid',
    !!saExample && looksLikeValidMermaid(saExample.content.mermaid)
  );

  // Shape must match what parseCanvasBlock (src/web-ui/routes/skills.js, csd-s2)
  // actually accepts -- not an invented parallel shape (ADR-026).
  if (saExample) {
    var rawMarkerText = '---CANVAS-JSON: ' + JSON.stringify(saExample) + '---';
    var parsed = parseCanvasBlock(rawMarkerText);
    assert(
      'U1: the worked example is accepted by the real parseCanvasBlock (csd-s2 dispatch)',
      parsed !== null && parsed.type === 'system-architecture'
    );
  } else {
    assert('U1: the worked example is accepted by the real parseCanvasBlock (csd-s2 dispatch)', false, 'no example to test');
  }
})();

// ---------------------------------------------------------------------------
// U2 -- AC2: programDesignSectionCompletionProducesDiagramBlock
// ---------------------------------------------------------------------------
(function () {
  var epicStoryIdx = definitionSkillMd.indexOf('## Step 4 — Story decomposition');
  var progDesignMarkerIdx = definitionSkillMd.indexOf('"type":"program-design"');
  assert('U2: definition/SKILL.md documents "Step 4 — Story decomposition" (epic/story sequencing)', epicStoryIdx !== -1);
  assert('U2: definition/SKILL.md documents a program-design CANVAS-JSON marker', progDesignMarkerIdx !== -1);
  assert(
    'U2: program-design marker instruction is tied to (appears after) the epic/story sequencing step',
    epicStoryIdx !== -1 && progDesignMarkerIdx !== -1 && progDesignMarkerIdx > epicStoryIdx
  );

  var pdExample = extractMarkers(definitionSkillMd).find(function (m) { return isRealExample(m, 'program-design'); });
  assert('U2: at least one well-formed program-design worked example is present (excluding the placeholder format line)', !!pdExample);
  assert(
    'U2: the worked example content.mermaid is syntactically plausible mermaid',
    !!pdExample && looksLikeValidMermaid(pdExample.content.mermaid)
  );

  if (pdExample) {
    var rawMarkerText = '---CANVAS-JSON: ' + JSON.stringify(pdExample) + '---';
    var parsed = parseCanvasBlock(rawMarkerText);
    assert(
      'U2: the worked example is accepted by the real parseCanvasBlock (csd-s2 dispatch)',
      parsed !== null && parsed.type === 'program-design'
    );
  } else {
    assert('U2: the worked example is accepted by the real parseCanvasBlock (csd-s2 dispatch)', false, 'no example to test');
  }
})();

// ---------------------------------------------------------------------------
// U3 -- AC3: diagramSetGeneratedOnceForFirstStoryOfAFeature
// ---------------------------------------------------------------------------
(function () {
  var featureGranularityRe = /feature\s+granularity\s+by\s+default/i;
  assert('U3: design/SKILL.md states feature granularity is the default', featureGranularityRe.test(designSkillMd));
  assert('U3: definition/SKILL.md states feature granularity is the default', featureGranularityRe.test(definitionSkillMd));

  // "generated once for the first story" == the diagram set is created when it
  // does not yet exist -- documented as the "already exists" / else-branch logic.
  var designFirstRunRe = /design\.md`?\s+already\s+exists\s+for\s+this\s+feature\s+slug/i;
  var definitionFirstRunRe = /program-design`?\s+marker\s+already\s+exists/i;
  assert('U3: design/SKILL.md distinguishes first-run (no design.md yet) from later runs', designFirstRunRe.test(designSkillMd));
  assert('U3: definition/SKILL.md distinguishes first-run (no marker yet) from later runs', definitionFirstRunRe.test(definitionSkillMd));
})();

// ---------------------------------------------------------------------------
// U4 -- AC3 (edge case): diagramSetRefreshedNotDuplicatedForSecondStoryOfSameFeature
// ---------------------------------------------------------------------------
(function () {
  var refreshInPlaceRe = /refresh[^.]{0,80}?marker\s+in\s*\n?\s*place/i;
  var notDuplicateRe = /rather\s+than\s+appending\s+a[\s\S]{0,20}second,\s*duplicate\s+marker/i;
  assert('U3/U4: design/SKILL.md instructs refreshing the existing marker in place', refreshInPlaceRe.test(designSkillMd));
  assert('U3/U4: design/SKILL.md instructs NOT duplicating the marker', notDuplicateRe.test(designSkillMd));
  assert('U3/U4: definition/SKILL.md instructs refreshing the existing marker in place', refreshInPlaceRe.test(definitionSkillMd));
  assert('U3/U4: definition/SKILL.md instructs NOT duplicating the marker', notDuplicateRe.test(definitionSkillMd));

  // The "not per-story" contrast must be explicit, not merely implied.
  var notPerStoryRe = /not\s+one\s+per\s+story/i;
  assert('U4: design/SKILL.md explicitly contrasts feature vs per-story granularity', notPerStoryRe.test(designSkillMd));
  assert('U4: definition/SKILL.md explicitly contrasts feature vs per-story granularity', notPerStoryRe.test(definitionSkillMd));
})();

// ---------------------------------------------------------------------------
// I1 -- AC1, AC2: diagramBlockSavedAsPartOfDorArtefactAlongsideProse
// ---------------------------------------------------------------------------
(function () {
  // The new marker guidance must be ADDED alongside existing prose-producing
  // steps, not replace them -- non-regression: every pre-existing step/section
  // title in each file must still be present after csd-s3's edit.
  var designMustStillHave = [
    '## Step 1 — Orient from prior artefacts',
    '## Step 2 — Solution architecture',
    '## Step 3 — UX / interaction design',
    '## Step 4 — Decisions and open questions',
    '## Artefact format',
  ];
  designMustStillHave.forEach(function (needle) {
    assert('I1: design/SKILL.md still contains pre-existing section "' + needle + '" (non-regression)', designSkillMd.indexOf(needle) !== -1);
  });

  var definitionMustStillHave = [
    '## Step 2 - Choose a slicing strategy',
    '## Step 3 — Epic structure',
    '## Step 4 — Story decomposition',
    '## Step 4a — Regulated constraint propagation check',
  ];
  definitionMustStillHave.forEach(function (needle) {
    assert('I1: definition/SKILL.md still contains pre-existing section "' + needle + '" (non-regression)', definitionSkillMd.indexOf(needle) !== -1);
  });

  // The marker instructions must say the diagram is embedded "alongside" / "as
  // part of" the existing artefact rather than replacing it or living in a
  // brand-new, disconnected file.
  assert(
    'I1: design/SKILL.md documents the marker is embedded inside design.md (not a separate artefact)',
    /embedded\s+in[\s\S]{0,10}design\.md/i.test(designSkillMd) || /design\.md['’]s\s+Solution\s+Architecture[\s\S]{0,10}Overview\s+section/i.test(designSkillMd)
  );
  assert(
    'I1: definition/SKILL.md documents the marker is saved inside an epic artefact (not a separate artefact)',
    /epics\/\[first-epic-slug\]\.md/i.test(definitionSkillMd)
  );
})();

// ---------------------------------------------------------------------------
// I2 -- AC3: featureGranularityHoldsAcrossAThreeStoryFeature
// ---------------------------------------------------------------------------
(function () {
  // The granularity rule must generalise to N stories/epics, not just "story
  // two" -- i.e. it must not hardcode a story count, and must explicitly cover
  // the multi-epic case (the harder case for a 3+ story feature spanning more
  // than one epic).
  var multiEpicRe = /even\s+when\s+the\s*\n?\s*feature\s+has\s+multiple\s+epics/i;
  assert('I2: definition/SKILL.md explicitly covers the multi-epic case (generalises beyond 2 stories)', multiEpicRe.test(definitionSkillMd));

  var noHardcodedStoryCount = !/exactly\s+(two|2)\s+stories/i.test(definitionSkillMd) && !/exactly\s+(two|2)\s+stories/i.test(designSkillMd);
  assert('I2: granularity rule does not hardcode a fixed story count', noHardcodedStoryCount);

  // "second or third story" language proves the refresh rule is iterative, not
  // a one-shot special case for story #2 only.
  assert('I2: definition/SKILL.md refresh rule covers arbitrary later stories ("second or third story")', /second\s+or\s+third\s+story/i.test(definitionSkillMd));
})();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[csd-s3] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
