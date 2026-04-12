#!/usr/bin/env node
/**
 * validate-squad-file.js
 *
 * Validates fleet/squads/{id}.json files against the fleet squad schema.
 * Used as a pre-commit or CI check to reject squad files with missing fields.
 *
 * Usage:
 *   node scripts/validate-squad-file.js fleet/squads/my-squad.json
 *   node scripts/validate-squad-file.js fleet/squads/  (validates all *.json in dir)
 *
 * Exits 0 if all files are valid; exits 1 if any file fails validation.
 * Descriptive error messages name each missing field.
 *
 * ADR-003: validates against $defs.fleetSquad in pipeline-state.schema.json
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { validateSquadFile } = require('./fleet-aggregator');

const target = process.argv[2];
if (!target) {
  process.stderr.write('Usage: validate-squad-file.js <file-or-directory>\n');
  process.exit(1);
}

const abs = path.resolve(target);
let files = [];

if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
  files = fs.readdirSync(abs)
    .filter(function(f) { return f.endsWith('.json'); })
    .map(function(f) { return path.join(abs, f); });
} else {
  files = [abs];
}

let hasError = false;
for (const filePath of files) {
  let squad;
  try {
    squad = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    process.stderr.write('ERROR: cannot parse ' + filePath + ': ' + err.message + '\n');
    hasError = true;
    continue;
  }
  const result = validateSquadFile(squad);
  if (result.valid) {
    process.stdout.write('OK: ' + filePath + '\n');
  } else {
    process.stderr.write('INVALID: ' + filePath + '\n');
    result.errors.forEach(function(e) { process.stderr.write('  - ' + e + '\n'); });
    hasError = true;
  }
}

process.exit(hasError ? 1 : 0);
