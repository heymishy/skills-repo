#!/usr/bin/env node
/**
 * check-b2-coverage-mapping-accuracy.js — governance tests for
 * b2-ci-gate-scenario-b-coverage-mapping
 * (artefacts/2026-07-23-e2e-core-journey-coverage/stories/b2-ci-gate-scenario-b-coverage-mapping.md)
 *
 * Covers AC3 and AC4 of this story:
 *
 * AC3 — Given both scenarios are now wired, the coverage-mapping document
 *       (artefacts/2026-07-23-e2e-core-journey-coverage/coverage/spec-to-journey-step-mapping.md)
 *       lists every real user-facing journey step from discovery's MVP Scope
 *       (both Scenario A's 7 steps and Scenario B's 4 steps) — no journey
 *       step left unmapped. This script parses discovery.md's own MVP Scope
 *       section (not a hardcoded count) and the mapping document's own
 *       tables, and asserts the counts match — a real cross-check against
 *       live file content, not a hand-asserted "11 rows" constant.
 *
 * AC4 — Given the coverage mapping document, every AC (Acceptance Criterion)
 *       referenced in the mapping genuinely exists in the named spec file —
 *       the mapping is generated/verified against real code, not
 *       hand-asserted from the story artefacts alone. This script reads
 *       every spec/test file cited in the mapping document and confirms
 *       each cited AC token (e.g. "AC1", "AC3") appears in that file's real
 *       content.
 *
 * No external dependencies — Node.js built-ins only, matching ADR-001's
 * no-external-deps convention for governance check scripts.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DISCOVERY_PATH = path.join(ROOT, 'artefacts', '2026-07-23-e2e-core-journey-coverage', 'discovery.md');
const MAPPING_PATH = path.join(ROOT, 'artefacts', '2026-07-23-e2e-core-journey-coverage', 'coverage', 'spec-to-journey-step-mapping.md');

let passed = 0;
let failed = 0;

function pass(id, msg) {
  console.log('  ✓ ' + id + ' ' + msg);
  passed++;
}

function fail(id, msg) {
  console.error('  ✗ ' + id + ' ' + msg);
  failed++;
}

console.log('\n[check-b2-coverage-mapping-accuracy] Coverage mapping — AC3 (full coverage) + AC4 (real-code cross-check)\n');

const discoveryExists = fs.existsSync(DISCOVERY_PATH);
if (discoveryExists) {
  pass('T0', 'discovery.md exists');
} else {
  fail('T0', 'discovery.md not found at ' + DISCOVERY_PATH);
}

const mappingExists = fs.existsSync(MAPPING_PATH);
if (mappingExists) {
  pass('T0b', 'coverage/spec-to-journey-step-mapping.md exists');
} else {
  fail('T0b', 'coverage/spec-to-journey-step-mapping.md not found at ' + MAPPING_PATH);
}

const discoveryText = discoveryExists ? fs.readFileSync(DISCOVERY_PATH, 'utf8') : '';
const mappingText = mappingExists ? fs.readFileSync(MAPPING_PATH, 'utf8') : '';

/**
 * Extract the numbered list items belonging to a named scenario section from
 * discovery.md's MVP Scope, bounded by the next "**Scenario" heading or the
 * literal "Both scenarios run through" paragraph that follows both lists.
 * @param {string} text
 * @param {string} headingSubstr — e.g. "Scenario A —"
 * @returns {string[]} the numbered item text, in order
 */
function extractDiscoveryScenarioSteps(text, headingSubstr) {
  const startIdx = text.indexOf(headingSubstr);
  if (startIdx === -1) return [];
  const rest = text.slice(startIdx);
  const nextBoundaryMatch = /\n\*\*Scenario [A-Z]|\nBoth scenarios run through/.exec(rest.slice(headingSubstr.length));
  const sectionText = nextBoundaryMatch
    ? rest.slice(0, headingSubstr.length + nextBoundaryMatch.index)
    : rest;
  const items = [];
  const lineRe = /^(\d+)\.\s+(.+)$/gm;
  let m;
  while ((m = lineRe.exec(sectionText)) !== null) {
    items.push(m[2].trim());
  }
  return items;
}

/**
 * Extract mapping-document table rows for a scenario section (identified by
 * its "## Scenario A —" / "## Scenario B —" heading), returning
 * { id, specFile, acCell } for each row.
 * @param {string} text
 * @param {string} headingSubstr
 * @returns {Array<{id: string, specFile: string, acCell: string}>}
 */
function extractMappingRows(text, headingSubstr) {
  const startIdx = text.indexOf(headingSubstr);
  if (startIdx === -1) return [];
  const rest = text.slice(startIdx + headingSubstr.length);
  const nextBoundaryMatch = /\n## /.exec(rest);
  const sectionText = nextBoundaryMatch ? rest.slice(0, nextBoundaryMatch.index) : rest;

  const rows = [];
  const lineRe = /^\|\s*([AB]\d+)\s*\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|\s*$/gm;
  let m;
  while ((m = lineRe.exec(sectionText)) !== null) {
    rows.push({
      id: m[1].trim(),
      journeyStep: m[2].trim(),
      specFile: m[3].trim(),
      acCell: m[4].trim(),
      ciSignal: m[5].trim()
    });
  }
  return rows;
}

// ── AC3 — full coverage: discovery.md's real step count vs. the mapping's real row count ──
console.log('\n[b2] AC3 — every journey step from discovery.md\'s MVP Scope is mapped');

