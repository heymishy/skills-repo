// check-csd-s4-data-model-diagram-instruction.js — unit/integration tests for
// csd-s4's SKILL.md instruction change: /design and /definition emit a
// `data-model` diagram content-block (per the same ---CANVAS-JSON: {...}---
// marker convention csd-s1/csd-s2 already built and render), including the
// ADR-026 reuse-check prompt (AC4).
//
// artefacts/2026-07-25-code-shape-diagrams/stories/csd-s4-design-produces-data-model-diagrams.md
// artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s4-test-plan.md
//
// This is a SKILL.md instruction change, not runtime application code --
// /design and /definition are conversational skill instructions consumed by
// a model, not executable functions. Tests therefore assert on the actual
// instruction text (following the same pattern as
// tests/check-inc5-canvas-skill-instruction.js), plus cross-file
// verification against this repo's real migration files for the
// naming-convention AC (AC3) -- not just presence of a claim, but that the
// worked example's names actually match the real schema.
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    const ok = fn();
    if (ok) {
      console.log('[csd-s4] PASS: ' + name);
      passed++;
    } else {
      console.error('[csd-s4] FAIL: ' + name);
      failed++;
    }
  } catch (e) {
    console.error('[csd-s4] FAIL: ' + name + ' (threw: ' + e.message + ')');
    failed++;
  }
}

const designSkillMdPath     = path.join(__dirname, '../skills/design/SKILL.md');
const definitionSkillMdPath = path.join(__dirname, '../skills/definition/SKILL.md');
const creditsSchemaPath     = path.join(__dirname, '../scripts/migrate-schema-credits.js');

const designSkillMd     = fs.readFileSync(designSkillMdPath, 'utf8');
const definitionSkillMd = fs.readFileSync(definitionSkillMdPath, 'utf8');
const creditsSchema     = fs.readFileSync(creditsSchemaPath, 'utf8');

const combined = designSkillMd + '\n' + definitionSkillMd;

// The instruction prose in these SKILL.md files is hard-wrapped (matching
// this repo's existing skills/*/SKILL.md convention), so a phrase can be
// split across a line break (and this repo's files use CRLF). Normalise
// runs of whitespace to a single space before phrase-matching so wrapping
// doesn't produce false negatives.
function norm(text) {
  return text.replace(/\s+/g, ' ');
}
const combinedNorm  = norm(combined);

// Extract the real credits table's column names from the migration file
// itself, so the naming-convention checks below verify against the actual
// schema, not a hand-copied assumption of what it contains.
const creditsColumnRe = /^\s*(tenant_id|balance|updated_at)\s+/gm;
const realCreditsColumns = [];
let colMatch;
while ((colMatch = creditsColumnRe.exec(creditsSchema)) !== null) {
  realCreditsColumns.push(colMatch[1]);
}

// Bracket-aware CANVAS-JSON marker extraction -- a naive regex like
// /\{[\s\S]*?\}\}---/ breaks on the generic single-brace template line
// ("content":<object>) versus the nested-object worked examples ("content":
// {"mermaid":...}), since the two need a different number of closing braces
// before "---". Walk the actual brace depth instead of guessing a fixed
// brace count.
function markerExamplesIn(text) {
  const results = [];
  const startTag = '---CANVAS-JSON:';
  let searchFrom = 0;
  for (;;) {
    const tagIdx = text.indexOf(startTag, searchFrom);
    if (tagIdx === -1) { break; }
    const braceStart = text.indexOf('{', tagIdx);
    if (braceStart === -1) { break; }
    let depth = 0;
    let i = braceStart;
    for (; i < text.length; i++) {
      if (text[i] === '{') { depth++; }
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) { break; }
      }
    }
    if (depth !== 0) { break; } // unbalanced -- stop rather than mis-scan
    const afterBrace = text.slice(i + 1);
    const dashMatch = /^\s*---/.exec(afterBrace);
    const end = dashMatch ? i + 1 + dashMatch[0].length : i + 1;
    results.push(text.slice(tagIdx, end));
    searchFrom = end;
  }
  return results;
}

