#!/usr/bin/env node
/**
 * check-test-registration.js
 *
 * Governance check: every `tests/check-*.js` and `.github/scripts/check-*.js`
 * file MUST be discoverable by `scripts/run-all-tests.js` (the runner
 * invoked by `npm test`, per pcr-s1). Undiscoverable test files are
 * invisible to CI and produce false confidence — tests exist and pass
 * locally but are never run on PRs.
 *
 * Root cause that created this check (D38): dsq story check scripts were
 * written as part of implementation but not wired into package.json.
 * CI "Run assurance gate" showed SUCCESS because existing tests passed;
 * no check verified that every test file was actually in the chain.
 *
 * pcr-s1 (2026-07-11) replaced package.json's manually-maintained `&&`
 * chain with `scripts/run-all-tests.js`'s dynamic discovery (a fixed
 * grandfather list of non-`check-*.js` files + a glob over `check-*.js`
 * files) — see artefacts/2026-07-11-pipeline-conflict-reduction. This
 * check was rewritten to validate against that discovery mechanism
 * instead of grepping package.json's scripts.test string for a literal
 * filename, since after pcr-s1 that string no longer lists files by name.
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
const ghScriptsDir = path.join(root, '.github', 'scripts');

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed  = 0;
let failed  = 0;
const failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  ✓ ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  process.stdout.write('  ✗ ' + name + '\n');
  process.stdout.write('    → ' + reason + '\n');
}

// ── Load inputs ───────────────────────────────────────────────────────────────

const pkg      = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const testCmd  = pkg.scripts && pkg.scripts.test ? pkg.scripts.test : '';

// Load pending test files (pre-committed TDD stubs awaiting their feature branch merge).
// These are exempt from registration — they are intentionally failing on master and
// must not be added to the discovery mechanism until their feature branch merges.
const deferredPath = path.join(root, 'known-deferred-checks.json');
const pendingFiles = new Set(
  fs.existsSync(deferredPath)
    ? (JSON.parse(fs.readFileSync(deferredPath, 'utf8')).pendingTestFiles || []).map(e => path.basename(e.file))
    : []
);

console.log('[check-test-registration] Verifying all check-*.js files are discoverable by scripts/run-all-tests.js\n');

// ── The chain must delegate to the dynamic discovery runner ──────────────────

if (!testCmd.includes('run-all-tests.js')) {
  fail(
    'scripts.test delegates to scripts/run-all-tests.js',
    'package.json scripts.test no longer invokes scripts/run-all-tests.js — dynamic discovery cannot run'
  );
} else {
  pass('scripts.test delegates to scripts/run-all-tests.js');
}

// ── Every check-*.js file on disk must be covered by getAllTestFiles() ───────

let runner;
try {
  runner = require('../scripts/run-all-tests');
} catch (e) {
  fail('scripts/run-all-tests.js is requireable', 'Failed to require scripts/run-all-tests.js: ' + e.message);
  runner = null;
}

if (runner) {
  const discovered = new Set(
    runner.getAllTestFiles(root).map(f => path.relative(root, f).split(path.sep).join('/'))
  );

  const checkFiles = fs.readdirSync(testsDir)
    .filter(f => f.startsWith('check-') && f.endsWith('.js'))
    .sort()
    .map(f => 'tests/' + f);

  const ghCheckFiles = fs.existsSync(ghScriptsDir)
    ? fs.readdirSync(ghScriptsDir)
        .filter(f => f.startsWith('check-') && f.endsWith('.js'))
        .sort()
        .map(f => '.github/scripts/' + f)
    : [];

  for (const rel of checkFiles.concat(ghCheckFiles)) {
    const basename = path.basename(rel);
    if (pendingFiles.has(basename)) {
      process.stdout.write('  ⏭ ' + rel + ' [PENDING — pre-committed TDD stub, not yet in test chain]\n');
      continue;
    }
    if (discovered.has(rel)) {
      pass(rel + ' — discoverable by scripts/run-all-tests.js');
    } else {
      fail(
        rel + ' — NOT discoverable by scripts/run-all-tests.js',
        'File does not match the check-*.js glob covered by getAllTestFiles(), and is not in GRANDFATHER_LIST. ' +
        'Rename to match tests/check-*.js or .github/scripts/check-*.js, or add to scripts/run-all-tests.js\'s GRANDFATHER_LIST.'
      );
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n[check-test-registration] Results: ' + passed + ' passed, ' + failed + ' failed');

if (failures.length > 0) {
  console.log('\nUndiscoverable test files (' + failures.length + '):');
  for (const f of failures) {
    console.log('  - ' + f.name);
  }
  process.exit(1);
}
