#!/usr/bin/env node
// check-cli-governance.js — governance structure check for cdg.1 (AC5)
// Verifies bin/skills exists, cli-outer-loop.js exists, and validate is exported.
// Tests FAIL until the implementation files are created. TDD red state.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const BIN    = path.join(ROOT, 'bin', 'skills');
const MODULE = path.join(ROOT, 'src', 'enforcement', 'cli-outer-loop.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

console.log('\n[cli-governance] AC5 — structural governance check');

// G1a — bin/skills exists
assert(fs.existsSync(BIN), 'G1a: AC5 FAIL: bin/skills does not exist');

// G1b — src/enforcement/cli-outer-loop.js exists
assert(fs.existsSync(MODULE), 'G1b: AC5 FAIL: src/enforcement/cli-outer-loop.js does not exist');

// G1c — cli-outer-loop.js exports a function named `validate`
{
  let validateExported = false;
  if (fs.existsSync(MODULE)) {
    try {
      delete require.cache[require.resolve(MODULE)];
      const mod = require(MODULE);
      validateExported = typeof mod.validate === 'function';
    } catch (_) {}
  }
  assert(validateExported, "G1c: AC5 FAIL: src/enforcement/cli-outer-loop.js does not export a function named 'validate'");
}

console.log(`\n=== check-cli-governance results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
