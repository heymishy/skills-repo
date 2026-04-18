#!/usr/bin/env node
/**
 * check-governance-sync.js
 *
 * Validates that DEFAULT_GOVERNANCE_GATES in pipeline-viz.html exactly matches
 * the gate IDs (in order) defined in .github/governance-gates.yml.
 *
 * Run:  node .github/scripts/check-governance-sync.js
 * Used: .git/hooks/pre-commit (alongside check-viz-syntax.js)
 *
 * Zero external dependencies — plain Node.js fs + regex only.
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const root     = path.join(__dirname, '..', '..');
const ymlPath  = path.join(root, '.github', 'governance-gates.yml');
const vizPath  = path.join(root, 'dashboards', 'pipeline-viz.html');

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract gate IDs from governance-gates.yml.
 * Reads only the `gates:` block (stops at `metaSkills:`).
 * Matches lines of the form:  `  - id: <value>`
 */
function ymlGateIds(content) {
  const ids = [];
  let inGates = false;
  for (const line of content.split('\n')) {
    const trimmed = line.trimStart();
    if (/^gates:/.test(trimmed))      { inGates = true;  continue; }
    if (/^metaSkills:/.test(trimmed)) { inGates = false; continue; }
    if (inGates) {
      const m = line.match(/^\s+-\s+id:\s+(\S+)/);
      if (m) ids.push(m[1]);
    }
  }
  return ids;
}

/**
 * Extract gate IDs from the DEFAULT_GOVERNANCE_GATES constant in pipeline-viz.html.
 * Expects the form:  { id: 'some-id', ... }
 */
function vizGateIds(content) {
  const match = content.match(/const DEFAULT_GOVERNANCE_GATES\s*=\s*\[([\s\S]*?)\n\];/);
  if (!match) return null;
  const block = match[1];
  const ids = [];
  for (const m of block.matchAll(/\bid:\s*'([^']+)'/g)) {
    ids.push(m[1]);
  }
  return ids;
}

// ── main ──────────────────────────────────────────────────────────────────────

if (!fs.existsSync(ymlPath)) {
  process.stderr.write('[governance-sync] governance-gates.yml not found at .github/governance-gates.yml\n');
  process.exit(1);
}

const ymlContent = fs.readFileSync(ymlPath,  'utf8');
const vizContent = fs.readFileSync(vizPath,  'utf8');

const fromYml = ymlGateIds(ymlContent);
const fromViz = vizGateIds(vizContent);

if (!fromViz) {
  process.stderr.write('[governance-sync] Could not find DEFAULT_GOVERNANCE_GATES constant in pipeline-viz.html\n');
  process.exit(1);
}

let errors = 0;

const missing = fromYml.filter(id => !fromViz.includes(id));
const extra   = fromViz.filter(id => !fromYml.includes(id));

if (missing.length) {
  process.stderr.write(
    '[governance-sync] Gate(s) in governance-gates.yml but MISSING from viz DEFAULT_GOVERNANCE_GATES: ' +
    missing.join(', ') + '\n'
  );
  errors++;
}
if (extra.length) {
  process.stderr.write(
    '[governance-sync] Gate(s) in viz DEFAULT_GOVERNANCE_GATES but MISSING from governance-gates.yml: ' +
    extra.join(', ') + '\n'
  );
  errors++;
}
if (!missing.length && !extra.length && fromYml.join(',') !== fromViz.join(',')) {
  process.stderr.write(
    '[governance-sync] Gate ORDER mismatch.\n' +
    '  governance-gates.yml order: ' + fromYml.join(', ') + '\n' +
    '  pipeline-viz.html order:    ' + fromViz.join(', ') + '\n'
  );
  errors++;
}

if (errors === 0) {
  process.stdout.write('[governance-sync] ' + fromYml.length + ' gate(s) in sync \u2713\n');
  process.exit(0);
} else {
  process.stderr.write(
    '[governance-sync] ' + errors + ' error(s) found.\n' +
    'Update governance-gates.yml AND DEFAULT_GOVERNANCE_GATES in pipeline-viz.html in the same commit.\n\n'
  );
  process.exit(1);
}