if (discoveryExists) {
  const scenarioASteps = extractDiscoveryScenarioSteps(discoveryText, '**Scenario A —');
  const scenarioBSteps = extractDiscoveryScenarioSteps(discoveryText, '**Scenario B —');

  if (scenarioASteps.length === 7) {
    pass('T1', 'discovery.md\'s MVP Scope lists exactly 7 Scenario A steps (parsed live, not hardcoded): found ' + scenarioASteps.length);
  } else {
    fail('T1', 'discovery.md\'s MVP Scope Scenario A step count changed — expected 7, found ' + scenarioASteps.length + '. The coverage mapping document needs a corresponding update.');
  }

  if (scenarioBSteps.length === 4) {
    pass('T2', 'discovery.md\'s MVP Scope lists exactly 4 Scenario B steps (parsed live, not hardcoded): found ' + scenarioBSteps.length);
  } else {
    fail('T2', 'discovery.md\'s MVP Scope Scenario B step count changed — expected 4, found ' + scenarioBSteps.length + '. The coverage mapping document needs a corresponding update.');
  }

  if (mappingExists) {
    const mappingAScenario = extractMappingRows(mappingText, '## Scenario A —');
    const mappingBScenario = extractMappingRows(mappingText, '## Scenario B —');

    if (mappingAScenario.length === scenarioASteps.length) {
      pass('T3', 'mapping document has ' + mappingAScenario.length + ' Scenario A rows, matching discovery.md\'s ' + scenarioASteps.length + ' real steps');
    } else {
      fail('T3', 'mapping document has ' + mappingAScenario.length + ' Scenario A rows but discovery.md lists ' + scenarioASteps.length + ' real steps — mismatch, a journey step may be unmapped');
    }

    if (mappingBScenario.length === scenarioBSteps.length) {
      pass('T4', 'mapping document has ' + mappingBScenario.length + ' Scenario B rows, matching discovery.md\'s ' + scenarioBSteps.length + ' real steps');
    } else {
      fail('T4', 'mapping document has ' + mappingBScenario.length + ' Scenario B rows but discovery.md lists ' + scenarioBSteps.length + ' real steps — mismatch, a journey step may be unmapped');
    }

    const allRows = mappingAScenario.concat(mappingBScenario);
    const rowsWithEmptyFields = allRows.filter(function (r) {
      return !r.specFile || !r.acCell || r.specFile.length === 0 || r.acCell.length === 0;
    });
    if (rowsWithEmptyFields.length === 0) {
      pass('T5', 'every mapping row (' + allRows.length + ' total) has a non-empty spec file and AC reference cell');
    } else {
      fail('T5', rowsWithEmptyFields.length + ' mapping row(s) have an empty spec file or AC reference cell: ' + JSON.stringify(rowsWithEmptyFields.map(function (r) { return r.id; })));
    }

    // ── AC4 — every cited AC reference genuinely exists in the named spec file ──
    console.log('\n[b2] AC4 — every mapping row\'s AC reference genuinely exists in the named spec/test file');

    let ac4Checked = 0;
    let ac4Failed = 0;
    allRows.forEach(function (row) {
      const fileMatch = /`([^`]+)`/.exec(row.specFile);
      const relPath = fileMatch ? fileMatch[1] : null;
      if (!relPath) {
        fail('T6-' + row.id, 'row ' + row.id + ' has no backtick-quoted file path in its spec file cell: ' + JSON.stringify(row.specFile));
        ac4Failed++;
        return;
      }
      const absPath = path.join(ROOT, relPath);
      if (!fs.existsSync(absPath)) {
        fail('T6-' + row.id, 'row ' + row.id + ' cites ' + relPath + ' but that file does not exist on disk');
        ac4Failed++;
        return;
      }
      const fileContent = fs.readFileSync(absPath, 'utf8');
      const acTokens = (row.acCell.match(/AC\d+/g) || []);
      const uniqueTokens = acTokens.filter(function (t, i) { return acTokens.indexOf(t) === i; });
      if (uniqueTokens.length === 0) {
        fail('T6-' + row.id, 'row ' + row.id + '\'s AC reference cell has no parseable AC token: ' + JSON.stringify(row.acCell));
        ac4Failed++;
        return;
      }
      const missingTokens = uniqueTokens.filter(function (token) {
        const re = new RegExp('\\b' + token + '\\b');
        return !re.test(fileContent);
      });
      ac4Checked++;
      if (missingTokens.length === 0) {
        pass('T6-' + row.id, 'row ' + row.id + ' — ' + uniqueTokens.join(', ') + ' genuinely found in ' + relPath);
      } else {
        fail('T6-' + row.id, 'row ' + row.id + ' cites ' + JSON.stringify(missingTokens) + ' but ' + relPath + ' does not contain ' + (missingTokens.length > 1 ? 'those tokens' : 'that token'));
        ac4Failed++;
      }
    });

    console.log('\n[b2] AC4 cross-check summary: ' + ac4Checked + ' rows checked, ' + ac4Failed + ' failed');
  } else {
    fail('T3', 'cannot compare row counts — mapping document not found');
    fail('T4', 'cannot compare row counts — mapping document not found');
  }
} else {
  fail('T1', 'cannot parse discovery.md — file not found');
  fail('T2', 'cannot parse discovery.md — file not found');
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log('\n[check-b2-coverage-mapping-accuracy] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
