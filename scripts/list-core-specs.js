#!/usr/bin/env node
'use strict';
// lpw-s2 (AC6) -- prints the spec files in lane "core" of tests/e2e/capability-matrix.json, one per line, for the
// `Core browser tests` job. Exits non-zero when none is core, so the job cannot silently run nothing.
//
//   node scripts/list-core-specs.js [path/to/capability-matrix.json]

const fs = require('fs');
const path = require('path');

/** Core-lane files that exist, sorted. `exists` is injectable for tests. */
function listCoreSpecs(matrix, exists) {
  const has = exists || function (f) { return fs.existsSync(path.resolve(__dirname, '..', f)); };
  return ((matrix && matrix.specs) || [])
    .filter(function (e) { return e && e.lane === 'core' && has(e.file); })
    .map(function (e) { return e.file; })
    .sort();
}

if (require.main === module) {
  const file = process.argv[2] || path.resolve(__dirname, '..', 'tests', 'e2e', 'capability-matrix.json');
  let matrix;
  try { matrix = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.error('Cannot read the capability matrix ' + file + ': ' + e.message); process.exit(1); }
  const list = listCoreSpecs(matrix);
  if (list.length === 0) { console.error('No spec has lane "core" in ' + file + '; refusing to run an empty core.'); process.exit(1); }
  process.stdout.write(list.join('\n') + '\n');
}

module.exports = { listCoreSpecs };