// ---------------------------------------------------------------------------
// Test 1 — AC1: proposedSchemaChangeGeneratesDataModelBlock
// Marker format documented in both /design and /definition, using the exact
// type "data-model" the canvas rendering already accepts.
// ---------------------------------------------------------------------------
runTest('proposedSchemaChangeGeneratesDataModelBlock (AC1)', function() {
  const designHasMarker     = /"type"\s*:\s*"data-model"/.test(designSkillMd);
  const definitionHasMarker = /"type"\s*:\s*"data-model"/.test(definitionSkillMd);
  const designHasContentMermaid     = /content["']?\s*:\s*\{?\s*["']?mermaid/i.test(designSkillMd) ||
    /"content"\s*:\s*\{\s*"mermaid"/.test(designSkillMd);
  const definitionHasContentMermaid = /"content"\s*:\s*\{\s*"mermaid"/.test(definitionSkillMd);
  const designWorkedExample     = markerExamplesIn(designSkillMd).some(function(m) { return m.indexOf('"data-model"') !== -1; });
  const definitionWorkedExample = markerExamplesIn(definitionSkillMd).some(function(m) { return m.indexOf('"data-model"') !== -1; });
  // Tied to the "Data and state" question in /design's Step 2 -- checked
  // structurally (marker falls within the Step 2 section, before Step 3
  // begins) rather than by raw character distance from the "Data and
  // state" phrase. A fixed-character-count threshold breaks whenever a
  // sibling section (e.g. csd-s3's System Architecture marker docs) also
  // lives inside Step 2 and pushes this marker further from the phrase --
  // the marker is still correctly placed inside Step 2, just later in it.
  const step2Idx = designSkillMd.indexOf('## Step 2');
  const step3Idx = designSkillMd.indexOf('## Step 3');
  const designMarkerIdx = designSkillMd.indexOf('"type":"data-model"');
  const tiedToDataAndState = step2Idx !== -1 && step3Idx !== -1 && designMarkerIdx !== -1 &&
    designMarkerIdx > step2Idx && designMarkerIdx < step3Idx;
  return designHasMarker && definitionHasMarker &&
    designHasContentMermaid && definitionHasContentMermaid &&
    designWorkedExample && definitionWorkedExample &&
    tiedToDataAndState;
});

// ---------------------------------------------------------------------------
// Test 2 — AC2: existingReusedTableAppearsInDiagramEvenWithoutSchemaChange
// ---------------------------------------------------------------------------
runTest('existingReusedTableAppearsInDiagramEvenWithoutSchemaChange (AC2)', function() {
  const existingEntityGuidance = /existing entit(y|ies).{0,200}(even with no schema change|not just new)/is.test(combinedNorm) ||
    /(even with no schema change|not just new ones).{0,200}existing entit(y|ies)/is.test(combinedNorm);
  const emptyDiagramGuard = /do not draw an empty or new-only diagram|not just an empty diagram/i.test(combinedNorm);
  return existingEntityGuidance && emptyDiagramGuard;
});

// ---------------------------------------------------------------------------
// Test 3 — AC2: diagramOmitsUntouchedUnrelatedTables
// ---------------------------------------------------------------------------
runTest('diagramOmitsUntouchedUnrelatedTables (AC2)', function() {
  return /do not include unrelated (existing )?tables/i.test(combinedNorm) &&
    /only entities genuinely relevant/i.test(combinedNorm);
});

// ---------------------------------------------------------------------------
// Test 4 — AC3: entityNamesMatchRealMigrationFileConvention
// Cross-file check: the worked example's entity name for the real `credits`
// table must appear, and the naming-convention instruction must point at
// the real migration files, not just assert an unverifiable claim.
// ---------------------------------------------------------------------------
runTest('entityNamesMatchRealMigrationFileConvention (AC3)', function() {
  const pointsAtRealMigrationFiles = /scripts\/migrate-schema-\*\.js/.test(combinedNorm);
  const noGenericPlaceholder = /never a generic placeholder/i.test(combinedNorm);
  const creditsEntityInDesignExample     = markerExamplesIn(designSkillMd).some(function(m) { return /CREDITS/.test(m); });
  const creditsEntityInDefinitionExample = markerExamplesIn(definitionSkillMd).some(function(m) { return /CREDITS/.test(m); });
  return pointsAtRealMigrationFiles && noGenericPlaceholder &&
    creditsEntityInDesignExample && creditsEntityInDefinitionExample;
});

// ---------------------------------------------------------------------------
// Test 5 — AC3: diagramColumnNamesMatchRealMigrationFileConvention
// Verifies the worked example's column names for `credits` are the ACTUAL
// column names extracted from scripts/migrate-schema-credits.js -- not a
// paraphrase, not a hand-typed guess that happens to look right.
// ---------------------------------------------------------------------------
runTest('diagramColumnNamesMatchRealMigrationFileConvention (AC3)', function() {
  if (realCreditsColumns.length < 3) { return false; } // sanity: extraction itself must have worked
  const designExamples     = markerExamplesIn(designSkillMd);
  const definitionExamples = markerExamplesIn(definitionSkillMd);
  function exampleHasAllRealColumns(examples) {
    return examples.some(function(m) {
      return realCreditsColumns.every(function(col) { return m.indexOf(col) !== -1; });
    });
  }
  return exampleHasAllRealColumns(designExamples) && exampleHasAllRealColumns(definitionExamples);
});

// ---------------------------------------------------------------------------
// Test 6 — AC4: newEntityTriggersReuseCheckPrompt
// ---------------------------------------------------------------------------
runTest('newEntityTriggersReuseCheckPrompt (AC4)', function() {
  const referencesADR026 = /ADR-026/.test(combinedNorm);
  const explicitQuestion = /Does an existing entity's shape already cover this concept/i.test(combinedNorm);
  const forNewEntitiesOnly = /genuinely NEW entity/i.test(combinedNorm);
  return referencesADR026 && explicitQuestion && forNewEntitiesOnly;
});

// ---------------------------------------------------------------------------
// Test 7 — AC4: existingEntityReuseDoesNotTriggerPromptRedundantly
// ---------------------------------------------------------------------------
runTest('existingEntityReuseDoesNotTriggerPromptRedundantly (AC4)', function() {
  return /do not surface this prompt.{0,220}only reuses existing entities/is.test(combinedNorm);
});

// ---------------------------------------------------------------------------
// Test 8 — Integration: reuseCheckPromptAnsweredNoStillAllowsNewEntityCreation
// The prompt is explicitly documented as non-blocking.
// ---------------------------------------------------------------------------
runTest('reuseCheckPromptAnsweredNoStillAllowsNewEntityCreation (AC4, integration)', function() {
  const nonBlocking = /does not block (diagram creation|story-writing)/i.test(combinedNorm);
  const proceedsWhenNo = /the new entity proceeds and the diagram is finalised/i.test(combinedNorm) ||
    /proceed as designed/i.test(combinedNorm);
  return nonBlocking && proceedsWhenNo;
});

// ---------------------------------------------------------------------------
// Test 9 — NFR: dataModelDiagramShowsStructureOnlyNeverRowData
// ---------------------------------------------------------------------------
runTest('dataModelDiagramShowsStructureOnlyNeverRowData (NFR-security)', function() {
  const structureOnly = /structure only.{0,80}never row-level|never row-level.{0,80}structure only/is.test(combinedNorm);
  const noTenantData = /tenant[- ]specific data|tenant IDs/i.test(combinedNorm);
  return structureOnly && noTenantData;
});

// ---------------------------------------------------------------------------
// Non-regression: /ideate's own canvas-marker section (inc5) and /design's
// and /definition's pre-existing section headings are untouched by this
// change -- csd-s4 only adds new sections, it does not rewrite existing ones.
// ---------------------------------------------------------------------------
runTest('non-regression: existing sections untouched', function() {
  const ideateSkillMd = fs.readFileSync(path.join(__dirname, '../skills/ideate/SKILL.md'), 'utf8');
  const ideateIntact = ideateSkillMd.indexOf('## Canvas markers (inc5)') !== -1 &&
    ideateSkillMd.indexOf('cluster-tree') !== -1;
  const designStep2Intact = designSkillMd.indexOf('## Step 2 — Solution architecture') !== -1;
  const designStep3Intact = designSkillMd.indexOf('## Step 3 — UX / interaction design') !== -1;
  const definitionStep4Intact = definitionSkillMd.indexOf('## Step 4 — Story decomposition') !== -1;
  const definitionStep4aIntact = definitionSkillMd.indexOf('## Step 4a — Regulated constraint propagation check') !== -1;
  return ideateIntact && designStep2Intact && designStep3Intact &&
    definitionStep4Intact && definitionStep4aIntact;
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n[csd-s4] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) { process.exit(1); }
