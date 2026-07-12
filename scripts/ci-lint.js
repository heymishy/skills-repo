'use strict';

/**
 * bri-s2.5 - minimal, dependency-free "lint" check for CI.
 * Syntax-checks every .js file under src/ and scripts/ using Node's
 * built-in `--check` flag. No ESLint/config exists in this repo yet (see
 * decisions.md 2026-07-11 SCOPE entry) - this is the smallest real
 * (non-vacuous) check that can fail a PR without adding new tooling.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function collectJsFiles(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const files = [];
  for (const dir of ['src', 'scripts']) {
    collectJsFiles(path.join(repoRoot, dir), files);
  }

  let failures = 0;
  for (const file of files) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
      failures += 1;
      console.error('[ci-lint] syntax error: ' + path.relative(repoRoot, file));
      console.error(err.stderr ? err.stderr.toString() : err.message);
    }
  }

  if (failures > 0) {
    console.error('[ci-lint] ' + failures + ' file(s) failed syntax check');
    process.exit(1);
  }
  console.log('[ci-lint] ' + files.length + ' file(s) OK');
}

if (require.main === module) run();
module.exports = { collectJsFiles, run };
