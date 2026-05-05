#!/usr/bin/env node
/**
 * check-test-registration.js
 *
 * Governance check: every `tests/check-*.js` file MUST be registered in
 * the `package.json` `scripts.test` chain. Unregistered test files are
 * invisible to CI and produce false confidence — tests exist and pass
 * locally but are never run on PRs.
 *
 * Root cause that created this check (D38): dsq story check scripts were
 * written as part of implementation but not wired into package.json.
 * CI "Run assurance gate" showed SUCCESS because existing tests passed;
 * no check verified that every test file was actually in the chain.
 *
 * Run:  node tests/check-test-registration.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path) only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root        = path.join(__dirname, '..');
const pkgPath     = path.join(root, 'package.json');
const testsDir    = path.join(root, 'tests');

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed  = 0;
let failed  = 0;
const failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

// ── Load inputs ───────────────────────────────────────────────────────────────

const pkg      = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const testCmd  = pkg.scripts && pkg.scripts.test ? pkg.scripts.test : '';

// Load pending test files (pre-committed TDD stubs awaiting their feature branch merge).
// These are exempt from registration — they are intentionally failing on master and
// must not be added to package.json until their feature branch merges.
const deferredPath = path.join(root, 'known-deferred-checks.json');
const pendingFiles = new Set(
  fs.existsSync(deferredPath)
    ? (JSON.parse(fs.readFileSync(deferredPath, 'utf8')).pendingTestFiles || []).map(e => path.basename(e.file))
    : []
);

const checkFiles = fs.readdirSync(testsDir)
  .filter(f => f.startsWith('check-') && f.endsWith('.js'))
  .sort();

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('[check-test-registration] Verifying all tests/check-*.js files are wired into npm test\n');

for (const file of checkFiles) {
  const expected = 'node tests/' + file;
  if (pendingFiles.has(file)) {
    process.stdout.write('  \u23ed ' + file + ' [PENDING — pre-committed TDD stub, not yet in test chain]\n');
    continue;
  }
  if (testCmd.includes(expected)) {
    pass(file + ' — registered in npm test chain');
  } else {
    fail(
      file + ' — NOT registered in npm test chain',
      'Add "' + expected + '" to the test chain in package.json scripts.test'
    );
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n[check-test-registration] Results: ' + passed + ' passed, ' + failed + ' failed');

if (failures.length > 0) {
  console.log('\nUnregistered test files (' + failures.length + '):');
  for (const f of failures) {
    console.log('  - ' + f.name);
  }
  console.log('\nFix: add each missing entry to package.json scripts.test, e.g.:');
  console.log('  ... && node tests/<filename>');
  process.exit(1);
}
